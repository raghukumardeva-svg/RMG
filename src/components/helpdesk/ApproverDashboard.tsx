import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { helpdeskService } from '@/services/helpdeskService';
import { AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { HelpdeskTicket as NewHelpdeskTicket } from '@/types/helpdeskNew';
import type { ViewMode } from './ViewToggle';
import type { FilterMode } from './TicketStatusFilter';
import { ViewToggle } from './ViewToggle';
import { TicketStatusFilter } from './TicketStatusFilter';
import { ApproverTicketList } from './ApproverTicketList';
import { ApproverTicketTable } from './ApproverTicketTable';
import { ViewTicket } from './ViewTicket';

export function ApproverDashboard() {
  const { user } = useAuthStore();
  const [allTickets, setAllTickets] = useState<NewHelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterMode, setFilterMode] = useState<FilterMode>('active');
  const [selectedTicket, setSelectedTicket] = useState<NewHelpdeskTicket | null>(null);
  const [actioningTicketId, setActioningTicketId] = useState<string | null>(null);
  const [comments, setComments] = useState<string>('');
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ ticket: NewHelpdeskTicket; action: 'Approved' | 'Rejected' } | null>(null);

  const approverLevel = user?.role === 'L1_APPROVER' ? 'L1' :
                        user?.role === 'L2_APPROVER' ? 'L2' :
                        user?.role === 'L3_APPROVER' ? 'L3' : null;

  useEffect(() => {
    if (user?.id) {
      loadAllTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAllTickets = async () => {
    try {
      setLoading(true);
      const tickets = await helpdeskService.getAllApproverTickets(user!.id);
      setAllTickets(tickets);
    } catch (error) {
      console.error('Error loading approver tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on active/history filter
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      // Check if ticket is historical (completed, rejected, or cancelled)
      const historicalStatuses = ['Approved', 'Rejected', 'Completed', 'Closed', 'Auto-Closed', 'Routed', 'Cancelled'];
      const isHistoricalByStatus = historicalStatuses.includes(ticket.status);
      const isHistoricalByApproval = ticket.approvalCompleted === true || ticket.approvalStatus === 'Rejected';
      const isHistorical = isHistoricalByStatus || isHistoricalByApproval;

      if (filterMode === 'active') {
        return !isHistorical;
      } else {
        return isHistorical;
      }
    });
  }, [allTickets, filterMode]);

  // Calculate counts using the same logic as filtering
  const activeCount = allTickets.filter(t => {
    const historicalStatuses = ['Approved', 'Rejected', 'Completed', 'Closed', 'Auto-Closed', 'Routed', 'Cancelled'];
    const isHistoricalByStatus = historicalStatuses.includes(t.status);
    const isHistoricalByApproval = t.approvalCompleted === true || t.approvalStatus === 'Rejected';
    return !(isHistoricalByStatus || isHistoricalByApproval);
  }).length;
  const historyCount = allTickets.filter(t => {
    const historicalStatuses = ['Approved', 'Rejected', 'Completed', 'Closed', 'Auto-Closed', 'Routed', 'Cancelled'];
    const isHistoricalByStatus = historicalStatuses.includes(t.status);
    const isHistoricalByApproval = t.approvalCompleted === true || t.approvalStatus === 'Rejected';
    return isHistoricalByStatus || isHistoricalByApproval;
  }).length;

  const handleViewTicket = (ticket: NewHelpdeskTicket) => {
    setSelectedTicket(ticket);
    setComments('');
  };

  const handleCloseTicket = () => {
    setSelectedTicket(null);
    setComments('');
  };

  const handleApproveTicket = (ticket: NewHelpdeskTicket) => {
    setPendingAction({ ticket, action: 'Approved' });
    setShowCommentsDialog(true);
  };

  const handleRejectTicket = (ticket: NewHelpdeskTicket) => {
    setPendingAction({ ticket, action: 'Rejected' });
    setShowCommentsDialog(true);
  };

  const executeApproval = async () => {
    if (!user?.id || !approverLevel || !pendingAction) return;

    try {
      setActioningTicketId(pendingAction.ticket.id);
      setShowCommentsDialog(false);

      if (approverLevel === 'L1') {
        await helpdeskService.approveL1(pendingAction.ticket.id, user.id, pendingAction.action, comments);
      } else if (approverLevel === 'L2') {
        await helpdeskService.approveL2(pendingAction.ticket.id, user.id, pendingAction.action, comments);
      } else if (approverLevel === 'L3') {
        await helpdeskService.approveL3(pendingAction.ticket.id, user.id, pendingAction.action, comments);
      }

      toast.success(`Ticket ${pendingAction.action.toLowerCase()} successfully`);
      setComments('');
      setPendingAction(null);
      await loadAllTickets();
    } catch (error: unknown) {
      console.error('Error processing approval:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process approval';
      toast.error(errorMessage);
    } finally {
      setActioningTicketId(null);
    }
  };

  const handleApproval = async (status: 'Approved' | 'Rejected') => {
    if (!user?.id || !approverLevel || !selectedTicket) return;

    try {
      setActioningTicketId(selectedTicket.id);

      if (approverLevel === 'L1') {
        await helpdeskService.approveL1(selectedTicket.id, user.id, status, comments);
      } else if (approverLevel === 'L2') {
        await helpdeskService.approveL2(selectedTicket.id, user.id, status, comments);
      } else if (approverLevel === 'L3') {
        await helpdeskService.approveL3(selectedTicket.id, user.id, status, comments);
      }

      toast.success(`Ticket ${status.toLowerCase()} successfully`);
      setComments('');
      setSelectedTicket(null);
      await loadAllTickets();
    } catch (error: unknown) {
      console.error('Error processing approval:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to process approval';
      toast.error(errorMessage);
    } finally {
      setActioningTicketId(null);
    }
  };

  if (!approverLevel) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600">You do not have approver privileges.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="mt-2 text-gray-600">Loading tickets...</p>
      </div>
    );
  }

  // Check if selected ticket can be acted upon
  const canActOnSelectedTicket = selectedTicket && !selectedTicket.approvalCompleted &&
    selectedTicket.approvalStatus !== 'Rejected' &&
    (selectedTicket.currentApprovalLevel || selectedTicket.approvalLevel) === approverLevel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy dark:text-gray-100">
            {approverLevel} Approver Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and manage approval requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllTickets}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {allTickets.length} Total
          </Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <TicketStatusFilter
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          activeCount={activeCount}
          historyCount={historyCount}
        />
        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Tickets Display */}
      {viewMode === 'list' ? (
        <ApproverTicketList
          tickets={filteredTickets}
          onViewTicket={handleViewTicket}
          onApprove={handleApproveTicket}
          onReject={handleRejectTicket}
          approverLevel={approverLevel}
          actioningTicketId={actioningTicketId}
        />
      ) : (
        <ApproverTicketTable
          tickets={filteredTickets}
          onViewTicket={handleViewTicket}
          onApprove={handleApproveTicket}
          onReject={handleRejectTicket}
          approverLevel={approverLevel}
          actioningTicketId={actioningTicketId}
        />
      )}

      {/* View Ticket Drawer */}
      {selectedTicket && (
        <ViewTicket
          ticket={selectedTicket}
          onClose={handleCloseTicket}
          currentUserName={user?.name}
        />
      )}

      {/* Approval Actions Drawer (shown as overlay when ticket is selected and can be acted upon) */}
      {selectedTicket && canActOnSelectedTicket && (
        <div className="fixed bottom-0 right-0 w-full sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] bg-white dark:bg-gray-800 border-t-2 border-blue-500 shadow-lg p-6 z-50">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-navy dark:text-gray-100">
                Approval Required - {approverLevel}
              </h3>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                Action Required
              </Badge>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2">Comments (Optional)</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments or feedback..."
                className="w-full"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleApproval('Approved')}
                disabled={actioningTicketId === selectedTicket.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                Approve
              </Button>
              <Button
                onClick={() => handleApproval('Rejected')}
                disabled={actioningTicketId === selectedTicket.id}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Dialog for Quick Approve/Reject from List/Table */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.action === 'Approved' ? 'Approve Ticket' : 'Reject Ticket'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction && (
                <>
                  Ticket: <strong>#{pendingAction.ticket.ticketNumber}</strong>
                  <br />
                  {pendingAction.ticket.subject}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-semibold mb-2">Comments (Optional)</Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments or feedback..."
                className="w-full"
                rows={4}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCommentsDialog(false);
                setPendingAction(null);
                setComments('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={executeApproval}
              disabled={!!actioningTicketId}
              className={
                pendingAction?.action === 'Approved'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
              variant={pendingAction?.action === 'Approved' ? 'default' : 'destructive'}
            >
              {pendingAction?.action === 'Approved' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
