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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Calendar,
  AlertCircle,
  FileText,
  User,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { HelpdeskTicket, ApprovalAction, UrgencyLevel } from '@/types/helpdeskNew';

interface ManagerApprovalsProps {
  tickets: HelpdeskTicket[];
  currentManagerId: string;
  currentManagerName: string;
  currentManagerLevel: 1 | 2 | 3;
  onApprove: (ticketId: string, level: number, remarks?: string) => Promise<void>;
  onReject: (ticketId: string, level: number, remarks: string) => Promise<void>;
  isLoading?: boolean;
}

interface ApprovalDialogData {
  ticket: HelpdeskTicket;
  action: ApprovalAction;
}

export function ManagerApprovals({
  tickets,
  currentManagerId,
  currentManagerName,
  currentManagerLevel,
  onApprove,
  onReject,
  isLoading = false,
}: ManagerApprovalsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 1 | 2 | 3>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [approvalDialog, setApprovalDialog] = useState<ApprovalDialogData | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewDetailsTicket, setViewDetailsTicket] = useState<HelpdeskTicket | null>(null);

  // Filter tickets that need approval from this manager at their level
  const pendingApprovals = useMemo(() => {
    // Validate manager level first
    if (currentManagerLevel < 1 || currentManagerLevel > 3) {
      return [];
    }
    return tickets.filter((ticket) => {
      // Skip cancelled or rejected tickets - they should not be actionable
      if (ticket.status === 'Cancelled' || ticket.status === 'Rejected') {
        return false;
      }

      // Must have approval flow
      if (!ticket.approvalFlow || ticket.approvalFlow.length === 0) return false;

      // Find the approval level for this manager
      const approval = ticket.approvalFlow.find(
        (a) => a.level === currentManagerLevel && a.status === 'Pending'
      );

      if (!approval) return false;

      // If managerId is set in the approval, verify it matches current manager
      // Otherwise show all pending approvals at the manager's level
      if (approval.managerId && approval.managerId !== currentManagerId) {
        return false;
      }

      // Apply filters
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLevel = levelFilter === 'All' || approval.level === levelFilter;
      const matchesCategory =
        categoryFilter === 'All' || ticket.highLevelCategory === categoryFilter;

      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [tickets, currentManagerId, currentManagerLevel, searchQuery, levelFilter, categoryFilter]);

  // Sort by urgency and created date
  const sortedTickets = useMemo(() => {
    const urgencyOrder: Record<UrgencyLevel, number> = {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 3
    };
    return [...pendingApprovals].sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      // Sort older tickets first (earlier dates come first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [pendingApprovals]);

  const handleApprovalAction = (ticket: HelpdeskTicket, action: ApprovalAction) => {
    setApprovalDialog({ ticket, action });
    setRemarks('');
  };

  const handleViewDetails = (ticket: HelpdeskTicket) => {
    setViewDetailsTicket(ticket);
  };

  const handleSubmitApproval = async () => {
    if (!approvalDialog) return;

    const { ticket, action } = approvalDialog;
    // Verify the approval exists for this manager level
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
      toast.error(
        `Failed to ${action.toLowerCase()} ticket: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getApprovalLevel = (ticket: HelpdeskTicket): number | null => {
    const approval = ticket.approvalFlow?.find((a) => a.level === currentManagerLevel);
    return approval?.level || null;
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

    // For approval-related tickets, check approval deadline
    if (ticket.sla.approvalDeadline && ticket.status.includes('Approval')) {
      const now = new Date();
      const deadline = new Date(ticket.sla.approvalDeadline);
      const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

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
    }

    return null; // Normal - no indicator needed
  };

  // Check for invalid manager level
  const isInvalidLevel = currentManagerLevel < 1 || currentManagerLevel > 3;

  if (isInvalidLevel) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Invalid Manager Level</p>
          <p className="text-brand-slate dark:text-gray-400 text-sm">
            Manager level must be 1, 2, or 3. Current level: {currentManagerLevel}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-brand-green" aria-hidden="true" />
            Pending Approvals - Level {currentManagerLevel}
          </CardTitle>
          <CardDescription className="text-brand-slate dark:text-gray-400">
            Review and approve requests assigned to {currentManagerName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate dark:text-gray-400" aria-hidden="true" />
                <Input
                  placeholder="Search by ticket number, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-label="Search tickets"
                />
              </div>
            </div>

            {/* Level Filter */}
            <Select
              value={String(levelFilter)}
              onValueChange={(value) => {
              if (value === 'All') {
                setLevelFilter('All');
              } else {
                const numValue = Number(value);
                if (numValue === 1 || numValue === 2 || numValue === 3) {
                  setLevelFilter(numValue);
                }
              }
            }}>
              <SelectTrigger aria-label="Filter by approval level">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                <SelectItem value="1">Level 1</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="IT">IT Helpdesk</SelectItem>
                <SelectItem value="Facilities">Facilities Helpdesk</SelectItem>
                <SelectItem value="Finance">Finance Helpdesk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-4 bg-brand-green-light dark:bg-brand-green/10 border border-brand-green/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-slate dark:text-gray-400">Total Pending</p>
                  <p className="text-2xl font-bold text-brand-navy dark:text-gray-100">
                    {sortedTickets.length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-brand-green opacity-50" aria-hidden="true" />
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-slate dark:text-gray-400">Critical/High</p>
                  <p className="text-2xl font-bold text-brand-navy dark:text-gray-100">
                    {sortedTickets.filter((t) => t.urgency === 'Critical' || t.urgency === 'High').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 opacity-50" aria-hidden="true" />
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-slate dark:text-gray-400">My Level</p>
                  <p className="text-2xl font-bold text-brand-navy dark:text-gray-100">
                    Level {currentManagerLevel}
                  </p>
                </div>
                <User className="h-8 w-8 text-blue-500 opacity-50" aria-hidden="true" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex justify-center items-center gap-2">
                <div
                  className="h-5 w-5 border-2 border-brand-green border-t-transparent rounded-full animate-spin"
                  role="status"
                  aria-label="Loading approvals"
                />
                <span className="text-brand-slate dark:text-gray-400">Loading approvals...</span>
              </div>
            </CardContent>
          </Card>
        ) : sortedTickets.length === 0 ? (
          <Card className="border-brand-light-gray dark:border-gray-700">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <CheckCircle2 className="h-16 w-16 text-brand-green/30 dark:text-brand-green/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-200 mb-2">
                  {searchQuery || levelFilter !== 'All' || categoryFilter !== 'All'
                    ? 'No Approvals Match Your Filters'
                    : 'All Caught Up!'}
                </h3>
                <p className="text-sm text-brand-slate dark:text-gray-400 mb-4">
                  {searchQuery || levelFilter !== 'All' || categoryFilter !== 'All'
                    ? 'Try adjusting your search terms or filters to see more approval requests. You can clear filters to view all pending approvals.'
                    : 'There are no pending approval requests at the moment. New requests requiring your approval will appear here.'}
                </p>
                {(searchQuery || levelFilter !== 'All' || categoryFilter !== 'All') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setLevelFilter('All');
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
            const approvalLevel = getApprovalLevel(ticket);
            const slaUrgency = getSlaUrgency(ticket);

            return (
              <Card
                key={ticket.id}
                className={cn(
                  "border-brand-light-gray dark:border-gray-700 hover:shadow-md transition-shadow",
                  slaUrgency?.level === 'overdue' && "border-l-4 border-l-red-500",
                  slaUrgency?.level === 'urgent' && "border-l-4 border-l-orange-500",
                  slaUrgency?.level === 'warning' && "border-l-4 border-l-yellow-500"
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-mono text-sm text-brand-slate dark:text-gray-400">
                            {ticket.ticketNumber}
                          </span>
                          <Badge variant="custom" className={cn('text-xs', getUrgencyColor(ticket.urgency))}>
                            {ticket.urgency}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticket.highLevelCategory}
                          </Badge>
                          {approvalLevel && (
                            <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                              Level {approvalLevel}
                            </Badge>
                          )}
                          {slaUrgency && (
                            <Badge
                              className={cn(
                                'text-xs flex items-center gap-1',
                                slaUrgency.level === 'overdue' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                                slaUrgency.level === 'urgent' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                                slaUrgency.level === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              )}
                            >
                              <Clock className="h-3 w-3" />
                              {slaUrgency.message}
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-semibold text-brand-navy dark:text-gray-100 mb-1">
                          {ticket.subject}
                        </h3>

                        <p className="text-sm text-brand-slate dark:text-gray-400 line-clamp-2">
                          {ticket.description}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-brand-slate dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Requested by: {ticket.requesterName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        <span>{ticket.subCategory}</span>
                      </div>
                    </div>

                    {/* Previous Approvals */}
                    {ticket.approvalFlow && ticket.approvalFlow.some((a) => a.status !== 'Pending') && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-xs font-medium text-brand-navy dark:text-gray-100 mb-2">
                          Previous Approvals:
                        </p>
                        <div className="space-y-1">
                          {ticket.approvalFlow
                            .filter((a) => a.status !== 'Pending')
                            .map((approval, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                {approval.status === 'Approved' ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                )}
                                <span className="text-brand-slate dark:text-gray-400">
                                  Level {approval.level} - {approval.approverName} -{' '}
                                  {approval.status}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2 border-t border-brand-light-gray dark:border-gray-700">
                      <Button
                        onClick={() => handleApprovalAction(ticket, 'Approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        disabled={isSubmitting}
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleApprovalAction(ticket, 'Reject')}
                        variant="destructive"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        <ThumbsDown className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              className="px-4"
                              onClick={() => handleViewDetails(ticket)}
                              aria-label="View ticket details"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!viewDetailsTicket} onOpenChange={() => setViewDetailsTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewDetailsTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-brand-navy dark:text-gray-100">
                  Ticket Details
                </DialogTitle>
                <DialogDescription className="text-brand-slate dark:text-gray-400">
                  {viewDetailsTicket.ticketNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400">Status</Label>
                    <p className="text-sm font-medium text-brand-navy dark:text-gray-100">
                      {viewDetailsTicket.status}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400">Urgency</Label>
                    <Badge variant="custom" className={cn('text-xs mt-1', getUrgencyColor(viewDetailsTicket.urgency))}>
                      {viewDetailsTicket.urgency}
                    </Badge>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <Label className="text-xs text-brand-slate dark:text-gray-400">Category</Label>
                  <p className="text-sm text-brand-navy dark:text-gray-100">
                    {viewDetailsTicket.highLevelCategory} → {viewDetailsTicket.subCategory}
                  </p>
                </div>

                {/* Subject */}
                <div>
                  <Label className="text-xs text-brand-slate dark:text-gray-400">Subject</Label>
                  <p className="text-sm font-medium text-brand-navy dark:text-gray-100">
                    {viewDetailsTicket.subject}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs text-brand-slate dark:text-gray-400">Description</Label>
                  <p className="text-sm text-brand-navy dark:text-gray-100 whitespace-pre-wrap">
                    {viewDetailsTicket.description}
                  </p>
                </div>

                {/* Requester Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400">Requester</Label>
                    <p className="text-sm text-brand-navy dark:text-gray-100">
                      {viewDetailsTicket.requesterName || viewDetailsTicket.userName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400">Department</Label>
                    <p className="text-sm text-brand-navy dark:text-gray-100">
                      {viewDetailsTicket.userDepartment}
                    </p>
                  </div>
                </div>

                {/* Created Date */}
                <div>
                  <Label className="text-xs text-brand-slate dark:text-gray-400">Created At</Label>
                  <p className="text-sm text-brand-navy dark:text-gray-100">
                    {formatDate(viewDetailsTicket.createdAt)}
                  </p>
                </div>

                {/* Approval Flow */}
                {viewDetailsTicket.approvalFlow && viewDetailsTicket.approvalFlow.length > 0 && (
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400 mb-2 block">
                      Approval Flow
                    </Label>
                    <div className="space-y-2">
                      {viewDetailsTicket.approvalFlow.map((approval, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {approval.status === 'Approved' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : approval.status === 'Rejected' ? (
                              <XCircle className="h-5 w-5 text-red-500" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-brand-navy dark:text-gray-100">
                                Level {approval.level} - {approval.approverName || approval.managerName || 'Pending'}
                              </p>
                              <p className="text-xs text-brand-slate dark:text-gray-400">
                                Status: {approval.status}
                              </p>
                            </div>
                          </div>
                          {approval.remarks && (
                            <p className="text-xs text-brand-slate dark:text-gray-400 max-w-xs">
                              {approval.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {viewDetailsTicket.attachments && viewDetailsTicket.attachments.length > 0 && (
                  <div>
                    <Label className="text-xs text-brand-slate dark:text-gray-400">Attachments</Label>
                    <div className="mt-2 space-y-1">
                      {viewDetailsTicket.attachments.map((attachment, idx) => (
                        <p key={idx} className="text-sm text-blue-600 dark:text-blue-400">
                          {attachment}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDetailsTicket(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={!!approvalDialog} onOpenChange={() => setApprovalDialog(null)}>
        <DialogContent>
          {approvalDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-brand-navy dark:text-gray-100">
                  {approvalDialog.action === 'Approve' ? 'Approve Request' : 'Reject Request'}
                </DialogTitle>
                <DialogDescription className="text-brand-slate dark:text-gray-400">
                  {approvalDialog.ticket.ticketNumber} - {approvalDialog.ticket.subject}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Ticket Info */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2">
                  <div>
                    <span className="text-xs text-brand-slate dark:text-gray-400">Category:</span>
                    <p className="text-sm text-brand-navy dark:text-gray-100">
                      {approvalDialog.ticket.highLevelCategory} → {approvalDialog.ticket.subCategory}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-brand-slate dark:text-gray-400">Description:</span>
                    <p className="text-sm text-brand-navy dark:text-gray-100 line-clamp-3">
                      {approvalDialog.ticket.description}
                    </p>
                  </div>
                </div>

                {/* Remarks */}
                <div className="space-y-2">
                  <Label htmlFor="remarks" className="text-brand-slate dark:text-gray-300">
                    Remarks {approvalDialog.action === 'Reject' && <span className="text-red-500">*</span>}
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder={
                      approvalDialog.action === 'Approve'
                        ? 'Optional: Add any comments...'
                        : 'Required: Provide reason for rejection...'
                    }
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                  />
                </div>

                {approvalDialog.action === 'Reject' && !remarks.trim() && (
                  <p className="text-xs text-red-500">Remarks are required when rejecting a request</p>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setApprovalDialog(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApproval}
                  disabled={isSubmitting || (approvalDialog.action === 'Reject' && !remarks.trim())}
                  className={cn(
                    approvalDialog.action === 'Approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  )}
                >
                  {isSubmitting
                    ? 'Submitting...'
                    : approvalDialog.action === 'Approve'
                    ? 'Confirm Approval'
                    : 'Confirm Rejection'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
