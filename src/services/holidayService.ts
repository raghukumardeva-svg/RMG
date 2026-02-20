import apiClient from './api';

export interface Holiday {
  _id?: string;
  id?: number;
  date: string;
  name: string;
  type: string;
  backgroundImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const holidayService = {
  getAll: async () => {
    const response = await apiClient.get<{ success: boolean; data: Holiday[] }>('/holidays');
    return response.data.data;
  },

  create: async (data: Omit<Holiday, 'id'>) => {
    const response = await apiClient.post<{ success: boolean; data: Holiday }>('/holidays', data);
    return response.data.data;
  },

  update: async (id: number | string, data: Partial<Holiday>) => {
    const response = await apiClient.put<{ success: boolean; data: Holiday }>(`/holidays/${id}`, data);
    return response.data.data;
  },

  delete: async (id: number | string) => {
    await apiClient.delete(`/holidays/${id}`);
  },
};
