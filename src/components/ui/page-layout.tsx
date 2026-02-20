import * as React from 'react';
import { cn } from '@/lib/utils';
import { LAYOUT, TYPOGRAPHY } from '@/constants/design-system';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized page container with consistent padding and spacing.
 * Use this as the root wrapper for all page content.
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn(LAYOUT.pageContainer, className)}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized page header with title, optional subtitle, and action buttons.
 * Use this at the top of every page for consistent headers.
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h1 className={TYPOGRAPHY.pageTitle}>{title}</h1>
        {subtitle && (
          <p className={cn(TYPOGRAPHY.pageSubtitle, 'mt-1')}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized section header for content sections within a page.
 */
export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h2 className={TYPOGRAPHY.sectionTitle}>{title}</h2>
        {subtitle && (
          <p className={cn(TYPOGRAPHY.small, 'mt-0.5')}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

interface ContentGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Responsive grid for dashboard cards and content.
 */
export function ContentGrid({ children, columns = 4, className }: ContentGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid', gridCols[columns], LAYOUT.gridGap, className)}>
      {children}
    </div>
  );
}

export { PageContainer as default };
