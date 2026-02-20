import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, Tag, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { HelpdeskTicket } from '@/types/helpdesk';
import { cn } from '@/lib/utils';

interface TicketSummaryHeaderProps {
  ticket: HelpdeskTicket;
}

export const TicketSummaryHeader = React.memo<TicketSummaryHeaderProps>(({ ticket }) => {
  const statusConfig = useMemo(() => {
    const configs = {
      'Open': {
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'
      },
      'In Progress': {
        icon: <Clock className="h-3.5 w-3.5" />,
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
      },
      'Resolved': {
        icon: <CheckCircle className="h-3.5 w-3.5" />,
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800'
      },
      'Closed': {
        icon: <XCircle className="h-3.5 w-3.5" />,
        className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800'
      },
      'Cancelled': {
        icon: <XCircle className="h-3.5 w-3.5" />,
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
      }
    };
    return configs[ticket.status];
  }, [ticket.status]);

  const urgencyConfig = useMemo(() => {
    const configs: Record<string, { className: string }> = {
      'Low': { className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-700' },
      'Medium': { className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-700' },
      'High': { className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-700' },
      'Critical': { className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-700' }
    };
    return configs[ticket.urgency];
  }, [ticket.urgency]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20 p-4 -mx-6 -mt-6 mb-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Badge - Most Prominent */}
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border shadow-sm",
            statusConfig?.className
          )}
        >
          {statusConfig?.icon}
          {ticket.status}
        </Badge>

        {/* Urgency Badge */}
        <Badge
          variant="outline"
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border",
            urgencyConfig?.className
          )}
        >
          {ticket.urgency} Priority
        </Badge>

        {/* Category Badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-700"
        >
          <Tag className="h-3 w-3" />
          {ticket.requestType}
        </Badge>

        {/* Assigned To Badge */}
        {ticket.assignedTo && (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-700"
          >
            <User className="h-3 w-3" />
            Assigned: {ticket.assignedTo}
          </Badge>
        )}
      </div>
    </div>
  );
});

TicketSummaryHeader.displayName = 'TicketSummaryHeader';
