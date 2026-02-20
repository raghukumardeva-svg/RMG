import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  Route,
  UserCheck,
  TrendingUp,
  MessageSquare,
  UserPlus,
  Play,
  Pause,
  FileCheck,
  User,
  Headphones,
  Settings,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ActivityHistoryProps {
  ticket: HelpdeskTicket;
  currentUserName?: string;
  onSendMessage?: (ticketId: string, message: string) => Promise<void>;
  onAssignToSelf?: (ticketId: string) => Promise<void>;
  onUpdateProgress?: (ticketId: string, progress: 'Not Started' | 'In Progress' | 'On Hold' | 'Completed', notes?: string) => Promise<void>;
  onCompleteWork?: (ticketId: string, resolutionNotes: string) => Promise<void>;
  onConfirmCompletion?: (ticketId: string, feedback?: string) => Promise<void>;
  onPauseTicket?: (ticketId: string, reason?: string) => Promise<void>;
  onResumeTicket?: (ticketId: string) => Promise<void>;
  onCloseTicket?: (ticketId: string, notes?: string) => Promise<void>;
  onReopenTicket?: (ticket: HelpdeskTicket) => void;
  showWorkflowActions?: boolean;
  currentUserId?: string;
  onClose?: () => void;
}

interface ActivityItem {
  id: string;
  type: 'system' | 'user' | 'support';
  icon: React.ReactNode;
  message: string;
  author?: string;
  senderRole?: 'employee' | 'manager' | 'specialist' | 'itadmin' | 'system';
  timestamp: string;
  color?: string;
}

