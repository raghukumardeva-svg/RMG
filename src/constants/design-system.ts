/**
 * Design System Constants
 * 
 * This file contains all standardized design tokens for the RMG Portal.
 * Use these constants throughout the application to ensure UI consistency.
 */

// =============================================================================
// LAYOUT & SPACING
// =============================================================================

export const LAYOUT = {
  /** Standard page container with padding and spacing */
  pageContainer: 'container mx-auto p-4 md:p-6 space-y-6',
  /** Section spacing within pages */
  sectionSpacing: 'space-y-6',
  /** Grid gaps for dashboard layouts */
  gridGap: 'gap-4 md:gap-6',
  /** Card internal padding */
  cardPadding: 'p-4 md:p-6',
  /** Standard content max width */
  maxWidth: 'max-w-7xl',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const TYPOGRAPHY = {
  /** Page main title */
  pageTitle: 'text-xl md:text-2xl font-semibold text-brand-navy dark:text-white',
  /** Page subtitle/description */
  pageSubtitle: 'text-sm text-muted-foreground',
  /** Section headers within a page */
  sectionTitle: 'text-lg font-semibold text-brand-navy dark:text-white',
  /** Card titles */
  cardTitle: 'text-base md:text-lg font-semibold text-brand-navy dark:text-white',
  /** Card descriptions */
  cardDescription: 'text-sm text-muted-foreground',
  /** KPI/Stat large values */
  statValue: 'text-2xl md:text-3xl font-bold',
  /** Stat labels */
  statLabel: 'text-sm text-muted-foreground',
  /** Body text */
  body: 'text-sm text-brand-slate dark:text-gray-300',
  /** Small/helper text */
  small: 'text-xs text-muted-foreground',
} as const;

// =============================================================================
// COLORS (Use these instead of hardcoded Tailwind colors)
// =============================================================================

export const COLORS = {
  // Brand colors
  primary: 'text-brand-green',
  primaryBg: 'bg-brand-green',
  primaryHover: 'hover:bg-brand-green-dark',
  primaryLight: 'bg-brand-green/10',
  
  // Status colors
  success: 'text-emerald-600 dark:text-emerald-400',
  successBg: 'bg-emerald-500',
  successLight: 'bg-emerald-50 dark:bg-emerald-500/10',
  
  warning: 'text-amber-600 dark:text-amber-400',
  warningBg: 'bg-amber-500',
  warningLight: 'bg-amber-50 dark:bg-amber-500/10',
  
  error: 'text-red-600 dark:text-red-400',
  errorBg: 'bg-red-500',
  errorLight: 'bg-red-50 dark:bg-red-500/10',
  
  info: 'text-blue-600 dark:text-blue-400',
  infoBg: 'bg-blue-500',
  infoLight: 'bg-blue-50 dark:bg-blue-500/10',
  
  // Neutral colors
  muted: 'text-muted-foreground',
  mutedBg: 'bg-muted',
} as const;

// =============================================================================
// AVATAR GRADIENTS (Standardized)
// =============================================================================

export const AVATAR_GRADIENTS = [
  'from-brand-green to-emerald-600',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-orange-500 to-red-600',
  'from-cyan-500 to-blue-600',
  'from-rose-500 to-pink-600',
] as const;

/** Get consistent avatar gradient based on name */
export const getAvatarGradient = (name: string): string => {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return `bg-gradient-to-br ${AVATAR_GRADIENTS[index]}`;
};

/** Get initials from name */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// =============================================================================
// COMPONENT STYLES
// =============================================================================

export const COMPONENTS = {
  // Cards
  card: {
    base: 'rounded-lg border border-brand-light-gray dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    interactive: 'hover:shadow-md hover:border-brand-green/50 transition-all duration-200 cursor-pointer',
  },
  
  // Stat Cards
  statCard: {
    container: 'rounded-lg border border-brand-light-gray dark:border-gray-700 bg-white dark:bg-gray-900 p-4 md:p-6',
    iconContainer: 'w-12 h-12 rounded-lg flex items-center justify-center',
    value: 'text-2xl md:text-3xl font-bold text-brand-navy dark:text-white',
    label: 'text-sm text-muted-foreground',
  },
  
  // Buttons
  button: {
    primary: 'bg-brand-green text-white hover:bg-brand-green-dark',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-brand-navy dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
    outline: 'border border-brand-light-gray dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    icon: 'h-9 w-9 p-0',
  },
  
  // Tables
  table: {
    header: 'bg-muted/50',
    row: 'hover:bg-muted/50 transition-colors',
    cell: 'px-4 py-3',
  },
  
  // Forms
  form: {
    label: 'text-sm font-medium text-brand-navy dark:text-white',
    input: 'h-10 rounded-md border border-input bg-background px-3 py-2 text-sm',
    helperText: 'text-xs text-muted-foreground mt-1',
    errorText: 'text-xs text-red-500 mt-1',
  },
  
  // Modals/Dialogs
  dialog: {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  },
  
  // Sheets/Drawers
  sheet: {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-lg',
    xl: 'w-full sm:max-w-xl',
  },
  
  // Badges
  badge: {
    status: {
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      draft: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
      cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
    },
    priority: {
      high: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
      low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    },
  },
} as const;

// =============================================================================
// ICON SIZES (Standardized)
// =============================================================================

export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
  '2xl': 'h-10 w-10',
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const TRANSITIONS = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const SHADOWS = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  hover: 'hover:shadow-md',
  hoverLg: 'hover:shadow-lg',
} as const;

// =============================================================================
// RESPONSIVE BREAKPOINTS (for reference)
// =============================================================================

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
