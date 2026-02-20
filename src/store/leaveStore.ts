import { create } from 'zustand';
import { leaveService } from '@/services/leaveService';
import type { LeaveRequest, LeaveBalance, LeaveFormData } from '@/types/leave';
import { validateLeaveRequest, calculateLeaveDays } from '@/utils/leaveValidation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNotificationStore } from './notificationStore';

interface LeaveStore {
  leaves: LeaveRequest[];
  pendingLeaves: LeaveRequest[];
  leaveBalance: LeaveBalance | null;
  isLoading: boolean;
  error: string | null;

  // Fetch operations
  fetchLeaves: (userId?: string) => Promise<void>;
  fetchPendingLeaves: () => Promise<void>;
  fetchLeaveBalance: (userId: string) => Promise<void>;

  // Leave operations
  applyLeave: (leaveData: LeaveFormData, userId: string, userName: string, userEmail: string, department: string, managerId: string) => Promise<void>;
  updateLeave: (id: string, data: Partial<LeaveRequest>) => Promise<void>;
  approveLeave: (id: string, approvedBy: string) => Promise<void>;
  rejectLeave: (id: string, rejectedBy: string, rejectionReason: string) => Promise<void>;
  cancelLeave: (id: string) => Promise<void>;
  deleteLeave: (id: string) => Promise<void>;
}

