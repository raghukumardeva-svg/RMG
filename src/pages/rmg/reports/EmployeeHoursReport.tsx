import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Search,
  Loader2,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import WeeklyTimesheet from "@/pages/rmg/uda-configuration/WeeklyTimesheet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import {
  format,
  isAfter,
  isBefore,
  addDays,
  startOfToday,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  isSameWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subYears,
  eachDayOfInterval,
  getDay,
} from "date-fns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import employeeHoursReportService from "@/services/employeeHoursReportService";
import type {
  EmployeeHoursData,
  ReportSummary,
  ProjectOption,
  ReportFilters,
} from "@/services/employeeHoursReportService";
import { flResourceService } from "@/services/flResourceService";
import { projectService } from "@/services/projectService";
import { toast } from "sonner";
// Chart colors
const CHART_COLORS = {
  blue: "#3B82F6",
  blueLight: "#93C5FD",
  green: "#10B981",
  red: "#EF4444",
  yellow: "#F59E0B",
  orange: "#F97316",
  emerald: "#10B981",
  purple: "#8B5CF6",
  indigo: "#6366F1",
  teal: "#14B8A6",
  slate: "#64748B",
  slateLight: "#94A3B8",
  gray: "#9CA3AF",
  ash: "#D1D5DB",
};

/**
 * Helper: Project Color Palette Generator
 */
