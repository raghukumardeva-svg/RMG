import apiClient from './api';
import type { LeaveRequest, LeaveBalance } from '@/types/leave';

export const leaveService = {
  // Get all leaves
  getAll: async () => {
    const response = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>(
      '/leaves'
    );
    return response.data.data;
  },

  // Get leaves by user ID
  getByUserId: async (userId: string) => {
    const response = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>(
      `/leaves/user/${userId}`
    );
    return response.data.data;
  },

  // Get pending leaves (for HR/Manager)
  getPending: async () => {
    const response = await apiClient.get<{ success: boolean; data: LeaveRequest[] }>(
      '/leaves/pending'
    );
    return response.data.data;
  },

  // Get leave balance for a user
  getBalance: async (userId: string) => {
    const response = await apiClient.get<{ success: boolean; data: LeaveBalance }>(
      `/leaves/balance/${userId}`
    );
    return response.data.data;
  },

  // Create leave request
  create: async (leaveData: Omit<LeaveRequest, '_id' | 'id' | 'status' | 'createdAt' | 'expiresAt' | 'hrNotified'>) => {
    const response = await apiClient.post<{ success: boolean; data: LeaveRequest }>(
      '/leaves',
      leaveData
    );
    return response.data.data;
  },

  // Update leave request
  update: async (id: string, data: Partial<LeaveRequest>) => {
    const response = await apiClient.put<{ success: boolean; data: LeaveRequest }>(
      `/leaves/${id}`,
      data
    );
    return response.data.data;
  },

  // Approve leave
  approve: async (id: string, approvedBy: string) => {
    const response = await apiClient.patch<{ success: boolean; data: LeaveRequest }>(
      `/leaves/${id}/approve`,
      { approvedBy }
    );
    return response.data.data;
  },

  // Reject leave
  reject: async (id: string, rejectedBy: string, rejectionReason: string) => {
    const response = await apiClient.patch<{ success: boolean; data: LeaveRequest }>(
      `/leaves/${id}/reject`,
      { rejectedBy, rejectionReason }
    );
    return response.data.data;
  },

  // Cancel leave
  cancel: async (id: string) => {
    const response = await apiClient.patch<{ success: boolean; data: LeaveRequest }>(
      `/leaves/${id}/cancel`,
      {}
    );
    return response.data.data;
  },

  // Delete leave
  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/leaves/${id}`
    );
    return response.data;
  },
};
