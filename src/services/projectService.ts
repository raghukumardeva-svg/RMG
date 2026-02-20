import apiClient from './api';

export interface Project {
  _id?: string;
  projectId: string;
  name: string;
  client: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  description?: string;
  projectManager?: {
    employeeId: string;
    name: string;
  };
  budget?: number;
  utilization?: number;
  requiredSkills?: string[];
  teamSize?: number;
}

export const projectService = {
  // Get all projects with optional filters
  getAll: async (filters?: {
    status?: string;
    client?: string;
  }): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.client) params.append('client', filters.client);

    const response = await apiClient.get<{ success: boolean; data: Project[] }>(
      `/projects?${params}`
    );
    return response.data.data;
  },

  // Get active projects only
  getActive: async (): Promise<Project[]> => {
    const response = await apiClient.get<{ success: boolean; data: Project[] }>(
      '/projects/active'
    );
    return response.data.data;
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await apiClient.get<{ success: boolean; data: Project }>(
      `/projects/${id}`
    );
    return response.data.data;
  },

  // Get project by project ID
  getByProjectId: async (projectId: string): Promise<Project> => {
    const response = await apiClient.get<{ success: boolean; data: Project }>(
      `/projects/by-project-id/${projectId}`
    );
    return response.data.data;
  },

  // Create project
  create: async (project: Omit<Project, '_id'>): Promise<Project> => {
    const response = await apiClient.post<{ success: boolean; data: Project }>(
      '/projects',
      project
    );
    return response.data.data;
  },

  // Update project
  update: async (id: string, updates: Partial<Project>): Promise<Project> => {
    const response = await apiClient.put<{ success: boolean; data: Project }>(
      `/projects/${id}`,
      updates
    );
    return response.data.data;
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },

  // Update project status
  updateStatus: async (
    id: string,
    status: 'active' | 'on-hold' | 'completed' | 'cancelled'
  ): Promise<Project> => {
    const response = await apiClient.patch<{ success: boolean; data: Project }>(
      `/projects/${id}/status`,
      { status }
    );
    return response.data.data;
  },
};
