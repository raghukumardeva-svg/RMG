import { create } from 'zustand';
import type { UDAConfiguration, UDAConfigurationFilters } from '@/types/udaConfiguration';
import apiClient from '@/services/api';

interface UDAConfigurationStore {
    configurations: UDAConfiguration[];
    isLoading: boolean;
    error: string | null;
    fetchConfigurations: (filters?: UDAConfigurationFilters) => Promise<void>;
    createConfiguration: (data: Omit<UDAConfiguration, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => Promise<UDAConfiguration>;
    updateConfiguration: (id: string, data: Partial<UDAConfiguration>) => Promise<UDAConfiguration>;
    deleteConfiguration: (id: string) => Promise<void>;
}

export const useUDAConfigurationStore = create<UDAConfigurationStore>((set) => ({
    configurations: [],
    isLoading: false,
    error: null,

    fetchConfigurations: async (filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (filters.active) params.append('active', filters.active);
            if (filters.type) params.append('type', filters.type);
            if (filters.search) params.append('search', filters.search);

            const response = await apiClient.get(`/uda-configurations?${params.toString()}`);
            set({ configurations: response.data, isLoading: false });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch UDA configurations';
            console.error('Failed to fetch UDA configurations:', error);
            set({ error: errorMessage, isLoading: false });
        }
    },

    createConfiguration: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post('/uda-configurations', data);
            const newConfiguration = response.data;

            // Add to configurations list
            set(state => ({
                configurations: [newConfiguration, ...state.configurations],
                isLoading: false
            }));

            return newConfiguration;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create UDA configuration';
            console.error('Failed to create UDA configuration:', error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    updateConfiguration: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/uda-configurations/${id}`, data);
            const updatedConfiguration = response.data;

            // Update in configurations list
            set(state => ({
                configurations: state.configurations.map(c =>
                    c._id === id || c.id === id ? updatedConfiguration : c
                ),
                isLoading: false
            }));

            return updatedConfiguration;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update UDA configuration';
            console.error('Failed to update UDA configuration:', error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    deleteConfiguration: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/uda-configurations/${id}`);

            // Remove from configurations list
            set(state => ({
                configurations: state.configurations.filter(c => c._id !== id && c.id !== id),
                isLoading: false
            }));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete UDA configuration';
            console.error('Failed to delete UDA configuration:', error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },
}));
