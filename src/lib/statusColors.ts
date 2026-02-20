/**
 * Standardized Status Color System for RMG Portal
 * Provides consistent color schemes across the application
 */

export const STATUS_COLORS = {
  success: {
    bg: 'bg-green-500/10 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500/20',
    badge: 'bg-green-500 text-white',
    icon: 'text-green-600 dark:text-green-400',
    hover: 'hover:bg-green-500/20',
  },
  warning: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500/20',
    badge: 'bg-amber-500 text-white',
    icon: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:bg-amber-500/20',
  },
  error: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500/20',
    badge: 'bg-red-500 text-white',
    icon: 'text-red-600 dark:text-red-400',
    hover: 'hover:bg-red-500/20',
  },
  info: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-500/20',
    badge: 'bg-blue-500 text-white',
    icon: 'text-blue-600 dark:text-blue-400',
    hover: 'hover:bg-blue-500/20',
  },
  neutral: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20',
    badge: 'bg-slate-500 text-white',
    icon: 'text-slate-600 dark:text-slate-400',
    hover: 'hover:bg-slate-500/20',
  },
  pending: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500/20',
    badge: 'bg-orange-500 text-white',
    icon: 'text-orange-600 dark:text-orange-400',
    hover: 'hover:bg-orange-500/20',
  },
  approved: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    badge: 'bg-emerald-500 text-white',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:bg-emerald-500/20',
  },
  rejected: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-500/20',
    badge: 'bg-rose-500 text-white',
    icon: 'text-rose-600 dark:text-rose-400',
    hover: 'hover:bg-rose-500/20',
  },
  cancelled: {
    bg: 'bg-gray-500/10 dark:bg-gray-500/20',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-500/20',
    badge: 'bg-gray-500 text-white',
    icon: 'text-gray-600 dark:text-gray-400',
    hover: 'hover:bg-gray-500/20',
  },
  active: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-500/20',
    badge: 'bg-cyan-500 text-white',
    icon: 'text-cyan-600 dark:text-cyan-400',
    hover: 'hover:bg-cyan-500/20',
  },
  inactive: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-400',
    border: 'border-slate-500/20',
    badge: 'bg-slate-500 text-white',
    icon: 'text-slate-600 dark:text-slate-400',
    hover: 'hover:bg-slate-500/20',
  },
} as const;

export type StatusType = keyof typeof STATUS_COLORS;

/**
 * Get status colors by status name
 * @param status - The status type
 * @returns Color classes for the status
 */
export const getStatusColors = (status: StatusType | string) => {
  const normalizedStatus = status.toLowerCase() as StatusType;
  return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.neutral;
};

/**
 * Map common status values to status types
 */
export const STATUS_MAP: Record<string, StatusType> = {
  // Leave statuses
  'pending': 'pending',
  'approved': 'approved',
  'rejected': 'rejected',
  'cancelled': 'cancelled',

  // Attendance statuses
  'present': 'success',
  'absent': 'error',
  'half-day': 'warning',
  'work-from-home': 'info',
  'on-leave': 'neutral',

  // Employee statuses
  'active': 'active',
  'inactive': 'inactive',
  'probation': 'warning',
  'terminated': 'error',

  // Ticket statuses
  'open': 'info',
  'in-progress': 'warning',
  'paused': 'pending',
  'on-hold': 'pending',
  'resolved': 'success',
  'closed': 'neutral',
  'completed---awaiting-it-closure': 'approved',
  'routed': 'approved',
  'completed': 'approved',
  'auto-closed': 'neutral',

  // Approval statuses
  'pending-level-1-approval': 'pending',
  'pending-level-2-approval': 'pending',
  'pending-level-3-approval': 'pending',

  // Priority levels
  'low': 'neutral',
  'medium': 'warning',
  'high': 'error',
  'critical': 'error',

  // Generic statuses
  'success': 'success',
  'error': 'error',
  'warning': 'warning',
  'info': 'info',
};

/**
 * Get status type from a status string
 * @param status - The status string
 * @returns Mapped status type
 */
export const getStatusType = (status: string): StatusType => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '-');
  return STATUS_MAP[normalizedStatus] || 'neutral';
};

/**
 * Helper function to create status badge className
 * @param status - The status string
 * @returns Combined className string for badge
 */
export const getStatusBadgeClass = (status: string): string => {
  const statusType = getStatusType(status);
  const colors = getStatusColors(statusType);
  return `${colors.bg} ${colors.text} ${colors.border} border px-3 py-1 rounded-full text-xs font-semibold`;
};

/**
 * Helper function to create status card className
 * @param status - The status string
 * @returns Combined className string for card
 */
export const getStatusCardClass = (status: string): string => {
  const statusType = getStatusType(status);
  const colors = getStatusColors(statusType);
  return `${colors.bg} ${colors.border} border rounded-xl p-4 ${colors.hover}`;
};
