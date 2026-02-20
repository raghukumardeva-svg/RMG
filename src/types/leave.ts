export type LeaveType =
  | 'Earned Leave'
  | 'Sabbatical Leave'
  | 'Comp Off'
  | 'Paternity Leave'
  | 'Unpaid Leave';

export type LeaveReason = 'Personal' | 'Medical' | 'Family';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveAttachment {
  fileName: string;
  url: string;
  type: 'medical' | 'birth_certificate' | 'justification';
  uploadedAt: string;
}

export interface LeaveBalance {
  userId: string;
  earnedLeave: {
    total: number;
    used: number;
    remaining: number;
  };
  sabbaticalLeave: {
    total: number;
    used: number;
    remaining: number;
  };
  compOff: {
    total: number;
    used: number;
    remaining: number;
  };
  paternityLeave: {
    total: number;
    used: number;
    remaining: number;
  };
}

export interface LeaveRequest {
  _id?: string;
  id: string;
  oderId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  employeeId?: string;
  employeeName?: string;
  leaveType: LeaveType;
  leaveReason?: LeaveReason;
  startDate: string;
  endDate: string;
  days: number;
  isHalfDay?: boolean;
  halfDayType?: 'first_half' | 'second_half' | null;
  status: LeaveStatus;
  createdAt: string;
  expiresAt: string | null; // For Emergency Leave - must use within 24 hours
  attachments: LeaveAttachment[];
  justification: string;
  managerId: string;
  managerName?: string;
  hrNotified: boolean;
  notes: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notifyPeople?: Array<{ id: string; name: string; email: string }>;
}

export interface LeaveFormData {
  leaveType: LeaveType;
  leaveReason?: LeaveReason;
  startDate: string;
  endDate: string;
  justification: string;
  attachments?: File[];
  isHalfDay?: boolean;
  halfDayType?: 'first_half' | 'second_half' | null;
  notifyPeople?: Array<{ id: string; name: string; email: string }>;
}

export interface LeaveValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Default leave balances for new employees
export const DEFAULT_LEAVE_BALANCE: Omit<LeaveBalance, 'userId'> = {
  earnedLeave: {
    total: 20, // Annual leave allocation
    used: 0,
    remaining: 20,
  },
  sabbaticalLeave: {
    total: 182, // 6 months
    used: 0,
    remaining: 182,
  },
  compOff: {
    total: 0, // Accrued based on overtime work
    used: 0,
    remaining: 0,
  },
  paternityLeave: {
    total: 3, // Paternity leave days
    used: 0,
    remaining: 3,
  },
};
