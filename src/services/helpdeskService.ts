import apiClient from './api';
import type { HelpdeskTicket } from '@/types/helpdesk';
import type {
  HelpdeskTicket as NewHelpdeskTicket,
  HelpdeskFormData,
  ProgressStatus,
} from '@/types/helpdeskNew';

export const helpdeskService = {
  // ==================== Basic CRUD Operations ====================
  
  // Get all tickets
  getAll: async () => {
    const response = await apiClient.get<{ success: boolean; data: HelpdeskTicket[] }>(
      '/helpdesk'
    );
    return response.data.data;
  },

  // Get tickets by user ID
  getByUserId: async (userId: string) => {
    const response = await apiClient.get<{ success: boolean; data: HelpdeskTicket[] }>(
      `/helpdesk/user/${userId}`
    );
    return response.data.data;
  },

  // Get ticket by ID
  getById: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: HelpdeskTicket }>(
      `/helpdesk/${id}`
    );
    return response.data.data;
  },

  // Create ticket with new workflow
  createWithWorkflow: async (
    formData: HelpdeskFormData,
    requesterId: string,
    requesterName: string,
    requesterEmail: string,
    department?: string
  ) => {
    // Fetch subcategory configuration from API to check if approval is required
    let requiresApproval = false;

    try {
      const configResponse = await apiClient.get<{ success: boolean; data: any }>(
        `/subcategory-config/${formData.highLevelCategory}/${encodeURIComponent(formData.subCategory)}`
      );
      requiresApproval = configResponse.data.data?.requiresApproval || false;
    } catch (configError: any) {
      // Non-blocking: If config lookup fails for any reason, proceed with no approval
      // This ensures ticket creation is never blocked by config issues
      console.warn(
        `⚠️ SubCategory config lookup failed for ${formData.highLevelCategory}/${formData.subCategory}. ` +
        `Proceeding with no approval required. Error:`, 
        configError?.response?.status || configError?.message
      );
      requiresApproval = false;
    }

    // Extract and exclude File objects from attachments
    // File upload is not yet implemented - File objects cannot be sent as JSON
    // Backend expects array of strings (file paths/URLs), not File objects
    const { attachments, ...restFormData } = formData;

    const payload = {
      ...restFormData,
      urgency: formData.urgency.toLowerCase(), // Ensure urgency is lowercase for backend
      // Backend validation expects userId/userName/userEmail, not requesterId/requesterName/requesterEmail
      userId: requesterId,
      userName: requesterName,
      userEmail: requesterEmail,
      userDepartment: department || '',
      requiresApproval, // CRITICAL: Include approval requirement
      attachments: [], // File upload not implemented yet - send empty array
    };

    try {
      const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
        '/helpdesk/workflow',
        payload
      );

      return response.data.data;
    } catch (error: any) {
      // Parse validation errors from backend response
      if (error?.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const messages = details.map((d: { field: string; message: string }) => `${d.field}: ${d.message}`).join('; ');
        console.error('❌ Validation errors:', details);
        throw new Error(`Validation failed: ${messages}`);
      }
      
      // Parse generic error message
      if (error?.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      // Re-throw original error
      throw error;
    }
  },

  // Create ticket (legacy)
  create: async (ticketData: Omit<HelpdeskTicket, '_id' | 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const response = await apiClient.post<{ success: boolean; data: HelpdeskTicket }>(
      '/helpdesk',
      ticketData
    );
    return response.data.data;
  },

  // Update ticket
  update: async (id: string, data: Partial<HelpdeskTicket>) => {
    const response = await apiClient.put<{ success: boolean; data: HelpdeskTicket }>(
      `/helpdesk/${id}`,
      data
    );
    return response.data.data;
  },

  // Delete ticket
  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/helpdesk/${id}`
    );
    return response.data;
  },

  // ==================== Approval Workflow ====================

  // L1 Approval/Rejection
  approveL1: async (ticketId: string, approverId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/approvals/l1/${ticketId}`,
      {
        approverId,
        status,
        comments,
      }
    );
    return response.data.data;
  },

  // L2 Approval/Rejection
  approveL2: async (ticketId: string, approverId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/approvals/l2/${ticketId}`,
      {
        approverId,
        status,
        comments,
      }
    );
    return response.data.data;
  },

  // L3 Approval/Rejection
  approveL3: async (ticketId: string, approverId: string, status: 'Approved' | 'Rejected', comments?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/approvals/l3/${ticketId}`,
      {
        approverId,
        status,
        comments,
      }
    );
    return response.data.data;
  },

  // Get pending approvals for approver
  getPendingApprovals: async (approverId: string) => {
    const response = await apiClient.get<{ success: boolean; data: NewHelpdeskTicket[] }>(
      `/approvals/pending/${approverId}`
    );
    return response.data.data;
  },

  // Get ALL tickets for approver (active + historical)
  getAllApproverTickets: async (approverId: string) => {
    const response = await apiClient.get<{ success: boolean; data: NewHelpdeskTicket[] }>(
      `/approvals/all/${approverId}`
    );
    return response.data.data;
  },

  // Get approval history for ticket
  getApprovalHistory: async (ticketId: string) => {
    const response = await apiClient.get<{ 
      success: boolean; 
      data: Array<{
        level: string;
        approverId: string;
        approverName?: string;
        status: string;
        comments?: string;
        timestamp: Date;
      }>
    }>(`/approvals/history/${ticketId}`);
    return response.data.data;
  },

  // Legacy approve method (deprecated)
  approve: async (ticketId: string, level: number, approverId: string, approverName: string, remarks?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/approve`,
      {
        level,
        approverId,
        approverName,
        remarks,
      }
    );
    return response.data.data;
  },

  // Reject ticket at specific level
  reject: async (ticketId: string, level: number, approverId: string, approverName: string, remarks: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/reject`,
      {
        level,
        approverId,
        approverName,
        remarks,
      }
    );
    return response.data.data;
  },

  // ==================== Routing & Assignment ====================

  // Route ticket to department queue (auto-triggered after approval or direct routing)
  route: async (ticketId: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/route`,
      {}
    );
    return response.data.data;
  },

  // Assign ticket to specialist
  assign: async (ticketId: string, specialistId: string, specialistName: string, queue: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/assign`,
      {
        specialistId,
        specialistName,
        queue,
      }
    );
    return response.data.data;
  },

  // Get tickets in specific queue
  getQueueTickets: async (queue: string) => {
    const response = await apiClient.get<{ success: boolean; data: NewHelpdeskTicket[] }>(
      `/helpdesk/queue/${queue}`
    );
    return response.data.data;
  },

  // Get tickets assigned to specialist
  getMyAssignedTickets: async (specialistId: string) => {
    const response = await apiClient.get<{ success: boolean; data: NewHelpdeskTicket[] }>(
      `/helpdesk/assigned/${specialistId}`
    );
    return response.data.data;
  },

  // ==================== Progress Tracking ====================

  // Update work progress
  updateProgress: async (ticketId: string, progressStatus: ProgressStatus, notes?: string) => {
    const response = await apiClient.patch<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/progress`,
      {
        progressStatus,
        notes,
      }
    );
    return response.data.data;
  },

  // Mark work as completed
  completeWork: async (ticketId: string, resolutionNotes: string, completedBy: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/complete`,
      {
        resolutionNotes,
        completedBy,
      }
    );
    return response.data.data;
  },

  // User confirms work completion
  confirmCompletion: async (ticketId: string, confirmedBy: string, feedback?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/confirm-completion`,
      {
        confirmedBy,
        feedback,
      }
    );
    return response.data.data;
  },

  // Close ticket (auto or manual)
  close: async (ticketId: string, closedBy: string, closingNotes?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/close`,
      {
        closedBy,
        closingNotes,
      }
    );
    return response.data.data;
  },

  // Pause ticket (IT Specialist)
  pauseTicket: async (ticketId: string, pausedBy: string, reason?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/pause`,
      { pausedBy, reason }
    );
    return response.data.data;
  },

  // Resume ticket (IT Specialist)
  resumeTicket: async (ticketId: string, resumedBy: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/resume`,
      { resumedBy }
    );
    return response.data.data;
  },

  // Close ticket (IT Specialist) - after user confirmation
  closeTicket: async (ticketId: string, closedBy: string, closingNotes?: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/close`,
      { closedBy, closingNotes }
    );
    return response.data.data;
  },

  // ==================== Conversation & Messages ====================

  // Add message to conversation
  addMessage: async (
    id: string,
    sender: 'employee' | 'itadmin' | 'manager' | 'system',
    senderName: string,
    message: string,
    attachments?: string[]
  ) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${id}/message`,
      { sender, senderName, message, attachments }
    );
    return response.data.data;
  },

  // ==================== Legacy Methods (backward compatibility) ====================

  // Update ticket status (legacy)
  updateStatus: async (id: string, status: HelpdeskTicket['status'], cancelledBy?: string) => {
    const response = await apiClient.patch<{ success: boolean; data: HelpdeskTicket }>(
      `/helpdesk/${id}/status`,
      { status, ...(cancelledBy && { cancelledBy }) }
    );
    return response.data.data;
  },

  // Resolve ticket (legacy)
  resolve: async (id: string, resolvedBy: string, notes?: string) => {
    const response = await apiClient.patch<{ success: boolean; data: HelpdeskTicket }>(
      `/helpdesk/${id}/resolve`,
      { resolvedBy, notes }
    );
    return response.data.data;
  },

  // Add reply/comment to ticket (legacy)
  addReply: async (id: string, author: string, message: string, isAdmin: boolean) => {
    const response = await apiClient.post<{ success: boolean; data: HelpdeskTicket }>(
      `/helpdesk/${id}/reply`,
      { author, message, isAdmin }
    );
    return response.data.data;
  },

  // ==================== IT Specialist Management ====================
  
  // Get all IT specialists
  getITSpecialists: async (): Promise<Array<{ id: string; employeeId: string; name: string; email: string; specializations: string[]; team: string; status: string; activeTicketCount: number; maxCapacity: number; designation: string }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; employeeId: string; name: string; email: string; specializations: string[]; team: string; status: string; activeTicketCount: number; maxCapacity: number; designation: string }> }>(
        '/it-specialists?status=active'
      );
      return response.data.data;
    } catch (error) {
      // Error fetching IT specialists
      return [];
    }
  },

  // Get IT specialists by specialization
  getSpecialistsBySpecialization: async (specialization: string): Promise<Array<{ id: string; employeeId: string; name: string; email: string; specializations: string[]; team: string; status: string; activeTicketCount: number; maxCapacity: number; designation: string }>> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: Array<{ id: string; employeeId: string; name: string; email: string; specializations: string[]; team: string; status: string; activeTicketCount: number; maxCapacity: number; designation: string }> }>(
        `/it-specialists/specialization/${encodeURIComponent(specialization)}`
      );
      return response.data.data;
    } catch (error) {
      // Error fetching specialists by specialization
      return [];
    }
  },

  // Assign ticket to IT employee (IT Admin only)
  assignToITEmployee: async (
    ticketId: string,
    employeeId: string,
    employeeName: string,
    assignedById: string,
    assignedByName: string,
    notes?: string
  ) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/assign`,
      {
        employeeId,
        employeeName,
        assignedById,
        assignedByName,
        notes,
      }
    );
    return response.data.data;
  },

  // Reassign ticket to a different IT employee (IT Admin only)
  reassignTicket: async (
    ticketId: string,
    newEmployeeId: string,
    newEmployeeName: string,
    reassignedById: string,
    reassignedByName: string,
    reason: string
  ) => {
    const response = await apiClient.put<{ success: boolean; data: NewHelpdeskTicket }>(
      `/helpdesk/${ticketId}/reassign`,
      {
        newEmployeeId,
        newEmployeeName,
        reassignedById,
        reassignedByName,
        reason,
      }
    );
    return response.data.data;
  },

  // Reopen a closed ticket
  reopen: async (ticketId: string, reason: string) => {
    const response = await apiClient.post<{ success: boolean; data: NewHelpdeskTicket; message: string }>(
      `/helpdesk/${ticketId}/reopen`,
      { reason }
    );
    return response.data.data;
  },
};
