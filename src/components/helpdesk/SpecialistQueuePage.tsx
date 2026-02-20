import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageSquare,
  UserPlus,
  Play,
  Eye,
  Settings,
  LayoutList,
  Table as TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket, TicketStatus } from '@/types/helpdeskNew';
import { ViewTicket } from './ViewTicket';
import { TicketAge } from './TicketAge';
import { helpdeskService } from '@/services/helpdeskService';
import { toast } from 'sonner';

interface ITSpecialist {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  team: string;
  status: string;
}

interface SpecialistQueuePageProps {
  queueType: string; // Can be either SpecialistQueue or request type (subCategory)
  tickets: HelpdeskTicket[];
  currentSpecialistId: string; // This should be employeeId (e.g., "IT003"), not MongoDB _id
  currentSpecialistName: string;
  onAssignToSelf: (ticketId: string) => Promise<void>;
  onAssignToSpecialist?: (ticketId: string, specialistId: string, specialistName: string) => Promise<void>;
  onUpdateProgress: (ticketId: string, progress: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed', notes?: string) => Promise<void>;
  onCompleteWork: (ticketId: string, resolutionNotes: string) => Promise<void>;
  onSendMessage: (ticketId: string, message: string) => Promise<void>;
  onPauseTicket?: (ticketId: string, reason?: string) => Promise<void>;
  onResumeTicket?: (ticketId: string) => Promise<void>;
  onCloseTicket?: (ticketId: string, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

interface AssignmentDialogData {
  ticket: HelpdeskTicket;
}

interface ProgressDialogData {
  ticket: HelpdeskTicket;
  action: 'start' | 'pause' | 'complete';
}

export function SpecialistQueuePage({
  queueType,
  tickets,
  currentSpecialistId,
  currentSpecialistName,
  onAssignToSelf,
  onAssignToSpecialist,
  onUpdateProgress,
  onCompleteWork,
  onSendMessage,
  onPauseTicket,
  onResumeTicket,
  onCloseTicket,
  isLoading = false,
}: SpecialistQueuePageProps) {
  // Session storage keys
  const STORAGE_KEY_PREFIX = `specialist-queue-${queueType}`;
  
  // Initialize filters from session storage
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}-status`);
    return saved ? JSON.parse(saved) : [];
  });
  const [urgencyFilter, setUrgencyFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}-urgency`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [assignmentDialog, setAssignmentDialog] = useState<AssignmentDialogData | null>(null);
  const [progressDialog, setProgressDialog] = useState<ProgressDialogData | null>(null);
  const [progressNotes, setProgressNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [availableSpecialists, setAvailableSpecialists] = useState<ITSpecialist[]>([]);
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<'self'>('self');

  // Persist filters to session storage
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}-status`, JSON.stringify(statusFilter));
  }, [statusFilter, STORAGE_KEY_PREFIX]);

  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}-urgency`, JSON.stringify(urgencyFilter));
  }, [urgencyFilter, STORAGE_KEY_PREFIX]);

  // Load specialists when assignment dialog opens
  useEffect(() => {
    const loadSpecialists = async () => {
      if (assignmentDialog && onAssignToSpecialist) {
        const ticket = assignmentDialog.ticket;
        const specialization = ticket.subCategory;

        if (specialization) {
          const specialists = await helpdeskService.getSpecialistsBySpecialization(specialization);
          setAvailableSpecialists(specialists);
        }
      }
    };

    loadSpecialists();
  }, [assignmentDialog, onAssignToSpecialist]);

  // Sync selectedTicket with updated data from tickets array
  useEffect(() => {
    if (selectedTicket) {
      // Find the updated version of the currently selected ticket
      const updatedTicket = tickets.find(
        (t) => t.id === selectedTicket.id || t._id === selectedTicket._id
      );

      // If found and different (check critical fields including conversation), update the selectedTicket state
      if (updatedTicket && (
        updatedTicket.status !== selectedTicket.status ||
        updatedTicket.assignment?.assignedToId !== selectedTicket.assignment?.assignedToId ||
        updatedTicket.updatedAt !== selectedTicket.updatedAt ||
        updatedTicket.conversation?.length !== selectedTicket.conversation?.length
      )) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets, selectedTicket]);


  // Filter tickets for this queue/request type
  const queueTickets = useMemo(() => {
    // Determine if we're filtering by specialist queue or by request type (subCategory)
    const isRequestTypeFilter = [
      // IT Request Types
      'Hardware',
      'Software',
      'Network / Connectivity',
      'Account / Login Problem',
      'Access Request',
      'New Equipment Request',
      'Other',
      // Facilities Request Types
      'Maintenance Request',
      'Repair Request',
      'Cleaning',
      'Electrical Issue',
      'AC Temperature Issue',
      'Plumbing',
      'Furniture',
      // Finance Request Types
      'Payroll Question',
      'Expense Reimbursement Issue',
      'Invoice / Payment Issue',
      'Purchase Order Request',
      'Vendor Setup or Update',
      'Budget or Account Inquiry'
    ].includes(queueType);

    return tickets.filter((ticket) => {
      let matchesQueueOrType = false;

      if (isRequestTypeFilter) {
        // Filter by subCategory (request type)
        matchesQueueOrType = ticket.subCategory === queueType;

        // For legacy tickets without subCategory, show them in "Hardware"
        const isLegacyTicket = !ticket.subCategory && ticket.highLevelCategory === 'IT' && queueType === 'Hardware';
        matchesQueueOrType = matchesQueueOrType || isLegacyTicket;
      } else {
        // Filter by specialist queue (original behavior)
        const ticketQueue =
          ticket.processing?.specialistQueue ||
          ticket.processing?.queue ||
          ticket.processingRoute?.specialistQueue ||
          ticket.processingRoute?.queue ||
          ticket.assignment?.queue;

        matchesQueueOrType = ticketQueue === queueType;

        // For legacy tickets without queue assignment, show them in Hardware Team queue as default
        const isLegacyTicket = !ticketQueue && ticket.highLevelCategory === 'IT' && queueType === 'Hardware Team';
        matchesQueueOrType = matchesQueueOrType || isLegacyTicket;
      }

      if (!matchesQueueOrType) return false;

      // Status must include active statuses and completed/closed statuses for historical reference
      // Also support legacy statuses: 'Open' and 'In Progress' from old system
      const validStatuses: TicketStatus[] = [
        'In Queue', 'Assigned', 'In Progress', 'Paused', 'On Hold',
        'Work Completed', 'Completed - Awaiting IT Closure',
        'Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Cancelled'
      ];
      const legacyStatuses = ['Open', 'open']; // Legacy ticket statuses

      const hasValidStatus = validStatuses.includes(ticket.status);
      const hasLegacyStatus = legacyStatuses.includes(ticket.status as string);

      if (!hasValidStatus && !hasLegacyStatus) return false;

      // Apply filters
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter.length === 0 || statusFilter.includes(ticket.status);
      const matchesUrgency = urgencyFilter.length === 0 || urgencyFilter.includes(ticket.urgency);

      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [tickets, queueType, searchQuery, statusFilter, urgencyFilter]);

  // Separate into my tickets and unassigned
  const myAssignedTickets = useMemo(() => {
    return queueTickets.filter(
      (ticket) => ticket.assignment?.assignedToId === currentSpecialistId
    );
  }, [queueTickets, currentSpecialistId]);

  // Further separate into active and completed
  const myActiveTickets = useMemo(() => {
    return myAssignedTickets.filter(t =>
      !['Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Cancelled'].includes(t.status)
    );
  }, [myAssignedTickets]);

  // Completed tickets assigned to the current specialist only (not all completed tickets)
  const myCompletedTickets = useMemo(() => {
    return myAssignedTickets.filter(t =>
      ['Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Work Completed', 'Completed - Awaiting IT Closure', 'Cancelled'].includes(t.status)
    );
  }, [myAssignedTickets]);

  const unassignedTickets = useMemo(() => {
    return queueTickets.filter((ticket) => {
      // Exclude cancelled, closed, and completed tickets from available queue
      const terminalStatuses = ['Cancelled', 'Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Work Completed', 'Completed - Awaiting IT Closure', 'Rejected'];
      if (terminalStatuses.includes(ticket.status)) return false;

      // A ticket is "available" if:
      // 1. It has status 'In Queue' (not yet assigned to anyone)
      // 2. OR it's not assigned to anyone (no assignedToId)
      // 3. AND it's not already assigned to the current specialist
      const isInQueue = ticket.status === 'In Queue';
      const hasNoAssignment = !ticket.assignment?.assignedToId;
      const notAssignedToCurrentUser = ticket.assignment?.assignedToId !== currentSpecialistId;
      
      return (isInQueue || hasNoAssignment) && notAssignedToCurrentUser;
    });
  }, [queueTickets, currentSpecialistId]);

  // Sort by urgency and SLA
  const sortTickets = (ticketList: HelpdeskTicket[]) => {
    const urgencyOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return [...ticketList].sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      
      // Sort by SLA (earlier deadline first)
      if (a.sla?.processingDeadline && b.sla?.processingDeadline) {
        return new Date(a.sla.processingDeadline).getTime() - new Date(b.sla.processingDeadline).getTime();
      }
      
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  };

  const handleAssignToSelf = async () => {
    if (!assignmentDialog) return;

    setIsSubmitting(true);
    try {
      if (selectedSpecialistId === 'self') {
        // Assign to self (current user)
        await onAssignToSelf(assignmentDialog.ticket.id);
      } else if (onAssignToSpecialist) {
        // Assign to selected specialist
        const specialist = availableSpecialists.find(s => s.id === selectedSpecialistId);
        if (specialist) {
          await onAssignToSpecialist(
            assignmentDialog.ticket.id,
            specialist.id,
            specialist.name
          );
        }
      }
      setAssignmentDialog(null);
      setSelectedSpecialistId('self');
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressAction = async () => {
    if (!progressDialog) return;

    setIsSubmitting(true);
    try {
      const { ticket, action } = progressDialog;

      if (action === 'start') {
        await onUpdateProgress(ticket.id, 'In Progress', progressNotes || undefined);
      } else if (action === 'pause') {
        await onUpdateProgress(ticket.id, 'On Hold', progressNotes || undefined);
      } else if (action === 'complete') {
        if (!resolutionNotes.trim()) {
          alert('Resolution notes are required');
          return;
        }
        await onCompleteWork(ticket.id, resolutionNotes);
      }

      setProgressDialog(null);
      setProgressNotes('');
      setResolutionNotes('');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (ticket: HelpdeskTicket) => {
    setSelectedTicket(ticket);
  };

  const handleCloseTicketView = () => {
    setSelectedTicket(null);
  };

  const getStatusColor = (status: TicketStatus): string => {
    const statusLower = String(status).toLowerCase();

    switch (status) {
      case 'In Queue':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Assigned':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Paused':
      case 'On Hold':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Work Completed':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
      case 'Completed - Awaiting IT Closure':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        // Handle legacy statuses
        if (statusLower === 'open') {
          return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        }
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    const urgencyLower = urgency.toLowerCase();
    switch (urgencyLower) {
      case 'critical':
        return 'badge-urgency-critical';
      case 'high':
        return 'badge-urgency-high';
      case 'medium':
        return 'badge-urgency-medium';
      case 'low':
        return 'badge-urgency-low';
      default:
        return 'badge-urgency-low';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSLACountdown = (deadline: string): { text: string; color: string } => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 0) {
      return { text: 'Overdue', color: 'text-red-600 dark:text-red-400' };
    } else if (diffInHours < 4) {
      return { text: `${Math.round(diffInHours)}h remaining`, color: 'text-red-600 dark:text-red-400' };
    } else if (diffInHours < 24) {
      return { text: `${Math.round(diffInHours)}h remaining`, color: 'text-orange-600 dark:text-orange-400' };
    } else {
      const days = Math.round(diffInHours / 24);
      return { text: `${days}d remaining`, color: 'text-brand-slate dark:text-gray-400' };
    }
  };

  const getSlaUrgencyLevel = (deadline?: string): 'overdue' | 'urgent' | 'warning' | null => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 0 || diffInHours < 4) {
      return 'overdue';
    } else if (diffInHours < 24) {
      return 'urgent';
    } else if (diffInHours < 48) {
      return 'warning';
    }

    return null;
  };

  const getTicketProgress = (ticket: HelpdeskTicket): number => {
    const status = ticket.status;
    
    // Closed/Completed statuses
    if (status === 'Closed' || status === 'Auto-Closed' || status === 'Confirmed' || status === 'Work Completed' || status === 'Completed' || status === 'Completed - Awaiting IT Closure') {
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
    
    if (status === 'Pending Approval' || String(status).includes('Pending Approval')) {
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

  const renderTicketCard = (ticket: HelpdeskTicket, showActions = true) => {
    const slaInfo = ticket.sla?.processingDeadline
      ? getSLACountdown(ticket.sla.processingDeadline)
      : null;

    const slaUrgency = getSlaUrgencyLevel(ticket.sla?.processingDeadline);
    const progress = getTicketProgress(ticket);

    // Check if this is a legacy ticket
    const isLegacyTicket = !ticket.processing?.specialistQueue && !ticket.assignment?.queue;

    return (
      <Card
        key={ticket.id}
        className={cn(
          "hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 rounded-lg overflow-visible relative",
          slaUrgency === 'overdue' && "border-l-4 border-l-red-500",
          slaUrgency === 'urgent' && "border-l-4 border-l-orange-500",
          slaUrgency === 'warning' && "border-l-4 border-l-yellow-500",
          isLegacyTicket && "border-l-4 border-l-amber-500"
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
              
              {/* Ticket ID, Category, Request Type, Urgency, Messages - All in one row */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-brand-slate dark:text-gray-400 font-mono">
                  {ticket.ticketNumber}
                </span>
                <span className="text-brand-slate dark:text-gray-400">·</span>
                <Badge variant="custom" className={cn('text-xs px-2 py-0.5', getUrgencyColor(ticket.urgency))}>
                  {ticket.urgency}
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
                <div className="w-8 h-8 rounded-full bg-brand-green/10 dark:bg-brand-green/20 flex items-center justify-center text-xs font-semibold text-brand-green">
                  {getInitials(ticket.requesterName || ticket.userName || 'U')}
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
              {/* SLA Urgency Icon */}
              {slaUrgency && slaInfo && (
                <div className="relative group">
                  <div className={cn(
                    "h-9 w-9 flex items-center justify-center rounded-md",
                    slaUrgency === 'overdue' && "bg-red-50 dark:bg-red-900/20",
                    slaUrgency === 'urgent' && "bg-orange-50 dark:bg-orange-900/20",
                    slaUrgency === 'warning' && "bg-yellow-50 dark:bg-yellow-900/20"
                  )}>
                    <Clock className={cn(
                      "h-4 w-4",
                      slaUrgency === 'overdue' && "text-red-600 dark:text-red-400",
                      slaUrgency === 'urgent' && "text-orange-600 dark:text-orange-400",
                      slaUrgency === 'warning' && "text-yellow-600 dark:text-yellow-400"
                    )} />
                  </div>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {slaInfo.text}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {showActions && (
                <>
                  {!ticket.assignment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 hover:bg-brand-green/10 dark:hover:bg-brand-green/20 text-brand-green"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAssignmentDialog({ ticket });
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  )}

                  {ticket.assignment?.assignedToId === currentSpecialistId && (
                    <>
                      {ticket.status === 'Assigned' && (
                        <Button
                          size="sm"
                          className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgressDialog({ ticket, action: 'start' });
                          }}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}

                      {ticket.status === 'In Progress' && (
                        <Button
                          size="sm"
                          className="h-9 px-3 bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgressDialog({ ticket, action: 'complete' });
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </>
                  )}

                  {/* View Icon */}
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
                </>
              )}
            </div>

          </div>
        </CardContent>
      </Card>
    );
  };

  const getQueueTitle = (): string => {
    return queueType.replace(/_/g, ' ');
  };

  const renderTicketsTable = (ticketsList: HelpdeskTicket[], showActions = true) => {
    if (ticketsList.length === 0) return null;

    return (
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
                  Request Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                  Urgency
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
                {showActions && (
                  <th className="px-4 py-3 text-center text-xs font-semibold text-brand-navy dark:text-gray-200 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ticketsList.map((ticket) => {
                const slaUrgency = getSlaUrgencyLevel(ticket.sla?.processingDeadline);
                const slaInfo = ticket.sla?.processingDeadline ? getSLACountdown(ticket.sla.processingDeadline) : null;
                const progress = getTicketProgress(ticket);
                const isLegacyTicket = !ticket.processing?.specialistQueue && !ticket.assignment?.queue;

                return (
                  <tr
                    key={ticket.id}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      slaUrgency === 'overdue' && "border-l-4 border-l-red-500",
                      slaUrgency === 'urgent' && "border-l-4 border-l-orange-500",
                      slaUrgency === 'warning' && "border-l-4 border-l-yellow-500",
                      isLegacyTicket && "border-l-4 border-l-amber-500"
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

                    {/* Request Type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs text-brand-slate dark:text-gray-400">
                        {ticket.subCategory}
                      </span>
                    </td>

                    {/* Urgency */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="custom" className={cn('text-xs px-2 py-0.5', getUrgencyColor(ticket.urgency))}>
                        {ticket.urgency}
                      </Badge>
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
                        {slaUrgency && slaInfo && (
                          <Badge
                            className={cn(
                              'text-xs flex items-center gap-1 w-fit transition-colors cursor-pointer',
                              slaUrgency === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
                              slaUrgency === 'urgent' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
                              slaUrgency === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            {slaInfo.text}
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
                    {showActions && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {!ticket.assignment && (
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignmentDialog({ ticket });
                              }}
                              size="sm"
                              variant="outline"
                              className="h-8 px-2"
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                          {ticket.assignment?.assignedToId === currentSpecialistId && (
                            <>
                              {ticket.status === 'Assigned' && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProgressDialog({ ticket, action: 'start' });
                                  }}
                                  size="sm"
                                  className="h-8 px-2 bg-green-600 hover:bg-green-700"
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </Button>
                              )}
                              {ticket.status === 'In Progress' && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProgressDialog({ ticket, action: 'complete' });
                                  }}
                                  size="sm"
                                  className="h-8 px-2 bg-teal-600 hover:bg-teal-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(ticket);
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
                <Settings className="h-5 w-5 text-brand-green" />
                {getQueueTitle()}
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400">
                Manage tickets in your specialist queue - {queueTickets.length} available
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
              options={[
                { label: 'In Queue', value: 'In Queue' },
                { label: 'Assigned', value: 'Assigned' },
                { label: 'In Progress', value: 'In Progress' },
                { label: 'Paused', value: 'Paused' },
                { label: 'Confirmed', value: 'Confirmed' },
                { label: 'Closed', value: 'Closed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Filter by status"
              className="w-[220px]"
            />

            {/* Urgency Filter */}
            <MultiSelect
              options={[
                { label: 'Critical', value: 'Critical' },
                { label: 'High', value: 'High' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Low', value: 'Low' },
              ]}
              selected={urgencyFilter}
              onChange={setUrgencyFilter}
              placeholder="Filter by urgency"
              className="w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* My Tickets Section with Tabs */}
      {(myAssignedTickets.length > 0 || myCompletedTickets.length > 0) && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'completed')} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-100 flex items-center gap-2">
              <User className="h-5 w-5 text-brand-green" />
              My Tickets
            </h3>
            <TabsList>
              <TabsTrigger value="active">Active ({myActiveTickets.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({myCompletedTickets.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0">
            {myActiveTickets.length > 0 ? (
              viewMode === 'list' ? (
                <div className="space-y-3">
                  {sortTickets(myActiveTickets).map((ticket) => renderTicketCard(ticket, true))}
                </div>
              ) : (
                renderTicketsTable(sortTickets(myActiveTickets), true)
              )
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No active tickets assigned to you</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {myCompletedTickets.length > 0 ? (
              renderTicketsTable(sortTickets(myCompletedTickets), true)
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No completed tickets</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Unassigned Tickets Section */}
      <div>
        <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-100 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          Available Tickets ({unassignedTickets.length})
        </h3>
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center items-center gap-2">
                <div className="h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                <span className="text-brand-slate dark:text-gray-400">Loading tickets...</span>
              </div>
            </CardContent>
          </Card>
        ) : unassignedTickets.length === 0 ? (
          <Card className="border-brand-light-gray dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <CheckCircle2 className="h-16 w-16 text-brand-green/30 dark:text-brand-green/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-200 mb-2">
                  {searchQuery || statusFilter !== 'All' || urgencyFilter !== 'All'
                    ? 'No Tickets Match Your Filters'
                    : 'Queue is Clear!'}
                </h3>
                <p className="text-sm text-brand-slate dark:text-gray-400 mb-4">
                  {searchQuery || statusFilter !== 'All' || urgencyFilter !== 'All'
                    ? 'Try adjusting your search terms or filters to see more tickets. You can clear filters to view all unassigned tickets.'
                    : 'There are no unassigned tickets in this queue at the moment. New tickets will appear here when they are routed to your queue.'}
                </p>
                {(searchQuery || statusFilter !== 'All' || urgencyFilter !== 'All') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setUrgencyFilter('All');
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
          <div className="space-y-3">
            {sortTickets(unassignedTickets).map((ticket) => renderTicketCard(ticket, true))}
          </div>
        ) : (
          renderTicketsTable(sortTickets(unassignedTickets), true)
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={!!assignmentDialog} onOpenChange={() => {
        setAssignmentDialog(null);
        setSelectedSpecialistId('self');
      }}>
        <DialogContent>
          {assignmentDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-brand-navy dark:text-gray-100">
                  Assign Ticket
                </DialogTitle>
                <DialogDescription className="text-brand-slate dark:text-gray-400">
                  {assignmentDialog.ticket.ticketNumber} - {assignmentDialog.ticket.subject}
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {onAssignToSpecialist && availableSpecialists.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialist">Select Specialist</Label>
                      <Select
                        value={selectedSpecialistId}
                        onValueChange={setSelectedSpecialistId}
                      >
                        <SelectTrigger id="specialist">
                          <SelectValue placeholder="Choose a specialist" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Assign to Me ({currentSpecialistName})</span>
                            </div>
                          </SelectItem>
                          {availableSpecialists.map((specialist) => (
                            <SelectItem key={specialist.id} value={specialist.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{specialist.name}</span>
                                <span className="text-xs text-muted-foreground">{specialist.team}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-sm text-brand-slate dark:text-gray-400">
                      Select a specialist based on their expertise to handle this ticket.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-brand-slate dark:text-gray-400">
                    You will be assigned as the specialist responsible for resolving this ticket.
                    Are you sure you want to proceed?
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAssignmentDialog(null);
                    setSelectedSpecialistId('self');
                  }} 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignToSelf} disabled={isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={!!progressDialog} onOpenChange={() => setProgressDialog(null)}>
        <DialogContent>
          {progressDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-brand-navy dark:text-gray-100">
                  {progressDialog.action === 'start' && 'Start Working'}
                  {progressDialog.action === 'pause' && 'Pause Work'}
                  {progressDialog.action === 'complete' && 'Complete Work'}
                </DialogTitle>
                <DialogDescription className="text-brand-slate dark:text-gray-400">
                  {progressDialog.ticket.ticketNumber} - {progressDialog.ticket.subject}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {progressDialog.action === 'complete' ? (
                  <div className="space-y-2">
                    <Label htmlFor="resolutionNotes" className="text-brand-slate dark:text-gray-300">
                      Resolution Notes <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="resolutionNotes"
                      placeholder="Describe how the issue was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={5}
                      className={cn(!resolutionNotes.trim() && 'border-red-300 dark:border-red-700')}
                    />
                    {!resolutionNotes.trim() && (
                      <p className="text-xs text-red-500">Resolution notes are required when completing work</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="progressNotes" className="text-brand-slate dark:text-gray-300">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="progressNotes"
                      placeholder="Add any notes about current progress..."
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setProgressDialog(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProgressAction}
                  disabled={isSubmitting || (progressDialog.action === 'complete' && !resolutionNotes.trim())}
                  className={cn(
                    progressDialog.action === 'start' && 'bg-green-600 hover:bg-green-700',
                    progressDialog.action === 'complete' && 'bg-teal-600 hover:bg-teal-700'
                  )}
                >
                  {isSubmitting ? 'Updating...' : 'Confirm'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ViewTicket Modal */}
      {selectedTicket && (
        <ViewTicket
          ticket={selectedTicket}
          onClose={handleCloseTicketView}
          currentUserName={currentSpecialistName}
          onSendMessage={onSendMessage}
          onAssignToSelf={onAssignToSelf}
          onUpdateProgress={onUpdateProgress}
          onCompleteWork={onCompleteWork}
          onPauseTicket={onPauseTicket}
          onResumeTicket={onResumeTicket}
          onCloseTicket={onCloseTicket}
          showWorkflowActions={true}
          currentUserId={currentSpecialistId}
        />
      )}
    </div>
  );
}
