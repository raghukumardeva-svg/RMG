import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Clock,
  MessageSquare,
  Search,
  CheckCircle2,
  LayoutGrid,
  ClipboardList,
  Info,
  Send,
  RotateCcw,
  CheckCheck,
  AlertTriangle,
  X,
  Plus,
  UserX,
  Check,
  ChevronsUpDown,
  Bell,
  Loader2,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfDay,
  isSameDay,
  isWeekend,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUDAConfigurationStore } from "@/store/udaConfigurationStore";
import { useFinancialLineStore } from "@/store/financialLineStore";
import { useEmployeeStore } from "@/store/employeeStore";
import { useAuthStore } from "@/store/authStore";
import { useHolidayStore } from "@/store/holidayStore";
import timesheetService from "@/services/timesheetService";
import type { ApprovalTimesheet } from "@/services/timesheetService";
import { flResourceService } from "@/services/flResourceService";
import { projectService } from "@/services/projectService";
import { toast } from "sonner";
import projectCatalog from "@/data/projects.sample.json";
import type { ProjectCatalogItem } from "@/utils/timesheetUtils";
import {
  formatHoursDecimal,
  formatMinutesToTime,
  formatProjectLabel,
  getAllowedMinutes,
  isProjectActive,
  normalizeTimeInput,
  normalizeTimeValue,
  parseTimeToMinutes,
  sumAllocationPercent,
} from "@/utils/timesheetUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { notificationService } from "@/services/notificationService";

interface TimesheetRow {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  udaId: string;
  udaName: string;
  type: string;
  financialLineItem: string;
  billable: string;
  hours: (string | null)[];
  comments: (string | null)[];
  entryMeta?: (null | {
    approvalStatus: string;
    rejectedReason: string | null;
    date: string;
    entryId: string;
  })[];
}

interface WeeklyTimesheetProps {
  initialDate?: Date;
  isReportView?: boolean;
}

