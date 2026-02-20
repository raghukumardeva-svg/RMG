/**
 * Super Admin Types
 * TypeScript interfaces for Super Admin module
 */

// ===========================================
// APPROVER TYPES
// ===========================================

export interface ApproverInfo {
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
}

export interface ApprovalLevelConfig {
  enabled: boolean;
  approvers: ApproverInfo[];
}

export interface ApprovalConfig {
  l1: ApprovalLevelConfig;
  l2: ApprovalLevelConfig;
  l3: ApprovalLevelConfig;
}

// ===========================================
// CATEGORY TYPES
// ===========================================

export type HighLevelCategory = 'IT' | 'Facilities' | 'Finance';

export interface SubCategoryConfig {
  id: string;
  _id?: string;
  highLevelCategory: HighLevelCategory;
  subCategory: string;
  requiresApproval: boolean;
  processingQueue: string;
  specialistQueue: string;
  order: number;
  isActive: boolean;
  approvalConfig: ApprovalConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryFormData {
  highLevelCategory: HighLevelCategory;
  subCategory: string;
  requiresApproval: boolean;
  processingQueue: string;
  specialistQueue: string;
  order: number;
  isActive: boolean;
  approvalConfig: ApprovalConfig;
}

// ===========================================
// USER MANAGEMENT TYPES
// ===========================================

export interface SuperAdminUser {
  id: string;
  _id?: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  designation?: string;
  employeeId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  approverAssignments?: ApproverAssignment[];
}

export interface ApproverAssignment {
  categoryId: string;
  category: string;
  levels: string[];
}

export interface UserFormData {
  email: string;
  password?: string;
  name: string;
  role: string;
  department?: string;
  designation?: string;
  employeeId?: string;
}

// ===========================================
// DASHBOARD TYPES
// ===========================================

export interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  openTickets: number;
  criticalTickets: number;
  pendingApprovals: {
    l1: number;
    l2: number;
    l3: number;
    total: number;
  };
  categoriesCount: number;
  categoriesByType: Record<string, number>;
}

export interface SystemHealth {
  database: string;
  api: string;
  timestamp: string;
}

// ===========================================
// APPROVER OVERVIEW TYPES
// ===========================================

export interface CategoryApprovers {
  categoryId: string;
  categoryName: string;
  subCategory: string;
  l1Approvers: ApproverInfo[];
  l2Approvers: ApproverInfo[];
  l3Approvers: ApproverInfo[];
  pendingCounts?: {
    l1: number;
    l2: number;
    l3: number;
  };
}

export interface ApproverStats {
  totalApprovers: number;
  totalApprovals: number;
  pendingApprovals: number;
  averageResponseTime: string;
  byLevel?: {
    L1: number;
    L2: number;
    L3: number;
  };
}

export interface ApproverListItem {
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  categories?: string[];
  levels?: string[];
  totalApprovals?: number;
  pendingApprovals?: number;
  averageResponseTime?: string;
  l1Categories?: string[];
  l2Categories?: string[];
  l3Categories?: string[];
}

// ===========================================
// EMPLOYEE SEARCH TYPES
// ===========================================

export interface EmployeeSearchResult {
  employeeId: string;
  name: string;
  email: string;
  designation?: string;
  department?: string;
}

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationInfo;
}
