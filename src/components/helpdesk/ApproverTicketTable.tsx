import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpDown, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface ApproverTicketTableProps {
  tickets: HelpdeskTicket[];
  onViewTicket: (ticket: HelpdeskTicket) => void;
  onApprove: (ticket: HelpdeskTicket) => void;
  onReject: (ticket: HelpdeskTicket) => void;
  approverLevel: 'L1' | 'L2' | 'L3';
  actioningTicketId?: string | null;
}

type SortField = 'ticketNumber' | 'subject' | 'module' | 'requester' | 'level' | 'created';
type SortDirection = 'asc' | 'desc';

export function ApproverTicketTable({
  tickets,
  onViewTicket,
  onApprove,
  onReject,
  approverLevel,
  actioningTicketId
}: ApproverTicketTableProps) {
  const [sortField, setSortField] = useState<SortField>('created');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'ticketNumber':
        aValue = a.ticketNumber;
        bValue = b.ticketNumber;
        break;
      case 'subject':
        aValue = a.subject.toLowerCase();
        bValue = b.subject.toLowerCase();
        break;
      case 'module':
        aValue = (a.module || a.highLevelCategory).toLowerCase();
        bValue = (b.module || b.highLevelCategory).toLowerCase();
        break;
      case 'requester':
        aValue = (a.requesterName || a.userName).toLowerCase();
        bValue = (b.requesterName || b.userName).toLowerCase();
        break;
      case 'level':
        aValue = (a.currentApprovalLevel || a.approvalLevel || 'NONE');
        bValue = (b.currentApprovalLevel || b.approvalLevel || 'NONE');
        break;
      case 'created':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  if (tickets.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No Tickets Found
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            There are no tickets to display in this view.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-white dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('ticketNumber')}
                >
                  Ticket ID
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('subject')}
                >
                  Subject
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('module')}
                >
                  Module
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('requester')}
                >
                  Requested By
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('level')}
                >
                  Level / Status
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Urgency
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold text-xs text-gray-700 dark:text-gray-300"
                  onClick={() => handleSort('created')}
                >
                  Created
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">
                  Action
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTickets.map((ticket) => {
              const historical = isHistorical(ticket);
              const canAct = canActOnTicket(ticket);
              const currentLevel = ticket.currentApprovalLevel || ticket.approvalLevel || 'NONE';

              return (
                <tr
                  key={ticket._id || ticket.id}
                  className={cn(
                    'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                    historical && 'opacity-60'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-brand-navy dark:text-gray-100">
                        #{ticket.ticketNumber}
                      </span>
                      {canAct && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Action Required" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 max-w-xs">
                      {ticket.subject}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ticket.module || ticket.highLevelCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      {ticket.requesterName || ticket.userName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant="custom" className={cn('text-xs w-fit', getStatusColor(ticket.status))}>
                        {ticket.status}
                      </Badge>
                      {!historical && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Level: {currentLevel === 'NONE'
                            ? (ticket.approvalStatus === 'Rejected' ? 'Rejected' : 'Completed')
                            : currentLevel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="custom" className={cn('text-xs', getUrgencyColor(ticket.urgency))}>
                      {ticket.urgency}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