const WeeklyTimesheet: React.FC<WeeklyTimesheetProps> = ({
  initialDate,
  isReportView = false,
}) => {
  const {
    configurations,
    fetchConfigurations,
    isLoading: isUDAConfigLoading,
    error: udaConfigError,
  } = useUDAConfigurationStore();
  const { fls, fetchFLs } = useFinancialLineStore();
  const { activeEmployees, fetchActiveEmployees } = useEmployeeStore();
  const { user } = useAuthStore();
  const { holidays, fetchHolidays } = useHolidayStore();

  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [timesheetStatus, setTimesheetStatus] = useState<
    "draft" | "submitted" | "approved" | "rejected" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cellErrors, setCellErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRowId, setDeleteRowId] = useState<string | null>(null);
  const [deleteRowLabel, setDeleteRowLabel] = useState("");
  const [submitConfirmDialogOpen, setSubmitConfirmDialogOpen] = useState(false);
  const [hasSubmittedThisSession, setHasSubmittedThisSession] = useState(false);
  const [viewMode, setViewMode] = useState<"entry" | "approval">("entry");
  const [approvalFilters, setApprovalFilters] = useState({
    projectId: "all",
    employeeIds: [] as string[],
  });
  const [approvalProjectTypeFilter, setApprovalProjectTypeFilter] =
    useState<string>("all");
  const [approvalTimesheets, setApprovalTimesheets] = useState<
    Record<string, ApprovalTimesheet | null>
  >({});
  const [approvalTimesheet, setApprovalTimesheet] =
    useState<ApprovalTimesheet | null>(null);
  const [isApprovalLoading, setIsApprovalLoading] = useState(false);
  const [approvalSearchAttempted, setApprovalSearchAttempted] = useState(false);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertComment, setRevertComment] = useState("");
  const [revertTarget, setRevertTarget] = useState<{
    dayIndex: number;
    udaId: string;
    label: string;
  } | null>(null);
  const [forceReloadCounter, setForceReloadCounter] = useState(0);
  const [selectedDaysForApproval, setSelectedDaysForApproval] = useState<
    Set<number>
  >(new Set());
  // Multi-employee selection: key = "employeeId-rowIndex-dayIndex"
  const [multiEmployeeSelections, setMultiEmployeeSelections] = useState<
    Set<string>
  >(new Set());
  const [categoryFilter, setCategoryFilter] = useState<
    "All" | "Billable" | "Non-Billable"
  >("All");
  const [isColorGuideOpen, setIsColorGuideOpen] = useState(false);
  // Validation dialog state for 8-hour check
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [invalidDaysList, setInvalidDaysList] = useState<string[]>([]);
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [selectedDaysForReject, setSelectedDaysForReject] = useState<
    Set<number>
  >(new Set());
  // Track which employees are selected for approval/rejection
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );
  // Track which employees are expanded in multi-employee approval view
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set(),
  );
  // Track which individual entries are selected for each employee
  // Key format: "employeeId-entryIndex"
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set(),
  );
  // Track entries that are explicitly unchecked even when employee is checked
  // Key format: "employeeId-entryIndex"
  const [uncheckedEntries, setUncheckedEntries] = useState<Set<string>>(
    new Set(),
  );
  // Track which projects are expanded in approval view
  // Key format: "employeeId-projectId"
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(),
  );
  // Track which category sections are expanded (accordion state)
  // Key format: "employeeId-categoryName" (e.g., "EMP001-Billable")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  // Category Assignment Dialog State
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryDialogData, setCategoryDialogData] = useState<{
    projectId: string;
    projectName: string;
    projectCode: string;
    dayIndex: number;
    dayDate: Date;
    categories: {
      rowId: string;
      udaId: string;
      udaName: string;
      type: string;
      financialLineItem: string;
      billable: string;
      hours: string | null;
      comment: string | null;
      entryMeta?: any;
    }[];
  } | null>(null);
  // Store allocated projects for the logged-in employee
  const [allocatedProjects, setAllocatedProjects] = useState<
    ProjectCatalogItem[]
  >([]);
  // Store flResources for the logged-in employee
  const [userFlResources, setUserFlResources] = useState<any[]>([]);
  // Store allocated employees for a selected project
  const [allocatedEmployees, setAllocatedEmployees] = useState<any[]>([]);
  // State for adding new category in the dialog
  const [selectedCategoryType, setSelectedCategoryType] = useState<
    "" | "Billable" | "Non-Billable"
  >("");
  const [selectedCategoryToAdd, setSelectedCategoryToAdd] = useState("");
  // Store manager projects for approval mode
  const [managerProjects, setManagerProjects] = useState<ProjectCatalogItem[]>(
    [],
  );
  // Loading states for approval mode
  const [isLoadingManagerProjects, setIsLoadingManagerProjects] =
    useState(false);
  const [isLoadingAllocatedEmployees, setIsLoadingAllocatedEmployees] =
    useState(false);
  // Removed: allManagerEmployees feature - only using project-specific employee loading
  // State for project filter dropdown in entry mode
  const [selectedProjectFilter, setSelectedProjectFilter] =
    useState<string>("all");

  const todayStart = startOfDay(new Date());
  const weekStartDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const isFutureWeek = weekStartDate > todayStart;

  // Week calculations - moved here to be available in useEffects
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: startDate, end: endDate });

  const allocationDateMap = useMemo(() => {
    const map = new Map<
      string,
      { start?: Date | string; end?: Date | string }
    >();
    console.log(
      "[Allocation Map] Building map from FL resources:",
      userFlResources.length,
    );
    userFlResources.forEach((fl) => {
      // Use projectId or projectOid as key, matching how projects are identified elsewhere
      const key = fl.projectId || fl.projectOid;
      if (!key) return;
      const startDate = fl.startDate || fl.requestedFromDate;
      const endDate = fl.endDate || fl.requestedToDate;
      console.log(
        `[Allocation Map] Project: ${key}, Start: ${startDate}, End: ${endDate}`,
      );
      map.set(key, {
        start: startDate,
        end: endDate,
      });
    });
    return map;
  }, [userFlResources]);

  const projectCatalogList = projectCatalog as ProjectCatalogItem[];

  const [newEntry, setNewEntry] = useState({
    udaId: "",
    projectId: "",
    isProjectRequired: true,
    flNo: "",
  });

  const resolveBillableGroup = (value?: string) => {
    if (!value) return "Other";
    const normalized = value.toLowerCase();
    if (normalized.includes("non")) return "Non-Billable";
    if (normalized.includes("billable")) return "Billable";
    return "Other";
  };

  // Get unique UDA types for approval filter dropdown
  const uniqueUDATypes = useMemo(() => {
    const configList = configurations || [];
    const types = new Set<string>();
    configList.forEach((config) => {
      const type = config.billable || config.type || config.name;
      if (type) types.add(type);
    });
    return Array.from(types).sort();
  }, [configurations]);

  const categorizedConfigurations = useMemo(() => {
    const configList = configurations || [];
    const grouped = {
      billable: [] as typeof configList,
      nonBillable: [] as typeof configList,
      other: [] as typeof configList,
    };

    configList.forEach((config) => {
      const group = resolveBillableGroup(config.billable || config.type);
      if (group === "Billable") grouped.billable.push(config);
      else if (group === "Non-Billable") grouped.nonBillable.push(config);
      else grouped.other.push(config);
    });

    return grouped;
  }, [configurations]);

  // Filter configurations based on category filter dropdown
  const filteredConfigurations = useMemo(() => {
    if (categoryFilter === "Billable") {
      return categorizedConfigurations.billable;
    } else if (categoryFilter === "Non-Billable") {
      return categorizedConfigurations.nonBillable;
    }
    // Show all categories when "All" is selected
    return [
      ...categorizedConfigurations.billable,
      ...categorizedConfigurations.nonBillable,
    ];
  }, [categorizedConfigurations, categoryFilter]);

  const selectedUDA = useMemo(() => {
    if (!newEntry.udaId) return undefined;
    return (configurations || []).find(
      (c) => (c.id || c._id) === newEntry.udaId,
    );
  }, [configurations, newEntry.udaId]);

  const isBenchSelection =
    (selectedUDA?.name || "").toLowerCase().trim() === "bench";

  const availableProjects = useMemo(() => {
    // Calculate the start of the currently viewed week
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    weekEnd.setHours(23, 59, 59, 999);

    // Use allocatedProjects instead of full projectCatalogList
    // Only show projects assigned to the logged-in employee from flresources
    const projectsToFilter =
      allocatedProjects.length > 0 ? allocatedProjects : [];

    const activeProjects = projectsToFilter.filter((p) => {
      if (!isProjectActive(p)) return false;

      // Check allocation dates from FL resources
      const allocationDates = allocationDateMap.get(p.projectId || p._id);
      if (allocationDates) {
        const allocStart = allocationDates.start
          ? new Date(allocationDates.start)
          : null;
        const allocEnd = allocationDates.end
          ? new Date(allocationDates.end)
          : null;

        if (allocStart) {
          allocStart.setHours(0, 0, 0, 0);
        }
        if (allocEnd) {
          allocEnd.setHours(23, 59, 59, 999);
        }

        console.log(
          `[Project Filter] Project: ${p.projectId}, Allocation: ${allocStart?.toISOString()} to ${allocEnd?.toISOString()}, Week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`,
        );

        // Check if week overlaps with allocation period
        // Week must start on or before allocation end AND end on or after allocation start
        if (allocStart && allocEnd) {
          // If week starts after allocation ends, hide project
          if (weekStart > allocEnd) {
            console.log(
              `[Project Filter] Hiding ${p.projectId} - week starts after allocation ends`,
            );
            return false;
          }
          // If week ends before allocation starts, hide project
          if (weekEnd < allocStart) {
            console.log(
              `[Project Filter] Hiding ${p.projectId} - week ends before allocation starts`,
            );
            return false;
          }
        } else if (allocStart && !allocEnd) {
          // Only start date available - show if week is after start
          if (weekEnd < allocStart) {
            console.log(
              `[Project Filter] Hiding ${p.projectId} - week ends before allocation starts (no end date)`,
            );
            return false;
          }
        } else if (!allocStart && allocEnd) {
          // Only end date available - show if week is before end
          if (weekStart > allocEnd) {
            console.log(
              `[Project Filter] Hiding ${p.projectId} - week starts after allocation ends (no start date)`,
            );
            return false;
          }
        }
        console.log(
          `[Project Filter] Showing ${p.projectId} - week overlaps with allocation`,
        );
      } else {
        console.log(
          `[Project Filter] No allocation dates found for project ${p.projectId}`,
        );
      }

      // Hide project if end date is before the start of the current week
      // If project ends during or after the current week, show it (cells will be disabled individually)
      if (p.projectEndDate) {
        const endDate = new Date(p.projectEndDate);
        endDate.setHours(0, 0, 0, 0);
        if (endDate < weekStart) {
          return false; // Hide project if end date is before the week starts
        }
      }

      return true;
    });

    if (!isBenchSelection) return activeProjects;

    // For bench selection, still allow IPD0002 even if not in allocations
    const benchProject = activeProjects.filter(
      (p) => p.projectId === "IPD0002",
    );
    if (benchProject.length > 0) return benchProject;

    // Fall back to catalog if bench project not in allocations
    const catalogBench = (projectCatalogList || []).find(
      (p) => p.projectId === "IPD0002",
    );
    return catalogBench ? [catalogBench] : [];
  }, [
    allocatedProjects,
    isBenchSelection,
    currentDate,
    projectCatalogList,
    allocationDateMap,
  ]);

  // Sync initialDate prop changes with currentDate state
  useEffect(() => {
    if (initialDate && isReportView) {
      setCurrentDate(initialDate);
    }
  }, [initialDate, isReportView]);

  // Fetch projects where logged-in user is the project manager (for approval mode)
  useEffect(() => {
    const fetchManagerProjects = async () => {
      if (viewMode !== "approval" || !user?.employeeId) {
        setManagerProjects([]);
        return;
      }

      setIsLoadingManagerProjects(true);
      try {
        console.log("🔍 Fetching projects for manager:", user.employeeId);

        // Fetch all projects from database
        const allProjects = await projectService.getAll();
        console.log("📊 Total projects fetched:", allProjects.length);

        // Filter projects where projectManagerEmployeeId matches logged-in user
        const managedProjects = allProjects.filter((project: any) => {
          const projectManagerId =
            project.projectManager?.employeeId ||
            project.projectManagerEmployeeId ||
            "";

          return projectManagerId === user.employeeId;
        });

        console.log(
          "✅ Projects managed by user:",
          managedProjects.length,
          managedProjects,
        );

        // Transform to ProjectCatalogItem format for UI compatibility
        const transformedProjects: ProjectCatalogItem[] = managedProjects.map(
          (project: any) => ({
            _id: project._id,
            projectId: project.projectId,
            projectName: project.projectName || project.name,
            projectManager: project.projectManager?.employeeId || "",
            projectManagerEmployeeId: project.projectManager?.employeeId,
            deliveryManager: project.projectManager?.name || "",
            status: project.status || "active",
            projectStartDate: project.projectStartDate
              ? new Date(project.projectStartDate).toISOString()
              : project.startDate
                ? new Date(project.startDate).toISOString()
                : "",
            projectEndDate: project.projectEndDate
              ? new Date(project.projectEndDate).toISOString()
              : project.endDate
                ? new Date(project.endDate).toISOString()
                : "",
            customerId: "",
            accountName: project.accountName || project.client || "",
            legalEntity: "",
            hubspotDealId: "",
            billingType: "",
            practiceUnit: "",
            region: "",
            industry: "",
            clientType: "",
            revenueType: "",
            projectCurrency: "",
            estimatedValue: project.budget || 0,
            description: project.description || "",
            utilization: project.utilization || 0,
            teamSize: project.teamSize || 0,
            createdAt: "",
            updatedAt: "",
          }),
        );

        setManagerProjects(transformedProjects);
      } catch (error) {
        console.error("❌ Failed to fetch manager projects:", error);
        toast.error("Failed to load managed projects");
        setManagerProjects([]);
      } finally {
        setIsLoadingManagerProjects(false);
      }
    };

    fetchManagerProjects();
  }, [viewMode, user?.employeeId]);

  // Determine which employee list to use for approval mode
  // In approval mode, ONLY show employees from flresources (allocatedEmployees)
  // Do NOT fall back to Employee table
  const employeesForApproval = useMemo(() => {
    if (viewMode === "approval") {
      // Only use allocatedEmployees from flresources, never fall back to activeEmployees
      return allocatedEmployees;
    }
    return activeEmployees;
  }, [viewMode, allocatedEmployees, activeEmployees]);

  useEffect(() => {
    fetchConfigurations();
    fetchFLs();
    fetchHolidays();
    fetchActiveEmployees();
  }, [fetchConfigurations, fetchFLs, fetchHolidays, fetchActiveEmployees]);

  useEffect(() => {
    if (udaConfigError) {
      toast.error(udaConfigError);
    }
  }, [udaConfigError]);

  // Fetch allocated employees when project is selected in approval mode
  useEffect(() => {
    const fetchAllocatedEmployees = async () => {
      if (viewMode !== "approval" || !approvalFilters.projectId) {
        setAllocatedEmployees([]);
        setIsLoadingAllocatedEmployees(false);
        return;
      }

      // If "all" is selected, wait for manager projects to load
      if (approvalFilters.projectId === "all" && isLoadingManagerProjects) {
        console.log("⏳ Waiting for manager projects to load...");
        return;
      }

      setIsLoadingAllocatedEmployees(true);
      try {
        let flResources: any[] = [];

        if (approvalFilters.projectId === "all") {
          // Fetch employees from all manager projects
          console.log("👥 Fetching employees for all projects managed by user");
          console.log("📋 Manager projects count:", managerProjects.length);

          if (managerProjects.length === 0) {
            console.log("⚠️ No projects found for this manager");
            toast.info("No projects assigned to you as manager");
            setAllocatedEmployees([]);
            setIsLoadingAllocatedEmployees(false);
            return;
          }

          for (const project of managerProjects) {
            const projectResources = await flResourceService.getByProjectId(
              project.projectId,
            );
            flResources.push(...projectResources);
          }

          console.log(
            "📊 FL Resources for all projects:",
            flResources.length,
            flResources,
          );
        } else {
          // Fetch employees for specific project
          console.log(
            "👥 Fetching employees for project:",
            approvalFilters.projectId,
          );

          flResources = await flResourceService.getByProjectId(
            approvalFilters.projectId,
          );

          console.log(
            "📊 FL Resources for project:",
            flResources.length,
            flResources,
          );
        }

        if (flResources.length === 0) {
          console.log("⚠️ No employees allocated to selected project(s)");
          // Only show toast for specific project selection, not for 'all'
          if (approvalFilters.projectId !== "all") {
            toast.info("No employees are allocated to this project");
          }
          setAllocatedEmployees([]);
          return;
        }

        // Extract unique employee IDs
        const employeeIds = [...new Set(flResources.map((a) => a.employeeId))];
        console.log("📋 Unique employee IDs:", employeeIds);

        // Build employee list from flresources ONLY (do not use Employee table)
        const employeeData = employeeIds.map((employeeId) => {
          // Get data from FL resource only
          const flResource = flResources.find(
            (r) => r.employeeId === employeeId,
          );

          if (!flResource) {
            console.warn(
              `⚠️ No flresource found for employeeId: ${employeeId}`,
            );
            return null;
          }

          return {
            employeeId: flResource.employeeId,
            resourceName: flResource.resourceName || `Employee ${employeeId}`,
            name: flResource.resourceName || `Employee ${employeeId}`,
            email: "", // Not available in flresources
            designation: flResource.jobRole || flResource.role || "",
            // Additional fields from flresources
            jobRole: flResource.jobRole,
            department: flResource.department,
            utilizationPercentage: flResource.utilizationPercentage,
          };
        });

        const filteredEmployees = employeeData.filter((e) => e !== null);
        console.log(
          "✅ Employees loaded:",
          filteredEmployees.length,
          filteredEmployees,
        );
        setAllocatedEmployees(filteredEmployees);

        // Auto-select all allocated employees
        const allEmployeeIds = filteredEmployees.map((e) => e.employeeId);
        console.log("🔄 Auto-selecting all employees:", allEmployeeIds);

        setApprovalFilters((prev) => ({
          ...prev,
          employeeIds: allEmployeeIds,
        }));

        // Don't auto-expand employees - let user expand as needed
        // Collapse all by default
        setExpandedEmployees(new Set());

        const allCategoryCombinations: string[] = [];
        allEmployeeIds.forEach((empId) => {
          allCategoryCombinations.push(`${empId}-Billable`);
          allCategoryCombinations.push(`${empId}-Non-Billable`);
          allCategoryCombinations.push(`${empId}-Other`);
        });
        setExpandedCategories(new Set(allCategoryCombinations));
      } catch (error) {
        console.error("❌ Failed to fetch allocated employees:", error);
        toast.error("Failed to load employees for selected project");
        setAllocatedEmployees([]);
      } finally {
        setIsLoadingAllocatedEmployees(false);
      }
    };

    fetchAllocatedEmployees();
  }, [
    approvalFilters.projectId,
    viewMode,
    managerProjects,
    isLoadingManagerProjects,
  ]);

  // Removed: loadAllManagerEmployees useEffect - only using project-specific employee loading

  // Auto-load timesheets when employees are selected
  useEffect(() => {
    const managerId = user?.employeeId || user?.id;
    if (
      viewMode === "approval" &&
      approvalFilters.projectId &&
      approvalFilters.employeeIds.length > 0 &&
      managerId &&
      !isLoadingAllocatedEmployees // Wait for employee loading to complete
    ) {
      // Auto-trigger load after a short delay to ensure state is updated
      const timer = setTimeout(() => {
        console.log("🚀 Auto-loading timesheets for selected employees", {
          projectId: approvalFilters.projectId,
          employeeCount: approvalFilters.employeeIds.length,
          employeeIds: approvalFilters.employeeIds,
        });
        loadApprovals();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode,
    approvalFilters.projectId,
    approvalFilters.employeeIds.length,
    isLoadingAllocatedEmployees,
  ]);

  // Calculate total allocation from active rows
  const totalsByDay = useMemo(() => {
    // Calculate total allocation based on unique projects in the current timesheet
    const uniqueProjectIds = Array.from(
      new Set(rows.map((r) => r.projectId).filter((id) => id !== "N/A")),
    );
    const totalAllocation = sumAllocationPercent(
      uniqueProjectIds,
      projectCatalogList,
    );
    const allowedMinutes = getAllowedMinutes(totalAllocation);
    const allowedHoursLabel = formatHoursDecimal(allowedMinutes);
    const allowedTimeLabel = formatMinutesToTime(allowedMinutes);

    return {
      totalAllocation,
      allowedMinutes,
      allowedHoursLabel,
      allowedTimeLabel,
    };
  }, [rows, projectCatalogList]);

  // Group rows by project for consolidated display
  const groupedRows = useMemo(() => {
    const groups: Record<
      string,
      {
        projectId: string;
        projectCode: string;
        projectName: string;
        categories: TimesheetRow[];
      }
    > = {};

    rows.forEach((row) => {
      if (!groups[row.projectId]) {
        groups[row.projectId] = {
          projectId: row.projectId,
          projectCode: row.projectCode,
          projectName: row.projectName,
          categories: [],
        };
      }
      groups[row.projectId].categories.push(row);
    });

    return Object.values(groups);
  }, [rows]);

  // 🔄 Load timesheet function - extracted to be reusable
  const loadTimesheet = async () => {
    if (!user?.employeeId || viewMode !== "entry") return;

    setIsLoading(true);
    setHasSubmittedThisSession(false);
    try {
      const weekStart = format(
        startOfWeek(currentDate, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );

      console.log("🔵 [Employee View] Loading timesheet for week:", weekStart);

      const timesheet = await timesheetService.getTimesheetForWeek(
        user.employeeId,
        weekStart,
      );

      console.log("🔵 [Employee View] Timesheet received:", timesheet);

      if (timesheet) {
        console.log(
          "🔵 [Employee View] Loaded timesheet with entryMeta:",
          timesheet.rows.map((r: any) => ({
            projectId: r.projectId,
            udaId: r.udaId,
            udaName: r.udaName,
            entryMeta: r.entryMeta,
          })),
        );

        // Count revisions in employee view
        const revCount = timesheet.rows.reduce((count: number, row: any) => {
          return (
            count +
            (row.entryMeta?.filter(
              (m: any) => m?.approvalStatus === "revision_requested",
            ).length || 0)
          );
        }, 0);

        console.log("🔵 [Employee View] Revision count:", revCount);

        // 🔔 Send notification to bell icon instead of alert popup
        if (revCount > 0) {
          console.log(
            "🔵 [Employee View] Rows with revisions:",
            timesheet.rows
              .filter((r: any) =>
                r.entryMeta?.some(
                  (m: any) => m?.approvalStatus === "revision_requested",
                ),
              )
              .map((r: any) => ({
                udaName: r.udaName,
                entryMeta: r.entryMeta,
              })),
          );

          // Create notification in bell icon system
          try {
            await notificationService.create({
              userId: user.employeeId,
              role: "EMPLOYEE",
              type: "info" as const,
              title: "Revision Required",
              description: `You have ${revCount} timesheet ${revCount === 1 ? "entry" : "entries"} that ${revCount === 1 ? "needs" : "need"} revision. Please review and update your hours.`,
            });
          } catch (notifError) {
            console.error(
              "Failed to create revision notification:",
              notifError,
            );
          }

          // Also show toast for immediate visibility
          toast.info(
            `⚠️ ${revCount} ${revCount === 1 ? "entry needs" : "entries need"} revision`,
          );
        }

        setRows(
          timesheet.rows.map((row: any) => {
            // Enhanced project lookup: Try catalog first, then allocated, then row data
            const projectFromCatalog = projectCatalogList.find(
              (p) => (p.projectId || p._id) === row.projectId,
            );
            const projectFromAllocated = allocatedProjects.find(
              (p) => (p.projectId || p._id) === row.projectId,
            );

            const projectName =
              projectFromCatalog?.projectName ||
              projectFromAllocated?.projectName ||
              row.projectName ||
              "Unknown Project";

            const projectCode =
              projectFromCatalog?.projectCode ||
              projectFromAllocated?.projectCode ||
              row.projectCode ||
              row.projectId;

            return {
              id: Math.random().toString(36).substring(2, 11),
              projectId: row.projectId,
              projectCode,
              projectName,
              udaId: row.udaId,
              udaName: row.udaName,
              type: row.type || "General",
              financialLineItem: row.financialLineItem,
              billable: row.billable,
              hours: (row.hours || []).map((value: string | null) =>
                normalizeTimeValue(value),
              ),
              comments: row.comments,
              entryMeta: row.entryMeta || new Array(7).fill(null),
            };
          }),
        );
        setTimesheetStatus(timesheet.status);
      } else {
        setRows([]);
        setTimesheetStatus(null);
      }
    } catch (error) {
      console.error("Error loading timesheet:", error);
      toast.error("Failed to load timesheet");
    } finally {
      setIsLoading(false);
    }
  };

  // Load timesheet when week changes or when switching back to entry mode
  useEffect(() => {
    loadTimesheet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user?.employeeId, viewMode, forceReloadCounter]);

  // Auto-reload approval data when week changes in approval mode
  useEffect(() => {
    if (
      viewMode === "approval" &&
      approvalFilters.projectId &&
      approvalFilters.employeeIds.length > 0 &&
      approvalSearchAttempted
    ) {
      console.log("[Week Change] Auto-reloading approval data for new week...");
      loadApprovals();
    }
  }, [currentDate]);

  // Fetch allocated projects for the logged-in employee
  const fetchAllocatedProjects = useCallback(async () => {
    if (!user?.employeeId) {
      console.log("❌ No user employeeId found");
      return;
    }

    console.log(
      "🔍 Fetching allocated projects for employee:",
      user.employeeId,
    );

    try {
      // Get FL resources for the logged-in employee
      const flResources = await flResourceService.getByEmployeeId(
        user.employeeId,
      );

      console.log("📊 FL Resources received:", flResources);
      console.log("📊 Number of FL resources:", flResources.length);

      // Store flResources for flNo lookup later
      setUserFlResources(flResources);

      if (flResources.length === 0) {
        console.warn("⚠️ No FL resources found for employee:", user.employeeId);
        toast.warning(
          `No project allocations found for ${user.employeeId}. Please contact your manager.`,
        );
        setAllocatedProjects([]);
        return;
      }

      // Extract unique project IDs from FL resources
      // Try projectId first, fallback to projectOid if projectId is missing
      const projectIds = [
        ...new Set(
          flResources.map((a) => a.projectId || a.projectOid).filter(Boolean),
        ),
      ];
      console.log("📋 Project IDs from FL resources:", projectIds);
      console.log(
        "📋 FL Resources raw data:",
        flResources.map((fl) => ({
          flNo: fl.flNo,
          projectId: fl.projectId,
          projectOid: fl.projectOid,
          employeeId: fl.employeeId,
        })),
      );

      if (projectIds.length === 0) {
        console.error("❌ No valid project IDs found in FL resources");
        console.error(
          "🔍 FL Resources details:",
          flResources.map((fl) => ({
            flNo: fl.flNo,
            flName: fl.flName,
            projectId: fl.projectId,
            projectOid: fl.projectOid,
            employeeId: fl.employeeId,
          })),
        );
        toast.error(
          "Project allocations found but missing project IDs. Please contact your administrator to update Financial Line data.",
          { duration: 6000 },
        );
        setAllocatedProjects([]);
        return;
      }

      // Fetch project details for each projectId from the projects collection
      const projectPromises = projectIds.map(async (projectId) => {
        console.log(`🔎 Looking for project: ${projectId}`);
        try {
          // Find the FL resource for this project to get allocation info
          const flResource = flResources.find(
            (a) => (a.projectId || a.projectOid) === projectId,
          );

          // First try to find in projectCatalogList
          const catalogProject = projectCatalogList?.find(
            (p) => (p.projectId || p._id) === projectId,
          );

          if (catalogProject) {
            console.log(
              `✅ Found project ${projectId} in catalog:`,
              catalogProject.projectName,
            );

            // Ensure we have a valid project name
            const projectName =
              catalogProject.projectName ||
              catalogProject.projectId ||
              projectId;

            return {
              ...catalogProject,
              projectName, // Ensure projectName is set
              projectCode:
                catalogProject.projectCode ||
                catalogProject.projectId ||
                projectId,
              allocationPercentage:
                flResource?.utilizationPercentage ||
                flResource?.allocation ||
                0,
            };
          }

          console.log(`⚠️ Project ${projectId} not in catalog, trying API...`);

          // If not in catalog, try to get from API
          const project = await projectService.getByProjectId(projectId);
          console.log(`✅ Found project ${projectId} via API:`, project);

          // API returns 'name' field from database schema (not projectName)
          const projectName = project.name || projectId;
          const projectCode = projectId; // API doesn't have projectCode, use projectId

          console.log(`📝 Mapped API project: ${projectId} => ${projectName}`);

          return {
            _id: project._id || projectId,
            projectId: projectId,
            projectCode,
            projectName,
            projectManager: project.projectManager?.employeeId || "",
            projectManagerEmployeeId: project.projectManager?.employeeId,
            deliveryManager: project.projectManager?.name || "",
            status: project.status || "active",
            projectStartDate: project.startDate
              ? new Date(project.startDate).toISOString()
              : "",
            projectEndDate: project.endDate
              ? new Date(project.endDate).toISOString()
              : "",
            allocationPercentage:
              flResource?.utilizationPercentage || flResource?.allocation || 0,
            // Add empty values for required fields not available from API
            customerId: "",
            accountName: project.client || "",
            legalEntity: "",
            hubspotDealId: "",
            billingType: "",
            practiceUnit: "",
            region: "",
            industry: "",
            clientType: "",
            revenueType: "",
            projectCurrency: "",
            estimatedValue: project.budget || 0,
            description: project.description || "",
            utilization: project.utilization || 0,
            teamSize: project.teamSize || 0,
            createdAt: "",
            updatedAt: "",
          } as ProjectCatalogItem;
        } catch (error) {
          console.error(`❌ Error fetching project ${projectId}:`, error);

          // Log detailed error information
          if (error instanceof Error) {
            console.error(`   Error message: ${error.message}`);
            console.error(`   Error name: ${error.name}`);
          }

          console.warn(`⚠️ Creating fallback project entry for ${projectId}`);

          // Create a fallback project entry even if API fails
          const flResource = flResources.find(
            (a) => (a.projectId || a.projectOid) === projectId,
          );
          return {
            _id: projectId,
            projectId: projectId,
            projectCode: projectId,
            projectName: `Project ${projectId}`, // Fallback name
            projectManager: "",
            projectManagerEmployeeId: "",
            deliveryManager: "",
            status: "Active",
            projectStartDate: "",
            projectEndDate: "",
            allocationPercentage:
              flResource?.utilizationPercentage || flResource?.allocation || 0,
            customerId: "",
            accountName: "",
            legalEntity: "",
            hubspotDealId: "",
            billingType: "",
            practiceUnit: "",
            region: "",
            industry: "",
            clientType: "",
            revenueType: "",
            projectCurrency: "",
            estimatedValue: 0,
            description: `Fallback entry for project ${projectId}`,
            utilization: 0,
            teamSize: 0,
            createdAt: "",
            updatedAt: "",
          } as ProjectCatalogItem;
        }
      });

      const projects = (await Promise.all(projectPromises)).filter(
        (p): p is ProjectCatalogItem => p !== null,
      );

      console.log("✅ Final allocated projects:", projects);
      console.log(
        "✅ Project names:",
        projects.map((p) => `${p.projectId}: ${p.projectName}`),
      );
      console.log("✅ Number of projects loaded:", projects.length);

      if (projects.length === 0) {
        toast.error(
          `Projects found in allocations (${projectIds.join(", ")}) could not be loaded. Please check project data.`,
        );
      } else {
        console.log(
          "🎉 Successfully loaded",
          projects.length,
          "allocated projects",
        );
        toast.success(
          `✅ Loaded ${projects.length} project(s): ${projects.map((p) => p.projectName).join(", ")}`,
        );
      }

      setAllocatedProjects(projects);
    } catch (error: any) {
      console.error("❌ Failed to fetch allocated projects:", error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error(`   Error message: ${error.message}`);
        console.error(`   Error stack: ${error.stack}`);
      }

      // Handle 429 rate limiting error
      if (error?.response?.status === 429) {
        toast.error("Too many requests. Please wait a moment and try again.", {
          duration: 5000,
        });
      } else {
        toast.error(
          `Failed to load allocated projects: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
      setAllocatedProjects([]);
    }
  }, [user?.employeeId, projectCatalogList]);

  // Fetch allocated projects when user changes
  useEffect(() => {
    fetchAllocatedProjects();
  }, [fetchAllocatedProjects]);

  // Debug: Log when allocatedProjects state changes
  useEffect(() => {
    console.log("🔄 allocatedProjects state updated:", {
      count: allocatedProjects.length,
      projects: allocatedProjects.map((p) => ({
        projectId: p.projectId,
        projectName: p.projectName,
        projectCode: p.projectCode,
      })),
    });
  }, [allocatedProjects]);

  const handlePrevWeek = () => {
    // Clear previous data and selections when changing week
    setApprovalTimesheets({});
    setApprovalTimesheet(null);
    setMultiEmployeeSelections(new Set());
    setSelectedDaysForApproval(new Set());
    setSelectedEmployees(new Set());
    setRows([]); // Clear timesheet rows
    setSelectedProjectFilter("all"); // Reset project filter
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    // Clear previous data and selections when changing week
    setApprovalTimesheets({});
    setApprovalTimesheet(null);
    setMultiEmployeeSelections(new Set());
    setSelectedDaysForApproval(new Set());
    setSelectedEmployees(new Set());
    setRows([]); // Clear timesheet rows
    setSelectedProjectFilter("all"); // Reset project filter
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  //const handleToday = () => setCurrentDate(new Date());

  const handleAddAssignment = () => {
    const configList = configurations || [];
    // Use allocatedProjects first (has API data), then fall back to projectCatalogList
    const projectList =
      allocatedProjects.length > 0
        ? allocatedProjects
        : projectCatalogList || [];
    const flsList = fls || [];

    const selectedUDA = configList.find(
      (c) => (c.id || c._id) === newEntry.udaId,
    );
    if (!selectedUDA) {
      toast.error("Please select a valid category");
      return;
    }

    if (selectedUDA.projectRequired !== "N" && !newEntry.projectId) {
      toast.error(
        `A project is required for the category: ${selectedUDA.name}`,
      );
      return;
    }

    // Find project from allocatedProjects first, then projectCatalogList
    const selectedProject = projectList.find(
      (p) => (p.projectId || p._id) === newEntry.projectId,
    );

    console.log("📝 Adding assignment:", {
      projectId: newEntry.projectId,
      selectedProject,
      projectName:
        selectedProject?.projectName || selectedProject?.name || "No Project",
      allocatedProjectsCount: allocatedProjects.length,
      catalogProjectsCount: projectCatalogList?.length || 0,
    });

    const selectedFL = flsList.find((f) => {
      const pid =
        typeof f.projectId === "string" ? f.projectId : f.projectId?._id;
      return pid === newEntry.projectId;
    });

    const newRow: TimesheetRow = {
      id: Math.random().toString(36).substring(2, 11),
      projectId: newEntry.projectId || "N/A",
      projectCode:
        selectedProject?.projectCode || selectedProject?.projectId || "N/A",
      projectName:
        selectedProject?.projectName || selectedProject?.name || "No Project",
      udaId: newEntry.udaId,
      udaName: selectedUDA.name,
      type: selectedUDA.type || "General",
      financialLineItem: (() => {
        if (selectedFL) {
          return `${selectedFL.flNo} (${selectedFL.flName})`;
        }
        if (newEntry.projectId) {
          return "No FLI Found";
        }
        return "N/A";
      })(),
      billable: selectedUDA.billable || "Non-Billable",
      hours: new Array(7).fill("00:00"),
      comments: new Array(7).fill(null),
    };

    setRows([...rows, newRow]);
    setIsAddEntryOpen(false);
    setNewEntry({
      udaId: "",
      projectId: "",
      isProjectRequired: true,
      flNo: "",
    });
    toast.success("Assignment added");
  };

  const openDeleteDialog = (row: TimesheetRow) => {
    if (timesheetStatus === "approved") return;
    setDeleteRowId(row.id);
    setDeleteRowLabel(row.udaName);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRow = async () => {
    if (!deleteRowId || !user?.employeeId) return;

    const rowToDelete = rows.find((r) => r.id === deleteRowId);
    if (!rowToDelete) return;

    try {
      const weekStart = format(startDate, "yyyy-MM-dd");

      console.log("[Delete Row] Deleting row:", {
        employeeId: user.employeeId,
        weekStartDate: weekStart,
        projectId: rowToDelete.projectId,
        udaId: rowToDelete.udaId,
        udaName: rowToDelete.udaName,
      });

      // Call backend API to delete entries from database
      const result = await timesheetService.deleteRow({
        employeeId: user.employeeId,
        weekStartDate: weekStart,
        projectId: rowToDelete.projectId,
        udaId: rowToDelete.udaId,
      });

      console.log("[Delete Row] Backend response:", result);

      // Remove from UI
      setRows((prev) => prev.filter((r) => r.id !== deleteRowId));
      toast.success(
        `Deleted ${rowToDelete.udaName} successfully (${result.deletedCount} entries)`,
      );
    } catch (error: any) {
      console.error("[Delete Row] Error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete row";
      toast.error(errorMsg);
    } finally {
      setDeleteRowId(null);
      setDeleteRowLabel("");
      setDeleteDialogOpen(false);
    }
  };

  const handleHourChange = (rowId: string, dayIdx: number, value: string) => {
    const cellKey = `${rowId}-${dayIdx}`;
    const normalized = normalizeTimeInput(value);
    if (!normalized) {
      setCellErrors((prev) => ({
        ...prev,
        [cellKey]: "Use HH:mm format",
      }));
      return;
    }

    const minutes = parseTimeToMinutes(normalized);
    if (minutes === null) {
      setCellErrors((prev) => ({
        ...prev,
        [cellKey]: "Use HH:mm format",
      }));
      return;
    }

    // Remove allocation-based validation - user can enter any hours
    setCellErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[cellKey];
      return newErrors;
    });

    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          const newHours = [...row.hours];
          newHours[dayIdx] = normalized;
          return { ...row, hours: newHours };
        }
        return row;
      }),
    );
  };

  // Copy project day hours to remaining days (all categories)
  const handleCopyProjectDayHours = (
    projectId: string,
    sourceDayIdx: number,
  ) => {
    // Find all rows for this project
    const projectRows = rows.filter((r) => r.projectId === projectId);
    if (projectRows.length === 0) return;

    // Find project to check end date
    const project = projectCatalogList.find(
      (p) => (p.projectId || p._id) === projectId,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let copiedCount = 0;
    setRows(
      rows.map((r) => {
        // Only copy for rows belonging to this project
        if (r.projectId === projectId) {
          const sourceValue = r.hours[sourceDayIdx];
          const sourceComment = r.comments[sourceDayIdx] || "";
          if (
            !sourceValue ||
            sourceValue === "00:00" ||
            sourceValue === "0:00"
          ) {
            return r;
          }

          const newHours = [...r.hours];
          const newComments = [...r.comments];
          // Copy to remaining days (after current day), skipping weekends, holidays, future dates, and days after project end
          for (let i = sourceDayIdx + 1; i < 7; i++) {
            const dayDate = weekDays[i];
            const isWeekendDay = isWeekend(dayDate);
            const isHolidayDay = isHoliday(dayDate);
            const isFutureDate = dayDate > today;

            // Check if day is after project end date
            let isAfterProjectEnd = false;
            if (project?.projectEndDate) {
              const endDate = new Date(project.projectEndDate);
              endDate.setHours(23, 59, 59, 999);
              if (dayDate > endDate) {
                isAfterProjectEnd = true;
              }
            }

            // Only copy if not weekend, not holiday, not future date, and not after project end
            if (
              !isWeekendDay &&
              !isHolidayDay &&
              !isFutureDate &&
              !isAfterProjectEnd
            ) {
              newHours[i] = sourceValue;
              newComments[i] = sourceComment;
              if (i === sourceDayIdx + 1) copiedCount++; // Count once per day
            }
          }
          return { ...r, hours: newHours, comments: newComments };
        }
        return r;
      }),
    );

    if (copiedCount > 0) {
      toast.success(
        `✓ Copied hours and comments for all categories to ${copiedCount} day${copiedCount > 1 ? "s" : ""}`,
      );
    }
  };

  const handleCopyHours = (rowId: string, sourceDayIdx: number) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    const sourceValue = row.hours[sourceDayIdx];
    if (!sourceValue || sourceValue === "00:00" || sourceValue === "0:00") {
      // No toast for empty copy attempt - silent fail
      return;
    }

    // Find project to check end date
    const project = projectCatalogList.find(
      (p) => (p.projectId || p._id) === row.projectId,
    );

    let copiedCount = 0;
    setRows(
      rows.map((r) => {
        if (r.id === rowId) {
          const newHours = [...r.hours];
          // Copy to remaining days (after current day), skipping weekends, holidays, approved/disabled days, and days after project end
          for (let i = sourceDayIdx + 1; i < 7; i++) {
            const dayDate = weekDays[i];
            const isWeekendDay = isWeekend(dayDate);
            const isHolidayDay = isHoliday(dayDate);
            const isApproved = r.entryMeta?.[i]?.status === "approved";

            // Check if day is after project end date
            let isAfterProjectEnd = false;
            if (project?.projectEndDate) {
              const endDate = new Date(project.projectEndDate);
              endDate.setHours(23, 59, 59, 999);
              if (dayDate > endDate) {
                isAfterProjectEnd = true;
              }
            }

            // Only copy if not weekend, not holiday, not approved, and not after project end
            if (
              !isWeekendDay &&
              !isHolidayDay &&
              !isApproved &&
              !isAfterProjectEnd
            ) {
              newHours[i] = sourceValue;
              copiedCount++;
            }
          }
          return { ...r, hours: newHours };
        }
        return r;
      }),
    );

    if (copiedCount > 0) {
      toast.success(
        `✓ Copied ${sourceValue} to ${copiedCount} day${copiedCount > 1 ? "s" : ""}`,
      );
    }
    // Silent fail if no eligible days - no distracting messages
  };

  const handleCommentChange = (
    rowId: string,
    dayIdx: number,
    value: string,
  ) => {
    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          const newComments = [...row.comments];
          newComments[dayIdx] = value;
          return { ...row, comments: newComments };
        }
        return row;
      }),
    );
  };

  // Open category detail dialog for a specific project and day
  const handleOpenCategoryDialog = (projectId: string, dayIndex: number) => {
    const projectGroup = groupedRows.find((g) => g.projectId === projectId);
    if (!projectGroup) return;

    const dayDate = weekDays[dayIndex];

    // Enhanced project lookup: Try allocatedProjects first, then projectCatalogList, then fall back to grouped data
    const projectFromAllocated = allocatedProjects.find(
      (p) => (p.projectId || p._id) === projectId,
    );
    const projectFromCatalog = projectCatalogList.find(
      (p) => (p.projectId || p._id) === projectId,
    );

    const projectName =
      projectFromAllocated?.projectName ||
      projectFromCatalog?.projectName ||
      projectGroup.projectName ||
      "No Project";

    const projectCode =
      projectFromAllocated?.projectCode ||
      projectFromCatalog?.projectCode ||
      projectGroup.projectCode ||
      projectId;

    const categories = projectGroup.categories
      .filter((row) => {
        // Filter out placeholder rows
        if (row.udaName === "Select UDA") return false;

        // Show all categories for this project, not just those with hours
        // This allows users to add hours to empty categories
        return true;
      })
      .map((row) => ({
        rowId: row.id,
        udaId: row.udaId,
        udaName: row.udaName,
        type: row.type,
        financialLineItem: row.financialLineItem,
        billable: row.billable,
        hours: row.hours[dayIndex],
        comment: row.comments[dayIndex],
        entryMeta: row.entryMeta?.[dayIndex],
      }))
      .filter((cat) => {
        // Only show categories that either:
        // 1. Have hours entered for this day, OR
        // 2. Are not approved (so users can add hours to them)
        const hasHours =
          cat.hours &&
          cat.hours !== "00:00" &&
          cat.hours !== "0:00" &&
          cat.hours !== "0";
        const isApproved = cat.entryMeta?.approvalStatus === "approved";
        return hasHours || !isApproved;
      });

    setCategoryDialogData({
      projectId: projectGroup.projectId,
      projectName,
      projectCode,
      dayIndex,
      dayDate,
      categories,
    });
    setCategoryDialogOpen(true);
  };

  // Update hours for a specific category in the dialog
  const handleCategoryHourChange = (rowId: string, value: string) => {
    if (!categoryDialogData) return;

    const cellKey = `${rowId}-${categoryDialogData.dayIndex}`;
    const normalized = normalizeTimeInput(value);
    if (!normalized) {
      setCellErrors((prev) => ({
        ...prev,
        [cellKey]: "Use HH:mm format",
      }));
      return;
    }

    const minutes = parseTimeToMinutes(normalized);
    if (minutes === null) {
      setCellErrors((prev) => ({
        ...prev,
        [cellKey]: "Use HH:mm format",
      }));
      return;
    }

    setCellErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[cellKey];
      return newErrors;
    });

    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          const newHours = [...row.hours];
          newHours[categoryDialogData.dayIndex] = normalized;
          return { ...row, hours: newHours };
        }
        return row;
      }),
    );

    // Update the dialog data as well
    setCategoryDialogData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.rowId === rowId ? { ...cat, hours: normalized } : cat,
        ),
      };
    });
  };

  // Update comment for a specific category in the dialog
  const handleCategoryCommentChange = (rowId: string, value: string) => {
    if (!categoryDialogData) return;

    setRows(
      rows.map((row) => {
        if (row.id === rowId) {
          const newComments = [...row.comments];
          newComments[categoryDialogData.dayIndex] = value;
          return { ...row, comments: newComments };
        }
        return row;
      }),
    );

    // Update the dialog data as well
    setCategoryDialogData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.rowId === rowId ? { ...cat, comment: value } : cat,
        ),
      };
    });
  };

  const calculateRowTotal = (hours: (string | null)[]) => {
    return hours.reduce((sum, h) => {
      const val = Number.parseFloat(h?.replace(":", ".") || "0") || 0;
      return sum + val;
    }, 0);
  };

  const handleSubmitWeek = async () => {
    if (!user?.employeeId || !user?.name) {
      toast.error("User information not available");
      return;
    }

    if (rows.length === 0) {
      toast.error("Cannot submit empty timesheet");
      return;
    }

    // Check if there are any non-approved entries to submit
    const hasNonApprovedHours = rows.some((row) =>
      row.hours.some((h, dayIdx) => {
        const isApproved =
          row.entryMeta?.[dayIdx]?.approvalStatus === "approved";
        return !isApproved && h && h !== "00:00" && h !== "0:00";
      }),
    );

    if (!hasNonApprovedHours) {
      toast.error("No non-approved entries to submit");
      return;
    }

    // Validate that each filled NON-APPROVED day has at least 8 hours
    const dayTotals = new Array(7).fill(0);
    const dayHasNonApprovedEntries = new Array(7).fill(false);

    rows.forEach((row) => {
      row.hours.forEach((hours, dayIndex) => {
        const isApproved =
          row.entryMeta?.[dayIndex]?.approvalStatus === "approved";

        if (!isApproved && hours && hours !== "00:00" && hours !== "0:00") {
          dayHasNonApprovedEntries[dayIndex] = true;
          const minutes = parseTimeToMinutes(hours);
          if (minutes) {
            dayTotals[dayIndex] += minutes;
          }
        }
      });
    });

    // Check each filled day for minimum 8 hours (480 minutes)
    // Only validate days that have non-approved entries
    const invalidDays: string[] = [];
    dayTotals.forEach((totalMinutes, dayIndex) => {
      if (dayHasNonApprovedEntries[dayIndex] && totalMinutes < 480) {
        const dayName = format(weekDays[dayIndex], "EEEE (MMM dd)");
        const hoursWorked = formatMinutesToTime(totalMinutes);
        invalidDays.push(`${dayName}: ${hoursWorked}`);
      }
    });

    if (invalidDays.length > 0) {
      setInvalidDaysList(invalidDays);
      setValidationDialogOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      const weekEnd = format(endDate, "yyyy-MM-dd");

      // Filter rows to only include non-approved entries
      const preparedRows = rows
        .map(({ id, ...row }) => {
          // For each day, check if it's approved
          const filteredHours = row.hours.map((h, dayIdx) => {
            const isApproved =
              row.entryMeta?.[dayIdx]?.approvalStatus === "approved";
            // If approved, set to "00:00" to skip submitting
            return isApproved ? "00:00" : h;
          });

          const filteredComments = row.comments.map((c, dayIdx) => {
            const isApproved =
              row.entryMeta?.[dayIdx]?.approvalStatus === "approved";
            // If approved, clear comment to skip submitting
            return isApproved ? "" : c;
          });

          // Check if this row has any non-approved hours
          const hasNonApprovedHours = filteredHours.some(
            (h) => h && h !== "00:00" && h !== "0:00",
          );

          if (!hasNonApprovedHours) {
            return null; // Skip this row entirely if all days are approved
          }

          return {
            projectId: row.projectId || "N/A",
            projectCode: row.projectCode,
            projectName: row.projectName,
            udaId: row.udaId,
            udaName: row.udaName,
            type: row.type || "General",
            financialLineItem: row.financialLineItem,
            billable: row.billable,
            hours: filteredHours,
            comments: filteredComments,
          };
        })
        .filter(Boolean); // Remove null entries

      const payload = {
        employeeId: user.employeeId,
        employeeName: user.name,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        rows: preparedRows as any,
        status: "submitted" as const,
        totalHours: 0, // Will be calculated on backend
      };

      console.log(
        "Submitting timesheet with payload:",
        JSON.stringify(payload, null, 2),
      );
      console.log("Number of rows:", preparedRows.length);
      console.log("First row sample:", preparedRows[0]);

      await timesheetService.submitTimesheet(payload);

      // Send notifications to project managers
      const uniqueProjects = [...new Set(rows.map((row) => row.projectId))];
      for (const projectId of uniqueProjects) {
        const project = projectCatalogList.find(
          (p) => p.projectId === projectId,
        );
        const managerEmployeeId = project?.projectManagerEmployeeId;

        if (managerEmployeeId && managerEmployeeId !== user.employeeId) {
          try {
            await notificationService.create({
              userId: managerEmployeeId,
              role: "MANAGER",
              type: "approval" as const,
              title: "Timesheet Submitted for Approval",
              description: `${user.name} (${user.employeeId}) has submitted timesheet for week ${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")} for project ${project.projectName}`,
            });
          } catch (notifError) {
            console.error("Failed to send notification:", notifError);
          }
        }
      }

      // Only set status to submitted if there are no more approved entries
      // If there are still approved entries, keep the mixed status
      const hasApprovedEntries = rows.some((row) =>
        row.entryMeta?.some((meta) => meta?.approvalStatus === "approved"),
      );

      if (!hasApprovedEntries) {
        setTimesheetStatus("submitted");
      }
      setHasSubmittedThisSession(true);

      // 🔄 Refresh timesheet from server to show updated hours and status
      // This ensures revision indicators are cleared and new hours are displayed
      console.log("✅ [Submit Success] Reloading timesheet from server...");
      await loadTimesheet();

      toast.success(
        `Non-approved entries submitted successfully for Employee ID: ${user.employeeId}`,
      );
    } catch (error: any) {
      console.error("Error submitting timesheet:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit timesheet";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 🚫 DISABLED: handleRecallTimesheet - Removed "Recall for Edit" button
  // Reason: Employees can directly edit revision-requested entries without needing to recall
  // The recall feature was confusing since fields are already editable when revision is requested
  /* 
  const handleRecallTimesheet = async () => {
    if (!user?.employeeId) {
      toast.error("User information not available");
      return;
    }

    setIsSaving(true);
    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      const weekEnd = format(endDate, "yyyy-MM-dd");

      // Prepare rows data by removing client-side id
      const preparedRows = rows.map(({ id, ...row }) => ({
        projectId: row.projectId || "N/A",
        projectCode: row.projectCode,
        projectName: row.projectName,
        udaId: row.udaId,
        udaName: row.udaName,
        type: row.type || "General",
        financialLineItem: row.financialLineItem,
        billable: row.billable,
        hours: row.hours,
        comments: row.comments,
      }));

      const payload = {
        employeeId: user.employeeId,
        employeeName: user.name || "",
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        rows: preparedRows,
        status: "draft" as const,
        totalHours: 0,
      };

      console.log(
        "Recalling timesheet with payload:",
        JSON.stringify(payload, null, 2),
      );
      await timesheetService.saveDraft(payload);

      setTimesheetStatus("draft");
      setHasSubmittedThisSession(false);
      toast.success("Timesheet recalled. You can now edit and resubmit.");
    } catch (error: any) {
      console.error("Error recalling timesheet:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to recall timesheet";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };
  */

  const canLoadApprovals =
    approvalFilters.projectId && approvalFilters.employeeIds.length > 0;

  const loadApprovals = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId) {
      toast.error("User information not available");
      return;
    }
    if (!canLoadApprovals) {
      toast.error("Select project and employees to load approvals");
      return;
    }

    // Clear previous data before loading new search
    setApprovalTimesheets({});
    setApprovalTimesheet(null);
    setIsApprovalLoading(true);
    setApprovalSearchAttempted(true);

    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      console.log("[Frontend] Loading approvals for week:", weekStart);
      console.log("[Frontend] Loading approvals with filters:", {
        projectId: approvalFilters.projectId,
        employeeCount: approvalFilters.employeeIds.length,
        employeeIds: approvalFilters.employeeIds,
        managerId,
      });

      const timesheetsByEmployee: Record<string, ApprovalTimesheet | null> = {};

      // Load timesheets for all selected employees
      // Note: We don't filter by allocation dates here because managers need to see
      // historical timesheets even if allocations have ended
      for (const employeeId of approvalFilters.employeeIds) {
        console.log(
          `[Frontend] Fetching timesheet for employee ${employeeId}, project: ${approvalFilters.projectId}`,
        );
        const data = await timesheetService.getApproverTimesheet({
          managerId,
          projectId: approvalFilters.projectId,
          employeeId: employeeId,
          weekStartDate: weekStart,
        });
        console.log(
          `[Frontend] Received timesheet for ${employeeId}:`,
          data ? "Found" : "Not found",
        );
        timesheetsByEmployee[employeeId] = data;
      }

      setApprovalTimesheets(timesheetsByEmployee);

      // For backward compatibility, set first employee as primary
      if (approvalFilters.employeeIds.length > 0) {
        setApprovalTimesheet(
          timesheetsByEmployee[approvalFilters.employeeIds[0]],
        );
      }

      const foundCount = Object.values(timesheetsByEmployee).filter(
        (t) => t !== null,
      ).length;
      if (foundCount === 0) {
        toast.message("No submitted timesheets found for selected employees");
      } else {
        toast.success(`Loaded ${foundCount} timesheet(s) for approval`);
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
      toast.error("Failed to load approvals");
      setApprovalTimesheets({});
      setApprovalTimesheet(null);
    } finally {
      setIsApprovalLoading(false);
    }
  };

  const handleApproveWeek = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId || !approvalTimesheet) return;
    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      // Use first employee for single employee approval
      const employeeId =
        approvalFilters.employeeIds[0] || approvalTimesheet.employeeId;
      await timesheetService.approveWeek({
        managerId,
        projectId: approvalFilters.projectId,
        employeeId: employeeId,
        weekStartDate: weekStart,
      });
      toast.success("Week approved successfully");
      loadApprovals();
    } catch (error) {
      console.error("Error approving week:", error);
      toast.error("Failed to approve week");
    }
  };

  const handleBulkApprove = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId) return;

    // Check if we're in multi-employee mode or single employee mode
    const isMultiEmployeeMode = approvalFilters.employeeIds.length > 1;

    if (isMultiEmployeeMode) {
      // Multi-employee mode: Approve pending entries for selected employees
      if (selectedEmployees.size === 0) {
        toast.error("Please select at least one employee using the checkbox");
        return;
      }

      // Check if specific days are selected via selectedDaysForApproval OR selectedEntries
      const hasSpecificDaysSelected = selectedDaysForApproval.size > 0;
      const hasSelectedEntries = selectedEntries.size > 0;

      try {
        const weekStart = format(startDate, "yyyy-MM-dd");
        let successCount = 0;
        let employeeCount = 0;

        // Approve entries for each selected employee
        for (const employeeId of selectedEmployees) {
          const empTimesheet = approvalTimesheets[employeeId];
          if (!empTimesheet || !empTimesheet.rows) continue;

          let dayIndicesSet = new Set<number>();

          // If individual entries are selected, map them to day indices
          if (hasSelectedEntries) {
            const filteredRows = empTimesheet.rows.filter((row) => {
              if (approvalProjectTypeFilter === "all") return true;
              const rowType = row.type || row.billable || row.udaName;
              return rowType === approvalProjectTypeFilter;
            });

            let entryCounter = 0;
            filteredRows.forEach((row) => {
              row.hours.forEach((h, hIdx) => {
                if (h && h !== "00:00" && h !== "0:00") {
                  const entryKey = `${employeeId}-${entryCounter}`;
                  const meta = row.entryMeta?.[hIdx];
                  const isPending = meta?.approvalStatus === "pending";

                  // Check if this entry is selected (or if employee checkbox is checked and entry is not explicitly unchecked)
                  const isSelected =
                    selectedEntries.has(entryKey) ||
                    (selectedEmployees.has(employeeId) &&
                      !uncheckedEntries.has(entryKey));

                  if (isSelected && isPending) {
                    dayIndicesSet.add(hIdx);
                  }
                  entryCounter++;
                }
              });
            });
          } else if (hasSpecificDaysSelected) {
            // Only approve the specifically selected days
            empTimesheet.rows.forEach((row) => {
              row.hours.forEach((h, dayIdx) => {
                // Check if this day is in the selected days
                if (!selectedDaysForApproval.has(dayIdx)) return;

                const meta = row.entryMeta?.[dayIdx];
                const hasEntry = h && h !== "00:00" && h !== "0:00";
                const isPending = meta?.approvalStatus === "pending";
                if (hasEntry && isPending) {
                  dayIndicesSet.add(dayIdx);
                }
              });
            });
          } else {
            // Approve all pending days
            empTimesheet.rows.forEach((row) => {
              row.hours.forEach((h, dayIdx) => {
                const meta = row.entryMeta?.[dayIdx];
                const hasEntry = h && h !== "00:00" && h !== "0:00";
                const isPending = meta?.approvalStatus === "pending";
                if (hasEntry && isPending) {
                  dayIndicesSet.add(dayIdx);
                }
              });
            });
          }

          if (dayIndicesSet.size > 0) {
            const dayArray = Array.from(dayIndicesSet).sort((a, b) => a - b);
            await timesheetService.bulkApproveSelectedDays({
              managerId,
              projectId:
                approvalFilters.projectId === "all"
                  ? empTimesheet.rows[0]?.projectId || approvalFilters.projectId
                  : approvalFilters.projectId,
              employeeId,
              weekStartDate: weekStart,
              dayIndices: dayArray,
            });
            successCount += dayArray.length;
            employeeCount++;
          }
        }

        if (successCount === 0) {
          toast.info(
            hasSpecificDaysSelected || hasSelectedEntries
              ? "No pending entries found for selected employees on selected days"
              : "No pending entries found for selected employees",
          );
        } else {
          toast.success(
            `Approved ${successCount} day(s) across ${employeeCount} employee(s)`,
          );
        }
        setSelectedEmployees(new Set());
        setSelectedEntries(new Set());
        setUncheckedEntries(new Set());
        if (hasSpecificDaysSelected) {
          setSelectedDaysForApproval(new Set());
        }
        loadApprovals();
      } catch (error) {
        console.error("Error bulk approving:", error);
        toast.error("Failed to approve selected days");
      }
    } else {
      // Single employee mode: use selectedDaysForApproval
      if (!approvalTimesheet) {
        toast.error("No timesheet loaded");
        return;
      }

      if (selectedDaysForApproval.size === 0) {
        toast.error("Please select at least one day to approve");
        return;
      }

      try {
        const weekStart = format(startDate, "yyyy-MM-dd");
        const dayIndices = Array.from(selectedDaysForApproval).sort(
          (a, b) => a - b,
        );
        const employeeId =
          approvalFilters.employeeIds[0] || approvalTimesheet.employeeId;

        await timesheetService.bulkApproveSelectedDays({
          managerId,
          projectId: approvalFilters.projectId,
          employeeId: employeeId,
          weekStartDate: weekStart,
          dayIndices,
        });

        toast.success(`Approved ${dayIndices.length} day(s) successfully`);
        setSelectedDaysForApproval(new Set());
        loadApprovals();
      } catch (error) {
        console.error("Error bulk approving:", error);
        toast.error("Failed to approve selected days");
      }
    }
  };

  const handleBulkRevert = async () => {
    // Open rejection dialog instead of prompt
    const isMultiEmployeeMode = approvalFilters.employeeIds.length > 1;

    if (isMultiEmployeeMode) {
      if (selectedEmployees.size === 0) {
        toast.error("Please select at least one employee using the checkbox");
        return;
      }
    } else {
      if (selectedDaysForApproval.size === 0) {
        toast.error("Please select at least one day to revert");
        return;
      }
    }

    // Open the rejection dialog
    setRejectDialogOpen(true);
  };

  const confirmBulkRevert = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId) return;

    if (!rejectComment.trim()) {
      toast.error("Comment is required for rejection");
      return;
    }

    const isMultiEmployeeMode = approvalFilters.employeeIds.length > 1;

    try {
      if (isMultiEmployeeMode) {
        // Multi-employee mode: Reject pending entries for selected employees
        const weekStart = format(startDate, "yyyy-MM-dd");
        let totalReverts = 0;
        let employeeCount = 0;

        // Check if specific days are selected via selectedDaysForApproval OR selectedEntries
        const hasSpecificDaysSelected = selectedDaysForApproval.size > 0;
        const hasSelectedEntries = selectedEntries.size > 0;

        // Revert entries for each selected employee
        for (const employeeId of selectedEmployees) {
          const empTimesheet = approvalTimesheets[employeeId];
          if (!empTimesheet || !empTimesheet.rows) continue;

          const reverts: { dayIndex: number; udaId: string; reason: string }[] =
            [];

          // If individual entries are selected, process only those
          if (hasSelectedEntries) {
            const filteredRows = empTimesheet.rows.filter((row) => {
              if (approvalProjectTypeFilter === "all") return true;
              const rowType = row.type || row.billable || row.udaName;
              return rowType === approvalProjectTypeFilter;
            });

            let entryCounter = 0;
            filteredRows.forEach((row) => {
              row.hours.forEach((h, hIdx) => {
                if (h && h !== "00:00" && h !== "0:00") {
                  const entryKey = `${employeeId}-${entryCounter}`;
                  const meta = row.entryMeta?.[hIdx];
                  const isPending = meta?.approvalStatus === "pending";

                  // Check if this entry is selected (or if employee checkbox is checked and entry is not explicitly unchecked)
                  const isSelected =
                    selectedEntries.has(entryKey) ||
                    (selectedEmployees.has(employeeId) &&
                      !uncheckedEntries.has(entryKey));

                  if (isSelected && isPending) {
                    reverts.push({
                      dayIndex: hIdx,
                      udaId: row.udaId,
                      reason: rejectComment.trim(),
                    });
                  }
                  entryCounter++;
                }
              });
            });
          } else {
            // Process based on selectedDaysForApproval or all days
            empTimesheet.rows.forEach((row) => {
              row.hours.forEach((h, dayIdx) => {
                // If specific days selected, only process those days
                if (
                  hasSpecificDaysSelected &&
                  !selectedDaysForApproval.has(dayIdx)
                ) {
                  return;
                }

                const meta = row.entryMeta?.[dayIdx];
                const hasEntry = h && h !== "00:00" && h !== "0:00";
                const isPending = meta?.approvalStatus === "pending";
                if (hasEntry && isPending) {
                  reverts.push({
                    dayIndex: dayIdx,
                    udaId: row.udaId,
                    reason: rejectComment.trim(),
                  });
                }
              });
            });
          }

          if (reverts.length > 0) {
            await timesheetService.requestRevision({
              managerId,
              projectId:
                approvalFilters.projectId === "all"
                  ? empTimesheet.rows[0]?.projectId || approvalFilters.projectId
                  : approvalFilters.projectId,
              employeeId,
              weekStartDate: weekStart,
              reverts,
            });
            totalReverts += reverts.length;
            employeeCount++;
          }
        }

        if (totalReverts === 0) {
          toast.info(
            hasSpecificDaysSelected || hasSelectedEntries
              ? "No pending entries found for selected employees on selected days"
              : "No pending entries found for selected employees",
          );
        } else {
          toast.success(
            `Requested revision for ${totalReverts} entry(s) across ${employeeCount} employee(s)`,
          );
        }
        setSelectedEmployees(new Set());
        setSelectedEntries(new Set());
        setUncheckedEntries(new Set());
        if (hasSpecificDaysSelected) {
          setSelectedDaysForApproval(new Set());
        }
      } else {
        // Single employee mode
        if (!approvalTimesheet) {
          toast.error("No timesheet loaded");
          return;
        }

        const weekStart = format(startDate, "yyyy-MM-dd");
        const employeeId =
          approvalFilters.employeeIds[0] || approvalTimesheet.employeeId;

        // Check if individual entries are selected
        const hasSelectedEntries = selectedEntries.size > 0;

        // Create reverts array
        const reverts: { dayIndex: number; udaId: string; reason: string }[] =
          [];
        const rows = approvalTimesheet.rows || [];

        if (hasSelectedEntries) {
          // Process only selected entries
          const filteredRows = rows.filter((row) => {
            if (approvalProjectTypeFilter === "all") return true;
            const rowType = row.type || row.billable || row.udaName;
            return rowType === approvalProjectTypeFilter;
          });

          let entryCounter = 0;
          filteredRows.forEach((row) => {
            row.hours.forEach((h, hIdx) => {
              if (h && h !== "00:00" && h !== "0:00") {
                const entryKey = `${employeeId}-${entryCounter}`;
                const meta = row.entryMeta?.[hIdx];
                const isPending = meta?.approvalStatus === "pending";

                // Check if this entry is selected
                const isSelected =
                  selectedEntries.has(entryKey) ||
                  (selectedEmployees.has(employeeId) &&
                    !uncheckedEntries.has(entryKey));

                if (isSelected && isPending && row.udaId) {
                  reverts.push({
                    dayIndex: hIdx,
                    udaId: row.udaId,
                    reason: rejectComment.trim(),
                  });
                }
                entryCounter++;
              }
            });
          });
        } else {
          // Use selectedDaysForApproval
          const dayIndices = Array.from(selectedDaysForApproval).sort(
            (a, b) => a - b,
          );

          dayIndices.forEach((dayIndex) => {
            rows.forEach((row: any) => {
              if (row.udaId && row.hours && row.hours[dayIndex]) {
                reverts.push({
                  dayIndex,
                  udaId: row.udaId,
                  reason: rejectComment.trim(),
                });
              }
            });
          });
        }

        if (reverts.length === 0) {
          toast.error(
            hasSelectedEntries
              ? "No pending entries selected"
              : "No entries found for selected days",
          );
          return;
        }

        await timesheetService.requestRevision({
          managerId,
          projectId: approvalFilters.projectId,
          employeeId: employeeId,
          weekStartDate: weekStart,
          reverts,
        });

        const uniqueDays = new Set(reverts.map((r) => r.dayIndex)).size;
        toast.success(
          `Requested revision for ${uniqueDays} day(s) (${reverts.length} entries) successfully`,
        );

        setSelectedDaysForApproval(new Set());
        setSelectedEntries(new Set());
        setUncheckedEntries(new Set());
      }

      // Close dialog and clear comment
      setRejectDialogOpen(false);
      setRejectComment("");
      loadApprovals();
    } catch (error) {
      console.error("Error bulk reverting:", error);
      toast.error("Failed to revert selected days");
    }
  };

  const handleBulkApproveAllEmployees = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId || approvalFilters.employeeIds.length === 0) return;

    const confirmed = globalThis.confirm(
      `Are you sure you want to approve timesheets for all ${approvalFilters.employeeIds.length} selected employees?`,
    );
    if (!confirmed) return;

    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      let successCount = 0;
      let errorCount = 0;

      for (const employeeId of approvalFilters.employeeIds) {
        try {
          await timesheetService.approveWeek({
            managerId,
            projectId: approvalFilters.projectId,
            employeeId: employeeId,
            weekStartDate: weekStart,
          });
          successCount++;
        } catch (error) {
          console.error(`Error approving for employee ${employeeId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Approved ${successCount} employee timesheet(s) successfully`,
        );
      }
      if (errorCount > 0) {
        toast.error(`Failed to approve ${errorCount} employee timesheet(s)`);
      }

      loadApprovals();
    } catch (error) {
      console.error("Error bulk approving all employees:", error);
      toast.error("Failed to approve timesheets");
    }
  };

  const handleBulkRejectAllEmployees = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId || approvalFilters.employeeIds.length === 0) return;

    const comment = prompt(
      `Enter rejection reason for all ${approvalFilters.employeeIds.length} selected employees:`,
    );
    if (!comment || !comment.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      let successCount = 0;
      let errorCount = 0;

      for (const employeeId of approvalFilters.employeeIds) {
        const timesheet = approvalTimesheets[employeeId];
        if (!timesheet?.rows) continue;

        const reverts = timesheet.rows.flatMap((row) =>
          row.hours
            .map((hours, dayIdx) => {
              if (!hours || hours === "00:00" || hours === "0:00") return null;
              const dayDate = format(weekDays[dayIdx], "yyyy-MM-dd");
              return {
                udaId: row.udaId,
                date: dayDate,
                rejectedReason: comment.trim(),
              };
            })
            .filter((r) => r !== null),
        );

        if (reverts.length === 0) continue;

        try {
          await timesheetService.requestRevision({
            managerId,
            projectId: approvalFilters.projectId,
            employeeId: employeeId,
            weekStartDate: weekStart,
            reverts: reverts as any[],
          });
          successCount++;
        } catch (error) {
          console.error(`Error rejecting for employee ${employeeId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          `Rejected ${successCount} employee timesheet(s) successfully`,
        );
      }
      if (errorCount > 0) {
        toast.error(`Failed to reject ${errorCount} employee timesheet(s)`);
      }

      loadApprovals();
    } catch (error) {
      console.error("Error bulk rejecting all employees:", error);
      toast.error("Failed to reject timesheets");
    }
  };

  const toggleDaySelection = (dayIndex: number) => {
    setSelectedDaysForApproval((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dayIndex)) {
        newSet.delete(dayIndex);
      } else {
        newSet.add(dayIndex);
      }
      return newSet;
    });
  };

  const handleSendReminder = async (
    employeeId: string,
    employeeName: string,
  ) => {
    if (!user?.employeeId) {
      toast.error("Unable to send reminder - manager information not found");
      return;
    }

    try {
      const weekStart = format(startDate, "MMM dd");
      const weekEnd = format(endDate, "MMM dd, yyyy");
      const projectName =
        approvalFilters.projectId === "all"
          ? "all projects"
          : managerProjects.find(
              (p) => p.projectId === approvalFilters.projectId,
            )?.projectName || approvalFilters.projectId;

      await notificationService.create({
        userId: employeeId,
        role: "EMPLOYEE",
        type: "reminder",
        title: "Timesheet Reminder",
        description: `Please submit your timesheet for week ${weekStart} - ${weekEnd} for ${projectName}. Reminder from ${user.name || user.employeeId}.`,
      });

      toast.success(`Reminder sent to ${employeeName}`);
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("Failed to send reminder");
    }
  };

  const openRevertDialog = (
    row: { udaId: string; udaName: string },
    dayIndex: number,
  ) => {
    setRevertTarget({
      dayIndex,
      udaId: row.udaId,
      label: `${row.udaName} - ${format(weekDays[dayIndex], "EEE dd")}`,
    });
    setRevertComment("");
    setRevertDialogOpen(true);
  };

  const confirmRevertDay = async () => {
    const managerId = user?.employeeId || user?.id;
    if (!managerId || !revertTarget) {
      console.error("[Revert] Missing data:", { managerId, revertTarget });
      return;
    }
    if (!revertComment.trim()) {
      toast.error("Comment is required for revision request");
      return;
    }

    try {
      const weekStart = format(startDate, "yyyy-MM-dd");
      // Use first employee for single cell revert
      const employeeId =
        approvalFilters.employeeIds[0] || approvalTimesheet?.employeeId;

      if (!employeeId) {
        toast.error("No employee selected for revision request");
        return;
      }

      const payload = {
        managerId,
        projectId: approvalFilters.projectId,
        employeeId: employeeId,
        weekStartDate: weekStart,
        reverts: [
          {
            dayIndex: revertTarget.dayIndex,
            udaId: revertTarget.udaId,
            reason: revertComment.trim(),
          },
        ],
      };

      console.log("[Revert] Sending revision request:", payload);
      console.log(
        "[Revert] Target day:",
        weekDays[revertTarget.dayIndex],
        "Index:",
        revertTarget.dayIndex,
      );

      const result = await timesheetService.requestRevision(payload);
      console.log("[Revert] Backend response:", result);

      toast.success(`Revision requested for ${revertTarget.label}`);
      setRevertDialogOpen(false);
      setRevertTarget(null);
      setRevertComment("");

      // Reload approvals to show updated status
      await loadApprovals();
    } catch (error: any) {
      console.error("[Revert] Error:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to request revision";
      toast.error(errorMsg);
    }
  };

  // Helper to check if a day is a holiday
  const isHoliday = (date: Date) => {
    const dateStr = format(date, "MMM d, yyyy");
    return holidays.some((holiday) => holiday.date === dateStr);
  };

  // Helper to get holiday name
  const getHolidayName = (date: Date) => {
    const dateStr = format(date, "MMM d, yyyy");
    const holiday = holidays.find((h) => h.date === dateStr);
    return holiday?.name || "";
  };

  const dailyTotals = useMemo(() => {
    return new Array(7).fill(0).map((_, dayIdx) => {
      return rows.reduce((sum, row) => {
        const val =
          Number.parseFloat(row.hours[dayIdx]?.replace(":", ".") || "0") || 0;
        return sum + val;
      }, 0);
    });
  }, [rows]);

  const grandTotal = rows.reduce(
    (sum, row) => sum + calculateRowTotal(row.hours),
    0,
  );

  return (
    <div className="page-container">
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-sm font-semibold text-slate-700">
              Loading timesheet data...
            </p>
          </div>
        </div>
      )}

      {/* Page Header with Week Navigation */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <ClipboardList className="h-7 w-7 text-primary" />
            Weekly Timesheet
          </h1>
          <p className="page-description">
            Track and manage your weekly work hours
          </p>
        </div>
        {/* Week Navigation */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 border gap-4">
            <button
              onClick={handlePrevWeek}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-slate-200"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black text-primary/60 uppercase">
                  Week
                </span>
                <span className="text-xs font-black text-primary leading-none">
                  W{format(startDate, "w")}
                </span>
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[180px] text-center">
                {format(startDate, "dd MMM yyyy")} -{" "}
                {format(endDate, "dd MMM yyyy")}
              </span>
            </div>
            <button
              onClick={handleNextWeek}
              className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all border border-transparent hover:border-slate-200"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
          {/* Color Legend Button - Icon Only */}
          <button
            onClick={() => setIsColorGuideOpen(true)}
            className="h-9 w-9 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center"
            title="View Color Guide"
          >
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-indigo-400 rounded-sm"></div>
              <div className="bg-emerald-400 rounded-sm"></div>
              <div className="bg-amber-400 rounded-sm"></div>
              <div className="bg-purple-400 rounded-sm"></div>
            </div>
          </button>
        </div>
      </div>

      {/* Tabs with Action Buttons - Sticky */}
      <div className="sticky top-0 z-40 bg-white">
        <Tabs
          value={viewMode}
          onValueChange={(value) => {
            setViewMode(value as "entry" | "approval");
            if (value === "entry" && viewMode === "approval") {
              setTimeout(() => {
                setForceReloadCounter((prev) => prev + 1);
              }, 50);
            }
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="entry" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                My Timesheet
              </TabsTrigger>
              <TabsTrigger value="approval" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Approvals
              </TabsTrigger>
            </TabsList>

            {/* Action Buttons in Tabs Row */}
            <div className="flex items-center gap-3">
              {viewMode === "entry" ? (
                <>
                  <Select
                    value={selectedProjectFilter}
                    onValueChange={(value) => {
                      console.log("📌 Project selected:", value);
                      if (value !== "all" && value) {
                        const selectedProject = allocatedProjects.find(
                          (p) => p.projectId === value,
                        );
                        if (selectedProject) {
                          const projectExists = rows.some(
                            (r) => r.projectId === selectedProject.projectId,
                          );
                          if (!projectExists) {
                            const newRow: TimesheetRow = {
                              id: Math.random().toString(36).substring(2, 11),
                              projectId: selectedProject.projectId,
                              projectCode: selectedProject.projectCode,
                              projectName: selectedProject.projectName,
                              udaId: "select-uda-placeholder",
                              udaName: "Select UDA",
                              type: "General",
                              financialLineItem: "",
                              billable: "General",
                              hours: new Array(7).fill("00:00"),
                              comments: new Array(7).fill(""),
                              entryMeta: new Array(7).fill(null),
                            };
                            setRows((prev) => [...prev, newRow]);
                            toast.success(
                              `Added ${selectedProject.projectName} - Click on day cells to assign categories`,
                            );
                          } else {
                            toast.info(
                              `${selectedProject.projectName} already exists in your timesheet`,
                            );
                          }
                        }
                      }
                      setSelectedProjectFilter(value);
                    }}
                  >
                    <SelectTrigger className="rounded-xl h-10 w-[280px] bg-white border-slate-200 shadow-sm">
                      <SelectValue placeholder="Select project..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-slate-200">
                      <SelectItem
                        value="all"
                        className="text-sm font-semibold py-3"
                      >
                        Select project...
                      </SelectItem>
                      {allocatedProjects.map((project) => (
                        <SelectItem
                          key={project.projectId}
                          value={project.projectId}
                          className="text-sm font-semibold py-3"
                        >
                          {project.projectId} ({project.projectName})
                        </SelectItem>
                      ))}
                      {allocatedProjects.length === 0 && (
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400">
                          No projects assigned
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => setForceReloadCounter((prev) => prev + 1)}
                    size="sm"
                    variant="outline"
                    className="h-10 rounded-lg text-xs font-bold gap-2 hover:bg-primary/5"
                    title="Reload timesheet to see latest status"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  {!isFutureWeek && (
                    <>
                      <Button
                        onClick={async () => {
                          if (!user?.employeeId || !user?.name) {
                            toast.error("User information not available");
                            return;
                          }
                          setIsSaving(true);
                          try {
                            const weekStart = format(startDate, "yyyy-MM-dd");
                            const weekEnd = format(endDate, "yyyy-MM-dd");

                            // Filter rows to only include non-approved entries
                            const preparedRows = rows
                              .map(({ id, ...row }) => {
                                // For each day, check if it's approved
                                const filteredHours = row.hours.map(
                                  (h, dayIdx) => {
                                    const isApproved =
                                      row.entryMeta?.[dayIdx]
                                        ?.approvalStatus === "approved";
                                    // If approved, set to "00:00" to skip saving
                                    return isApproved ? "00:00" : h;
                                  },
                                );

                                const filteredComments = row.comments.map(
                                  (c, dayIdx) => {
                                    const isApproved =
                                      row.entryMeta?.[dayIdx]
                                        ?.approvalStatus === "approved";
                                    // If approved, clear comment to skip saving
                                    return isApproved ? "" : c;
                                  },
                                );

                                // Check if this row has any non-approved hours
                                const hasNonApprovedHours = filteredHours.some(
                                  (h) => h && h !== "00:00" && h !== "0:00",
                                );

                                if (!hasNonApprovedHours) {
                                  return null; // Skip this row entirely if all days are approved
                                }

                                return {
                                  projectId: row.projectId || "N/A",
                                  projectCode: row.projectCode,
                                  projectName: row.projectName,
                                  udaId: row.udaId,
                                  udaName: row.udaName,
                                  type: row.type || "General",
                                  financialLineItem: row.financialLineItem,
                                  billable: row.billable,
                                  hours: filteredHours,
                                  comments: filteredComments,
                                };
                              })
                              .filter(
                                (
                                  row,
                                ): row is {
                                  projectId: string;
                                  projectCode: string;
                                  projectName: string;
                                  udaId: string;
                                  udaName: string;
                                  type: string;
                                  financialLineItem: string;
                                  billable: string;
                                  hours: (string | null)[];
                                  comments: (string | null)[];
                                } => row !== null,
                              ); // Remove null entries with type guard

                            if (preparedRows.length === 0) {
                              toast.info("No non-approved entries to save");
                              setIsSaving(false);
                              return;
                            }

                            const payload = {
                              employeeId: user.employeeId,
                              employeeName: user.name,
                              weekStartDate: weekStart,
                              weekEndDate: weekEnd,
                              rows: preparedRows,
                              status: "draft" as const,
                              totalHours: 0, // Will be calculated on backend
                            };

                            await timesheetService.saveDraft(payload);

                            // Only set status to draft if there are non-approved entries
                            // Keep checking for approved entries presence
                            const hasApprovedEntries = rows.some((row) =>
                              row.entryMeta?.some(
                                (meta) => meta?.approvalStatus === "approved",
                              ),
                            );

                            if (!hasApprovedEntries) {
                              setTimesheetStatus("draft");
                            }

                            toast.success(
                              "Non-approved entries saved as draft",
                            );

                            // Reload timesheet from server
                            await loadTimesheet();
                          } catch (error: any) {
                            console.error("Failed to save timesheet:", error);
                            toast.error(
                              error?.response?.data?.message ||
                                error?.message ||
                                "Failed to save timesheet",
                            );
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving || isLoading}
                        variant="outline"
                        className="border-teal-600 text-teal-600 hover:bg-teal-50 gap-2 h-10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                      <Button
                        onClick={() => setSubmitConfirmDialogOpen(true)}
                        disabled={isSaving || isLoading}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10"
                      >
                        <Send className="h-4 w-4" />
                        {isSaving ? "Submitting..." : "Submit"}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Select
                    value={approvalFilters.projectId}
                    onValueChange={(value) => {
                      console.log("📌 Project selected:", value);
                      setApprovalFilters((prev) => ({
                        ...prev,
                        projectId: value,
                        employeeIds: [],
                      }));
                      setApprovalTimesheets({});
                      setApprovalTimesheet(null);
                      setExpandedCategories(new Set());
                    }}
                    disabled={isLoadingManagerProjects}
                  >
                    <SelectTrigger className="rounded-xl h-10 w-[200px] bg-white border-slate-200">
                      <SelectValue
                        placeholder={
                          isLoadingManagerProjects
                            ? "Loading projects..."
                            : "Select project..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-slate-200">
                      {isLoadingManagerProjects ? (
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400">
                          Loading...
                        </div>
                      ) : (
                        <>
                          <SelectItem
                            value="all"
                            className="text-sm font-semibold py-3"
                          >
                            All Projects
                          </SelectItem>
                          {managerProjects.map((project) => (
                            <SelectItem
                              key={project.projectId}
                              value={project.projectId}
                              className="text-sm font-semibold py-3"
                            >
                              {project.projectId} - {project.projectName}
                            </SelectItem>
                          ))}
                          {managerProjects.length === 0 && (
                            <div className="px-3 py-2 text-xs font-semibold text-slate-400">
                              No projects mapped to this manager.
                            </div>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <Popover
                    open={employeeSearchOpen}
                    onOpenChange={setEmployeeSearchOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={employeeSearchOpen}
                        disabled={
                          !approvalFilters.projectId ||
                          isLoadingAllocatedEmployees
                        }
                        className="w-[200px] justify-between h-10 rounded-xl font-semibold"
                      >
                        {isLoadingAllocatedEmployees
                          ? "Loading employees..."
                          : !approvalFilters.projectId
                            ? "Select project first..."
                            : approvalFilters.employeeIds.length === 0
                              ? "Select employees..."
                              : approvalFilters.employeeIds.length ===
                                  employeesForApproval.length
                                ? `All ${employeesForApproval.length} employees`
                                : `${approvalFilters.employeeIds.length} of ${employeesForApproval.length}`}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0">
                      <Command shouldFilter={true}>
                        <CommandInput
                          placeholder="Search employees..."
                          className="h-11"
                        />
                        <div
                          className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none hover:bg-teal-50 border-b-2 border-slate-200 bg-slate-50 mx-1 mt-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (
                              approvalFilters.employeeIds.length ===
                              employeesForApproval.length
                            ) {
                              setApprovalFilters((prev) => ({
                                ...prev,
                                employeeIds: [],
                              }));
                            } else {
                              setApprovalFilters((prev) => ({
                                ...prev,
                                employeeIds: employeesForApproval.map(
                                  (e) => e.employeeId,
                                ),
                              }));
                            }
                          }}
                        >
                          <div className="mr-3 flex items-center">
                            {approvalFilters.employeeIds.length ===
                            employeesForApproval.length ? (
                              <Checkbox
                                checked={true}
                                className="h-5 w-5 pointer-events-none"
                              />
                            ) : approvalFilters.employeeIds.length > 0 ? (
                              <div className="h-5 w-5 border-2 border-teal-600 rounded flex items-center justify-center bg-teal-50">
                                <div className="h-2 w-2 bg-teal-600 rounded-sm" />
                              </div>
                            ) : (
                              <Checkbox
                                checked={false}
                                className="h-5 w-5 pointer-events-none"
                              />
                            )}
                          </div>
                          <span className="font-bold text-slate-700">
                            {approvalFilters.employeeIds.length ===
                            employeesForApproval.length
                              ? "Deselect All"
                              : approvalFilters.employeeIds.length > 0
                                ? `Select All (${approvalFilters.employeeIds.length}/${employeesForApproval.length})`
                                : "Select All"}
                            ({employeesForApproval.length} employees)
                          </span>
                        </div>
                        <CommandEmpty>No employee found.</CommandEmpty>
                        <CommandList className="max-h-[320px]">
                          <CommandGroup>
                            {employeesForApproval.map((employee) => {
                              const isSelected =
                                approvalFilters.employeeIds.includes(
                                  employee.employeeId,
                                );
                              return (
                                <CommandItem
                                  key={employee.employeeId}
                                  value={`${employee.employeeId} ${employee.name}`}
                                  onSelect={() => {
                                    setApprovalFilters((prev) => ({
                                      ...prev,
                                      employeeIds: isSelected
                                        ? prev.employeeIds.filter(
                                            (id) => id !== employee.employeeId,
                                          )
                                        : [
                                            ...prev.employeeIds,
                                            employee.employeeId,
                                          ],
                                    }));
                                    setTimeout(() => {
                                      setEmployeeSearchOpen(true);
                                    }, 0);
                                  }}
                                  className="cursor-pointer py-2.5"
                                >
                                  <div className="flex items-center w-full gap-3">
                                    <Checkbox
                                      checked={isSelected}
                                      className="h-4 w-4 pointer-events-none"
                                    />
                                    <div className="flex-1">
                                      <span className="text-sm font-medium text-slate-800">
                                        {employee.name}
                                      </span>
                                      <span className="text-xs text-slate-500 ml-2">
                                        ({employee.employeeId})
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                        <div className="border-t p-2 bg-slate-50">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                setApprovalFilters((prev) => ({
                                  ...prev,
                                  employeeIds: [],
                                }));
                                setApprovalTimesheets({});
                                setApprovalTimesheet(null);
                                setMultiEmployeeSelections(new Set());
                                setSelectedDaysForApproval(new Set());
                                setSelectedEmployees(new Set());
                                setApprovalSearchAttempted(false);
                              }}
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              Clear
                            </Button>
                            <Button
                              onClick={() => setEmployeeSearchOpen(false)}
                              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                              size="sm"
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Select
                    value={approvalProjectTypeFilter}
                    onValueChange={(value) =>
                      setApprovalProjectTypeFilter(value)
                    }
                  >
                    <SelectTrigger className="w-[160px] h-10 rounded-xl font-semibold">
                      <SelectValue placeholder="UDA Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl shadow-2xl border-slate-200 max-h-[300px]">
                      <SelectItem
                        value="all"
                        className="text-sm font-semibold py-3"
                      >
                        All UDA Types
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel className="text-xs font-bold text-slate-500 px-2 py-1.5">
                          UDA Categories
                        </SelectLabel>
                        {uniqueUDATypes.map((type) => {
                          const category = resolveBillableGroup(type);
                          const colorClass =
                            category === "Billable"
                              ? "bg-blue-600"
                              : category === "Non-Billable"
                                ? "bg-orange-600"
                                : "bg-slate-600";
                          return (
                            <SelectItem
                              key={type}
                              value={type}
                              className="text-sm font-semibold py-2.5"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full ${colorClass}`}
                                />
                                {type}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {(approvalTimesheet ||
                    Object.keys(approvalTimesheets).length > 0) && (
                    <>
                      <Button
                        onClick={handleBulkApprove}
                        disabled={isApprovalLoading}
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-10 px-4"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={handleBulkRevert}
                        disabled={isApprovalLoading}
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-50 gap-2 h-10 px-4"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <TabsContent value={viewMode} className="space-y-6 mt-6">
            {/* Color Guide Drawer */}
            <Sheet open={isColorGuideOpen} onOpenChange={setIsColorGuideOpen}>
              <SheetContent className="sm:max-w-[500px] overflow-y-auto">
                <SheetHeader className="border-b pb-6 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="grid grid-cols-2 gap-1 w-12 h-12 p-2 bg-slate-100 rounded-xl">
                      <div className="bg-indigo-400 rounded-sm"></div>
                      <div className="bg-emerald-400 rounded-sm"></div>
                      <div className="bg-amber-400 rounded-sm"></div>
                      <div className="bg-purple-400 rounded-sm"></div>
                    </div>
                    <div>
                      <SheetTitle className="text-2xl font-black text-slate-900 tracking-tight">
                        Cell Color Guide
                      </SheetTitle>
                      <SheetDescription className="font-medium text-slate-500">
                        Understanding timesheet cell states and colors
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <div className="space-y-4">
                  {/* Filled Entry */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 hover:border-indigo-200 transition-all">
                    <div className="w-16 h-12 bg-indigo-50 border-2 border-indigo-400 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-sm font-extrabold text-indigo-700">
                        08:00
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-900">
                        Filled Entry
                      </p>
                      <p className="text-sm text-slate-600">
                        Hours entered successfully
                      </p>
                    </div>
                  </div>

                  {/* Empty Cell */}
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border-2 border-slate-100 hover:border-slate-200 transition-all">
                    <div className="w-16 h-12 bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-slate-400">
                        00:00
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-900">
                        Empty Cell
                      </p>
                      <p className="text-sm text-slate-600">
                        Ready for time entry
                      </p>
                    </div>
                  </div>

                  {/* Revision Requested */}
                  <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-all">
                    <div className="w-16 h-12 bg-amber-100 border-2 border-amber-500 rounded-lg flex items-center justify-center relative shadow-sm">
                      <span className="text-sm font-extrabold text-amber-900">
                        04:00
                      </span>
                      <div className="absolute -top-1.5 -left-1.5 h-5 w-5 bg-amber-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-[10px] text-white font-black">
                          !
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-amber-900">
                        Revision Requested
                      </p>
                      <p className="text-sm text-amber-700">
                        Manager requested changes - check comment
                      </p>
                    </div>
                  </div>

                  {/* Approved */}
                  <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-300 transition-all">
                    <div className="w-16 h-12 bg-emerald-100 border-2 border-emerald-400 rounded-lg flex items-center justify-center relative shadow-sm">
                      <span className="text-sm font-extrabold text-emerald-800">
                        08:00
                      </span>
                      <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-[10px] text-white font-black">
                          ✓
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-emerald-800">
                        Approved
                      </p>
                      <p className="text-sm text-emerald-600">
                        Manager approved this entry
                      </p>
                    </div>
                  </div>

                  {/* Holiday */}
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all">
                    <div className="w-16 h-12 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs font-semibold text-purple-600">
                        Holiday
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-purple-800">
                        Holiday
                      </p>
                      <p className="text-sm text-purple-600">
                        Public holiday - no entry needed
                      </p>
                    </div>
                  </div>

                  {/* Weekend */}
                  <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all">
                    <div className="w-16 h-12 bg-slate-200 border-2 border-slate-300 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs font-semibold text-slate-500">
                        Weekend
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-slate-700">
                        Weekend
                      </p>
                      <p className="text-sm text-slate-600">
                        Weekends are typically non-working days
                      </p>
                    </div>
                  </div>

                  {/* Project Ended */}
                  <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all">
                    <div className="w-16 h-12 bg-red-50 border-2 border-red-500 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-red-700">
                        Ended
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-red-800">
                        Project Ended
                      </p>
                      <p className="text-sm text-red-600">
                        After project end date - disabled
                      </p>
                    </div>
                  </div>

                  {/* Error */}
                  <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all">
                    <div className="w-16 h-12 bg-red-50 border-2 border-red-500 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-red-700">
                        Error
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-red-800">
                        Validation Error
                      </p>
                      <p className="text-sm text-red-600">
                        Invalid time format or value
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-lg">💡</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        Quick Tips
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>
                          • Hover over cells with badges (!) or (✓) for more
                          details
                        </li>
                        <li>
                          • Use the copy button to duplicate hours to remaining
                          days
                        </li>
                        <li>
                          • Weekends, holidays, and expired projects are
                          auto-disabled
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Main Timesheet Grid Area - Revisualized */}
            <div className="overflow-hidden bg-[#F1F5F9] rounded-lg border shadow-sm relative">
              <div className="flex flex-col">
                {/* Header Row - Premium Dark Style */}
                <div className="flex h-[50px] bg-[#334155] text-white/90 shadow-lg">
                  <div className="flex-[0_0_300px] min-w-[300px] flex items-center">
                    <div className="px-8 h-[50px] flex items-center text-[11px] font-black uppercase tracking-[0.2em] opacity-60 gap-3">
                      {/* Select All Employees Checkbox - Only in multi-employee approval mode */}
                      {viewMode === "approval" &&
                        approvalFilters.employeeIds.length > 1 && (
                          <div className="flex items-center">
                            <Checkbox
                              checked={
                                selectedEmployees.size ===
                                  approvalFilters.employeeIds.length &&
                                selectedEmployees.size > 0
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Select all employees
                                  setSelectedEmployees(
                                    new Set(approvalFilters.employeeIds),
                                  );
                                } else {
                                  // Deselect all employees
                                  setSelectedEmployees(new Set());
                                }
                              }}
                              className="h-4 w-4 border-2 border-white"
                            />
                          </div>
                        )}
                      Task Detail
                    </div>
                  </div>
                  <div className="flex-1 flex">
                    {weekDays.map((day, dayIndex) => {
                      const isToday = isSameDay(day, new Date());
                      const isFutureDay = day > todayStart;
                      const isSelected = selectedDaysForApproval.has(dayIndex);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex-1 px-2 py-4 flex flex-col items-center justify-center border-l border-white/5 text-center transition-all relative",
                            isToday &&
                              "bg-primary/20 ring-1 ring-inset ring-primary/40",
                            isWeekend(day) && "bg-slate-600",
                            isHoliday(day) && "bg-purple-600",
                            viewMode === "entry" &&
                              isFutureDay &&
                              "bg-slate-500/70 opacity-60",
                            viewMode === "approval" &&
                              isSelected &&
                              "bg-emerald-600 ring-2 ring-emerald-400",
                          )}
                        >
                          {/* Checkbox for Approval Mode - Day Selection (only for valid days) */}
                          {viewMode === "approval" &&
                            approvalTimesheet &&
                            !isWeekend(day) &&
                            !isHoliday(day) && (
                              <div className="absolute top-2 left-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleDaySelection(dayIndex)}
                                  className="h-4 w-4 rounded border-2 border-white/40 bg-white/10 text-emerald-500 focus:ring-2 focus:ring-emerald-400 focus:ring-offset-0 cursor-pointer"
                                />
                              </div>
                            )}
                          {isHoliday(day) && (
                            <div className="absolute top-1 right-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-bold">
                                      {getHolidayName(day)}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-black tracking-widest uppercase mb-0.5 opacity-60",
                              isToday && "opacity-100 text-primary-foreground",
                            )}
                          >
                            {format(day, "EEE")}
                          </span>
                          <div className="flex items-center gap-1.5 font-black">
                            <span className="text-xs uppercase">
                              {format(day, "dd")}
                            </span>
                            <span className="text-[10px] opacity-40 uppercase">
                              {format(day, "MMM")}
                            </span>
                          </div>
                          {isToday && (
                            <div className="absolute top-0 right-0 p-1">
                              <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-[60px] border-l border-white/5"></div>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-auto divide-y divide-slate-200 dark:divide-slate-800 bg-white">
                  {viewMode === "entry" ? (
                    <>
                      {/* Revision Request Banner */}
                      {(() => {
                        const revisionCount = rows.reduce((count, row) => {
                          const rowRevisions =
                            row.entryMeta?.filter(
                              (meta) =>
                                meta?.approvalStatus === "revision_requested",
                            ).length || 0;
                          return count + rowRevisions;
                        }, 0);

                        console.log(
                          "Revision count check:",
                          revisionCount,
                          "Rows:",
                          rows.length,
                        );
                        rows.forEach((row, idx) => {
                          const hasRevisions = row.entryMeta?.some(
                            (meta) =>
                              meta?.approvalStatus === "revision_requested",
                          );
                          if (hasRevisions) {
                            console.log(
                              `Row ${idx} (${row.udaName}):`,
                              row.entryMeta,
                            );
                          }
                        });

                        if (revisionCount > 0) {
                          return (
                            <div className="bg-amber-50 border-b-2 border-amber-200 px-6 py-3 flex items-center gap-3">
                              <div className="h-8 w-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <span className="text-sm font-black">
                                  {revisionCount}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-black text-amber-900">
                                  ⚠️ Revision Requested - Please Update
                                </p>
                                <p className="text-xs font-medium text-amber-700">
                                  {revisionCount}{" "}
                                  {revisionCount === 1
                                    ? "entry needs"
                                    : "entries need"}{" "}
                                  correction. Look for amber-bordered cells with
                                  \"!\" badges - you can edit them directly and
                                  resubmit.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {rows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                          {isReportView ? (
                            <>
                              <div className="bg-slate-50 p-10 rounded-full border-4 border-dashed border-slate-200 mb-6">
                                <LayoutGrid className="h-16 w-16 text-slate-200" />
                              </div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                                Timesheet Not Found
                              </h3>
                              <p className="text-sm font-medium text-slate-500 max-w-[350px] text-center">
                                No timesheet entries found for the selected
                                week. The employee may not have logged any hours
                                during this period.
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="bg-slate-50 p-10 rounded-full border-4 border-dashed border-slate-200 mb-6 rotate-3">
                                <LayoutGrid className="h-16 w-16 text-slate-200" />
                              </div>
                              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                                Ready to log your time?
                              </h3>
                              <p className="text-sm font-medium text-slate-500 max-w-[300px] text-center mb-8">
                                Click the add button above to start tracking
                                your project allocations and activities.
                              </p>
                              {!isFutureWeek && (
                                <Button
                                  onClick={() => setIsAddEntryOpen(true)}
                                  className="rounded-xl h-12 px-8 font-black text-xs uppercase tracking-widest bg-primary"
                                >
                                  Start Log Now
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        groupedRows.map((projectGroup) => {
                          // Use the first category row for basic project info display
                          const primaryRow = projectGroup.categories[0];

                          return (
                            <div
                              key={projectGroup.projectId}
                              className="flex group transition-colors hover:bg-slate-50"
                            >
                              {/* LEFT PANE */}
                              <div className="flex-[0_0_300px] min-w-[300px] bg-white group-hover:bg-slate-50/50">
                                <div className="px-8 py-5 border-r border-slate-100/50">
                                  <div className="text-sm font-black text-slate-900 dark:text-white mb-1 tracking-tight">
                                    {projectGroup.projectName || "Project"}
                                  </div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <code className="text-[10px] font-black text-primary px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                                      {projectGroup.projectCode}
                                    </code>
                                  </div>
                                </div>
                              </div>

                              {/* GRID PANE */}
                              <div className="flex-1 flex bg-slate-50/10">
                                {primaryRow.hours.map((_, hIdx) => {
                                  const dayDate = weekDays[hIdx];
                                  const isToday = isSameDay(
                                    dayDate,
                                    new Date(),
                                  );
                                  const isFutureDay = dayDate > todayStart;
                                  const isWeekendDay = isWeekend(dayDate);
                                  const isHolidayDay = isHoliday(dayDate);

                                  // Calculate total hours for all categories on this day for this project
                                  const totalMinutesThisDay =
                                    projectGroup.categories.reduce(
                                      (sum, cat) => {
                                        const h = cat.hours[hIdx];
                                        if (!h || h === "00:00" || h === "0")
                                          return sum;
                                        const minutes = parseTimeToMinutes(h);
                                        return sum + (minutes || 0);
                                      },
                                      0,
                                    );

                                  const displayHours =
                                    totalMinutesThisDay > 0
                                      ? formatMinutesToTime(totalMinutesThisDay)
                                      : null;

                                  const hasEntry =
                                    displayHours &&
                                    displayHours !== "00:00" &&
                                    displayHours !== "0";

                                  // Check for multiple categories with hours on this day
                                  const categoriesWithHoursThisDay =
                                    projectGroup.categories.filter((cat) => {
                                      const h = cat.hours[hIdx];
                                      return h && h !== "00:00" && h !== "0";
                                    });
                                  const hasMultipleCategories =
                                    categoriesWithHoursThisDay.length > 1;

                                  const allocationDates = allocationDateMap.get(
                                    projectGroup.projectId,
                                  );
                                  const allocationStart = allocationDates?.start
                                    ? new Date(allocationDates.start)
                                    : null;
                                  if (allocationStart) {
                                    allocationStart.setHours(0, 0, 0, 0);
                                  }
                                  const isBeforeAllocationStart =
                                    allocationStart
                                      ? dayDate < allocationStart
                                      : false;

                                  // Check if day is after allocation end date
                                  const allocationEnd = allocationDates?.end
                                    ? new Date(allocationDates.end)
                                    : null;
                                  if (allocationEnd) {
                                    allocationEnd.setHours(23, 59, 59, 999);
                                  }
                                  const isAfterAllocationEnd = allocationEnd
                                    ? dayDate > allocationEnd
                                    : false;

                                  if (hIdx === 0) {
                                    // Log once per project row (first day)
                                    console.log(
                                      `[Cell Rendering] Project: ${projectGroup.projectId}, Allocation End: ${allocationEnd?.toISOString() || "None"}`,
                                    );
                                  }

                                  // Check if day is after project end date
                                  const project = projectCatalogList.find(
                                    (p) =>
                                      (p.projectId || p._id) ===
                                      projectGroup.projectId,
                                  );
                                  let isAfterProjectEnd = false;
                                  if (project?.projectEndDate) {
                                    const endDate = new Date(
                                      project.projectEndDate,
                                    );
                                    endDate.setHours(23, 59, 59, 999);
                                    if (dayDate > endDate) {
                                      isAfterProjectEnd = true;
                                    }
                                  }

                                  // Only disable if after project end or future day or after allocation end
                                  // Don't disable based on approval status - let users add new categories
                                  const isDisabled =
                                    isAfterProjectEnd ||
                                    isAfterAllocationEnd ||
                                    isFutureDay;

                                  // Check for any revision requests or approvals in categories
                                  const hasRevisionRequested =
                                    projectGroup.categories.some(
                                      (cat) =>
                                        cat.entryMeta?.[hIdx]
                                          ?.approvalStatus ===
                                        "revision_requested",
                                    );
                                  const hasApproved =
                                    projectGroup.categories.some(
                                      (cat) =>
                                        cat.entryMeta?.[hIdx]
                                          ?.approvalStatus === "approved",
                                    );

                                  // Show 00:00 for all conditions
                                  let placeholderText = "00:00";
                                  if (isAfterAllocationEnd) {
                                    placeholderText = "Allocation Ended";
                                  } else if (isAfterProjectEnd) {
                                    placeholderText = "Project Ended";
                                  }

                                  return (
                                    <div
                                      key={`${projectGroup.projectId}-day-${hIdx}`}
                                      className={cn(
                                        "flex-1 border-r border-slate-100 dark:border-slate-800 p-2.5 flex items-center justify-center group/cell min-w-[100px] transition-colors relative",
                                        isToday && "bg-primary/[0.02]",
                                        isWeekendDay && "bg-slate-100",
                                        isHolidayDay && "bg-purple-50",
                                      )}
                                    >
                                      <div className="relative w-full max-w-[60px]">
                                        {/* Display Total Hours with interaction icons */}
                                        <div
                                          className={cn(
                                            "w-full h-10 text-center text-sm font-black tabular-nums transition-all outline-none rounded-xl shadow-sm flex items-center justify-center relative",
                                            hasEntry
                                              ? "text-indigo-700 border-2 border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200 font-extrabold cursor-pointer hover:ring-4 hover:border-indigo-500"
                                              : !isDisabled
                                                ? "text-slate-400 bg-slate-50 border-2 border-slate-200 font-semibold cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                                                : "text-slate-400 bg-slate-50 border-2 border-slate-200 font-semibold",
                                            isToday &&
                                              !hasEntry &&
                                              "border-primary/30 ring-1 ring-primary/20",
                                            isDisabled &&
                                              "cursor-not-allowed bg-slate-200 border-slate-300 text-slate-500",
                                            isHolidayDay &&
                                              "bg-purple-100 border-purple-300 text-purple-600",
                                            (isAfterProjectEnd ||
                                              isAfterAllocationEnd) &&
                                              "bg-red-100 border-red-300 text-red-600",
                                            hasRevisionRequested &&
                                              "bg-amber-100 border-2 border-amber-500 ring-2 ring-amber-200 text-amber-900 font-extrabold cursor-pointer",
                                            hasApproved &&
                                              !hasRevisionRequested &&
                                              "bg-emerald-100 border-2 border-emerald-400 text-emerald-800 font-extrabold",
                                          )}
                                          onClick={() => {
                                            if (!isDisabled) {
                                              handleOpenCategoryDialog(
                                                projectGroup.projectId,
                                                hIdx,
                                              );
                                            }
                                          }}
                                        >
                                          <span className="relative z-10">
                                            {displayHours || placeholderText}
                                          </span>

                                          {/* Always show category indicator */}
                                          {/* {!isDisabled &&
                                      projectGroup.categories.length > 1 && (
                                        <span className="absolute top-0.5 right-1 text-[8px] font-black text-slate-400 bg-white/60 px-1 py-0.5 rounded-full border border-slate-300 z-20 opacity-60 group-hover/cell:opacity-100">
                                          {projectGroup.categories.length}
                                        </span>
                                      )} */}
                                        </div>

                                        {/* Plus Icon for Multiple Categories - Always visible when there are hours */}
                                        {hasEntry &&
                                          hasMultipleCategories &&
                                          !isDisabled && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCategoryDialog(
                                                  projectGroup.projectId,
                                                  hIdx,
                                                );
                                              }}
                                              className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center shadow-xl z-50 hover:scale-125 transition-all border-2 border-white hover:from-teal-400 hover:to-teal-500 animate-pulse hover:animate-none"
                                              title={`View ${categoriesWithHoursThisDay.length} category assignments`}
                                            >
                                              <Plus className="h-5 w-5 stroke-[3]" />
                                            </button>
                                          )}

                                        {/* Plus Icon for Multiple Categories (empty cells) - Shows on hover */}
                                        {!hasEntry &&
                                          !isDisabled &&
                                          projectGroup.categories.length >
                                            1 && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCategoryDialog(
                                                  projectGroup.projectId,
                                                  hIdx,
                                                );
                                              }}
                                              className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center shadow-lg z-50 opacity-0 group-hover/cell:opacity-100 hover:scale-110 transition-all border-2 border-white"
                                              title={`Add hours for ${projectGroup.categories.length} categories`}
                                            >
                                              <Plus className="h-4 w-4 stroke-[3]" />
                                            </button>
                                          )}

                                        {/* Edit Icon for Single Category - Shows on hover */}
                                        {!hasMultipleCategories &&
                                          !isDisabled && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCategoryDialog(
                                                  projectGroup.projectId,
                                                  hIdx,
                                                );
                                              }}
                                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md z-50 opacity-0 group-hover/cell:opacity-100 hover:scale-110 transition-all border-2 border-white"
                                              title="Click to add/edit hours"
                                            >
                                              <Clock className="h-3.5 w-3.5" />
                                            </button>
                                          )}

                                        {/* Copy Icon - Shows on hover when cell has data */}
                                        {hasEntry && !isDisabled && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleCopyProjectDayHours(
                                                projectGroup.projectId,
                                                hIdx,
                                              );
                                            }}
                                            className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md z-50 opacity-0 group-hover/cell:opacity-100 hover:scale-110 transition-all border-2 border-white hover:bg-purple-600"
                                            title="Copy hours to remaining days"
                                          >
                                            <svg
                                              className="h-3.5 w-3.5"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                              />
                                            </svg>
                                          </button>
                                        )}

                                        {/* Revision Request Indicator */}
                                        {hasRevisionRequested && (
                                          <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                              <TooltipTrigger asChild>
                                                <div className="absolute -top-2 -left-2 h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg z-30 animate-pulse">
                                                  <span className="text-[10px] font-black">
                                                    !
                                                  </span>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent
                                                side="top"
                                                className="max-w-[250px] bg-amber-50 border-amber-200"
                                              >
                                                <p className="text-xs font-bold text-amber-900 mb-1">
                                                  Revision Requested
                                                </p>
                                                <p className="text-xs text-amber-700">
                                                  Click to view details
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}

                                        {/* Approved Indicator */}
                                        {hasApproved &&
                                          !hasRevisionRequested &&
                                          hasEntry && (
                                            <div className="absolute -top-2 -right-2 h-5 w-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg z-30">
                                              <span className="text-[10px] font-black">
                                                ✓
                                              </span>
                                            </div>
                                          )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* ROW ACTIONS */}
                              <div className="w-[60px] flex items-center justify-center border-l bg-slate-50/30 group-hover:bg-red-50 transition-colors">
                                {(() => {
                                  // Check if any entry in any category is approved
                                  const hasApprovedEntry =
                                    projectGroup.categories.some((cat) =>
                                      cat.entryMeta?.some(
                                        (meta) =>
                                          meta?.approvalStatus === "approved",
                                      ),
                                    );
                                  const isWeekApproved =
                                    timesheetStatus === "approved";

                                  // Hide delete button if week is approved OR if any entry is approved
                                  if (isWeekApproved || hasApprovedEntry) {
                                    return null;
                                  }

                                  return (
                                    <button
                                      onClick={() =>
                                        openDeleteDialog(primaryRow)
                                      }
                                      className="p-2.5 transition-all text-slate-200 hover:text-red-500 hover:scale-110"
                                      title="Delete this project"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </>
                  ) : Object.keys(approvalTimesheets).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                      <div className="bg-slate-50 p-10 rounded-full border-4 border-dashed border-slate-200 mb-6 rotate-3">
                        <LayoutGrid className="h-16 w-16 text-slate-200" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">
                        {isApprovalLoading
                          ? "Loading timesheets..."
                          : approvalSearchAttempted
                            ? "No submitted timesheets found"
                            : "Waiting for data"}
                      </h3>
                      <p className="text-sm font-medium text-slate-500 max-w-[320px] text-center mb-8">
                        {isApprovalLoading
                          ? "Please wait while we load employee timesheets"
                          : approvalSearchAttempted
                            ? "Try another project, employee, or week."
                            : "Employee timesheets will load automatically"}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Status Legends */}
                      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Status Legend:
                          </span>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 bg-emerald-500 text-white rounded flex items-center justify-center">
                                <span className="text-[10px] font-black">
                                  ✓
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                Approved
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 bg-amber-500 text-white rounded flex items-center justify-center">
                                <span className="text-[10px] font-black">
                                  !
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                Revision Requested
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 bg-blue-500 text-white rounded flex items-center justify-center">
                                <span className="text-[10px] font-black">
                                  •
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-600">
                                Pending
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Employee Approval View */}
                      {approvalFilters.employeeIds.map((employeeId) => {
                        const empTimesheet = approvalTimesheets[employeeId];
                        const empData = employeesForApproval.find(
                          (e) => e.employeeId === employeeId,
                        );
                        const isExpanded = expandedEmployees.has(employeeId);

                        if (!empTimesheet || !empData) {
                          return (
                            <div
                              key={employeeId}
                              className="border-b-2 border-slate-200"
                            >
                              <div className="flex items-stretch">
                                {/* LEFT PANE - Employee Info */}
                                <div className="flex-[0_0_300px] min-w-[300px] bg-slate-50 border-r border-slate-200">
                                  <div className="px-6 py-4 flex items-center gap-3">
                                    {/* Checkbox */}
                                    <Checkbox
                                      checked={selectedEmployees.has(
                                        employeeId,
                                      )}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(
                                          selectedEmployees,
                                        );
                                        if (checked) {
                                          newSelected.add(employeeId);
                                        } else {
                                          newSelected.delete(employeeId);
                                        }
                                        setSelectedEmployees(newSelected);
                                      }}
                                      className="h-5 w-5 border-2"
                                    />

                                    {/* Avatar */}
                                    <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-black text-slate-400">
                                        {(
                                          empData?.resourceName ||
                                          empData?.name ||
                                          ""
                                        ).charAt(0)}
                                      </span>
                                    </div>

                                    {/* Employee Info */}
                                    <div className="flex-1">
                                      <h3 className="font-black text-sm text-slate-800">
                                        {empData?.resourceName ||
                                          empData?.name ||
                                          employeeId}
                                        {empData?.projectId &&
                                          empData.projectId !== "N/A" && (
                                            <span className="ml-2 text-xs font-semibold text-teal-600">
                                              ({empData.projectId})
                                            </span>
                                          )}
                                      </h3>
                                      <p className="text-xs text-slate-500">
                                        {empData?.designation ||
                                          empData?.jobRole ||
                                          "Employee"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* GRID PANE - Centered "No timesheet submitted" text */}
                                <div className="flex-1 flex">
                                  <div className="flex-1 flex items-center justify-center border-r border-slate-200 bg-slate-50/50">
                                    <p className="text-sm font-semibold text-slate-400 italic">
                                      No timesheet submitted
                                    </p>
                                  </div>
                                </div>

                                {/* RIGHT PANE - Reminder Icon */}
                                <div className="w-[60px] bg-slate-50 border-l border-slate-200 flex items-center justify-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() =>
                                            handleSendReminder(
                                              employeeId,
                                              empData?.resourceName ||
                                                empData?.name ||
                                                employeeId,
                                            )
                                          }
                                          className="p-2 hover:bg-blue-100 rounded-full transition-all group"
                                        >
                                          <Bell className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:animate-pulse" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs font-bold">
                                          Send Reminder
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Calculate status counts for this employee
                        const statusCounts = empTimesheet.rows.reduce(
                          (acc, row) => {
                            row.entryMeta?.forEach((meta) => {
                              if (meta) {
                                const status = meta.approvalStatus || "pending";
                                if (status === "approved") acc.approved++;
                                else if (status === "revision_requested")
                                  acc.revisionRequested++;
                                else acc.pending++;
                              }
                            });
                            return acc;
                          },
                          { approved: 0, pending: 0, revisionRequested: 0 },
                        );

                        const total =
                          statusCounts.approved +
                          statusCounts.pending +
                          statusCounts.revisionRequested;

                        // Calculate daily totals for this employee
                        const dailyTotalsForEmployee = Array(7).fill(0);
                        const dailyEntryCounts = Array(7).fill(0);
                        empTimesheet.rows.forEach((row) => {
                          row.hours?.forEach((h, idx) => {
                            if (h && h !== "00:00" && h !== "0:00") {
                              const minutes = parseTimeToMinutes(h);
                              dailyTotalsForEmployee[idx] += minutes;
                              dailyEntryCounts[idx] += 1;
                            }
                          });
                        });

                        return (
                          <div
                            key={employeeId}
                            className="border-b-4 border-slate-200"
                          >
                            {/* Employee Header with Daily Totals */}
                            <div className="flex items-stretch">
                              {/* LEFT PANE - Employee Info */}
                              <div className="flex-[0_0_300px] min-w-[300px] bg-gradient-to-r from-blue-50 to-slate-50 border-r border-slate-200">
                                <div className="px-6 py-2 flex items-center gap-4">
                                  {/* Checkbox for bulk selection */}
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center"
                                  >
                                    <Checkbox
                                      checked={selectedEmployees.has(
                                        employeeId,
                                      )}
                                      onCheckedChange={(checked) => {
                                        const newSelected = new Set(
                                          selectedEmployees,
                                        );
                                        if (checked) {
                                          newSelected.add(employeeId);
                                        } else {
                                          newSelected.delete(employeeId);
                                        }
                                        setSelectedEmployees(newSelected);

                                        // Also select/deselect all entries for this employee
                                        const newSelectedEntries = new Set(
                                          selectedEntries,
                                        );
                                        const newUncheckedEntries = new Set(
                                          uncheckedEntries,
                                        );
                                        const filteredRows =
                                          empTimesheet.rows.filter((row) => {
                                            if (
                                              approvalProjectTypeFilter ===
                                              "all"
                                            )
                                              return true;
                                            const rowType =
                                              row.type ||
                                              row.billable ||
                                              row.udaName;
                                            return (
                                              rowType ===
                                              approvalProjectTypeFilter
                                            );
                                          });
                                        let entryIdx = 0;
                                        filteredRows.forEach((row) => {
                                          row.hours.forEach((h) => {
                                            if (
                                              h &&
                                              h !== "00:00" &&
                                              h !== "0:00"
                                            ) {
                                              const entryKey = `${employeeId}-${entryIdx}`;
                                              if (checked) {
                                                newSelectedEntries.add(
                                                  entryKey,
                                                );
                                                // Clear any explicit unchecks when employee is checked
                                                newUncheckedEntries.delete(
                                                  entryKey,
                                                );
                                              } else {
                                                newSelectedEntries.delete(
                                                  entryKey,
                                                );
                                                // Clear unchecks when employee is unchecked
                                                newUncheckedEntries.delete(
                                                  entryKey,
                                                );
                                              }
                                              entryIdx++;
                                            }
                                          });
                                        });
                                        setSelectedEntries(newSelectedEntries);
                                        setUncheckedEntries(
                                          newUncheckedEntries,
                                        );
                                      }}
                                      className="h-5 w-5 border-2"
                                    />
                                  </div>

                                  {/* Expand/Collapse Arrow */}
                                  <div
                                    onClick={() => {
                                      const newExpanded = new Set(
                                        expandedEmployees,
                                      );
                                      if (isExpanded) {
                                        newExpanded.delete(employeeId);
                                      } else {
                                        newExpanded.add(employeeId);
                                      }
                                      setExpandedEmployees(newExpanded);
                                    }}
                                    className="cursor-pointer hover:bg-slate-100 rounded-full p-1 transition-all"
                                  >
                                    <ChevronDown
                                      className={cn(
                                        "h-5 w-5 text-slate-600 transition-transform duration-200",
                                        isExpanded ? "rotate-180" : "",
                                      )}
                                    />
                                  </div>

                                  {/* Employee info */}
                                  <div
                                    onClick={() => {
                                      const newExpanded = new Set(
                                        expandedEmployees,
                                      );
                                      if (isExpanded) {
                                        newExpanded.delete(employeeId);
                                      } else {
                                        newExpanded.add(employeeId);
                                      }
                                      setExpandedEmployees(newExpanded);
                                    }}
                                    className="flex items-center gap-4 cursor-pointer hover:opacity-80 flex-1"
                                  >
                                    <div>
                                      <h3 className="font-black text-sm text-slate-800">
                                        {empData?.resourceName ||
                                          empData?.name ||
                                          employeeId}
                                        {empTimesheet?.rows &&
                                          empTimesheet.rows.length > 0 && (
                                            <span className="ml-2 text-xs font-semibold text-teal-600">
                                              (
                                              {[
                                                ...new Set(
                                                  empTimesheet.rows.map(
                                                    (r) => r.projectId,
                                                  ),
                                                ),
                                              ]
                                                .filter((id) => id !== "N/A")
                                                .join(", ")}
                                              )
                                            </span>
                                          )}
                                      </h3>
                                      <p className="text-xs text-slate-500">
                                        {empData?.designation ||
                                          empData?.jobRole ||
                                          "Employee"}{" "}
                                        • {total} entries
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* GRID PANE - Daily Totals */}
                              <div className="flex-1 flex">
                                {dailyTotalsForEmployee.map(
                                  (totalMinutes, dayIdx) => {
                                    const dayDate = weekDays[dayIdx];
                                    const isToday = isSameDay(
                                      dayDate,
                                      new Date(),
                                    );
                                    const isWeekendDay = isWeekend(dayDate);
                                    const isHolidayDay = isHoliday(dayDate);
                                    const entryCount = dailyEntryCounts[dayIdx];

                                    return (
                                      <div
                                        key={`${employeeId}-total-${dayIdx}`}
                                        className={cn(
                                          "flex-1 border-r border-slate-200 bg-gradient-to-b from-blue-50 to-slate-50 p-2.5 flex items-center justify-center min-w-[100px]",
                                          isToday && "bg-primary/[0.08]",
                                          isWeekendDay && "bg-slate-100",
                                          isHolidayDay && "bg-orange-50",
                                        )}
                                      >
                                        <div className="w-full max-w-[90px]">
                                          <div className="w-full h-12 text-center text-sm font-black tabular-nums flex items-center justify-center rounded-xl border-2 border-slate-300 bg-white shadow-sm relative">
                                            {totalMinutes > 0
                                              ? formatMinutesToTime(
                                                  totalMinutes,
                                                )
                                              : "00:00"}
                                            {entryCount > 0 && (
                                              <span className="absolute top-1 right-1.5 text-[10px] font-black text-teal-600 bg-teal-50 rounded-full h-5 w-5 flex items-center justify-center border border-teal-200">
                                                {entryCount}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>

                              {/* RIGHT PANE - Status Indicators */}
                              <div className="w-[60px] bg-slate-50 border-l border-slate-200 flex items-center justify-center min-h-[68px]">
                                <div className="flex flex-col gap-1.5">
                                  <div className="h-5 w-5 bg-emerald-500 text-white rounded flex items-center justify-center mx-auto">
                                    <span className="text-[9px] font-black">
                                      {statusCounts.approved}
                                    </span>
                                  </div>
                                  <div className="h-5 w-5 bg-amber-500 text-white rounded flex items-center justify-center mx-auto">
                                    <span className="text-[9px] font-black">
                                      {statusCounts.revisionRequested}
                                    </span>
                                  </div>
                                  <div className="h-5 w-5 bg-blue-500 text-white rounded flex items-center justify-center mx-auto">
                                    <span className="text-[9px] font-black">
                                      {statusCounts.pending}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Employee Timesheet Content - Accordion with Scrolling */}
                            {isExpanded && (
                              <div className="bg-slate-50/30 border-t border-slate-200 max-h-[600px] overflow-y-auto">
                                {/* Project-wise grouped view with date grouping */}
                                {(() => {
                                  // Apply filter if selected
                                  const filteredRows = empTimesheet.rows.filter(
                                    (row) => {
                                      if (approvalProjectTypeFilter === "all")
                                        return true;
                                      const rowType =
                                        row.type || row.billable || row.udaName;
                                      return (
                                        rowType === approvalProjectTypeFilter
                                      );
                                    },
                                  );

                                  // Flatten to day-wise entries
                                  const dayWiseEntries: Array<{
                                    entryIdx: number;
                                    dayIdx: number;
                                    dayName: string;
                                    date: string;
                                    hours: string;
                                    udaName: string;
                                    projectName: string;
                                    projectId: string;
                                    type: string;
                                    comment: string | null;
                                    approvalStatus: string;
                                    meta: any;
                                    row: any;
                                  }> = [];

                                  let entryCounter = 0;
                                  filteredRows.forEach((row) => {
                                    row.hours.forEach((h, hIdx) => {
                                      if (h && h !== "00:00" && h !== "0:00") {
                                        const dayDate = weekDays[hIdx];
                                        const meta =
                                          row.entryMeta?.[hIdx] || null;
                                        dayWiseEntries.push({
                                          entryIdx: entryCounter++,
                                          dayIdx: hIdx,
                                          dayName: format(dayDate, "EEE"),
                                          date: format(dayDate, "dd MMM"),
                                          hours: h,
                                          udaName: row.udaName,
                                          projectName:
                                            row.projectName ||
                                            row.projectId ||
                                            "N/A",
                                          projectId: row.projectId || "N/A",
                                          type: row.type || row.billable,
                                          comment: row.comments?.[hIdx] || null,
                                          approvalStatus:
                                            meta?.approvalStatus || "pending",
                                          meta,
                                          row,
                                        });
                                      }
                                    });
                                  });

                                  // Group by project first, then by date
                                  const projectGroups: Record<
                                    string,
                                    Array<(typeof dayWiseEntries)[0]>
                                  > = {};
                                  dayWiseEntries.forEach((entry) => {
                                    const key = entry.projectId;
                                    if (!projectGroups[key]) {
                                      projectGroups[key] = [];
                                    }
                                    projectGroups[key].push(entry);
                                  });

                                  // Sort each project's entries by date
                                  Object.keys(projectGroups).forEach(
                                    (projectId) => {
                                      projectGroups[projectId].sort(
                                        (a, b) => a.dayIdx - b.dayIdx,
                                      );
                                    },
                                  );

                                  return (
                                    <div>
                                      {Object.keys(projectGroups).length ===
                                      0 ? (
                                        <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                          No entries for this week
                                        </div>
                                      ) : (
                                        Object.keys(projectGroups).map(
                                          (projectId) => {
                                            const projectEntries =
                                              projectGroups[projectId];
                                            const projectName =
                                              projectEntries[0]?.projectName ||
                                              projectId;

                                            // Group by date within project
                                            const dateGroups: Record<
                                              string,
                                              Array<(typeof projectEntries)[0]>
                                            > = {};
                                            projectEntries.forEach((entry) => {
                                              const dateKey = entry.date;
                                              if (!dateGroups[dateKey]) {
                                                dateGroups[dateKey] = [];
                                              }
                                              dateGroups[dateKey].push(entry);
                                            });

                                            const projectKey = `${employeeId}-${projectId}`;
                                            const isProjectExpanded =
                                              expandedProjects.has(projectKey);

                                            return (
                                              <div
                                                key={projectId}
                                                className="mb-4"
                                              >
                                                {/* Project Header - Collapsible */}
                                                <div
                                                  className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 flex items-center gap-3 cursor-pointer hover:from-indigo-700 hover:to-purple-700 transition-colors"
                                                  onClick={() => {
                                                    const newExpanded = new Set(
                                                      expandedProjects,
                                                    );
                                                    if (isProjectExpanded) {
                                                      newExpanded.delete(
                                                        projectKey,
                                                      );
                                                    } else {
                                                      newExpanded.add(
                                                        projectKey,
                                                      );
                                                    }
                                                    setExpandedProjects(
                                                      newExpanded,
                                                    );
                                                  }}
                                                >
                                                  <ChevronDown
                                                    className={cn(
                                                      "h-4 w-4 text-white transition-transform",
                                                      isProjectExpanded
                                                        ? "rotate-0"
                                                        : "-rotate-90",
                                                    )}
                                                  />
                                                  <span className="text-blue-200 font-black text-sm">
                                                    {projectId}
                                                  </span>
                                                  <Badge className="bg-white/20 text-white border-white/30 px-2 py-0.5 text-[10px] font-black">
                                                    {projectEntries.length}{" "}
                                                    entries
                                                  </Badge>
                                                </div>

                                                {/* Date Groups with Striped Backgrounds */}
                                                {isProjectExpanded && (
                                                  <div>
                                                    {Object.keys(
                                                      dateGroups,
                                                    ).map(
                                                      (dateKey, dateIdx) => {
                                                        const dateEntries =
                                                          dateGroups[dateKey];
                                                        const isStriped =
                                                          dateIdx % 2 === 1;

                                                        return (
                                                          <div
                                                            key={dateKey}
                                                            className={cn(
                                                              "divide-y divide-slate-200",
                                                              isStriped
                                                                ? "bg-slate-100/50"
                                                                : "bg-white",
                                                            )}
                                                          >
                                                            {dateEntries.map(
                                                              (
                                                                entry,
                                                                entryIdx,
                                                              ) => {
                                                                const entryKey = `${employeeId}-${entry.entryIdx}`;
                                                                const isChecked =
                                                                  selectedEntries.has(
                                                                    entryKey,
                                                                  ) ||
                                                                  (selectedEmployees.has(
                                                                    employeeId,
                                                                  ) &&
                                                                    !uncheckedEntries.has(
                                                                      entryKey,
                                                                    ));
                                                                const statusClass =
                                                                  entry.approvalStatus ===
                                                                  "approved"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                                                    : entry.approvalStatus ===
                                                                        "revision_requested"
                                                                      ? "bg-amber-50 text-amber-700 border-amber-300"
                                                                      : "bg-blue-50 text-blue-700 border-blue-300";

                                                                return (
                                                                  <div
                                                                    key={
                                                                      entryKey
                                                                    }
                                                                    className={cn(
                                                                      "flex items-center gap-4 px-6 py-3 transition-colors",
                                                                      entry.approvalStatus ===
                                                                        "approved"
                                                                        ? "bg-emerald-50/70 hover:bg-emerald-50"
                                                                        : "hover:bg-slate-50",
                                                                    )}
                                                                  >
                                                                    {/* Checkbox */}
                                                                    <Checkbox
                                                                      checked={
                                                                        isChecked
                                                                      }
                                                                      onCheckedChange={(
                                                                        checked,
                                                                      ) => {
                                                                        const newSelected =
                                                                          new Set(
                                                                            selectedEntries,
                                                                          );
                                                                        const newUnchecked =
                                                                          new Set(
                                                                            uncheckedEntries,
                                                                          );

                                                                        if (
                                                                          checked
                                                                        ) {
                                                                          newSelected.add(
                                                                            entryKey,
                                                                          );
                                                                          newUnchecked.delete(
                                                                            entryKey,
                                                                          );
                                                                        } else {
                                                                          newSelected.delete(
                                                                            entryKey,
                                                                          );
                                                                          if (
                                                                            selectedEmployees.has(
                                                                              employeeId,
                                                                            )
                                                                          ) {
                                                                            newUnchecked.add(
                                                                              entryKey,
                                                                            );
                                                                          }
                                                                        }
                                                                        setSelectedEntries(
                                                                          newSelected,
                                                                        );
                                                                        setUncheckedEntries(
                                                                          newUnchecked,
                                                                        );
                                                                      }}
                                                                      className="h-5 w-5"
                                                                    />

                                                                    {/* Day & Date + UDA Name & Hours Combined */}
                                                                    <div className="flex items-center gap-3 min-w-[400px]">
                                                                      {/* Day & Date */}
                                                                      <div className="w-20 flex flex-col shrink-0">
                                                                        <span className="text-xs font-black text-slate-700">
                                                                          {
                                                                            entry.dayName
                                                                          }
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-500">
                                                                          {
                                                                            entry.date
                                                                          }
                                                                        </span>
                                                                      </div>

                                                                      {/* UDA Name & Type */}
                                                                      <div className="flex-1 min-w-[180px]">
                                                                        <div className="flex flex-col gap-1">
                                                                          <span className="text-sm font-black text-slate-900">
                                                                            {
                                                                              entry.udaName
                                                                            }
                                                                            <span
                                                                              className={cn(
                                                                                "w-20 px-3 py-1.5 ml-2 rounded-lg border-2 text-center font-black text-sm shrink-0",
                                                                                statusClass,
                                                                              )}
                                                                            >
                                                                              {
                                                                                entry.hours
                                                                              }
                                                                            </span>
                                                                          </span>
                                                                          {/* Hours */}

                                                                          <div className="flex items-center gap-2">
                                                                            <Badge className="bg-indigo-100 text-indigo-700 border-none px-2 py-0.5 text-[9px] font-black h-4">
                                                                              {
                                                                                entry.type
                                                                              }
                                                                            </Badge>
                                                                          </div>
                                                                        </div>
                                                                      </div>
                                                                    </div>

                                                                    {/* Comments as Textarea */}
                                                                    <div className="flex-1 min-w-[300px] max-w-[500px]">
                                                                      <Textarea
                                                                        placeholder="Add approval comments..."
                                                                        defaultValue={
                                                                          entry.comment ||
                                                                          ""
                                                                        }
                                                                        className="min-h-[60px] text-xs resize-none bg-white border-slate-200 focus:border-primary"
                                                                        disabled={
                                                                          entry.approvalStatus ===
                                                                          "approved"
                                                                        }
                                                                      />
                                                                    </div>

                                                                    {/* Approve/Reject Buttons in Last Column - Icons Only */}
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                      {entry.approvalStatus !==
                                                                        "approved" && (
                                                                        <>
                                                                          <Button
                                                                            size="sm"
                                                                            className="h-9 w-9 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full"
                                                                            onClick={async () => {
                                                                              try {
                                                                                const managerId =
                                                                                  user?.employeeId ||
                                                                                  user?.id;
                                                                                if (
                                                                                  !managerId
                                                                                ) {
                                                                                  toast.error(
                                                                                    "Manager ID not found",
                                                                                  );
                                                                                  return;
                                                                                }
                                                                                await timesheetService.bulkApproveSelectedDays(
                                                                                  {
                                                                                    managerId,
                                                                                    projectId:
                                                                                      entry.projectId,
                                                                                    employeeId:
                                                                                      entry.employeeId,
                                                                                    weekStartDate:
                                                                                      entry.weekStartDate,
                                                                                    dayIndices:
                                                                                      [
                                                                                        entry.dayIndex,
                                                                                      ],
                                                                                  },
                                                                                );
                                                                                toast.success(
                                                                                  "Entry approved",
                                                                                );
                                                                                // Optionally reload approvals
                                                                                setForceReloadCounter(
                                                                                  (
                                                                                    c,
                                                                                  ) =>
                                                                                    c +
                                                                                    1,
                                                                                );
                                                                              } catch (error) {
                                                                                toast.error(
                                                                                  "Failed to approve entry",
                                                                                );
                                                                              }
                                                                            }}
                                                                            title="Approve"
                                                                          >
                                                                            <Check className="h-4 w-4" />
                                                                          </Button>
                                                                          <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="h-9 w-9 p-0 border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-full"
                                                                            onClick={async () => {
                                                                              try {
                                                                                const managerId =
                                                                                  user?.employeeId ||
                                                                                  user?.id;
                                                                                if (
                                                                                  !managerId
                                                                                ) {
                                                                                  toast.error(
                                                                                    "Manager ID not found",
                                                                                  );
                                                                                  return;
                                                                                }
                                                                                await timesheetService.requestRevision(
                                                                                  {
                                                                                    managerId,
                                                                                    projectId:
                                                                                      entry.projectId,
                                                                                    employeeId:
                                                                                      entry.employeeId,
                                                                                    weekStartDate:
                                                                                      entry.weekStartDate,
                                                                                    reverts:
                                                                                      [
                                                                                        {
                                                                                          dayIndex:
                                                                                            entry.dayIndex,
                                                                                          udaId:
                                                                                            entry.udaId,
                                                                                          reason:
                                                                                            rejectComment ||
                                                                                            "Rejected by manager",
                                                                                        },
                                                                                      ],
                                                                                  },
                                                                                );
                                                                                toast.success(
                                                                                  "Entry rejected",
                                                                                );
                                                                                setForceReloadCounter(
                                                                                  (
                                                                                    c,
                                                                                  ) =>
                                                                                    c +
                                                                                    1,
                                                                                );
                                                                              } catch (error) {
                                                                                toast.error(
                                                                                  "Failed to reject entry",
                                                                                );
                                                                              }
                                                                            }}
                                                                            title="Reject"
                                                                          >
                                                                            <X className="h-4 w-4" />
                                                                          </Button>
                                                                        </>
                                                                      )}
                                                                      {entry.approvalStatus ===
                                                                        "approved" && (
                                                                        <div className="flex items-center justify-center h-9 w-9 bg-emerald-500 rounded-full">
                                                                          <Check className="h-4 w-4 text-white" />
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                );
                                                              },
                                                            )}
                                                          </div>
                                                        );
                                                      },
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          },
                                        )
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </div>

            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setDeleteRowId(null);
                  setDeleteRowLabel("");
                }
                setDeleteDialogOpen(open);
              }}
            >
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Are you sure you want to delete?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the row for{" "}
                    <strong>{deleteRowLabel || "this task"}</strong> from your
                    timesheet. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteRow}
                    className="rounded-xl bg-red-600 hover:bg-red-700 font-bold gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Validation Dialog - 8 Hour Check */}
            <AlertDialog
              open={validationDialogOpen}
              onOpenChange={setValidationDialogOpen}
            >
              <AlertDialogContent className="rounded-2xl max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-5 w-5" />
                    Insufficient Hours
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base">
                    Each working day must have at least 8 hours. Days with less
                    than 8 hours:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 space-y-2">
                  {invalidDaysList.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span className="text-sm font-semibold text-amber-900">
                        {day}
                      </span>
                    </div>
                  ))}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setValidationDialogOpen(false);
                      setInvalidDaysList([]);
                    }}
                    className="rounded-xl font-bold gap-2"
                  >
                    <X className="h-4 w-4" />
                    OK, I'll Add More Hours
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Submit Confirmation Dialog */}
            <AlertDialog
              open={submitConfirmDialogOpen}
              onOpenChange={setSubmitConfirmDialogOpen}
            >
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-teal-600">
                    <Send className="h-5 w-5" />
                    Submit Timesheet?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to submit your timesheet for the week
                    of{" "}
                    <strong>
                      {format(startDate, "MMM dd")} -{" "}
                      {format(endDate, "MMM dd, yyyy")}
                    </strong>
                    ?
                    <br />
                    <br />
                    Once submitted, your timesheet will be sent to your project
                    manager for approval. You can still edit entries if revision
                    is requested.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setSubmitConfirmDialogOpen(false);
                      handleSubmitWeek();
                    }}
                    className="rounded-xl bg-teal-600 hover:bg-teal-700 font-bold gap-2"
                    disabled={isSaving}
                  >
                    <Send className="h-4 w-4" />
                    {isSaving ? "Submitting..." : "Yes, Submit"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
              open={revertDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setRevertTarget(null);
                  setRevertComment("");
                }
                setRevertDialogOpen(open);
              }}
            >
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Request revision</AlertDialogTitle>
                  <AlertDialogDescription>
                    Add a comment for {revertTarget?.label || "this entry"}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="px-1">
                  <Textarea
                    value={revertComment}
                    onChange={(e) => setRevertComment(e.target.value)}
                    className="min-h-[120px] text-xs font-bold rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-primary/20 resize-none"
                    placeholder="Explain what needs to be fixed..."
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmRevertDay}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 font-bold gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Send Back
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Rejection Dialog */}
            <AlertDialog
              open={rejectDialogOpen}
              onOpenChange={(open) => {
                if (!open) {
                  setRejectComment("");
                  setSelectedDaysForReject(new Set());
                }
                setRejectDialogOpen(open);
              }}
            >
              <AlertDialogContent className="rounded-2xl max-w-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Bulk Rejection - Request Revision
                    </div>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    {(() => {
                      const hasSelectedEntries = selectedEntries.size > 0;
                      const isMultiEmployee =
                        approvalFilters.employeeIds.length > 1;

                      if (hasSelectedEntries) {
                        return `You are rejecting ${selectedEntries.size} selected entry(s).`;
                      }

                      if (isMultiEmployee) {
                        return `You are rejecting entries for ${selectedEmployees.size} selected employee(s)${
                          selectedDaysForApproval.size > 0
                            ? ` on ${selectedDaysForApproval.size} selected day(s)`
                            : " (all pending days)"
                        }.`;
                      }

                      return `You are rejecting ${selectedDaysForApproval.size} day(s) from the timesheet.`;
                    })()}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 px-1">
                  {/* Week days selection for additional filtering */}
                  {approvalFilters.employeeIds.length > 1 &&
                    selectedDaysForApproval.size > 0 && (
                      <div className="bg-slate-50 p-4 rounded-xl">
                        <Label className="text-sm font-bold text-slate-700 mb-3 block">
                          Selected Days Summary
                        </Label>
                        <div className="grid grid-cols-7 gap-2">
                          {weekDays.map((day, idx) => {
                            const isSelected = selectedDaysForApproval.has(idx);
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "text-center p-2 rounded-lg text-xs font-semibold",
                                  isSelected
                                    ? "bg-red-100 text-red-700 border-2 border-red-300"
                                    : "bg-slate-200 text-slate-400",
                                )}
                              >
                                <div>{format(day, "EEE")}</div>
                                <div className="text-[10px]">
                                  {format(day, "dd")}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Rejection reason */}
                  <div>
                    <Label className="text-sm font-bold text-slate-700 mb-2 block">
                      Reason for Rejection{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={rejectComment}
                      onChange={(e) => setRejectComment(e.target.value)}
                      className="min-h-[120px] text-sm rounded-xl border-red-200 bg-red-50/50 focus-visible:ring-red-400/20 resize-none"
                      placeholder="Please explain what needs to be corrected in these timesheets..."
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      This message will be sent to all selected employees.
                    </p>
                  </div>
                </div>

                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl font-semibold gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmBulkRevert}
                    disabled={!rejectComment.trim()}
                    className="rounded-xl bg-red-600 hover:bg-red-700 font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Send Rejection
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Category Assignment Detail Dialog */}
            <AlertDialog
              open={categoryDialogOpen}
              onOpenChange={setCategoryDialogOpen}
            >
              <AlertDialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <LayoutGrid className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div>Category Assignments</div>
                      {categoryDialogData && (
                        <div className="text-sm font-medium text-slate-500 mt-1">
                          {categoryDialogData.projectName} (
                          {categoryDialogData.projectCode}) -{" "}
                          {format(
                            categoryDialogData.dayDate,
                            "EEEE, MMMM dd, yyyy",
                          )}
                        </div>
                      )}
                    </div>
                  </AlertDialogTitle>
                </AlertDialogHeader>

                {categoryDialogData && (
                  <div className="max-h-[65vh] overflow-y-auto">
                    {/* Table Layout for Categories */}
                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                      {/* Table Header */}
                      <div className="bg-slate-100 border-b-2 border-slate-200">
                        <div className="grid grid-cols-12 gap-3 px-4 py-3">
                          <div className="col-span-3 text-xs font-black text-slate-600 uppercase tracking-wider flex items-center">
                            Category
                          </div>
                          <div className="col-span-3 text-xs font-black text-slate-600 uppercase tracking-wider flex items-center">
                            Sub Category
                          </div>
                          <div className="col-span-2 text-xs font-black text-slate-600 uppercase tracking-wider text-center flex items-center justify-center">
                            Hours
                          </div>
                          <div className="col-span-3 text-xs font-black text-slate-600 uppercase tracking-wider flex items-center">
                            Comments
                          </div>
                          <div className="col-span-1 text-xs font-black text-slate-600 uppercase tracking-wider text-center flex items-center justify-center">
                            Actions
                          </div>
                        </div>
                      </div>

                      {/* Table Body */}
                      <div className="divide-y divide-slate-200">
                        {/* Existing categories */}
                        {categoryDialogData.categories.map((category, idx) => {
                          const cellKey = `${category.rowId}-${categoryDialogData.dayIndex}`;
                          const cellError = cellErrors[cellKey];
                          const entryMeta = category.entryMeta;
                          const isRevisionRequested =
                            entryMeta?.approvalStatus === "revision_requested";
                          const isApproved =
                            entryMeta?.approvalStatus === "approved";
                          const revisionReason = entryMeta?.rejectedReason;

                          return (
                            <div
                              key={category.rowId}
                              className={cn(
                                "grid grid-cols-12 gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
                                isRevisionRequested && "bg-amber-50/50",
                                isApproved && "bg-emerald-50/50",
                              )}
                            >
                              {/* Category Type Column */}
                              <div className="col-span-3 flex items-center overflow-hidden">
                                <span
                                  className={cn(
                                    "px-2 py-1 rounded-md text-xs font-bold",
                                    category.billable === "Billable"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-orange-100 text-orange-700",
                                  )}
                                >
                                  {category.billable}
                                </span>
                              </div>

                              {/* Sub Category Name Column */}
                              <div className="col-span-3 flex items-center overflow-hidden">
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <p className="text-sm font-bold text-slate-900 truncate">
                                    {category.udaName}
                                  </p>
                                  {isRevisionRequested && revisionReason && (
                                    <p className="text-xs text-amber-700 mt-1 line-clamp-1 break-words">
                                      ⚠️ {revisionReason}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Hours Column */}
                              <div className="col-span-2 flex items-center justify-center">
                                <Input
                                  type="time"
                                  value={category.hours || ""}
                                  onChange={(e) =>
                                    handleCategoryHourChange(
                                      category.rowId,
                                      e.target.value,
                                    )
                                  }
                                  disabled={isApproved}
                                  className={cn(
                                    "text-center font-black text-base w-full min-w-[90px] max-w-[100px]",
                                    cellError && "border-red-500 bg-red-50",
                                    isApproved &&
                                      "bg-slate-100 cursor-not-allowed",
                                  )}
                                />
                              </div>

                              {/* Comments Column */}
                              <div className="col-span-3 flex items-center overflow-hidden">
                                <Textarea
                                  value={category.comment || ""}
                                  onChange={(e) =>
                                    handleCategoryCommentChange(
                                      category.rowId,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Add notes about this work..."
                                  className={cn(
                                    "min-h-[60px] text-sm resize-y w-full break-words",
                                    isApproved &&
                                      "bg-slate-100 cursor-not-allowed",
                                  )}
                                  disabled={isApproved}
                                />
                              </div>

                              {/* Action Buttons Column */}
                              <div className="col-span-1 flex items-center justify-center">
                                {!isApproved ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (!categoryDialogData) return;

                                      // Clear hours and comments for this day only
                                      setRows(
                                        (prev) =>
                                          prev
                                            .map((r) => {
                                              if (r.id === category.rowId) {
                                                const newHours = [...r.hours];
                                                const newComments = [
                                                  ...r.comments,
                                                ];
                                                const newEntryMeta = r.entryMeta
                                                  ? [...r.entryMeta]
                                                  : new Array(7).fill(null);

                                                // Clear the current day
                                                newHours[
                                                  categoryDialogData.dayIndex
                                                ] = "00:00";
                                                newComments[
                                                  categoryDialogData.dayIndex
                                                ] = "";
                                                newEntryMeta[
                                                  categoryDialogData.dayIndex
                                                ] = null;

                                                // Check if all days now have zero hours
                                                const hasAnyHours =
                                                  newHours.some(
                                                    (h) =>
                                                      h &&
                                                      h !== "00:00" &&
                                                      h !== "0",
                                                  );

                                                // Return null if no hours anywhere (will be filtered out)
                                                if (!hasAnyHours) {
                                                  return null;
                                                }

                                                // Otherwise return updated row
                                                return {
                                                  ...r,
                                                  hours: newHours,
                                                  comments: newComments,
                                                  entryMeta: newEntryMeta,
                                                };
                                              }
                                              return r;
                                            })
                                            .filter(Boolean) as TimesheetRow[],
                                      );

                                      // Update dialog data - remove this category from dialog
                                      setCategoryDialogData((prev) => {
                                        if (!prev) return prev;
                                        return {
                                          ...prev,
                                          categories: prev.categories.filter(
                                            (c) => c.rowId !== category.rowId,
                                          ),
                                        };
                                      });

                                      toast.success(
                                        `Cleared ${category.udaName} for ${format(categoryDialogData.dayDate, "EEEE")}`,
                                      );
                                    }}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 category-delete-btn"
                                    title="Clear this category for this day"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <div
                                    className="h-8 w-8 flex items-center justify-center"
                                    title="Approved"
                                  >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty row for adding new category - Always at the bottom */}
                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 category-empty-row">
                          {/* Category Type Dropdown */}
                          <div className="col-span-3 flex items-center">
                            <Select
                              value={selectedCategoryType}
                              onValueChange={(
                                value: "Billable" | "Non-Billable",
                              ) => {
                                setSelectedCategoryType(value);
                                setSelectedCategoryToAdd(""); // Reset sub category when category changes
                              }}
                            >
                              <SelectTrigger className="h-10 w-full rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-50 font-semibold text-sm focus:ring-2 focus:ring-teal-500 transition-all">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-xl border-2 border-slate-200">
                                <SelectItem
                                  value="Billable"
                                  className="rounded-lg py-2 px-3 hover:bg-blue-50 transition-colors cursor-pointer"
                                >
                                  <span className="text-sm font-semibold text-blue-700">
                                    Billable
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value="Non-Billable"
                                  className="rounded-lg py-2 px-3 hover:bg-orange-50 transition-colors cursor-pointer"
                                >
                                  <span className="text-sm font-semibold text-orange-700">
                                    Non-Billable
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sub Category Dropdown */}
                          <div className="col-span-3 flex items-center">
                            <Select
                              value={selectedCategoryToAdd}
                              onValueChange={(value) => {
                                if (!value || !categoryDialogData) return;

                                const selectedConfig = configurations?.find(
                                  (c) => (c.id || c._id) === value,
                                );

                                if (!selectedConfig) return;

                                // Find flResource for this project
                                const flResource = userFlResources.find(
                                  (fl) =>
                                    (fl.projectId || fl.projectOid) ===
                                    categoryDialogData.projectId,
                                );

                                // Create new row
                                const newRow: TimesheetRow = {
                                  id: Math.random()
                                    .toString(36)
                                    .substring(2, 11),
                                  projectId: categoryDialogData.projectId,
                                  projectCode: categoryDialogData.projectCode,
                                  projectName: categoryDialogData.projectName,
                                  udaId:
                                    selectedConfig.id ||
                                    selectedConfig._id ||
                                    "",
                                  udaName: selectedConfig.name,
                                  type: selectedConfig.type || "General",
                                  financialLineItem: flResource?.flNo || "",
                                  billable: selectedConfig.billable,
                                  hours: new Array(7).fill("00:00"),
                                  comments: new Array(7).fill(""),
                                  entryMeta: new Array(7).fill(null),
                                };

                                // Add to rows state
                                setRows((prev) => [...prev, newRow]);

                                // Update dialog data to include the new category at the end
                                setCategoryDialogData((prev) => {
                                  if (!prev) return prev;
                                  return {
                                    ...prev,
                                    categories: [
                                      ...prev.categories,
                                      {
                                        rowId: newRow.id,
                                        udaId: newRow.udaId,
                                        udaName: newRow.udaName,
                                        type: newRow.type,
                                        financialLineItem:
                                          newRow.financialLineItem,
                                        billable: newRow.billable,
                                        hours:
                                          newRow.hours[
                                            categoryDialogData.dayIndex
                                          ],
                                        comment:
                                          newRow.comments[
                                            categoryDialogData.dayIndex
                                          ],
                                        entryMeta:
                                          newRow.entryMeta?.[
                                            categoryDialogData.dayIndex
                                          ],
                                      },
                                    ],
                                  };
                                });

                                setSelectedCategoryToAdd("");
                                setSelectedCategoryType("");
                                toast.success(
                                  `✅ ${selectedConfig.name} added successfully!`,
                                );
                              }}
                              disabled={!selectedCategoryType}
                            >
                              <SelectTrigger
                                className={cn(
                                  "h-10 w-full rounded-lg border-2 bg-white font-semibold text-sm focus:ring-2 focus:ring-teal-500 transition-all",
                                  !selectedCategoryType
                                    ? "border-slate-200 bg-slate-100 cursor-not-allowed opacity-60"
                                    : "border-slate-300 hover:bg-slate-50",
                                )}
                              >
                                <SelectValue
                                  placeholder={
                                    selectedCategoryType
                                      ? "Choose..."
                                      : "Select category first"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl shadow-xl border-2 border-slate-200">
                                <div className="px-2 py-2">
                                  {(() => {
                                    if (!selectedCategoryType) {
                                      return (
                                        <div className="px-4 py-8 text-center">
                                          <p className="text-sm font-semibold text-slate-400">
                                            Please select a category first
                                          </p>
                                        </div>
                                      );
                                    }

                                    const availableConfigs =
                                      configurations?.filter(
                                        (config) =>
                                          config.billable ===
                                            selectedCategoryType &&
                                          !categoryDialogData.categories.some(
                                            (cat) =>
                                              cat.udaId ===
                                              (config.id || config._id),
                                          ),
                                      ) || [];

                                    if (availableConfigs.length === 0) {
                                      return (
                                        <div className="px-4 py-8 text-center">
                                          <p className="text-sm font-semibold text-slate-400">
                                            ✅ All {selectedCategoryType}{" "}
                                            categories added
                                          </p>
                                        </div>
                                      );
                                    }

                                    return availableConfigs.map((config) => {
                                      const configId = (
                                        config.id ||
                                        config._id ||
                                        ""
                                      ).toString();
                                      return (
                                        <SelectItem
                                          key={configId}
                                          value={configId}
                                          className={cn(
                                            "rounded-lg py-1.5 px-3 transition-colors cursor-pointer",
                                            selectedCategoryType === "Billable"
                                              ? "hover:bg-blue-50"
                                              : "hover:bg-orange-50",
                                          )}
                                        >
                                          <span className="text-sm font-semibold text-slate-800">
                                            {config.name}
                                          </span>
                                        </SelectItem>
                                      );
                                    });
                                  })()}
                                </div>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <Input
                              type="time"
                              value=""
                              readOnly
                              className="text-center font-black text-base w-full min-w-[90px] max-w-[100px] bg-slate-50 cursor-not-allowed"
                              placeholder="00:00"
                            />
                          </div>
                          <div className="col-span-3 flex items-center overflow-hidden">
                            <Textarea
                              value=""
                              readOnly
                              placeholder="Add notes about this work..."
                              className="min-h-[60px] text-sm resize-y w-full break-words bg-slate-50 cursor-not-allowed"
                            />
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled
                              className="h-8 w-8 p-0 text-red-600 opacity-30 cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setCategoryDialogOpen(false)}
                    className="rounded-xl font-semibold"
                  >
                    Close
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WeeklyTimesheet;
