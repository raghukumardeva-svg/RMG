import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD format
  checkIn: string | null; // HH:MM AM/PM format
  checkOut: string | null; // HH:MM AM/PM format
  effectiveHours: string; // "8h 42m" format
  grossHours: string; // "8h 42m" format
  status: 'Present' | 'WFH' | 'W-Off' | 'Leave' | 'Holiday' | 'Absent';
  userId: string;
  checkInTimestamp?: number;
  checkOutTimestamp?: number;
}

interface AttendanceState {
  records: AttendanceRecord[];
  checkIn: (userId: string) => void;
  checkOut: (userId: string) => void;
  getTodayRecord: (userId: string) => AttendanceRecord | undefined;
  getRecordsByUserId: (userId: string) => AttendanceRecord[];
  updateRecord: (date: string, userId: string, updates: Partial<AttendanceRecord>) => void;
  deleteRecord: (date: string, userId: string) => void;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const calculateHoursDiff = (startTimestamp: number, endTimestamp: number): string => {
  const diffMs = endTimestamp - startTimestamp;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: [],

      checkIn: (userId: string) => {
        const today = getTodayDateString();
        const existingRecord = get().records.find(
          r => r.date === today && r.userId === userId
        );

        // If already checked in and not checked out, don't allow re-check-in
        if (existingRecord?.checkIn && !existingRecord?.checkOut) {
          return;
        }

        const now = new Date();
        const checkInTime = formatTime(now);
        const checkInTimestamp = now.getTime();

        // If checked out, create a new record for the new check-in session
        if (existingRecord?.checkOut) {
          const newRecord: AttendanceRecord = {
            date: today,
            checkIn: checkInTime,
            checkOut: null,
            effectiveHours: '0h 0m',
            grossHours: '0h 0m',
            status: 'Present',
            userId,
            checkInTimestamp,
          };
          set(state => ({ records: [...state.records, newRecord] }));
        } else if (existingRecord) {
          // Update existing record if no check-in yet
          set(state => ({
            records: state.records.map(r =>
              r.date === today && r.userId === userId
                ? { ...r, checkIn: checkInTime, checkInTimestamp, status: 'Present' }
                : r
            )
          }));
        } else {
          // Create new record
          const newRecord: AttendanceRecord = {
            date: today,
            checkIn: checkInTime,
            checkOut: null,
            effectiveHours: '0h 0m',
            grossHours: '0h 0m',
            status: 'Present',
            userId,
            checkInTimestamp,
          };
          set(state => ({ records: [...state.records, newRecord] }));
        }
      },

      checkOut: (userId: string) => {
        const today = getTodayDateString();
        // Find the most recent record for today that doesn't have a checkout
        const todayRecords = get().records.filter(
          r => r.date === today && r.userId === userId
        );
        const record = todayRecords
          .sort((a, b) => (b.checkInTimestamp || 0) - (a.checkInTimestamp || 0))
          .find(r => r.checkIn && !r.checkOut);

        if (!record) {
          return;
        }

        const now = new Date();
        const checkOutTime = formatTime(now);
        const checkOutTimestamp = now.getTime();
        
        const effectiveHours = calculateHoursDiff(
          record.checkInTimestamp!,
          checkOutTimestamp
        );

        set(state => ({
          records: state.records.map(r =>
            r.date === today && r.userId === userId && r.checkInTimestamp === record.checkInTimestamp
              ? {
                  ...r,
                  checkOut: checkOutTime,
                  checkOutTimestamp,
                  effectiveHours,
                  grossHours: effectiveHours,
                }
              : r
          )
        }));
      },

      getTodayRecord: (userId: string) => {
        const today = getTodayDateString();
        // Get the most recent record for today (in case of multiple check-ins)
        const todayRecords = get().records
          .filter(r => r.date === today && r.userId === userId)
          .sort((a, b) => (b.checkInTimestamp || 0) - (a.checkInTimestamp || 0));
        return todayRecords[0];
      },

      getRecordsByUserId: (userId: string) => {
        return get().records
          .filter(r => r.userId === userId)
          .sort((a, b) => b.date.localeCompare(a.date));
      },

      updateRecord: (date: string, userId: string, updates: Partial<AttendanceRecord>) => {
        set(state => ({
          records: state.records.map(r =>
            r.date === date && r.userId === userId
              ? { ...r, ...updates }
              : r
          )
        }));
      },

      deleteRecord: (date: string, userId: string) => {
        set(state => ({
          records: state.records.filter(
            r => !(r.date === date && r.userId === userId)
          )
        }));
      },
    }),
    {
      name: 'attendance-storage',
    }
  )
);
