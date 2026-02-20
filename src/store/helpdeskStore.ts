import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { helpdeskService } from '@/services/helpdeskService';
import type { HelpdeskTicket, HelpdeskFormData, TicketStatus as OldTicketStatus } from '@/types/helpdesk';
import type {
  HelpdeskFormData as NewHelpdeskFormData,
  ProgressStatus,
} from '@/types/helpdeskNew';
import { toast } from 'sonner';
import { useNotificationStore } from './notificationStore';

// Cache for expensive computations
const ticketCache = new Map<string, HelpdeskTicket[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Memoized selectors
const createTicketSelectors = (tickets: HelpdeskTicket[]) => {
  return {
    getByStatus: (status: string) => tickets.filter(t => t.status === status),
    getByPriority: (priority: string) => tickets.filter(t => t.urgency === priority),
    getByAssignee: (assigneeId: string) => tickets.filter(t => t.assignedTo === assigneeId),
    getPending: () => tickets.filter(t => ['Open', 'In Progress'].includes(t.status)),
    getResolved: () => tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)),
    getCount: () => tickets.length,
    getByDateRange: (startDate: Date, endDate: Date) => 
      tickets.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      })
  };
};

interface HelpdeskStore {
  tickets: HelpdeskTicket[];
  isLoading: boolean;
  error: string | null;
  
  // Performance optimizations
  cachedSelectors: ReturnType<typeof createTicketSelectors> | null;
  lastFetchTime: number;
  
  // Cache management
  clearCache: () => void;
  invalidateUserCache: (userId: string) => void;

  // ==================== Legacy CRUD Operations ====================
  
  // Fetch operations
  fetchTickets: (userId?: string) => Promise<void>;
  getTicketById: (id: string) => Promise<HelpdeskTicket | null>;

