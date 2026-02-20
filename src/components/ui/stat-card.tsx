
import { cn } from '@/lib/utils';
import { COMPONENTS, TYPOGRAPHY, COLORS } from '@/constants/design-system';
import { Card, CardContent } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
}

const iconColorMap = {
  primary: 'bg-brand-green/10 text-brand-green',
  success: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  error: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400',
  info: 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
};

/**
 * Standardized stat/KPI card for dashboards.
 * Use this for displaying metrics consistently across all modules.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'primary',
  trend,
  subtitle,
  onClick,
  className,
}: StatCardProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Card 
      className={cn(
        COMPONENTS.card.base,
        onClick && COMPONENTS.card.interactive,
        className
      )}
    >
      <Wrapper
        onClick={onClick}
        className={cn(
          'w-full text-left',
          onClick && 'focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 rounded-lg'
        )}
      >
        <CardContent className="p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className={COMPONENTS.statCard.label}>{title}</p>
              <p className={cn(COMPONENTS.statCard.value, 'mt-2 truncate')}>{value}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <span className={cn(
                    'text-xs font-medium',
                    trend.isPositive !== false ? COLORS.success : COLORS.error
                  )}>
                    {trend.isPositive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
                  </span>
                  {trend.label && (
                    <span className="text-xs text-muted-foreground">{trend.label}</span>
                  )}
                </div>
              )}
              {subtitle && (
                <p className={cn(TYPOGRAPHY.small, 'mt-1')}>{subtitle}</p>
              )}
            </div>
            <div className={cn(
              COMPONENTS.statCard.iconContainer,
              iconColorMap[iconColor]
            )}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Wrapper>
    </Card>
  );
}

interface MiniStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

/**
 * Compact stat card for inline statistics.
 */
export function MiniStatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'primary',
  className,
}: MiniStatCardProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg bg-muted/50',
      className
    )}>
      {Icon && (
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          iconColorMap[iconColor]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-brand-navy dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export { StatCard as default };