export function ActivityHistory({ 
  ticket, 
  currentUserName, 
  onSendMessage,
  onAssignToSelf,
  onUpdateProgress,
  onCompleteWork,
  onConfirmCompletion,
  onPauseTicket,
  onResumeTicket,
  onCloseTicket,
  onReopenTicket,
  showWorkflowActions = false,
  currentUserId,
  onClose
}: ActivityHistoryProps) {
  const navigate = useNavigate();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progressDialog, setProgressDialog] = useState<{ action: 'start' | 'pause' | 'complete'; title: string } | null>(null);
  const [progressNotes, setProgressNotes] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [userFeedback, setUserFeedback] = useState('');

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if a string looks like a MongoDB ObjectId (24 hex characters)
  const isMongoId = (str?: string): boolean => {
    if (!str) return false;
    return /^[a-f0-9]{24}$/i.test(str);
  };

  // Get a friendly display name, avoiding MongoDB ObjectIds
  const getDisplayName = (name?: string, fallback?: string): string => {
    if (name && !isMongoId(name)) {
      return name;
    }
    if (fallback && !isMongoId(fallback)) {
      return fallback;
    }
    return 'IT Specialist';
  };

  // Build activity items from ticket history and conversation
  const buildActivityItems = (): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // Add creation event as first item
    items.push({
      id: 'created',
      type: 'system',
      icon: <Send className="h-4 w-4 text-blue-500" />,
      message: 'Ticket Created',
      author: ticket.requesterName || ticket.userName,
      timestamp: ticket.createdAt,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    });

    // Add approval/rejection comments from approverHistory
    if (ticket.approverHistory && ticket.approverHistory.length > 0) {
      ticket.approverHistory.forEach((approval, idx) => {
        const isApproved = approval.status === 'Approved' || approval.action === 'Approve' || approval.action === 'Approved';
        const isRejected = approval.status === 'Rejected' || approval.action === 'Reject' || approval.action === 'Rejected';

        if (isApproved || isRejected) {
          // Check both 'comments' (from backend) and 'remarks' (type definition)
          const approvalComment = approval.comments || approval.remarks;
          
          items.push({
            id: `approval-${idx}`,
            type: 'system',
            icon: isApproved
              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
              : <XCircle className="h-4 w-4 text-red-500" />,
            message: approvalComment || (isApproved ? 'Approved without comments' : 'Rejected without comments'),
            author: `${approval.approverName || approval.managerName} (Level ${approval.level} ${isApproved ? 'Approval' : 'Rejection'})`,
            senderRole: 'manager',
            timestamp: approval.actionTimestamp || approval.actionDate || approval.timestamp || ticket.createdAt,
            color: isApproved
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          });
        }
      });
    }

    // Add history events (excluding approval/rejection events - those are in approverHistory)
    if (ticket.history && ticket.history.length > 0) {
      ticket.history.forEach((event, idx) => {
        const actionLower = event.action.toLowerCase();

        // Skip approval/rejection events as they're already shown from approverHistory
        if (actionLower.includes('l1_approv') || actionLower.includes('l2_approv') || actionLower.includes('l3_approv') ||
            actionLower.includes('l1_reject') || actionLower.includes('l2_reject') || actionLower.includes('l3_reject')) {
          return;
        }

        // Skip 'created' action - we already show ticket creation separately above
        if (actionLower === 'created') {
          return;
        }

        // Skip 'message_added' action - the message itself is shown in conversation
        if (actionLower === 'message_added') {
          return;
        }

        let icon = <Clock className="h-4 w-4 text-gray-500" />;
        let color = 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
        let displayMessage = event.action;
        // Use helper to avoid showing MongoDB ObjectIds
        let displayAuthor = getDisplayName(
          event.performedBy || event.by,
          ticket.assignment?.assignedToName
        );

        // Format message for routing - show department name
        if (actionLower.includes('route') || actionLower.includes('queue')) {
          icon = <Route className="h-4 w-4 text-cyan-500" />;
          color = 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
          // Show the details which contains department info, or construct it
          const dept = ticket.routedTo || ticket.processing?.processingQueue || ticket.highLevelCategory;
          displayMessage = event.details || `Routed to ${dept} Department`;
          displayAuthor = getDisplayName(event.by, 'System');
        // Format message for assignment - show assignee and notes
        } else if (actionLower.includes('assign')) {
          icon = <UserCheck className="h-4 w-4 text-purple-500" />;
          color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
          // Show assignment details from event or ticket
          if (event.details) {
            displayMessage = event.details;
          } else {
            const assigneeName = ticket.assignment?.assignedToName;
            const assignmentNotes = ticket.assignment?.assignmentNotes;
            displayMessage = assigneeName 
              ? `Assigned to ${assigneeName}${assignmentNotes ? ` - ${assignmentNotes}` : ''}`
              : 'Ticket assigned';
          }
          displayAuthor = getDisplayName(event.by, ticket.assignment?.assignedByName || 'IT Admin');
        } else if (actionLower.includes('progress') || actionLower.includes('working')) {
          icon = <TrendingUp className="h-4 w-4 text-orange-500" />;
          color = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
          displayMessage = event.details || event.action;
        } else if (actionLower.includes('complet') || actionLower.includes('closed')) {
          icon = <CheckCircle2 className="h-4 w-4 text-green-500" />;
          color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          displayMessage = event.details || event.action;
        } else if (actionLower.includes('cancel')) {
          icon = <XCircle className="h-4 w-4 text-red-500" />;
          color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          displayMessage = event.details || event.action;
        } else if (actionLower.includes('pause') || actionLower.includes('hold')) {
          icon = <Pause className="h-4 w-4 text-amber-500" />;
          color = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
          displayMessage = event.details || event.action;
        } else if (actionLower.includes('resume') || actionLower.includes('start')) {
          icon = <Play className="h-4 w-4 text-emerald-500" />;
          color = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
          displayMessage = event.details || event.action;
        } else if (actionLower.includes('confirm')) {
          icon = <FileCheck className="h-4 w-4 text-teal-500" />;
          color = 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
          displayMessage = event.details || event.action;
        } else {
          // For other events, prefer details over action
          displayMessage = event.details || event.action;
        }

        items.push({
          id: `history-${idx}`,
          type: 'system',
          icon,
          message: displayMessage,
          author: displayAuthor,
          timestamp: event.timestamp,
          color
        });
      });
    }

    // Add conversation messages with improved visual distinction
    if (ticket.conversation && ticket.conversation.length > 0) {
      ticket.conversation.forEach((msg, idx) => {
        const isEmployee = msg.sender === 'employee';
        const isSpecialist = msg.sender === 'specialist' || msg.sender === 'itadmin';
        const isManager = msg.sender === 'manager';

        // Determine color based on sender role for clear visual distinction
        let color = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'; // Employee default (blue)
        if (isSpecialist) {
          color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'; // IT Specialist (green)
        } else if (isManager) {
          color = 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'; // Manager (purple)
        }

        items.push({
          id: `conversation-${idx}`,
          type: isEmployee ? 'user' : 'support',
          icon: <MessageSquare className="h-4 w-4" />,
          message: msg.message,
          author: msg.senderName,
          senderRole: msg.sender,
          timestamp: msg.timestamp,
          color
        });
      });
    }

    // Sort by timestamp (chronological order)
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return items;
  };

  const activityItems = buildActivityItems();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !onSendMessage || !currentUserName) return;

    setIsSending(true);
    try {
      await onSendMessage(ticket._id || ticket.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAssign = async () => {
    if (!onAssignToSelf) return;
    setIsSubmitting(true);
    try {
      await onAssignToSelf(ticket._id || ticket.id);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      toast.error('Failed to assign ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressAction = async () => {
    if (!progressDialog || !onUpdateProgress || !onCompleteWork) return;

    setIsSubmitting(true);
    try {
      const { action } = progressDialog;

      if (action === 'start') {
        await onUpdateProgress(ticket._id || ticket.id, 'In Progress', progressNotes || undefined);
      } else if (action === 'pause') {
        // Use new pause endpoint if available, otherwise fall back to On Hold
        if (onPauseTicket) {
          await onPauseTicket(ticket._id || ticket.id, progressNotes || undefined);
        } else {
          await onUpdateProgress(ticket._id || ticket.id, 'On Hold', progressNotes || undefined);
        }
      } else if (action === 'complete') {
        if (!resolutionNotes.trim()) {
          alert('Resolution notes are required');
          return;
        }
        await onCompleteWork(ticket._id || ticket.id, resolutionNotes);
      }

      setProgressDialog(null);
      setProgressNotes('');
      setResolutionNotes('');
    } catch (error) {
      console.error('Failed to update progress:', error);
      toast.error('Failed to update progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async () => {
    if (!onResumeTicket) return;
    setIsSubmitting(true);
    try {
      await onResumeTicket(ticket._id || ticket.id);
    } catch (error) {
      console.error('Failed to resume ticket:', error);
      toast.error('Failed to resume ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!onCloseTicket) return;
    setIsSubmitting(true);
    try {
      await onCloseTicket(ticket._id || ticket.id, userFeedback || undefined);
      setConfirmDialog(false);
      setUserFeedback('');
    } catch (error) {
      console.error('Failed to close ticket:', error);
      toast.error('Failed to close ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmCompletion = async () => {
    if (!onConfirmCompletion) return;

    setIsSubmitting(true);
    try {
      await onConfirmCompletion(ticket._id || ticket.id, userFeedback || undefined);
      setConfirmDialog(false);
      setUserFeedback('');
    } catch (error) {
      console.error('Failed to confirm completion:', error);
      toast.error('Failed to confirm completion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAssignedToCurrentUser = ticket.assignment?.assignedToId === currentUserId;
  const canAssign = showWorkflowActions && !ticket.assignment;
  const canStart = showWorkflowActions && isAssignedToCurrentUser && ticket.status === 'Assigned';
  const canPause = showWorkflowActions && isAssignedToCurrentUser && ticket.status === 'In Progress';
  const canResume = showWorkflowActions && isAssignedToCurrentUser && (ticket.status === 'Paused' || ticket.status === 'On Hold') && onResumeTicket;
  const canComplete = showWorkflowActions && isAssignedToCurrentUser && ticket.status === 'In Progress';
  
  // Check if current user is the requester and can confirm completion
  const isRequester = ticket.userId === currentUserId;
  const canConfirm = isRequester && ticket.status === 'Work Completed' && onConfirmCompletion;
  
  // Only the assigned IT Specialist can close ticket after user confirmation
  const canClose = showWorkflowActions && isAssignedToCurrentUser && 
    (ticket.status === 'Completed - Awaiting IT Closure' || ticket.status === 'Confirmed') && onCloseTicket;

  const isTicketClosed = ['Closed', 'Auto-Closed', 'Rejected'].includes(ticket.status);
  const isTicketCancelled = ticket.status === 'Cancelled';
  const isRequesterViewing = ticket.userId === currentUserId;

  return (
    <Card className="border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-green" />
          Activity & Conversation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Confirmed - Awaiting IT Closure */}
        {ticket.status === 'Completed - Awaiting IT Closure' && ticket.resolution && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                    User Confirmed - Awaiting IT Closure
                  </h3>
                  {ticket.userConfirmedAt && (
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">
                      {formatTimestamp(ticket.userConfirmedAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  The user has confirmed the resolution. You can now officially close this ticket.
                </p>
                {ticket.resolution.notes && (
                  <div className="bg-white dark:bg-gray-800 rounded p-3 border border-emerald-100 dark:border-emerald-900">
                    <p className="text-xs font-medium text-emerald-900 dark:text-emerald-100 mb-1">Resolution:</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {ticket.resolution.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resolution Notes - Show prominently when work is completed */}
        {ticket.resolution && ticket.resolution.notes && ticket.status === 'Work Completed' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Work Completed
                  </h3>
                  {ticket.resolution.resolvedAt && (
                    <span className="text-xs text-green-700 dark:text-green-300">
                      {formatTimestamp(ticket.resolution.resolvedAt)}
                    </span>
                  )}
                </div>
                {ticket.resolution.resolvedBy && (
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Resolved by: {ticket.resolution.resolvedBy}
                  </p>
                )}
                <div className="bg-white dark:bg-gray-800 rounded p-3 border border-green-100 dark:border-green-900">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {ticket.resolution.notes}
                  </p>
                </div>
                {canConfirm && (
                  <Button
                    onClick={() => setConfirmDialog(true)}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white mt-3"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm & Close Ticket
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Items */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {activityItems.map((item) => {
            // Determine avatar icon based on sender role
            const getAvatarIcon = () => {
              if (item.senderRole === 'employee') {
                return <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
              } else if (item.senderRole === 'specialist' || item.senderRole === 'itadmin') {
                return <Headphones className="h-4 w-4 text-green-600 dark:text-green-400" />;
              } else if (item.senderRole === 'manager') {
                return <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
              } else if (item.senderRole === 'system') {
                return <Settings className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
              }
              return item.icon;
            };

            // Get role label
            const getRoleLabel = () => {
              switch (item.senderRole) {
                case 'employee':
                  return 'Employee';
                case 'specialist':
                  return 'IT Specialist';
                case 'itadmin':
                  return 'IT Admin';
                case 'manager':
                  return 'Manager';
                case 'system':
                  return 'System';
                default:
                  return item.type;
              }
            };

            return (
              <div key={item.id} className="flex gap-3">
                {/* Avatar */}
                <div className="flex-shrink-0 mt-1">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2',
                    item.type === 'system' ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' :
                    item.type === 'user' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  )}>
                    {getAvatarIcon()}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header with sender info and timestamp */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      {item.author && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-brand-navy dark:text-gray-100">
                            {item.author}
                          </span>
                          {item.senderRole && (
                            <span className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              item.color
                            )}>
                              {getRoleLabel()}
                            </span>
                          )}
                        </div>
                      )}
                      {!item.author && (
                        <span className="text-sm font-medium text-brand-navy dark:text-gray-100">
                          {item.message.split('\n')[0]}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-brand-slate dark:text-gray-500 whitespace-nowrap">
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>

                  {/* Message content */}
                  {item.author && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                        {item.message}
                      </p>
                    </div>
                  )}

                  {/* System message details */}
                  {!item.author && item.message.includes('\n') && (
                    <p className="text-sm text-brand-slate dark:text-gray-400 mt-1">
                      {item.message.split('\n').slice(1).join('\n')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Workflow Actions - IT Admin */}
        {showWorkflowActions && !isTicketClosed && (canAssign || canStart || canPause || canResume || canComplete || canClose) && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 flex-wrap">
              {canAssign && (
                <Button
                  onClick={handleAssign}
                  disabled={isSubmitting}
                  variant="outline"
                  className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Self
                </Button>
              )}
              
              {canStart && (
                <Button
                  onClick={() => setProgressDialog({ action: 'start', title: 'Start Work' })}
                  disabled={isSubmitting}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Work
                </Button>
              )}
              
              {canPause && (
                <Button
                  onClick={() => setProgressDialog({ action: 'pause', title: 'Pause Work' })}
                  disabled={isSubmitting}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {canResume && (
                <Button
                  onClick={handleResume}
                  disabled={isSubmitting}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Work
                </Button>
              )}
              
              {canComplete && (
                <Button
                  onClick={() => setProgressDialog({ action: 'complete', title: 'Complete Work' })}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete
                </Button>
              )}
              
              {canClose && (
                <Button
                  onClick={() => setConfirmDialog(true)}
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close Ticket
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Message Input */}
        {onSendMessage && currentUserName && !isTicketClosed && !isTicketCancelled && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[80px] resize-none"
                disabled={isSending}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="bg-brand-green hover:bg-brand-green/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled Ticket Notice - Only visible to the requester */}
        {isTicketCancelled && isRequesterViewing && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-gray-900/10 rounded-lg p-6 text-center border border-amber-200 dark:border-amber-800">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/30 mb-1">
                  <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This ticket has been Cancelled
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  This request was cancelled. You can raise a similar request with pre-filled details if needed.
                </p>
                {onReopenTicket && (
                  <Button
                    onClick={() => onReopenTicket(ticket)}
                    variant="outline"
                    className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Raise Similar Request
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Closed Ticket Notice - Only visible to the requester */}
        {isTicketClosed && isRequesterViewing && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-900/10 rounded-lg p-6 text-center border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-950/30 mb-1">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  This ticket has been successfully closed
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  No further messages can be sent. Thank you for using our support services.
                </p>
                <button 
                  onClick={() => {
                    if (onClose) onClose();
                    navigate('/helpdesk', { state: { openDrawer: true } });
                  }}
                  className="text-xs text-primary hover:text-primary/80 font-medium underline underline-offset-2 transition-colors"
                >
                  Need further help? Create a new request
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Progress Dialog */}
      {progressDialog && (
        <Dialog open={!!progressDialog} onOpenChange={() => setProgressDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{progressDialog.title}</DialogTitle>
              <DialogDescription>
                {progressDialog.action === 'complete'
                  ? 'Please provide resolution notes to complete this ticket.'
                  : 'Add optional notes about this status change.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {progressDialog.action === 'complete' ? (
                <div>
                  <label className="text-sm font-medium">Resolution Notes *</label>
                  <Textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the issue was resolved..."
                    className="min-h-[120px] mt-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    value={progressNotes}
                    onChange={(e) => setProgressNotes(e.target.value)}
                    placeholder="Add any notes about this update..."
                    className="min-h-[100px] mt-2"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProgressDialog(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProgressAction}
                disabled={isSubmitting || (progressDialog.action === 'complete' && !resolutionNotes.trim())}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* User Confirmation / IT Close Dialog */}
      {confirmDialog && (
        <Dialog open={confirmDialog} onOpenChange={() => setConfirmDialog(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {canClose ? 'Close Ticket' : 'Confirm Ticket Completion'}
              </DialogTitle>
              <DialogDescription>
                {canClose 
                  ? 'The user has confirmed the resolution. You can now close this ticket.' 
                  : 'Are you satisfied with the resolution provided? This will close the ticket.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  {canClose ? 'Closing Notes (Optional)' : 'Feedback (Optional)'}
                </label>
                <Textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder={canClose 
                    ? 'Add any final notes before closing...' 
                    : 'Share your feedback about the resolution...'}
                  className="min-h-[100px] mt-2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(false)}
                disabled={isSubmitting}
              >
                {canClose ? 'Cancel' : 'Not Yet'}
              </Button>
              <Button
                onClick={canClose ? handleCloseTicket : handleConfirmCompletion}
                disabled={isSubmitting}
                className={canClose ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isSubmitting ? (canClose ? 'Closing...' : 'Confirming...') : (canClose ? 'Close Ticket' : 'Confirm & Close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
