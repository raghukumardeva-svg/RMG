import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmployeeSearch } from "./EmployeeSearch";
import { CTCHistoryTable } from "./CTCHistoryTable";
import type {
  CTCMaster,
  CTCFormData,
  CTCHistory,
  EmployeeSearchResult,
} from "@/types/ctc";
import { toast } from "sonner";
import ctcService from "@/services/ctcService";

const ctcFormSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  employeeName: z.string().min(1, "Employee name is required"),
  employeeEmail: z
    .string()
    .min(1, "Email is required")
    .refine((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Invalid email",
    }),
  latestAnnualCTC: z.number().min(0, "Must be a positive number"),
  latestActualCurrency: z.enum(["INR", "USD"]),
  latestActualUOM: z.enum(["Annual", "Monthly"]),
  latestPlannedCTC: z.number().min(0, "Must be a positive number"),
  currency: z.enum(["INR", "USD"]),
  uom: z.enum(["Annual", "Monthly"]),
});

interface CTCDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode: "add" | "edit";
  readonly ctcRecord?: CTCMaster | null;
  readonly onSuccess: () => void;
}

export function CTCDrawer({
  open,
  onOpenChange,
  mode,
  ctcRecord,
  onSuccess,
}: CTCDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ctcHistory, setCtcHistory] = useState<CTCHistory[]>([]);

  const form = useForm<CTCFormData>({
    resolver: zodResolver(ctcFormSchema),
    defaultValues: {
      employeeId: "",
      employeeName: "",
      employeeEmail: "",
      latestAnnualCTC: 0,
      latestActualCurrency: "INR",
      latestActualUOM: "Annual",
      latestPlannedCTC: 0,
      currency: "INR",
      uom: "Annual",
    },
  });

  useEffect(() => {
    if (mode === "edit" && ctcRecord) {
      form.reset({
        employeeId: ctcRecord.employeeId,
        employeeName: ctcRecord.employeeName,
        employeeEmail: ctcRecord.employeeEmail,
        latestAnnualCTC: ctcRecord.latestAnnualCTC,
        latestActualCurrency: ctcRecord.latestActualCurrency,
        latestActualUOM: ctcRecord.latestActualUOM,
        latestPlannedCTC: ctcRecord.latestPlannedCTC,
        currency: ctcRecord.currency,
        uom: ctcRecord.uom,
      });
      setCtcHistory(ctcRecord.ctcHistory || []);
    } else {
      form.reset({
        employeeId: "",
        employeeName: "",
        employeeEmail: "",
        latestAnnualCTC: 0,
        latestActualCurrency: "INR",
        latestActualUOM: "Annual",
        latestPlannedCTC: 0,
        currency: "INR",
        uom: "Annual",
      });
      setCtcHistory([]);
    }
  }, [mode, ctcRecord, form, open]);

  const handleEmployeeSelect = (employee: EmployeeSearchResult | null) => {
    if (employee) {
      form.setValue("employeeId", employee.employeeId);
      form.setValue("employeeName", employee.name);
      form.setValue("employeeEmail", employee.email);
    } else {
      form.setValue("employeeId", "");
      form.setValue("employeeName", "");
      form.setValue("employeeEmail", "");
    }
  };

  const onSubmit = async (data: CTCFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        ctcHistory: mode === "edit" ? ctcHistory : undefined,
      };

      if (mode === "add") {
        await ctcService.createCTC(payload);
        toast.success("CTC record created successfully");
      } else if (mode === "edit" && ctcRecord) {
        const id = ctcRecord._id || ctcRecord.id!;
        await ctcService.updateCTC(id, payload);
        toast.success("CTC record updated successfully");
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
      setCtcHistory([]);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to save CTC record";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setCtcHistory([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>
                {mode === "add" ? "Add CTC Record" : "Edit CTC Record"}
              </SheetTitle>
              <SheetDescription>
                {mode === "add"
                  ? "Create a new CTC record for an employee"
                  : "Update CTC record and manage history"}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            {/* Employee Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Employee Details</h3>
              <Separator />

              {/* Employee Search */}
              <FormField
                control={form.control}
                name="employeeId"
                render={() => (
                  <FormItem>
                    <FormLabel>Employee Number *</FormLabel>
                    <FormControl>
                      <EmployeeSearch
                        value={form.watch("employeeId")}
                        onSelect={handleEmployeeSelect}
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee Name (Auto-filled) */}
              <FormField
                control={form.control}
                name="employeeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Employee Email (Auto-filled) */}
              <FormField
                control={form.control}
                name="employeeEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* CTC Input Fields - Only visible in ADD mode */}
            {mode === "add" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">CTC Information</h3>
                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Latest Annual CTC */}
                  <FormField
                    control={form.control}
                    name="latestAnnualCTC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latest Annual CTC *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Latest Actual Currency */}
                  <FormField
                    control={form.control}
                    name="latestActualCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latest Actual Currency *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Latest Actual UOM */}
                  <FormField
                    control={form.control}
                    name="latestActualUOM"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latest Actual UOM *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Annual">Annual</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Latest Planned CTC */}
                  <FormField
                    control={form.control}
                    name="latestPlannedCTC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latest Planned CTC *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* UOM */}
                  <FormField
                    control={form.control}
                    name="uom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UOM *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Annual">Annual</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* CTC History Table - Only visible in EDIT mode */}
            {mode === "edit" && (
              <div className="space-y-4">
                <Separator />
                <CTCHistoryTable
                  history={ctcHistory}
                  onChange={setCtcHistory}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
