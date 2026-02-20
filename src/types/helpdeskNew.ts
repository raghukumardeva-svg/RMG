// Helpdesk Workflow System Types
// Complete type definitions for IT, Facilities, and Finance helpdesk

export type HighLevelCategory = 'IT' | 'Facilities' | 'Finance';

export type TicketStatus = 
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Pending Approval L1'
  | 'Pending Approval L2'
  | 'Pending Approval L3'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Reopened'
  | 'Routed'
  | 'In Queue'
  | 'Assigned'
  | 'In Progress'
  | 'Paused'
  | 'On Hold'
  | 'Completed'
  | 'Confirmed'
  | 'Awaiting User Confirmation'
  | 'Closed'
  | 'Auto-Closed';

export type ProcessingQueue = 'IT' | 'Facilities' | 'Finance';

export type SpecialistQueue =
  // IT Queues
  | 'Hardware Team'
  | 'Software Team'
  | 'Network Team'
  | 'Identity Team'
  | 'Security Team'
  // Facilities Queues
  | 'Building Maintenance'
  | 'Furniture & Layout'
  | 'Housekeeping'
  | 'Physical Security'
  | 'Office Services'
  // Finance Queues
  | 'Expense Claims'
  | 'Reimbursements'
  | 'Travel Requests'
  | 'Invoice Processing'
  | 'Vendor Payments'
  | 'Payroll Queries';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ApprovalAction = 'Approve' | 'Approved' | 'Reject' | 'Rejected';

export type ProgressStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';

export interface SubCategoryConfig {
  requiresApproval: boolean;
  processingQueue: ProcessingQueue;
  specialistQueue: SpecialistQueue;
}

export interface CategoryMapping {
  [category: string]: {
    [subCategory: string]: SubCategoryConfig;
  };
}

export interface ApprovalLevel {
  level: 1 | 2 | 3;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  approverId?: string;
  approverName?: string;
  approverEmail?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  action?: ApprovalAction;
  remarks?: string;
  comments?: string; // Backend uses 'comments' instead of 'remarks'
  actionDate?: string;
  actionTimestamp?: string;
  timestamp?: string; // Backend uses 'timestamp' for approval time
  actionBy?: string;
}

export interface ApprovalFlow {
  required: boolean;
  bypassed: boolean;
  currentLevel: 0 | 1 | 2 | 3; // 0 = not started, 1-3 = approval levels
  level1?: ApprovalLevel;
  level2?: ApprovalLevel;
  level3?: ApprovalLevel;
  finalApprovalDate?: string;
  rejectionLevel?: 1 | 2 | 3;
  rejectionReason?: string;
}

export interface ProcessingRoute {
  processingQueue: ProcessingQueue;
  specialistQueue: SpecialistQueue;
  queue?: SpecialistQueue; // Alias for specialistQueue
  routedAt?: string;
  routedBy?: string;
}

export interface Assignment {
  assignedToId?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedToEmail?: string;
  assignedAt?: string;
  assignedBy?: string;
  assignedByName?: string;
  assignedByRole?: 'IT_ADMIN' | 'system';
  assignmentNotes?: string;
  queue?: SpecialistQueue;
}

export interface SLA {
  approvalSlaHours: number;
  processingSlaHours: number;
  approvalDeadline?: string;
  processingDeadline?: string;
  isOverdue: boolean;
  overdueBy?: number; // hours
}

export interface HistoryLog {
  timestamp: string;
  action: string;
  performedBy?: string;
  by?: string; // Backend uses 'by' instead of 'performedBy'
  performedByRole?: 'employee' | 'manager' | 'specialist' | 'system';
  details?: string;
  previousStatus?: TicketStatus;
  newStatus?: TicketStatus;
}

export interface ConversationMessage {
  id: string;
  sender: 'employee' | 'manager' | 'specialist' | 'itadmin' | 'system';
  senderName: string;
  senderEmail?: string;
  message: string;
  timestamp: string;
  attachments?: string[];
  type?: 'message' | 'status_update' | 'closing_note' | 'approval_note';
}

export interface DynamicField {
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'date' | 'boolean' | 'file';
}

export interface HelpdeskTicket {
  _id?: string;
  id: string;
  ticketNumber: string;

  // Requester Information
  userId: string;
  userName: string;
  requesterName?: string; // Alias for userName
  userEmail: string;
  userDepartment: string;

  // Ticket Classification (Module-driven architecture)
  module: HighLevelCategory; // Immutable after creation
  highLevelCategory: HighLevelCategory; // Alias for module (backward compatibility)
  subCategory: string;
  subject: string;
  description: string;
  urgency: UrgencyLevel;

