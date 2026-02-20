import apiClient from './api';

export interface SubCategoryConfig {
  _id?: string;
  highLevelCategory: 'IT' | 'Facilities' | 'Finance';
  subCategory: string;
  requiresApproval: boolean;
  processingQueue: string;
  specialistQueue: string;
  isActive: boolean;
}

export interface SubCategoryMappingResponse {
  [highLevelCategory: string]: {
    [subCategory: string]: {
      requiresApproval: boolean;
      processingQueue: string;
      specialistQueue: string;
    };
  };
}

export const subCategoryConfigService = {
  // Get all configurations (grouped by category)
  getAll: async (): Promise<SubCategoryMappingResponse> => {
    const response = await apiClient.get<{ success: boolean; data: SubCategoryMappingResponse }>(
      '/subcategory-config'
    );
    return response.data.data;
  },

  // Get configurations for specific category
  getByCategory: async (category: 'IT' | 'Facilities' | 'Finance'): Promise<SubCategoryConfig[]> => {
    const response = await apiClient.get<{ success: boolean; data: SubCategoryConfig[] }>(
      `/subcategory-config/category/${category}`
    );
    return response.data.data;
  },

  // Get specific subcategory configuration
  getSpecific: async (category: string, subCategory: string): Promise<SubCategoryConfig> => {
    const response = await apiClient.get<{ success: boolean; data: SubCategoryConfig }>(
      `/subcategory-config/${category}/${encodeURIComponent(subCategory)}`
    );
    return response.data.data;
  },

  // Create new configuration
  create: async (config: Omit<SubCategoryConfig, '_id'>): Promise<SubCategoryConfig> => {
    const response = await apiClient.post<{ success: boolean; data: SubCategoryConfig }>(
      '/subcategory-config',
      config
    );
    return response.data.data;
  },

  // Update configuration
  update: async (id: string, updates: Partial<SubCategoryConfig>): Promise<SubCategoryConfig> => {
    const response = await apiClient.put<{ success: boolean; data: SubCategoryConfig }>(
      `/subcategory-config/${id}`,
      updates
    );
    return response.data.data;
  },

  // Delete configuration
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/subcategory-config/${id}`);
  },
};
