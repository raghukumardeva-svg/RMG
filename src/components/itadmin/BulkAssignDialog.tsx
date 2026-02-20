import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserPlus, AlertCircle } from 'lucide-react';
import { ITEmployeeSelect } from './ITEmployeeSelect';
import { toast } from 'sonner';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketCount: number;
  onAssign: (employeeId: string, notes?: string) => Promise<void>;
  isAssigning?: boolean;
  department?: 'IT' | 'Finance' | 'Facilities';
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  ticketCount,
  onAssign,
  isAssigning = false,
  department = 'IT',
}: BulkAssignDialogProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const resetForm = () => {
    setSelectedEmployee('');
    setAssignmentNotes('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      setShowConfirmation(false);
    }
    onOpenChange(newOpen);
  };

  const handleProceed = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      await onAssign(selectedEmployee, assignmentNotes);
      resetForm();
      setShowConfirmation(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Bulk assignment failed:', error);
      toast.error('Failed to assign tickets. Please try again.');
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={open && !showConfirmation} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-brand-navy dark:text-gray-100 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-brand-green" />
              Bulk Assign Tickets
            </DialogTitle>
            <DialogDescription className="text-brand-slate dark:text-gray-400">
              Assign {ticketCount} selected {ticketCount === 1 ? 'ticket' : 'tickets'} to a {department} employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Employee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee">
                Select {department} Employee <span className="text-red-500">*</span>
              </Label>
              <ITEmployeeSelect
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                department={department}
              />
            </div>

            {/* Assignment Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Assignment Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or instructions for the assignee..."
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <p className="font-medium mb-1">Bulk Assignment</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    All {ticketCount} selected {ticketCount === 1 ? 'ticket' : 'tickets'} will be assigned to the selected employee. 
                    The assignee will receive a notification for each ticket.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleProceed}
              disabled={!selectedEmployee || isAssigning}
              className="bg-primary hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Proceed to Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign {ticketCount} {ticketCount === 1 ? 'ticket' : 'tickets'} to the selected employee?
              <br /><br />
              This action will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Assign all selected tickets to the employee</li>
                <li>Send email notifications to the assignee</li>
                <li>Create audit log entries for each ticket</li>
                <li>Update ticket status to "Assigned"</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isAssigning}
              className="bg-primary hover:bg-primary/90"
            >
              {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
