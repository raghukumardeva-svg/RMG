import { useEffect, useState } from "react";
import { useUDAConfigurationStore } from "@/store/udaConfigurationStore";
import type { UDAConfigurationFormData } from "@/types/udaConfiguration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UDAConfigurationFormProps {
  onSubmit: (data: UDAConfigurationFormData) => Promise<void>;
  defaultValues?: Partial<UDAConfigurationFormData>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function UDAConfigurationForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  submitLabel = "Create UDA",
}: UDAConfigurationFormProps) {
  const { configurations } = useUDAConfigurationStore();

  // Auto-generate next UDA number
  const generateNextUDANumber = () => {
    if (defaultValues?.udaNumber) {
      return defaultValues.udaNumber; // Keep existing number when editing
    }

    if (configurations.length === 0) {
      return "UDA00001";
    }

    // Extract numbers from existing UDA numbers and find the max
    const numbers = configurations
      .map((c) => {
        const match = c.udaNumber.match(/UDA(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    const maxNumber = Math.max(...numbers, 0);
    const nextNumber = maxNumber + 1;
    return `UDA${String(nextNumber).padStart(5, "0")}`;
  };

  const [formData, setFormData] = useState<UDAConfigurationFormData>({
    udaNumber: generateNextUDANumber(),
    name: defaultValues?.name || "",
    description: defaultValues?.description || "",
    parentUDA: defaultValues?.parentUDA || "",
    type: defaultValues?.type || "Billable",
    billable: defaultValues?.billable || "Billable",
    projectRequired: defaultValues?.projectRequired || "Y",
    active: defaultValues?.active || "Y",
  });

  useEffect(() => {
    if (defaultValues) {
      setFormData({
        udaNumber: defaultValues.udaNumber || generateNextUDANumber(),
        name: defaultValues.name || "",
        description: defaultValues.description || "",
        parentUDA: defaultValues.parentUDA || "",
        type: defaultValues.type || "Billable",
        billable: defaultValues.billable || "Billable",
        projectRequired: defaultValues.projectRequired || "Y",
        active: defaultValues.active || "Y",
      });
    } else {
      // Regenerate UDA number when opening for new entry
      setFormData((prev) => ({
        ...prev,
        udaNumber: generateNextUDANumber(),
      }));
    }
  }, [defaultValues, configurations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      {/* Row 1: UDA Number and Name */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="udaNumber">
            UDA Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="udaNumber"
            value={formData.udaNumber}
            readOnly
            className="bg-muted cursor-not-allowed"
            placeholder="Auto-generated"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Project Code"
            required
          />
        </div>
      </div>

      {/* Description (Full Width) */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Describe the purpose of this UDA..."
          rows={3}
          required
        />
      </div>

      {/* Row 2: Parent UDA and Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentUDA">Parent UDA</Label>
          <Input
            id="parentUDA"
            value={formData.parentUDA}
            onChange={(e) =>
              setFormData({ ...formData, parentUDA: e.target.value })
            }
            placeholder="Enter parent UDA (optional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">
            Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value) => {
              setFormData({
                ...formData,
                type: value,
                billable: value as "Billable" | "Non-Billable",
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Billable">Billable</SelectItem>
              <SelectItem value="Non-Billable">Non-Billable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 3: Project Required and Active */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectRequired">
            Project Required <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.projectRequired}
            onValueChange={(value: "Y" | "N") =>
              setFormData({ ...formData, projectRequired: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Is project required?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y">Yes</SelectItem>
              <SelectItem value="N">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="active">
            Active <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.active}
            onValueChange={(value: "Y" | "N") =>
              setFormData({ ...formData, active: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Y">Yes</SelectItem>
              <SelectItem value="N">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
        >
          {isLoading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