  // Approval Workflow (Sequential action, parallel visibility)
  approval: ApprovalFlow;
  approvalFlow?: ApprovalLevel[]; // Helper array for UI components

  // Core approval fields (NEW ARCHITECTURE)
  requiresApproval: boolean;
  currentApprovalLevel: 'L1' | 'L2' | 'L3' | 'NONE'; // Who can act now
  approvalCompleted: boolean; // true = routed to admin

  // Legacy approval fields (for backward compatibility with MongoDB)
  approvalLevel?: 'L1' | 'L2' | 'L3' | 'NONE'; // Alias for currentApprovalLevel
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Not Required';
  approverHistory?: ApprovalLevel[];

  // Routing Information (Module-specific)
  processing: ProcessingRoute;
  processingRoute?: ProcessingRoute; // Alias for backward compatibility
  routedTo?: string | null; // CRITICAL: null until approvalCompleted = true
  
  // Assignment
  assignment: Assignment;
  
  // Status & Progress
  status: TicketStatus;
  progressStatus?: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
  progressNotes?: string;
  progress?: {
    status?: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
    lastUpdated?: string;
    notes?: string;
  };
  
  // Resolution (when work is completed by IT specialist)
  resolution?: {
    resolvedBy?: string;
    resolvedAt?: string;
    notes?: string;
  };
  
  // SLA Management
  sla: SLA;
  
  // Communication
  conversation: ConversationMessage[];
  
  // Additional Data
  dynamicFields?: DynamicField[];
  attachments: string[];
  
  // Completion & Closure
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  userConfirmedAt?: string;
  closedAt?: string;
  closedBy?: string;
  closingReason?: 'Resolved' | 'User Confirmed' | 'Auto-Closed' | 'Cancelled';
  closingNote?: string;
  
  // Audit Trail
  history: HistoryLog[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface HelpdeskFormData {
  highLevelCategory: HighLevelCategory;
  subCategory: string;
  subject: string;
  description: string;
  urgency: UrgencyLevel;
  requiresApproval?: boolean;
  dynamicFields?: DynamicField[];
  attachments?: File[];
  previousTicketNumber?: string; // For reopened tickets
}

export interface ApprovalRequest {
  ticketId: string;
  level: 1 | 2 | 3;
  managerId: string;
  action: ApprovalAction;
  remarks?: string;
}

export interface AssignmentRequest {
  ticketId: string;
  assignedTo: string;
  assignedToName: string;
  assignedToEmail: string;
  assignedBy: string;
}

export interface ProgressUpdate {
  ticketId: string;
  progressStatus: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';
  notes?: string;
  updatedBy: string;
}

export interface TicketCompletion {
  ticketId: string;
  completionNotes: string;
  completedBy: string;
}

export interface UserConfirmation {
  ticketId: string;
  confirmed: boolean;
  feedback?: string;
}

export interface TicketClosure {
  ticketId: string;
  closingReason: 'Resolved' | 'User Confirmed' | 'Auto-Closed' | 'Cancelled';
  closingNote?: string;
  closedBy: string;
}

// Queue Filters
export interface QueueFilters {
  processingQueue?: ProcessingQueue;
  specialistQueue?: SpecialistQueue;
  status?: TicketStatus;
  urgency?: UrgencyLevel;
  assignedTo?: string;
  searchQuery?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Statistics
export interface QueueStatistics {
  total: number;
  routed: number;
  assigned: number;
  inProgress: number;
  completed: number;
  awaitingConfirmation: number;
  closed: number;
  overdue: number;
}

// Constants
export const URGENCY_LEVELS: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export const HIGH_LEVEL_CATEGORIES: HighLevelCategory[] = ['IT', 'Facilities', 'Finance'];

export const PROCESSING_QUEUES: ProcessingQueue[] = ['IT', 'Facilities', 'Finance'];

export const IT_SPECIALIST_QUEUES: SpecialistQueue[] = [
  'Hardware Team',
  'Software Team',
  'Network Team',
  'Identity Team',
  'Security Team',
];

export const FACILITIES_SPECIALIST_QUEUES: SpecialistQueue[] = [
  'Building Maintenance',
  'Furniture & Layout',
  'Housekeeping',
  'Physical Security',
  'Office Services',
];

export const FINANCE_SPECIALIST_QUEUES: SpecialistQueue[] = [
  'Expense Claims',
  'Reimbursements',
  'Travel Requests',
  'Invoice Processing',
  'Vendor Payments',
  'Payroll Queries',
];

export const SLA_DEFAULTS = {
  approvalSlaHours: 24, // 24 hours for approval
  processingSlaHours: 48, // 48 hours for processing
  autoCloseAfterCompletionHours: 72, // Auto-close if user doesn't confirm within 72 hours
};
