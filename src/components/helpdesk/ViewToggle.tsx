import { LayoutList, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'list' | 'table';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-2 px-3 py-2',
          viewMode === 'list'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        onClick={() => onViewModeChange('list')}
      >
        <LayoutList className="h-4 w-4" />
        <span className="text-sm font-medium">List View</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'gap-2 px-3 py-2',
          viewMode === 'table'
            ? 'bg-white dark:bg-gray-700 shadow-sm'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
        onClick={() => onViewModeChange('table')}
      >
        <Table className="h-4 w-4" />
        <span className="text-sm font-medium">Table View</span>
      </Button>
    </div>
  );
}
