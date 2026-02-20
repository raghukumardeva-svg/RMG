import apiClient from './api';

export interface Payroll {
  _id?: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  paymentStatus: 'pending' | 'processed' | 'paid';
  paymentDate?: Date;
  remarks?: string;
}

export const payrollService = {
  // Get all payroll records with optional filters
  getAll: async (filters?: {
    employeeId?: string;
    year?: number;
    month?: string;
    status?: string;
  }): Promise<Payroll[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.month) params.append('month', filters.month);
    if (filters?.status) params.append('status', filters.status);

    const response = await apiClient.get<{ success: boolean; data: Payroll[] }>(
      `/payroll?${params}`
    );
    return response.data.data;
  },

  // Get payroll by employee ID
  getByEmployeeId: async (employeeId: string): Promise<Payroll[]> => {
    const response = await apiClient.get<{ success: boolean; data: Payroll[] }>(
      `/payroll/employee/${employeeId}`
    );
    return response.data.data;
  },

  // Get current month payroll for an employee
  getCurrentPayroll: async (employeeId: string): Promise<Payroll> => {
    const response = await apiClient.get<{ success: boolean; data: Payroll }>(
      `/payroll/employee/${employeeId}/current`
    );
    return response.data.data;
  },

  // Get payroll by ID
  getById: async (id: string): Promise<Payroll> => {
    const response = await apiClient.get<{ success: boolean; data: Payroll }>(
      `/payroll/${id}`
    );
    return response.data.data;
  },

  // Create payroll record
  create: async (payroll: Omit<Payroll, '_id'>): Promise<Payroll> => {
    const response = await apiClient.post<{ success: boolean; data: Payroll }>(
      '/payroll',
      payroll
    );
    return response.data.data;
  },

  // Update payroll record
  update: async (id: string, updates: Partial<Payroll>): Promise<Payroll> => {
    const response = await apiClient.put<{ success: boolean; data: Payroll }>(
      `/payroll/${id}`,
      updates
    );
    return response.data.data;
  },

  // Delete payroll record
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/payroll/${id}`);
  },

  // Update payment status
  updatePaymentStatus: async (
    id: string,
    status: 'pending' | 'processed' | 'paid',
    paymentDate?: Date
  ): Promise<Payroll> => {
    const response = await apiClient.patch<{ success: boolean; data: Payroll }>(
      `/payroll/${id}/status`,
      { paymentStatus: status, paymentDate }
    );
    return response.data.data;
  },
};
