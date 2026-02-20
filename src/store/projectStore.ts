import { create } from 'zustand';
import apiClient from '@/services/api';
import type { Project, ProjectFormData, ProjectStats, ProjectFilters } from '@/types/project';


interface ProjectStore {
  projects: Project[];
  selectedProject: Project | null;
  stats: ProjectStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: (filters?: ProjectFilters) => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: ProjectFormData) => Promise<Project>;
  updateProject: (id: string, data: Partial<ProjectFormData>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setSelectedProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedProject: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchProjects: async (filters?: ProjectFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.region) params.append('region', filters.region);
      if (filters?.billingType) params.append('billingType', filters.billingType);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.search) params.append('search', filters.search);

      const response = await apiClient.get(`/projects?${params.toString()}`);
      set({ projects: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch projects';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchProjectById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/projects/${id}`);
      set({ selectedProject: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createProject: async (data: ProjectFormData) => {
    set({ isLoading: true, error: null });
    try {
      // Generate projectId
      const projectId = `PRJ-${Date.now()}`;
      const response = await apiClient.post('/projects', {
        ...data,
        projectId,
      });
      const newProject = response.data.data;

      set(state => ({
        projects: [newProject, ...state.projects],
        isLoading: false
      }));

      return newProject;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: string, data: Partial<ProjectFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/projects/${id}`, data);
      const updatedProject = response.data.data;

      set(state => ({
        projects: state.projects.map(p =>
          p._id === id || p.id === id ? updatedProject : p
        ),
        selectedProject: state.selectedProject?._id === id || state.selectedProject?.id === id
          ? updatedProject
          : state.selectedProject,
        isLoading: false
      }));

      return updatedProject;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/projects/${id}`);

      set(state => ({
        projects: state.projects.filter(p => p._id !== id && p.id !== id),
        selectedProject: state.selectedProject?._id === id || state.selectedProject?.id === id
          ? null
          : state.selectedProject,
        isLoading: false
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete project';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const response = await apiClient.get('/projects/stats');
      set({ stats: response.data.data });
    } catch (error: unknown) {
      console.error('Failed to fetch project stats:', error);
    }
  },

  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },

  clearError: () => {
    set({ error: null });
  }
}));
