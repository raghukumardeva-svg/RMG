import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
import { Eye, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface ApproverTicketListProps {
  tickets: HelpdeskTicket[];
  onViewTicket: (ticket: HelpdeskTicket) => void;
  onApprove: (ticket: HelpdeskTicket) => void;
  onReject: (ticket: HelpdeskTicket) => void;
  approverLevel: 'L1' | 'L2' | 'L3';
  actioningTicketId?: string | null;
}

export function ApproverTicketList({
  tickets,
  onViewTicket,
  onApprove,
  onReject,
  approverLevel,
  actioningTicketId
}: ApproverTicketListProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending Level-1 Approval':
        return 'badge-status-pending-l1';
      case 'Pending Level-2 Approval':
        return 'badge-status-pending-l2';
      case 'Pending Level-3 Approval':
        return 'badge-status-pending-l3';
      case 'Approved':
        return 'badge-status-approved';
      case 'Completed':
        return 'badge-status-completed';
      case 'Routed':
        return 'badge-status-routed';
      case 'Rejected':
        return 'badge-status-rejected';
      case 'Closed':
      case 'Auto-Closed':
        return 'badge-status-closed';
      default:
        return 'badge-status-submitted';
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

  const isHistorical = (ticket: HelpdeskTicket): boolean => {
    const historicalStatuses = ['Approved', 'Rejected', 'Completed', 'Closed', 'Auto-Closed', 'Routed', 'Cancelled'];
    return historicalStatuses.includes(ticket.status);
  };

  const canActOnTicket = (ticket: HelpdeskTicket): boolean => {
    const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel || 'NONE';
    return currentLevel === approverLevel && !isHistorical(ticket);
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Tickets Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            There are no tickets to display in this view.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => {
        const historical = isHistorical(ticket);
        const canAct = canActOnTicket(ticket);
        const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel || 'NONE';

        return (
          <Card
            key={ticket._id || ticket.id}
            className={cn(
              'border-l-4 transition-all bg-white dark:bg-gray-800',
              historical
                ? 'border-l-gray-300 opacity-80'
                : canAct
                ? 'border-l-blue-500'
                : 'border-l-amber-500'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left side - Ticket info */}
                <div className="flex-1 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-brand-navy dark:text-gray-100">
                          #{ticket.ticketNumber}
                        </h3>
                        <Badge variant="custom" className={cn('text-xs', getStatusColor(ticket.status))}>
                          {ticket.status}
                        </Badge>
                        <Badge variant="custom" className={cn('text-xs', getUrgencyColor(ticket.urgency))}>
                          {ticket.urgency}
                        </Badge>
                        {historical && (
                          <Badge variant="outline" className="text-xs">
                            Historical
                          </Badge>
                        )}
                        {!historical && currentLevel !== approverLevel && (
                          <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                            View Only
                          </Badge>
                        )}
                        {canAct && (
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            Action Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-brand-slate dark:text-gray-400 mt-1 line-clamp-1">
                        {ticket.subject}
                      </p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Module</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {ticket.module || ticket.highLevelCategory}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Approval Level</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {currentLevel === 'NONE'
                          ? (ticket.approvalStatus === 'Rejected' ? 'Rejected' : 'Completed')
                          : currentLevel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Requested By</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {ticket.requesterName || ticket.userName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side - Action icons */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <button
                    onClick={() => onViewTicket(ticket)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    title="View ticket details"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  {canAct && (
                    <>
                      <button
                        onClick={() => onApprove(ticket)}
                        disabled={actioningTicketId === ticket.id}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Approve ticket"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onReject(ticket)}
                        disabled={actioningTicketId === ticket.id}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Reject ticket"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
