import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import { format, formatDistanceToNow } from 'date-fns';

interface SLAInfoProps {
  ticket: HelpdeskTicket;
}

export function SLAInfo({ ticket }: SLAInfoProps) {
  const { sla } = ticket;

  if (!sla) {
    return null;
  }

  // Check if ticket is in terminal status
  const terminalStatuses = ['Cancelled', 'Closed', 'Auto-Closed', 'Completed', 'Confirmed', 'Rejected'];
  const isTerminal = terminalStatuses.includes(ticket.status);

  // Calculate time taken for completed items
  const getTimeTaken = (startDate: string, endDate?: string, slaHours?: number): { text: string; withinSLA: boolean; hours: number } => {
    if (!endDate) return { text: 'Not completed', withinSLA: true, hours: 0 };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    
    const withinSLA = slaHours ? hours <= slaHours : true;
    
    return {
      text: `${hours.toFixed(1)} hours`,
      withinSLA,
      hours
    };
  };

  // Calculate time remaining for active items
  const getTimeRemaining = (deadline?: string): { text: string; isOverdue: boolean } => {
    if (!deadline) return { text: 'Not set', isOverdue: false };
    
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const isOverdue = deadlineDate < now;
    
    return {
      text: formatDistanceToNow(deadlineDate, { addSuffix: true }),
      isOverdue
    };
  };

  // Approval metrics
  const approvalCompleted = ticket.approvalCompleted || ticket.status === 'Rejected' || false;
  
  // Find approval completion date - check multiple sources
  let approvalCompletedDate = ticket.approval?.finalApprovalDate || 
    ticket.approval?.level3?.actionTimestamp ||
    ticket.approval?.level2?.actionTimestamp ||
    ticket.approval?.level1?.actionTimestamp;
  
  // For rejected tickets, use the rejection timestamp
  if (!approvalCompletedDate && ticket.status === 'Rejected') {
    // Find rejection timestamp from history
    const rejectHistory = ticket.history?.find(h => 
      h.action.toLowerCase().includes('rejected') || 
      h.newStatus === 'Rejected'
    );
    approvalCompletedDate = rejectHistory?.timestamp || ticket.updatedAt;
  }
  
  // If ticket is closed/completed and requires approval, approval must be done
  // Use routing timestamp or processing start as fallback
  if (!approvalCompletedDate && isTerminal && ticket.requiresApproval) {
    approvalCompletedDate = ticket.processing?.routedAt || ticket.assignment?.assignedAt;
  }
  
  const approvalTimeTaken = (approvalCompleted || (isTerminal && ticket.requiresApproval)) && approvalCompletedDate
    ? getTimeTaken(ticket.createdAt, approvalCompletedDate, sla.approvalSlaHours)
    : null;
  const approvalTimeRemaining = getTimeRemaining(sla.approvalDeadline);

  // Processing metrics
  const processingCompleted = isTerminal;
  const processingCompletedDate = ticket.closedAt || ticket.completedAt || 
    (ticket.status === 'Rejected' ? 
      (ticket.history?.find(h => h.action.toLowerCase().includes('rejected') || h.newStatus === 'Rejected')?.timestamp || ticket.updatedAt) 
      : undefined);
  const processingTimeTaken = processingCompleted && processingCompletedDate
    ? getTimeTaken(ticket.createdAt, processingCompletedDate, sla.processingSlaHours)
    : null;
  const processingTimeRemaining = getTimeRemaining(sla.processingDeadline);

  const getSLAStatusBadge = (isOverdue: boolean, isCompleted: boolean = false, withinSLA: boolean = true) => {
    if (isCompleted) {
      if (withinSLA) {
        return (
          <Badge className="badge-status-completed flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Within SLA
          </Badge>
        );
      } else {
        return (
          <Badge className="badge-urgency-high flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            SLA Breached
          </Badge>
        );
      }
    }
    
    if (isOverdue) {
      return (
        <Badge className="badge-urgency-critical flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }
    return (
      <Badge className="badge-status-in-progress flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        On Track
      </Badge>
    );
  };

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          SLA Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Approval SLA */}
        {ticket.requiresApproval && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                Approval SLA
              </Label>
              {approvalTimeTaken
                ? getSLAStatusBadge(false, true, approvalTimeTaken.withinSLA)
                : getSLAStatusBadge(approvalTimeRemaining.isOverdue, false)
              }
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Target Time:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {sla.approvalSlaHours} hours
                </span>
              </div>
              {sla.approvalDeadline && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {format(new Date(sla.approvalDeadline), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {approvalTimeTaken ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time taken:</span>
                      <span className={`font-medium ${
                        approvalTimeTaken.withinSLA
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {approvalTimeTaken.text}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        {approvalTimeRemaining.isOverdue ? 'Overdue by:' : 'Time remaining:'}
                      </span>
                      <span className={`font-medium ${
                        approvalTimeRemaining.isOverdue 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {approvalTimeRemaining.text}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Processing SLA */}
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold text-purple-900 dark:text-purple-300">
              Processing SLA
            </Label>
            {processingTimeTaken
              ? getSLAStatusBadge(false, true, processingTimeTaken.withinSLA)
              : getSLAStatusBadge(processingTimeRemaining.isOverdue, false)
            }
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Target Time:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {sla.processingSlaHours} hours
              </span>
            </div>
            {sla.processingDeadline && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Deadline:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {format(new Date(sla.processingDeadline), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                {processingTimeTaken ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time taken to close:</span>
                    <span className={`font-medium ${
                      processingTimeTaken.withinSLA
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {processingTimeTaken.text}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {processingTimeRemaining.isOverdue ? 'Overdue by:' : 'Time remaining:'}
                    </span>
                    <span className={`font-medium ${
                      processingTimeRemaining.isOverdue 
                        ? 'text-red-600 dark:text-red-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {processingTimeRemaining.text}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Overall Status - Only for active overdue tickets */}
        {!isTerminal && sla.isOverdue && sla.overdueBy && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">
                Ticket is overdue by {sla.overdueBy.toFixed(1)} hours
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
