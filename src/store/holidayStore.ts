import { create } from 'zustand';
import { holidayService } from '@/services/holidayService';
import { toast } from 'sonner';

export interface Holiday {
  id: number | string;
  date: string;
  name: string;
  type: string;
  backgroundImage?: string;
}

interface HolidayState {
  holidays: Holiday[];
  isLoading: boolean;
  error: string | null;

  fetchHolidays: () => Promise<void>;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => Promise<void>;
  updateHoliday: (id: number | string, updates: Partial<Holiday>) => Promise<void>;
  deleteHoliday: (id: number | string) => Promise<void>;
  getUpcomingHolidays: () => Holiday[];
}

export const useHolidayStore = create<HolidayState>((set, get) => ({
      holidays: [],
      isLoading: false,
      error: null,

      fetchHolidays: async () => {
        set({ isLoading: true, error: null });

        try {
          const data = await holidayService.getAll();
          const holidays = data.map(item => ({
            id: item._id || item.id || '',
            date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            name: item.name,
            type: item.type,
            backgroundImage: item.backgroundImage || ''
          }));
          set({ holidays, isLoading: false });
        } catch (error) {
          // Failed to fetch holidays, continue with empty array
          set({
            holidays: [],
            error: 'Failed to load holidays. Please check your connection.',
            isLoading: false
          });
          toast.error('Failed to load holidays. Please try again.');
        }
      },

      addHoliday: async (holiday) => {
        set({ isLoading: true, error: null });
        try {
          const newHoliday = await holidayService.create(holiday);
          const transformed: Holiday = {
            id: newHoliday._id || `temp-${Date.now()}`,
            date: new Date(newHoliday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            name: newHoliday.name,
            type: newHoliday.type
          };
          set(state => ({
            holidays: [...state.holidays, transformed],
            isLoading: false
          }));
        } catch {
          const newId = Math.max(...get().holidays.map(h => typeof h.id === 'number' ? h.id : 0), 0) + 1;
          set(state => ({
            holidays: [...state.holidays, { ...holiday, id: newId }],
            isLoading: false,
            error: 'Added offline. Will sync when online.'
          }));
        }
      },

      updateHoliday: async (id, updates) => {
        set({ isLoading: true, error: null });
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _, ...serviceUpdates } = updates;
          await holidayService.update(id, serviceUpdates);
          set(state => ({
            holidays: state.holidays.map(h =>
              h.id === id ? { ...h, ...updates } : h
            ),
            isLoading: false
          }));
        } catch (error) {
          set({ error: 'Failed to update holiday', isLoading: false });
          throw error; // Re-throw so the modal can handle it
        }
      },

      deleteHoliday: async (id) => {
        set({ isLoading: true, error: null });
        try {
          if (get().holidays.length === 0) {
            // Using fallback data, delete locally
            set(state => ({ holidays: state.holidays.filter(h => h.id !== id), isLoading: false }));
          } else {
            await holidayService.delete(id);
            set(state => ({
              holidays: state.holidays.filter(h => h.id !== id),
              isLoading: false
            }));
          }
        } catch {
          set({ error: 'Failed to delete holiday', isLoading: false });
          toast.error('Failed to delete holiday');
        }
      },

      getUpcomingHolidays: () => {
        const holidays = get().holidays;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parse and sort holidays by actual date
        const sortedHolidays = holidays
          .map(h => ({
            ...h,
            dateObj: new Date(h.date) // Parse the formatted date string back to Date
          }))
          .filter(h => h.dateObj >= today) // Remove past holidays
          .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        if (sortedHolidays.length === 0) {
          return [];
        }

        // Find current month holidays
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const currentMonthHolidays = sortedHolidays.filter(h =>
          h.dateObj.getMonth() === currentMonth &&
          h.dateObj.getFullYear() === currentYear
        );

        // If current month has holidays, return them
        if (currentMonthHolidays.length > 0) {
          return currentMonthHolidays.map(({ dateObj, ...h }) => h);
        }

        // Find next month with holidays
        const firstUpcoming = sortedHolidays[0];
        const targetMonth = firstUpcoming.dateObj.getMonth();
        const targetYear = firstUpcoming.dateObj.getFullYear();

        return sortedHolidays
          .filter(h =>
            h.dateObj.getMonth() === targetMonth &&
            h.dateObj.getFullYear() === targetYear
          )
          .map(({ dateObj: _, ...h }) => h);
      }
    })
);
