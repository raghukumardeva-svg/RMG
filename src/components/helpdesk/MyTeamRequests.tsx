import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Calendar,
  User,
  MessageSquare,
  Eye,
  Users,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { HelpdeskTicket, TicketStatus, ApprovalAction } from '@/types/helpdeskNew';
import { ViewTicket } from './ViewTicket';

interface MyTeamRequestsProps {
  tickets: HelpdeskTicket[];
  currentManagerId: string;
  currentManagerName: string;
  currentManagerLevel?: number;
  isLoading?: boolean;
  onSendMessage?: (ticketId: string, message: string) => Promise<void>;
  onApprove?: (ticketId: string, level: number, remarks?: string) => Promise<void>;
  onReject?: (ticketId: string, level: number, remarks: string) => Promise<void>;
}

interface ApprovalDialogData {
  ticket: HelpdeskTicket;
  action: ApprovalAction;
}

export function MyTeamRequests({
  tickets,
  currentManagerId,
  currentManagerName,
  currentManagerLevel = 1,
  isLoading = false,
  onSendMessage,
  onApprove,
  onReject,
}: MyTeamRequestsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All' | 'Pending Approval L1'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogData | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tickets - show only team members' tickets (not manager's own)
  // Also include tickets pending Level 1 approval
  const teamTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Check if ticket needs Level 1 approval from this manager
      const needsApproval = ticket.approvalFlow?.some(
        (a) => a.level === currentManagerLevel && a.status === 'Pending'
      );
      
      // Include if: team member's ticket OR needs approval from this manager
      return ticket.userId !== currentManagerId || needsApproval;
    });
  }, [tickets, currentManagerId, currentManagerLevel]);

  // Separate pending approvals for this manager
  const pendingApprovals = useMemo(() => {
    return teamTickets.filter((ticket) => {
      if (!ticket.approvalFlow || ticket.approvalFlow.length === 0) return false;
      
      const approval = ticket.approvalFlow.find(
        (a) => a.level === currentManagerLevel && a.status === 'Pending'
      );
      
      return approval !== undefined;
    });
  }, [teamTickets, currentManagerLevel]);

  // Get unique statuses from team tickets
  const uniqueStatuses = useMemo(() => {
    const statuses = teamTickets.map(t => t.status);
    return Array.from(new Set(statuses)).sort();
  }, [teamTickets]);

  // Get unique categories from team tickets
  const uniqueCategories = useMemo(() => {
    const categories = teamTickets.map(t => t.highLevelCategory);
    return Array.from(new Set(categories)).sort();
  }, [teamTickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return teamTickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.requesterName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = 
        statusFilter === 'All' || 
        ticket.status === statusFilter ||
        (statusFilter === 'Pending Approval L1' && ticket.status === 'Pending Approval L1');
      const matchesCategory = categoryFilter === 'All' || ticket.highLevelCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [teamTickets, searchQuery, statusFilter, categoryFilter]);

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

  const handleApprovalAction = (ticket: HelpdeskTicket, action: ApprovalAction) => {
    setApprovalDialog({ ticket, action });
    setRemarks('');
  };

  const handleSubmitApproval = async () => {
    if (!approvalDialog || !onApprove || !onReject) return;

    const { ticket, action } = approvalDialog;
    const hasApproval = ticket.approvalFlow?.some(
      (a) => a.level === currentManagerLevel && a.status === 'Pending'
    );

    if (!hasApproval) {
      toast.error('Approval not found or already processed');
      return;
    }

    setIsSubmitting(true);
    try {
      if (action === 'Approve') {
        await onApprove(ticket.id, currentManagerLevel, remarks || undefined);
        toast.success(`Ticket ${ticket.ticketNumber} approved successfully`);
      } else {
        if (!remarks.trim()) {
          toast.error('Remarks are required when rejecting');
          setIsSubmitting(false);
          return;
        }
        await onReject(ticket.id, currentManagerLevel, remarks);
        toast.success(`Ticket ${ticket.ticketNumber} rejected`);
      }
      setApprovalDialog(null);
      setRemarks('');
    } catch (error) {
      console.error('Failed to submit approval:', error);
      toast.error(`Failed to ${action.toLowerCase()} ticket`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const needsApproval = (ticket: HelpdeskTicket): boolean => {
    return ticket.approvalFlow?.some(
      (a) => a.level === currentManagerLevel && a.status === 'Pending'
    ) || false;
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'Submitted':
        return <Clock className="h-4 w-4" />;
      case 'Pending Approval':
        return <AlertCircle className="h-4 w-4" />;
      case 'Approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'In Queue':
        return <Clock className="h-4 w-4" />;
      case 'Assigned':
        return <User className="h-4 w-4" />;
      case 'In Progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'Work Completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Confirmed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'Closed':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TicketStatus): string => {
    const statusStr = status as string;
    switch (statusStr) {
      case 'Submitted':
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
      case 'In Queue':
      case 'Routed':
        return 'badge-status-routed';
      case 'Assigned':
        return 'badge-status-assigned';
      case 'In Progress':
        return 'badge-status-in-progress';
      case 'Paused':
      case 'On Hold':
        return 'badge-status-on-hold';
      case 'Work Completed':
        return 'badge-status-work-completed';
      case 'Completed - Awaiting IT Closure':
        return 'badge-status-awaiting-closure';
      case 'Confirmed':
      case 'Completed':
        return 'badge-status-completed';
      case 'Closed':
      case 'Auto-Closed':
        return '!bg-gray-100 !text-gray-700 dark:!bg-gray-900/30 dark:!text-gray-400 !border-gray-200 dark:!border-gray-800';
      case 'Cancelled':
        return '!bg-red-100 !text-red-700 dark:!bg-red-900/30 dark:!text-red-400 !border-red-200 dark:!border-red-800';
      default:
        return '!bg-gray-100 !text-gray-700 dark:!bg-gray-900/30 dark:!text-gray-400 !border-gray-200 dark:!border-gray-800';
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-green" />
                My Team Requests
                {pendingApprovals.length > 0 && (
                  <Badge className="ml-2 bg-orange-500 text-white">
                    {pendingApprovals.length} Pending Approval{pendingApprovals.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400">
                View and track helpdesk requests submitted by your team members and pending approvals
              </CardDescription>
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
                  placeholder="Search by ticket number, subject, requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TicketStatus | 'All' | 'Pending Approval L1')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {pendingApprovals.length > 0 && (
                  <SelectItem value="Pending Approval L1">
                    Pending Approval L1 ({pendingApprovals.length})
                  </SelectItem>
                )}
                {uniqueStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category} Helpdesk
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center items-center gap-2">
                <div className="h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
                <span className="text-brand-slate dark:text-gray-400">Loading team requests...</span>
              </div>
            </CardContent>
          </Card>
        ) : sortedTickets.length === 0 ? (
          <Card className="border-brand-light-gray dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <Users className="h-16 w-16 text-brand-slate/30 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-200 mb-2">
                  {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                    ? 'No Requests Match Your Filters'
                    : 'No Team Requests Yet'}
                </h3>
                <p className="text-sm text-brand-slate dark:text-gray-400 mb-4">
                  {searchQuery || statusFilter !== 'All' || categoryFilter !== 'All'
                    ? 'Try adjusting your search terms or filters to see more results. You can clear filters to view all team requests.'
                    : 'Your team members haven\'t submitted any helpdesk requests yet. When they do, they will appear here.'}
                </p>
                {(searchQuery || statusFilter !== 'All' || categoryFilter !== 'All') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setCategoryFilter('All');
                    }}
                    className="mt-2"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          sortedTickets.map((ticket) => {
            const requiresApproval = needsApproval(ticket);
            
            return (
            <Card
              key={ticket.id}
              className={cn(
                "hover:shadow-md transition-shadow border-brand-light-gray dark:border-gray-700",
                requiresApproval && "border-l-4 border-l-orange-500"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Ticket Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono text-sm text-brand-slate dark:text-gray-400">
                        {ticket.ticketNumber}
                      </span>
                      <Badge variant="custom" className={cn('text-xs', getStatusColor(ticket.status))}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1">{ticket.status}</span>
                      </Badge>
                      {requiresApproval && (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Needs Your Approval
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {ticket.highLevelCategory}
                      </Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.requesterName || ticket.userName}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-brand-navy dark:text-gray-100 mb-1 truncate">
                      {ticket.subject}
                    </h3>

                    <p className="text-sm text-brand-slate dark:text-gray-400 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-brand-slate dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{ticket.subCategory}</span>
                      </div>
                      {ticket.conversation && ticket.conversation.length > 0 && (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <span>{ticket.conversation.length} messages</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {requiresApproval ? (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprovalAction(ticket, 'Approve');
                          }}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprovalAction(ticket, 'Reject');
                          }}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(ticket);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(ticket);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )})
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={(open) => !open && setApprovalDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog?.action === 'Approve' ? 'Approve' : 'Reject'} Ticket
            </DialogTitle>
            <DialogDescription>
              Ticket: <span className="font-semibold text-brand-navy dark:text-gray-100">{approvalDialog?.ticket.ticketNumber}</span>
              <br />
              Subject: {approvalDialog?.ticket.subject}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remarks">
                Remarks {approvalDialog?.action === 'Reject' && <span className="text-red-500">*</span>}
              </Label>
              <Textarea
                id="remarks"
                placeholder={
                  approvalDialog?.action === 'Approve'
                    ? 'Add any comments (optional)...'
                    : 'Please provide a reason for rejection...'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalDialog(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={isSubmitting}
              className={cn(
                approvalDialog?.action === 'Approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  {approvalDialog?.action === 'Approve' ? (
                    <>
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  ) : (
                    <>
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ViewTicket Modal */}
      {selectedTicket && (
        <ViewTicket
          ticket={selectedTicket}
          onClose={handleCloseTicketView}
          currentUserName={currentManagerName}
          onSendMessage={onSendMessage}
        />
      )}
    </div>
  );
}
