import apiClient from './api';
import type { CTCMaster, CTCFormData, CTCFilters, EmployeeSearchResult } from '@/types/ctc';

const ctcService = {
    /**
     * Get all CTC records with optional filters
     */
    getAllCTC: async (filters?: CTCFilters): Promise<CTCMaster[]> => {
        const params = new URLSearchParams();
        if (filters?.search) params.append('search', filters.search);
        if (filters?.currency) params.append('currency', filters.currency);

        const response = await apiClient.get<CTCMaster[]>(
            `/ctc-master?${params.toString()}`
        );
        return response.data;
    },

    /**
     * Get a single CTC record by ID
     */
    getCTCById: async (id: string): Promise<CTCMaster> => {
        const response = await apiClient.get<CTCMaster>(`/ctc-master/${id}`);
        return response.data;
    },

    /**
     * Create a new CTC record
     */
    createCTC: async (data: CTCFormData): Promise<CTCMaster> => {
        const response = await apiClient.post<CTCMaster>('/ctc-master', data);
        return response.data;
    },

    /**
     * Update an existing CTC record
     */
    updateCTC: async (id: string, data: Partial<CTCFormData>): Promise<CTCMaster> => {
        const response = await apiClient.put<CTCMaster>(`/ctc-master/${id}`, data);
        return response.data;
    },

    /**
     * Delete a CTC record
     */
    deleteCTC: async (id: string): Promise<void> => {
        await apiClient.delete(`/ctc-master/${id}`);
    },

    /**
     * Search employees for CTC assignment
     */
    searchEmployees: async (query: string): Promise<EmployeeSearchResult[]> => {
        const response = await apiClient.get<EmployeeSearchResult[]>(
            `/employees/search?q=${encodeURIComponent(query)}`
        );
        return response.data;
    },
};

export default ctcService;
