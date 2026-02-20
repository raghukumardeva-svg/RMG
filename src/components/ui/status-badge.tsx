import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 'approved' | 'pending' | 'rejected' | 'draft' | 'completed' | 'cancelled' | 
                  'in-progress' | 'submitted' | 'closed' | 'open' | 'assigned' | 'on-hold';

type PriorityType = 'high' | 'medium' | 'low' | 'critical';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusColorMap: Record<string, string> = {
  // Positive statuses
  'approved': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  'completed': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  'closed': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  
  // Warning/Pending statuses
  'pending': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  'in-progress': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  'assigned': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  'on-hold': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  
  // Info/Draft statuses
  'draft': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  'submitted': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  'open': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  
  // Negative statuses
  'rejected': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  'cancelled': 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30',
};

/**
 * Standardized status badge with consistent colors across the application.
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '-');
  const colorClass = statusColorMap[normalizedStatus] || statusColorMap['draft'];
  
  const displayText = status
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        colorClass,
        className
      )}
    >
      {displayText}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: PriorityType | string;
  className?: string;
}

const priorityColorMap: Record<string, string> = {
  'critical': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  'high': 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30',
  'medium': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  'low': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
};

/**
 * Standardized priority badge with consistent colors across the application.
 */
export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const normalizedPriority = priority.toLowerCase();
  const colorClass = priorityColorMap[normalizedPriority] || priorityColorMap['medium'];
  
  const displayText = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        colorClass,
        className
      )}
    >
      {displayText}
    </Badge>
  );
}

export { StatusBadge as default };
