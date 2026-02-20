import { useState, useMemo } from "react";
import type { UDAConfiguration } from "@/types/udaConfiguration";
import { useUDAConfigurationStore } from "@/store/udaConfigurationStore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge"; // Unused import removed
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { CreateUDAConfigurationDialog } from "./CreateUDAConfigurationDialog";

interface UDAConfigurationTableProps {
  configurations: UDAConfiguration[];
  isLoading: boolean;
}

export function UDAConfigurationTable({
  configurations,
  isLoading,
}: UDAConfigurationTableProps) {
  const { deleteConfiguration, fetchConfigurations } =
    useUDAConfigurationStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] =
    useState<UDAConfiguration | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(
    new Set(["Billable", "Non-Billable"]),
  );

  // Group configurations by type and sort in ascending order
  const groupedConfigurations = useMemo(() => {
    const sortByUDANumber = (a: UDAConfiguration, b: UDAConfiguration) => {
      return a.udaNumber.localeCompare(b.udaNumber, undefined, {
        numeric: true,
      });
    };

    const billable = configurations
      .filter((c) => c.type === "Billable")
      .sort(sortByUDANumber);
    const nonBillable = configurations
      .filter((c) => c.type === "Non-Billable")
      .sort(sortByUDANumber);
    return {
      Billable: billable,
      "Non-Billable": nonBillable,
    };
  }, [configurations]);

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const handleEdit = (configuration: UDAConfiguration) => {
    setSelectedConfiguration(configuration);
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedConfiguration?._id && !selectedConfiguration?.id) return;

    const id = selectedConfiguration._id || selectedConfiguration.id!;

    try {
      await deleteConfiguration(id);
      toast.success("UDA configuration deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedConfiguration(null);
      fetchConfigurations();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete UDA configuration";
      toast.error(message);
    }
  };

  const openDeleteDialog = (configuration: UDAConfiguration) => {
    setSelectedConfiguration(configuration);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">
          Loading UDA configurations...
        </div>
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">No UDA configurations found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first UDA configuration to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>UDA Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parent UDA</TableHead>
              <TableHead>Project Required</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Billable Section */}
            <TableRow
              className="bg-muted/50 hover:bg-muted cursor-pointer font-semibold"
              onClick={() => toggleType("Billable")}
            >
              <TableCell>
                {expandedTypes.has("Billable") ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </TableCell>
              <TableCell colSpan={7}>
                <div className="flex items-center gap-2">
                  <span>Billable</span>
                  <span className="ml-2">
                    {groupedConfigurations.Billable.length}
                  </span>
                </div>
              </TableCell>
            </TableRow>

            {/* Billable UDAs */}
            {expandedTypes.has("Billable") &&
              groupedConfigurations.Billable.map((config) => (
                <TableRow
                  key={config._id || config.id}
                  className="bg-background"
                >
                  <TableCell></TableCell>
                  <TableCell className="font-medium">
                    {config.udaNumber}
                  </TableCell>
                  <TableCell>{config.name}</TableCell>
                  <TableCell>{config.type}</TableCell>
                  <TableCell>{config.parentUDA || "-"}</TableCell>
                  <TableCell>{config.projectRequired}</TableCell>
                  <TableCell>
                    <span
                      className={
                        config.active === "Y"
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {config.active === "Y" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(config)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteDialog(config)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

            {/* Non-Billable Section */}
            <TableRow
              className="bg-muted/50 hover:bg-muted cursor-pointer font-semibold"
              onClick={() => toggleType("Non-Billable")}
            >
              <TableCell>
                {expandedTypes.has("Non-Billable") ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
              </TableCell>
              <TableCell colSpan={7}>
                <div className="flex items-center gap-2">
                  <span>Non-Billable</span>
                  <span className="ml-2">
                    {groupedConfigurations["Non-Billable"].length}
                  </span>
                </div>
              </TableCell>
            </TableRow>

            {/* Non-Billable UDAs */}
            {expandedTypes.has("Non-Billable") &&
              groupedConfigurations["Non-Billable"].map((config) => (
                <TableRow
                  key={config._id || config.id}
                  className="bg-background"
                >
                  <TableCell></TableCell>
                  <TableCell className="font-medium">
                    {config.udaNumber}
                  </TableCell>
                  <TableCell>{config.name}</TableCell>
                  <TableCell>{config.type}</TableCell>
                  <TableCell>{config.parentUDA || "-"}</TableCell>
                  <TableCell>{config.projectRequired}</TableCell>
                  <TableCell>
                    <span
                      className={
                        config.active === "Y"
                          ? "text-green-600"
                          : "text-gray-400"
                      }
                    >
                      {config.active === "Y" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(config)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => openDeleteDialog(config)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the UDA configuration "
              {selectedConfiguration?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateUDAConfigurationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        configuration={selectedConfiguration}
      />
    </>
  );
}
