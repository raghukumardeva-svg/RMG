import { Badge } from '@/components/ui/badge';
import { User, Tag } from 'lucide-react';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface WorkflowTicketSummaryHeaderProps {
  ticket: HelpdeskTicket;
}

export function WorkflowTicketSummaryHeader({ ticket }: WorkflowTicketSummaryHeaderProps) {

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-900/20 px-6 py-4 -mx-6 -mt-6 mb-6 animate-fade-in">
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Badge */}
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-700"
        >
          <Tag className="h-3 w-3" />
          {ticket.highLevelCategory} / {ticket.subCategory}
        </Badge>

        {/* Assigned To Badge */}
        {ticket.assignment?.assignedToName && (
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-700"
          >
            <User className="h-3 w-3" />
            Assigned: {ticket.assignment.assignedToName}
          </Badge>
        )}
      </div>
    </div>
  );
}
