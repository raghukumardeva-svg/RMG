import { useEffect, useMemo, useState, useCallback } from 'react';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import type { HelpdeskTicket as NewHelpdeskTicket } from '@/types/helpdeskNew';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Wallet,
  Calendar,
  User,
  BarChart3,
  Users,
  RotateCcw,
  Eye,
  RefreshCw,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinanceAdminGuard } from '@/hooks/useFinanceAdminGuard';
import { AssignTicketDrawer } from '@/components/itadmin/AssignTicketDrawer';
import { ViewTicket } from '@/components/helpdesk/ViewTicket';
import { helpdeskService } from '@/services/helpdeskService';
import apiClient from '@/services/api';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { SLAComplianceDashboard } from '@/components/helpdesk/SLAComplianceDashboard';
import AgentWorkloadIndicators from '@/components/helpdesk/AgentWorkloadIndicators';
import { WeeklyAnalytics } from '@/components/analytics/WeeklyAnalytics';
import { MonthlyStatistics } from '@/components/analytics/MonthlyStatistics';

export function FinanceAdminDashboard() {
  const navigate = useNavigate();
  const { isFinanceAdmin, user } = useFinanceAdminGuard();
  const { tickets, fetchTickets, isLoading } = useHelpdeskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('');
  const [assignedStatusFilter, setAssignedStatusFilter] = useState<string>('all');
  const [assignedTypeFilter, setAssignedTypeFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<NewHelpdeskTicket | null>(null);
  const [viewTicket, setViewTicket] = useState<NewHelpdeskTicket | null>(null);
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isFinanceAdmin) {
      fetchTickets();
    }
  }, [fetchTickets, isFinanceAdmin]);

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

  // Filter Finance tickets only - CRITICAL: Module-driven approval gating (NEW ARCHITECTURE)
  const financeTickets = useMemo(() => {
    const allTickets = tickets as unknown as NewHelpdeskTicket[];

    return allTickets.filter(t => {
      // Must be Finance module (immutable field)
      const module = t.module || t.highLevelCategory;
      if (module !== 'Finance') return false;

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
      if (!ticket.routedTo || ticket.routedTo !== 'Finance') {
        return false;
      }

      // Passed all gates - ticket is visible to Finance Admin
      return true;
    });
  }, [tickets]);

  // KPI calculations
  const stats = useMemo(() => {
    const unassigned = financeTickets.filter(t => 
      !t.assignment?.assignedToId && 
      ['open', 'pending', 'Reopened', 'In Queue', 'Routed', 'Approved'].includes(t.status)
    ).length;
    
    const assigned = financeTickets.filter(t => 
      t.assignment?.assignedToId && 
      ['Assigned'].includes(t.status)
    ).length;
    
    const inProgress = financeTickets.filter(t => 
      ['In Progress'].includes(t.status)
    ).length;
    
    const reopened = financeTickets.filter(t =>
      t.status === 'Reopened'
    ).length;
    
    const closed = financeTickets.filter(t =>
      ['Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    ).length;
    
    const total = financeTickets.length;

    return { total, unassigned, assigned, inProgress, reopened, closed };
  }, [financeTickets]);

  // Unassigned tickets (primary focus)
  const unassignedTickets = useMemo(() => {
    let filtered = financeTickets.filter(t => 
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

    // Sort by urgency and date
    return filtered.sort((a, b) => {
      const urgencyOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      const aUrgency = urgencyOrder[a.urgency as keyof typeof urgencyOrder] ?? 4;
      const bUrgency = urgencyOrder[b.urgency as keyof typeof urgencyOrder] ?? 4;
      
      if (aUrgency !== bUrgency) return aUrgency - bUrgency;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [financeTickets, searchQuery]);

  // Get unique statuses and types for filters
  const uniqueStatuses = useMemo(() => {
    const allStatuses = financeTickets
      .filter(t => t.assignment?.assignedToId && (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name))
      .map(t => t.status);
    return Array.from(new Set(allStatuses)).sort();
  }, [financeTickets, user]);

  const uniqueTypes = useMemo(() => {
    const allTypes = financeTickets
      .filter(t => t.assignment?.assignedToId && (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name))
      .map(t => t.subCategory)
      .filter(Boolean);
    return Array.from(new Set(allTypes)).sort();
  }, [financeTickets, user]);

  // Assigned tickets (by this admin) - including closed for reference
  const assignedTickets = useMemo(() => {
    let filtered = financeTickets.filter(t =>
      t.assignment?.assignedToId &&
      (t.assignment?.assignedBy === user?.id || t.assignment?.assignedByName === user?.name) &&
      ['Assigned', 'In Progress', 'Work Completed', 'Completed - Awaiting Finance Closure', 'Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    );

    // Apply status filter
    if (assignedStatusFilter && assignedStatusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === assignedStatusFilter);
    }

    // Apply type filter
    if (assignedTypeFilter && assignedTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.subCategory === assignedTypeFilter);
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

    return filtered.sort((a, b) => {
      return new Date(b.assignment?.assignedAt || b.createdAt).getTime() -
             new Date(a.assignment?.assignedAt || a.createdAt).getTime();
    });
  }, [financeTickets, user, assignedSearchQuery, assignedStatusFilter, assignedTypeFilter]);

  // All closed tickets (for reference)
  const closedTickets = useMemo(() => {
    return financeTickets.filter(t =>
      ['Completed', 'Confirmed', 'Closed', 'Auto-Closed', 'Cancelled'].includes(t.status)
    ).sort((a, b) => {
      // Sort by updated date (most recent first)
      const aDate = new Date(a.updatedAt || a.createdAt);
      const bDate = new Date(b.updatedAt || b.createdAt);
      return bDate.getTime() - aDate.getTime();
    });
  }, [financeTickets]);

  const handleAssignTicket = useCallback(async (ticketId: string, specialistId: string, notes?: string) => {
    if (!user?.id || !user?.name) return;

    setIsAssigning(true);
    try {
      // Fetch Finance employees
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/employees');
      let employees = response.data.data || response.data;
      
      // Filter to Finance department only
      employees = employees.filter((emp: any) => 
        (emp.department === 'Finance' || emp.businessUnit === 'Finance') &&
        emp.status === 'active'
      );
      
      const specialist = employees.find((s: any) => (s._id || s.id) === specialistId);
      
      if (!specialist) {
        throw new Error('Finance specialist not found');
      }

      // Use employeeId for assignment
      const assignToId = specialist.employeeId || specialistId;
      
      await helpdeskService.assignToITEmployee(
        ticketId,
        assignToId,
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
      case 'Completed - Awaiting Finance Closure':
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

  if (!isFinanceAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Wallet className="h-7 w-7 text-primary" />
            Finance Admin Dashboard
          </h1>
          <p className="page-description">
            Manage Finance ticket assignments and monitor queue status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/financeadmin/tickets')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            View All Tickets
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="card-compact">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Total Finance Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All Finance helpdesk requests</p>
          </CardContent>
        </Card>

        <Card className="card-compact border-orange-200 dark:border-orange-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Unassigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-orange-600">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting assignment</p>
          </CardContent>
        </Card>

        <Card className="card-compact border-blue-200 dark:border-blue-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-600" />
              Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-blue-600">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned to Finance staff</p>
          </CardContent>
        </Card>

        <Card className="card-compact border-purple-200 dark:border-purple-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-purple-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card className="card-compact border-amber-200 dark:border-amber-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-600" />
              Re-opened
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-amber-600">{stats.reopened}</div>
            <p className="text-xs text-muted-foreground mt-1">Reopened by users</p>
          </CardContent>
        </Card>

        <Card className="card-compact border-green-200 dark:border-green-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="kpi-value text-green-600">{stats.closed}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed & resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Tickets Queue - Primary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Unassigned Tickets Queue
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400 mt-1">
                Priority tickets awaiting Finance employee assignment
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {unassignedTickets.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No tickets match your search' : 'All tickets have been assigned!'}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="w-[120px]">Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="w-[140px]">Created</TableHead>
                    <TableHead className="text-right w-[120px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedTickets.map((ticket) => (
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
                      <TableCell className="text-sm">{ticket.userName}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(ticket.urgency)}>
                          {ticket.urgency}
                        </Badge>
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
        </CardContent>
      </Card>

      {/* Assigned Tickets Overview - Secondary Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Assigned Tickets History
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400">
                All tickets you've assigned to Finance employees (including closed)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={assignedStatusFilter} onValueChange={setAssignedStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={assignedTypeFilter} onValueChange={setAssignedTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={assignedSearchQuery}
                  onChange={(e) => setAssignedSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignedTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {assignedSearchQuery ? 'No tickets match your search' : 'No tickets assigned yet'}
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="w-[120px]">Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="text-right w-[80px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedTickets.slice(0, 10).map((ticket) => (
                    <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="font-medium text-brand-navy dark:text-gray-100">
                        <div className="max-w-xs truncate">{ticket.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ticket.subCategory}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm">{ticket.assignment?.assignedToName || ticket.assignment?.assignedTo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ticket.assignment?.assignedAt && formatDistanceToNow(new Date(ticket.assignment.assignedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewTicket(ticket as NewHelpdeskTicket)}
                          className="h-8 w-8 p-0"
                          title="View ticket details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Tabs Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics & Insights
              </CardTitle>
              <CardDescription className="text-brand-slate dark:text-gray-400">
                SLA compliance, team workload, and ticket history
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/financeadmin/analytics')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sla" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sla">
                <Clock className="h-4 w-4 mr-2" />
                SLA Compliance
              </TabsTrigger>
              <TabsTrigger value="workload">
                <Users className="h-4 w-4 mr-2" />
                Team Workload
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="closed">
                <CheckCircle className="h-4 w-4 mr-2" />
                Closed Tickets
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sla" className="space-y-4">
              <SLAComplianceDashboard tickets={financeTickets} />
            </TabsContent>

            <TabsContent value="workload" className="space-y-4">
              <AgentWorkloadIndicators />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Tabs defaultValue="weekly" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="weekly">Weekly Pattern</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="weekly">
                  <WeeklyAnalytics />
                </TabsContent>

                <TabsContent value="monthly">
                  <MonthlyStatistics />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="closed" className="space-y-4">
              {closedTickets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No closed tickets yet
                </p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                        <TableHead className="w-[120px]">Ticket ID</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Closed Date</TableHead>
                        <TableHead className="text-right w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedTickets.slice(0, 20).map((ticket) => (
                        <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <TableCell className="font-mono text-sm">
                            {ticket.ticketNumber}
                          </TableCell>
                          <TableCell className="font-medium text-brand-navy dark:text-gray-100">
                            <div className="max-w-xs truncate">{ticket.subject}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {ticket.subCategory}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary" />
                              <span className="text-sm">{ticket.assignment?.assignedToName || 'Unassigned'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(ticket.updatedAt || ticket.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/financeadmin/tickets`)}
                              className="h-8"
                            >
                              <Activity className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* All Closed Tickets - Legacy Section (Hidden, replaced by tabs) */}
      <Card className="hidden">
        <CardHeader>
          <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            All Closed Tickets
          </CardTitle>
          <CardDescription className="text-brand-slate dark:text-gray-400">
            Complete history of all closed Finance tickets for reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closedTickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No closed tickets yet
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="w-[120px]">Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Closed Date</TableHead>
                    <TableHead className="text-right w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedTickets.slice(0, 20).map((ticket) => (
                    <TableRow key={ticket._id || ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <TableCell className="font-mono text-sm">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell className="font-medium text-brand-navy dark:text-gray-100">
                        <div className="max-w-xs truncate">{ticket.subject}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ticket.subCategory}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="text-sm">{ticket.assignment?.assignedToName || 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.updatedAt || ticket.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/financeadmin/tickets`)}
                          className="h-8"
                        >
                          <Activity className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Drawer */}
      <AssignTicketDrawer
        ticket={selectedTicket}
        open={isAssignDrawerOpen}
        onOpenChange={setIsAssignDrawerOpen}
        onAssign={handleAssignTicket}
        isAssigning={isAssigning}
        department="Finance"
      />

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
