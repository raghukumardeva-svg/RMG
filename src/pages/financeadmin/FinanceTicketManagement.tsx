import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Wallet,
  User,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { SpecialistQueuePage } from '@/components/helpdesk/SpecialistQueuePage';
import { helpdeskService } from '@/services/helpdeskService';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

export function FinanceTicketManagement() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('payroll-question');
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inQueue: 0,
    assigned: 0,
    completed: 0,
    myAssigned: 0,
  });

  // FINANCE_ADMIN users should use the main admin dashboard for assignment
  const isFinanceAdmin = user?.role === 'FINANCE_ADMIN';

  const calculateStats = useCallback((ticketData: HelpdeskTicket[]) => {
    // Filter only Finance tickets with approval gating (same as FinanceAdminDashboard)
    const financeTickets = ticketData.filter((t) => {
      // Must be Finance category
      if (t.highLevelCategory !== 'Finance') return false;
      
      // Apply approval gating: block if requires approval but not completed
      if (t.requiresApproval && !t.approvalCompleted) return false;
      
      // Apply routing filter: must be routed to Finance
      if (!t.routedTo || t.routedTo !== 'Finance') return false;
      
      return true;
    });
    
    // User-specific filtering - match what the specialist actually sees
    const myTickets = financeTickets.filter((t) => 
      t.assignment?.assignedToId === user?.employeeId || 
      t.assignment?.assignedToId === user?.id
    );
    
    // Available tickets (unassigned, not cancelled/closed)
    const terminalStatuses = ['Cancelled', 'Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Work Completed', 'Rejected'];
    const availableTickets = financeTickets.filter((t) => 
      !t.assignment?.assignedToId && 
      t.status === 'In Queue' &&
      !terminalStatuses.includes(t.status)
    );
    
    const newStats = {
      total: financeTickets.length, // Keep global count for reference
      inQueue: availableTickets.length, // Available to pick up
      assigned: myTickets.filter(
        (t) => t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Paused'
      ).length, // My active tickets
      completed: myTickets.filter(
        (t) =>
          t.status === 'Work Completed' ||
          t.status === 'Completed' ||
          t.status === 'Confirmed' ||
          t.status === 'Closed' ||
          t.status === 'Auto-Closed' ||
          t.status === 'Cancelled'
      ).length, // My completed tickets
      myAssigned: myTickets.length, // All my tickets (active + completed)
    };

    setStats(newStats);
  }, [user?.id, user?.employeeId]);

  const loadTickets = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load all tickets and filter for Finance category only
      const data = await helpdeskService.getAll();
      const financeTickets = (data as unknown as HelpdeskTicket[]).filter(
        (ticket) => {
          // Must be Finance category
          if (ticket.highLevelCategory !== 'Finance') return false;
          
          // Apply approval gating: block if requires approval but not completed
          if (ticket.requiresApproval && !ticket.approvalCompleted) return false;
          
          // For tickets that require approval, they must be routed to Finance
          // For tickets that don't require approval, we accept them even without explicit routing
          if (ticket.requiresApproval && ticket.routedTo !== 'Finance') {
            return false;
          }
          
          return true;
        }
      );
      setTickets(financeTickets);
      calculateStats(financeTickets);
    } catch (error) {
      console.error('Failed to load tickets:', error);
      toast.error('Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, calculateStats]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Define all possible Finance request types (subcategories) - MUST MATCH seedSubCategoryConfig.ts
  const allRequestTypes = useMemo(() => [
    { id: 'payroll-question', name: 'Payroll Question' },
    { id: 'expense-reimbursement-issue', name: 'Expense Reimbursement Issue' },
    { id: 'invoice-payment-issue', name: 'Invoice / Payment Issue' },
    { id: 'purchase-order-request', name: 'Purchase Order Request' },
    { id: 'vendor-setup-or-update', name: 'Vendor Setup or Update' },
    { id: 'budget-or-account-inquiry', name: 'Budget or Account Inquiry' },
  ], []);

  // Helper function to get request type-specific ticket count
  const getRequestTypeTicketCount = useCallback((requestTypeName: string) => {
    return tickets.filter((t) => {
      // Match by subCategory
      const matchesRequestType = t.subCategory === requestTypeName;

      if (!matchesRequestType) return false;

      // Also filter by valid statuses
      const validStatuses = ['In Queue', 'Assigned', 'In Progress', 'Work Completed'];
      const legacyStatuses = ['Open', 'open'];
      const hasValidStatus = validStatuses.includes(t.status) || legacyStatuses.includes(t.status as string);

      return hasValidStatus;
    }).length;
  }, [tickets]);

  // Get all request types with their ticket counts
  const requestTypesWithCounts = useMemo(() => {
    return allRequestTypes.map(type => ({
      ...type,
      count: getRequestTypeTicketCount(type.name)
    }));
  }, [allRequestTypes, getRequestTypeTicketCount]);

  const handleSendMessage = async (ticketId: string, message: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.addMessage(ticketId, 'itadmin', user.name, message);
      toast.success('Message sent successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      throw error;
    }
  };

  const handleUpdateProgress = useCallback(
    async (
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
    },
    [loadTickets]
  );

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

  const handlePauseTicket = async (ticketId: string, reason?: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.pauseTicket(ticketId, user.name, reason);
      toast.success('Ticket paused successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to pause ticket:', error);
      toast.error('Failed to pause ticket. Please try again.');
      throw error;
    }
  };

  const handleResumeTicket = async (ticketId: string) => {
    if (!user?.name) return;

    try {
      await helpdeskService.resumeTicket(ticketId, user.name);
      toast.success('Ticket resumed successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to resume ticket:', error);
      toast.error('Failed to resume ticket. Please try again.');
      throw error;
    }
  };

  const handleCloseTicket = async (ticketId: string, notes?: string) => {
    const userName = user?.name;
    if (!userName) return;

    try {
      await helpdeskService.closeTicket(ticketId, userName, notes || undefined);
      toast.success('Ticket closed successfully');
      await loadTickets();
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket. Please try again.');
      throw error;
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Wallet className="h-7 w-7 text-primary" />
            {isFinanceAdmin ? 'Finance Tickets - View Only' : 'Finance Ticket Management'}
          </h1>
          <p className="page-description">
            {isFinanceAdmin 
              ? 'View all Finance helpdesk tickets. Use Finance Admin Dashboard to assign tickets.'
              : 'Manage and resolve Finance helpdesk tickets across all teams'
            }
          </p>
        </div>
      </div>

      {/* Finance Admin Notice */}
      {isFinanceAdmin && (
        <div className="notice-info">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            As a Finance Admin, please use the <strong>Finance Admin Dashboard</strong> to assign tickets to specialists.
            This page is for viewing ticket details only.
          </p>
        </div>
      )}

      {/* Statistics Cards - User-focused KPIs */}
      <div className="kpi-grid-5">
        <Card className="card-compact">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label mb-1">All Finance Tickets</p>
                <p className="kpi-value">
                  {stats.total}
                </p>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-compact">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label mb-1">Available</p>
                <p className="kpi-value">
                  {stats.inQueue}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-compact">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label mb-1">My Active</p>
                <p className="kpi-value">
                  {stats.assigned}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-compact">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label mb-1">My Completed</p>
                <p className="kpi-value">
                  {stats.completed}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-compact">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="kpi-label mb-1">My Total</p>
                <p className="kpi-value">
                  {stats.myAssigned}
                </p>
              </div>
              <User className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - All Request Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          {requestTypesWithCounts.map((type) => (
            <TabsTrigger
              key={type.id}
              value={type.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5"
            >
              {type.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {requestTypesWithCounts.map((type) => (
          <TabsContent key={type.id} value={type.id} className="mt-4">
            <SpecialistQueuePage
              queueType={type.name}
              tickets={tickets}
              currentSpecialistId={user?.employeeId || user?.id || ''}
              currentSpecialistName={user?.name || ''}
              onAssignToSelf={async () => {}} // Disabled - only Finance Admin can assign
              onAssignToSpecialist={async () => {}} // Disabled - only Finance Admin can assign
              onUpdateProgress={isFinanceAdmin ? async () => {} : handleUpdateProgress}
              onCompleteWork={isFinanceAdmin ? async () => {} : handleCompleteWork}
              onSendMessage={handleSendMessage}
              onPauseTicket={isFinanceAdmin ? undefined : handlePauseTicket}
              onResumeTicket={isFinanceAdmin ? undefined : handleResumeTicket}
              onCloseTicket={handleCloseTicket}
              isLoading={isLoading}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Management Dialogs */}
      {/* Auto-Close Dialog - Temporarily Disabled
      <Dialog open={isAutoCloseOpen} onOpenChange={setIsAutoCloseOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Auto-Close Management</DialogTitle>
            <DialogDescription>
              Configure automatic ticket closure for inactive tickets
            </DialogDescription>
          </DialogHeader>
          <AutoCloseManagement />
        </DialogContent>
      </Dialog>
      */}

      {/* Templates Dialog - Temporarily Disabled
      <Dialog open={isTemplatesOpen} onOpenChange={setIsTemplatesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Templates</DialogTitle>
            <DialogDescription>
              Manage and use ticket templates for common requests
            </DialogDescription>
          </DialogHeader>
          <TicketTemplates onSelectTemplate={(template) => {
            toast.success(`Template "${template.name}" selected`);
            setIsTemplatesOpen(false);
          }} />
        </DialogContent>
      </Dialog>
      */}

      {/* Canned Responses Dialog - Temporarily Disabled
      <Dialog open={isResponsesOpen} onOpenChange={setIsResponsesOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Canned Responses</DialogTitle>
            <DialogDescription>
              Quick responses for common ticket replies
            </DialogDescription>
          </DialogHeader>
          <CannedResponses 
            onInsertResponse={(content) => {
              toast.success('Response copied to clipboard');
              navigator.clipboard.writeText(content);
              setIsResponsesOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      */}
    </div>
  );
}
