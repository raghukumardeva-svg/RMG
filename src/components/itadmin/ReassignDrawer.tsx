import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ITEmployeeSelect } from './ITEmployeeSelect';
import { helpdeskService } from '@/services/helpdeskService';
import { Info, X } from 'lucide-react';

interface ReassignDrawerProps {
  open: boolean;
  onClose: () => void;
  ticketNumber: string;
  currentAssignee: {
    id: string;
    name: string;
  };
  onReassign: (newEmployeeId: string, newEmployeeName: string, reason: string) => Promise<void>;
  isReassigning: boolean;
  department: 'IT' | 'Finance' | 'Facilities';
}

export function ReassignDrawer({
  open,
  onClose,
  ticketNumber,
  currentAssignee,
  onReassign,
  isReassigning,
  department,
}: ReassignDrawerProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [specialists, setSpecialists] = useState<Array<{ id: string; employeeId: string; name: string }>>([]);

  // Load specialists
  useEffect(() => {
    const loadSpecialists = async () => {
      try {
        const data = await helpdeskService.getITSpecialists();
        setSpecialists(data);
      } catch (error) {
        console.error('Failed to load specialists:', error);
      }
    };
    if (open) {
      loadSpecialists();
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      // Use a timeout to avoid the cascading render warning
      const timer = setTimeout(() => {
        setSelectedEmployeeId('');
        setReason('');
        setShowConfirmation(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
  };

  const handleReassignClick = () => {
    // Validate inputs
    if (!selectedEmployeeId) {
      return;
    }
    if (!reason.trim()) {
      return;
    }
    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmReassign = async () => {
    const selectedEmployee = specialists.find(s => s.id === selectedEmployeeId);
    if (!selectedEmployee) return;
    
    await onReassign(selectedEmployee.employeeId, selectedEmployee.name, reason);
    setShowConfirmation(false);
    onClose();
  };

  const isFormValid = selectedEmployeeId && reason.trim().length > 0;
  const isSameAssignee = selectedEmployeeId === currentAssignee.id;
  const selectedEmployee = specialists.find(s => s.id === selectedEmployeeId);

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && !showConfirmation && onClose()}>
        <SheetContent className="sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Reassign Ticket {ticketNumber}</SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                disabled={isReassigning}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SheetDescription>
              Reassign this ticket to a different specialist. Both the current and new assignee will be notified.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            {/* Current Assignee Info */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Currently Assigned To</p>
                  <p className="text-sm text-amber-700 mt-1">{currentAssignee.name}</p>
                </div>
              </div>
            </div>

            {/* New Assignee Selection */}
            <div className="space-y-2">
              <Label htmlFor="employee-select" className="required">
                New Assignee
              </Label>
              <ITEmployeeSelect
                department={department}
                value={selectedEmployeeId}
                onValueChange={handleEmployeeChange}
                disabled={isReassigning}
              />
              {isSameAssignee && selectedEmployeeId && (
                <p className="text-sm text-amber-600">
                  ⚠️ You've selected the same assignee. Please select a different specialist.
                </p>
              )}
            </div>

            {/* Reason Field (Mandatory) */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="required">
                Reason for Reassignment
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for reassignment (required)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isReassigning}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This reason will be visible in the ticket history and notifications.
              </p>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">What happens next:</p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>{currentAssignee.name} will be notified about the reassignment</li>
                    <li>New assignee will be notified about the assignment</li>
                    <li>Reassignment will be logged in ticket history</li>
                    <li>Ticket counts will be updated for both specialists</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isReassigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignClick}
              disabled={!isFormValid || isReassigning || isSameAssignee}
            >
              {isReassigning ? 'Reassigning...' : 'Reassign Ticket'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reassignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reassign ticket <strong>{ticketNumber}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">From:</span>
              <span>{currentAssignee.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="font-medium">To:</span>
              <span>{selectedEmployee?.name || 'Unknown'}</span>
            </div>
            <div className="flex flex-col py-1">
              <span className="font-medium mb-1">Reason:</span>
              <span className="text-muted-foreground italic">{reason}</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isReassigning}
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReassign}
              disabled={isReassigning}
            >
              {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
