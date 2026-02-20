import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Headphones,
  User,
  Info,
  Settings,
  FileType,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { SpecialistQueuePage } from '@/components/helpdesk/SpecialistQueuePage';
import { helpdeskService } from '@/services/helpdeskService';
import type { HelpdeskTicket, SpecialistQueue } from '@/types/helpdeskNew';
// import AutoCloseManagement from '@/components/helpdesk/AutoCloseManagement'; // Temporarily disabled - encoding issue
// import { TicketTemplates } from '@/components/helpdesk/TicketTemplates'; // Temporarily disabled - encoding issue
// import { CannedResponses } from '@/components/helpdesk/CannedResponses'; // Temporarily disabled - encoding issue

export function ITTicketManagement() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('hardware');
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inQueue: 0,
    assigned: 0,
    completed: 0,
    myAssigned: 0,
  });

  // IT_ADMIN users should use the main admin dashboard for assignment
  const isITAdmin = user?.role === 'IT_ADMIN';

  // Dialog states for management features
  const [isAutoCloseOpen, setIsAutoCloseOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isResponsesOpen, setIsResponsesOpen] = useState(false);

  const calculateStats = useCallback((ticketData: HelpdeskTicket[]) => {
    // Filter only IT tickets with approval gating (same as ITAdminDashboard)
    const itTickets = ticketData.filter((t) => {
      // Must be IT category
      if (t.highLevelCategory !== 'IT') return false;
      
      // Apply approval gating: block if requires approval but not completed
      if (t.requiresApproval && !t.approvalCompleted) return false;
      
      // Apply routing filter: must be routed to IT
      if (!t.routedTo || t.routedTo !== 'IT') return false;
      
      return true;
    });
    
    // User-specific filtering - match what the specialist actually sees
    const myTickets = itTickets.filter((t) => 
      t.assignment?.assignedToId === user?.employeeId || 
      t.assignment?.assignedToId === user?.id
    );
    
    // Available tickets (unassigned, not cancelled/closed)
    const terminalStatuses = ['Cancelled', 'Closed', 'Auto-Closed', 'Confirmed', 'Completed', 'Work Completed', 'Completed - Awaiting IT Closure', 'Rejected'];
    const availableTickets = itTickets.filter((t) => 
      !t.assignment?.assignedToId && 
      t.status === 'In Queue' &&
      !terminalStatuses.includes(t.status)
    );
    
    const newStats = {
      total: itTickets.length, // Keep global count for reference
      inQueue: availableTickets.length, // Available to pick up
      assigned: myTickets.filter(
        (t) => t.status === 'Assigned' || t.status === 'In Progress' || t.status === 'Paused'
      ).length, // My active tickets
      completed: myTickets.filter(
        (t) =>
          t.status === 'Work Completed' ||
          t.status === 'Completed - Awaiting IT Closure' ||
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
      // Load all tickets and filter for IT category only
      const data = await helpdeskService.getAll();
      const itTickets = (data as unknown as HelpdeskTicket[]).filter(
        (ticket) => ticket.highLevelCategory === 'IT'
      );
      setTickets(itTickets);
      calculateStats(itTickets);
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

  // Define all possible IT request types (subcategories)
  const allRequestTypes = useMemo(() => [
    { id: 'hardware', name: 'Hardware' },
    { id: 'software', name: 'Software' },
    { id: 'network-connectivity', name: 'Network / Connectivity' },
    { id: 'account-login', name: 'Account / Login Problem' },
    { id: 'access-request', name: 'Access Request' },
    { id: 'new-equipment', name: 'New Equipment Request' },
    { id: 'other', name: 'Other' },
  ], []);

  // Helper function to get request type-specific ticket count
  const getRequestTypeTicketCount = useCallback((requestTypeName: string) => {
    return tickets.filter((t) => {
      // Match by subCategory
      const matchesRequestType = t.subCategory === requestTypeName;

      // Include legacy tickets without subCategory in "Hardware Issue"
      const isLegacyTicket = !t.subCategory && t.highLevelCategory === 'IT' && requestTypeName === 'Hardware Issue';

      if (!matchesRequestType && !isLegacyTicket) return false;

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

  const handleAssignToSelf = async (ticketId: string) => {
    if (!user?.id || !user?.name) return;

    try {
      // Get queue from current active tab
      const queueMap: Record<string, SpecialistQueue> = {
        'hardware-team': 'Hardware Team',
        'software-team': 'Software Team',
        'network-team': 'Network Team',
        'identity-team': 'Identity Team',
        'security-team': 'Security Team',
      };
      const queue = queueMap[activeTab];
      
      await helpdeskService.assign(ticketId, user.id, user.name, queue);
      toast.success('Ticket assigned to you');
      await loadTickets();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
      throw error;
    }
  };

  const handleAssignToSpecialist = async (ticketId: string, specialistId: string, specialistName: string) => {
    try {
      // Get queue from current active tab
      const queueMap: Record<string, SpecialistQueue> = {
        'hardware-team': 'Hardware Team',
        'software-team': 'Software Team',
        'network-team': 'Network Team',
        'identity-team': 'Identity Team',
        'security-team': 'Security Team',
      };
      const queue = queueMap[activeTab];
      
      await helpdeskService.assign(ticketId, specialistId, specialistName, queue);
      toast.success(`Ticket assigned to ${specialistName}`);
      await loadTickets();
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
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
            <Headphones className="h-7 w-7 text-primary" />
            {isITAdmin ? 'IT Tickets - View Only' : 'IT Ticket Management'}
          </h1>
          <p className="page-description">
            {isITAdmin 
              ? 'View all IT helpdesk tickets. Use IT Admin Dashboard to assign tickets.'
              : 'Manage and resolve IT helpdesk tickets across all teams'
            }
          </p>
        </div>
      </div>

      {/* IT Admin Notice */}
      {isITAdmin && (
        <div className="notice-info">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            As an IT Admin, please use the <strong>IT Admin Dashboard</strong> to assign tickets to specialists.
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
                <p className="kpi-label mb-1">All IT Tickets</p>
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
              onAssignToSelf={async () => {}} // Disabled - only IT Admin can assign
              onAssignToSpecialist={async () => {}} // Disabled - only IT Admin can assign
              onUpdateProgress={isITAdmin ? async () => {} : handleUpdateProgress}
              onCompleteWork={isITAdmin ? async () => {} : handleCompleteWork}
              onSendMessage={handleSendMessage}
              onPauseTicket={isITAdmin ? undefined : handlePauseTicket}
              onResumeTicket={isITAdmin ? undefined : handleResumeTicket}
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
