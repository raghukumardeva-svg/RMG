import React, { useState, useCallback, useMemo } from 'react';
import {
  RotateCcw,
  AlertCircle,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { HelpdeskTicket, ConversationMessage } from '@/types/helpdeskNew';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import { helpdeskService } from '@/services/helpdeskService';

interface TicketReopenProps {
  ticket: HelpdeskTicket;
  onReopen?: () => void;
  className?: string;
}

interface ReopenDialogProps {
  ticket: HelpdeskTicket;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export const TicketReopen = React.memo<TicketReopenProps>(({ 
  ticket, 
  onReopen, 
  className = '' 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  
  const { fetchTickets } = useHelpdeskStore();

  // Count how many times this ticket has been reopened (for tracking only)
  const reopenCount = useMemo(() => {
    return ticket.history?.filter(h => 
      h.action.toLowerCase().includes('reopened')
    ).length || 0;
  }, [ticket.history]);

  // Check if ticket can be reopened (unlimited reopening allowed)
  const canReopen = useMemo(() => {
    // Only closed or completed tickets can be reopened
    return ticket.status === 'Closed' || ticket.status === 'Completed';
  }, [ticket.status]);

  // Handle reopen confirmation
  const handleReopen = useCallback(async (reason: string) => {
    setIsReopening(true);
    try {
      // Call the dedicated reopen endpoint
      await helpdeskService.reopen(ticket.id || ticket._id || '', reason);
      
      toast.success('Ticket reopened successfully', {
        description: 'Your ticket has been submitted for review again.'
      });
      
      // Refresh tickets list
      await fetchTickets(ticket.userId);
      
      setIsDialogOpen(false);
      onReopen?.();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reopen ticket';
      toast.error(errorMessage);
      console.error('Reopen error:', error);
    } finally {
      setIsReopening(false);
    }
  }, [ticket, fetchTickets, onReopen]);

  if (!canReopen) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                disabled={isReopening}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reopen Ticket</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <ReopenDialog
        ticket={ticket}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleReopen}
      />
    </Dialog>
  );
});

TicketReopen.displayName = 'TicketReopen';

// Reopen Dialog Component
const ReopenDialog: React.FC<ReopenDialogProps> = ({ 
  ticket, 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for reopening this ticket');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[525px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-blue-600" />
          Reopen Ticket
        </DialogTitle>
        <DialogDescription>
          You are about to reopen this ticket. Please provide a reason for the action.
        </DialogDescription>
      </DialogHeader>
      
      {/* Ticket Information */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Ticket Details</h4>
            <Badge variant="outline">
              {ticket.ticketNumber || ticket.id}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Subject:</span>
            </div>
            <div className="font-medium truncate">
              {ticket.subject}
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Customer:</span>
            </div>
            <div className="font-medium">
              {ticket.userName}
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Closed:</span>
            </div>
            <div className="font-medium">
              {format(new Date(ticket.closedAt || ticket.updatedAt || ticket.createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </div>

        {/* Reason Input */}
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason for Reopening *
          </Label>
          <Textarea
            id="reason"
            placeholder="Please explain why this ticket needs to be reopened..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            This reason will be logged in the ticket history for audit purposes.
          </p>
        </div>

        {/* Warning Notice */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h5 className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Unlimited Ticket Reopening
            </h5>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Reopened tickets will restart the approval workflow. The ticket will be submitted for review again and may require fresh approvals based on your department's policies.
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={handleClose} 
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!reason.trim() || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Reopening...
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reopen Ticket
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

// Hook for ticket reopen functionality
export const useTicketReopen = () => {
  const { fetchTickets } = useHelpdeskStore();

  const canTicketBeReopened = useCallback((ticket: HelpdeskTicket) => {
    // Unlimited reopening - only check if ticket is closed or completed
    return ticket.status === 'Closed' || ticket.status === 'Completed';
  }, []);

  const reopenTicket = useCallback(async (
    ticketId: string, 
    reason: string,
    ticket: HelpdeskTicket
  ) => {
    try {
      await helpdeskService.reopen(ticketId, reason);
      await fetchTickets(ticket.userId);
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.response?.data?.message || 'Failed to reopen ticket'
      };
    }
  }, [fetchTickets]);

  return {
    canTicketBeReopened,
    reopenTicket
  };
};