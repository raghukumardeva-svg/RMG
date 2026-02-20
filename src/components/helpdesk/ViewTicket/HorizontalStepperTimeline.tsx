import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import { Check, Circle, X, RotateCcw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'rejected';
  timestamp?: string;
  description?: string;
}

interface HorizontalStepperTimelineProps {
  ticket: HelpdeskTicket;
}

export function HorizontalStepperTimeline({ ticket }: HorizontalStepperTimelineProps) {
  const resolveSteps = (): Step[] => {
    const steps: Step[] = [];

    // Check if all required approvals are completed
    // Handle both "Pending Approval L1" and "Pending Level-1 Approval" formats
    const isInApprovalProcess = ticket.status.includes('Pending Approval') || 
                                 ticket.status.includes('Pending Level-') ||
                                 ticket.status === 'Approved'; // Just approved, not yet routed
    
    const isApprovalRequired = ticket.approval?.required && !ticket.approval?.bypassed;
    // If we're in approval process (based on status), approvals are NOT complete
    const allApprovalsCompleted = !isInApprovalProcess && (
      !isApprovalRequired || (
        (!ticket.approval?.level1 || ticket.approval.level1.status === 'Approved') &&
        (!ticket.approval?.level2 || ticket.approval.level2.status === 'Approved') &&
        (!ticket.approval?.level3 || ticket.approval.level3.status === 'Approved')
      )
    );

    // Debug log to see ticket data
    console.log('[HorizontalStepperTimeline] Ticket:', ticket.ticketNumber, {
      status: ticket.status,
      isInApprovalProcess,
      allApprovalsCompleted,
      isApprovalRequired
    });

    // Step 1: Submitted (always show)
    steps.push({
      id: 'submitted',
      label: 'Submitted',
      status: 'completed',
      timestamp: ticket.createdAt,
      description: `by ${ticket.requesterName || ticket.userName}`
    });

    // Determine current approval level from status (handles both formats)
    // "Pending Approval L1" or "Pending Level-1 Approval"
    const getCurrentApprovalLevel = (): number => {
      if (ticket.status.includes('L1') || ticket.status.includes('Level-1')) return 1;
      if (ticket.status.includes('L2') || ticket.status.includes('Level-2')) return 2;
      if (ticket.status.includes('L3') || ticket.status.includes('Level-3')) return 3;
      return 0;
    };
    const currentApprovalLevelFromStatus = getCurrentApprovalLevel();

    // Check if ticket has approval history (to show approval steps even after routing)
    const hasApprovalHistory = ticket.history?.some(h => 
      h.action.toLowerCase().includes('approved') || 
      h.action.toLowerCase().includes('l1') ||
      h.action.toLowerCase().includes('l2') ||
      h.action.toLowerCase().includes('l3') ||
      h.action.toLowerCase().includes('level-1') ||
      h.action.toLowerCase().includes('level-2') ||
      h.action.toLowerCase().includes('level-3')
    ) || false;

    // Find approval info from history
    const findApprovalFromHistory = (level: number): { approved: boolean; approverName?: string; timestamp?: string } => {
      const levelPatterns = level === 1 ? ['l1', 'level-1', 'level 1'] 
                          : level === 2 ? ['l2', 'level-2', 'level 2']
                          : ['l3', 'level-3', 'level 3'];
      
      const historyEntry = ticket.history?.find(h => {
        const actionLower = h.action.toLowerCase();
        return actionLower.includes('approved') && 
               levelPatterns.some(p => actionLower.includes(p));
      });
      
      if (historyEntry) {
        // Try to extract approver name from details
        const approverMatch = historyEntry.details?.match(/by\s+([^(]+?)(?:\s*\(|$)/i);
        return {
          approved: true,
          approverName: approverMatch?.[1]?.trim() || historyEntry.performedByName,
          timestamp: historyEntry.timestamp
        };
      }
      return { approved: false };
    };

    // Determine max approval level reached (from history or status)
    const getMaxApprovalLevelFromHistory = (): number => {
      if (hasApprovalHistory) {
        const l3History = findApprovalFromHistory(3);
        const l2History = findApprovalFromHistory(2);
        const l1History = findApprovalFromHistory(1);
        if (l3History.approved) return 3;
        if (l2History.approved) return 2;
        if (l1History.approved) return 1;
      }
      return 0;
    };
    const maxApprovalLevelFromHistory = getMaxApprovalLevelFromHistory();

    // Step 2-4: Approval Steps (show if approval object exists OR status indicates approval process OR has approval history)
    const shouldShowApprovalSteps = (ticket.approval && ticket.approval.required && !ticket.approval.bypassed) || 
                                     isInApprovalProcess || 
                                     hasApprovalHistory ||
                                     maxApprovalLevelFromHistory > 0;
    
    if (shouldShowApprovalSteps) {
      const currentLevel = ticket.approval?.currentLevel || currentApprovalLevelFromStatus;
      // If no longer in approval process, all shown levels are completed
      const effectiveMaxLevel = isInApprovalProcess ? currentLevel : Math.max(currentLevel, maxApprovalLevelFromHistory, 3);

      // Helper function to determine step status based on level
      // If not in approval process anymore (routed/assigned), all levels up to max are completed
      // If currentLevel > thisLevel, thisLevel is completed (approved)
      // If currentLevel === thisLevel, thisLevel is active
      // If currentLevel < thisLevel, thisLevel is pending
      const getStepStatus = (thisLevel: number, levelStatus?: string, historyInfo?: { approved: boolean }): 'completed' | 'active' | 'pending' | 'rejected' => {
        if (levelStatus === 'Approved') return 'completed';
        if (levelStatus === 'Rejected') return 'rejected';
        // Check history for approval
        if (historyInfo?.approved) return 'completed';
        // If no longer in approval process and this level was part of the flow, it's completed
        if (!isInApprovalProcess && thisLevel <= maxApprovalLevelFromHistory) return 'completed';
        // When approval object is undefined, infer from status
        if (!levelStatus && currentLevel > thisLevel) return 'completed'; // Previous levels are done
        if (currentLevel === thisLevel) return 'active';
        return 'pending';
      };

      // Level 1 - show if approval.level1 exists OR if status indicates L1 or higher OR history shows L1+
      const level1 = ticket.approval?.level1;
      const l1History = findApprovalFromHistory(1);
      const showL1 = level1 || currentApprovalLevelFromStatus >= 1 || maxApprovalLevelFromHistory >= 1;
      if (showL1) {
        const l1Status = level1?.status;
        const l1StepStatus = getStepStatus(1, l1Status, l1History);
        steps.push({
          id: 'approval-l1',
          label: 'L1 Approval',
          status: l1StepStatus,
          timestamp: level1?.actionTimestamp || l1History.timestamp,
          description: l1StepStatus === 'completed' 
            ? `Approved${level1?.approverName || l1History.approverName ? ` by ${level1?.approverName || l1History.approverName}` : ''}`
            : l1StepStatus === 'rejected'
            ? `Rejected by ${level1?.approverName || level1?.managerName || 'manager'}`
            : `Awaiting ${level1?.managerName || 'manager'}`
        });
      }

      // Level 2
      const level2 = ticket.approval?.level2;
      const l2History = findApprovalFromHistory(2);
      const showL2 = level2 || currentApprovalLevelFromStatus >= 2 || maxApprovalLevelFromHistory >= 2;
      if (showL2) {
        const l2Status = level2?.status;
        const l2StepStatus = getStepStatus(2, l2Status, l2History);
        steps.push({
          id: 'approval-l2',
          label: 'L2 Approval',
          status: l2StepStatus,
          timestamp: level2?.actionTimestamp || l2History.timestamp,
          description: l2StepStatus === 'completed' 
            ? `Approved${level2?.approverName || l2History.approverName ? ` by ${level2?.approverName || l2History.approverName}` : ''}`
            : l2StepStatus === 'rejected'
            ? `Rejected by ${level2?.approverName || level2?.managerName || 'manager'}`
            : `Awaiting ${level2?.managerName || 'manager'}`
        });
      }

      // Level 3
      const level3 = ticket.approval?.level3;
      const l3History = findApprovalFromHistory(3);
      const showL3 = level3 || currentApprovalLevelFromStatus >= 3 || maxApprovalLevelFromHistory >= 3;
      if (showL3) {
        const l3Status = level3?.status;
        const l3StepStatus = getStepStatus(3, l3Status, l3History);
        steps.push({
          id: 'approval-l3',
          label: 'L3 Approval',
          status: l3StepStatus,
          timestamp: level3?.actionTimestamp || l3History.timestamp,
          description: l3StepStatus === 'completed' 
            ? `Approved${level3?.approverName || l3History.approverName ? ` by ${level3?.approverName || l3History.approverName}` : ''}`
            : l3StepStatus === 'rejected'
            ? `Rejected by ${level3?.approverName || level3?.managerName || 'manager'}`
            : `Awaiting ${level3?.managerName || 'manager'}`
        });
      }
    }

    // Check if rejected or cancelled
    const isRejected = ticket.status === 'Rejected';
    const isCancelled = ticket.status === 'Cancelled';
    
    if (isRejected) {
      // Find who rejected from history
      const rejectHistory = ticket.history?.find(h => 
        h.action.toLowerCase().includes('rejected') || 
        h.newStatus === 'Rejected'
      );
      const rejectedBy = rejectHistory?.performedBy || rejectHistory?.by || 
                         ticket.approval?.level1?.approverName || 
                         ticket.approval?.level2?.approverName || 
                         ticket.approval?.level3?.approverName;
      
      // Add final Rejected step
      steps.push({
        id: 'rejected',
        label: 'Rejected',
        status: 'rejected',
        timestamp: rejectHistory?.timestamp || ticket.updatedAt,
        description: rejectedBy ? `Rejected by ${rejectedBy}` : 'Request rejected'
      });
      return steps; // Don't show further steps if rejected
    }

    if (isCancelled) {
      // Find who cancelled from history
      const cancelHistory = ticket.history?.find(h => 
        h.action.toLowerCase().includes('cancelled') || 
        h.newStatus === 'Cancelled'
      );
      const cancelledBy = cancelHistory?.performedBy || cancelHistory?.by || ticket.closedBy;
      
      // Add final Cancelled step
      steps.push({
        id: 'cancelled',
        label: 'Cancelled',
        status: 'rejected',
        timestamp: cancelHistory?.timestamp || ticket.updatedAt,
        description: cancelledBy ? `Cancelled by ${cancelledBy}` : 'Request cancelled'
      });
      return steps; // Don't show further steps if cancelled
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
        label: 'Routed',
        status: routedStatus,
        timestamp: ticket.processing?.routedAt,
        description: deptName 
          ? `${deptName} Department${queueName ? ` - ${queueName}` : ''}`
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
      
      // Get assignment info
      const assigneeName = wasReopened && firstAssignment 
        ? (firstAssignment.details?.match(/to\s+([^(]+?)(?:\s*\(|\s*-|$)/)?.[1]?.trim() || 'IT specialist')
        : ticket.assignment?.assignedToName;
      
      let description = 'Awaiting';
      if (wasReopened && firstAssignment) {
        description = `Was: ${assigneeName}`;
      } else if (isCurrentlyReopened && !ticket.assignment?.assignedToId && assignmentHistory) {
        const match = assignmentHistory.details?.match(/to\s+([^(]+)\s*\(/);
        const previousAssignee = match ? match[1].trim() : 'IT specialist';
        description = `Was: ${previousAssignee}`;
      } else if (ticket.assignment?.assignedToName) {
        description = ticket.assignment.assignedToName;
      }
      
      // Determine step status
      let assignedStatus: 'completed' | 'active' | 'pending' = 'completed';
      if (!wasReopened && !isCurrentlyReopened) {
        if (ticket.status === 'Routed' || ticket.status === 'In Queue') {
          assignedStatus = 'pending';
        } else if (ticket.status === 'Assigned') {
          assignedStatus = 'active';
        }
      }
      
      steps.push({
        id: 'assigned',
        label: wasReopened ? 'Assigned¹' : 'Assigned',
        status: assignedStatus,
        timestamp: firstAssignment?.timestamp || ticket.assignment?.assignedAt || assignmentHistory?.timestamp,
        description
      });
    }

    // Step 7: In Progress (first cycle)
    if (wasInProgress ||
        ['In Progress', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
      const inProgressHistory = findHistoryEntry('in progress') || findHistoryEntry('working');
      
      let status: 'completed' | 'active' | 'pending' = 'completed';
      let description = 'Done';
      
      if (!wasReopened && !isCurrentlyReopened) {
        if (ticket.status === 'Assigned') {
          status = 'pending';
          description = 'Awaiting';
        } else if (ticket.status === 'In Progress') {
          status = 'active';
          description = ticket.progressStatus || 'Working';
        }
      }
      
      steps.push({
        id: 'in-progress',
        label: wasReopened ? 'Progress¹' : 'In Progress',
        status,
        timestamp: inProgressHistory?.timestamp,
        description
      });
    }

    // Step 8: Closed (first cycle)
    if (wasClosed || (!wasReopened && ['Closed', 'Auto-Closed'].includes(ticket.status))) {
      const closedHistory = findHistoryEntry('closed');
      steps.push({
        id: 'closed',
        label: wasReopened ? 'Closed¹' : 'Closed',
        status: 'completed',
        timestamp: ticket.closedAt || closedHistory?.timestamp,
        description: wasReopened ? 'Was closed' : (ticket.status === 'Auto-Closed' ? 'Auto' : 'Closed')
      });
    }

    // Step 9: Reopened (show if ticket was ever reopened)
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
        description: isCurrentlyReopened ? 'Awaiting reassignment' : 'Was reopened'
      });
    }

    // Step 10: Reassigned (show for reopened tickets that have been reassigned)
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
        description: `To ${ticket.assignment.assignedToName}`
      });
    }

    // Step 11: Work In Progress (After Reopen)
    if (wasReopened && !isCurrentlyReopened && ['In Progress', 'Confirmed', 'Closed'].includes(ticket.status)) {
      steps.push({
        id: 'in-progress-reopen',
        label: 'In Progress',
        status: ticket.status === 'In Progress' ? 'active' : 'completed',
        timestamp: ticket.updatedAt,
        description: ticket.progressStatus || 'Working'
      });
    }

    // Step 12: Closed (After Reopen)
    if (wasReopened && !isCurrentlyReopened && ['Closed', 'Auto-Closed'].includes(ticket.status)) {
      steps.push({
        id: 'closed-reopen',
        label: 'Closed',
        status: 'completed',
        timestamp: ticket.closedAt || ticket.updatedAt,
        description: 'Closed'
      });
    }

    return steps;
  };

  const steps = resolveSteps();

  const getStepIcon = (status: Step['status'], stepId: string) => {
    // Special icon for reopened step
    if (stepId === 'reopened') {
      return <RotateCcw className="h-3.5 w-3.5 text-white" />;
    }
    
    switch (status) {
      case 'completed':
        return <Check className="h-3.5 w-3.5 text-white" />;
      case 'active':
        return <Circle className="h-3.5 w-3.5 text-white fill-current" />;
      case 'rejected':
        return <X className="h-3.5 w-3.5 text-white" />;
      default:
        return <Circle className="h-2.5 w-2.5 text-gray-400" />;
    }
  };

  const getStepColor = (status: Step['status'], stepId: string) => {
    // Special color for reopened step
    if (stepId === 'reopened') {
      return 'bg-amber-500 border-amber-500 ring-4 ring-amber-100 dark:ring-amber-900/30';
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500';
      case 'active':
        return 'bg-blue-500 border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/30';
      case 'rejected':
        return 'bg-red-500 border-red-500';
      default:
        return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  };

  const getLineColor = (currentStatus: Step['status'], nextStatus: Step['status']) => {
    // If current step is completed and next is also completed, show green
    if (currentStatus === 'completed' && nextStatus === 'completed') {
      return 'bg-green-500';
    }
    // If current is completed and next is active, show blue gradient or just blue
    if (currentStatus === 'completed' && nextStatus === 'active') {
      return 'bg-gradient-to-r from-green-500 to-blue-500';
    }
    // If current is active, show blue
    if (currentStatus === 'active') {
      return 'bg-blue-500';
    }
    // If current is rejected, show red
    if (currentStatus === 'rejected') {
      return 'bg-red-500';
    }
    // Default pending state
    return 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <div className="bg-gradient-to-r from-gray-50/80 to-white dark:from-gray-900/40 dark:to-gray-900/20 border-y border-gray-200 dark:border-gray-700 p-4">
      {/* Section Title */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-brand-navy dark:text-gray-100 uppercase tracking-wide">Ticket Progress</h3>
      </div>
      
      {/* Scrollable container for steps */}
      <TooltipProvider>
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start gap-0" style={{ minWidth: `${Math.max(steps.length * 120, 100)}px` }}>
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start flex-1 relative min-w-[100px]">
                {/* Connecting Line - positioned behind */}
                {index < steps.length - 1 && (
                  <div className="absolute top-[17px] left-[calc(50%+18px)] right-[calc(-50%+18px)] h-0.5 pointer-events-none">
                    <div className={cn(
                      'h-full w-full',
                      getLineColor(step.status, steps[index + 1].status)
                    )} />
                  </div>
                )}

                {/* Step Content */}
                <div className="flex flex-col items-center w-full">
                  {/* Icon */}
                  <div className={cn(
                    'w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-sm relative z-10 bg-white dark:bg-gray-800',
                    getStepColor(step.status, step.id)
                  )}>
                    {getStepIcon(step.status, step.id)}
                  </div>

                  {/* Label and Info */}
                  <div className="mt-3 text-center px-2">
                    <div className={cn(
                      'text-xs font-semibold whitespace-nowrap mb-1',
                      step.id === 'reopened' ? 'text-amber-700 dark:text-amber-400' :
                      step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                      step.status === 'active' ? 'text-blue-700 dark:text-blue-400' :
                      step.status === 'rejected' ? 'text-red-700 dark:text-red-400' :
                      'text-gray-500 dark:text-gray-500'
                    )}>
                      {step.label}
                    </div>
                    {step.description && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-1 max-w-[100px] truncate cursor-help">
                            {step.description}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{step.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {step.timestamp && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(step.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
