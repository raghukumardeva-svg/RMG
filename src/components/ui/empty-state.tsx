
import { cn } from '@/lib/utils';
import { type LucideIcon, Inbox, Search, FileX, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error' | 'filter';
  className?: string;
}

const variantConfig = {
  default: {
    icon: Inbox,
    iconClass: 'text-muted-foreground',
  },
  search: {
    icon: Search,
    iconClass: 'text-muted-foreground',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  filter: {
    icon: FileX,
    iconClass: 'text-muted-foreground',
  },
};

/**
 * Standardized empty state component for tables, lists, and search results.
 */
export function EmptyState({
  icon: CustomIcon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      className
    )}>
      <div className={cn(
        'w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4'
      )}>
        <Icon className={cn('h-8 w-8', config.iconClass)} />
      </div>
      <h3 className="text-lg font-medium text-brand-navy dark:text-white mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="mt-4"
          variant="default"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * Standardized loading state with spinner.
 */
export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4',
      className
    )}>
      <div className="w-8 h-8 border-2 border-brand-green border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export { EmptyState as default };
