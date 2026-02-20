import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLeaveStore } from '@/store/leaveStore';
import { useEmployeeStore } from '@/store/employeeStore';
import type { LeaveType, LeaveFormData, LeaveRequest } from '@/types/leave';
import { sanitizeString } from '@/utils/sanitize';
import { 
  Calendar as CalendarIcon, 
  AlertCircle, 
  AlertTriangle,
  Users, 
  Palmtree, 
  Bell, 
  FileText, 
  ArrowRight, 
  X, 
  Search,
  CheckCircle,
  Briefcase,
  Award,
  Baby,
  Upload,
  Thermometer,
  Heart,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ApplyLeaveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userEmail: string;
  department: string;
  managerId: string;
  onSuccess?: () => void;
  editData?: LeaveRequest | null; // For editing existing leave
  defaultLeaveType?: LeaveType | null; // Pre-select leave type from card
}

// Calculate weekdays excluding weekends
const calculateWeekdays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export function ApplyLeaveDrawer({
  open,
  onOpenChange,
  userId,
  userName,
  userEmail,
  department,
  managerId,
  onSuccess,
  editData,
  defaultLeaveType,
}: ApplyLeaveDrawerProps) {
  const { applyLeave, updateLeave, isLoading, leaveBalance, leaves } = useLeaveStore();
  const { employees, fetchEmployees } = useEmployeeStore();

  const [formData, setFormData] = useState<LeaveFormData>({
    leaveType: 'Earned Leave',
    startDate: '',
    endDate: '',
    justification: '',
    attachments: [],
    isHalfDay: false,
    halfDayType: null,
  });

  const [fromDate, setFromDateState] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Custom setFromDate with auto-focus functionality
  const setFromDate = (date: Date | undefined) => {
    setFromDateState(date);
    
    if (date) {
      formData.fromDate = date;
      // If no toDate is set, default to same date
      if (!formData.toDate) {
        formData.toDate = date;
        setToDate(date);
      }
      // If toDate is before fromDate, reset it
      if (formData.toDate && formData.toDate < date) {
        formData.toDate = date;
        setToDate(date);
      }
      
      // Auto-focus on To Date picker after a brief delay
      setTimeout(() => {
        toDatePopoverRef.current?.click();
      }, 150);
    } else {
      formData.fromDate = undefined;
    }
    
    setFormData({ ...formData });
  };

  const [errors, setErrors] = useState<{
    dates?: string;
    justification?: string;
  }>({});
  
  // Notify people picker state
  const [notifyPeople, setNotifyPeople] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const [showPeoplePicker, setShowPeoplePicker] = useState(false);
  const peoplePickerRef = useRef<HTMLDivElement>(null);
  const fromDatePopoverRef = useRef<HTMLButtonElement>(null);
  const toDatePopoverRef = useRef<HTMLButtonElement>(null);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees for people picker
  const filteredEmployees = useMemo(() => {
    if (!peopleSearchQuery.trim()) {
      // Show department members first, then others
      return employees
        .filter(emp => emp.employeeId !== userId && emp.status === 'active')
        .sort((a, b) => {
          if (a.department === department && b.department !== department) return -1;
          if (a.department !== department && b.department === department) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 10);
    }
    
    const query = peopleSearchQuery.toLowerCase();
    return employees
      .filter(emp => 
        emp.employeeId !== userId && 
        emp.status === 'active' &&
        (emp.name.toLowerCase().includes(query) || 
         emp.email.toLowerCase().includes(query) ||
         emp.department?.toLowerCase().includes(query))
      )
      .slice(0, 10);
  }, [employees, peopleSearchQuery, userId, department]);

  // Close people picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (peoplePickerRef.current && !peoplePickerRef.current.contains(event.target as Node)) {
        setShowPeoplePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if it's a single day leave
  const isSingleDay = fromDate && toDate &&
    fromDate.toDateString() === toDate.toDateString();

  // Calculate leave days dynamically
  const leaveDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    if (toDate < fromDate) return 0;
    const weekdays = calculateWeekdays(fromDate, toDate);
    // If half-day is selected for single day leave
    if (formData.isHalfDay && isSingleDay) {
      return 0.5;
    }
    return weekdays;
  }, [fromDate, toDate, formData.isHalfDay, isSingleDay]);

  // Check if earned leave would exceed 20 days with current request
  const wouldExceedEarnedLeave = useMemo(() => {
    if (leaveDays === 0) return false;
    
    // Only check if the requested days exceed earned leave balance
    if (fromDate && toDate) {
      const earnedLeaveRemaining = leaveBalance?.earnedLeave.remaining ?? 20;
      return leaveDays > earnedLeaveRemaining;
    }
    
    return false;
  }, [leaveDays, leaveBalance?.earnedLeave.remaining, fromDate, toDate]);

  // Check which leave types have sufficient balance for the requested days
  const leaveTypeAvailability = useMemo(() => {
    if (leaveDays === 0) {
      return {
        earnedLeave: true,
        sabbaticalLeave: true,
        compOff: true,
        paternityLeave: true
      };
    }

    return {
      earnedLeave: leaveDays <= (leaveBalance?.earnedLeave.remaining ?? 20),
      sabbaticalLeave: leaveDays <= (leaveBalance?.sabbaticalLeave.remaining ?? 180),
      compOff: leaveDays <= (leaveBalance?.compOff.remaining ?? 0),
      paternityLeave: leaveDays <= (leaveBalance?.paternityLeave.remaining ?? 3)
    };
  }, [leaveDays, leaveBalance]);

  // Determine if unpaid leave should be shown
  const shouldShowUnpaidLeave = wouldExceedEarnedLeave || formData.leaveType === 'Unpaid Leave';
  
  // Don't disable other types unless they specifically don't have enough balance
  const shouldDisableOtherTypes = false; // We'll handle individual type disabling in the dropdown

  // Get all dates where current user has existing leave (approved/pending)
  const userExistingLeaveDates = useMemo(() => {
    const dates = new Set<string>();
    
    leaves.forEach((leave: LeaveRequest) => {
      // Only current user's leaves
      if (leave.employeeId !== userId && leave.userId !== userId) return;
      // Skip rejected and cancelled leaves
      if (leave.status === 'rejected' || leave.status === 'cancelled') return;
      // Skip the leave being edited
      if (editData && (leave._id === editData._id || leave.id === editData.id)) return;
      
      const start = parseISO(leave.startDate);
      const end = parseISO(leave.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        dates.add(format(current, 'yyyy-MM-dd'));
        current.setDate(current.getDate() + 1);
      }
    });
    
    return dates;
  }, [leaves, userId, editData]);

  // Check if selected date range has overlap with existing leaves
  const hasOverlapWarning = useMemo(() => {
    if (!fromDate || !toDate) return null;
    
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (userExistingLeaveDates.has(dateStr)) {
        return `You already have leave on ${format(current, 'MMM dd, yyyy')}`;
      }
      current.setDate(current.getDate() + 1);
    }
    return null;
  }, [fromDate, toDate, userExistingLeaveDates]);

  // Helper function to check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    if (date < today) return true;
    return userExistingLeaveDates.has(format(date, 'yyyy-MM-dd'));
  };

  // Find team members on leave for the selected dates
  const teamMembersOnLeave = useMemo(() => {
    if (!fromDate || !toDate || !department) return [];

    return leaves.filter((leave: LeaveRequest) => {
      // Exclude current user's leaves
      if (leave.userId === userId) return false;
      // Only same department
      if (leave.department !== department) return false;
      // Only approved or pending leaves
      if (leave.status !== 'approved' && leave.status !== 'pending') return false;

      // Check date overlap
      const leaveStart = parseISO(leave.startDate);
      const leaveEnd = parseISO(leave.endDate);

      // Check if any day in the selected range overlaps with the leave
      const selectedStart = fromDate;
      const selectedEnd = toDate;

      // Overlap check: ranges overlap if start1 <= end2 AND start2 <= end1
      return selectedStart <= leaveEnd && leaveStart <= selectedEnd;
    });
  }, [fromDate, toDate, leaves, userId, department]);

  // Update formData when dates change
  useEffect(() => {
    if (fromDate) {
      setFormData(prev => ({
        ...prev,
        startDate: format(fromDate, 'yyyy-MM-dd'),
      }));
    }
  }, [fromDate]);

  useEffect(() => {
    if (toDate) {
      setFormData(prev => ({
        ...prev,
        endDate: format(toDate, 'yyyy-MM-dd'),
      }));
    }
  }, [toDate]);

  // Reset form when drawer opens/closes OR pre-fill when editing
  useEffect(() => {
    if (open && editData) {
      // Pre-fill form with existing leave data for editing
      setFormData({
        leaveType: editData.leaveType as LeaveType,
        startDate: editData.startDate,
        endDate: editData.endDate,
        justification: editData.justification || editData.leaveReason || '',
        attachments: [],
        isHalfDay: editData.isHalfDay || false,
        halfDayType: editData.halfDayType || null,
      });
      setFromDate(parseISO(editData.startDate));
      setToDate(parseISO(editData.endDate));
      setNotifyPeople(editData.notifyPeople || []);
      setErrors({});
    } else if (open && defaultLeaveType) {
      // Pre-select leave type from card Apply button
      setFormData(prev => ({
        ...prev,
        leaveType: defaultLeaveType,
      }));
    } else if (!open) {
      setFormData({
        leaveType: 'Earned Leave',
        startDate: '',
        endDate: '',
        justification: '',
        attachments: [],
        isHalfDay: false,
        halfDayType: null,
      });
      setFromDate(undefined);
      setToDate(undefined);
      setNotifyPeople([]);
      setPeopleSearchQuery('');
      setErrors({});
    }
  }, [open, editData, defaultLeaveType]);

  // Reset half-day when dates change to multi-day
  useEffect(() => {
    if (!isSingleDay && formData.isHalfDay) {
      setFormData(prev => ({
        ...prev,
        isHalfDay: false,
        halfDayType: null,
      }));
    }
  }, [isSingleDay, formData.isHalfDay]);

  // Auto-switch to unpaid leave when earned leave would exceed limit
  useEffect(() => {
    // Only auto-switch if:
    // 1. The requested days exceed earned leave balance
    // 2. User currently has "Earned Leave" selected (or default)
    // 3. Not editing an existing leave
    if (wouldExceedEarnedLeave && 
        (formData.leaveType === 'Earned Leave') && 
        !editData && 
        fromDate && toDate) {
      setFormData(prev => ({
        ...prev,
        leaveType: 'Unpaid Leave',
      }));
      toast.warning(`Requested ${leaveDays} days exceed earned leave balance (${leaveBalance?.earnedLeave.remaining ?? 20} days). Switched to Unpaid Leave.`);
    }
  }, [wouldExceedEarnedLeave, formData.leaveType, editData, fromDate, toDate, leaveDays, leaveBalance?.earnedLeave.remaining]);

  const validateForm = (): boolean => {
    const newErrors: {
      dates?: string;
      justification?: string;
    } = {};

    if (!fromDate || !toDate) {
      newErrors.dates = 'Please select both start and end dates';
    } else if (toDate < fromDate) {
      newErrors.dates = 'End date must be after start date';
    } else if (leaveDays === 0) {
      newErrors.dates = 'Leave period must include at least one weekday';
    }

    if (!formData.justification || formData.justification.trim().length < 10) {
      newErrors.justification = 'Justification must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get balance info for selected leave type
  const getLeaveBalanceInfo = () => {
    switch (formData.leaveType) {
      case 'Earned Leave':
        return { 
          total: leaveBalance?.earnedLeave.total ?? 20, 
          remaining: leaveBalance?.earnedLeave.remaining ?? 20,
          color: 'blue',
          icon: Briefcase
        };
      case 'Sabbatical Leave':
        return { 
          total: leaveBalance?.sabbaticalLeave.total ?? 182, 
          remaining: leaveBalance?.sabbaticalLeave.remaining ?? 182,
          color: 'purple',
          icon: Palmtree
        };
      case 'Comp Off':
        return { 
          total: leaveBalance?.compOff.total ?? 0, 
          remaining: leaveBalance?.compOff.remaining ?? 0,
          color: 'orange',
          icon: Award
        };
      case 'Paternity Leave':
        return { 
          total: leaveBalance?.paternityLeave.total ?? 3, 
          remaining: leaveBalance?.paternityLeave.remaining ?? 3,
          color: 'green',
          icon: Baby
        };
      case 'Unpaid Leave':
        return { 
          total: 0, 
          remaining: 999, // Infinite balance
          color: 'red',
          icon: XCircle
        };
      default:
        return { total: 0, remaining: 0, color: 'gray', icon: Briefcase };
    }
  };

  const balanceInfo = getLeaveBalanceInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Sanitize form data
      const sanitizedFormData = {
        ...formData,
        justification: sanitizeString(formData.justification),
        notifyPeople: notifyPeople,
      };

      if (editData) {
        // Update existing leave
        const leaveId = editData.id || editData._id || '';
        await updateLeave(leaveId, {
          leaveType: sanitizedFormData.leaveType,
          startDate: sanitizedFormData.startDate,
          endDate: sanitizedFormData.endDate,
          justification: sanitizedFormData.justification,
          isHalfDay: sanitizedFormData.isHalfDay,
          halfDayType: sanitizedFormData.halfDayType,
          days: leaveDays,
          notifyPeople: notifyPeople,
        });
        toast.success('Leave request updated successfully!');
      } else {
        // Create new leave
        await applyLeave(
          sanitizedFormData,
          userId,
          userName,
          userEmail,
          department,
          managerId
        );
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      toast.error(editData ? 'Failed to update leave request. Please try again.' : 'Failed to submit leave request. Please try again.');
    }
  };

  // Helper to add/remove people from notify list
  const toggleNotifyPerson = (employee: { employeeId: string; name: string; email: string }) => {
    const exists = notifyPeople.find(p => p.id === employee.employeeId);
    if (exists) {
      setNotifyPeople(prev => prev.filter(p => p.id !== employee.employeeId));
    } else {
      setNotifyPeople(prev => [...prev, { id: employee.employeeId, name: employee.name, email: employee.email }]);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        {/* Sticky Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Palmtree className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {editData ? 'Edit Leave Request' : 'Apply for Leave'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {editData ? 'Update your leave details' : 'Weekends are automatically excluded'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            
            {/* Section: Leave Period */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <CalendarIcon className="h-4 w-4" />
                Leave Period
              </div>
              
              <div className="bg-muted/30 rounded-xl p-4 border">
                <div className="flex items-center gap-3">
                  {/* From Date */}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          ref={fromDatePopoverRef}
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-11',
                            !fromDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {fromDate ? format(fromDate, 'MMM dd, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={fromDate}
                          onSelect={setFromDate}
                          disabled={isDateDisabled}
                          initialFocus
                        />
                        {userExistingLeaveDates.size > 0 && (
                          <div className="px-3 pb-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Dates with existing leave are disabled
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* Arrow */}
                  <div className="pt-5">
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {/* To Date */}
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">To</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          ref={toDatePopoverRef}
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal h-11',
                            !toDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                          {toDate ? format(toDate, 'MMM dd, yyyy') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          selected={toDate}
                          onSelect={setToDate}
                          disabled={(date: Date) => {
                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                            if (fromDate && date < fromDate) return true;
                            if (date < today) return true;
                            return userExistingLeaveDates.has(format(date, 'yyyy-MM-dd'));
                          }}
                          initialFocus
                        />
                        {userExistingLeaveDates.size > 0 && (
                          <div className="px-3 pb-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Dates with existing leave are disabled
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Overlap Warning */}
                {hasOverlapWarning && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{hasOverlapWarning}</span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                      Please select different dates to avoid overlap.
                    </p>
                  </div>
                )}

                {/* Leave Days Counter - Inline */}
                {leaveDays > 0 && !hasOverlapWarning && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">
                        {formData.isHalfDay ? 'Half day leave' : 'Excluding weekends'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">{leaveDays}</span>
                      <span className="text-sm text-muted-foreground">day{leaveDays !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {errors.dates && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{errors.dates}</p>
                </div>
              )}

              {/* Half-Day Toggle - Only for single day leaves */}
              {isSingleDay && (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={!formData.isHalfDay ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setFormData(prev => ({ ...prev, isHalfDay: false, halfDayType: null }))}
                    >
                      Full Day
                    </Button>
                    <Button
                      type="button"
                      variant={formData.isHalfDay ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => setFormData(prev => ({ ...prev, isHalfDay: true, halfDayType: 'first_half' }))}
                    >
                      Half Day
                    </Button>
                  </div>
                  {formData.isHalfDay && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={formData.halfDayType === 'first_half' ? 'secondary' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setFormData(prev => ({ ...prev, halfDayType: 'first_half' }))}
                      >
                        First Half
                      </Button>
                      <Button
                        type="button"
                        variant={formData.halfDayType === 'second_half' ? 'secondary' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => setFormData(prev => ({ ...prev, halfDayType: 'second_half' }))}
                      >
                        Second Half
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section: Leave Type */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Palmtree className="h-4 w-4" />
                Leave Type
              </div>

              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value as LeaveType })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Earned Leave" disabled={!leaveTypeAvailability.earnedLeave}>
                    <div className="flex items-center gap-2">
                      <Briefcase className={cn("h-4 w-4", !leaveTypeAvailability.earnedLeave ? "text-gray-400" : "text-blue-500")} />
                      <div className="flex flex-col">
                        <span className={cn("font-medium", !leaveTypeAvailability.earnedLeave && "text-gray-400")}>Earned Leave</span>
                        <span className="text-xs text-muted-foreground">
                          {leaveBalance?.earnedLeave.remaining ?? 20} days available
                          {!leaveTypeAvailability.earnedLeave && leaveDays > 0 && " (insufficient balance)"}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Sabbatical Leave" disabled={!leaveTypeAvailability.sabbaticalLeave}>
                    <div className="flex items-center gap-2">
                      <Palmtree className={cn("h-4 w-4", !leaveTypeAvailability.sabbaticalLeave ? "text-gray-400" : "text-purple-500")} />
                      <div className="flex flex-col">
                        <span className={cn("font-medium", !leaveTypeAvailability.sabbaticalLeave && "text-gray-400")}>Sabbatical Leave</span>
                        <span className="text-xs text-muted-foreground">
                          {leaveBalance?.sabbaticalLeave.remaining ?? 180} days available
                          {!leaveTypeAvailability.sabbaticalLeave && leaveDays > 0 && " (insufficient balance)"}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Comp Off" disabled={!leaveTypeAvailability.compOff}>
                    <div className="flex items-center gap-2">
                      <Award className={cn("h-4 w-4", !leaveTypeAvailability.compOff ? "text-gray-400" : "text-orange-500")} />
                      <div className="flex flex-col">
                        <span className={cn("font-medium", !leaveTypeAvailability.compOff && "text-gray-400")}>Comp Off</span>
                        <span className="text-xs text-muted-foreground">
                          {leaveBalance?.compOff.remaining ?? 0} days available
                          {!leaveTypeAvailability.compOff && leaveDays > 0 && " (insufficient balance)"}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Paternity Leave" disabled={!leaveTypeAvailability.paternityLeave}>
                    <div className="flex items-center gap-2">
                      <Baby className={cn("h-4 w-4", !leaveTypeAvailability.paternityLeave ? "text-gray-400" : "text-green-500")} />
                      <div className="flex flex-col">
                        <span className={cn("font-medium", !leaveTypeAvailability.paternityLeave && "text-gray-400")}>Paternity Leave</span>
                        <span className="text-xs text-muted-foreground">
                          {leaveBalance?.paternityLeave.remaining ?? 3} days available
                          {!leaveTypeAvailability.paternityLeave && leaveDays > 0 && " (insufficient balance)"}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Unpaid Leave">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <div className="flex flex-col">
                        <span className="font-medium">Unpaid Leave</span>
                        <span className="text-xs text-muted-foreground">
                          {wouldExceedEarnedLeave ? "Required - Earned leave exceeded" : "Unlimited days available"}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Balance Progress Bar */}
              <div className={cn(
                "rounded-lg p-3 border",
                balanceInfo.color === 'blue' && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900',
                balanceInfo.color === 'purple' && 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900',
                balanceInfo.color === 'orange' && 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900',
                balanceInfo.color === 'green' && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
                balanceInfo.color === 'red' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
              )}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    balanceInfo.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                    balanceInfo.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                    balanceInfo.color === 'orange' && 'text-orange-600 dark:text-orange-400',
                    balanceInfo.color === 'green' && 'text-green-600 dark:text-green-400',
                    balanceInfo.color === 'red' && 'text-red-600 dark:text-red-400',
                    balanceInfo.color === 'pink' && 'text-pink-600 dark:text-pink-400'
                  )}>
                    {formData.leaveType === 'Unpaid Leave' ? 'Unlimited' : `${balanceInfo.remaining} / ${balanceInfo.total} days`}
                  </span>
                </div>
                {formData.leaveType !== 'Unpaid Leave' && (
                  <Progress 
                    value={balanceInfo.total > 0 ? (balanceInfo.remaining / balanceInfo.total) * 100 : 0} 
                    className={cn(
                      "h-2",
                      balanceInfo.color === 'blue' && 'bg-blue-200 dark:bg-blue-900/50',
                      balanceInfo.color === 'purple' && 'bg-purple-200 dark:bg-purple-900/50',
                      balanceInfo.color === 'orange' && 'bg-orange-200 dark:bg-orange-900/50',
                      balanceInfo.color === 'green' && 'bg-green-200 dark:bg-green-900/50',
                      balanceInfo.color === 'red' && 'bg-red-200 dark:bg-red-900/50',
                      balanceInfo.color === 'pink' && 'bg-pink-200 dark:bg-pink-900/50'
                    )}
                  />
                )}
                {formData.leaveType === 'Unpaid Leave' && (
                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                    No deduction from paid leave balance
                  </div>
                )}
              </div>
            </div>

            {/* Section: Team Availability */}
            {teamMembersOnLeave.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  <Users className="h-4 w-4" />
                  Team Availability
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                      {teamMembersOnLeave.length} team member{teamMembersOnLeave.length > 1 ? 's' : ''} on leave
                    </span>
                  </div>
                  
                  {/* Avatar Stack */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {teamMembersOnLeave.slice(0, 4).map((leave, idx) => (
                        <TooltipProvider key={leave.id || leave._id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-gray-800 cursor-pointer hover:z-10 transition-transform hover:scale-110"
                                style={{ zIndex: 4 - idx }}
                              >
                                {leave.userName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{leave.userName}</p>
                              <p className="text-xs text-muted-foreground">{leave.leaveType}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {teamMembersOnLeave.length > 4 && (
                        <div className="h-8 w-8 rounded-full bg-orange-200 dark:bg-orange-900 flex items-center justify-center text-orange-700 dark:text-orange-300 text-xs font-semibold border-2 border-white dark:border-gray-800">
                          +{teamMembersOnLeave.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-orange-600 dark:text-orange-400 ml-2">
                      {teamMembersOnLeave.slice(0, 2).map(l => l.userName.split(' ')[0]).join(', ')}
                      {teamMembersOnLeave.length > 2 && ` +${teamMembersOnLeave.length - 2} more`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Notify People (NEW) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Bell className="h-4 w-4" />
                Notify <span className="text-xs font-normal normal-case">(Optional)</span>
              </div>

              <div ref={peoplePickerRef} className="relative">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people to notify..."
                    value={peopleSearchQuery}
                    onChange={(e) => setPeopleSearchQuery(e.target.value)}
                    onFocus={() => setShowPeoplePicker(true)}
                    className="pl-9 h-11"
                  />
                </div>

                {/* Dropdown */}
                {showPeoplePicker && filteredEmployees.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredEmployees.map((emp) => {
                      const isSelected = notifyPeople.some(p => p.id === emp.employeeId);
                      return (
                        <div
                          key={emp.employeeId}
                          onClick={() => toggleNotifyPerson(emp)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                            isSelected && "bg-primary/5"
                          )}
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                            {emp.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{emp.department}</p>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected People Chips */}
                {notifyPeople.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {notifyPeople.map((person) => (
                      <Badge
                        key={person.id}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 flex items-center gap-1.5"
                      >
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-semibold">
                          {person.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="text-xs">{person.name.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={() => setNotifyPeople(prev => prev.filter(p => p.id !== person.id))}
                          className="h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section: Reason */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <FileText className="h-4 w-4" />
                Reason
              </div>

              <Textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Please provide a detailed reason for your leave request..."
                rows={4}
                className={cn(
                  "resize-none",
                  errors.justification && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              <div className="flex items-center justify-between">
                {errors.justification ? (
                  <p className="text-xs text-red-600">{errors.justification}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Minimum 10 characters</p>
                )}
                <span className={cn(
                  "text-xs",
                  formData.justification.length < 10 ? 'text-muted-foreground' : 'text-green-600'
                )}>
                  {formData.justification.length}/10
                </span>
              </div>
            </div>

            {/* File Upload for Paternity */}
            {formData.leaveType === 'Paternity Leave' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  <Upload className="h-4 w-4" />
                  Attachments <span className="text-red-500">*</span>
                </div>
                
                <div className="border-2 border-dashed rounded-xl p-4 hover:border-primary/50 transition-colors">
                  <Input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFormData(prev => ({ ...prev, attachments: Array.from(e.target.files || []) }));
                      }
                    }}
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Birth certificate required (PDF, JPG, PNG)
                  </p>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-background shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || leaveDays === 0}
              onClick={handleSubmit}
              className="flex-1 h-11 shadow-lg shadow-primary/25"
            >
              {isLoading 
                ? (editData ? 'Updating...' : 'Submitting...') 
                : (editData ? 'Update Request' : '🚀 Submit Request')
              }
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
