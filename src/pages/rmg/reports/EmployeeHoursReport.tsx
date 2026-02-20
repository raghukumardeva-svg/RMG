import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Building2,
  Search,
  Loader2,
  Clock,
  DollarSign,
  Target,
  CheckCircle,
  AlertCircle,
  Activity,
  TrendingUp,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import employeeHoursReportService from "@/services/employeeHoursReportService";
import type {
  EmployeeHoursData,
  ReportSummary,
  ProjectOption,
  ReportFilters,
} from "@/services/employeeHoursReportService";
import { toast } from "sonner";

const EmployeeHoursReport: React.FC = () => {
  const { user } = useAuthStore();
  const userRole = user?.role || "EMPLOYEE";

  // State
  const [reportData, setReportData] = useState<EmployeeHoursData[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), "yyyy-MM"),
  );
  const [selectedProject, setSelectedProject] = useState<string>(
    userRole === "RMG" ? "" : "all",
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if user can see filters (RMG or Manager)
  const canSeeFilters = userRole === "RMG" || userRole === "MANAGER";

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load projects if user can see filters
        if (canSeeFilters) {
          const projectsData = await employeeHoursReportService.getProjects(
            userRole,
            user?.employeeId || user?.id,
          );
          setProjects(projectsData);

          // Load departments (only for RMG)
          if (userRole === "RMG") {
            const depsData = await employeeHoursReportService.getDepartments();
            setDepartments(depsData);
          }
        }

        // Load initial report (skip for RMG - they must select project first)
        if (userRole !== "RMG") {
          await loadReport();
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, []);

  // Reload report when department filter changes (if report already loaded)
  useEffect(() => {
    if (!isInitialLoad && reportData.length > 0) {
      loadReport();
    }
  }, [selectedDepartment]);

  // Load report data
  const loadReport = async () => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // Validation: RMG must select a project
    if (userRole === "RMG" && (!selectedProject || selectedProject === "all")) {
      toast.error("Please select a project to view the report");
      return;
    }

    setIsLoading(true);
    try {
      const filters: ReportFilters = {
        role: userRole as "EMPLOYEE" | "RMG" | "MANAGER",
        month: selectedMonth,
        employeeId:
          userRole === "EMPLOYEE" ? user.employeeId || user.id : undefined,
        managerId:
          userRole === "MANAGER" ? user.employeeId || user.id : undefined,
        projectId:
          selectedProject && selectedProject !== "all"
            ? selectedProject
            : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        department:
          selectedDepartment && selectedDepartment !== "all"
            ? selectedDepartment
            : undefined,
      };

      console.log(
        "[Employee Hours Report] Requesting report with filters:",
        filters,
      );

      const response = await employeeHoursReportService.getReport(filters);

      console.log("[Employee Hours Report] Response:", response);

      setReportData(response.employees);
      setSummary(response.summary);
      setCurrentPage(1); // Reset to first page on new data
    } catch (error: any) {
      console.error("Error loading report:", error);
      toast.error(error.response?.data?.message || "Failed to load report");
      setReportData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter data by search query
  const filteredData = reportData.filter(
    (emp) =>
      emp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Paginate data
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Export to CSV
  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Employee ID",
      "Employee Name",
      "Email",
      "Department",
      "Allocation Hours",
      "Actual Billable Hours",
      "Actual Non-Billable Hours",
      "Billable Approved Hours",
      "Non-Billable Approved Hours",
      "Actual Hours",
      "Approved Hours",
    ];

    const rows = reportData.map((emp) => [
      emp.employeeId,
      emp.employeeName,
      emp.email,
      emp.department,
      emp.allocationHours,
      emp.actualBillableHours,
      emp.actualNonBillableHours,
      emp.billableApprovedHours,
      emp.nonBillableApprovedHours,
      emp.actualHours,
      emp.approvedHours,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = globalThis.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employee_hours_report_${selectedMonth}.csv`;
    link.click();
    globalThis.URL.revokeObjectURL(url);

    toast.success("Report exported successfully");
  };

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Employee Hours Report
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === "EMPLOYEE"
              ? "View your monthly hours report"
              : "View employee hours report by month and project"}
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            {userRole === "RMG"
              ? "Select a project and month to view employee hours report"
              : "Select month and apply filters to view report"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Month Selector - Always visible */}
            <div className="space-y-2">
              <Label htmlFor="month">
                <Calendar className="h-4 w-4 inline mr-1" />
                Month *
              </Label>
              <Input
                id="month"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={format(new Date(), "yyyy-MM")}
              />
            </div>

            {/* Project Filter - Visible for RMG and Manager */}
            {canSeeFilters && (
              <div className="space-y-2">
                <Label htmlFor="project">
                  Project{" "}
                  {userRole === "RMG" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger id="project">
                    <SelectValue
                      placeholder={
                        userRole === "RMG" ? "Select Project *" : "All Projects"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole !== "RMG" && (
                      <SelectItem value="all">All Projects</SelectItem>
                    )}
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project.projectId}>
                        {project.projectCode} - {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Start Date - Visible for RMG and Manager */}
            {canSeeFilters && (
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            {/* End Date - Visible for RMG and Manager */}
            {canSeeFilters && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}

            {/* Department Filter - Visible only for RMG */}
            {userRole === "RMG" && (
              <div className="space-y-2">
                <Label htmlFor="department">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  Department
                </Label>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={loadReport} disabled={isLoading} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
            {(selectedProject !== "all" ||
              startDate ||
              endDate ||
              selectedDepartment !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProject(userRole === "RMG" ? "" : "all");
                  setStartDate("");
                  setEndDate("");
                  setSelectedDepartment("all");
                  setSearchQuery("");
                  setReportData([]);
                  setSummary(null);
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Allocation Hours
                      </p>
                      <p className="text-3xl font-bold mt-2">
                        {summary.totalAllocationHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Actual Billable
                      </p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">
                        {summary.totalActualBillableHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Actual Non-Billable
                      </p>
                      <p className="text-3xl font-bold text-orange-600 mt-2">
                        {summary.totalActualNonBillableHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Billable Approved
                      </p>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {summary.totalBillableApprovedHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Non-Billable Approved
                      </p>
                      <p className="text-3xl font-bold text-emerald-600 mt-2">
                        {summary.totalNonBillableApprovedHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Pending Approved
                      </p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">
                        {summary.totalPendingApprovedHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Actual
                      </p>
                      <p className="text-3xl font-bold text-indigo-600 mt-2">
                        {summary.totalActualHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Approved
                      </p>
                      <p className="text-3xl font-bold text-teal-600 mt-2">
                        {summary.totalApprovedHours}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-teal-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar - Only show for RMG/Manager */}
      {canSeeFilters && reportData.length > 0 && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Badge variant="outline">{filteredData.length} employees</Badge>
        </div>
      )}

      {/* Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Report</CardTitle>
          <CardDescription>
            Month: {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && reportData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {userRole === "RMG" &&
                (!selectedProject || selectedProject === "all")
                  ? "Please select a project"
                  : "No data available"}
              </h3>
              <p className="text-muted-foreground">
                {userRole === "RMG" &&
                (!selectedProject || selectedProject === "all")
                  ? "Select a project from the filter above and click Generate Report to view employee hours data"
                  : "No hours data found for the selected criteria"}
              </p>
            </div>
          )}

          {!isLoading &&
            reportData.length > 0 &&
            paginatedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </div>
            )}

          {!isLoading && paginatedData.length > 0 && (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table className="whitespace-nowrap">
                  <TableHeader>
                    <TableRow>
                      {canSeeFilters && (
                        <>
                          <TableHead>Employee ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                        </>
                      )}
                      <TableHead className="text-right">Allocation</TableHead>
                      <TableHead className="text-right">
                        Actual Billable
                      </TableHead>
                      <TableHead className="text-right">
                        Actual Non-Billable
                      </TableHead>
                      <TableHead className="text-right">
                        Billable Approved
                      </TableHead>
                      <TableHead className="text-right">
                        Non-Billable Approved
                      </TableHead>
                      <TableHead className="text-right">Actual Hours</TableHead>
                      <TableHead className="text-right">
                        Approved Hours
                      </TableHead>
                      <TableHead className="text-right">
                        Pending Approved
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((emp) => (
                      <TableRow key={emp.employeeId}>
                        {canSeeFilters && (
                          <>
                            <TableCell className="font-mono text-sm whitespace-nowrap">
                              {emp.employeeId}
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">
                              {emp.employeeName}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {emp.department || "-"}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right whitespace-nowrap">
                          {emp.allocationHours}
                        </TableCell>
                        <TableCell className="text-right text-blue-600 font-semibold whitespace-nowrap">
                          {emp.actualBillableHours}
                        </TableCell>
                        <TableCell className="text-right text-orange-600 font-semibold whitespace-nowrap">
                          {emp.actualNonBillableHours}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold whitespace-nowrap">
                          {emp.billableApprovedHours}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 font-semibold whitespace-nowrap">
                          {emp.nonBillableApprovedHours}
                        </TableCell>
                        <TableCell className="text-right text-indigo-600 font-bold whitespace-nowrap">
                          {emp.actualHours}
                        </TableCell>
                        <TableCell className="text-right text-teal-600 font-bold whitespace-nowrap">
                          {emp.approvedHours}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600 font-bold whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <span>{emp.pendingApprovedHours}</span>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  type="button"
                                  className="p-1 rounded hover:bg-yellow-50 text-yellow-600"
                                  aria-label="View pending details"
                                >
                                  <Info className="h-4 w-4" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72">
                                <div className="text-sm font-semibold mb-2">
                                  Pending details
                                </div>
                                {emp.pendingDetails &&
                                emp.pendingDetails.length > 0 ? (
                                  <div className="space-y-3 max-h-60 overflow-auto">
                                    {emp.pendingDetails.map((item, index) => (
                                      <div
                                        key={`${emp.employeeId}-${index}`}
                                        className="text-xs"
                                      >
                                        <div className="font-semibold text-slate-700">
                                          {format(
                                            new Date(item.date),
                                            "dd MMM yyyy",
                                          )}
                                        </div>
                                        <div className="text-slate-500">
                                          {item.projectName} ({item.projectId})
                                        </div>
                                        <div className="text-slate-500">
                                          Manager: {item.projectManagerName}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500">
                                    No pending entries
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, filteredData.length)}{" "}
                    of {filteredData.length} employees
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeHoursReport;
