import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { CTCDrawer } from "./components/CTCDrawer";
import type { CTCMaster, CTCFilters } from "@/types/ctc";
import ctcService from "@/services/ctcService";
import { toast } from "sonner";

export function CTCMasterPage() {
  const [ctcRecords, setCtcRecords] = useState<CTCMaster[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<CTCFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [selectedRecord, setSelectedRecord] = useState<CTCMaster | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<CTCMaster | null>(null);

  useEffect(() => {
    fetchCTCRecords();
  }, [filters]);

  const fetchCTCRecords = async () => {
    setIsLoading(true);
    try {
      const data = await ctcService.getAllCTC(filters);
      setCtcRecords(data);
    } catch (error) {
      console.error("Error fetching CTC records:", error);
      toast.error("Failed to load CTC records");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  };

  const handleFilterChange = (key: keyof CTCFilters, value: string) => {
    if (value === "all") {
      const { [key]: _removed, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleAddCTC = () => {
    setDrawerMode("add");
    setSelectedRecord(null);
    setDrawerOpen(true);
  };

  const handleEditCTC = (record: CTCMaster) => {
    setDrawerMode("edit");
    setSelectedRecord(record);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (record: CTCMaster) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    const id = recordToDelete._id || recordToDelete.id!;
    try {
      await ctcService.deleteCTC(id);
      toast.success("CTC record deleted successfully");
      fetchCTCRecords();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete CTC record";
      toast.error(message);
    } finally {
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CTC Master</h1>
          <p className="text-muted-foreground">
            Manage employee CTC records and history
          </p>
        </div>
        <Button onClick={handleAddCTC}>
          <Plus className="mr-2 h-4 w-4" />
          Add CTC
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter CTC records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by employee ID or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Currency Filter */}
            <Select
              value={filters.currency || "all"}
              onValueChange={(value) => handleFilterChange("currency", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filters.currency || filters.search) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setFilters({});
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CTC Table */}
      <Card>
        <CardHeader>
          <CardTitle>All CTC Records</CardTitle>
          <CardDescription>
            {ctcRecords.length} record{ctcRecords.length === 1 ? "" : "s"} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading CTC records...
              </div>
            </div>
          )}
          {!isLoading && ctcRecords.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground">No CTC records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first CTC record to get started
              </p>
            </div>
          )}
          {!isLoading && ctcRecords.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Latest Annual CTC</TableHead>
                    <TableHead>Latest Planned CTC</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ctcRecords.map((record) => (
                    <TableRow key={record._id || record.id}>
                      <TableCell className="font-medium">
                        {record.employeeId}
                      </TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.employeeEmail}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          record.latestAnnualCTC,
                          record.latestActualCurrency,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          record.latestPlannedCTC,
                          record.currency,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.currency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.uom}</Badge>
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
                            <DropdownMenuItem
                              onClick={() => handleEditCTC(record)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(record)}
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
          )}
        </CardContent>
      </Card>

      {/* CTC Drawer */}
      <CTCDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
        ctcRecord={selectedRecord}
        onSuccess={fetchCTCRecords}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the CTC record for{" "}
              {recordToDelete?.employeeName}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
