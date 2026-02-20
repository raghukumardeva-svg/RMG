import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { CustomerPO } from '@/types/customerPO';
import { useCustomerStore } from '@/store/customerStore';
import { useProjectStore } from '@/store/projectStore';

const customerPOSchema = z.object({
  contractNo: z.string({ message: 'Contract number is required' }).min(1, 'Contract number is required'),
  poNo: z.string({ message: 'PO number is required' }).min(1, 'PO number is required'),
  customerId: z.string({ message: 'Customer is required' }).min(1, 'Customer is required'),
  projectId: z.string({ message: 'Project is required' }).min(1, 'Project is required'),
  bookingEntity: z.enum(['Eviden', 'Habile', 'Akraya', 'ECIS'], { message: 'Booking entity is required' }),
  poCreationDate: z.string({ message: 'PO creation date is required' }).min(1, 'PO creation date is required'),
  poStartDate: z.string({ message: 'PO start date is required' }).min(1, 'PO start date is required'),
  poValidityDate: z.string({ message: 'PO validity date is required' }).min(1, 'PO validity date is required'),
  poAmount: z.coerce.number({ message: 'PO amount is required' }).positive('PO amount must be greater than 0'),
  poCurrency: z.string({ message: 'Currency is required' }).min(1, 'Currency is required'),
  paymentTerms: z.enum(['Net 30', 'Net 45', 'Net 60', 'Net 90', 'Immediate', 'Custom'], { message: 'Payment terms are required' }),
  autoRelease: z.boolean().default(false),
  status: z.enum(['Active', 'Closed', 'Expired'], { message: 'Status is required' }),
  notes: z.string().optional(),
});

type CustomerPOFormValues = z.infer<typeof customerPOSchema>;

interface CustomerPOFormProps {
  po?: CustomerPO;
  onSubmit: (data: CustomerPOFormValues) => Promise<void>;
}

export function CustomerPOForm({ po, onSubmit }: CustomerPOFormProps) {
  const { customers = [], fetchCustomers } = useCustomerStore();
  const { projects = [], fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchCustomers({});
    fetchProjects({});
  }, [fetchCustomers, fetchProjects]);

  const form = useForm<CustomerPOFormValues>({
    resolver: zodResolver(customerPOSchema),
    defaultValues: po
      ? {
          contractNo: po.contractNo,
          poNo: po.poNo,
          customerId: typeof po.customerId === 'string' ? po.customerId : po.customerId._id,
          projectId: typeof po.projectId === 'string' ? po.projectId : po.projectId._id,
          bookingEntity: po.bookingEntity,
          poCreationDate: po.poCreationDate.split('T')[0],
          poStartDate: po.poStartDate.split('T')[0],
          poValidityDate: po.poValidityDate.split('T')[0],
          poAmount: po.poAmount,
          poCurrency: po.poCurrency,
          paymentTerms: po.paymentTerms,
          autoRelease: po.autoRelease,
          status: po.status,
          notes: po.notes || '',
        }
      : {
          contractNo: '',
          poNo: '',
          customerId: '',
          projectId: '',
          bookingEntity: 'Eviden',
          poCreationDate: '',
          poStartDate: '',
          poValidityDate: '',
          poAmount: 0,
          poCurrency: 'USD',
          paymentTerms: 'Net 30',
          autoRelease: false,
          status: 'Active',
          notes: '',
        },
  });

  const activeCustomers = customers?.filter((c) => c.status === 'Active') || [];
  const activeProjects = projects?.filter((p) => p.status === 'Active') || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contractNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter contract number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Number *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter PO number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeCustomers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.customerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {activeProjects.map((project) => (
                      <SelectItem key={project._id} value={project._id}>
                        {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bookingEntity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Entity *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking entity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Eviden">Eviden</SelectItem>
                    <SelectItem value="Habile">Habile</SelectItem>
                    <SelectItem value="Akraya">Akraya</SelectItem>
                    <SelectItem value="ECIS">ECIS</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poCreationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Creation Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poStartDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Start Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poValidityDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Validity Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO Amount *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poCurrency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentTerms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Terms *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 45">Net 45</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="autoRelease"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Auto Release</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit">
            {po ? 'Update' : 'Create'} PO
          </Button>
        </div>
      </form>
    </Form>
  );
}
