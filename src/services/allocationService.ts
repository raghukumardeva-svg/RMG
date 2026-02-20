import apiClient from './api';

export interface Allocation {
  _id?: string;
  employeeId: string;
  projectId: string;
  allocation: number;
  startDate: Date;
  endDate?: Date;
  role?: string;
  billable: boolean;
  status: 'active' | 'completed' | 'cancelled';
  remarks?: string;
}

export interface EmployeeUtilization {
  employeeId: string;
  totalAllocation: number;
  isFullyAllocated: boolean;
  isBillable: boolean;
  allocations: number;
}

export const allocationService = {
  // Get all allocations with optional filters
  getAll: async (filters?: {
    employeeId?: string;
    projectId?: string;
    status?: string;
    billable?: boolean;
  }): Promise<Allocation[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.billable !== undefined) params.append('billable', filters.billable.toString());

    const response = await apiClient.get<{ success: boolean; data: Allocation[] }>(
      `/allocations?${params}`
    );
    return response.data.data;
  },

  // Get active allocations only
  getActive: async (): Promise<Allocation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Allocation[] }>(
      '/allocations/active'
    );
    return response.data.data;
  },

  // Get allocations by employee ID
  getByEmployeeId: async (employeeId: string): Promise<Allocation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Allocation[] }>(
      `/allocations/employee/${employeeId}`
    );
    return response.data.data;
  },

  // Get allocations by project ID
  getByProjectId: async (projectId: string): Promise<Allocation[]> => {
    const response = await apiClient.get<{ success: boolean; data: Allocation[] }>(
      `/allocations/project/${projectId}`
    );
    return response.data.data;
  },

  // Get allocation by ID
  getById: async (id: string): Promise<Allocation> => {
    const response = await apiClient.get<{ success: boolean; data: Allocation }>(
      `/allocations/${id}`
    );
    return response.data.data;
  },

  // Create allocation
  create: async (allocation: Omit<Allocation, '_id'>): Promise<Allocation> => {
    const response = await apiClient.post<{ success: boolean; data: Allocation }>(
      '/allocations',
      allocation
    );
    return response.data.data;
  },

  // Update allocation
  update: async (id: string, updates: Partial<Allocation>): Promise<Allocation> => {
    const response = await apiClient.put<{ success: boolean; data: Allocation }>(
      `/allocations/${id}`,
      updates
    );
    return response.data.data;
  },

  // Delete allocation
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/allocations/${id}`);
  },

  // Update allocation status
  updateStatus: async (
    id: string,
    status: 'active' | 'completed' | 'cancelled'
  ): Promise<Allocation> => {
    const response = await apiClient.patch<{ success: boolean; data: Allocation }>(
      `/allocations/${id}/status`,
      { status }
    );
    return response.data.data;
  },

  // Get employee utilization
  getEmployeeUtilization: async (employeeId: string): Promise<EmployeeUtilization> => {
    const response = await apiClient.get<{ success: boolean; data: EmployeeUtilization }>(
      `/allocations/employee/${employeeId}/utilization`
    );
    return response.data.data;
  },
};