const generateProjectColor = (projectName: string) => {
  const hash = projectName
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 70%, 50%)`;
};

/**
 * Helper: Date logic to highlight projects ending next week
 */
const isEndingSoon = (endDateStr: string) => {
  try {
    const end = new Date(endDateStr);
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    return isAfter(end, today) && isBefore(end, nextWeek);
  } catch (e) {
    return false;
  }
};

/**
 * Redesigned Chart Components
 */

// 1. KPI 1: Allocation Summary - Semi-Circle Gauge (Half-Donut)
const AllocationSummaryChart: React.FC<{
  data: any[];
  employeeCount: number;
  allocatedCount: number;
  benchCount: number;
  averageProjects?: string;
}> = ({ data }) => {
  // Calculate total allocation percentage (excluding Bench)
  const allocatedPercentage = data
    .filter((item) => item.name !== "Bench")
    .reduce((acc, curr) => acc + curr.value, 0);

  const roundedAllocation = Math.round(allocatedPercentage);

  // Create simplified data: allocated vs unallocated
  const simplifiedData = [
    {
      name: "Allocated",
      value: roundedAllocation,
      color: "#6366f1", // Indigo color for allocated
    },
    {
      name: "Unallocated",
      value: Math.max(0, 100 - roundedAllocation),
      color: "#e2e8f0", // Light gray for unallocated
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-2">
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={simplifiedData}
              cx="50%"
              cy="85%"
              innerRadius={60}
              outerRadius={90}
              startAngle={180}
              endAngle={0}
              paddingAngle={0}
              dataKey="value"
              label={false}
              labelLine={false}
            >
              {simplifiedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-bold text-slate-800 leading-none">
            {roundedAllocation}%
          </span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">
            Allocated
          </span>
        </div>
      </div>
    </div>
  );
};

// 2. Multi-Project Allocation Component (Horizontal Bar)
const MultiProjectAllocationChart: React.FC<{ data: any[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height={Math.max(180, data.length * 45)}>
    <BarChart
      data={data}
      layout="vertical"
      margin={{ top: 10, right: 60, bottom: 10, left: 100 }}
      barGap={2}
      barCategoryGap={8}
    >
      <CartesianGrid
        strokeDasharray="3 3"
        horizontal={false}
        stroke="#f1f5f9"
      />
      <XAxis type="number" hide />
      <YAxis
        dataKey="projectName"
        type="category"
        width={90}
        fontSize={11}
        axisLine={false}
        tickLine={false}
      />
      <Tooltip
        content={({ active, payload }) => {
          if (active && payload && payload.length) {
            const item = payload[0].payload;
            const warning = isEndingSoon(item.endDate);
            return (
              <div
                className={`p-4 rounded-xl shadow-xl border-none ${warning ? "bg-orange-50" : "bg-white"}`}
              >
                <p className="font-bold text-slate-800 text-sm">
                  {item.projectName}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Allocation:{" "}
                  <b>
                    {item.percentage
                      ? `${item.percentage.toFixed(1)}%`
                      : `${item.hours}h`}
                  </b>
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(item.startDate), "MMM dd")} -{" "}
                  {format(new Date(item.endDate), "MMM dd, yyyy")}
                </p>
                {warning && (
                  <p className="text-[10px] font-bold text-orange-600 mt-2 uppercase">
                    ⚠️ Ending next week
                  </p>
                )}
              </div>
            );
          }
          return null;
        }}
      />
      <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={20}>
        {data.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={
              isEndingSoon(entry.endDate)
                ? CHART_COLORS.orange
                : entry.color || generateProjectColor(entry.projectName)
            }
            fillOpacity={isEndingSoon(entry.endDate) ? 1 : 0.8}
          />
        ))}
        <LabelList
          dataKey="percentage"
          position="right"
          formatter={(value: number) => `${value.toFixed(1)}%`}
          style={{ fontSize: 10, fill: "#64748b", fontWeight: 600 }}
        />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

// 2b. Monthly Daily Allocation Progress Bar (Day-by-Day Multi-Segment)
const MonthlyDailyAllocationChart: React.FC<{
  dailyData: any[];
}> = ({ dailyData }) => {
  if (!dailyData || dailyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No allocation data available for the selected month
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month day labels */}
      <div className="flex justify-between text-[10px] text-slate-500 px-1">
        <span>Day 1</span>
        <span>Day {Math.ceil(dailyData.length / 2)}</span>
        <span>Day {dailyData.length}</span>
      </div>

      {/* Multi-segment progress bar */}
      <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden flex">
        {dailyData.map((day, index) => {
          const segmentWidth = `${100 / dailyData.length}%`;

          return (
            <div
              key={index}
              className="relative group cursor-pointer transition-all hover:brightness-110"
              style={{
                width: segmentWidth,
                backgroundColor: day.color,
                borderRight:
                  index < dailyData.length - 1
                    ? "1px solid rgba(255,255,255,0.2)"
                    : "none",
              }}
              title={`${day.date}: ${day.projectName || "Bench"}`}
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                  <div className="font-semibold">
                    {format(new Date(day.date), "MMM dd, yyyy")}
                  </div>
                  {day.projectName && day.projectName !== "Bench" ? (
                    <>
                      <div className="mt-1 text-slate-300">
                        Project: {day.projectName}
                      </div>
                      {day.allocationStart && (
                        <div className="text-slate-400 text-[10px] mt-1">
                          {format(new Date(day.allocationStart), "MMM dd")} -{" "}
                          {format(new Date(day.allocationEnd), "MMM dd, yyyy")}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mt-1 text-slate-300">Status: Bench</div>
                  )}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-slate-300"></div>
          <span className="text-slate-600">Before Allocation</span>
        </div>
        {dailyData
          .filter(
            (day, index, self) =>
              day.projectName &&
              day.projectName !== "Bench" &&
              self.findIndex((d) => d.projectName === day.projectName) ===
                index,
          )
          .map((day, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: day.color }}
              ></div>
              <span className="text-slate-600">{day.projectName}</span>
            </div>
          ))}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-400"></div>
          <span className="text-slate-600">Bench</span>
        </div>
      </div>
    </div>
  );
};

// 3. Approval Status Doughnut Component
const ApprovalStatusDoughnut: React.FC<{
  data: any[];
  reportData?: EmployeeHoursData[];
  userRole?: string;
}> = ({ data, reportData = [], userRole }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  // Group employees by status for tooltip
  const getEmployeesForStatus = (statusName: string) => {
    if (!reportData || reportData.length === 0) return [];

    return reportData.filter((emp) => {
      const notSubmitted = Math.max(0, emp.allocationHours - emp.actualHours);

      switch (statusName) {
        case "Approved":
          return emp.approvedHours > 0;
        case "Pending for Approval":
          return emp.pendingApprovedHours > 0;
        case "Revision Requested":
          return (emp.revisionRequestedHours || 0) > 0;
        case "Rejected":
          return (emp.rejectedHours || 0) > 0;
        case "Not Submitted":
          return notSubmitted > 0;
        default:
          return false;
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent, value }) =>
                `${(percent * 100).toFixed(0)}% (${value}h)`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;

                const data = payload[0];
                const statusName = data.name as string;
                const hours = data.value;
                const employees = getEmployeesForStatus(statusName);

                return (
                  <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-200 max-w-xs">
                    <div className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.payload.color }}
                      ></div>
                      {statusName}
                    </div>
                    <div className="text-xs text-slate-600 mb-2">
                      Total: <b>{hours}h</b>
                    </div>
                    {userRole !== "EMPLOYEE" && employees.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mb-1">
                          Employees ({employees.length})
                        </div>
                        <div className="text-xs text-slate-700 max-h-32 overflow-y-auto space-y-1">
                          {employees.slice(0, 10).map((emp, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center"
                            >
                              <span className="truncate flex-1">
                                {emp.employeeName}
                              </span>
                              <span className="ml-2 text-slate-500 font-mono text-[10px]">
                                {statusName === "Approved" &&
                                  `${emp.approvedHours}h`}
                                {statusName === "Pending for Approval" &&
                                  `${emp.pendingApprovedHours}h`}
                                {statusName === "Revision Requested" &&
                                  `${emp.revisionRequestedHours || 0}h`}
                                {statusName === "Rejected" &&
                                  `${emp.rejectedHours || 0}h`}
                                {statusName === "Not Submitted" &&
                                  `${Math.max(0, emp.allocationHours - emp.actualHours).toFixed(1)}h`}
                              </span>
                            </div>
                          ))}
                          {employees.length > 10 && (
                            <div className="text-[10px] text-slate-400 italic pt-1">
                              +{employees.length - 10} more employees
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-2xl font-bold text-slate-700 leading-none">
            {total}
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
            Total Hrs
          </span>
        </div>
      </div>

      {/* Status breakdown with percentages */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => {
          const percentage =
            total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
          return (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-700">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600">
                  {percentage}%
                </span>
                <span className="text-xs text-slate-500">{item.value}h</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
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
  const [projectAllocations, setProjectAllocations] = useState<any[]>([]);
  const [approvalStatusData, setApprovalStatusData] = useState<any[]>([]);

  // Filters
  const [dateRangeType, setDateRangeType] = useState<string>("current_month");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<string>(
    userRole === "RMG" ? "" : "all",
  );
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Employee allocation counts for KPI
  const [employeeAllocationCounts, setEmployeeAllocationCounts] = useState({
    total: 0,
    allocated: 0,
    bench: 0,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Check if user can see filters (RMG or Manager)
  const canSeeFilters = userRole === "RMG" || userRole === "MANAGER";

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Calculate initial date range for current_month BEFORE loading report
        const today = new Date();
        const start = format(startOfMonth(today), "yyyy-MM-dd");
        const end = format(endOfMonth(today), "yyyy-MM-dd");
        setStartDate(start);
        setEndDate(end);

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

        // Note: loadReport will be triggered by the startDate/endDate change via auto-reload effect
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load initial data");
      } finally {
        setIsInitialLoad(false);
      }
    };

    loadInitialData();
  }, []);

  // Calculate date range based on filter type
  useEffect(() => {
    const today = new Date();
    let start = "";
    let end = "";

    switch (dateRangeType) {
      case "current_week":
        start = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        end = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;
      case "current_month":
        start = format(startOfMonth(today), "yyyy-MM-dd");
        end = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "last_3_months":
        start = format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd");
        end = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "last_6_months":
        start = format(startOfMonth(subMonths(today, 5)), "yyyy-MM-dd");
        end = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "last_year":
        start = format(startOfMonth(subYears(today, 1)), "yyyy-MM-dd");
        end = format(endOfMonth(today), "yyyy-MM-dd");
        break;
      case "custom":
        // Keep existing startDate and endDate
        return;
    }

    if (dateRangeType !== "custom") {
      setStartDate(start);
      setEndDate(end);
    }
  }, [dateRangeType]);

  // Auto-reload report when filters change
  useEffect(() => {
    if (!isInitialLoad && startDate && endDate) {
      loadReport();
      loadProjectAllocations();
    }
  }, [selectedMonth, selectedProject, startDate, endDate, selectedDepartment]);

  // Update approval status when reportData changes (filtered by date range)
  useEffect(() => {
    loadApprovalStatus();
  }, [reportData]);

  // Load project allocations from FLResource
  const loadProjectAllocations = async () => {
    try {
      if (!user) return;

      let allocations: any[] = [];
      let empIdSet = new Set<string>();

      // KPI 2: For MANAGER role, show projects managed by logged-in user
      if (userRole === "MANAGER") {
        console.log(
          "[Project Allocations Debug] Loading projects for MANAGER:",
          user.employeeId || user.id,
        );

        // Get all projects managed by this user
        const managedProjects = await projectService.getAll();
        let userManagedProjects = managedProjects.filter(
          (project: any) =>
            project.projectManager?.employeeId === (user.employeeId || user.id),
        );

        // Filter by selected project if not "all"
        if (selectedProject && selectedProject !== "all") {
          userManagedProjects = userManagedProjects.filter(
            (project: any) => project.projectId === selectedProject,
          );
        }

        console.log(
          "[Project Allocations Debug] Managed projects:",
          userManagedProjects.length,
        );

        // Get allocations for these projects
        allocations = await Promise.all(
          userManagedProjects.map(async (project: any) => {
            const projectAllocations = await flResourceService.getByProjectId(
              project._id,
            );
            return projectAllocations;
          }),
        );
        allocations = allocations.flat();
      } else if (userRole === "RMG") {
        console.log(
          "[Project Allocations Debug] Loading all allocations for RMG",
        );

        // RMG can view all allocations across all projects
        // Fetch all FLResource allocations
        try {
          allocations = await flResourceService.getAll();
          console.log(
            "[Project Allocations Debug] Total RMG allocations:",
            allocations.length,
          );
        } catch (error) {
          console.error(
            "[Project Allocations Debug] Error fetching all allocations:",
            error,
          );
          allocations = [];
        }
      } else {
        // For EMPLOYEE role, use their own allocations
        const employeeId = user.employeeId || user.id;
        console.log(
          "[Project Allocations Debug] Loading allocations for EMPLOYEE:",
          {
            employeeId: employeeId,
            email: user.email,
            userObject: user,
          },
        );
        allocations = await flResourceService.getByEmployeeId(employeeId);
        console.log(
          "[Project Allocations Debug] Found allocations for employee:",
          allocations.length,
        );
        if (allocations.length > 0) {
          console.log(
            "[Project Allocations Debug] ALL allocations:",
            JSON.stringify(allocations, null, 2),
          );
        } else {
          console.warn(
            "[Project Allocations Debug] ⚠️ NO ALLOCATIONS FOUND - Please check:",
            {
              expectedEmployeeId: employeeId,
              checkFlResourceTable:
                "SELECT * FROM flresources WHERE employeeId = '" +
                employeeId +
                "'",
              possibleIssues: [
                "1. No record exists in flresource table with this employeeId",
                "2. EmployeeId in flresource table doesn't match user.employeeId",
                "3. Database connection issue",
              ],
            },
          );
        }
        empIdSet.add(employeeId);
      }

      // Apply filters to allocations
      console.log(
        "[Project Allocations Debug] Allocations before filtering:",
        allocations.length,
      );

      // Filter by selected project (for RMG only, MANAGER filtered above)
      if (
        userRole === "RMG" &&
        selectedProject &&
        selectedProject !== "all" &&
        selectedProject !== ""
      ) {
        allocations = allocations.filter(
          (alloc: any) =>
            alloc.projectId === selectedProject ||
            alloc.projectCode === selectedProject,
        );
        console.log(
          "[Project Allocations Debug] After project filter:",
          allocations.length,
        );
      }

      // Filter by date range - only show allocations that overlap with selected date range
      if (startDate && endDate) {
        const filterStartDate = new Date(startDate);
        const filterEndDate = new Date(endDate);

        console.log(
          "[Project Allocations Debug] =============================",
        );
        console.log("[Project Allocations Debug] DATE FILTERING PROCESS");
        console.log("[Project Allocations Debug] Selected Date Range:", {
          filterStart: startDate,
          filterEnd: endDate,
          filterStartDate: filterStartDate.toISOString(),
          filterEndDate: filterEndDate.toISOString(),
        });
        console.log(
          "[Project Allocations Debug] Total allocations before date filter:",
          allocations.length,
        );

        const beforeFilterCount = allocations.length;

        allocations = allocations.filter((alloc: any) => {
          // Handle multiple possible date field names from flresource table
          const allocStartStr =
            alloc.startDate ||
            alloc.expectedStartDate ||
            alloc.requestedFromDate;
          const allocEndStr =
            alloc.endDate || alloc.expectedEndDate || alloc.requestedToDate;

          if (!allocStartStr || !allocEndStr) {
            console.warn(
              `[Project Allocations Debug] ⚠️ Missing dates for allocation:`,
              {
                flNo: alloc.flNo,
                projectName: alloc.projectName,
                availableFields: Object.keys(alloc),
              },
            );
            return false;
          }

          const allocStart = new Date(allocStartStr);
          const allocEnd = new Date(allocEndStr);

          // Check if allocation overlaps with filter date range
          // Overlap occurs if: allocStart <= filterEnd AND allocEnd >= filterStart
          const overlaps =
            allocStart <= filterEndDate && allocEnd >= filterStartDate;

          console.log(
            `[Project Allocations Debug] ${overlaps ? "✅ KEEP" : "❌ FILTER OUT"}:`,
            {
              projectName: alloc.projectName || alloc.projectCode || "Unknown",
              flNo: alloc.flNo,
              allocStart: allocStartStr,
              allocEnd: allocEndStr,
              filterStart: startDate,
              filterEnd: endDate,
              overlapCheck: `allocStart(${allocStart.toISOString().split("T")[0]}) <= filterEnd(${filterEndDate.toISOString().split("T")[0]}) = ${allocStart <= filterEndDate}`,
              overlapCheck2: `allocEnd(${allocEnd.toISOString().split("T")[0]}) >= filterStart(${filterStartDate.toISOString().split("T")[0]}) = ${allocEnd >= filterStartDate}`,
              overlaps: overlaps,
            },
          );

          return overlaps;
        });

        console.log(
          "[Project Allocations Debug] =============================",
        );
        console.log(
          `[Project Allocations Debug] DATE FILTER RESULT: ${beforeFilterCount} → ${allocations.length} allocations`,
        );
        if (allocations.length === 0 && beforeFilterCount > 0) {
          console.warn(
            "[Project Allocations Debug] ⚠️ ALL ALLOCATIONS FILTERED OUT BY DATE RANGE!",
            {
              filterRange: `${startDate} to ${endDate}`,
              suggestion:
                "Check if allocation dates overlap with this range or select a different date range",
            },
          );
        }
        console.log(
          "[Project Allocations Debug] =============================",
        );
      }

      // Calculate employee allocation counts
      const uniqueEmployees = new Set(
        allocations.map((alloc: any) => alloc.employeeId),
      );
      const totalEmployees =
        userRole === "EMPLOYEE" ? 1 : reportData.length || uniqueEmployees.size;
      const allocatedEmployees = uniqueEmployees.size;
      const benchEmployees = Math.max(0, totalEmployees - allocatedEmployees);

      setEmployeeAllocationCounts({
        total: totalEmployees,
        allocated: allocatedEmployees,
        bench: benchEmployees,
      });

      console.log("[Project Allocations Debug] Raw allocations:", allocations);
      console.log("[Project Allocations Debug] Employee counts:", {
        total: totalEmployees,
        allocated: allocatedEmployees,
        bench: benchEmployees,
      });

      // Transform to chart format
      const projectMap: Record<string, any> = {};
      let totalHours = 0;

      allocations.forEach((alloc: any) => {
        const projectKey = alloc.projectCode || alloc.projectId;
        if (!projectMap[projectKey]) {
          projectMap[projectKey] = {
            projectName:
              alloc.projectName || alloc.projectCode || alloc.projectId,
            hours: 0,
            startDate:
              alloc.startDate ||
              alloc.expectedStartDate ||
              alloc.requestedFromDate ||
              new Date().toISOString().split("T")[0],
            endDate:
              alloc.endDate ||
              alloc.expectedEndDate ||
              alloc.requestedToDate ||
              new Date().toISOString().split("T")[0],
            color: generateProjectColor(
              alloc.projectName || alloc.projectCode || alloc.projectId,
            ),
          };
        }
        const hours = Number.parseFloat(
          alloc.totalAllocation || alloc.allocation || 0,
        );
        projectMap[projectKey].hours += hours;
        totalHours += hours;
      });

      console.log("[Project Allocations Debug] Total hours:", totalHours);
      console.log("[Project Allocations Debug] Project map:", projectMap);

      // Convert to array and calculate percentages
      const projectData = Object.values(projectMap)
        .map((proj: any) => ({
          ...proj,
          hours: Math.round(proj.hours),
          percentage: totalHours > 0 ? (proj.hours / totalHours) * 100 : 0,
        }))
        .filter((p: any) => p.hours > 0);

      console.log(
        "[Project Allocations Debug] Project data before Bench:",
        projectData,
      );

      // Calculate total allocated percentage
      const totalPercentage = projectData.reduce(
        (sum: number, proj: any) => sum + proj.percentage,
        0,
      );

      console.log(
        "[Project Allocations Debug] Total percentage:",
        totalPercentage,
      );

      // Add Bench project if total is less than 100%
      if (totalPercentage < 100 && totalPercentage > 0) {
        const benchPercentage = 100 - totalPercentage;
        console.log(
          "[Project Allocations Debug] Adding Bench with percentage:",
          benchPercentage,
        );
        projectData.push({
          projectName: "Bench",
          hours: 0,
          percentage: benchPercentage,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date().toISOString().split("T")[0],
          color: CHART_COLORS.slateLight,
        });
      }

      console.log(
        "[Project Allocations Debug] Final project data:",
        projectData,
      );

      // If no allocations match the date filter, show 100% Bench
      if (projectData.length === 0) {
        console.log(
          "[Project Allocations Debug] No allocations found, showing 100% Bench",
        );
        setProjectAllocations([
          {
            projectName: "Bench",
            hours: 0,
            percentage: 100,
            startDate: startDate || new Date().toISOString().split("T")[0],
            endDate: endDate || new Date().toISOString().split("T")[0],
            color: CHART_COLORS.gray,
          },
        ]);
      } else {
        setProjectAllocations(projectData);
      }
    } catch (error) {
      console.error("Error loading project allocations:", error);
      // On error, show 100% Bench instead of sample data
      setProjectAllocations([
        {
          projectName: "Bench",
          hours: 0,
          percentage: 100,
          startDate: startDate || new Date().toISOString().split("T")[0],
          endDate: endDate || new Date().toISOString().split("T")[0],
          color: CHART_COLORS.gray,
        },
      ]);
    }
  };

  // Helper function to calculate working days (excluding weekends)
  const calculateWorkingDays = (start: string, end: string): number => {
    if (!start || !end) return 0;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      const workingDays = allDays.filter((day) => {
        const dayOfWeek = getDay(day);
        return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
      });

      return workingDays.length;
    } catch (error) {
      console.error("Error calculating working days:", error);
      return 0;
    }
  };

  // Load approval status from report summary
  const loadApprovalStatus = () => {
    try {
      if (!reportData || reportData.length === 0) {
        setApprovalStatusData([]);
        return;
      }

      console.log("[Approval Status Debug] Report data:", reportData);

      // Calculate totalFilteredAllocation based on working days * 8 hours/day * number of employees
      // This gives realistic allocation based on actual working days (excluding weekends)
      const workingDays = calculateWorkingDays(startDate, endDate);
      const employeeCount = reportData.length;
      const totalFilteredAllocation = workingDays * 8 * employeeCount;

      console.log("[Approval Status Debug] Allocation calculation:", {
        startDate,
        endDate,
        workingDays,
        employeeCount,
        totalFilteredAllocation: `${workingDays} days * 8 hours * ${employeeCount} employees = ${totalFilteredAllocation} hours`,
      });

      const totalApprovedHours = reportData.reduce(
        (sum, emp) => sum + emp.approvedHours,
        0,
      );

      const totalPendingHours = reportData.reduce(
        (sum, emp) => sum + emp.pendingApprovedHours,
        0,
      );

      const totalRevisionRequestedHours = reportData.reduce(
        (sum, emp) => sum + (emp.revisionRequestedHours || 0),
        0,
      );

      const totalRejectedHours = reportData.reduce(
        (sum, emp) => sum + (emp.rejectedHours || 0),
        0,
      );

      const totalActualHours = reportData.reduce(
        (sum, emp) => sum + emp.actualHours,
        0,
      );

      console.log("[Approval Status Debug] Filtered calculations:", {
        totalFilteredAllocation,
        totalApprovedHours,
        totalPendingHours,
        totalRevisionRequestedHours,
        totalRejectedHours,
        totalActualHours,
      });

      // Calculate Not Submitted = allocated - actual worked hours
      const notSubmitted = Math.max(
        0,
        totalFilteredAllocation - totalActualHours,
      );

      const totalHours =
        totalApprovedHours +
        totalPendingHours +
        totalRevisionRequestedHours +
        totalRejectedHours +
        notSubmitted;

      const statusData = [
        {
          name: "Approved",
          value: Math.round(totalApprovedHours * 10) / 10,
          color: CHART_COLORS.green,
        },
        {
          name: "Pending for Approval",
          value: Math.round(totalPendingHours * 10) / 10,
          color: CHART_COLORS.orange,
        },
        {
          name: "Revision Requested",
          value: Math.round(totalRevisionRequestedHours * 10) / 10,
          color: "#f59e0b", // amber-500
        },
        {
          name: "Rejected",
          value: Math.round(totalRejectedHours * 10) / 10,
          color: CHART_COLORS.red,
        },
        {
          name: "Not Submitted",
          value: Math.round(notSubmitted * 10) / 10,
          color: CHART_COLORS.slateLight,
        },
      ].filter((item) => item.value > 0);

      console.log("[Approval Status Debug] Status breakdown:", statusData);
      console.log("[Approval Status Debug] Total hours:", totalHours);

      setApprovalStatusData(statusData);
    } catch (error) {
      console.error("Error loading approval status:", error);
      setApprovalStatusData([]);
    }
  };

  // Load report data
  const loadReport = async () => {
    if (!user) {
      toast.error("User information not available");
      return;
    }

    // RMG no longer requires project selection - show month-wise data for all employees

    setIsLoading(true);
    try {
      const filters: ReportFilters = {
        role: userRole as "EMPLOYEE" | "RMG" | "MANAGER",
        // Only send month if using custom month filter (not when using date ranges)
        month:
          dateRangeType === "custom" && selectedMonth
            ? selectedMonth
            : undefined,
        employeeId:
          userRole === "EMPLOYEE" ? user.employeeId || user.id : undefined,
        managerId:
          userRole === "MANAGER" ? user.employeeId || user.id : undefined,
        projectId:
          selectedProject && selectedProject !== "all" && selectedProject !== ""
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

  // Chart Data Calculations
  const hoursDistributionData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: "Billable Actual",
        value: summary.totalActualBillableHours,
        color: CHART_COLORS.blue,
      },
      {
        name: "Non-Billable Actual",
        value: summary.totalActualNonBillableHours,
        color: CHART_COLORS.orange,
      },
      {
        name: "Billable Approved",
        value: summary.totalBillableApprovedHours,
        color: CHART_COLORS.green,
      },
      {
        name: "Non-Billable Approved",
        value: summary.totalNonBillableApprovedHours,
        color: CHART_COLORS.emerald,
      },
    ].filter((item) => item.value > 0);
  }, [summary]);

  const actualVsApprovedData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: "Billable",
        actual: summary.totalActualBillableHours,
        approved: summary.totalBillableApprovedHours,
      },
      {
        name: "Non-Billable",
        actual: summary.totalActualNonBillableHours,
        approved: summary.totalNonBillableApprovedHours,
      },
    ];
  }, [summary]);

  const departmentDistributionData = useMemo(() => {
    const deptCounts = reportData.reduce(
      (acc, emp) => {
        const dept = emp.department || "Unknown";
        if (!acc[dept]) {
          acc[dept] = { total: 0, actual: 0, approved: 0 };
        }
        acc[dept].total++;
        acc[dept].actual += emp.actualHours;
        acc[dept].approved += emp.approvedHours;
        return acc;
      },
      {} as Record<string, { total: number; actual: number; approved: number }>,
    );

    return Object.entries(deptCounts).map(([dept, data]) => ({
      name: dept,
      employees: data.total,
      actualHours: data.actual,
      approvedHours: data.approved,
    }));
  }, [reportData]);

  const allocationVsActualData = useMemo(() => {
    if (!summary) return [];
    return [
      {
        name: "Allocated",
        value: summary.totalAllocationHours,
        color: CHART_COLORS.slate,
      },
      {
        name: "Actual Hours",
        value: summary.totalActualHours,
        color: CHART_COLORS.indigo,
      },
      {
        name: "Approved Hours",
        value: summary.totalApprovedHours,
        color: CHART_COLORS.teal,
      },
    ].filter((item) => item.value > 0);
  }, [summary]);

  const topEmployeesData = useMemo(() => {
    return [...reportData]
      .sort((a, b) => b.actualHours - a.actualHours)
      .slice(0, 10)
      .map((emp) => ({
        name: emp.employeeName.split(" ").slice(0, 2).join(" "), // Shorten name
        actual: emp.actualHours,
        approved: emp.approvedHours,
      }));
  }, [reportData]);

  /**
   * Data Transformations for Redesigned Charts
   */

  // Calculate weeks within the selected month for weekly slider
  const weeksInMonth = useMemo(() => {
    if (!selectedMonth || selectedMonth === "") {
      return [];
    }
    const [year, monthNum] = selectedMonth.split("-").map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0);

    const weeks = eachWeekOfInterval(
      {
        start: monthStart,
        end: monthEnd,
      },
      { weekStartsOn: 1 },
    );

    return weeks;
  }, [selectedMonth]);

  // Initialize selected week when month changes
  useEffect(() => {
    if (weeksInMonth.length > 0) {
      const currentWeek = weeksInMonth.find((week) =>
        isSameWeek(week, new Date(), { weekStartsOn: 1 }),
      );
      setSelectedWeek(currentWeek || weeksInMonth[0]);
    }
  }, [weeksInMonth]);

  // Week navigation handlers
  const handlePreviousWeek = () => {
    const currentIndex = weeksInMonth.findIndex((week) =>
      isSameWeek(week, selectedWeek, { weekStartsOn: 1 }),
    );
    if (currentIndex > 0) {
      setSelectedWeek(weeksInMonth[currentIndex - 1]);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = weeksInMonth.findIndex((week) =>
      isSameWeek(week, selectedWeek, { weekStartsOn: 1 }),
    );
    if (currentIndex < weeksInMonth.length - 1) {
      setSelectedWeek(weeksInMonth[currentIndex + 1]);
    }
  };

  // Calculate week dates ensuring they stay within the selected month
  const { currentWeekIndex, weekStartDate, weekEndDate } = useMemo(() => {
    const weekIndex = weeksInMonth.findIndex((week) =>
      isSameWeek(week, selectedWeek, { weekStartsOn: 1 }),
    );

    const [year, monthNum] = selectedMonth.split("-").map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 0);

    let startDate = startOfWeek(selectedWeek, { weekStartsOn: 1 });
    let endDate = endOfWeek(selectedWeek, { weekStartsOn: 1 });

    // Clamp dates to month boundaries
    if (startDate < monthStart) startDate = monthStart;
    if (endDate > monthEnd) endDate = monthEnd;

    return {
      currentWeekIndex: weekIndex,
      weekStartDate: startDate,
      weekEndDate: endDate,
    };
  }, [selectedWeek, selectedMonth, weeksInMonth]);

  // 1. Allocation Summary (Pie chart showing project allocation percentages)
  const redesignedAllocationSummaryData = useMemo(() => {
    if (!projectAllocations || projectAllocations.length === 0) return [];

    // Group by project and calculate percentages
    const totalPercentage = projectAllocations.reduce(
      (sum, proj) => sum + (proj.percentage || 0),
      0,
    );

    return projectAllocations
      .filter((proj) => proj.projectName !== "Bench" && proj.percentage > 0)
      .map((proj) => ({
        name: proj.projectName,
        value: Math.round(proj.percentage * 10) / 10,
        color: proj.color || generateProjectColor(proj.projectName),
      }))
      .concat(
        totalPercentage < 100
          ? [
              {
                name: "Bench",
                value: Math.round((100 - totalPercentage) * 10) / 10,
                color: CHART_COLORS.gray,
              },
            ]
          : [],
      )
      .filter((item) => item.value > 0);
  }, [projectAllocations]);

  // 2. Project Allocations (From FLResource table)
  const redesignedProjectData = useMemo(() => {
    return projectAllocations;
  }, [projectAllocations]);

  // 2b. Weekly Project Allocation Data
  // 2b. Monthly Daily Allocation Data - Day-by-Day Segments
  const monthlyDailyAllocationData = useMemo(() => {
    if (!startDate || !endDate || projectAllocations.length === 0) {
      return [];
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Generate all days in the selected month/date range
      const allDays = eachDayOfInterval({ start, end });

      // Default color for days before any allocation
      const DEFAULT_COLOR = "#cbd5e1"; // slate-300
      const BENCH_COLOR = "#9ca3af"; // gray-400

      // Sort project allocations by start date
      const sortedAllocations = [...projectAllocations]
        .filter((proj) => proj.projectName !== "Bench")
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
        );

      // Find the first allocation start date
      const firstAllocationDate =
        sortedAllocations.length > 0
          ? new Date(sortedAllocations[0].startDate)
          : null;

      // Find the last allocation end date
      const lastAllocationDate =
        sortedAllocations.length > 0
          ? new Date(sortedAllocations[sortedAllocations.length - 1].endDate)
          : null;

      // Map each day to its appropriate segment
      return allDays.map((day) => {
        const dayDate = day.toISOString().split("T")[0];

        // Check if day is before first allocation
        if (firstAllocationDate && day < firstAllocationDate) {
          return {
            date: dayDate,
            projectName: null,
            color: DEFAULT_COLOR,
            allocationStart: null,
            allocationEnd: null,
          };
        }

        // Check if day is after last allocation
        if (lastAllocationDate && day > lastAllocationDate) {
          return {
            date: dayDate,
            projectName: "Bench",
            color: BENCH_COLOR,
            allocationStart: null,
            allocationEnd: null,
          };
        }

        // Find which project(s) this day belongs to
        const activeAllocations = sortedAllocations.filter((proj) => {
          const projStart = new Date(proj.startDate);
          const projEnd = new Date(proj.endDate);
          return day >= projStart && day <= projEnd;
        });

        // If day falls within an allocation period
        if (activeAllocations.length > 0) {
          // Use the first matching allocation (or could use most recent)
          const allocation = activeAllocations[0];
          return {
            date: dayDate,
            projectName: allocation.projectName,
            color:
              allocation.color || generateProjectColor(allocation.projectName),
            allocationStart: allocation.startDate,
            allocationEnd: allocation.endDate,
          };
        }

        // If no allocation found for this day (gap between allocations)
        return {
          date: dayDate,
          projectName: "Bench",
          color: BENCH_COLOR,
          allocationStart: null,
          allocationEnd: null,
        };
      });
    } catch (error) {
      console.error("Error calculating monthly daily allocation data:", error);
      return [];
    }
  }, [projectAllocations, startDate, endDate]);

  // Calculate average allocated projects (kept for compatibility)
  const averageAllocatedProjects = useMemo(() => {
    if (monthlyDailyAllocationData.length === 0) return "0.0";

    const allocatedDays = monthlyDailyAllocationData.filter(
      (day) => day.projectName && day.projectName !== "Bench",
    );

    const uniqueProjects = new Set(allocatedDays.map((day) => day.projectName));

    return uniqueProjects.size.toFixed(1);
  }, [monthlyDailyAllocationData]);

  // 3. Approval Status (From TimesheetEntries table)
  const redesignedStatusData = useMemo(() => {
    return approvalStatusData;
  }, [approvalStatusData]);

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
    const dateLabel =
      startDate && endDate
        ? `${startDate}_to_${endDate}`
        : format(new Date(), "yyyy-MM");
    link.download = `employee_hours_report_${dateLabel}.csv`;
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
              ? "View your hours report with flexible date ranges"
              : "View employee hours report with flexible date ranges and filters"}
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
              ? "Select date range to view all employee hours data"
              : "Select date range and apply filters - report updates automatically"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date Range Filter - Always visible */}
            <div className="space-y-2">
              <Label htmlFor="dateRange">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range *
              </Label>
              <Select
                value={dateRangeType}
                onValueChange={(value) => {
                  setDateRangeType(value);
                  if (value !== "custom") {
                    // Clear month selector when using predefined ranges
                    setSelectedMonth("");
                  }
                }}
              >
                <SelectTrigger id="dateRange">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_week">Current Week</SelectItem>
                  <SelectItem value="current_month">Current Month</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Date Range - Only visible when Custom is selected */}
            {dateRangeType === "custom" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customStartDate">Start Date</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDate">End Date</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </>
            )}

            {/* Project Filter - Visible for Manager only (removed for RMG) */}
            {canSeeFilters && userRole !== "RMG" && (
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger id="project">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project._id} value={project.projectId}>
                        {project.projectCode} - {project.projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {(selectedProject !== "all" ||
            dateRangeType !== "current_month" ||
            searchQuery) && (
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedProject(userRole === "RMG" ? "" : "all");
                  setDateRangeType("current_month");
                  setStartDate("");
                  setEndDate("");
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                Clear Filters
              </Button>
              <Badge variant="secondary">
                {dateRangeType === "current_week" && "Current Week"}
                {dateRangeType === "current_month" && "Current Month"}
                {dateRangeType === "last_3_months" && "Last 3 Months"}
                {dateRangeType === "last_6_months" && "Last 6 Months"}
                {dateRangeType === "last_year" && "Last Year"}
                {dateRangeType === "custom" && `${startDate} to ${endDate}`}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Analytics & Detailed Report - Tabbed Interface */}
      {reportData.length > 0 && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Overview & Analytics
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Detailed Report
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab with Charts */}
          <TabsContent value="overview" className="space-y-6">
            {/* Date Range Display - Only for RMG and MANAGER */}
            {(userRole === "RMG" || userRole === "MANAGER") &&
              startDate &&
              endDate && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">
                          Selected Date Range
                        </h3>
                        <p className="text-xs text-slate-500">
                          {dateRangeType === "current_week" && "Current Week"}\n{" "}
                          {dateRangeType === "current_month" && "Current Month"}
                          \n{" "}
                          {dateRangeType === "last_3_months" && "Last 3 Months"}
                          \n{" "}
                          {dateRangeType === "last_6_months" && "Last 6 Months"}
                          \n {dateRangeType === "last_year" &&
                            "Last Year"}\n{" "}
                          {dateRangeType === "custom" && "Custom Range"}
                        </p>
                      </div>
                      <div className="text-center min-w-[200px]">
                        <div className="text-sm font-bold text-slate-800">
                          {format(new Date(startDate), "MMM dd, yyyy")} -{" "}
                          {format(new Date(endDate), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* KPI Row: 3 Cards in Single Row - 25%, 50%, 25% Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Chart 1: Allocation Summary - 25% */}
              <Card className="border-none shadow-sm bg-slate-50/50 overflow-hidden lg:w-1/4">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Allocation Summary
                      </CardTitle>
                      <CardDescription>
                        Total allocation percentage
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <AllocationSummaryChart
                    data={redesignedAllocationSummaryData}
                    employeeCount={employeeAllocationCounts.total}
                    allocatedCount={employeeAllocationCounts.allocated}
                    benchCount={employeeAllocationCounts.bench}
                    averageProjects={averageAllocatedProjects}
                  />
                </CardContent>
              </Card>

              {/* Chart 2: Project Allocations - Monthly Daily View - 50% */}
              <Card className="border-none shadow-sm bg-slate-50/50 overflow-hidden lg:w-1/2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Project Allocations
                      </CardTitle>
                      <CardDescription>
                        Daily allocation timeline for selected month
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      {startDate && endDate
                        ? `${format(new Date(startDate), "MMM yyyy")}`
                        : "Select Month"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <MonthlyDailyAllocationChart
                    dailyData={monthlyDailyAllocationData}
                  />
                </CardContent>
              </Card>

              {/* Chart 3: Approval Status - 25% */}
              <Card className="border-none shadow-sm bg-slate-50/50 overflow-hidden lg:w-1/4">
                <CardHeader className="pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      Approval Status {userRole === "MANAGER" && "(Aggregated)"}
                    </CardTitle>
                    <CardDescription>
                      {userRole === "MANAGER"
                        ? "Total approval breakdown - see employee details below"
                        : "Approval lifecycle breakdown"}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <ApprovalStatusDoughnut
                    data={redesignedStatusData}
                    reportData={reportData}
                    userRole={userRole}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Employee-wise Approval Status for MANAGER */}
            {userRole === "MANAGER" && reportData.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-800">
                    Employee-wise Approval Status
                  </CardTitle>
                  <CardDescription>
                    Detailed approval breakdown for each employee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table className="whitespace-nowrap">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee Name</TableHead>
                          <TableHead className="text-right">
                            Allocated
                          </TableHead>
                          <TableHead className="text-right">Approved</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                          <TableHead className="text-right">Revision</TableHead>
                          <TableHead className="text-right">Rejected</TableHead>
                          <TableHead className="text-right">
                            Not Submitted
                          </TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.map((emp) => {
                          const notSubmitted = Math.max(
                            0,
                            emp.allocationHours - emp.actualHours,
                          );
                          const rejectedHours = emp.rejectedHours || 0;
                          const revisionRequestedHours =
                            emp.revisionRequestedHours || 0;
                          return (
                            <TableRow key={emp.employeeId}>
                              <TableCell className="font-medium">
                                {emp.employeeName}
                              </TableCell>
                              <TableCell className="text-right">
                                {emp.allocationHours}h
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  {emp.approvedHours}h
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  {emp.pendingApprovedHours}h
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-amber-50 text-amber-700 border-amber-200"
                                >
                                  {revisionRequestedHours}h
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  {rejectedHours}h
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant="outline"
                                  className="bg-slate-50 text-slate-700 border-slate-200"
                                >
                                  {notSubmitted.toFixed(1)}h
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {emp.approvedHours === emp.allocationHours ? (
                                  <Badge className="bg-green-500">
                                    Complete
                                  </Badge>
                                ) : emp.pendingApprovedHours > 0 ? (
                                  <Badge className="bg-orange-500">
                                    Pending
                                  </Badge>
                                ) : revisionRequestedHours > 0 ? (
                                  <Badge className="bg-amber-500">
                                    Revision
                                  </Badge>
                                ) : rejectedHours > 0 ? (
                                  <Badge className="bg-red-500">Rejected</Badge>
                                ) : (
                                  <Badge variant="outline">In Progress</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Timesheet View - Full Component */}
            <div className="mt-6">
              <style>{`
                /* Hide Weekly Timesheet header, description, tabs, and action buttons for report view */
                /* Hide the main header title and description */
                .weekly-timesheet-report-view .page-header-content h1,
                .weekly-timesheet-report-view .page-header-content p.page-description,
                .weekly-timesheet-report-view .page-title {
                  display: none !important;
                }
                
                /* Show tabs for RMG/MANAGER so they can switch to Approvals tab */
                /* Tabs will remain visible for navigation */
                
                /* Hide all action buttons in the tabs row */
                .weekly-timesheet-report-view .flex.items-center.gap-3 button {
                  display: none !important;
                }
                
                /* Hide delete buttons in Category Assignment dialog */
                .weekly-timesheet-report-view .category-delete-btn {
                  display: none !important;
                }
                
                /* Hide empty row for adding categories in Category Assignment dialog */
                .weekly-timesheet-report-view .category-empty-row {
                  display: none !important;
                }
                
                /* Keep the tab content visible */
                .weekly-timesheet-report-view [role="tabpanel"] {
                  display: block !important;
                }
                
                /* Make timesheet read-only in report view */
                .weekly-timesheet-report-view input,
                .weekly-timesheet-report-view textarea,
                .weekly-timesheet-report-view select {
                  pointer-events: none !important;
                  opacity: 0.8;
                  cursor: not-allowed;
                }
              `}</style>
              <div className="weekly-timesheet-report-view">
                <WeeklyTimesheet />
              </div>
            </div>
          </TabsContent>
          {/* Details Tab with Table */}
          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Report</CardTitle>
                <CardDescription>
                  {startDate && endDate
                    ? `${format(new Date(startDate), "MMMM dd, yyyy")} - ${format(new Date(endDate), "MMMM dd, yyyy")}`
                    : "Select a date range to view report"}
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
                      No data available
                    </h3>
                    <p className="text-muted-foreground">
                      No hours data found for the selected month
                    </p>
                  </div>
                )}

                {!isLoading &&
                  reportData.length > 0 &&
                  paginatedData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Search className="h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No results found
                      </h3>
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
                            <TableHead className="text-right">
                              Allocation
                            </TableHead>
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
                            <TableHead className="text-right">
                              Actual Hours
                            </TableHead>
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
                                          {emp.pendingDetails.map(
                                            (item, index) => (
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
                                                  {item.projectName} (
                                                  {item.projectId})
                                                </div>
                                                <div className="text-slate-500">
                                                  Manager:{" "}
                                                  {item.projectManagerName}
                                                </div>
                                              </div>
                                            ),
                                          )}
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
                          {Math.min(
                            currentPage * itemsPerPage,
                            filteredData.length,
                          )}{" "}
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
          </TabsContent>
        </Tabs>
      )}

      {/* Empty State when no data */}
      {!isLoading && reportData.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No data available</h3>
              <p className="text-muted-foreground">
                No hours data found for the selected criteria
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeHoursReport;
