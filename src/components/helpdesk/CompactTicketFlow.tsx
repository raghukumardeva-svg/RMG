import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdesk';
import { CheckCircle2, Circle, Clock as ClockIcon } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  description?: string;
  duration?: string;
}

interface CompactTicketFlowProps {
  ticket: HelpdeskTicket;
}

export const CompactTicketFlow = React.memo<CompactTicketFlowProps>(({ ticket }) => {
  const calculateDuration = useCallback((start: string, end?: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - startTime;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  }, []);

  const steps = useMemo((): Step[] => {
    const resolvedSteps: Step[] = [];

    // Step 1: Created
    resolvedSteps.push({
      id: 'created',
      label: 'Ticket Created',
      status: 'completed',
      timestamp: ticket.createdAt,
      description: `by ${ticket.userName}`,
    });

    // Step 2: In Progress (if applicable)
    if (['In Progress', 'Resolved', 'Closed'].includes(ticket.status)) {
      const duration = ticket.updatedAt !== ticket.createdAt
        ? calculateDuration(ticket.createdAt, ticket.updatedAt)
        : undefined;

      resolvedSteps.push({
        id: 'in-progress',
        label: 'In Progress',
        status: ticket.status === 'In Progress' ? 'active' : 'completed',
        timestamp: ticket.updatedAt,
        description: ticket.assignedTo ? `Assigned to ${ticket.assignedTo}` : 'Processing',
        duration: duration && ticket.status !== 'In Progress' ? duration : undefined
      });
    }

    // Step 3: Resolved (if applicable)
    if (['Resolved', 'Closed'].includes(ticket.status)) {
      const duration = ticket.resolvedAt
        ? calculateDuration(ticket.createdAt, ticket.resolvedAt)
        : undefined;

      resolvedSteps.push({
        id: 'resolved',
        label: 'Resolved',
        status: ticket.status === 'Resolved' ? 'active' : 'completed',
        timestamp: ticket.resolvedAt,
        description: ticket.resolvedBy ? `by ${ticket.resolvedBy}` : 'Issue resolved',
        duration
      });
    }

    // Step 4: Closed (if applicable)
    if (ticket.status === 'Closed') {
      const duration = ticket.updatedAt
        ? calculateDuration(ticket.createdAt, ticket.updatedAt)
        : undefined;

      resolvedSteps.push({
        id: 'closed',
        label: 'Closed',
        status: 'completed',
        timestamp: ticket.updatedAt,
        description: 'Ticket closed',
        duration
      });
    }

    // Handle pending states
    if (ticket.status === 'Open') {
      resolvedSteps.push({
        id: 'pending',
        label: 'Awaiting Assignment',
        status: 'active',
        description: 'Waiting for IT support'
      });
    }

    return resolvedSteps;
  }, [ticket, calculateDuration]);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-3 group">
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div className="absolute left-[11px] top-7 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          )}

          {/* Step Icon */}
          <div className="relative flex-shrink-0 z-10">
            {step.status === 'completed' ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500 fill-green-50 dark:fill-green-950/30" />
            ) : step.status === 'active' ? (
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-500 fill-blue-50 dark:fill-blue-950/30 animate-pulse" />
            ) : (
              <Circle className="h-6 w-6 text-gray-300 dark:text-gray-600" />
            )}
          </div>

          {/* Step Content */}
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className={cn(
                "text-sm font-medium transition-colors",
                step.status === 'completed' && "text-gray-900 dark:text-gray-100",
                step.status === 'active' && "text-blue-700 dark:text-blue-400 font-semibold",
                step.status === 'pending' && "text-gray-500 dark:text-gray-500"
              )}>
                {step.label}
              </span>

              {step.duration && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  {step.duration}
                </span>
              )}
            </div>

            {step.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {step.description}
              </p>
            )}

            {step.timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
  );
});

CompactTicketFlow.displayName = 'CompactTicketFlow';
