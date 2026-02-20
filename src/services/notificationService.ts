import apiClient from './api';
import type { Notification, CreateNotificationData } from '@/types/notification';

export const notificationService = {
  // Get all notifications for a user
  getAll: async (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await apiClient.get<{ success: boolean; data: Notification[] }>(
      `/notifications?${params.toString()}`
    );
    return response.data.data;
  },

  // Get unread count
  getUnreadCount: async (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await apiClient.get<{ success: boolean; count: number }>(
      `/notifications/unread/count?${params.toString()}`
    );
    return response.data.count;
  },

  // Create a new notification
  create: async (data: CreateNotificationData) => {
    const response = await apiClient.post<{ success: boolean; data: Notification }>(
      '/notifications',
      data
    );
    return response.data.data;
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    const response = await apiClient.patch<{ success: boolean; data: Notification }>(
      `/notifications/${id}/read`
    );
    return response.data.data;
  },

  // Mark all as read for a user
  markAllAsRead: async (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `/notifications/read-all?${params.toString()}`
    );
    return response.data;
  },

  // Delete a notification
  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/notifications/${id}`
    );
    return response.data;
  },

  // Clear all notifications for a user
  clearAll: async (userId?: string, role?: string) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);

    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/notifications/clear-all?${params.toString()}`
    );
    return response.data;
  },
};
