import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerPOForm } from './CustomerPOForm';
import { useCustomerPOStore } from '@/store/customerPOStore';
import type { CustomerPO, CustomerPOFormData } from '@/types/customerPO';
import { useToast } from '@/hooks/use-toast';

interface CreateCustomerPODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  po?: CustomerPO;
  onSuccess?: () => void;
}

export function CreateCustomerPODialog({
  open,
  onOpenChange,
  po,
  onSuccess,
}: CreateCustomerPODialogProps) {
  const { createPO, updatePO } = useCustomerPOStore();
  const { toast } = useToast();

  const handleSubmit = async (data: CustomerPOFormData) => {
    try {
      if (po) {
        await updatePO(po._id, data);
        toast({
          title: 'Success',
          description: 'Customer PO updated successfully',
        });
      } else {
        await createPO(data);
        toast({
          title: 'Success',
          description: 'Customer PO created successfully',
        });
      }
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{po ? 'Edit' : 'Create'} Customer PO</SheetTitle>
          <SheetDescription>
            {po
              ? 'Update the customer purchase order details below.'
              : 'Fill in the details to create a new customer purchase order.'}
          </SheetDescription>
        </SheetHeader>
        <CustomerPOForm po={po} onSubmit={handleSubmit} />
      </SheetContent>
    </Sheet>
  );
}
