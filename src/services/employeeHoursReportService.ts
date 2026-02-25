import apiClient from './api';

export interface EmployeeHoursData {
    employeeId: string;
    employeeName: string;
    email: string;
    department: string;
    allocationHours: number;
    actualBillableHours: number;
    actualNonBillableHours: number;
    billableApprovedHours: number;
    nonBillableApprovedHours: number;
    actualHours: number;
    approvedHours: number;
    pendingApprovedHours: number;
    rejectedHours: number;
    revisionRequestedHours: number;
    pendingDetails: {
        date: string;
        projectId: string;
        projectName: string;
        projectManagerName: string;
    }[];
}

export interface ReportSummary {
    totalAllocationHours: number;
    totalActualBillableHours: number;
    totalActualNonBillableHours: number;
    totalBillableApprovedHours: number;
    totalNonBillableApprovedHours: number;
    totalActualHours: number;
    totalApprovedHours: number;
    totalPendingApprovedHours: number;
    totalRejectedHours: number;
    totalRevisionRequestedHours: number;
}

export interface EmployeeHoursReportResponse {
    employees: EmployeeHoursData[];
    summary: ReportSummary;
    filters: {
        role: string;
        month: string;
        projectId: string | null;
        startDate: string | null;
        endDate: string | null;
        department: string | null;
    };
}

export interface ProjectOption {
    _id: string;
    projectId: string;
    projectName: string;
    projectCode: string;
}

export interface ReportFilters {
    employeeId?: string;
    role: 'EMPLOYEE' | 'RMG' | 'MANAGER';
    month?: string; // Format: YYYY-MM (optional when using date ranges)
    projectId?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
    managerId?: string;
}

class EmployeeHoursReportService {
    /**
     * Get employee hours report
     */
    async getReport(filters: ReportFilters): Promise<EmployeeHoursReportResponse> {
        const params = new URLSearchParams();

        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        params.append('role', filters.role);
        params.append('month', filters.month);
        if (filters.projectId) params.append('projectId', filters.projectId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.department) params.append('department', filters.department);
        if (filters.managerId) params.append('managerId', filters.managerId);

        const response = await apiClient.get(`/employee-hours-report?${params.toString()}`);
        return response.data;
    }

    /**
     * Get available projects for filter dropdown
     */
    async getProjects(role?: string, managerId?: string): Promise<ProjectOption[]> {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        if (managerId) params.append('managerId', managerId);

        const response = await apiClient.get(`/employee-hours-report/projects?${params.toString()}`);
        return response.data;
    }

    /**
     * Get available departments for filter dropdown
     */
    async getDepartments(): Promise<string[]> {
        const response = await apiClient.get('/employee-hours-report/departments');
        return response.data;
    }
}

export default new EmployeeHoursReportService();
