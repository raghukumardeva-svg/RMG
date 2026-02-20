import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'rejected';
  timestamp?: string;
  description?: string;
}

interface StepperTimelineProps {
  ticket: HelpdeskTicket;
}

export function StepperTimeline({ ticket }: StepperTimelineProps) {
  const resolveSteps = (): Step[] => {
    const steps: Step[] = [];

    // Step 1: Submitted (always show)
    steps.push({
      id: 'submitted',
      label: 'Submitted',
      status: 'completed',
      timestamp: ticket.createdAt,
      description: `by ${ticket.requesterName || ticket.userName}`
    });

    // Step 2-4: Approval Steps (only if required and not bypassed)
    if (ticket.approval && ticket.approval.required && !ticket.approval.bypassed) {
      const currentLevel = ticket.approval.currentLevel || 0;

      // Level 1
      const level1 = ticket.approval.level1;
      if (level1) {
        steps.push({
          id: 'approval-l1',
          label: 'Level-1 Approval',
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
          label: 'Level-2 Approval',
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
          label: 'Level-3 Approval',
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

    // Step 5: Routed to Department
    const hasRouting = ticket.status !== 'Submitted' && ticket.status !== 'Draft' &&
                      !ticket.status.includes('Pending Approval');
    if (hasRouting || ticket.status === 'Routed' || ticket.status === 'In Queue') {
      steps.push({
        id: 'routed',
        label: 'Routed to Department',
        status: ticket.status === 'Submitted' || ticket.status.includes('Pending Approval') ? 'pending' :
                ticket.status === 'Routed' || ticket.status === 'In Queue' ? 'active' : 'completed',
        timestamp: ticket.processing?.routedAt,
        description: ticket.processing ?
          `Routed to ${ticket.processing.specialistQueue}` :
          'Awaiting routing'
      });
    }

    // Step 6: Assigned
    if (ticket.assignment?.assignedTo ||
        ['Assigned', 'In Progress', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
      steps.push({
        id: 'assigned',
        label: 'Assigned',
        status: ticket.status === 'Routed' || ticket.status === 'In Queue' ? 'pending' :
                ticket.status === 'Assigned' ? 'active' : 'completed',
        timestamp: ticket.assignment?.assignedAt,
        description: ticket.assignment?.assignedToName ?
          `Assigned to ${ticket.assignment.assignedToName}` :
          'Awaiting assignment'
      });
    }

    // Step 7: In Progress
    if (['In Progress', 'Confirmed', 'Closed', 'Auto-Closed'].includes(ticket.status)) {
      steps.push({
        id: 'in-progress',
        label: 'In Progress',
        status: ticket.status === 'Assigned' ? 'pending' :
                ticket.status === 'In Progress' ? 'active' : 'completed',
        description: ticket.progressStatus || 'Work is ongoing'
      });
    }

    // Step 8: Closed
    if (['Closed', 'Auto-Closed'].includes(ticket.status)) {
      steps.push({
        id: 'closed',
        label: 'Closed',
        status: 'completed',
        timestamp: ticket.closedAt,
        description: ticket.status === 'Auto-Closed' ? 'Auto-closed' : 'Ticket closed'
      });
    }

    return steps;
  };

  const steps = resolveSteps();

  const getStepColor = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return 'border-green-500';
      case 'active':
        return 'border-blue-500';
      case 'rejected':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-semibold text-brand-navy dark:text-gray-100 mb-4">
        Ticket Flow
      </h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[10px] top-4 bottom-4 w-0.5 bg-gray-300 dark:bg-gray-700" />

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="relative flex gap-3">
              {/* Icon */}
              <div className={cn(
                'flex-shrink-0 z-10 w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 border-2',
                getStepColor(step.status)
              )}>
                {step.status === 'completed' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                {step.status === 'active' && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                {step.status === 'rejected' && <div className="w-2 h-2 rounded-full bg-red-500" />}
                {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-gray-300" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                    step.status === 'active' ? 'text-blue-700 dark:text-blue-400' :
                    step.status === 'rejected' ? 'text-red-700 dark:text-red-400' :
                    'text-gray-500 dark:text-gray-500'
                  )}>
                    {step.label}
                  </span>
                </div>
                
                {step.description && (
                  <p className="text-xs text-brand-slate dark:text-gray-400 mt-1">
                    {step.description}
                  </p>
                )}
                
                {step.timestamp && (
                  <p className="text-xs text-brand-slate dark:text-gray-500 mt-0.5">
                    {new Date(step.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
