import apiClient from './api';

export interface Employee {
  _id?: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  location: string;
  dateOfJoining: string;
  businessUnit: string;
  profilePhoto?: string;
  reportingManagerId?: string;
  dottedLineManagerId?: string;
  status: 'active' | 'inactive';
  dateOfBirth?: string;
  reportingManager?: {
    employeeId: string;
    name: string;
    designation: string;
  };
  dottedLineManager?: {
    employeeId: string;
    name: string;
    designation: string;
  };
}

export interface EmployeeFilters {
  department?: string;
  location?: string;
  status?: string;
  businessUnit?: string;
}

export const employeeService = {
  getAll: async (filters?: EmployeeFilters) => {
    const queryParams: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      });
    }
    const params = new URLSearchParams(queryParams);
    const response = await apiClient.get<{ success: boolean; data: Employee[] }>(
      `/employees?${params}`
    );
    return response.data.data;
  },

  getActive: async () => {
    const response = await apiClient.get<{ success: boolean; data: Employee[] }>(
      '/employees/active'
    );
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Employee }>(
      `/employees/${id}`
    );
    return response.data.data;
  },

  getByEmployeeId: async (employeeId: string) => {
    const response = await apiClient.get<{ success: boolean; data: Employee }>(
      `/employees/byEmpId/${employeeId}`
    );
    return response.data.data;
  },

  getNextEmployeeId: async () => {
    const response = await apiClient.get<{ success: boolean; data: { nextEmployeeId: string } }>(
      '/employees/utils/next-id'
    );
    return response.data.data.nextEmployeeId;
  },

  create: async (employee: Omit<Employee, '_id'>) => {
    const response = await apiClient.post<{ success: boolean; data: Employee }>(
      '/employees',
      employee
    );
    return response.data.data;
  },

  update: async (id: string, data: Partial<Employee>) => {
    const response = await apiClient.put<{ success: boolean; data: Employee }>(
      `/employees/${id}`,
      data
    );
    return response.data.data;
  },

  markInactive: async (id: string) => {
    const response = await apiClient.patch<{ success: boolean; data: Employee }>(
      `/employees/${id}/inactive`
    );
    return response.data.data;
  },

  activate: async (id: string) => {
    const response = await apiClient.patch<{ success: boolean; data: Employee }>(
      `/employees/${id}/activate`
    );
    return response.data.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/employees/${id}`
    );
    return response.data;
  },

  bulkUpload: async (employees: Partial<Employee>[]) => {
    const response = await apiClient.post<{ success: boolean; data: { imported: number; updated: number } }>(
      '/employees/bulk-upload',
      { employees }
    );
    return response.data.data;
  },
};