export const useLeaveStore = create<LeaveStore>((set, get) => ({
  leaves: [],
  pendingLeaves: [],
  leaveBalance: null,
  isLoading: false,
  error: null,

  fetchLeaves: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const data = userId
        ? await leaveService.getByUserId(userId)
        : await leaveService.getAll();
      set({ leaves: data, isLoading: false });
    } catch {
      set({ error: 'Failed to load leaves', isLoading: false });
      toast.error('Failed to load leaves');
    }
  },

  fetchPendingLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await leaveService.getPending();
      set({ pendingLeaves: data, isLoading: false });
    } catch {
      set({ error: 'Failed to load pending leaves', isLoading: false });
      toast.error('Failed to load pending leaves');
    }
  },

  fetchLeaveBalance: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await leaveService.getBalance(userId);
      set({ leaveBalance: data, isLoading: false });
    } catch {
      set({ error: 'Failed to load leave balance', isLoading: false });
      toast.error('Failed to load leave balance');
    }
  },

  applyLeave: async (formData, userId, userName, userEmail, department, managerId) => {
    set({ isLoading: true, error: null });
    try {
      // Get current leave balance
      const balance = get().leaveBalance;
      if (!balance) {
        throw new Error('Leave balance not loaded');
      }

      // Get existing leaves for validation
      const existingLeaves = get().leaves;

      // Validate leave request
      const validation = validateLeaveRequest(formData, balance, existingLeaves);

      // Show warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach(warning => toast.warning(warning));
      }

      // If validation fails, show errors and stop
      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        set({ isLoading: false });
        throw new Error('Leave validation failed');
      }

      // Calculate days - check for half-day
      let days = calculateLeaveDays(formData.startDate, formData.endDate);

      // If half-day is selected and it's a single day, set days to 0.5
      if (formData.isHalfDay && formData.startDate === formData.endDate) {
        days = 0.5;
      }

      // Prepare leave request data
      const leaveData = {
        userId,
        employeeId: userId, // IMPORTANT: Set employeeId for manager filtering
        employeeName: userName, // Backend model uses employeeName
        userName,
        userEmail,
        department,
        leaveType: formData.leaveType,
        leaveReason: formData.leaveReason,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days,
        isHalfDay: formData.isHalfDay || false,
        halfDayType: formData.halfDayType || null,
        justification: formData.justification,
        reason: formData.justification, // Also send as reason for backend validation
        managerId,
        notes: '',
        attachments: [], // File upload will be handled separately
      };

      // Create leave request
      const createdLeave = await leaveService.create(leaveData);

      // Create notification for manager
      try {
        await useNotificationStore.getState().createNotification({
          title: 'New Leave Request',
          description: `${userName} has requested ${leaveData.leaveType} from ${format(new Date(leaveData.startDate), 'MMM dd')} to ${format(new Date(leaveData.endDate), 'MMM dd, yyyy')}`,
          type: 'leave',
          userId: managerId,
          role: 'MANAGER',
          meta: {
            leaveId: createdLeave.id || createdLeave._id,
            employeeId: userId,
            employeeName: userName,
            leaveType: leaveData.leaveType,
            actionUrl: '/manager/leave-approvals',
          },
        });
      } catch (notifError) {
        // Notification failed, but leave was created
        // Notification creation failed, continue without it
      }

      // Refresh leaves and balance
      await get().fetchLeaves(userId);
      await get().fetchLeaveBalance(userId);

      toast.success('Leave request submitted successfully');
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to apply leave',
        isLoading: false
      });
      if (error instanceof Error && error.message !== 'Leave validation failed') {
        toast.error('Failed to submit leave request');
      }
      throw error;
    }
  },

  updateLeave: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await leaveService.update(id, data);

      // Refresh leaves
      const userId = get().leaves.find(l => l.id === id || l._id === id)?.userId;
      if (userId) {
        await get().fetchLeaves(userId);
      }

      toast.success('Leave updated successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update leave', isLoading: false });
      toast.error('Failed to update leave');
      throw error;
    }
  },

  approveLeave: async (id, approvedBy) => {
    set({ isLoading: true, error: null });
    try {
      const leave = get().leaves.find(l => l.id === id || l._id === id);
      await leaveService.approve(id, approvedBy);

      // Create notification for employee
      if (leave) {
        try {
          await useNotificationStore.getState().createNotification({
            title: 'Leave Request Approved ✓',
            description: `Your ${leave.leaveType} request from ${format(new Date(leave.startDate), 'MMM dd')} to ${format(new Date(leave.endDate), 'MMM dd')} has been approved`,
            type: 'approval',
            userId: leave.userId || leave.employeeId,
            role: 'EMPLOYEE',
            meta: {
              leaveId: id,
              actionUrl: '/leave',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      // Refresh pending leaves
      await get().fetchPendingLeaves();

      toast.success('Leave approved successfully');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to approve leave', isLoading: false });
      toast.error('Failed to approve leave');
      throw error;
    }
  },

  rejectLeave: async (id, rejectedBy, rejectionReason) => {
    set({ isLoading: true, error: null });
    try {
      const leave = get().leaves.find(l => l.id === id || l._id === id);
      await leaveService.reject(id, rejectedBy, rejectionReason);

      // Create notification for employee
      if (leave) {
        try {
          await useNotificationStore.getState().createNotification({
            title: 'Leave Request Rejected',
            description: `Your ${leave.leaveType} request has been rejected. Reason: ${rejectionReason}`,
            type: 'rejection',
            userId: leave.userId || leave.employeeId,
            role: 'EMPLOYEE',
            meta: {
              leaveId: id,
              actionUrl: '/leave',
            },
          });
        } catch (notifError) {
          // Notification creation failed, continue without it
        }
      }

      // Refresh pending leaves
      await get().fetchPendingLeaves();

      toast.success('Leave rejected');
      set({ isLoading: false });
    } catch (error) {
      set({ error: 'Failed to reject leave', isLoading: false });
      toast.error('Failed to reject leave');
      throw error;
    }
  },

  cancelLeave: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Find the leave first to get user info
      const leave = get().leaves.find(l => l.id === id || l._id === id);
      const employeeId = leave?.employeeId || leave?.userId;

      // Optimistically update the UI immediately
      set((state) => ({
        leaves: state.leaves.map(l => 
          (l.id === id || l._id === id) 
            ? { ...l, status: 'cancelled' as const }
            : l
        )
      }));

      await leaveService.cancel(id);

      // Refresh leave balance after cancellation
      if (employeeId) {
        await get().fetchLeaveBalance(employeeId);
      }

      toast.success('Leave cancelled successfully');
      set({ isLoading: false });
    } catch (error) {
      // Revert optimistic update on error - refetch leaves
      const leave = get().leaves.find(l => l.id === id || l._id === id);
      const employeeId = leave?.employeeId || leave?.userId;
      if (employeeId) {
        await get().fetchLeaves(employeeId);
      }
      
      set({ error: 'Failed to cancel leave', isLoading: false });
      toast.error('Failed to cancel leave');
      throw error;
    }
  },

  deleteLeave: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Find the leave first to get user info
      const leave = get().leaves.find(l => l.id === id || l._id === id);
      const employeeId = leave?.employeeId || leave?.userId;

      // Optimistically remove from UI immediately
      set((state) => ({
        leaves: state.leaves.filter(l => l.id !== id && l._id !== id)
      }));

      await leaveService.delete(id);

      // Refresh leave balance after deletion
      if (employeeId) {
        await get().fetchLeaveBalance(employeeId);
      }

      toast.success('Leave deleted successfully');
      set({ isLoading: false });
    } catch (error) {
      // Revert optimistic update on error - refetch leaves
      const employeeId = get().leaveBalance?.userId;
      if (employeeId) {
        await get().fetchLeaves(employeeId);
      }
      
      set({ error: 'Failed to delete leave', isLoading: false });
      toast.error('Failed to delete leave');
      throw error;
    }
  },
}));
