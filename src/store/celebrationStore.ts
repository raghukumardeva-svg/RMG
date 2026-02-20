import { create } from 'zustand';
import { useEmployeeStore } from './employeeStore';

export interface Celebration {
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

interface CelebrationState {
  getBirthdays: () => Celebration[];
  getAnniversaries: () => Celebration[];
  getAllCelebrations: () => Celebration[];
}

export const useCelebrationStore = create<CelebrationState>(() => ({
  getBirthdays: () => {
    // Get birthdays from employee store
    const birthdays = useEmployeeStore.getState().getBirthdays();
    return birthdays.map(b => ({
      id: b.id,
      employeeId: b.employeeId,
      name: b.name,
      type: 'birthday' as const,
      date: b.date,
      fullDate: b.fullDate,
      isToday: b.isToday,
      isUpcoming: b.isUpcoming,
      department: b.department,
      avatar: b.avatar,
      profilePhoto: b.profilePhoto,
      email: b.email,
      phone: b.phone,
      location: b.location,
      jobTitle: b.jobTitle,
      businessUnit: b.businessUnit,
    }));
  },

  getAnniversaries: () => {
    // Get anniversaries from employee store
    const anniversaries = useEmployeeStore.getState().getAnniversaries();
    return anniversaries.map(a => ({
      id: a.id,
      employeeId: a.employeeId,
      name: a.name,
      type: 'anniversary' as const,
      date: a.date,
      fullDate: a.fullDate,
      years: a.years,
      isToday: a.isToday,
      isUpcoming: a.isUpcoming,
      department: a.department,
      avatar: a.avatar,
      profilePhoto: a.profilePhoto,
      email: a.email,
      phone: a.phone,
      location: a.location,
      jobTitle: a.jobTitle,
      businessUnit: a.businessUnit,
    }));
  },

  getAllCelebrations: () => {
    const birthdays = useEmployeeStore.getState().getBirthdays();
    const anniversaries = useEmployeeStore.getState().getAnniversaries();

    const allCelebrations: Celebration[] = [
      ...birthdays.map(b => ({
        id: b.id,
        employeeId: b.employeeId,
        name: b.name,
        type: 'birthday' as const,
        date: b.date,
        fullDate: b.fullDate,
        isToday: b.isToday,
        isUpcoming: b.isUpcoming,
        department: b.department,
        avatar: b.avatar,
        profilePhoto: b.profilePhoto,
        email: b.email,
        phone: b.phone,
        location: b.location,
        jobTitle: b.jobTitle,
        businessUnit: b.businessUnit,
      })),
      ...anniversaries.map(a => ({
        id: a.id,
        employeeId: a.employeeId,
        name: a.name,
        type: 'anniversary' as const,
        date: a.date,
        fullDate: a.fullDate,
        years: a.years,
        isToday: a.isToday,
        isUpcoming: a.isUpcoming,
        department: a.department,
        avatar: a.avatar,
        profilePhoto: a.profilePhoto,
        email: a.email,
        phone: a.phone,
        location: a.location,
        jobTitle: a.jobTitle,
        businessUnit: a.businessUnit,
      })),
    ];

    // Sort: today's celebrations first, then upcoming by date
    return allCelebrations.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;
      return 0;
    });
  },
}));
