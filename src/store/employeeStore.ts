import { create } from 'zustand';
import { employeeService } from '@/services/employeeService';
import type { Employee, EmployeeFilters } from '@/services/employeeService';
import { toast } from 'sonner';

export interface CelebrationEmployee {
  id: string;
  employeeId: string;
  name: string;
  type: 'birthday' | 'anniversary';
  date: string;
  fullDate: string;
  years?: number;
  isToday?: boolean;
  isUpcoming?: boolean;
  department: string;
  avatar: string;
  profilePhoto?: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  businessUnit: string;
}

export interface NewJoinerEmployee {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  date: string;
  joinDate: string;
  fullDate: string;
  department: string;
  avatar: string;
  profilePhoto?: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  businessUnit: string;
}

interface EmployeeStore {
  employees: Employee[];
  activeEmployees: Employee[];
  isLoading: boolean;
  error: string | null;

  fetchEmployees: (filters?: EmployeeFilters) => Promise<void>;
  fetchActiveEmployees: () => Promise<void>;
  getNextEmployeeId: () => Promise<string>;
  addEmployee: (employee: Omit<Employee, '_id'>) => Promise<void>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  markInactive: (id: string) => Promise<void>;
  activateEmployee: (id: string) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  bulkUploadEmployees: (employees: Partial<Employee>[]) => Promise<void>;

