import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ProjectFormData } from '@/types/project';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const projectSchema = z.object({
  projectId: z.string().optional(),
  projectName: z.string({ message: 'Project name is required' }).min(1, 'Project name is required').max(100, 'Max 100 characters'),
  projectDescription: z.string().optional().or(z.literal('')),
  accountName: z.string({ message: 'Account name is required' }).min(1, 'Account name is required'),
  hubspotDealId: z.string().optional().or(z.literal('')),
  legalEntity: z.string({ message: 'Legal entity is required' }).min(1, 'Legal entity is required'),
  projectManager: z.string({ message: 'Project manager is required' }).min(1, 'Project manager is required'),
  deliveryManager: z.string({ message: 'Delivery manager is required' }).min(1, 'Delivery manager is required'),
  dealOwner: z.string({ message: 'Deal owner is required' }).min(1, 'Deal owner is required'),
  billingType: z.enum(['T&M', 'Fixed Bid', 'Fixed Monthly', 'License'], { message: 'Billing type is required' }),
  practiceUnit: z.enum(['AiB & Automation', 'GenAI', 'Data & Analytics', 'Cloud Engineering', 'Other'], { message: 'Practice unit is required' }),
  region: z.enum(['UK', 'India', 'USA', 'ME', 'Other'], { message: 'Region is required' }),
  industry: z.string({ message: 'Industry is required' }).min(1, 'Industry is required'),
  regionHead: z.string({ message: 'Region head is required' }).min(1, 'Region head is required'),
  leadSource: z.string({ message: 'Lead source is required' }).min(1, 'Lead source is required'),
  revenueType: z.string({ message: 'Revenue type is required' }).min(1, 'Revenue type is required'),
  clientType: z.string({ message: 'Client type is required' }).min(1, 'Client type is required'),
  projectWonThroughRFP: z.boolean().default(false),
  projectStartDate: z.string({ message: 'Start date is required' }).min(1, 'Start date is required'),
  projectEndDate: z.string({ message: 'End date is required' }).min(1, 'End date is required'),
  projectCurrency: z.enum(['USD', 'GBP', 'INR', 'EUR', 'AED'], { message: 'Currency is required' }),
});

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  defaultValues?: Partial<ProjectFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  onSubmit,
  defaultValues,
  isLoading,
  submitLabel = 'Create Project',
}: ProjectFormProps) {
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectId: '',
      projectName: '',
      projectDescription: '',
      accountName: '',
      hubspotDealId: '',
      legalEntity: '',
      projectManager: '',
      deliveryManager: '',
      dealOwner: '',
      billingType: 'T&M' as const,
      practiceUnit: 'Other' as const,
      region: 'Other' as const,
      industry: '',
      regionHead: '',
      leadSource: '',
      revenueType: '',
      clientType: '',
      projectWonThroughRFP: false,
      projectStartDate: '',
      projectEndDate: '',
      projectCurrency: 'USD' as const,
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: any) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="schedule">Schedule & Status</TabsTrigger>
          </TabsList>

          {/* Tab 1: Basic Details */}
          <TabsContent value="basic" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project ID */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated" {...field} disabled />
                    </FormControl>
                    <FormDescription className="text-xs">Auto-generated upon creation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Name */}
              <FormField
                control={form.control}
                name="projectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Description - Full Width */}
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="projectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of the project" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Account Name */}
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* HubSpot Deal ID */}
              <FormField
                control={form.control}
                name="hubspotDealId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HubSpot Deal ID</FormLabel>
                    <FormControl>
                      <Input placeholder="DEAL-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Legal Entity */}
              <FormField
                control={form.control}
                name="legalEntity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Entity *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter legal entity" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Manager */}
              <FormField
                control={form.control}
                name="projectManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Manager *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project manager name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Delivery Manager */}
              <FormField
                control={form.control}
                name="deliveryManager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Manager *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter delivery manager name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Deal Owner */}
              <FormField
                control={form.control}
                name="dealOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Owner *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter deal owner name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Type */}
              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="T&M">Time & Material</SelectItem>
                        <SelectItem value="Fixed Bid">Fixed Bid</SelectItem>
                        <SelectItem value="Fixed Monthly">Fixed Monthly</SelectItem>
                        <SelectItem value="License">License</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Practice Unit */}
              <FormField
                control={form.control}
                name="practiceUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Unit *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select practice unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AiB & Automation">AiB & Automation</SelectItem>
                        <SelectItem value="GenAI">GenAI</SelectItem>
                        <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                        <SelectItem value="Cloud Engineering">Cloud Engineering</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
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

              {/* Industry */}
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter industry" {...field} />
                    </FormControl>
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
                    <FormLabel>Region Head *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter region head name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lead Source */}
              <FormField
                control={form.control}
                name="leadSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lead Source *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lead source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revenue Type */}
              <FormField
                control={form.control}
                name="revenueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue Type *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter revenue type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Type */}
              <FormField
                control={form.control}
                name="clientType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter client type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Project Won Through RFP */}
              <FormField
                control={form.control}
                name="projectWonThroughRFP"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Project Won Through RFP *</FormLabel>
                      <FormDescription className="text-xs">
                        Was this project won through an RFP process?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 cursor-pointer"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* Tab 2: Schedule & Status */}
          <TabsContent value="schedule" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="projectStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="projectEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project End Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currency */}
              <FormField
                control={form.control}
                name="projectCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Currency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
