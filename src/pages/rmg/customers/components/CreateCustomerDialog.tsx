import { useState } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import type { Customer, CustomerFormData } from '@/types/customer';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerForm } from './CustomerForm';
import { toast } from 'sonner';

interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  customer,
}: CreateCustomerDialogProps) {
  const { createCustomer, updateCustomer } = useCustomerStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    try {
      if (customer) {
        const id = customer._id || customer.id!;
        await updateCustomer(id, data);
        toast.success('Customer updated successfully');
      } else {
        await createCustomer(data);
        toast.success('Customer created successfully');
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${customer ? 'update' : 'create'} customer`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{customer ? 'Edit' : 'Create New'} Customer</SheetTitle>
          <SheetDescription>
            {customer ? 'Update the customer details below.' : 'Add a new customer to your database.'} Fields marked with * are required.
          </SheetDescription>
        </SheetHeader>
        <CustomerForm
          onSubmit={handleSubmit}
          defaultValues={customer ? {
            customerNo: customer.customerNo,
            customerName: customer.customerName,
            industry: customer.industry,
            region: customer.region,
            regionHead: customer.regionHead || '',
            hubspotRecordId: customer.hubspotRecordId || '',
            status: customer.status,
          } : undefined}
          isLoading={isLoading}
          submitLabel={customer ? 'Update Customer' : 'Create Customer'}
        />
      </SheetContent>
    </Sheet>
  );
}
