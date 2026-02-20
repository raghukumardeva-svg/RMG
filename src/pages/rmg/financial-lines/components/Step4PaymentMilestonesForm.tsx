import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import type { FLPaymentMilestones } from '@/types/financialLine';

const step4Schema = z.object({
  paymentMilestones: z.array(
    z.object({
      milestoneName: z.string({ message: 'Milestone name is required' }).min(1, 'Milestone name is required'),
      milestoneAmount: z.coerce.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
      dueDate: z.string({ message: 'Due date is required' }).min(1, 'Due date is required'),
      status: z.enum(['Pending', 'Paid']),
    })
  ).min(1, 'At least one milestone is required'),
});

type Step4FormValues = z.infer<typeof step4Schema>;

interface Step4FormProps {
  fundingValue: number;
  defaultValues?: Partial<FLPaymentMilestones>;
  onSubmit: (data: FLPaymentMilestones) => void;
  onBack: () => void;
}

export function Step4PaymentMilestonesForm({
  fundingValue,
  defaultValues,
  onSubmit,
  onBack,
}: Step4FormProps) {
  const form = useForm<Step4FormValues>({
    resolver: zodResolver(step4Schema),
    defaultValues: defaultValues || {
      paymentMilestones: [
        {
          milestoneName: '',
          milestoneAmount: 0,
          dueDate: '',
          status: 'Pending',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'paymentMilestones',
  });

  const milestones = form.watch('paymentMilestones');
  const totalMilestoneAmount = milestones.reduce(
    (sum, m) => sum + (parseFloat(String(m.milestoneAmount)) || 0),
    0
  );

  const mismatch = Math.abs(totalMilestoneAmount - fundingValue) > 0.01;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Alert>
          <AlertDescription>
            <div className="flex justify-between">
              <span>Funding Value: <strong>{fundingValue.toLocaleString()}</strong></span>
              <span>Total Milestones: <strong className={mismatch ? 'text-destructive' : 'text-green-600'}>{totalMilestoneAmount.toLocaleString()}</strong></span>
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Milestone {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <FormField
                control={form.control}
                name={`paymentMilestones.${index}.milestoneName`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Initial Payment, Final Payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`paymentMilestones.${index}.milestoneAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`paymentMilestones.${index}.dueDate`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`paymentMilestones.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              milestoneName: '',
              milestoneAmount: 0,
              dueDate: '',
              status: 'Pending',
            })
          }
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Milestone
        </Button>

        {mismatch && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sum of milestone amounts must equal funding value!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" disabled={mismatch}>
            Create Financial Line
          </Button>
        </div>
      </form>
    </Form>
  );
}
