import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Stepper } from '@/components/ui/stepper';
import { Step1BasicDetailsForm } from './Step1BasicDetailsForm';
import { Step2FundingDetailsForm } from './Step2FundingDetailsForm';
import { Step3RevenuePlanningForm } from './Step3RevenuePlanningForm';
import { Step4PaymentMilestonesForm } from './Step4PaymentMilestonesForm';
import { useFinancialLineStore } from '@/store/financialLineStore';
import { useToast } from '@/hooks/use-toast';
import type {
  FLBasicDetails,
  FLFundingDetails,
  FLRevenuePlanning,
  FLPaymentMilestones,
  FinancialLineFormData,
} from '@/types/financialLine';

interface CreateFLWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const steps = [
  { id: 1, title: 'Basic Details', description: 'FL information' },
  { id: 2, title: 'Funding', description: 'PO and rates' },
  { id: 3, title: 'Revenue Planning', description: 'Monthly breakdown' },
  { id: 4, title: 'Milestones', description: 'Payment schedule' },
];

export function CreateFLWizard({ open, onOpenChange, onSuccess }: CreateFLWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FinancialLineFormData>>({});
  const { createFL } = useFinancialLineStore();
  const { toast } = useToast();

  const handleStep1Next = (data: FLBasicDetails) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(2);
  };

  const handleStep2Next = (data: FLFundingDetails) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(3);
  };

  const handleStep3Next = (data: FLRevenuePlanning) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(4);
  };

  const handleStep4Submit = async (data: FLPaymentMilestones) => {
    const completeData: FinancialLineFormData = {
      ...formData,
      ...data,
      status: 'Draft',
    } as FinancialLineFormData;

    try {
      await createFL(completeData);
      toast({
        title: 'Success',
        description: 'Financial line created successfully',
      });
      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({});
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Financial Line</SheetTitle>
          <SheetDescription>
            Follow the steps to create a new financial line with revenue planning and milestones.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        <div className="mt-6">
          {currentStep === 1 && (
            <Step1BasicDetailsForm
              defaultValues={formData}
              onNext={handleStep1Next}
              onCancel={handleClose}
            />
          )}

          {currentStep === 2 && (
            <Step2FundingDetailsForm
              defaultValues={formData}
              onNext={handleStep2Next}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3RevenuePlanningForm
              scheduleStart={formData.scheduleStart || ''}
              scheduleEnd={formData.scheduleEnd || ''}
              unitRate={formData.unitRate || 0}
              fundingValue={formData.fundingValue || 0}
              defaultValues={formData}
              onNext={handleStep3Next}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4PaymentMilestonesForm
              fundingValue={formData.fundingValue || 0}
              defaultValues={formData}
              onSubmit={handleStep4Submit}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
