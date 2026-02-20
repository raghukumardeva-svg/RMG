import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Headphones,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import { RaiseRequestDrawer, type ReopenTicketData } from '@/components/helpdesk/RaiseRequestDrawer';
import { MyRequests } from '@/components/helpdesk/MyRequests';
import { MyTeamRequests } from '@/components/helpdesk/MyTeamRequests';
import { SpecialistQueuePage } from '@/components/helpdesk/SpecialistQueuePage';
import { HelpdeskKpiBar } from '@/components/helpdesk/HelpdeskKpiBar';
import { helpdeskService } from '@/services/helpdeskService';
import type { HelpdeskTicket, HelpdeskFormData, SpecialistQueue, TicketStatus } from '@/types/helpdeskNew';

export default function Helpdesk() {
  const { user } = useAuthStore();
  const { createWithWorkflow } = useHelpdeskStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Set default tab based on role
    if (user?.role === 'MANAGER') return 'my-team-requests';
    if (user?.role === 'IT_ADMIN') return 'it-queue';
    return 'my-requests';
  });
  const [kpiFilter, setKpiFilter] = useState<'All' | 'IT' | 'Finance' | 'Facilities'>('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reopenData, setReopenData] = useState<ReopenTicketData | null>(null);
  
  // Auto-open drawer if navigated with openDrawer state
  useEffect(() => {
    if (location.state?.openDrawer) {
      setIsDrawerOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    inProgress: 0,
    rejected: 0,
    cancelled: 0,
  });

  // Determine user role and access
  const isEmployee = user?.role === 'EMPLOYEE' || user?.role === 'MANAGER';
  const isManager = user?.role === 'MANAGER';
  const isSpecialist = user?.role === 'IT_ADMIN' || user?.role === 'FINANCE_ADMIN' || user?.role === 'FACILITIES_ADMIN';
  
  // Department-based tab visibility
  const userDepartment = user?.department;
  const showITQueue = isSpecialist || userDepartment === 'IT';
  const showFacilitiesQueue = isSpecialist || userDepartment === 'Facilities';
  const showFinanceQueue = isSpecialist || userDepartment === 'Finance';

  const calculateStats = useCallback((ticketData: HelpdeskTicket[], currentTab?: string) => {
    // Define status groups based on Employee KPI requirements
    const RESOLVED_STATUSES: TicketStatus[] = ['Closed', 'Auto-Closed'];
    const IN_PROGRESS_STATUSES: TicketStatus[] = [
      'Pending Approval',
      'Pending Approval L1',
      'Pending Approval L2',
      'Pending Approval L3',
      'Routed',
      'Assigned',
      'In Progress',
      'Awaiting User Confirmation',
      'Submitted',
      'Approved',
      'In Queue',
      'Completed',
    ];

    // Filter tickets based on KPI filter selection (independent of tab filter)
    let filteredTickets = ticketData;
    if (kpiFilter !== 'All') {
      filteredTickets = ticketData.filter(t => t.highLevelCategory === kpiFilter);
    }

    let stats;

    if (isSpecialist) {
      // For specialists: Show queue-specific metrics for the filtered department
      stats = {
        total: filteredTickets.length,
        resolved: filteredTickets.filter((t) => 
          t.status === 'Closed' || t.status === 'Auto-Closed' || t.status === 'Confirmed'
        ).length,
        inProgress: filteredTickets.filter(
          (t) => t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'In Queue'
        ).length,
        rejected: 0, // Not relevant for specialists
        cancelled: filteredTickets.filter((t) => t.status === 'Cancelled').length,
      };
    } else if (isManager) {
      // For managers: Show different metrics based on tab
      if (currentTab === 'my-team-requests') {
        // My Team Requests: Show team ticket metrics
        const teamTickets = filteredTickets.filter(t => t.userId !== user?.id);
        stats = {
          total: teamTickets.length,
          resolved: teamTickets.filter((t) => RESOLVED_STATUSES.includes(t.status)).length,
          inProgress: teamTickets.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length,
          rejected: teamTickets.filter((t) => t.status === 'Rejected').length,
          cancelled: teamTickets.filter((t) => t.status === 'Cancelled').length,
        };
      } else {
        // My Requests: Show manager's own tickets
        stats = {
          total: filteredTickets.length,
          resolved: filteredTickets.filter((t) => RESOLVED_STATUSES.includes(t.status)).length,
          inProgress: filteredTickets.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length,
          rejected: filteredTickets.filter((t) => t.status === 'Rejected').length,
          cancelled: filteredTickets.filter((t) => t.status === 'Cancelled').length,
        };
      }
    } else {
      // For employees: Use the exact KPI definitions from Employee_KPI's_Flow.md
      stats = {
        total: filteredTickets.length,
        resolved: filteredTickets.filter((t) => RESOLVED_STATUSES.includes(t.status)).length,
        inProgress: filteredTickets.filter((t) => IN_PROGRESS_STATUSES.includes(t.status)).length,
        rejected: filteredTickets.filter((t) => t.status === 'Rejected').length,
        cancelled: filteredTickets.filter((t) => t.status === 'Cancelled').length,
      };
    }

    setStats(stats);
  }, [isSpecialist, isManager, user?.id, kpiFilter]);

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // In real implementation, this would call different endpoints based on role
      // For now, we'll use the existing service
      const data = await helpdeskService.getByUserId(user.id);
      setTickets(data as unknown as HelpdeskTicket[]);
      calculateStats(data as unknown as HelpdeskTicket[], activeTab);
    } catch {
      toast.error('Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeTab, calculateStats]);

  // Filter tickets based on KPI filter selection
  const filteredTicketsByDepartment = useMemo(() => {
    if (kpiFilter === 'All') {
      return tickets;
    }
    return tickets.filter(t => t.highLevelCategory === kpiFilter);
  }, [tickets, kpiFilter]);

  // Load tickets based on user role
  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Recalculate stats when tab changes
  useEffect(() => {
    if (tickets.length > 0) {
      calculateStats(tickets, activeTab);
    }
  }, [activeTab, tickets, calculateStats]);

  // Recalculate stats when KPI filter changes
  useEffect(() => {
    if (tickets.length > 0) {
      calculateStats(tickets, activeTab);
    }
  }, [kpiFilter, tickets, activeTab, calculateStats]);

  const handleSubmitRequest = async (formData: HelpdeskFormData) => {
    if (!user?.id || !user?.name || !user?.email) {
      console.error('[Helpdesk] Missing user data. User:', user);
      toast.error('User information is incomplete. Please try logging in again.');
      return;
    }

    try {
      // Use the store method which includes all notification logic
      await createWithWorkflow(
        formData,
        user.id,
        user.name,
        user.email,
        user.department
      );
      // Success toast is shown by the store
      await loadTickets();
      setActiveTab('my-requests');
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Failed to submit request:', error);
      // Error toast is shown by the store
      throw error;
    }
  };

  const handleSendMessage = async (ticketId: string, message: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.addMessage(
        ticketId,
        isSpecialist ? 'itadmin' : 'employee',
        user.name,
        message
      );
      toast.success('Message sent successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      throw error;
    }
  };

  const handleApprove = async (ticketId: string, level: number, remarks?: string) => {
    if (!user?.id || !user?.name) return;

    try {
      await helpdeskService.approve(ticketId, level, user.id, user.name, remarks);
      toast.success('Ticket approved successfully');
      await loadTickets();
    } catch (error) {
      toast.error('Failed to approve ticket. Please try again.');
      throw error;
    }
  };

  const handleReject = async (ticketId: string, level: number, remarks: string) => {
    if (!user?.id || !user?.name) return;

    try {
      await helpdeskService.reject(ticketId, level, user.id, user.name, remarks);
      toast.success('Ticket rejected');
      await loadTickets();
    } catch (error) {
      toast.error('Failed to reject ticket. Please try again.');
      throw error;
    }
  };

  const handleAssignToSelf = async (ticketId: string) => {
    if (!user?.id || !user?.name) return;

    try {
      // Determine queue based on user's specialist role
      const queue: SpecialistQueue = 'Hardware Team'; // In real app, get from user profile
      await helpdeskService.assign(ticketId, user.id, user.name, queue);
      toast.success('Ticket assigned to you');
      await loadTickets();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
      throw error;
    }
  };

  const handleUpdateProgress = useCallback(async (
    ticketId: string,
    progress: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed',
    notes?: string
  ) => {
    try {
      await helpdeskService.updateProgress(ticketId, progress, notes);
      toast.success('Progress updated successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress. Please try again.');
      throw error;
    }
  }, [loadTickets]);

  const handleCompleteWork = async (ticketId: string, resolutionNotes: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.completeWork(ticketId, resolutionNotes, user.name);
      toast.success('Work marked as complete');
      await loadTickets();
    } catch (error) {
      console.error('Failed to complete work:', error);
      toast.error('Failed to complete work. Please try again.');
      throw error;
    }
  };

  const handleConfirmCompletion = async (ticketId: string, feedback?: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.confirmCompletion(ticketId, user.name, feedback);
      toast.success('Resolution confirmed! Ticket awaiting IT closure.');
      await loadTickets();
    } catch (error) {
      console.error('Failed to confirm completion:', error);
      toast.error('Failed to confirm completion. Please try again.');
      throw error;
    }
  };

  // Handler for raising a similar request from a cancelled ticket
  const handleReopenTicket = useCallback((ticket: HelpdeskTicket) => {
    // Pre-fill the form with the cancelled ticket's data (creates a new ticket)
    setReopenData({
      previousTicketNumber: ticket.ticketNumber,
      highLevelCategory: ticket.highLevelCategory,
      subCategory: ticket.subCategory,
      subject: ticket.subject, // Keep original subject without prefix
      description: ticket.description,
      urgency: ticket.urgency,
    });
    setIsDrawerOpen(true);
  }, []);

  // Clear reopen data when drawer closes
  const handleDrawerClose = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setReopenData(null);
    }
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Headphones className="h-7 w-7 text-primary" />
            Helpdesk
          </h1>
          <p className="page-description">
            {isSpecialist
              ? 'Manage and resolve helpdesk tickets'
              : 'Submit and track your helpdesk requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(isEmployee || isManager) && (
            <Button
              onClick={() => setIsDrawerOpen(true)}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Raise a Request
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards with Department Filter Tabs */}
      <div className="space-y-3">
        {/* KPI Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setKpiFilter('All')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              kpiFilter === 'All'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setKpiFilter('IT')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              kpiFilter === 'IT'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            IT
          </button>
          <button
            onClick={() => setKpiFilter('Finance')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              kpiFilter === 'Finance'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Finance
          </button>
          <button
            onClick={() => setKpiFilter('Facilities')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              kpiFilter === 'Facilities'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Facilities
          </button>
        </div>

        {/* KPI Bar */}
        <HelpdeskKpiBar
          title="Requests"
          total={stats.total}
          items={[
            { 
              label: 'In Progress', 
              value: stats.inProgress, 
              color: '#3b82f6',
              icon: <Clock className="h-5 w-5" />
            },
            { 
              label: 'Resolved', 
              value: stats.resolved, 
              color: '#22c55e',
              icon: <CheckCircle2 className="h-5 w-5" />
            },
            { 
              label: 'Rejected', 
              value: stats.rejected, 
              color: '#ef4444',
              icon: <XCircle className="h-5 w-5" />
            },
            { 
              label: 'Cancelled', 
              value: stats.cancelled, 
              color: '#f97316',
              icon: <XCircle className="h-5 w-5" />
            },
          ]}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-background border border-border">
          {isEmployee && (
            <>
              <TabsTrigger value="my-requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                My Requests
                {stats.total > 0 && (
                  <Badge className="ml-2 bg-secondary text-secondary-foreground">
                    {stats.total}
                  </Badge>
                )}
              </TabsTrigger>
            </>
          )}

          {isManager && (
            <TabsTrigger value="my-team-requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Team Requests
              {stats.total > 0 && (
                <Badge className="ml-2 bg-secondary text-secondary-foreground">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
          )}

          {showITQueue && (
            <TabsTrigger value="it-queue" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
              IT Queue
            </TabsTrigger>
          )}
          
          {showFacilitiesQueue && (
            <TabsTrigger value="facilities-queue" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
              Facilities Queue
            </TabsTrigger>
          )}
          
          {showFinanceQueue && (
            <TabsTrigger value="finance-queue" className="data-[state=active]:bg-brand-green data-[state=active]:text-white">
              Finance Queue
            </TabsTrigger>
          )}
        </TabsList>

        {/* My Requests Tab */}
        {isEmployee && (
          <TabsContent value="my-requests" className="mt-4">
            <MyRequests
              tickets={filteredTicketsByDepartment}
              currentUserId={user?.id || ''}
              currentUserName={user?.name || ''}
              onSendMessage={handleSendMessage}
              onConfirmCompletion={handleConfirmCompletion}
              onReopenTicket={handleReopenTicket}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {/* My Team Requests Tab */}
        {isManager && (
          <TabsContent value="my-team-requests" className="mt-4">
            <MyTeamRequests
              tickets={filteredTicketsByDepartment}
              currentManagerId={user?.id || ''}
              currentManagerName={user?.name || ''}
              currentManagerLevel={1}
              onSendMessage={handleSendMessage}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {/* Specialist Queue Tabs */}
        {showITQueue && (
          <TabsContent value="it-queue" className="mt-4">
            <SpecialistQueuePage
              queueType="Hardware Team"
              tickets={tickets.filter(t => t.highLevelCategory === 'IT')}
              currentSpecialistId={user?.id || ''}
              currentSpecialistName={user?.name || ''}
              onAssignToSelf={handleAssignToSelf}
              onUpdateProgress={handleUpdateProgress}
              onCompleteWork={handleCompleteWork}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {showFacilitiesQueue && (
          <TabsContent value="facilities-queue" className="mt-4">
            <SpecialistQueuePage
              queueType="Building Maintenance"
              tickets={tickets.filter(t => t.highLevelCategory === 'Facilities')}
              currentSpecialistId={user?.id || ''}
              currentSpecialistName={user?.name || ''}
              onAssignToSelf={handleAssignToSelf}
              onUpdateProgress={handleUpdateProgress}
              onCompleteWork={handleCompleteWork}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </TabsContent>
        )}

        {showFinanceQueue && (
          <TabsContent value="finance-queue" className="mt-4">
            <SpecialistQueuePage
              queueType="Expense Claims"
              tickets={tickets.filter(t => t.highLevelCategory === 'Finance')}
              currentSpecialistId={user?.id || ''}
              currentSpecialistName={user?.name || ''}
              onAssignToSelf={handleAssignToSelf}
              onUpdateProgress={handleUpdateProgress}
              onCompleteWork={handleCompleteWork}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Raise Request Drawer */}
      <RaiseRequestDrawer
        open={isDrawerOpen}
        onOpenChange={handleDrawerClose}
        onSubmit={handleSubmitRequest}
        isLoading={isLoading}
        reopenData={reopenData}
      />
    </div>
  );
}
