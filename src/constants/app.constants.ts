/**
 * Application-wide constants for RMG Portal
 * Centralizes magic numbers and configuration values for better maintainability
 */

// ============================================================================
// FILE UPLOAD CONSTANTS
// ============================================================================
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (20MB) */
  MAX_SIZE: 20 * 1024 * 1024,
  /** Maximum file size in MB for display */
  MAX_SIZE_MB: 20,
  /** Accepted image formats */
  IMAGE_FORMATS: '.png,.jpg,.jpeg',
  /** Accepted document formats */
  DOCUMENT_FORMATS: '.pdf,.doc,.docx',
  /** All accepted file formats */
  ALL_FORMATS: '.png,.jpg,.jpeg,.pdf,.doc,.docx',
} as const;

// ============================================================================
// PAGINATION CONSTANTS
// ============================================================================
export const PAGINATION = {
  /** Default items per page */
  DEFAULT_PAGE_SIZE: 10,
  /** Items per page options */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  /** Maximum items to fetch at once */
  MAX_ITEMS: 1000,
} as const;

// ============================================================================
// DATE/TIME CONSTANTS
// ============================================================================
export const TIME = {
  /** Milliseconds in a second */
  SECOND: 1000,
  /** Milliseconds in a minute */
  MINUTE: 60 * 1000,
  /** Milliseconds in an hour */
  HOUR: 60 * 60 * 1000,
  /** Milliseconds in a day */
  DAY: 24 * 60 * 60 * 1000,
  /** Milliseconds in a week */
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// POLLING/REFRESH INTERVALS
// ============================================================================
export const INTERVALS = {
  /** Notification polling interval (30 seconds) */
  NOTIFICATION_POLL: 30 * 1000,
  /** Dashboard data refresh (1 minute) */
  DASHBOARD_REFRESH: 60 * 1000,
  /** Real-time updates polling (5 seconds) */
  REALTIME_POLL: 5 * 1000,
  /** Auto-save draft interval (30 seconds) */
  AUTO_SAVE: 30 * 1000,
} as const;

// ============================================================================
// UI/UX CONSTANTS
// ============================================================================
export const UI = {
  /** Toast notification duration (milliseconds) */
  TOAST_DURATION: 3000,
  /** Long toast duration for important messages */
  TOAST_DURATION_LONG: 5000,
  /** Debounce delay for search inputs (milliseconds) */
  SEARCH_DEBOUNCE: 300,
  /** Animation duration (milliseconds) */
  ANIMATION_DURATION: 200,
  /** Skeleton loader count for lists */
  SKELETON_COUNT: 5,
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================
export const VALIDATION = {
  /** Minimum password length */
  PASSWORD_MIN_LENGTH: 8,
  /** Maximum password length */
  PASSWORD_MAX_LENGTH: 128,
  /** Minimum username length */
  USERNAME_MIN_LENGTH: 3,
  /** Maximum username length */
  USERNAME_MAX_LENGTH: 50,
  /** Maximum text area length */
  TEXTAREA_MAX_LENGTH: 5000,
  /** Maximum title length */
  TITLE_MAX_LENGTH: 200,
  /** Maximum description length */
  DESCRIPTION_MAX_LENGTH: 2000,
} as const;

// ============================================================================
// TICKET CONSTANTS
// ============================================================================
export const TICKET = {
  /** Priority levels */
  PRIORITIES: ['Low', 'Medium', 'High', 'Critical'] as const,
  /** Statuses */
  STATUSES: [
    'Draft',
    'Submitted',
    'Pending Approval',
    'Approved',
    'Rejected',
    'In Queue',
    'Assigned',
    'In Progress',
    'Completed',
    'Cancelled',
  ] as const,
  /** Default priority */
  DEFAULT_PRIORITY: 'Medium' as const,
  /** Auto-archive after days */
  AUTO_ARCHIVE_DAYS: 90,
} as const;

// ============================================================================
// LEAVE CONSTANTS
// ============================================================================
export const LEAVE = {
  /** Leave types */
  TYPES: ['Sick Leave', 'Casual Leave', 'Paid Leave', 'Maternity Leave', 'Paternity Leave'] as const,
  /** Maximum leave days per request */
  MAX_DAYS_PER_REQUEST: 30,
  /** Minimum leave days */
  MIN_DAYS: 1,
  /** Maximum casual leave per year */
  MAX_CASUAL_LEAVE: 12,
  /** Maximum sick leave per year */
  MAX_SICK_LEAVE: 10,
} as const;

// ============================================================================
// ATTENDANCE CONSTANTS
// ============================================================================
export const ATTENDANCE = {
  /** Work hours per day */
  HOURS_PER_DAY: 8,
  /** Minutes per day */
  MINUTES_PER_DAY: 480,
  /** Late arrival threshold (minutes) */
  LATE_THRESHOLD: 15,
  /** Early departure threshold (minutes) */
  EARLY_DEPARTURE_THRESHOLD: 15,
  /** Half day hours */
  HALF_DAY_HOURS: 4,
} as const;

// ============================================================================
// RESOURCE ALLOCATION CONSTANTS
// ============================================================================
export const ALLOCATION = {
  /** Minimum allocation percentage */
  MIN_PERCENTAGE: 0,
  /** Maximum allocation percentage */
  MAX_PERCENTAGE: 100,
  /** Full allocation */
  FULL_ALLOCATION: 100,
  /** Half allocation */
  HALF_ALLOCATION: 50,
  /** Quarter allocation */
  QUARTER_ALLOCATION: 25,
} as const;

// ============================================================================
// API CONSTANTS
// ============================================================================
export const API = {
  /** Request timeout (milliseconds) */
  TIMEOUT: 30 * 1000,
  /** Retry attempts for failed requests */
  RETRY_ATTEMPTS: 3,
  /** Retry delay (milliseconds) */
  RETRY_DELAY: 1000,
  /** Rate limit requests per minute */
  RATE_LIMIT: 60,
} as const;

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'rmg_auth_token',
  USER_DATA: 'rmg_user_data',
  THEME: 'rmg_theme',
  LANGUAGE: 'rmg_language',
  DRAFT_PREFIX: 'rmg_draft_',
  RECENT_SEARCHES: 'rmg_recent_searches',
  SIDEBAR_STATE: 'rmg_sidebar_state',
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================
export const PATTERNS = {
  /** Email validation pattern */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Phone number pattern (10 digits) */
  PHONE: /^[0-9]{10}$/,
  /** Employee ID pattern */
  EMPLOYEE_ID: /^EMP[0-9]{4}$/,
  /** Ticket number pattern */
  TICKET_NUMBER: /^TKT[0-9]{4}$/,
  /** URL pattern */
  URL: /^https?:\/\/.+/,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid 10-digit phone number.',
  INVALID_FILE: 'Invalid file format or size.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
  SUBMITTED: 'Submitted successfully',
  SENT: 'Sent successfully',
} as const;

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================
export const ROLES = {
  ADMIN: 'Admin',
  HR: 'HR',
  RMG: 'RMG',
  FINANCE: 'Finance',
  IT_ADMIN: 'IT Admin',
  IT_SPECIALIST: 'IT Specialist',
  EMPLOYEE: 'Employee',
  L1_APPROVER: 'L1 Approver',
  L2_APPROVER: 'L2 Approver',
} as const;

export const PERMISSIONS = {
  CREATE_EMPLOYEE: 'create:employee',
  UPDATE_EMPLOYEE: 'update:employee',
  DELETE_EMPLOYEE: 'delete:employee',
  VIEW_EMPLOYEE: 'view:employee',
  APPROVE_LEAVE: 'approve:leave',
  APPROVE_TICKET: 'approve:ticket',
  ASSIGN_TICKET: 'assign:ticket',
  MANAGE_ALLOCATIONS: 'manage:allocations',
  VIEW_REPORTS: 'view:reports',
} as const;

// ============================================================================
// CHART COLORS
// ============================================================================
export const CHART_COLORS = {
  PRIMARY: '#10b981',
  SECONDARY: '#3b82f6',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#06b6d4',
  LIGHT: '#f3f4f6',
  DARK: '#1f2937',
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type TicketPriority = typeof TICKET.PRIORITIES[number];
export type TicketStatus = typeof TICKET.STATUSES[number];
export type LeaveType = typeof LEAVE.TYPES[number];
export type Role = typeof ROLES[keyof typeof ROLES];
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
