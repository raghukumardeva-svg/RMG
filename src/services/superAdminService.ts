/**
 * Super Admin Service
 * API service for all Super Admin operations
 */

import api from './api';
import type {
  DashboardStats,
  SystemHealth,
  SubCategoryConfig,
  CategoryFormData,
  SuperAdminUser,
  UserFormData,
  CategoryApprovers,
  ApproverStats,
  ApproverListItem,
  EmployeeSearchResult,
  ApprovalConfig,
  ApiResponse,
  PaginationInfo
} from '@/types/superAdmin';

const BASE_URL = '/superadmin';

// ===========================================
// DASHBOARD
// ===========================================

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<ApiResponse<DashboardStats>>(`${BASE_URL}/dashboard/stats`);
  return response.data.data;
};

export const getSystemHealth = async (): Promise<SystemHealth> => {
  const response = await api.get<ApiResponse<SystemHealth>>(`${BASE_URL}/dashboard/health`);
  return response.data.data;
};

// ===========================================
// CATEGORY MANAGEMENT
// ===========================================

export interface GetCategoriesParams {
  highLevelCategory?: string;
  search?: string;
  isActive?: string;
}

export const getCategories = async (params?: GetCategoriesParams): Promise<SubCategoryConfig[]> => {
  const response = await api.get<ApiResponse<SubCategoryConfig[]>>(`${BASE_URL}/categories`, { params });
  return response.data.data;
};

export const getCategoryById = async (id: string): Promise<SubCategoryConfig> => {
  const response = await api.get<ApiResponse<SubCategoryConfig>>(`${BASE_URL}/categories/${id}`);
  return response.data.data;
};

export const createCategory = async (data: CategoryFormData): Promise<SubCategoryConfig> => {
  const response = await api.post<ApiResponse<SubCategoryConfig>>(`${BASE_URL}/categories`, data);
  return response.data.data;
};

export const updateCategory = async (id: string, data: Partial<CategoryFormData>): Promise<SubCategoryConfig> => {
  const response = await api.put<ApiResponse<SubCategoryConfig>>(`${BASE_URL}/categories/${id}`, data);
  return response.data.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/categories/${id}`);
};

export const updateCategoryApprovers = async (id: string, approvalConfig: ApprovalConfig): Promise<SubCategoryConfig> => {
  const response = await api.put<ApiResponse<SubCategoryConfig>>(`${BASE_URL}/categories/${id}/approvers`, { approvalConfig });
  return response.data.data;
};

// ===========================================
// USER MANAGEMENT
// ===========================================

export interface GetUsersParams {
  role?: string;
  department?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GetUsersResponse {
  users: SuperAdminUser[];
  pagination: PaginationInfo;
}

export const getUsers = async (params?: GetUsersParams): Promise<GetUsersResponse> => {
  const response = await api.get<ApiResponse<SuperAdminUser[]> & { pagination: PaginationInfo }>(`${BASE_URL}/users`, { params });
  return {
    users: response.data.data,
    pagination: response.data.pagination!
  };
};

export const getUserById = async (id: string): Promise<SuperAdminUser> => {
  const response = await api.get<ApiResponse<SuperAdminUser>>(`${BASE_URL}/users/${id}`);
  return response.data.data;
};

export const createUser = async (data: UserFormData): Promise<SuperAdminUser> => {
  const response = await api.post<ApiResponse<SuperAdminUser>>(`${BASE_URL}/users`, data);
  return response.data.data;
};

export const updateUser = async (id: string, data: Partial<UserFormData>): Promise<SuperAdminUser> => {
  const response = await api.put<ApiResponse<SuperAdminUser>>(`${BASE_URL}/users/${id}`, data);
  return response.data.data;
};

export const updateUserStatus = async (id: string, isActive: boolean): Promise<SuperAdminUser> => {
  const response = await api.put<ApiResponse<SuperAdminUser>>(`${BASE_URL}/users/${id}/status`, { isActive });
  return response.data.data;
};

export const updateUserRole = async (id: string, role: string): Promise<SuperAdminUser> => {
  const response = await api.put<ApiResponse<SuperAdminUser>>(`${BASE_URL}/users/${id}/role`, { role });
  return response.data.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`${BASE_URL}/users/${id}`);
};

// ===========================================
// APPROVER MANAGEMENT
// ===========================================

export const getApproversByCategory = async (): Promise<CategoryApprovers[]> => {
  const response = await api.get<ApiResponse<CategoryApprovers[]>>(`${BASE_URL}/approvers`);
  return response.data.data;
};

export const getApproverStats = async (): Promise<ApproverStats> => {
  const response = await api.get<ApiResponse<ApproverStats>>(`${BASE_URL}/approvers/stats`);
  return response.data.data;
};

export const getApproversList = async (): Promise<ApproverListItem[]> => {
  const response = await api.get<ApiResponse<ApproverListItem[]>>(`${BASE_URL}/approvers/list`);
  return response.data.data;
};

export const getAllApprovers = async (): Promise<ApproverListItem[]> => {
  const response = await api.get<ApiResponse<ApproverListItem[]>>(`${BASE_URL}/approvers/list`);
  return response.data.data;
};

// ===========================================
// EMPLOYEE SEARCH
// ===========================================

export const searchEmployees = async (query: string): Promise<EmployeeSearchResult[]> => {
  if (!query || query.length < 1) {
    return [];
  }
  const response = await api.get<ApiResponse<EmployeeSearchResult[]>>(`${BASE_URL}/employees/search`, {
    params: { q: query }
  });
  return response.data.data;
};

export default {
  // Dashboard
  getDashboardStats,
  getSystemHealth,
  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryApprovers,
  // Users
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  // Approvers
  getApproversByCategory,
  getApproverStats,
  getApproversList,
  getAllApprovers,
  // Search
  searchEmployees
};
