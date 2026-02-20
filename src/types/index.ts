export type UserRole = 'EMPLOYEE' | 'HR' | 'RMG' | 'MANAGER' | 'IT_ADMIN' | 'IT_EMPLOYEE' | 'L1_APPROVER' | 'L2_APPROVER' | 'L3_APPROVER' | 'SUPER_ADMIN' | 'FINANCE_ADMIN' | 'FACILITIES_ADMIN';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  employeeId?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  joiningDate: string;
  reportingManager: string;
  status: 'active' | 'inactive';
  phone?: string;
  avatar?: string;
  skills?: string[];
  certifications?: string[];
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'absent' | 'leave' | 'remote';
  hours?: number;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: 'sick' | 'casual' | 'earned' | 'remote';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  approvedBy?: string;
}

export interface LeaveBalance {
  employeeId: string;
  sick: number;
  casual: number;
  earned: number;
  remote: number;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  tax: number;
  netSalary: number;
  status: 'processed' | 'pending';
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  budget?: number;
}

export interface ResourceAllocation {
  id: string;
  employeeId: string;
  projectId: string;
  startDate: string;
  endDate?: string;
  allocation: number; // percentage
  billable: boolean;
}

export interface Performance {
  id: string;
  employeeId: string;
  period: string;
  rating: number;
  goals: Goal[];
  feedback?: string;
  reviewedBy?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  author: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedOn: string;
  category: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'rejected';
  appliedDate: string;
  experience: number;
  skills: string[];
}
