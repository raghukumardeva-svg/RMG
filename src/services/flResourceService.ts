import apiClient from './api';

export interface FLResource {
    _id?: string;
    employeeId: string;
    resourceName: string;
    jobRole?: string;
    department?: string;
    skills?: string[];
    utilizationPercentage?: number;
    requestedFromDate?: Date;
    requestedToDate?: Date;
    billable?: boolean;
    percentageBasis?: string;
    monthlyAllocations?: Array<{
        month: string;
        allocation: number;
    }>;
    totalAllocation?: string;
    financialLineId?: string;
    flNo?: string;
    flName?: string;
    projectId: string;
    projectOid?: string; // MongoDB ObjectId reference to Project
    projectName?: string; // Project name from populated project
    status?: string;
    allocation?: number;
    startDate?: Date;
    endDate?: Date;
    role?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const flResourceService = {
    // Get all FL resources with optional filters
    getAll: async (filters?: {
        employeeId?: string;
        projectId?: string;
    }): Promise<FLResource[]> => {
        const params = new URLSearchParams();
        if (filters?.employeeId) params.append('employeeId', filters.employeeId);
        if (filters?.projectId) params.append('projectId', filters.projectId);

        const response = await apiClient.get<{ success: boolean; data: FLResource[] }>(
            `/flresources?${params}`
        );
        return response.data.data;
    },

    // Get FL resources by employee ID
    getByEmployeeId: async (employeeId: string): Promise<FLResource[]> => {
        const response = await apiClient.get<{ success: boolean; data: FLResource[] }>(
            `/flresources/employee/${employeeId}`
        );
        return response.data.data;
    },

    // Get FL resources by project ID
    getByProjectId: async (projectId: string): Promise<FLResource[]> => {
        const response = await apiClient.get<{ success: boolean; data: FLResource[] }>(
            `/flresources/project/${projectId}`
        );
        return response.data.data;
    },

    // Create FL resource
    create: async (resource: Omit<FLResource, '_id'>): Promise<FLResource> => {
        const response = await apiClient.post<{ success: boolean; data: FLResource }>(
            '/flresources',
            resource
        );
        return response.data.data;
    },

    // Update FL resource
    update: async (id: string, updates: Partial<FLResource>): Promise<FLResource> => {
        const response = await apiClient.put<{ success: boolean; data: FLResource }>(
            `/flresources/${id}`,
            updates
        );
        return response.data.data;
    },

    // Delete FL resource
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(`/flresources/${id}`);
    },
};
