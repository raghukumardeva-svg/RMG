import apiClient from './api';

export interface ApprovalEntryMeta {
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    rejectedReason?: string | null;
    date: string;
    entryId: string;
}

export interface TimesheetRow {
    projectId: string;
    projectCode: string;
    projectName: string;
    udaId: string;
    udaName: string;
    type?: string;
    financialLineItem: string;
    billable: string;
    hours: (string | null)[];
    comments: (string | null)[];
    entryMeta?: (ApprovalEntryMeta | null)[];
}

export interface Timesheet {
    _id?: string;
    employeeId: string;
    employeeName: string;
    weekStartDate: string;
    weekEndDate: string;
    rows: TimesheetRow[];
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    totalHours: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApprovalEntryMeta {
    approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    rejectedReason?: string | null;
    date: string;
    entryId: string;
}

export interface ApprovalTimesheet extends Timesheet {
    rows: (TimesheetRow & { entryMeta?: (ApprovalEntryMeta | null)[] })[];
}

const timesheetService = {
    // Get timesheet for a specific week
    getTimesheetForWeek: async (employeeId: string, weekStartDate: string): Promise<Timesheet | null> => {
        try {
            const response = await apiClient.get(`/timesheet-entries/week/${employeeId}/${weekStartDate}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching timesheet:', error);
            return null;
        }
    },

    // Get all timesheets for an employee
    getEmployeeTimesheets: async (employeeId: string, status?: string): Promise<Timesheet[]> => {
        try {
            const params = status ? `?status=${status}` : '';
            const response = await apiClient.get(`/timesheets/employee/${employeeId}${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching timesheets:', error);
            return [];
        }
    },

    // Save timesheet as draft
    saveDraft: async (timesheet: Omit<Timesheet, '_id' | 'createdAt' | 'updatedAt'>): Promise<Timesheet> => {
        const response = await apiClient.post('/timesheets/draft', timesheet);
        return response.data;
    },

    // Submit timesheet for approval
    submitTimesheet: async (timesheet: Omit<Timesheet, '_id' | 'createdAt' | 'updatedAt'>): Promise<Timesheet> => {
        const response = await apiClient.post('/timesheets/submit', timesheet);
        return response.data;
    },

    // Approve timesheet
    approveTimesheet: async (id: string, approvedBy: string): Promise<Timesheet> => {
        const response = await apiClient.put(`/timesheets/approve/${id}`, { approvedBy });
        return response.data;
    },

    // Reject timesheet
    rejectTimesheet: async (id: string, rejectedBy: string, rejectionReason: string): Promise<Timesheet> => {
        const response = await apiClient.put(`/timesheets/reject/${id}`, { rejectedBy, rejectionReason });
        return response.data;
    },

    // Delete timesheet (only drafts)
    deleteTimesheet: async (id: string): Promise<void> => {
        await apiClient.delete(`/timesheets/${id}`);
    },

    // Approver: fetch timesheet for approval
    getApproverTimesheet: async (params: {
        managerId: string;
        projectId: string;
        employeeId: string;
        weekStartDate: string;
    }): Promise<ApprovalTimesheet | null> => {
        try {
            const query = new URLSearchParams({
                managerId: params.managerId,
                projectId: params.projectId,
                employeeId: params.employeeId,
                weekStartDate: params.weekStartDate,
            });
            const response = await apiClient.get(`/timesheet-entries/approvals?${query}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching approvals:', error);
            return null;
        }
    },

    // Approver: approve entire week for project/employee
    approveWeek: async (payload: {
        managerId: string;
        projectId: string;
        employeeId: string;
        weekStartDate: string;
    }): Promise<{ updatedCount: number }> => {
        const response = await apiClient.put('/timesheet-entries/approvals/approve-week', payload);
        return response.data;
    },

    // Approver: bulk approve selected days for project/employee
    bulkApproveSelectedDays: async (payload: {
        managerId: string;
        projectId: string;
        employeeId: string;
        weekStartDate: string;
        dayIndices: number[];
    }): Promise<{ updatedCount: number }> => {
        const response = await apiClient.put('/timesheet-entries/approvals/bulk-approve-days', payload);
        return response.data;
    },

    // Approver: request revision for specific days
    requestRevision: async (payload: {
        managerId: string;
        projectId: string;
        employeeId: string;
        weekStartDate: string;
        reverts: { dayIndex: number; udaId: string; reason: string }[];
    }): Promise<{ updatedCount: number }> => {
        const response = await apiClient.put('/timesheet-entries/approvals/revision-request', payload);
        return response.data;
    },

    // Delete a specific row (project/UDA combination) for a week
    deleteRow: async (params: {
        employeeId: string;
        weekStartDate: string;
        projectId: string;
        udaId: string;
    }): Promise<{ deletedCount: number }> => {
        const { employeeId, weekStartDate, projectId, udaId } = params;
        const response = await apiClient.delete(`/timesheet-entries/row/${employeeId}/${weekStartDate}/${projectId}/${udaId}`);
        return response.data;
    },
};

export default timesheetService;
