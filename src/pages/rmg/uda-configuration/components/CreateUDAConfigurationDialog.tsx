import { useState } from "react";
import { useUDAConfigurationStore } from "@/store/udaConfigurationStore";
import type {
  UDAConfiguration,
  UDAConfigurationFormData,
} from "@/types/udaConfiguration";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UDAConfigurationForm } from "./UDAConfigurationForm";
import { toast } from "sonner";

interface CreateUDAConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration?: UDAConfiguration | null;
}

export function CreateUDAConfigurationDialog({
  open,
  onOpenChange,
  configuration,
}: CreateUDAConfigurationDialogProps) {
  const { createConfiguration, updateConfiguration } =
    useUDAConfigurationStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: UDAConfigurationFormData) => {
    setIsLoading(true);
    try {
      if (configuration) {
        const id = configuration._id || configuration.id!;
        await updateConfiguration(id, data);
        toast.success("UDA configuration updated successfully");
      } else {
        await createConfiguration(data);
        toast.success("UDA configuration created successfully");
      }
      onOpenChange(false);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        `Failed to ${configuration ? "update" : "create"} UDA configuration`;
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>
            {configuration ? "Edit" : "Create New"} UDA Configuration
          </SheetTitle>
          <SheetDescription>
            {configuration
              ? "Update the UDA configuration details below."
              : "Add a new User Defined Attribute for timesheet management."}{" "}
            Fields marked with * are required.
          </SheetDescription>
        </SheetHeader>
        <UDAConfigurationForm
          onSubmit={handleSubmit}
          defaultValues={
            configuration
              ? {
                  udaNumber: configuration.udaNumber,
                  name: configuration.name,
                  description: configuration.description,
                  parentUDA: configuration.parentUDA || "",
                  type: configuration.type,
                  billable: configuration.billable,
                  projectRequired: configuration.projectRequired,
                  active: configuration.active,
                }
              : undefined
          }
          isLoading={isLoading}
          submitLabel={configuration ? "Update UDA" : "Create UDA"}
        />
      </SheetContent>
    </Sheet>
  );
}
