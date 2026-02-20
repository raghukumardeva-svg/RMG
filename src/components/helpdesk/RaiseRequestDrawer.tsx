import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CreateRequestForm } from './CreateRequestForm';
import type { HelpdeskFormData } from '@/types/helpdeskNew';

export interface ReopenTicketData {
  previousTicketNumber: string;
  highLevelCategory: 'IT' | 'Facilities' | 'Finance';
  subCategory: string;
  subject: string;
  description: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
}

interface RaiseRequestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: HelpdeskFormData) => Promise<void>;
  isLoading?: boolean;
  reopenData?: ReopenTicketData | null;
}

export function RaiseRequestDrawer({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  reopenData,
}: RaiseRequestDrawerProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmitSuccess = async (formData: HelpdeskFormData) => {
    await onSubmit(formData);
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={true}>
      <SheetContent
        className="w-full sm:!w-[60vw] md:!w-[60vw] lg:!w-[60vw] xl:!w-[60vw] flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 border-b border-brand-light-gray dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-2xl text-brand-navy dark:text-gray-100">
              {reopenData ? `Reopen Request (from ${reopenData.previousTicketNumber})` : 'Raise a Request'}
            </SheetTitle>
            {reopenData && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                Creating a new ticket based on your cancelled request
              </p>
            )}
          </SheetHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dynamic Form */}
          <CreateRequestForm
            onSubmit={handleSubmitSuccess}
            isLoading={isLoading}
            inDrawer={true}
            reopenData={reopenData}
          />
        </div>

        {/* Fixed Footer with Submit Button */}
        <div className="flex-shrink-0 p-4 border-t border-brand-light-gray dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex justify-end">
            <Button
              type="submit"
              form="raise-request-form"
              disabled={isLoading}
              className="min-w-32"
            >
              {isLoading ? 'Submitting...' : reopenData ? 'Submit New Request' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
