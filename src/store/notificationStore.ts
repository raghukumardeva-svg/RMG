import { create } from 'zustand';
import { notificationService } from '@/services/notificationService';
import type { Notification, CreateNotificationData } from '@/types/notification';
import { toast } from 'sonner';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Fetch operations
  fetchNotifications: (userId?: string, role?: string) => Promise<void>;
  fetchUnreadCount: (userId?: string, role?: string) => Promise<void>;

  // Notification operations
  createNotification: (data: CreateNotificationData) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId?: string, role?: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: (userId?: string, role?: string) => Promise<void>;

  // Real-time updates (for future WebSocket integration)
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async (userId, role) => {
    set({ isLoading: true, error: null });
    try {
      const data = await notificationService.getAll(userId, role);
      set({ notifications: data, isLoading: false });
    } catch {
      set({ error: 'Failed to load notifications', isLoading: false });
    }
  },

  fetchUnreadCount: async (userId, role) => {
    try {
      const count = await notificationService.getUnreadCount(userId, role);
      set({ unreadCount: count });
    } catch {
      set({ unreadCount: 0 });
    }
  },

  createNotification: async (data) => {
    try {
      const notification = await notificationService.create(data);
      // Add to local state for immediate feedback
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    } catch (error) {
      // Silently fail - backend API not yet implemented
      console.warn('Notification creation skipped - backend API not available:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      toast.error('Failed to mark as read');
    }
  },

  markAllAsRead: async (userId, role) => {
    try {
      await notificationService.markAllAsRead(userId, role);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  },

  deleteNotification: async (id) => {
    try {
      await notificationService.delete(id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.find((n) => n.id === id && !n.isRead)
          ? state.unreadCount - 1
          : state.unreadCount,
      }));
    } catch {
      toast.error('Failed to delete notification');
    }
  },

  clearAll: async (userId, role) => {
    try {
      console.log('[NotificationStore] Clearing all notifications:', { userId, role });
      await notificationService.clearAll(userId, role);
      set({ notifications: [], unreadCount: 0 });
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('[NotificationStore] Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  },

  // For real-time updates
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },
}));
