import { CheckCircle2, XCircle, Clock, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'rejected';
  timestamp?: string;
  description?: string;
}

interface TicketStepperProps {
  ticket: HelpdeskTicket;
}

function resolveSteps(ticket: HelpdeskTicket): Step[] {
  const steps: Step[] = [];

  // Step 1: Submitted
  steps.push({
    id: 'submitted',
    label: 'Submitted',
    status: 'completed',
    timestamp: ticket.createdAt,
    description: `by ${ticket.requesterName || ticket.userName}`
  });

  // Step 2-4: Approval Steps (if required)
  if (ticket.approval && ticket.approval.required && !ticket.approval.bypassed) {
    const currentLevel = ticket.approval.currentLevel || 0;

    // Level 1
    const level1 = ticket.approval.level1;
    if (level1) {
      steps.push({
        id: 'approval-l1',
        label: 'Level 1 Approval',
        status: level1.status === 'Approved' ? 'completed' :
                level1.status === 'Rejected' ? 'rejected' :
                currentLevel === 1 ? 'active' : 'pending',
        timestamp: level1.actionTimestamp,
        description: level1.status === 'Pending' ?
          `Awaiting ${level1.managerName || 'manager'} approval` :
          `${level1.status} by ${level1.approverName || level1.managerName}`
      });
    }

    // Level 2
    const level2 = ticket.approval.level2;
    if (level2) {
      steps.push({
        id: 'approval-l2',
        label: 'Level 2 Approval',
        status: level2.status === 'Approved' ? 'completed' :
                level2.status === 'Rejected' ? 'rejected' :
                currentLevel === 2 ? 'active' : 'pending',
        timestamp: level2.actionTimestamp,
        description: level2.status === 'Pending' ?
          `Awaiting ${level2.managerName || 'manager'} approval` :
          `${level2.status} by ${level2.approverName || level2.managerName}`
      });
    }

    // Level 3
    const level3 = ticket.approval.level3;
    if (level3) {
      steps.push({
        id: 'approval-l3',
        label: 'Level 3 Approval',
        status: level3.status === 'Approved' ? 'completed' :
                level3.status === 'Rejected' ? 'rejected' :
                currentLevel === 3 ? 'active' : 'pending',
        timestamp: level3.actionTimestamp,
        description: level3.status === 'Pending' ?
          `Awaiting ${level3.managerName || 'manager'} approval` :
          `${level3.status} by ${level3.approverName || level3.managerName}`
      });
    }
  }

  // Check if rejected at any approval level
  const isRejected = ticket.status === 'Rejected';
  if (isRejected) {
    return steps; // Don't show further steps if rejected
  }

  // Helper: Check if ticket was ever in a specific state by checking history
  const wasEverInState = (actionPattern: string) => {
    return ticket.history?.some(h => 
      h.action.toLowerCase().includes(actionPattern.toLowerCase())
    ) || false;
  };

  // Helper: Find history entry for a specific action
  const findHistoryEntry = (actionPattern: string) => {
    return ticket.history?.find(h => 
      h.action.toLowerCase().includes(actionPattern.toLowerCase())
    );
  };

  // For reopened tickets, check history to determine what steps were previously completed
  const wasAssigned = wasEverInState('assigned') || ticket.assignment?.assignedToId;
  const wasInProgress = wasEverInState('in progress') || wasEverInState('working');
  const wasCompleted = wasEverInState('completed') || wasEverInState('work completed');
  const wasClosed = wasEverInState('closed');
  // Check if ticket was ever reopened (either current status OR has reopened history)
  // This ensures we track the reopened workflow even after reassignment
  const wasReopened = wasEverInState('reopened');
  const isCurrentlyReopened = ticket.status === 'Reopened';
  const isReopened = isCurrentlyReopened || wasReopened;

  // Check if all required approvals are completed
  const isApprovalRequired = ticket.approval?.required && !ticket.approval?.bypassed;
  const allApprovalsCompleted = !isApprovalRequired || (
    (!ticket.approval?.level1 || ticket.approval.level1.status === 'Approved') &&
    (!ticket.approval?.level2 || ticket.approval.level2.status === 'Approved') &&
    (!ticket.approval?.level3 || ticket.approval.level3.status === 'Approved')
  );
  const isInApprovalProcess = ticket.status.includes('Pending Approval');

  // Step 5: Routed to Department - only show if approvals are done or not required
  const hasRouting = ticket.status !== 'Submitted' && ticket.status !== 'Draft' &&
                    !isInApprovalProcess && allApprovalsCompleted;
  if (hasRouting || ticket.status === 'Routed' || ticket.status === 'In Queue' || 
      (isReopened && allApprovalsCompleted) || ticket.status === 'Approved') {
    const deptName = ticket.routedTo || ticket.processing?.processingQueue || ticket.highLevelCategory;
    const queueName = ticket.processing?.specialistQueue;
    
    // Determine step status
    let routedStatus: 'completed' | 'active' | 'pending' = 'pending';
    if (ticket.status === 'Approved') {
      routedStatus = 'active'; // Just approved, about to be routed
    } else if (ticket.status === 'Routed' || ticket.status === 'In Queue') {
      routedStatus = 'active';
    } else if (!isInApprovalProcess && allApprovalsCompleted && 
               ['Assigned', 'In Progress', 'Work Completed', 'Completed', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
      routedStatus = 'completed';
    }
    
    steps.push({
      id: 'routed',
      label: 'Routed to Department',
      status: routedStatus,
      timestamp: ticket.processing?.routedAt,
      description: deptName 
        ? `Routed to ${deptName} Department${queueName ? ` (${queueName})` : ''}`
        : 'Awaiting routing'
    });
  }

  // Step 6: Assigned (first cycle - show if was previously assigned)
  // For reopened tickets, this represents the ORIGINAL assignment before reopen
  if (ticket.assignment?.assignedTo || wasAssigned ||
      ['Assigned', 'In Progress', 'Work Completed', 'Completed', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
    const assignmentHistory = findHistoryEntry('assigned') || findHistoryEntry('assignment cleared');
    
    // For reopened tickets, find the first assignment (before reopen)
    const firstAssignment = wasReopened ? ticket.history?.find(h => 
      h.action.toLowerCase().includes('assigned') && 
      new Date(h.timestamp) < new Date(findHistoryEntry('reopened')?.timestamp || Date.now())
    ) : null;
    
    // Get current assignment info for non-reopened tickets or tickets not yet reassigned after reopen
    const assigneeName = wasReopened && firstAssignment 
      ? (firstAssignment.details?.match(/to\s+([^(]+?)(?:\s*\(|\s*-|$)/)?.[1]?.trim() || 'IT specialist')
      : ticket.assignment?.assignedToName;
    const assignmentNotes = ticket.assignment?.assignmentNotes;
    
    let description = 'Awaiting assignment';
    if (wasReopened && firstAssignment) {
      // For reopened tickets, show the original assignee (completed cycle)
      description = `Was assigned to ${assigneeName}`;
    } else if (isCurrentlyReopened && !ticket.assignment?.assignedToId && assignmentHistory) {
      // Currently in Reopened status - show previous assignment info
      const match = assignmentHistory.details?.match(/to\s+([^(]+)\s*\(/);
      const previousAssignee = match ? match[1].trim() : 'IT specialist';
      description = `Previously assigned to ${previousAssignee}`;
    } else if (ticket.assignment?.assignedToName) {
      description = `Assigned to ${ticket.assignment.assignedToName}${assignmentNotes ? ` - ${assignmentNotes}` : ''}`;
    }
    
    // Determine step status
    let assignedStatus: 'completed' | 'active' | 'pending' = 'completed';
    if (!wasReopened && !isCurrentlyReopened) {
      // Normal flow (not reopened)
      if (ticket.status === 'Routed' || ticket.status === 'In Queue') {
        assignedStatus = 'pending';
      } else if (ticket.status === 'Assigned') {
        assignedStatus = 'active';
      }
    }
    // For reopened tickets, the first assignment cycle is always completed
    
    steps.push({
      id: 'assigned',
      label: wasReopened ? 'Assigned (1st)' : 'Assigned',
      status: assignedStatus,
      timestamp: firstAssignment?.timestamp || ticket.assignment?.assignedAt || assignmentHistory?.timestamp,
      description
    });
  }

  // Step 7: Work In Progress (first cycle)
  if (wasInProgress ||
      ['In Progress', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
    const inProgressHistory = findHistoryEntry('in progress') || findHistoryEntry('working');
    
    // For reopened tickets, this is the first cycle (completed)
    // For currently reopened tickets, show as "previous work"
    // For non-reopened tickets in progress, show as active
    let status: 'completed' | 'active' | 'pending' = 'completed';
    let description = ticket.progressStatus || 'Work completed';
    
    if (!wasReopened && !isCurrentlyReopened) {
      // Normal flow
      if (ticket.status === 'Assigned') {
        status = 'pending';
        description = 'Awaiting work';
      } else if (ticket.status === 'In Progress') {
        status = 'active';
        description = ticket.progressStatus || 'Work is ongoing';
      }
    } else {
      // Reopened flow - first cycle is always completed
      description = 'Work was completed';
    }
    
    steps.push({
      id: 'in-progress',
      label: wasReopened ? 'In Progress (1st)' : 'Work In Progress',
      status,
      timestamp: inProgressHistory?.timestamp,
      description
    });
  }

  // Step 8: User Confirmation (first cycle)
  if (wasCompleted ||
      ['Awaiting User Confirmation', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
    const confirmedHistory = findHistoryEntry('confirmed');
    
    let status: 'completed' | 'active' | 'pending' = 'completed';
    let description = 'User confirmed';
    
    if (!wasReopened && !isCurrentlyReopened) {
      // Normal flow
      if (ticket.status === 'In Progress') {
        status = 'pending';
        description = 'Awaiting user confirmation';
      } else if (ticket.status === 'Awaiting User Confirmation') {
        status = 'active';
        description = 'Awaiting user confirmation';
      }
    } else {
      // Reopened flow - first cycle is completed
      description = 'Was confirmed';
    }
    
    steps.push({
      id: 'user-confirmation',
      label: wasReopened ? 'Confirmed (1st)' : 'User Confirmation',
      status,
      timestamp: ticket.userConfirmedAt || confirmedHistory?.timestamp,
      description
    });
  }

  // Step 9: Closed (first cycle - only show if was closed, not currently closed unless not reopened)
  if (wasClosed || (!wasReopened && ['Closed', 'Auto-Closed'].includes(ticket.status))) {
    const closedHistory = findHistoryEntry('closed');
    
    steps.push({
      id: 'closed',
      label: wasReopened ? 'Closed (1st)' : (ticket.status === 'Auto-Closed' ? 'Auto-Closed' : 'Closed'),
      status: 'completed',
      timestamp: ticket.closedAt || closedHistory?.timestamp,
      description: wasReopened ? 'Was closed (then reopened)' :
                   ticket.closingNote || (ticket.status === 'Auto-Closed' ? 'Auto-closed due to SLA' : 'Ticket closed')
    });
  }

  // Step 10: Reopened (show if ticket was ever reopened)
  if (wasReopened || isCurrentlyReopened) {
    const reopenHistory = findHistoryEntry('reopened');
    
    // Determine the status of the reopened step
    // - 'active' if currently in Reopened status (awaiting reassignment)
    // - 'completed' if already reassigned (status changed from Reopened)
    const reopenedStepStatus = isCurrentlyReopened ? 'active' : 'completed';
    
    steps.push({
      id: 'reopened',
      label: 'Reopened',
      status: reopenedStepStatus,
      timestamp: reopenHistory?.timestamp || ticket.updatedAt,
      description: isCurrentlyReopened 
        ? (reopenHistory?.details || 'Ticket reopened - awaiting reassignment')
        : 'Ticket was reopened'
    });
  }

  // Step 11: Reassigned (show for reopened tickets that have been reassigned)
  if (wasReopened && !isCurrentlyReopened && ticket.assignment?.assignedToId) {
    const reassignmentHistory = ticket.history?.filter(h => 
      h.action.toLowerCase().includes('assigned') && 
      new Date(h.timestamp) > new Date(findHistoryEntry('reopened')?.timestamp || 0)
    ).pop();
    
    steps.push({
      id: 'reassigned',
      label: 'Reassigned',
      status: ticket.status === 'Assigned' ? 'active' : 'completed',
      timestamp: reassignmentHistory?.timestamp || ticket.assignment?.assignedAt,
      description: `Reassigned to ${ticket.assignment.assignedToName}${ticket.assignment.assignmentNotes ? ` - ${ticket.assignment.assignmentNotes}` : ''}`
    });
  }

  // Step 12: Work In Progress (After Reopen) - show for reopened tickets
  if (wasReopened && !isCurrentlyReopened && ['In Progress', 'Confirmed', 'Closed'].includes(ticket.status)) {
    steps.push({
      id: 'in-progress-reopen',
      label: 'Work In Progress',
      status: ticket.status === 'In Progress' ? 'active' : 'completed',
      timestamp: ticket.updatedAt,
      description: ticket.progressStatus || 'Work is ongoing on reopened ticket'
    });
  }

  // Step 13: Closed (After Reopen) - show for reopened tickets that are closed again
  if (wasReopened && !isCurrentlyReopened && ['Closed', 'Auto-Closed'].includes(ticket.status)) {
    steps.push({
      id: 'closed-reopen',
      label: 'Closed',
      status: 'completed',
      timestamp: ticket.closedAt || ticket.updatedAt,
      description: ticket.closingNote || 'Ticket closed after reopen'
    });
  }

  return steps;
}

export function TicketStepper({ ticket }: TicketStepperProps) {
  const steps = resolveSteps(ticket);

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'active':
        return <Clock className="h-6 w-6 text-blue-500 animate-pulse" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'pending':
        return <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600" />;
    }
  };

  const getStepColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'active':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'rejected':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'pending':
        return 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-100 mb-6">
        Ticket Progress
      </h3>

      {/* Horizontal Stepper */}
      <div className="relative">
        <div className="flex justify-between items-start">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      step.status === 'completed' || step.status === 'active'
                        ? 'bg-green-500'
                        : step.status === 'rejected'
                        ? 'bg-red-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div
                className={cn(
                  'rounded-full border-2 p-2 bg-white dark:bg-gray-800 z-10',
                  getStepColor(step.status)
                )}
              >
                {getStepIcon(step.status)}
              </div>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[120px]">
                <p
                  className={cn(
                    'text-xs font-medium',
                    step.status === 'active' || step.status === 'completed'
                      ? 'text-brand-navy dark:text-gray-100'
                      : 'text-brand-slate dark:text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {step.timestamp && (
                  <p className="text-[10px] text-brand-slate dark:text-gray-500 mt-1">
                    {new Date(step.timestamp).toLocaleDateString()} {new Date(step.timestamp).toLocaleTimeString()}
                  </p>
                )}
                {step.description && (
                  <p className="text-[10px] text-brand-slate dark:text-gray-500 mt-1 line-clamp-2">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