  // Ticket operations
  createTicket: (
    formData: HelpdeskFormData,
    userId: string,
    userName: string,
    userEmail: string,
    department?: string
  ) => Promise<void>;
  updateTicket: (id: string, data: Partial<HelpdeskTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  updateStatus: (id: string, status: OldTicketStatus, cancelledBy?: string) => Promise<void>;
  resolveTicket: (id: string, resolvedBy: string, notes?: string) => Promise<void>;

  // Conversation operations
  addMessage: (
    id: string,
    sender: 'employee' | 'itadmin',
    senderName: string,
    message: string,
    attachments?: string[]
  ) => Promise<void>;
  closeTicketWithNote: (id: string, closingNote: string, closedBy: string) => Promise<void>;

  // ==================== New Workflow Operations ====================

  // Create ticket with workflow
  createWithWorkflow: (
    formData: NewHelpdeskFormData,
    userId: string,
    userName: string,
    userEmail: string,
    department?: string
  ) => Promise<void>;

  // Approval operations
  approveTicket: (
    ticketId: string,
    level: number,
    approverId: string,
    approverName: string,
    remarks?: string
  ) => Promise<void>;
  rejectTicket: (
    ticketId: string,
    level: number,
    approverId: string,
    approverName: string,
    remarks: string
  ) => Promise<void>;

  // Routing & Assignment
  assignTicket: (
    ticketId: string,
    specialistId: string,
    specialistName: string,
    queue: string
  ) => Promise<void>;

  // Progress tracking
  updateProgress: (
    ticketId: string,
    progressStatus: ProgressStatus,
    notes?: string
  ) => Promise<void>;
  completeWork: (
    ticketId: string,
    resolutionNotes: string,
    completedBy: string
  ) => Promise<void>;
  confirmCompletion: (
    ticketId: string,
    userId: string,
    confirmationNotes?: string
  ) => Promise<void>;
  closeTicket: (
    ticketId: string,
    closedBy: string,
    closingNotes?: string
  ) => Promise<void>;
}

export const useHelpdeskStore = create<HelpdeskStore>((set, get) => ({
  tickets: [],
  isLoading: false,
  error: null,

  fetchTickets: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const data = userId
        ? await helpdeskService.getByUserId(userId)
        : await helpdeskService.getAll();
      set({ tickets: data, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tickets';
      set({ error: errorMessage, isLoading: false });
      toast.error(errorMessage, {
        description: 'Please check your connection and try again',
      });
    }
  },

  createTicket: async (formData, userId, userName, userEmail, department) => {
    set({ isLoading: true, error: null });
    try {
      // Validate form data
      if (!formData.requestType || !formData.subject || !formData.description || !formData.urgency) {
        throw new Error('All fields are required');
      }

      // Prepare attachment names (in production, upload files and store URLs)
      const attachmentNames = formData.attachments?.map(file => file.name) || [];

      // Prepare ticket data
      const ticketData = {
        userId,
        userName,
        userEmail,
        department: department || '',
        requestType: formData.requestType,
        subject: formData.subject,
        description: formData.description,
        urgency: formData.urgency,
        attachments: attachmentNames,
        conversation: [],
      };

      // Create ticket
      const createdTicket = await helpdeskService.create(ticketData);

      // Create notification for IT Admin
      try {
        await useNotificationStore.getState().createNotification({
          title: 'New IT Helpdesk Ticket',
          description: `${userName} has raised a ${formData.requestType} ticket (${formData.urgency} priority): ${formData.subject}`,
          type: 'ticket',
          role: 'IT_ADMIN',
          meta: {
            ticketId: createdTicket.id || createdTicket._id,
            employeeId: userId,
            employeeName: userName,
            requestType: formData.requestType,
            urgency: formData.urgency,
            actionUrl: '/itadmin/tickets',
          },
        });
      } catch (notifError) {
        // Notification creation failed, continue without it
      }

      // Refresh tickets
      await get().fetchTickets(userId);

      toast.success('Ticket submitted successfully');
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create ticket',
        isLoading: false
      });
      toast.error(error instanceof Error ? error.message : 'Failed to submit ticket');
      throw error;
    }
  },

  updateTicket: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.update(id, data);

      // Refresh tickets
      const userId = get().tickets.find(t => t.id === id || t._id === id)?.userId;
      if (userId) {
        await get().fetchTickets(userId);
      }

      toast.success('Ticket updated successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update ticket', isLoading: false });
      toast.error('Failed to update ticket');
      throw error;
    }
  },

  deleteTicket: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.delete(id);

      // Refresh tickets
      const userId = get().tickets.find(t => t.id === id || t._id === id)?.userId;
      if (userId) {
        await get().fetchTickets(userId);
      }

      toast.success('Ticket deleted successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to delete ticket', isLoading: false });
      toast.error('Failed to delete ticket');
      throw error;
    }
  },

  updateStatus: async (id, status, cancelledBy?) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.updateStatus(id, status, cancelledBy);

      // Refresh tickets
      const userId = get().tickets.find(t => t.id === id || t._id === id)?.userId;
      if (userId) {
        await get().fetchTickets(userId);
      }

      // Don't show generic success message, let the component show specific message
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update status', isLoading: false });
      toast.error('Failed to update status');
      throw error;
    }
  },

  resolveTicket: async (id, resolvedBy, notes) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.resolve(id, resolvedBy, notes);

      // Refresh tickets
      const userId = get().tickets.find(t => t.id === id || t._id === id)?.userId;
      if (userId) {
        await get().fetchTickets(userId);
      }

      toast.success('Ticket resolved successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to resolve ticket', isLoading: false });
      toast.error('Failed to resolve ticket');
      throw error;
    }
  },

  getTicketById: async (id) => {
    try {
      const ticket = await helpdeskService.getById(id);
      return ticket;
    } catch {
      toast.error('Failed to load ticket details');
      return null;
    }
  },

  addMessage: async (id, sender, senderName, message, attachments) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = get().tickets.find(t => t.id === id || t._id === id);
      await helpdeskService.addMessage(id, sender, senderName, message, attachments);

      // Create notification when IT Admin responds to employee
      if (sender === 'itadmin' && ticket) {
        try {
          await useNotificationStore.getState().createNotification({
            title: 'IT Admin Response',
            description: `IT Admin has responded to your ticket: ${ticket.subject}`,
            type: 'ticket',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId: id,
              actionUrl: '/it-helpdesk',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      // Refresh tickets
      await get().fetchTickets();

      toast.success('Message sent successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to send message', isLoading: false });
      toast.error('Failed to send message');
      throw error;
    }
  },

  closeTicketWithNote: async (id, closingNote, closedBy) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = get().tickets.find(t => t.id === id || t._id === id);
      // Updated to match new closeTicket signature: (ticketId, closedBy, closingNotes?)
      await helpdeskService.closeTicket(id, closedBy, closingNote);

      // Create notification for employee when ticket is closed
      if (ticket) {
        try {
          await useNotificationStore.getState().createNotification({
            title: 'Ticket Closed',
            description: `Your IT ticket "${ticket.subject}" has been closed. ${closingNote}`,
            type: 'system',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId: id,
              actionUrl: '/helpdesk',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      // Refresh tickets
      await get().fetchTickets();

      toast.success('Ticket closed successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to close ticket', isLoading: false });
      toast.error('Failed to close ticket');
      throw error;
    }
  },

  // ==================== New Workflow Operations ====================

  createWithWorkflow: async (formData, userId, userName, userEmail, department) => {
    set({ isLoading: true, error: null });
    try {
      // Validate form data
      if (!formData.highLevelCategory || !formData.subCategory || !formData.subject || !formData.description) {
        throw new Error('All required fields must be filled');
      }

      // Step 1: Create ticket (CRITICAL - must succeed)
      const ticket = await helpdeskService.createWithWorkflow(formData, userId, userName, userEmail, department);

      // Step 2: Show success immediately (ticket creation succeeded)
      toast.success('Request submitted successfully');
      set({ isLoading: false });

      // Step 3: Fire-and-forget: Send notifications (non-blocking)
      try {
        const targetRole = formData.requiresApproval ? 'L1_APPROVER' : 'IT_ADMIN';
        const notificationTitle = formData.requiresApproval
          ? 'New Request Needs Your Approval'
          : 'New Helpdesk Request';
        const actionUrl = formData.requiresApproval ? '/approvals' : '/itadmin/tickets';

        await useNotificationStore.getState().createNotification({
          title: notificationTitle,
          description: `${userName} submitted a ${formData.highLevelCategory} request: ${formData.subject}`,
          type: 'ticket',
          role: targetRole,
          meta: {
            category: formData.highLevelCategory,
            subCategory: formData.subCategory,
            urgency: formData.urgency,
            actionUrl,
          },
        });
      } catch (notifError) {
        console.warn('⚠️ Notification failed (non-blocking):', notifError);
      }

      // Step 4: Refresh ticket list (non-blocking)
      try {
        await get().fetchTickets(userId);
      } catch (fetchError) {
        console.warn('⚠️ Failed to refresh tickets (non-blocking):', fetchError);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create request',
        isLoading: false
      });
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
      throw error;
    }
  },

  approveTicket: async (ticketId, level, approverId, approverName, remarks) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.approve(ticketId, level, approverId, approverName, remarks);

      // Notify requester and next approver
      const ticket = get().tickets.find(t => t.id === ticketId || t._id === ticketId);
      if (ticket) {
        try {
          // Notify the requester (employee) that their ticket was approved at this level
          await useNotificationStore.getState().createNotification({
            title: `Approval Level ${level} Approved`,
            description: `Your request "${ticket.subject}" has been approved by ${approverName}`,
            type: 'approval',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId,
              level,
              actionUrl: '/helpdesk',
            },
          });

          // Notify next approver or IT Admin based on level
          // Type assertion for new workflow tickets
          const ticketAny = ticket as any;
          const category = ticketAny.module || ticketAny.highLevelCategory || 'IT';

          if (level === 1) {
            // L1 approved → notify L2
            await useNotificationStore.getState().createNotification({
              title: 'Level-2 Approval Required',
              description: `Request "${ticket.subject}" approved by L1 (${approverName}) - needs your approval`,
              type: 'ticket',
              role: 'L2_APPROVER',
              meta: {
                ticketId,
                category,
                urgency: ticket.urgency,
                actionUrl: '/approvals',
              },
            });
          } else if (level === 2) {
            // L2 approved → notify L3
            await useNotificationStore.getState().createNotification({
              title: 'Level-3 Approval Required',
              description: `Request "${ticket.subject}" approved by L2 (${approverName}) - needs your approval`,
              type: 'ticket',
              role: 'L3_APPROVER',
              meta: {
                ticketId,
                category,
                urgency: ticket.urgency,
                actionUrl: '/approvals',
              },
            });
          } else if (level === 3) {
            // L3 approved → notify IT Admin that ticket is ready to route
            await useNotificationStore.getState().createNotification({
              title: 'Approved Ticket Ready for Assignment',
              description: `Request "${ticket.subject}" fully approved - ready to assign`,
              type: 'ticket',
              role: 'IT_ADMIN',
              meta: {
                ticketId,
                category,
                urgency: ticket.urgency,
                actionUrl: '/itadmin/tickets',
              },
            });
          }
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      await get().fetchTickets();
      toast.success('Ticket approved successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to approve ticket', isLoading: false });
      toast.error('Failed to approve ticket');
      throw error;
    }
  },

  rejectTicket: async (ticketId, level, approverId, approverName, remarks) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.reject(ticketId, level, approverId, approverName, remarks);

      // Notify requester
      const ticket = get().tickets.find(t => t.id === ticketId || t._id === ticketId);
      if (ticket) {
        try {
          await useNotificationStore.getState().createNotification({
            title: `Request Rejected`,
            description: `Your request "${ticket.subject}" was rejected by ${approverName}: ${remarks}`,
            type: 'rejection',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId,
              level,
              actionUrl: '/helpdesk',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      await get().fetchTickets();
      toast.success('Ticket rejected');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to reject ticket', isLoading: false });
      toast.error('Failed to reject ticket');
      throw error;
    }
  },

  assignTicket: async (ticketId, specialistId, specialistName, queue) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.assign(ticketId, specialistId, specialistName, queue);

      // Notify requester and specialist
      const ticket = get().tickets.find(t => t.id === ticketId || t._id === ticketId);
      if (ticket) {
        try {
          // Notify the employee (requester) that their ticket was assigned
          await useNotificationStore.getState().createNotification({
            title: 'Ticket Assigned',
            description: `Your request "${ticket.subject}" has been assigned to ${specialistName}`,
            type: 'ticket',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId,
              specialist: specialistName,
              actionUrl: '/helpdesk',
            },
          });

          // Notify the specialist (IT employee) that they have been assigned a ticket
          await useNotificationStore.getState().createNotification({
            title: 'New Ticket Assigned to You',
            description: `You have been assigned: "${ticket.subject}" - ${ticket.urgency} priority`,
            type: 'ticket',
            userId: specialistId,
            role: 'EMPLOYEE',
            meta: {
              ticketId,
              requester: ticket.userName,
              urgency: ticket.urgency,
              actionUrl: '/it-specialist/queue',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      await get().fetchTickets();
      toast.success('Ticket assigned successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to assign ticket', isLoading: false });
      toast.error('Failed to assign ticket');
      throw error;
    }
  },

  updateProgress: async (ticketId, progressStatus, notes) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.updateProgress(ticketId, progressStatus, notes);
      await get().fetchTickets();
      toast.success('Progress updated successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update progress', isLoading: false });
      toast.error('Failed to update progress');
      throw error;
    }
  },

  completeWork: async (ticketId, resolutionNotes, completedBy) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.completeWork(ticketId, resolutionNotes, completedBy);

      // Notify requester
      const ticket = get().tickets.find(t => t.id === ticketId || t._id === ticketId);
      if (ticket) {
        try {
          await useNotificationStore.getState().createNotification({
            title: 'Ticket Completed',
            description: `Your request "${ticket.subject}" has been completed. Please confirm.`,
            type: 'ticket',
            userId: ticket.userId,
            role: 'EMPLOYEE',
            meta: {
              ticketId,
              actionUrl: '/helpdesk',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      await get().fetchTickets();
      toast.success('Ticket completed successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to complete work', isLoading: false });
      toast.error('Failed to complete work');
      throw error;
    }
  },

  confirmCompletion: async (ticketId, userId, confirmationNotes) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.confirmCompletion(ticketId, userId, confirmationNotes);
      await get().fetchTickets();
      toast.success('Completion confirmed');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to confirm completion', isLoading: false });
      toast.error('Failed to confirm completion');
      throw error;
    }
  },

  closeTicket: async (ticketId, closedBy, closingNotes) => {
    set({ isLoading: true, error: null });
    try {
      await helpdeskService.close(ticketId, closedBy, closingNotes);
      await get().fetchTickets();
      toast.success('Ticket closed');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to close ticket', isLoading: false });
      toast.error('Failed to close ticket');
      throw error;
    }
  },
}));
