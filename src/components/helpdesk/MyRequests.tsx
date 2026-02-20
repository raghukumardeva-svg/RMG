import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Clock,
  FileText,
  Calendar,
  User,
  MessageSquare,
  Eye,
  LayoutList,
  Table as TableIcon,
  Users,
  MoreVertical,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket, TicketStatus } from '@/types/helpdeskNew';
import { ViewTicket } from './ViewTicket';
import { MyTeamRequests } from './MyTeamRequests';
import { TicketReopen } from './TicketReopen';
import { TicketAge } from './TicketAge';
import { useEmployeeStore } from '@/store/employeeStore';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import { toast } from 'sonner';

interface MyRequestsProps {
  tickets: HelpdeskTicket[];
  currentUserId: string;
  currentUserName: string;
  isLoading?: boolean;
  onSendMessage?: (ticketId: string, message: string) => Promise<void>;
  onConfirmCompletion?: (ticketId: string, feedback?: string) => Promise<void>;
  onReopenTicket?: (ticket: HelpdeskTicket) => void;
  hasTeamRequestAccess?: boolean;
  teamTickets?: HelpdeskTicket[];
}

export function MyRequests({
  tickets,
  currentUserId,
  currentUserName,
  isLoading = false,
  onSendMessage,
  onConfirmCompletion,
  onReopenTicket,
  hasTeamRequestAccess = false,
  teamTickets = [],
}: MyRequestsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('my-requests-status-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [ticketToCancel, setTicketToCancel] = useState<HelpdeskTicket | null>(null);

  const { employees } = useEmployeeStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const { updateStatus } = useHelpdeskStore();

  // Persist status filter to session storage
  useEffect(() => {
    sessionStorage.setItem('my-requests-status-filter', JSON.stringify(statusFilter));
  }, [statusFilter]);

  // Get current user's employee profile for avatar
  const currentUserEmployee = employees.find(emp => emp.name === currentUserName || emp.email === currentUserName);

  // Sync selectedTicket with updated data from tickets array
  useEffect(() => {
    if (selectedTicket) {
      const updatedTicket = tickets.find(
        (t) => t.id === selectedTicket.id || t._id === selectedTicket._id
      );
      // Update if ticket data changed (including conversation)
      if (updatedTicket && (
        updatedTicket.status !== selectedTicket.status ||
        updatedTicket.updatedAt !== selectedTicket.updatedAt ||
        updatedTicket.conversation?.length !== selectedTicket.conversation?.length
      )) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets, selectedTicket]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Get unique statuses from tickets
  const uniqueStatuses = useMemo(() => {
    const statuses = tickets.map(t => t.status);
    return Array.from(new Set(statuses)).sort();
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  // Sort by created date (newest first)
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [filteredTickets]);

  const handleViewDetails = (ticket: HelpdeskTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseTicketView = () => {
    setSelectedTicket(null);
  };

  const toggleMenu = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === ticketId ? null : ticketId);
  };

  const handleMenuAction = (ticket: HelpdeskTicket, action: 'view' | 'cancel', e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    
    if (action === 'view') {
      handleViewDetails(ticket);
    } else if (action === 'cancel') {
      setTicketToCancel(ticket);
    }
  };

  const handleCancelTicket = (ticket: HelpdeskTicket, e: React.MouseEvent) => {
    e.stopPropagation();

    // Only allow cancellation if ticket is in a cancellable state
    if (!canCancelTicket(ticket)) {
      toast.error(getCancelTooltip(ticket));
      return;
    }

    setTicketToCancel(ticket);
  };

  const canCancelTicket = (ticket: HelpdeskTicket): boolean => {
    // Tickets that cannot be cancelled
    const nonCancellableStatuses: TicketStatus[] = [
      'Cancelled',
      'Closed',
      'Auto-Closed',
      'Confirmed',
      'Rejected',
      'Completed',
      'Completed - Awaiting IT Closure'
    ];

    return !nonCancellableStatuses.includes(ticket.status);
  };

  const getCancelTooltip = (ticket: HelpdeskTicket): string => {
    if (!canCancelTicket(ticket)) {
      if (ticket.status === 'Cancelled') return 'Ticket already cancelled';
      if (ticket.status === 'Rejected') return 'Cannot cancel rejected ticket';
      if (['Closed', 'Auto-Closed', 'Confirmed'].includes(ticket.status)) {
        return 'Cannot cancel completed ticket';
      }
      if (ticket.status === 'Completed - Awaiting IT Closure') {
        return 'Cannot cancel - awaiting IT closure';
      }
    }
    return 'Cancel ticket';
  };

  const confirmCancelTicket = async () => {
    if (ticketToCancel) {
      try {
        const ticketId = ticketToCancel._id || ticketToCancel.id;
        // Pass the current user name for audit trail
        await updateStatus(ticketId, 'Cancelled', currentUserName);
        toast.success(`Ticket ${ticketToCancel.ticketNumber} has been cancelled successfully`);
      } catch (error) {
        console.error('Error cancelling ticket:', error);
        toast.error('Failed to cancel ticket. Please try again.');
      } finally {
        setTicketToCancel(null);
      }
    }
  };

  const getStatusColor = (status: TicketStatus | string) => {
    switch (status) {
      case 'Submitted':
      case 'Draft':
        return 'badge-status-submitted';
      case 'Pending Approval':
      case 'Pending Level-1 Approval':
        return 'badge-status-pending-l1';
      case 'Pending Level-2 Approval':
        return 'badge-status-pending-l2';
      case 'Pending Level-3 Approval':
        return 'badge-status-pending-l3';
      case 'Approved':
        return 'badge-status-approved';
      case 'Rejected':
        return 'badge-status-rejected';
      case 'Cancelled':
        return 'badge-status-cancelled';
      case 'Routed':
      case 'In Queue':
        return 'badge-status-routed';
      case 'Assigned':
      case 'In Progress':
        return 'badge-status-in-progress';
      case 'Paused':
      case 'On Hold':
        return 'badge-status-on-hold';
      case 'Work Completed':
      case 'Completed':
      case 'Confirmed':
      case 'Closed':
      case 'Auto-Closed':
        return 'badge-status-completed';
      case 'Completed - Awaiting IT Closure':
        return 'badge-status-awaiting-closure';
      case 'Awaiting User Confirmation':
        return 'badge-status-awaiting-confirmation';
      default:
        return 'badge-status-submitted';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getTicketProgress = (ticket: HelpdeskTicket): number => {
    const status = ticket.status;
    
    // Closed/Completed statuses
    if (status === 'Closed' || status === 'Auto-Closed' || status === 'Confirmed' || status === 'Work Completed') {
      return 100;
    }
    
    // Rejected
    if (status === 'Rejected') {
      return 0;
    }
    
    // In Progress stages
    if (status === 'In Progress') {
      return 75;
    }
    
    if (status === 'Assigned') {
      return 60;
    }
    
    if (status === 'Routed' || status === 'In Queue') {
      return 40;
    }
    
    if (status === 'Approved') {
      return 30;
    }
    
    if (status === 'Pending Approval' || status.includes('Pending Approval')) {
      return 20;
    }
    
    // Submitted
    if (status === 'Submitted') {
      return 10;
    }
    
    return 0;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSlaUrgency = (ticket: HelpdeskTicket): { level: 'overdue' | 'urgent' | 'warning' | 'normal', message: string } | null => {
    if (!ticket.sla) return null;

    // If already overdue
    if (ticket.sla.isOverdue) {
      return {
        level: 'overdue',
        message: `Overdue by ${ticket.sla.overdueBy || 0}h`
      };
    }

    // Calculate time remaining for relevant deadlines
    const now = new Date();
    const deadlines = [];

    // Show approval deadline during approval phase
    if (ticket.sla.approvalDeadline && ticket.status.includes('Approval')) {
      deadlines.push(new Date(ticket.sla.approvalDeadline));
    }

    // Only show processing deadline after ticket is assigned (not during approval)
    // This ensures SLA countdown is only visible once IT Admin assigns the ticket
    const isAssigned = ticket.assignment?.assignedToId || ticket.assignment?.assignedToName;
    const isPostApprovalPhase = !ticket.status.includes('Approval') && !['Rejected', 'Cancelled', 'Closed', 'Auto-Closed', 'Routed', 'In Queue'].includes(ticket.status);
    
    if (ticket.sla.processingDeadline && isAssigned && isPostApprovalPhase) {
      deadlines.push(new Date(ticket.sla.processingDeadline));
    }

    if (deadlines.length === 0) return null;

    // Get the nearest deadline
    const nearestDeadline = deadlines.sort((a, b) => a.getTime() - b.getTime())[0];
    const hoursRemaining = (nearestDeadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      return {
        level: 'overdue',
        message: `Overdue by ${Math.abs(Math.round(hoursRemaining))}h`
      };
    } else if (hoursRemaining < 4) {
      return {
        level: 'urgent',
        message: `${Math.round(hoursRemaining)}h remaining`
      };
    } else if (hoursRemaining < 24) {
      return {
        level: 'warning',
        message: `${Math.round(hoursRemaining)}h remaining`
      };
    }

    return null; // Normal - no indicator needed
  };



  // Content for My Requests
  const myRequestsContent = (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-green" />
                My Requests
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400">
                Track and manage your submitted helpdesk requests
              </CardDescription>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={cn(
                  'gap-2 transition-all',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-navy dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
                    : 'text-brand-slate dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-navy dark:hover:text-gray-100'
                )}
              >
                <LayoutList className="h-4 w-4" />
                List
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn(
                  'gap-2 transition-all',
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-brand-navy dark:text-gray-100 hover:bg-white dark:hover:bg-gray-700'
                    : 'text-brand-slate dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-brand-navy dark:hover:text-gray-100'
                )}
              >
                <TableIcon className="h-4 w-4" />
                Table
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate dark:text-gray-400" />
                <Input
                  placeholder="Search by ticket number, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <MultiSelect
              options={uniqueStatuses.map(status => ({ label: status, value: status }))}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center items-center gap-2">
              <div className="h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              <span className="text-brand-slate dark:text-gray-400">Loading requests...</span>
            </div>
          </CardContent>
        </Card>
      ) : sortedTickets.length === 0 ? (
        <Card className="border-brand-light-gray dark:border-gray-700">
          <CardContent className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <FileText className="h-16 w-16 text-brand-slate/30 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-200 mb-2">
                {searchQuery || statusFilter.length > 0
                  ? 'No Requests Match Your Filters'
                  : 'No Requests Yet'}
              </h3>
              <p className="text-sm text-brand-slate dark:text-gray-400 mb-4">
                {searchQuery || statusFilter.length > 0
                  ? 'Try adjusting your search terms or filters to see more results. You can clear filters to view all your requests.'
                  : 'You haven\'t submitted any helpdesk requests yet. When you create a request, it will appear here for tracking and follow-up.'}
              </p>
              {(searchQuery || statusFilter.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter([]);
                  }}
                  className="mt-2"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* List View - Long Horizontal Card Style */
        <div className="space-y-3">
          {sortedTickets.map((ticket) => {
            const slaUrgency = getSlaUrgency(ticket);
            const progress = getTicketProgress(ticket);

            return (
              <Card
                key={ticket.id}
                className={cn(
                  "hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-visible relative",
                  slaUrgency?.level === 'overdue' && "border-l-4 border-l-red-500",
                  slaUrgency?.level === 'urgent' && "border-l-4 border-l-orange-500",
                  slaUrgency?.level === 'warning' && "border-l-4 border-l-yellow-500"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-6">
                    
                    {/* LEFT INFO SECTION - Primary Details */}
                    <div className="flex-1 min-w-[280px] max-w-[320px]">
                      {/* Title */}
                      <h3 className="font-semibold text-base text-brand-navy dark:text-gray-100 line-clamp-1 mb-1.5">
                        {ticket.subject}
                      </h3>
                      
                      {/* Ticket ID, Category Pill, Request Type, Messages - All in one row */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-brand-slate dark:text-gray-400 font-mono">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-brand-slate dark:text-gray-400">·</span>
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                        >
                          {ticket.highLevelCategory}
                        </Badge>
                        <span className="text-brand-slate dark:text-gray-400">·</span>
                        <span className="text-brand-slate dark:text-gray-400">{ticket.subCategory}</span>
                        {ticket.conversation && ticket.conversation.length > 0 && (
                          <>
                            <span className="text-brand-slate dark:text-gray-400">·</span>
                            <span className="text-brand-slate dark:text-gray-400">
                              {ticket.conversation.length} {ticket.conversation.length === 1 ? 'message' : 'messages'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* META DETAILS SECTION - Center */}
                    <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                      {/* Requester Avatar */}
                      <div className="flex items-center gap-2">
                        {currentUserEmployee?.profilePhoto ? (
                          <img 
                            src={currentUserEmployee.profilePhoto} 
                            alt={currentUserName}
                            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            onError={(e) => {
                              // Fallback to initials if image fails to load
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-xs font-semibold text-brand-green",
                            currentUserEmployee?.profilePhoto && "hidden"
                          )}
                        >
                          {getInitials(currentUserName)}
                        </div>
                      </div>

                      <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>

                      {/* Created Date */}
                      <div className="flex items-center gap-1.5 text-sm text-brand-slate dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>

                    {/* PROGRESS SECTION - Right Center */}
                    <div className="hidden md:flex flex-col gap-1.5 min-w-[140px] flex-shrink-0">
                      {/* Status Badge */}
                      <span className={cn(
                        'inline-flex text-xs w-fit px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer hover:opacity-80',
                        getStatusColor(ticket.status)
                      )}>
                        {ticket.status}
                      </span>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-300 rounded-full",
                              ticket.status === 'Rejected' 
                                ? "bg-red-400" 
                                : progress === 100 
                                  ? "bg-green-500" 
                                  : "bg-blue-500"
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-brand-slate dark:text-gray-400 min-w-[32px] text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>

                    {/* ACTIONS SECTION - Far Right */}
                    <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                      {/* Location/Info Icon (SLA urgency) */}
                      {slaUrgency && (
                        <div className="relative group">
                          <div className={cn(
                            "h-9 w-9 flex items-center justify-center rounded-md",
                            slaUrgency.level === 'overdue' && "bg-red-50 dark:bg-red-900/20",
                            slaUrgency.level === 'urgent' && "bg-orange-50 dark:bg-orange-900/20",
                            slaUrgency.level === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20"
                          )}>
                            <Clock className={cn(
                              "h-4 w-4",
                              slaUrgency.level === 'overdue' && "text-red-600 dark:text-red-400",
                              slaUrgency.level === 'urgent' && "text-orange-600 dark:text-orange-400",
                              slaUrgency.level === 'warning' && "text-yellow-600 dark:text-yellow-400"
                            )} />
                          </div>
                          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {slaUrgency.message}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* View Icon */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(ticket);
                              }}
                            >
                              <Eye className="h-4 w-4 text-brand-slate dark:text-gray-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Reopen Ticket Button (for Closed/Completed tickets - unlimited reopening) */}
                      {(ticket.status === 'Closed' || ticket.status === 'Completed') && (
                        <TicketReopen 
                          ticket={ticket} 
                          onReopen={async () => {
                            // Refresh tickets after reopen
                            toast.success('Refreshing tickets...');
                            window.location.reload();
                          }}
                        />
                      )}

                      {/* Cancel Icon */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-9 w-9 p-0",
                                canCancelTicket(ticket)
                                  ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                                  : "opacity-50 cursor-not-allowed"
                              )}
                              onClick={(e) => handleCancelTicket(ticket, e)}
                              disabled={!canCancelTicket(ticket)}
                            >
                              <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{canCancelTicket(ticket) ? 'Cancel Ticket' : getCancelTooltip(ticket)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-green/5 dark:bg-brand-green/10 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Ticket ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Request Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Request Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Age
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedTickets.map((ticket) => {
                    const slaUrgency = getSlaUrgency(ticket);
                    const progress = getTicketProgress(ticket);
                    const isMenuOpen = openMenuId === ticket.id;

                    return (
                      <tr
                        key={ticket.id}
                        className={cn(
                          "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                          slaUrgency?.level === 'overdue' && "border-l-4 border-l-red-500",
                          slaUrgency?.level === 'urgent' && "border-l-4 border-l-orange-500",
                          slaUrgency?.level === 'warning' && "border-l-4 border-l-yellow-500"
                        )}
                      >
                        {/* Ticket ID */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-brand-navy dark:text-gray-100 font-medium">
                            {ticket.ticketNumber}
                          </span>
                        </td>

                        {/* Request Title */}
                        <td className="px-4 py-4">
                          <div className="max-w-xs">
                            <span className="font-medium text-brand-navy dark:text-gray-100 text-sm line-clamp-1">
                              {ticket.subject}
                            </span>
                            {ticket.conversation && ticket.conversation.length > 0 && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-brand-slate dark:text-gray-400">
                                <MessageSquare className="h-3 w-3" />
                                <span>{ticket.conversation.length} {ticket.conversation.length === 1 ? 'message' : 'messages'}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                          >
                            {ticket.highLevelCategory}
                          </Badge>
                        </td>

                        {/* Request Type */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-xs text-brand-slate dark:text-gray-400">
                            {ticket.subCategory}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              'inline-flex text-xs w-fit px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer hover:opacity-80',
                              getStatusColor(ticket.status)
                            )}>
                              {ticket.status}
                            </span>
                            {slaUrgency && (
                              <Badge
                                className={cn(
                                  'text-xs flex items-center gap-1 w-fit transition-colors cursor-pointer',
                                  slaUrgency.level === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
                                  slaUrgency.level === 'urgent' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
                                  slaUrgency.level === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {slaUrgency.message}
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-300 rounded-full",
                                  ticket.status === 'Rejected' 
                                    ? "bg-red-400" 
                                    : progress === 100 
                                      ? "bg-green-500" 
                                      : "bg-blue-500"
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-brand-slate dark:text-gray-400 min-w-[32px]">
                              {progress}%
                            </span>
                          </div>
                        </td>

                        {/* Age */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <TicketAge createdAt={ticket.createdAt} variant="badge" />
                        </td>

                        {/* Created Date */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs text-brand-slate dark:text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(ticket.createdAt)}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1 relative">
                            {slaUrgency && (
                              <div className="relative group">
                                <div className={cn(
                                  "h-8 w-8 flex items-center justify-center rounded-md cursor-pointer",
                                  slaUrgency.level === 'overdue' && "bg-red-50 dark:bg-red-900/20",
                                  slaUrgency.level === 'urgent' && "bg-orange-50 dark:bg-orange-900/20",
                                  slaUrgency.level === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20"
                                )}>
                                  <Clock className={cn(
                                    "h-3.5 w-3.5",
                                    slaUrgency.level === 'overdue' && "text-red-600 dark:text-red-400",
                                    slaUrgency.level === 'urgent' && "text-orange-600 dark:text-orange-400",
                                    slaUrgency.level === 'warning' && "text-yellow-600 dark:text-yellow-400"
                                  )} />
                                </div>
                                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    {slaUrgency.message}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* View Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewDetails(ticket);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-brand-slate dark:text-gray-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            {/* Reopen Ticket Button (for Closed/Completed tickets - unlimited reopening) */}
                            {(ticket.status === 'Closed' || ticket.status === 'Completed') && (
                              <TicketReopen 
                                ticket={ticket} 
                                onReopen={async () => {
                                  toast.success('Refreshing tickets...');
                                  window.location.reload();
                                }}
                              />
                            )}

                            {/* Cancel Button */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                      "h-8 w-8 p-0",
                                      canCancelTicket(ticket)
                                        ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                                        : "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={(e) => handleCancelTicket(ticket, e)}
                                    disabled={!canCancelTicket(ticket)}
                                  >
                                    <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{canCancelTicket(ticket) ? 'Cancel Ticket' : getCancelTooltip(ticket)}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </Card>
      )}

      {/* ViewTicket Modal */}
      {selectedTicket && (
        <ViewTicket
          ticket={selectedTicket}
          onClose={handleCloseTicketView}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          onSendMessage={onSendMessage}
          onConfirmCompletion={onConfirmCompletion}
          onReopenTicket={onReopenTicket}
        />
      )}

      {/* Cancel Ticket Confirmation Dialog */}
      <AlertDialog open={!!ticketToCancel} onOpenChange={(open) => !open && setTicketToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <X className="h-5 w-5" />
              Cancel Ticket
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div>
                Are you sure you want to cancel ticket <span className="font-semibold text-brand-navy dark:text-gray-100">{ticketToCancel?.ticketNumber}</span>?
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-brand-navy dark:text-gray-100">
                  "{ticketToCancel?.subject}"
                </p>
                <p className="text-xs text-brand-slate dark:text-gray-400 mt-1">
                  Category: {ticketToCancel?.highLevelCategory} • {ticketToCancel?.subCategory}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                  ⚠️ Important
                </p>
                <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 ml-4 list-disc">
                  <li>This action cannot be undone</li>
                  <li>The ticket will be marked as "Cancelled"</li>
                  <li>No further actions will be taken on this request</li>
                  <li>IT team will be notified of the cancellation</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmCancelTicket();
              }}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Yes, Cancel Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  // If user doesn't have team request access, show only My Requests
  if (!hasTeamRequestAccess) {
    return myRequestsContent;
  }

  // If user has team request access, show tabs
  return (
    <Tabs defaultValue="my-requests" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="my-requests" className="gap-2">
          <User className="h-4 w-4" />
          My Requests
        </TabsTrigger>
        <TabsTrigger value="team-requests" className="gap-2">
          <Users className="h-4 w-4" />
          My Team Requests
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-requests" className="space-y-4">
        {myRequestsContent}
      </TabsContent>

      <TabsContent value="team-requests" className="space-y-4">
        <MyTeamRequests
          tickets={teamTickets}
          currentManagerId={currentUserId}
          currentManagerName={currentUserName}
          isLoading={isLoading}
          onSendMessage={onSendMessage}
        />
      </TabsContent>
    </Tabs>
  );
}
