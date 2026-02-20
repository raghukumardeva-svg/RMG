import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { FileText, Tag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import { TicketDetails } from './ViewTicket/TicketDetails';
import { ActivityHistory } from './ViewTicket/ActivityHistory';
import { ApprovalStatusSection } from './ApprovalStatusSection';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { CheckSquare } from 'lucide-react';
import { HorizontalStepperTimeline } from './ViewTicket/HorizontalStepperTimeline';
import { SLAInfo } from './ViewTicket/SLAInfo';

interface ViewTicketProps {
  ticket: HelpdeskTicket;
  onClose: () => void;
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
}

export function ViewTicket({ 
  ticket, 
  onClose, 
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
  currentUserId
}: ViewTicketProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Submitted':
      case 'Draft':
        return 'badge-status-submitted';
      case 'Pending Approval':
      case 'Pending Level-1 Approval':
        return 'badge-status-pending-l1';
      case 'Pending Level-2 Approval':
        return 'badge-status-pending-l2';
      case 'Pending Level-3 Approval':
        return 'badge-status-pending-l3';
      case 'Approved':
        return 'badge-status-approved';
      case 'Completed':
      case 'Confirmed':
        return 'badge-status-completed';
      case 'Closed':
      case 'Auto-Closed':
        return 'badge-status-closed';
      case 'Completed - Awaiting IT Closure':
        return 'badge-status-awaiting-closure';
      case 'Rejected':
        return 'badge-status-rejected';
      case 'Cancelled':
        return 'badge-status-cancelled';
      case 'In Progress':
        return 'badge-status-in-progress';
      case 'Assigned':
        return 'badge-status-assigned';
      case 'Paused':
      case 'On Hold':
        return 'badge-status-on-hold';
      case 'Routed':
      case 'In Queue':
        return 'badge-status-routed';
      default:
        return 'badge-status-submitted';
    }
  };

  const getUrgencyColor = (urgency: string): string => {
    const urgencyLower = urgency.toLowerCase();
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

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:!w-[90vw] md:!w-[85vw] lg:!w-[80vw] xl:!w-[75vw] flex flex-col p-0 max-w-none gap-0"
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <FileText className="h-6 w-6 text-brand-green flex-shrink-0" />
              <SheetTitle className="text-2xl font-bold text-brand-navy dark:text-gray-100">
                {ticket.ticketNumber}
              </SheetTitle>
            </div>

            {/* All Badges Row - Right Side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="custom" className={cn('text-xs', getStatusColor(ticket.status))}>
                {ticket.status}
              </Badge>
              <Badge variant="custom" className={cn('text-xs', getUrgencyColor(ticket.urgency))}>
                {ticket.urgency}
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-700"
              >
                <Tag className="h-3 w-3" />
                {ticket.highLevelCategory} / {ticket.subCategory}
              </Badge>
              {ticket.assignment?.assignedToName && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-700"
                >
                  <User className="h-3 w-3" />
                  Assigned: {ticket.assignment.assignedToName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Ticket Flow */}
        <HorizontalStepperTimeline ticket={ticket} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4">
            {/* Left Column - Request Details (40%) */}
            <div className="w-[40%] space-y-4">
              {/* Request Details */}
              <TicketDetails ticket={ticket} />

              {/* SLA Information */}
              {ticket.sla && (
                <SLAInfo ticket={ticket} />
              )}

              {/* Approval Status Section */}
              {ticket.approval?.required && !ticket.approval.bypassed && (
                <CollapsibleSection
                  title="Approval Status"
                  icon={<CheckSquare className="h-4 w-4" />}
                  defaultOpen={true}
                >
                  <ApprovalStatusSection ticket={ticket} />
                </CollapsibleSection>
              )}
            </div>

            {/* Right Column - Activity & Conversation (60%) */}
            <div className="w-[60%]">
              <ActivityHistory
                  ticket={ticket}
                  currentUserName={currentUserName}
                  onSendMessage={onSendMessage}
                  onAssignToSelf={onAssignToSelf}
                  onUpdateProgress={onUpdateProgress}
                  onCompleteWork={onCompleteWork}
                  onConfirmCompletion={onConfirmCompletion}
                  onPauseTicket={onPauseTicket}
                  onResumeTicket={onResumeTicket}
                  onCloseTicket={onCloseTicket}
                  onReopenTicket={onReopenTicket}
                  showWorkflowActions={showWorkflowActions}
                  currentUserId={currentUserId}
                  onClose={onClose}
                />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
