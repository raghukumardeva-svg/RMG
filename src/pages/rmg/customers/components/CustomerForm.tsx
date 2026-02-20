import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { CustomerFormData } from '@/types/customer';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const customerSchema = z.object({
  customerNo: z.string().min(1, 'Customer number is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  hubspotRecordId: z.string().optional().or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  region: z.enum(['UK', 'India', 'USA', 'ME', 'Other']),
  regionHead: z.string().optional().or(z.literal('')),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => Promise<void>;
  defaultValues?: Partial<CustomerFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CustomerForm({
  onSubmit,
  defaultValues,
  isLoading,
  submitLabel = 'Create Customer',
}: CustomerFormProps) {
  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customerNo: '',
      customerName: '',
      hubspotRecordId: '',
      industry: '',
      region: 'Other' as const,
      regionHead: '',
      status: 'Active' as const,
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: CustomerFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Number */}
          <FormField
            control={form.control}
            name="customerNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Number *</FormLabel>
                <FormControl>
                  <Input placeholder="CUST-001" {...field} />
                </FormControl>
                <FormDescription>Unique customer identifier</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customer Name */}
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corporation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Industry */}
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry *</FormLabel>
                <FormControl>
                  <Input placeholder="Technology" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Region */}
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="India">India</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="ME">Middle East</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Region Head */}
          <FormField
            control={form.control}
            name="regionHead"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region Head</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* HubSpot Record ID */}
          <FormField
            control={form.control}
            name="hubspotRecordId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HubSpot Record ID</FormLabel>
                <FormControl>
                  <Input placeholder="HS-12345" {...field} />
                </FormControl>
                <FormDescription>Optional reference</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
