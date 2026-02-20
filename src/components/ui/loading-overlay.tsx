import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50',
        fullScreen ? 'fixed inset-0' : 'absolute inset-0',
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
        <Loader2 className="h-8 w-8 text-brand-green animate-spin" />
        <p className="text-sm font-medium text-brand-navy dark:text-gray-100">
          {message}
        </p>
      </div>
    </div>
  );
}
