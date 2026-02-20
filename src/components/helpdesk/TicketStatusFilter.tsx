import { Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type FilterMode = 'active' | 'history';

interface TicketStatusFilterProps {
  filterMode: FilterMode;
  onFilterModeChange: (mode: FilterMode) => void;
  activeCount?: number;
  historyCount?: number;
}

export function TicketStatusFilter({
  filterMode,
  onFilterModeChange,
  activeCount = 0,
  historyCount = 0
}: TicketStatusFilterProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-2 px-3 py-2',
          filterMode === 'active'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        onClick={() => onFilterModeChange('active')}
      >
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Active</span>
        <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
          {activeCount}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-2 px-3 py-2',
          filterMode === 'history'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        onClick={() => onFilterModeChange('history')}
      >
        <History className="h-4 w-4" />
        <span className="text-sm font-medium">History</span>
        <span className="ml-1 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
          {historyCount}
        </span>
      </Button>
    </div>
  );
}
