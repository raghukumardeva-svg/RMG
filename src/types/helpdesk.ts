/**
 * @deprecated This file contains legacy helpdesk types.
 * For new development, use types from '@/types/helpdeskNew' instead.
 * This file is kept for backward compatibility with ITHelpdesk.tsx and related legacy components.
 */

export type RequestType =
  | 'Laptop Issue'
  | 'Monitor Issue'
  | 'Software Installation'
  | 'Access Request'
  | 'Network Issue'
  | 'Email Issue'
  | 'Others';

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * @deprecated Use TicketStatus from helpdeskNew.ts for new components
 */
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Cancelled';

export interface TicketComment {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface ConversationMessage {
  sender: 'employee' | 'manager' | 'specialist' | 'itadmin' | 'system';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
  type?: 'message' | 'status_update' | 'closing_note' | 'approval_note';
}

/**
 * @deprecated Use HelpdeskTicket from helpdeskNew.ts for new components
 */
export interface HelpdeskTicket {
  _id?: string;
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  department?: string;
  requestType: RequestType;
  subject: string;
  description: string;
  urgency: UrgencyLevel;
  attachments: string[];
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  comments?: TicketComment[]; // Legacy support
  conversation: ConversationMessage[]; // New conversation thread
  itAdminId?: string;
  assignedTo?: string;
}

/**
 * @deprecated Use HelpdeskFormData from helpdeskNew.ts for new components
 */
export interface HelpdeskFormData {
  requestType: RequestType;
  subject: string;
  description: string;
  urgency: UrgencyLevel;
  attachments?: File[];
}

export const REQUEST_TYPES: RequestType[] = [
  'Laptop Issue',
  'Monitor Issue',
  'Software Installation',
  'Access Request',
  'Network Issue',
  'Email Issue',
  'Others'
];

export const URGENCY_LEVELS: UrgencyLevel[] = ['Low', 'Medium', 'High', 'Critical'];

export const TICKET_STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
