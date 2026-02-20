import { useEffect, useState, useMemo } from "react";
import { useUDAConfigurationStore } from "@/store/udaConfigurationStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Settings2 } from "lucide-react";
import { UDAConfigurationTable } from "./components/UDAConfigurationTable";
import { CreateUDAConfigurationDialog } from "./components/CreateUDAConfigurationDialog";
import type { UDAConfigurationFilters } from "@/types/udaConfiguration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function UDAConfigurationPage() {
  const { configurations, isLoading, fetchConfigurations } =
    useUDAConfigurationStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<UDAConfigurationFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique types dynamically from configurations
  const uniqueTypes = useMemo(() => {
    const types = configurations.map((c) => c.type);
    return Array.from(new Set(types)).sort();
  }, [configurations]);

  useEffect(() => {
    fetchConfigurations(filters);
  }, [fetchConfigurations, filters]);

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchQuery }));
  };

  const handleFilterChange = (
    key: keyof UDAConfigurationFilters,
    value: string,
  ) => {
    if (value === "all") {
      const { [key]: _removed, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters((prev) => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Settings2 className="h-8 w-8 text-teal-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              UDA Configuration
            </h1>
            <p className="text-muted-foreground">
              Manage User Defined Attributes for Timesheet Management
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Add UDA
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter UDAs by active status, type, or search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by UDA number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={filters.active || "all"}
              onValueChange={(value) => handleFilterChange("active", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Active Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Y">Active</SelectItem>
                <SelectItem value="N">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(filters.active || filters.type || filters.search) && (
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

      {/* UDA Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle>All UDA Configurations</CardTitle>
          <CardDescription>
            {configurations.length} configuration
            {configurations.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UDAConfigurationTable
            configurations={configurations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create UDA Configuration Dialog */}
      <CreateUDAConfigurationDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
