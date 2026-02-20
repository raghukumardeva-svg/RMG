import { create } from 'zustand';
import { useEmployeeStore } from './employeeStore';

export interface NewJoiner {
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

interface NewJoinerState {
  getNewJoiners: (monthsThreshold?: number) => NewJoiner[];
}

export const useNewJoinerStore = create<NewJoinerState>(() => ({
  getNewJoiners: (monthsThreshold = 3) => {
    // Get new joiners from employee store
    const newJoiners = useEmployeeStore.getState().getNewJoiners(monthsThreshold);
    return newJoiners.map(nj => ({
      id: nj.id,
      employeeId: nj.employeeId,
      name: nj.name,
      role: nj.role,
      date: nj.date,
      joinDate: nj.joinDate,
      fullDate: nj.fullDate,
      department: nj.department,
      avatar: nj.avatar,
      profilePhoto: nj.profilePhoto,
      email: nj.email,
      phone: nj.phone,
      location: nj.location,
      jobTitle: nj.jobTitle,
      businessUnit: nj.businessUnit,
    }));
  },
}));
