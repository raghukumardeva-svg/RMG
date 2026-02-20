import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import type { HelpdeskTicket as NewHelpdeskTicket } from '@/types/helpdeskNew';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { TicketAge } from '@/components/helpdesk/TicketAge';
import { getTicketAgeInHours } from '@/lib/ticketUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  UserPlus,
  TrendingUp,
  Activity,
  Search,
  Shield,
  Calendar,
  User,
  BarChart3,
  Users,
  RotateCcw,
  Eye,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Download,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useITAdminGuard } from '@/hooks/useITAdminGuard';
import { AssignTicketDrawer } from '@/components/itadmin/AssignTicketDrawer';
import { BulkAssignDialog } from '@/components/itadmin/BulkAssignDialog';
import { ReassignDrawer } from '@/components/itadmin/ReassignDrawer';
import { ViewTicket } from '@/components/helpdesk/ViewTicket';
import { helpdeskService } from '@/services/helpdeskService';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { WeeklyAnalytics } from '@/components/analytics/WeeklyAnalytics';
import { MonthlyStatistics } from '@/components/analytics/MonthlyStatistics';

export function ITAdminDashboard() {
  const navigate = useNavigate();
  const { isITAdmin, user } = useITAdminGuard();
  const { tickets, fetchTickets, isLoading } = useHelpdeskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('');
  const [assignedStatusFilter, setAssignedStatusFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('itadmin-assigned-status-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [assignedTypeFilter, setAssignedTypeFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('itadmin-assigned-type-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedTicket, setSelectedTicket] = useState<NewHelpdeskTicket | null>(null);
  const [viewTicket, setViewTicket] = useState<NewHelpdeskTicket | null>(null);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [reassignTicket, setReassignTicket] = useState<NewHelpdeskTicket | null>(null);
  const [isReassigning, setIsReassigning] = useState(false);
  
  // All Tickets view state
  const [allTicketsSearchQuery, setAllTicketsSearchQuery] = useState('');
  const [allTicketsStatusFilter, setAllTicketsStatusFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-status-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [allTicketsTypeFilter, setAllTicketsTypeFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-type-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [allTicketsSortBy, setAllTicketsSortBy] = useState<'newest' | 'oldest' | 'age-newest' | 'age-oldest' | 'none'>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-sort');
    return (saved as 'newest' | 'oldest' | 'age-newest' | 'age-oldest' | 'none') || 'newest';
  });
  const [allTicketsDateFrom, setAllTicketsDateFrom] = useState<string>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-date-from');
    return saved || '';
  });
  const [allTicketsDateTo, setAllTicketsDateTo] = useState<string>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-date-to');
    return saved || '';
  });
  const [allTicketsAgeFilter, setAllTicketsAgeFilter] = useState<string>(() => {
    const saved = sessionStorage.getItem('itadmin-all-tickets-age-filter');
    return saved || 'all';
  });

  // Sorting state
  const [unassignedSortField, setUnassignedSortField] = useState<string>('urgency');
  const [unassignedSortDirection, setUnassignedSortDirection] = useState<'asc' | 'desc'>('asc');
  const [assignedSortField, setAssignedSortField] = useState<string>('assignedAt');
  const [assignedSortDirection, setAssignedSortDirection] = useState<'asc' | 'desc'>('desc');

  // Persist filters to session storage
  useEffect(() => {
    sessionStorage.setItem('itadmin-assigned-status-filter', JSON.stringify(assignedStatusFilter));
  }, [assignedStatusFilter]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-assigned-type-filter', JSON.stringify(assignedTypeFilter));
  }, [assignedTypeFilter]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-status-filter', JSON.stringify(allTicketsStatusFilter));
  }, [allTicketsStatusFilter]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-type-filter', JSON.stringify(allTicketsTypeFilter));
  }, [allTicketsTypeFilter]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-sort', allTicketsSortBy);
  }, [allTicketsSortBy]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-date-from', allTicketsDateFrom);
  }, [allTicketsDateFrom]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-date-to', allTicketsDateTo);
  }, [allTicketsDateTo]);

  useEffect(() => {
    sessionStorage.setItem('itadmin-all-tickets-age-filter', allTicketsAgeFilter);
  }, [allTicketsAgeFilter]);

  useEffect(() => {
    if (isITAdmin) {
      fetchTickets();
    }
  }, [fetchTickets, isITAdmin]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R: Refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        fetchTickets();
        toast.info('Refreshing tickets...');
      }
      // Cmd/Ctrl + K: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [fetchTickets]);

  // Filter IT tickets only - CRITICAL: Module-driven approval gating (NEW ARCHITECTURE)
  const itTickets = useMemo(() => {
    const allTickets = tickets as unknown as NewHelpdeskTicket[];

    return allTickets.filter(t => {
      // Must be IT module (immutable field)
      const module = t.module || t.highLevelCategory;
      if (module !== 'IT') return false;

      // Type guard to ensure we have the new ticket structure
      const ticket = t as NewHelpdeskTicket;

      // ========== NEW ARCHITECTURE: APPROVAL GATING ==========
      // Admin can ONLY see tickets where:
      // 1. requiresApproval = false (direct routing)
      // OR
      // 2. approvalCompleted = true (L3 approved and routed)

      const requiresApproval = ticket.requiresApproval || false;
      const approvalCompleted = ticket.approvalCompleted || false;

      // If requires approval but not completed → BLOCK
      if (requiresApproval && !approvalCompleted) {
        return false;
      }

      // Additional safety check: routedTo must be set
      if (!ticket.routedTo || ticket.routedTo !== 'IT') {
        return false;
      }

      // Passed all gates - ticket is visible to IT Admin
      return true;
    });
  }, [tickets]);

  // KPI calculations
  const stats = useMemo(() => {
    const unassigned = itTickets.filter(t => 
      !t.assignment?.assignedToId && 
      ['open', 'pending', 'Reopened', 'In Queue', 'Routed', 'Approved'].includes(t.status)
    ).length;
    
    const assigned = itTickets.filter(t => 
      t.assignment?.assignedToId && 
      ['Assigned'].includes(t.status)
    ).length;
    
    const inProgress = itTickets.filter(t => 
      ['In Progress'].includes(t.status)
    ).length;
    
    const reopened = itTickets.filter(t =>
      t.status === 'Reopened'
    ).length;
    
    const closed = itTickets.filter(t =>
      ['Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    ).length;
    
    const total = itTickets.length;

    return { total, unassigned, assigned, inProgress, reopened, closed };
  }, [itTickets]);

  // Sorting handlers
  const handleSort = (field: string, currentField: string, currentDirection: 'asc' | 'desc', setField: (f: string) => void, setDirection: (d: 'asc' | 'desc') => void) => {
    if (field === currentField) {
      setDirection(currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setField(field);
      setDirection('asc');
    }
  };

  // Unassigned tickets (primary focus)
  const unassignedTickets = useMemo(() => {
    let filtered = itTickets.filter(t => 
      !t.assignment?.assignedToId && 
      ['open', 'pending', 'Reopened', 'In Queue', 'Routed', 'Approved'].includes(t.status)
    );

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        (t.subCategory || '').toLowerCase().includes(query)
      );
    }

    // Sort by selected field
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (unassignedSortField === 'urgency') {
        const urgencyOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 4;
        const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 4;
        comparison = aUrgency - bUrgency;
      } else if (unassignedSortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (unassignedSortField === 'ticketNumber') {
        comparison = a.ticketNumber.localeCompare(b.ticketNumber);
      } else if (unassignedSortField === 'subject') {
        comparison = a.subject.localeCompare(b.subject);
      }
      
      return unassignedSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [itTickets, searchQuery, unassignedSortField, unassignedSortDirection]);

  // Get unique statuses and types for filters
  const uniqueStatuses = useMemo(() => {
    const allStatuses = itTickets
      .filter(t => t.assignment?.assignedToId && (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name))
      .map(t => t.status);
    return Array.from(new Set(allStatuses)).sort();
  }, [itTickets, user]);

  const uniqueTypes = useMemo(() => {
    const allTypes = itTickets
      .filter(t => t.assignment?.assignedToId && (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name))
      .map(t => t.subCategory)
      .filter(Boolean);
    return Array.from(new Set(allTypes)).sort();
  }, [itTickets, user]);

  // Assigned tickets (by this admin) - including closed for reference
  const assignedTickets = useMemo(() => {
    let filtered = itTickets.filter(t =>
      t.assignment?.assignedToId &&
      (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name) &&
      ['Assigned', 'In Progress', 'Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    );

    // Apply status filter
    if (assignedStatusFilter.length > 0) {
      filtered = filtered.filter(t => assignedStatusFilter.includes(t.status));
    }

    // Apply type filter
    if (assignedTypeFilter.length > 0) {
      filtered = filtered.filter(t => assignedTypeFilter.includes(t.subCategory));
    }

    // Apply search filter
    if (assignedSearchQuery.trim()) {
      const query = assignedSearchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        (t.subCategory || '').toLowerCase().includes(query) ||
        (t.assignment?.assignedToName || '').toLowerCase().includes(query) ||
        t.status.toLowerCase().includes(query)
      );
    }

    // Sort by selected field
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      if (assignedSortField === 'assignedAt') {
        const aDate = new Date(a.assignment?.assignedAt || a.createdAt).getTime();
        const bDate = new Date(b.assignment?.assignedAt || b.createdAt).getTime();
        comparison = aDate - bDate;
      } else if (assignedSortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (assignedSortField === 'ticketNumber') {
        comparison = a.ticketNumber.localeCompare(b.ticketNumber);
      }
      
      return assignedSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [itTickets, user, assignedSearchQuery, assignedStatusFilter, assignedTypeFilter, assignedSortField, assignedSortDirection]);

  // All tickets (complete history access for admin)
  const allTickets = useMemo(() => {
    let filtered = [...itTickets];

    // Apply status filter
    if (allTicketsStatusFilter.length > 0) {
      filtered = filtered.filter(t => allTicketsStatusFilter.includes(t.status));
    }

    // Apply type filter
    if (allTicketsTypeFilter.length > 0) {
      filtered = filtered.filter(t => allTicketsTypeFilter.includes(t.subCategory));
    }

    // Apply date range filter
    if (allTicketsDateFrom) {
      const fromDate = new Date(allTicketsDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.createdAt) >= fromDate);
    }
    if (allTicketsDateTo) {
      const toDate = new Date(allTicketsDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.createdAt) <= toDate);
    }

    // Apply age range filter
    if (allTicketsAgeFilter !== 'all') {
      filtered = filtered.filter(t => {
        const ageHours = getTicketAgeInHours(t.createdAt);
        switch (allTicketsAgeFilter) {
          case 'under-24h':
            return ageHours < 24;
          case '1-3days':
            return ageHours >= 24 && ageHours <= 72;
          case 'over-3days':
            return ageHours > 72;
          case 'under-1week':
            return ageHours < 168; // 7 days
          case 'over-1week':
            return ageHours >= 168;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (allTicketsSearchQuery.trim()) {
      const query = allTicketsSearchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.userName.toLowerCase().includes(query) ||
        (t.subCategory || '').toLowerCase().includes(query) ||
        (t.assignment?.assignedToName || '').toLowerCase().includes(query) ||
        t.status.toLowerCase().includes(query) ||
        (t.userEmail || '').toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (allTicketsSortBy === 'newest') {
        return dateB - dateA; // Newest first
      } else if (allTicketsSortBy === 'oldest') {
        return dateA - dateB; // Oldest first
      } else if (allTicketsSortBy === 'age-newest') {
        // Newest age (most recent tickets) - lower age hours first
        return getTicketAgeInHours(a.createdAt) - getTicketAgeInHours(b.createdAt);
      } else if (allTicketsSortBy === 'age-oldest') {
        // Oldest age (oldest tickets) - higher age hours first
        return getTicketAgeInHours(b.createdAt) - getTicketAgeInHours(a.createdAt);
      }
      return dateB - dateA; // Default to newest
    });
  }, [itTickets, allTicketsSearchQuery, allTicketsStatusFilter, allTicketsTypeFilter, allTicketsDateFrom, allTicketsDateTo, allTicketsAgeFilter, allTicketsSortBy]);

  // Unique statuses and types for All Tickets filters
  const allTicketsUniqueStatuses = useMemo(() => {
    const statuses = itTickets.map(t => t.status).filter(Boolean);
    return Array.from(new Set(statuses)).sort();
  }, [itTickets]);

  const allTicketsUniqueTypes = useMemo(() => {
    const types = itTickets.map(t => t.subCategory).filter(Boolean);
    return Array.from(new Set(types)).sort();
  }, [itTickets]);

  // All closed tickets (for reference)
  const closedTickets = useMemo(() => {
    return itTickets.filter(t =>
      ['Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    ).sort((a, b) => {
      // Sort by updated date (most recent first)
      const aDate = new Date(a.updatedAt || a.createdAt);
      const bDate = new Date(b.updatedAt || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
  }, [itTickets]);

  const handleAssignTicket = useCallback(async (ticketId: string, specialistId: string, notes?: string) => {
    if (!user?.id || !user?.name) return;

    setIsAssigning(true);
    try {
      // Get specialist details
      const specialists = await helpdeskService.getITSpecialists();
      const specialist = specialists.find((s) => (s as { id: string; employeeId?: string }).id === specialistId);
      
      if (!specialist) {
        throw new Error('Specialist not found');
      }

      // Use employeeId for assignment, not MongoDB _id
      const assignToId = (specialist as { employeeId?: string }).employeeId || specialistId;
      
      await helpdeskService.assignToITEmployee(
        ticketId,
        assignToId,  // Use employeeId instead of _id
        specialist.name,
        user.id,
        user.name,
        notes
      );

      toast.success(`Ticket assigned to ${specialist.name} successfully`);
      await fetchTickets();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  }, [user, fetchTickets]);

  // Handle bulk assignment
  const handleBulkAssign = useCallback(async (employeeId: string, notes?: string) => {
    if (selectedTicketIds.size === 0 || !user?.id || !user?.name) return;

    setIsAssigning(true);
    try {
      // Get specialist details
      const specialists = await helpdeskService.getITSpecialists();
      const specialist = specialists.find((s) => (s as { id: string; employeeId?: string }).id === employeeId);
      
      if (!specialist) {
        toast.error('Selected employee not found');
        setIsAssigning(false);
        return;
      }

      // Use employeeId for assignment, not MongoDB _id
      const assignToId = (specialist as { employeeId?: string }).employeeId || employeeId;
      const ticketsArray = Array.from(selectedTicketIds);
      
      let successCount = 0;
      let failCount = 0;

      // Assign tickets sequentially to ensure proper audit logging
      for (const ticketId of ticketsArray) {
        try {
          await helpdeskService.assignToITEmployee(
            ticketId,
            assignToId,
            specialist.name,
            user.id,
            user.name,
            notes
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to assign ticket ${ticketId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully assigned ${successCount} ${successCount === 1 ? 'ticket' : 'tickets'} to ${specialist.name}`);
      }
      if (failCount > 0) {
        toast.error(`Failed to assign ${failCount} ${failCount === 1 ? 'ticket' : 'tickets'}`);
      }

      // Clear selection and refresh
      setSelectedTicketIds(new Set());
      await fetchTickets();
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      toast.error('Failed to complete bulk assignment. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  }, [selectedTicketIds, user, fetchTickets]);

  // Toggle ticket selection
  const toggleTicketSelection = (ticketId: string) => {
    const newSelection = new Set(selectedTicketIds);
    if (newSelection.has(ticketId)) {
      newSelection.delete(ticketId);
    } else {
      newSelection.add(ticketId);
    }
    setSelectedTicketIds(newSelection);
  };

  // Select/deselect all tickets
  const toggleSelectAll = () => {
    if (selectedTicketIds.size === unassignedTickets.length) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(unassignedTickets.map(t => t._id || t.id)));
    }
  };

  // Clear all filters
  const clearAssignedFilters = () => {
    setAssignedStatusFilter([]);
    setAssignedTypeFilter([]);
    setAssignedSearchQuery('');
  };

  const clearAllTicketsFilters = () => {
    setAllTicketsStatusFilter([]);
    setAllTicketsTypeFilter([]);
    setAllTicketsDateFrom('');
    setAllTicketsDateTo('');
    setAllTicketsAgeFilter('all');
    setAllTicketsSortBy('newest');
    setAllTicketsSearchQuery('');
  };

  // Export filtered tickets to CSV
  const exportToCSV = () => {
    try {
      const csvData = [
        // Header
        ['Ticket ID', 'Subject', 'Requester', 'Email', 'Type', 'Assigned To', 'Status', 'Priority', 'Age (hours)', 'Created Date'].join(','),
        // Data rows
        ...allTickets.map(ticket => [
          ticket.ticketNumber,
          `"${ticket.subject.replace(/"/g, '""')}"`,
          ticket.userName,
          ticket.userEmail || '',
          ticket.subCategory,
          ticket.assignment?.assignedToName || 'Unassigned',
          ticket.status,
          ticket.urgency,
          getTicketAgeInHours(ticket.createdAt),
          format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm:ss')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `IT_Tickets_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${allTickets.length} tickets to CSV`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export tickets');
    }
  };

  // Export filtered tickets to Excel (using xlsx library if installed)
  const exportToExcel = async () => {
    try {
      // Dynamic import of xlsx
      const XLSX = await import('xlsx');
      
      const excelData = allTickets.map(ticket => ({
        'Ticket ID': ticket.ticketNumber,
        'Subject': ticket.subject,
        'Requester': ticket.userName,
        'Email': ticket.userEmail || '',
        'Type': ticket.subCategory,
        'Assigned To': ticket.assignment?.assignedToName || 'Unassigned',
        'Status': ticket.status,
        'Priority': ticket.urgency,
        'Age (hours)': getTicketAgeInHours(ticket.createdAt),
        'Created Date': format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        'Last Updated': format(new Date(ticket.updatedAt || ticket.createdAt), 'yyyy-MM-dd HH:mm:ss')
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'IT Tickets');
      
      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.min(Math.max(key.length, 10), maxWidth)
      }));
      worksheet['!cols'] = columnWidths;
      
      XLSX.writeFile(workbook, `IT_Tickets_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`);
      
      toast.success(`Exported ${allTickets.length} tickets to Excel`);
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error('Failed to export to Excel. CSV export available.');
    }
  };

  // Handle ticket reassignment
  const handleReassign = useCallback(async (
    newEmployeeId: string,
    newEmployeeName: string,
    reason: string
  ) => {
    if (!reassignTicket || !user) return;

    setIsReassigning(true);
    try {
      await helpdeskService.reassignTicket(
        reassignTicket._id || reassignTicket.id,
        newEmployeeId,
        newEmployeeName,
        user.employeeId,
        user.name,
        reason
      );

      toast.success('Ticket reassigned successfully', {
        description: `Ticket ${reassignTicket.ticketNumber} has been reassigned to ${newEmployeeName}.`
      });

      // Refresh tickets
      await fetchTickets();
      setReassignTicket(null);
    } catch (error: any) {
      console.error('Failed to reassign ticket:', error);
      toast.error('Failed to reassign ticket', {
        description: error.response?.data?.message || 'Please try again later.'
      });
    } finally {
      setIsReassigning(false);
    }
  }, [reassignTicket, user, fetchTickets]);

  const getUrgencyColor = (urgency: string) => {
    const urgencyLower = urgency?.toLowerCase();
    switch (urgencyLower) {
      case 'critical':
        return 'badge-urgency-critical';
      case 'high':
        return 'badge-urgency-high';
      case 'medium':
        return 'badge-urgency-medium';
      case 'low':
        return 'badge-urgency-low';
      default:
        return 'badge-urgency-low';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Assigned':
        return 'badge-status-assigned';
      case 'In Progress':
        return 'badge-status-in-progress';
      case 'Paused':
      case 'On Hold':
        return 'badge-status-on-hold';
      case 'Work Completed':
        return 'badge-status-work-completed';
      case 'Completed - Awaiting IT Closure':
        return 'badge-status-awaiting-closure';
      case 'Completed':
      case 'Confirmed':
      case 'Closed':
      case 'Auto-Closed':
        return 'badge-status-completed';
      case 'Cancelled':
        return 'badge-status-cancelled';
      case 'Routed':
        return 'badge-status-routed';
      default:
        return 'badge-status-submitted';
    }
  };

  // Helper function to strip HTML tags from text
  const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  if (isLoading && tickets.length === 0) {
    return (
      <div className="page-container">
        {/* Header Skeleton */}
        <div className="page-header">
          <div className="page-header-content">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="card-compact">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isITAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="bg-primary/5 rounded-xl p-6 border mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">IT Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage IT ticket assignments and monitor queue status
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets()}
              disabled={isLoading}
              className="flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/itadmin/tickets')}
              className="flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              <Activity className="h-4 w-4" />
              View All Tickets
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="group hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 border-l-4 border-l-blue-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              Total IT Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-blue-700 dark:text-blue-300">{stats.total}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">All IT helpdesk requests</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 border-l-4 border-l-orange-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-orange-600 dark:text-orange-400">{stats.unassigned}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 border-l-4 border-l-cyan-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <UserPlus className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-cyan-600 dark:text-cyan-400">{stats.assigned}</div>
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">Assigned to IT staff</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 border-l-4 border-l-purple-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-purple-600 dark:text-purple-400">{stats.inProgress}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 border-l-4 border-l-amber-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              Re-opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-amber-600 dark:text-amber-400">{stats.reopened}</div>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Reopened by users</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 border-l-4 border-l-green-500 bg-background/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-green-600 dark:text-green-400">{stats.closed}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Completed & resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Management - Tabbed Interface */}
      <Card className="overflow-hidden border-t-4 border-t-primary shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Ticket Management
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400 mt-1">
                Manage and view all helpdesk tickets
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unassigned" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/50">
              <TabsTrigger 
                value="unassigned" 
                className="flex items-center gap-2 data-[state=active]:bg-orange-50 dark:data-[state=active]:bg-orange-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-orange-500 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 data-[state=active]:bg-orange-500/20 flex items-center justify-center transition-colors">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="font-medium">Unassigned Queue</span>
                </div>
                {stats.unassigned > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] px-1.5 bg-orange-600 text-white">
                    {stats.unassigned}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="my-assignments" 
                className="flex items-center gap-2 data-[state=active]:bg-cyan-50 dark:data-[state=active]:bg-cyan-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-cyan-500 data-[state=active]:text-cyan-700 dark:data-[state=active]:text-cyan-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-cyan-500/10 data-[state=active]:bg-cyan-500/20 flex items-center justify-center transition-colors">
                    <UserPlus className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="font-medium">My Assignments</span>
                </div>
                {assignedTickets.length > 0 && (
                  <Badge className="ml-1 h-5 min-w-[20px] px-1.5 bg-cyan-600 text-white">
                    {assignedTickets.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="all-tickets" 
                className="flex items-center gap-2 data-[state=active]:bg-purple-50 dark:data-[state=active]:bg-purple-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-purple-500 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-500/10 data-[state=active]:bg-purple-500/20 flex items-center justify-center transition-colors">
                    <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium">All Tickets</span>
                </div>
                <Badge className="ml-1 h-5 min-w-[20px] px-1.5 bg-purple-600 text-white">
                  {itTickets.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="flex items-center gap-2 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-green-500 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300 transition-all"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-green-500/10 data-[state=active]:bg-green-500/20 flex items-center justify-center transition-colors">
                    <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="font-medium">Analytics</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Unassigned Queue Tab */}
            <TabsContent value="unassigned" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Priority tickets awaiting IT employee assignment</p>
                    <p className="text-xs text-muted-foreground mt-1">Showing {unassignedTickets.length} unassigned {unassignedTickets.length === 1 ? 'ticket' : 'tickets'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 backdrop-blur border shadow-sm">
                  <div className="flex items-center gap-2 min-w-[200px]">
                    {selectedTicketIds.size > 0 ? (
                      <>
                        <Button
                          onClick={() => setIsBulkAssignOpen(true)}
                          className="bg-brand-green hover:bg-brand-green/90 text-white"
                          disabled={isAssigning}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign ({selectedTicketIds.size})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicketIds(new Set())}
                          title="Clear selection"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Checkbox className="mr-2" disabled />
                        Select tickets to bulk assign
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by ticket #, subject, type, requester..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {unassignedTickets.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {searchQuery ? 'No tickets match your search' : 'All caught up!'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                    {searchQuery 
                      ? 'Try adjusting your search terms or clearing filters to see more results.' 
                      : 'There are no unassigned tickets at the moment. Great work keeping the queue clear!'}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => setSearchQuery('')}
                      className="mx-auto"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Search
                    </Button>
                  )}
                </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={unassignedTickets.length > 0 && selectedTicketIds.size === unassignedTickets.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all tickets"
                      />
                    </TableHead>
                    <TableHead 
                      className="w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('ticketNumber', unassignedSortField, unassignedSortDirection, setUnassignedSortField, setUnassignedSortDirection)}
                    >
                      <div className="flex items-center gap-1">
                        Ticket ID
                        {unassignedSortField === 'ticketNumber' && (
                          unassignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('subject', unassignedSortField, unassignedSortDirection, setUnassignedSortField, setUnassignedSortDirection)}
                    >
                      <div className="flex items-center gap-1">
                        Subject
                        {unassignedSortField === 'subject' && (
                          unassignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('urgency', unassignedSortField, unassignedSortDirection, setUnassignedSortField, setUnassignedSortDirection)}
                    >
                      <div className="flex items-center gap-1">
                        Priority
                        {unassignedSortField === 'urgency' && (
                          unassignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Age</TableHead>
                    <TableHead 
                      className="w-[140px] cursor-pointer hover:bg-muted/50 select-none"
                      onClick={() => handleSort('createdAt', unassignedSortField, unassignedSortDirection, setUnassignedSortField, setUnassignedSortDirection)}
                    >
                      <div className="flex items-center gap-1">
                        Created
                        {unassignedSortField === 'createdAt' && (
                          unassignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedTickets.map((ticket) => (
                    <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedTicketIds.has(ticket._id || ticket.id)}
                          onCheckedChange={() => toggleTicketSelection(ticket._id || ticket.id)}
                          aria-label={`Select ticket ${ticket.ticketNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium text-foreground truncate">
                            {ticket.subject}
                          </p>
                          {ticket.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {stripHtmlTags(ticket.description)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ticket.subCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ticket.userName}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(ticket.urgency)}>
                          {ticket.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TicketAge createdAt={ticket.createdAt} variant="badge" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(ticket.createdAt), 'MMM dd, yy')}
                        </div>
                        <div className="text-xs">{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewTicket(ticket as NewHelpdeskTicket)}
                            className="h-8 w-8 p-0"
                            title="View ticket details"
                            aria-label="View ticket details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket as NewHelpdeskTicket);
                              setIsAssignDrawerOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90"
                            title="Assign to IT specialist"
                            aria-label="Assign ticket"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* My Assignments Tab */}
        <TabsContent value="my-assignments" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">All tickets you've assigned to IT employees</p>
                <p className="text-xs text-muted-foreground mt-1">Showing {assignedTickets.length} {assignedTickets.length === 1 ? 'ticket' : 'tickets'} (including closed)</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 backdrop-blur border shadow-sm flex-wrap">
              <MultiSelect
                options={uniqueStatuses.map(status => ({ label: status, value: status }))}
                selected={assignedStatusFilter}
                onChange={setAssignedStatusFilter}
                placeholder="Filter by status"
                className="w-[200px]"
              />
              <MultiSelect
                options={uniqueTypes.map(type => ({ label: type, value: type }))}
                selected={assignedTypeFilter}
                onChange={setAssignedTypeFilter}
                placeholder="Filter by type"
                className="w-[200px]"
              />
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={assignedSearchQuery}
                  onChange={(e) => setAssignedSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {(assignedStatusFilter.length > 0 || assignedTypeFilter.length > 0 || assignedSearchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAssignedFilters}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {assignedTickets.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {assignedSearchQuery || assignedStatusFilter.length || assignedTypeFilter.length
                  ? 'No matching assignments found'
                  : 'No assignments yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {assignedSearchQuery || assignedStatusFilter.length || assignedTypeFilter.length
                  ? 'Try adjusting your filters or search terms to see more results.'
                  : 'Start assigning tickets from the Unassigned Queue to track them here.'}
              </p>
              {(assignedSearchQuery || assignedStatusFilter.length || assignedTypeFilter.length) ? (
                <Button
                  variant="outline"
                  onClick={clearAssignedFilters}
                  className="mx-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              ) : (
                <Button
                  onClick={() => document.querySelector<HTMLButtonElement>('[value="unassigned"]')?.click()}
                  className="mx-auto"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Go to Unassigned Queue
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                      <TableHead 
                        className="w-[120px] cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('ticketNumber', assignedSortField, assignedSortDirection, setAssignedSortField, setAssignedSortDirection)}
                      >
                        <div className="flex items-center gap-1">
                          Ticket ID
                          {assignedSortField === 'ticketNumber' && (
                            assignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('status', assignedSortField, assignedSortDirection, setAssignedSortField, setAssignedSortDirection)}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {assignedSortField === 'status' && (
                            assignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px]">Age</TableHead>
                      <TableHead 
                        className="w-[140px] cursor-pointer hover:bg-muted/50 select-none"
                        onClick={() => handleSort('assignedAt', assignedSortField, assignedSortDirection, setAssignedSortField, setAssignedSortDirection)}
                      >
                        <div className="flex items-center gap-1">
                          Assigned
                          {assignedSortField === 'assignedAt' && (
                            assignedSortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-right w-[100px]">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedTickets.slice(0, 10).map((ticket) => (
                      <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <TableCell className="font-mono text-sm">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium text-foreground truncate">
                              {ticket.subject}
                            </p>
                            {ticket.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {stripHtmlTags(ticket.description)}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {ticket.subCategory}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {ticket.assignment?.assignedToName || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TicketAge createdAt={ticket.createdAt} variant="badge" />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {ticket.assignment?.assignedAt ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(ticket.assignment.assignedAt), 'MMM dd, yy')}
                              </div>
                              <div className="text-xs">{formatDistanceToNow(new Date(ticket.assignment.assignedAt), { addSuffix: true })}</div>
                            </>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                title="Actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewTicket(ticket as NewHelpdeskTicket)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {ticket.assignment?.assignedToId && ticket.status !== 'Closed' && ticket.status !== 'Completed' && ticket.status !== 'Cancelled' && (
                                <DropdownMenuItem onClick={() => setReassignTicket(ticket as NewHelpdeskTicket)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Reassign
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {assignedTickets.length > 10 && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    ℹ️ Showing first 10 tickets. Use filters to see more specific results.
                  </p>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* All Tickets Tab */}
        <TabsContent value="all-tickets" className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">Complete system-wide ticket history</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allTickets.length > 0 ? `Showing ${Math.min(allTickets.length, 50)} of ${itTickets.length} total tickets` : 'No tickets found'}
                  {(allTicketsStatusFilter.length > 0 || allTicketsTypeFilter.length > 0 || allTicketsDateFrom || allTicketsDateTo || allTicketsAgeFilter !== 'all') && (
                    <span className="ml-2 text-primary font-medium">
                      ({allTicketsStatusFilter.length + allTicketsTypeFilter.length + (allTicketsDateFrom ? 1 : 0) + (allTicketsAgeFilter !== 'all' ? 1 : 0)} filters active)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {allTickets.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCSV}
                      className="h-9"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToExcel}
                      className="h-9"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Excel
                    </Button>
                  </>
                )}
                {(allTicketsStatusFilter.length > 0 || allTicketsTypeFilter.length > 0 || allTicketsDateFrom || allTicketsDateTo || allTicketsAgeFilter !== 'all' || allTicketsSortBy !== 'newest' || allTicketsSearchQuery) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllTicketsFilters}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/80 backdrop-blur border shadow-sm flex-wrap">
            <MultiSelect
              options={allTicketsUniqueStatuses.map(status => ({ label: status, value: status }))}
              selected={allTicketsStatusFilter}
              onChange={setAllTicketsStatusFilter}
              placeholder="Filter by status"
              className="w-[200px]"
            />
            <MultiSelect
              options={allTicketsUniqueTypes.map(type => ({ label: type, value: type }))}
              selected={allTicketsTypeFilter}
              onChange={setAllTicketsTypeFilter}
              placeholder="Filter by type"
              className="w-[200px]"
            />
            <DateRangePicker
              fromDate={allTicketsDateFrom}
              toDate={allTicketsDateTo}
              onFromDateChange={setAllTicketsDateFrom}
              onToDateChange={setAllTicketsDateTo}
              onClear={() => {
                setAllTicketsDateFrom('');
                setAllTicketsDateTo('');
              }}
              placeholder="Select date range"
              className="w-[320px]"
            />
            <Select value={allTicketsAgeFilter} onValueChange={setAllTicketsAgeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by age" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="under-24h">Under 24 hours</SelectItem>
                <SelectItem value="1-3days">1-3 days</SelectItem>
                <SelectItem value="over-3days">Over 3 days</SelectItem>
                <SelectItem value="under-1week">Under 1 week</SelectItem>
                <SelectItem value="over-1week">Over 1 week</SelectItem>
              </SelectContent>
            </Select>
              <Select value={allTicketsSortBy} onValueChange={(value: 'newest' | 'oldest' | 'age-newest' | 'age-oldest' | 'none') => setAllTicketsSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                  <SelectItem value="age-newest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Age: Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="age-oldest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Age: Oldest First
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search all tickets..."
                  value={allTicketsSearchQuery}
                  onChange={(e) => setAllTicketsSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          {allTickets.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-4">
                <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {allTicketsSearchQuery || allTicketsStatusFilter.length > 0 || allTicketsTypeFilter.length > 0 || allTicketsDateFrom || allTicketsDateTo
                  ? 'No tickets match your criteria'
                  : 'No tickets in system'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                {allTicketsSearchQuery || allTicketsStatusFilter.length > 0 || allTicketsTypeFilter.length > 0 || allTicketsDateFrom || allTicketsDateTo
                  ? 'Try removing some filters or adjusting your search terms to see more results.'
                  : 'Tickets will appear here once they are created and routed to IT department.'}
              </p>
              {(allTicketsSearchQuery || allTicketsStatusFilter.length > 0 || allTicketsTypeFilter.length > 0 || allTicketsDateFrom || allTicketsDateTo || allTicketsAgeFilter !== 'all' || allTicketsSortBy !== 'newest') && (
                <Button
                  variant="outline"
                  onClick={clearAllTicketsFilters}
                  className="mx-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="w-[120px]">Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Age</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTickets.slice(0, 50).map((ticket) => (
                    <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="font-medium text-brand-navy dark:text-gray-100">
                        <div className="max-w-xs truncate">{ticket.subject}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="text-sm">{ticket.userName}</div>
                            {ticket.userEmail && (
                              <div className="text-xs text-muted-foreground">{ticket.userEmail}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ticket.subCategory}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.assignment?.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm">{ticket.assignment.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <TicketAge createdAt={ticket.createdAt} variant="badge" />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="Actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewTicket(ticket as NewHelpdeskTicket)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {!ticket.assignment?.assignedToId && ticket.status !== 'Closed' && ticket.status !== 'Cancelled' && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedTicket(ticket as NewHelpdeskTicket);
                                setIsAssignDrawerOpen(true);
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign
                              </DropdownMenuItem>
                            )}
                            {ticket.assignment?.assignedToId && ticket.status !== 'Closed' && ticket.status !== 'Completed' && (
                              <DropdownMenuItem onClick={() => setReassignTicket(ticket as NewHelpdeskTicket)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reassign
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {allTickets.length > 50 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                  ⚠️ Showing first 50 tickets. Use filters to refine your search.
                </p>
              </div>
            )}
            </>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="border-2">
            <CardHeader className="pb-3 bg-muted/30">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>View ticket patterns and statistics</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="weekly" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 h-11 bg-muted">
                  <TabsTrigger 
                    value="weekly"
                    className="data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-blue-500 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Weekly Pattern
                  </TabsTrigger>
                  <TabsTrigger 
                    value="monthly"
                    className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/20 data-[state=active]:border-b-2 data-[state=active]:border-b-indigo-500 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300 data-[state=active]:shadow-sm font-medium transition-all"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Monthly Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="weekly" className="mt-4">
                  <WeeklyAnalytics />
                </TabsContent>

                <TabsContent value="monthly" className="mt-4">
                  <MonthlyStatistics />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Assignment Drawer */}
      <AssignTicketDrawer
        ticket={selectedTicket}
        open={isAssignDrawerOpen}
        onOpenChange={setIsAssignDrawerOpen}
        onAssign={handleAssignTicket}
        isAssigning={isAssigning}
      />

      {/* Bulk Assignment Dialog */}
      <BulkAssignDialog
        open={isBulkAssignOpen}
        onOpenChange={setIsBulkAssignOpen}
        ticketCount={selectedTicketIds.size}
        onAssign={handleBulkAssign}
        isAssigning={isAssigning}
        department="IT"
      />

      {/* Reassignment Drawer */}
      {reassignTicket && (
        <ReassignDrawer
          open={!!reassignTicket}
          onClose={() => setReassignTicket(null)}
          ticketNumber={reassignTicket.ticketNumber}
          currentAssignee={{
            id: reassignTicket.assignment?.assignedToId || '',
            name: reassignTicket.assignment?.assignedToName || reassignTicket.assignment?.assignedTo || '',
          }}
          onReassign={handleReassign}
          isReassigning={isReassigning}
          department={reassignTicket.highLevelCategory as 'IT' | 'Finance' | 'Facilities'}
        />
      )}

      {/* View Ticket Details Drawer */}
      {viewTicket && (
        <ViewTicket
          ticket={viewTicket}
          onClose={() => setViewTicket(null)}
          currentUserName={user?.name}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
}