  // Celebration utilities
  getBirthdays: () => CelebrationEmployee[];
  getAnniversaries: () => CelebrationEmployee[];
  getNewJoiners: (monthsThreshold?: number) => NewJoinerEmployee[];
}

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
  employees: [],
  activeEmployees: [],
  isLoading: false,
  error: null,

  fetchEmployees: async (filters) => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await employeeService.getAll(filters);
      set({ 
        employees: data,
        activeEmployees: data.filter(emp => emp.status === 'active'),
        isLoading: false 
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load employees';
      set({
        employees: [],
        activeEmployees: [],
        error: errorMessage,
        isLoading: false
      });
      console.error('Employee fetch error:', error);
      toast.error(`Failed to load employees: ${errorMessage}`);
    }
  },

  fetchActiveEmployees: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await employeeService.getActive();
      set({ activeEmployees: data, isLoading: false });
    } catch {
      set({ error: 'Failed to load active employees', isLoading: false });
      toast.error('Failed to load active employees');
    }
  },

  getNextEmployeeId: async () => {
    try {
      return await employeeService.getNextEmployeeId();
    } catch {
      // Generate local ID as fallback
      const employees = get().employees;
      if (employees.length === 0) return 'EMP001';
      const lastId = employees[employees.length - 1].employeeId;
      const lastNumber = parseInt(lastId.replace('EMP', ''));
      return `EMP${String(lastNumber + 1).padStart(3, '0')}`;
    }
  },

  addEmployee: async (employee) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.create(employee);

      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();

      toast.success('Employee added successfully');
    } catch (error) {
      set({ isLoading: false, error: 'Failed to add employee' });
      toast.error('Failed to add employee. Please check if the server is running.');
      throw error;
    }
  },

  updateEmployee: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.update(id, data);
      
      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();
      
      toast.success('Employee updated successfully');
    } catch (error) {
      set({ isLoading: false, error: 'Failed to update employee' });
      toast.error('Failed to update employee');
      throw error;
    }
  },

  markInactive: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.markInactive(id);
      
      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();
      
      toast.success('Employee marked as inactive');
    } catch (error) {
      set({ isLoading: false, error: 'Failed to mark employee inactive' });
      toast.error('Failed to mark employee inactive');
      throw error;
    }
  },

  activateEmployee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.activate(id);
      
      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();
      
      toast.success('Employee activated');
    } catch (error) {
      set({ isLoading: false, error: 'Failed to activate employee' });
      toast.error('Failed to activate employee');
      throw error;
    }
  },

  deleteEmployee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.delete(id);

      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();

      toast.success('Employee deleted successfully');
    } catch (error) {
      set({ isLoading: false, error: 'Failed to delete employee' });
      toast.error('Failed to delete employee');
      throw error;
    }
  },

  bulkUploadEmployees: async (employees) => {
    set({ isLoading: true, error: null });
    try {
      await employeeService.bulkUpload(employees);
      
      // Refresh employee list from server to ensure sync
      await get().fetchEmployees();
      
      // Count new vs updated (this is approximate since we don't track it in the response)
      toast.success(`Successfully uploaded ${employees.length} employee(s)`);
    } catch (error) {
      set({ isLoading: false, error: 'Failed to upload employees' });
      toast.error('Failed to upload employees. Please try again.');
      throw error;
    }
  },

  getBirthdays: () => {
    const employees = get().activeEmployees;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return employees
      .filter(emp => emp.dateOfBirth)
      .map(emp => {
        const birthDate = new Date(emp.dateOfBirth!);

        // Create this year's birthday date
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        thisYearBirthday.setHours(0, 0, 0, 0);

        // Check if birthday is today
        const isToday = thisYearBirthday.getTime() === today.getTime();

        // Check if birthday is within next 7 days (excluding today, excluding past)
        const isUpcoming = thisYearBirthday > today && thisYearBirthday <= sevenDaysFromNow;

        const shortDate = birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const fullDate = birthDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

        return {
          id: emp._id || emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.name,
          type: 'birthday' as const,
          date: shortDate,
          fullDate: fullDate,
          isToday,
          isUpcoming,
          department: emp.department,
          avatar: emp.name.split(' ').map(n => n[0]).join(''),
          profilePhoto: emp.profilePhoto,
          email: emp.email,
          phone: emp.phone,
          location: emp.location,
          jobTitle: emp.designation,
          businessUnit: emp.businessUnit,
          _sortDate: thisYearBirthday.getTime() // Temporary for sorting
        };
      })
      .filter(emp => emp.isToday || emp.isUpcoming) // Only show today or upcoming (next 7 days)
      .sort((a, b) => {
        // Sort: today first, then upcoming by date
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a._sortDate - b._sortDate;
      })
      .map(({ _sortDate: _, ...emp }) => emp); // Remove temp property
  },

  getAnniversaries: () => {
    const employees = get().activeEmployees;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    return employees
      .filter(emp => emp.dateOfJoining)
      .map(emp => {
        const joinDate = new Date(emp.dateOfJoining);
        const years = today.getFullYear() - joinDate.getFullYear();

        // Create this year's anniversary date
        const thisYearAnniversary = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
        thisYearAnniversary.setHours(0, 0, 0, 0);

        // Check if anniversary is today
        const isToday = thisYearAnniversary.getTime() === today.getTime();

        // Check if anniversary is within next 7 days (excluding today, excluding past)
        const isUpcoming = thisYearAnniversary > today && thisYearAnniversary <= sevenDaysFromNow;

        const shortDate = joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const fullDate = joinDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });

        return {
          id: emp._id || emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.name,
          type: 'anniversary' as const,
          date: shortDate,
          fullDate: fullDate,
          years,
          isToday,
          isUpcoming,
          department: emp.department,
          avatar: emp.name.split(' ').map(n => n[0]).join(''),
          profilePhoto: emp.profilePhoto,
          email: emp.email,
          phone: emp.phone,
          location: emp.location,
          jobTitle: emp.designation,
          businessUnit: emp.businessUnit,
          _sortDate: thisYearAnniversary.getTime() // Temporary for sorting
        };
      })
      .filter(emp => emp.isToday || emp.isUpcoming) // Only show today or upcoming (next 7 days)
      .sort((a, b) => {
        // Sort: today first, then upcoming by date
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a._sortDate - b._sortDate;
      })
      .map(({ _sortDate: _, ...emp }) => emp); // Remove temp property
  },

  getNewJoiners: (monthsThreshold = 3) => {
    const employees = get().activeEmployees;
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setMonth(today.getMonth() - monthsThreshold);

    return employees
      .filter(emp => {
        const joinDate = new Date(emp.dateOfJoining);
        return joinDate >= thresholdDate;
      })
      .map(emp => {
        const joinDate = new Date(emp.dateOfJoining);
        const shortDate = joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const longDate = joinDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const fullDate = joinDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

        return {
          id: emp._id || emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.name,
          role: emp.designation,
          date: shortDate,
          joinDate: longDate,
          fullDate: fullDate,
          department: emp.department,
          avatar: emp.name.split(' ').map(n => n[0]).join(''),
          profilePhoto: emp.profilePhoto,
          email: emp.email,
          phone: emp.phone,
          location: emp.location,
          jobTitle: emp.designation,
          businessUnit: emp.businessUnit
        };
      })
      .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime());
  },
}));
