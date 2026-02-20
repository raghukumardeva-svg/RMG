import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Calendar,
  Clock,
  FileText,
  User,
  UserPlus,
  Tag,
} from 'lucide-react';
import { ITEmployeeSelect } from './ITEmployeeSelect';
import type { HelpdeskTicket } from '@/types/helpdeskNew';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssignTicketDrawerProps {
  ticket: HelpdeskTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssign: (ticketId: string, employeeId: string, notes?: string) => Promise<void>;
  isAssigning?: boolean;
  department?: 'IT' | 'Finance' | 'Facilities';
}

export function AssignTicketDrawer({
  ticket,
  open,
  onOpenChange,
  onAssign,
  isAssigning = false,
  department = 'IT',
}: AssignTicketDrawerProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const resetForm = () => {
    setSelectedEmployee('');
    setAssignmentNotes('');
  };

  const handleAssign = async () => {
    if (!ticket || !selectedEmployee) return;

    try {
      await onAssign(ticket._id || ticket.id, selectedEmployee, assignmentNotes);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign ticket. Please try again.');
      // Don't close drawer on error so user can retry
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

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

  if (!ticket) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-green" />
            Assign Ticket to {department} Employee
          </SheetTitle>
          <SheetDescription className="text-brand-slate dark:text-gray-400">
            Select a {department.toLowerCase()} employee based on their specialization and current workload
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Ticket Details */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-brand-green" />
                  <span className="font-mono text-sm text-brand-slate dark:text-gray-400">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <h3 className="font-semibold text-brand-navy dark:text-gray-100">
                  {ticket.subject}
                </h3>
              </div>
              <Badge className={getUrgencyColor(ticket.urgency)}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {ticket.urgency}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-brand-slate dark:text-gray-400">
                <Tag className="h-4 w-4" />
                <span className="font-medium">Type:</span>
                <span>{ticket.subCategory}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-slate dark:text-gray-400">
                <User className="h-4 w-4" />
                <span className="font-medium">Requester:</span>
                <span>{ticket.userName}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-slate dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Created:</span>
                <span>{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-slate dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Status:</span>
                <span>{ticket.status}</span>
              </div>
            </div>

            {ticket.description && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div 
                  className="text-sm text-brand-slate dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                />
              </div>
            )}
          </div>

          {/* Employee Selection */}
          <div>
            <ITEmployeeSelect
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
              specialization={ticket.subCategory}
              disabled={isAssigning}
              department={department}
            />
          </div>

          {/* Assignment Notes */}
          <div className="space-y-2">
            <Label htmlFor="assignment-notes" className="text-sm font-medium">
              Assignment Notes (Optional)
            </Label>
            <Textarea
              id="assignment-notes"
              placeholder="Add any special instructions or context for the assigned employee..."
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              disabled={isAssigning}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              These notes will be visible to the assigned {department.toLowerCase()} employee
            </p>
          </div>
        </div>

        <SheetFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isAssigning}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedEmployee || isAssigning}
            className="flex-1 bg-brand-green hover:bg-brand-green/90"
          >
            {isAssigning ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Ticket
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
