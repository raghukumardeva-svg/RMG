export type NotificationType =
  | 'leave'
  | 'ticket'
  | 'system'
  | 'announcement'
  | 'reminder'
  | 'celebration'
  | 'approval'
  | 'rejection';

export type UserRole =
  | 'EMPLOYEE'
  | 'MANAGER'
  | 'HR'
  | 'IT_ADMIN'
  | 'IT_EMPLOYEE'
  | 'L1_APPROVER'
  | 'L2_APPROVER'
  | 'L3_APPROVER'
  | 'RMG'
  | 'FINANCE_ADMIN'
  | 'FACILITIES_ADMIN'
  | 'all';

export interface NotificationMeta {
  leaveId?: string;
  ticketId?: string;
  announcementId?: number;
  employeeId?: string;
  employeeName?: string;
  managerId?: string;
  managerName?: string;
  leaveType?: string;
  ticketSubject?: string;
  actionUrl?: string;
  [key: string]: string | number | undefined;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  userId?: string;          // Specific user (optional, for targeted notifications)
  role: UserRole;           // Role filter: employee | manager | itadmin | hr | all
  meta?: NotificationMeta;  // Additional context for navigation
}

export interface NotificationGroup {
  label: string;
  notifications: Notification[];
}

export interface CreateNotificationData {
  title: string;
  description: string;
  type: NotificationType;
  userId?: string;
  role: UserRole;
  meta?: NotificationMeta;
}
