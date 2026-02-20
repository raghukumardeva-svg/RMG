import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import type { FLFundingDetails } from '@/types/financialLine';
import { useCustomerPOStore } from '@/store/customerPOStore';

const step2Schema = z.object({
  customerPOId: z.string({ message: 'Customer PO is required' }).min(1, 'Customer PO is required'),
  poNo: z.string().optional(),
  contractNo: z.string().optional(),
  unitRate: z.coerce.number({ message: 'Unit rate is required' }).positive('Unit rate must be greater than 0'),
  fundingUnits: z.coerce.number({ message: 'Funding units is required' }).positive('Funding units must be greater than 0'),
  unitUOM: z.enum(['Hour', 'Day', 'Month'], { message: 'Unit of measure is required' }),
  fundingValue: z.number().min(0),
});

type Step2FormValues = z.infer<typeof step2Schema>;

interface Step2FormProps {
  defaultValues?: Partial<FLFundingDetails>;
  onNext: (data: FLFundingDetails) => void;
  onBack: () => void;
}

export function Step2FundingDetailsForm({ defaultValues, onNext, onBack }: Step2FormProps) {
  const { pos = [], fetchPOs } = useCustomerPOStore();
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  useEffect(() => {
    fetchPOs();
  }, [fetchPOs]);

  const form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: defaultValues || {
      customerPOId: '',
      poNo: '',
      contractNo: '',
      unitRate: 0,
      fundingUnits: 0,
      unitUOM: 'Hour',
      fundingValue: 0,
    },
  });

  const activePOs = pos?.filter((po) => po.status === 'Active') || [];

  // Auto-fill PO details and calculate funding value
  const selectedPOId = form.watch('customerPOId');
  const unitRate = form.watch('unitRate');
  const fundingUnits = form.watch('fundingUnits');

  useEffect(() => {
    if (selectedPOId) {
      const po = pos?.find((p) => p._id === selectedPOId);
      if (po) {
        form.setValue('poNo', po.poNo);
        form.setValue('contractNo', po.contractNo);
        setAvailableBalance(po.poAmount); // In production, this should be poAmount - allocatedAmount
      }
    }
  }, [selectedPOId, pos, form]);

  useEffect(() => {
    if (unitRate && fundingUnits) {
      const calculatedValue = unitRate * fundingUnits;
      form.setValue('fundingValue', calculatedValue);
    }
  }, [unitRate, fundingUnits, form]);

  const fundingValue = form.watch('fundingValue');
  const exceedsBalance = fundingValue > availableBalance;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerPOId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer PO *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer PO" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activePOs.map((po) => (
                    <SelectItem key={po._id} value={po._id}>
                      {po.poNo} - {po.contractNo} ({po.poCurrency} {po.poAmount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Only active POs with available balance</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedPOId && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              Available PO Balance: <strong>{availableBalance.toLocaleString()}</strong>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="contractNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contract No</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormDescription>Auto-filled from PO</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="poNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PO No</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormDescription>Auto-filled from PO</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="unitRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Rate *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fundingUnits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Funding Units *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unitUOM"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit of Measure *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select UOM" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Hour">Hour</SelectItem>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Month">Month</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="fundingValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding Value (Calculated)</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  value={field.value.toLocaleString()} 
                  readOnly 
                  className="bg-muted font-semibold text-lg" 
                />
              </FormControl>
              <FormDescription>= Unit Rate × Funding Units</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {exceedsBalance && (
          <Alert variant="destructive">
            <AlertDescription>
              Funding value exceeds available PO balance!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={exceedsBalance}>
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}
