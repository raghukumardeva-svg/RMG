import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        className
      )}
    />
  );
}

export function SkeletonCard({ count = 3, className }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          className={cn('border-brand-light-gray dark:border-gray-700', className)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header badges */}
              <div className="flex items-center gap-2">
                <SkeletonLine className="h-5 w-24" />
                <SkeletonLine className="h-5 w-16" />
                <SkeletonLine className="h-5 w-20" />
              </div>

              {/* Title */}
              <SkeletonLine className="h-6 w-3/4" />

              {/* Description */}
              <div className="space-y-2">
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-5/6" />
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-24" />
                <SkeletonLine className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
