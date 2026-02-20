/**
 * Helpdesk Types Index
 * 
 * This module provides a unified export point for all helpdesk types.
 * 
 * For new development: Use types from './helpdeskNew'
 * For legacy ITHelpdesk: Use types from './helpdesk'
 */

// Re-export all new types (recommended for new development)
export * from './helpdeskNew';

// Re-export legacy types with prefix to avoid conflicts
export {
  type RequestType as LegacyRequestType,
  type TicketStatus as LegacyTicketStatus,
  type HelpdeskTicket as LegacyHelpdeskTicket,
  type HelpdeskFormData as LegacyHelpdeskFormData,
  type TicketComment,
  REQUEST_TYPES,
  TICKET_STATUSES,
} from './helpdesk';
