# Employee Hours Report - Complete Migration Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [File Structure & Paths](#file-structure--paths)
4. [Dependencies & Packages](#dependencies--packages)
5. [Database Models](#database-models)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Data Flow](#data-flow)
9. [Chart Implementations](#chart-implementations)
10. [UI Layout & Alignment](#ui-layout--alignment)
11. [Migration Checklist](#migration-checklist)

---

## Overview

The **Employee Hours Report** is a comprehensive reporting module that provides role-based analytics for employee time tracking, project allocations, and approval workflows.

### Key Features

- 📊 **Multi-role Support**: EMPLOYEE, MANAGER, RMG (Resource Management Group)
- 📈 **Interactive Charts**: Semi-circle allocation gauge, monthly progress bars, approval status doughnuts
- 📅 **Flexible Date Ranges**: Current week/month, last 3/6 months, last year, custom range
- 🔍 **Advanced Filtering**: Project, department, employee-specific filters
- 📥 **CSV Export**: Download report data for offline analysis
- ⏱️ **Embedded Timesheet View**: Full weekly timesheet integration

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  EmployeeHoursReport.tsx (Main Component)            │  │
│  │  - Chart Components (Recharts)                       │  │
│  │  - WeeklyTimesheet Integration                       │  │
│  │  - Filters & Date Range Selector                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  employeeHoursReportService.ts (API Client)          │  │
│  │  - getReport()                                       │  │
│  │  - getProjects()                                     │  │
│  │  - getDepartments()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTP API
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Node.js + Express)                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  employeeHoursReport.ts (Express Router)             │  │
│  │  - GET /api/employee-hours-report                    │  │
│  │  - GET /api/employee-hours-report/projects           │  │
│  │  - GET /api/employee-hours-report/departments        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB Models                                      │  │
│  │  - TimesheetEntry                                    │  │
│  │  - FLResource (Financial Line Resource)             │  │
│  │  - Project                                           │  │
│  │  - Employee                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure & Paths

### Frontend Files

```
src/
├── pages/
│   └── rmg/
│       └── reports/
│           └── EmployeeHoursReport.tsx              # Main report component (2,391 lines)
│       └── uda-configuration/
│           └── WeeklyTimesheet.tsx                  # Embedded timesheet component
│
├── services/
│   ├── employeeHoursReportService.ts                # API service layer (112 lines)
│   ├── flResourceService.ts                         # FL Resource API calls
│   ├── projectService.ts                            # Project API calls
│   └── api.ts                                       # Base API client (axios)
│
├── components/
│   └── ui/                                          # Shadcn UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── badge.tsx
│       ├── popover.tsx
│       └── ...
│
└── store/
    └── authStore.ts                                 # Zustand auth state management
```

### Backend Files

```
server/
├── src/
│   ├── routes/
│   │   └── employeeHoursReport.ts                   # Express route handlers (394 lines)
│   │
│   ├── models/
│   │   ├── TimesheetEntry.ts                       # Timesheet entry schema
│   │   ├── FLResource.ts                           # Resource allocation schema
│   │   ├── Project.ts                              # Project schema
│   │   └── Employee.ts                             # Employee schema
│   │
│   └── server.ts                                    # Main server file (route registration)
│
└── package.json                                     # Backend dependencies
```

---

## Dependencies & Packages

### Frontend Dependencies (package.json)

#### Chart Library

```json
{
  "recharts": "^2.15.0"
}
```

**Purpose**: Primary charting library for all visualizations

- Semi-circle gauge (PieChart with startAngle/endAngle)
- Doughnut charts for approval status
- Bar charts for allocation timelines
- Responsive container support

#### UI Framework

```json
{
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-select": "^2.1.4",
  "@radix-ui/react-tabs": "^1.1.2",
  "@radix-ui/react-label": "^2.1.1",
  "@radix-ui/react-popover": "^1.1.15",
  "@radix-ui/react-tooltip": "^1.2.8"
}
```

**Purpose**: Accessible, unstyled UI primitives (Shadcn UI base)

#### Date Handling

```json
{
  "date-fns": "^4.1.0"
}
```

**Purpose**: Date manipulation and formatting

- `format()` - Format dates for display
- `startOfWeek()`, `endOfWeek()` - Week calculations
- `startOfMonth()`, `endOfMonth()` - Month boundaries
- `subMonths()`, `subYears()` - Date range calculations
- `eachDayOfInterval()` - Daily progress bar generation

#### HTTP Client

```json
{
  "axios": "^1.13.2"
}
```

**Purpose**: API communication with backend

#### State Management

```json
{
  "zustand": "^5.0.2"
}
```

**Purpose**: Lightweight state management (auth store)

#### Icons

```json
{
  "lucide-react": "^0.468.0"
}
```

**Purpose**: Icon library (FileText, Download, PieChart, etc.)

#### Styling

```json
{
  "tailwindcss": "^3.4.17",
  "tailwind-merge": "^2.6.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

**Purpose**: Utility-first CSS framework

#### Notifications

```json
{
  "sonner": "^1.7.1"
}
```

**Purpose**: Toast notifications

#### Export Functionality

```json
{
  "jspdf": "^4.0.0",
  "jspdf-autotable": "^5.0.7",
  "xlsx": "^0.18.5"
}
```

**Purpose**: PDF and Excel export capabilities

### Backend Dependencies (server/package.json)

```json
{
  "express": "^4.x.x",
  "mongoose": "^8.x.x",
  "cors": "^2.x.x",
  "dotenv": "^16.x.x"
}
```

---

## Database Models

### 1. TimesheetEntry Model

**Path**: `server/src/models/TimesheetEntry.ts`

```typescript
interface ITimesheetEntry {
  employeeId: string;
  employeeName: string;
  projectId: string;
  projectName: string;
  date: Date;
  hours: string; // Format: "HH:MM"
  udaId: string; // Category/Activity ID
  udaName: string;
  type: string; // "Billable" | "Non-Billable"
  billable: string;
  financialLineItem: string;
  comment: string;
  approvalStatus: string; // "pending" | "approved" | "rejected" | "revision_requested"
  weekStartDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. FLResource Model (Financial Line Resource)

**Path**: `server/src/models/FLResource.ts`

```typescript
interface IFLResource {
  employeeId: string;
  projectId: ObjectId; // Reference to Project
  percentage: number; // Allocation percentage (0-100)
  startDate: Date;
  endDate: Date;
  totalAllocation: string; // Total hours as string
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Project Model

**Path**: `server/src/models/Project.ts`

```typescript
interface IProject {
  projectId: string; // Custom project identifier
  projectName: string;
  projectCode: string;
  projectManager: {
    employeeId: string;
    name: string;
  };
  startDate: Date;
  endDate: Date;
  status: string;
}
```

### 4. Employee Model

**Path**: `server/src/models/Employee.ts`

```typescript
interface IEmployee {
  employeeId: string; // Custom employee identifier
  name: string;
  email: string;
  department: string;
  role: "EMPLOYEE" | "MANAGER" | "RMG";
  createdAt: Date;
}
```

---

## Backend Implementation

### Route Setup

**File**: `server/src/routes/employeeHoursReport.ts`

#### Base Route

```
GET /api/employee-hours-report
```

#### Query Parameters

| Parameter    | Type   | Required    | Description                                |
| ------------ | ------ | ----------- | ------------------------------------------ |
| `role`       | string | ✅ Yes      | User role: "EMPLOYEE", "MANAGER", or "RMG" |
| `employeeId` | string | Conditional | Required for EMPLOYEE role                 |
| `managerId`  | string | Conditional | Required for MANAGER role                  |
| `month`      | string | ❌ No       | Format: YYYY-MM (optional with date range) |
| `startDate`  | string | ❌ No       | ISO date string                            |
| `endDate`    | string | ❌ No       | ISO date string                            |
| `projectId`  | string | ❌ No       | Filter by specific project                 |
| `department` | string | ❌ No       | Filter by department (RMG only)            |

#### Response Structure

```typescript
{
  employees: EmployeeHoursData[],
  summary: ReportSummary,
  filters: {
    role: string,
    month: string | null,
    projectId: string | null,
    startDate: string | null,
    endDate: string | null,
    department: string | null
  }
}
```

### Key Business Logic

#### 1. Role-Based Data Access

**EMPLOYEE Role**:

```typescript
if (role === "EMPLOYEE") {
  // Employee can only see their own report
  employeeIds = [employeeId];
}
```

**MANAGER Role**:

```typescript
if (role === "MANAGER") {
  // Find projects managed by this manager
  const managerProjects = await Project.find({
    "projectManager.employeeId": managerId,
  });

  // Get employees allocated to those projects
  const flResources = await FLResource.find({
    projectId: { $in: projectObjectIds },
  });

  employeeIds = [...new Set(flResources.map((r) => r.employeeId))];
}
```

**RMG Role**:

```typescript
if (role === "RMG") {
  if (projectId) {
    // Filter by project allocation
    const flResources = await FLResource.find({ projectId });
    employeeIds = [...new Set(flResources.map((r) => r.employeeId))];
  } else {
    // Get all employees (with optional department filter)
    const employees = await Employee.find(departmentQuery);
    employeeIds = employees.map((e) => e.employeeId);
  }
}
```

#### 2. Data Aggregation

For each employee, the system calculates:

```typescript
// Allocation hours from FLResource
const allocationHours = allocations.reduce(
  (total, alloc) => total + parseFloat(alloc.totalAllocation),
  0,
);

// Actual hours from TimesheetEntry
const actualBillableHours = entries
  .filter((e) => e.billable === "Billable")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

const actualNonBillableHours = entries
  .filter((e) => e.billable === "Non-Billable")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

// Approved hours
const approvedHours = entries
  .filter((e) => e.approvalStatus === "approved")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

// Pending hours
const pendingApprovedHours = entries
  .filter((e) => e.approvalStatus === "pending")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

// Rejected hours
const rejectedHours = entries
  .filter((e) => e.approvalStatus === "rejected")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

// Revision requested hours
const revisionRequestedHours = entries
  .filter((e) => e.approvalStatus === "revision_requested")
  .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);
```

#### 3. Helper Function

```typescript
function convertHoursToDecimal(timeString: string): number {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours + minutes / 60;
}
```

### Additional Routes

#### Get Projects

```
GET /api/employee-hours-report/projects?role=MANAGER&managerId=MGR001
```

#### Get Departments

```
GET /api/employee-hours-report/departments
```

---

## Frontend Implementation

### Main Component Structure

**File**: `src/pages/rmg/reports/EmployeeHoursReport.tsx`

#### State Management

```typescript
// Data state
const [reportData, setReportData] = useState<EmployeeHoursData[]>([]);
const [summary, setSummary] = useState<ReportSummary | null>(null);
const [projectAllocations, setProjectAllocations] = useState<any[]>([]);
const [approvalStatusData, setApprovalStatusData] = useState<any[]>([]);

// Filter state
const [dateRangeType, setDateRangeType] = useState<string>("current_month");
const [startDate, setStartDate] = useState<string>("");
const [endDate, setEndDate] = useState<string>("");
const [selectedProject, setSelectedProject] = useState<string>("");
const [selectedDepartment, setSelectedDepartment] = useState<string>("all");

// UI state
const [isLoading, setIsLoading] = useState(false);
const [activeTab, setActiveTab] = useState("overview");
const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
const [tempStartDate, setTempStartDate] = useState("");
const [tempEndDate, setTempEndDate] = useState("");
```

#### Key Functions

**1. Load Report Data**

```typescript
const loadReport = async () => {
  const filters: ReportFilters = {
    role: userRole as "EMPLOYEE" | "RMG" | "MANAGER",
    employeeId: userRole === "EMPLOYEE" ? user.employeeId : undefined,
    managerId: userRole === "MANAGER" ? user.employeeId : undefined,
    projectId: selectedProject !== "all" ? selectedProject : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    department: selectedDepartment !== "all" ? selectedDepartment : undefined,
  };

  const response = await employeeHoursReportService.getReport(filters);
  setReportData(response.employees);
  setSummary(response.summary);
};
```

**2. Load Project Allocations**

```typescript
const loadProjectAllocations = async () => {
  // For MANAGER role
  if (userRole === "MANAGER") {
    const managedProjects = await projectService.getAll();
    const userManagedProjects = managedProjects.filter(
      (project) => project.projectManager?.employeeId === user.employeeId,
    );

    // Get FL Resources for managed projects
    const allocations = await flResourceService.getAll();
    // Process and set allocations
  }

  // For EMPLOYEE role
  if (userRole === "EMPLOYEE") {
    const allocations = await flResourceService.getByEmployeeId(
      user.employeeId,
    );
    // Process employee allocations
  }
};
```

**3. Date Range Calculation**

```typescript
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
    // ... other cases
  }

  setStartDate(start);
  setEndDate(end);
}, [dateRangeType]);
```

#### Component Structure

```tsx
<div className="page-container">
  {/* Header with Export */}
  <div className="page-header">
    <h1>Employee Hours Report</h1>
    <Button onClick={exportToCSV}>Export CSV</Button>
  </div>

  {/* Custom Date Range Dialog */}
  <Dialog open={customDateDialogOpen}>{/* Date picker UI */}</Dialog>

  {/* Search Bar (RMG/Manager only) */}
  {canSeeFilters && <Input placeholder="Search..." />}

  {/* Tabbed Interface */}
  <Tabs value={activeTab} onValueChange={setActiveTab}>
    <TabsList>
      <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
      <TabsTrigger value="details">Detailed Report</TabsTrigger>
    </TabsList>

    {/* Date Range Filter */}
    <Select value={dateRangeType} onValueChange={setDateRangeType}>
      <SelectItem value="current_week">Current Week</SelectItem>
      <SelectItem value="current_month">Current Month</SelectItem>
      <SelectItem value="custom">Custom Range</SelectItem>
    </Select>

    {/* Overview Tab */}
    <TabsContent value="overview">
      {/* Three-Column Layout: 25% | 65% | 35% */}
      <div className="flex lg:flex-row gap-6 items-stretch">
        {/* Left Column (25%): Allocation Summary Semi-Circle */}
        <Card className="w-[25%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">
              Allocation Summary
            </CardTitle>
            <CardDescription>Total allocation percentage</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex items-center justify-center">
            <AllocationSummaryChart data={allocationData} />
          </CardContent>
        </Card>

        {/* Right Section (75%): Project Allocations + Approval Status */}
        <div className="w-[75%] flex gap-6">
          {/* Project Allocations Timeline (65% of right section) */}
          <Card className="w-[65%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Project Allocations
              </CardTitle>
              <CardDescription>Daily allocation timeline</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col flex-1">
              <div className="w-full min-w-full flex flex-col h-full">
                {/* Bottom-aligned chart with mt-auto */}
                <div className="mt-auto w-full pb-20">
                  <MonthlyDailyAllocationChart
                    data={monthlyDailyAllocationData}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Approval Status Doughnut (35% of right section) */}
          <Card className="w-[35%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-slate-800">
                Approval Status
              </CardTitle>
              <CardDescription>Approval lifecycle breakdown</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <ApprovalStatusDoughnut data={approvalData} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manager-specific Employee Table */}
      {userRole === "MANAGER" && <EmployeeApprovalTable />}

      {/* Embedded Weekly Timesheet */}
      <WeeklyTimesheet
        initialDate={startOfWeek(new Date(startDate))}
        isReportView={true}
      />
    </TabsContent>

    {/* Details Tab */}
    <TabsContent value="details">
      <Table>{/* Employee hours data table */}</Table>
    </TabsContent>
  </Tabs>
</div>
```

---

## Data Flow

### 1. Initial Load Sequence

```
User Navigates to Report
         ↓
useEffect: Load Initial Data
         ↓
Calculate Date Range (current_month)
         ↓
┌────────────────┬─────────────────┐
│                │                 │
loadReport()  loadProjectAllocations()
      ↓              ↓
  API Call      API Call to FLResource
      ↓              ↓
setReportData() setProjectAllocations()
      ↓              ↓
  Render Charts & Tables
```

### 2. Filter Change Sequence

```
User Changes Date Range
         ↓
setDateRangeType("last_3_months")
         ↓
useEffect calculates new dates
         ↓
setStartDate() & setEndDate()
         ↓
useEffect: Auto-reload
         ↓
loadReport() with new filters
         ↓
Update UI
```

### 3. Data Transformation Pipeline

```
Raw TimesheetEntry[] + FLResource[]
              ↓
    Aggregate by Employee
              ↓
┌─────────────┴─────────────┐
│                           │
Calculate Hours      Get Employee Info
│                           │
├─ Allocation Hours         Employee.findOne()
├─ Actual Hours             ↓
├─ Approved Hours      { name, email, dept }
├─ Pending Hours
└─ Rejected Hours
              ↓
    EmployeeHoursData[]
              ↓
┌─────────────┴─────────────┐
│                           │
Chart Data          Table Data
transformations    pagination
      ↓                    ↓
  useMemo()          paginatedData
      ↓                    ↓
Recharts render    Table render
```

---

## Chart Implementations

### 1. Allocation Summary (Semi-Circle Gauge)

**Component**: `AllocationSummaryChart`

```tsx
const AllocationSummaryChart: React.FC<{ data: any[] }> = ({ data }) => {
  const allocatedPercentage = data
    .filter((item) => item.name !== "Bench")
    .reduce((acc, curr) => acc + curr.value, 0);

  const roundedAllocation = Math.round(allocatedPercentage);

  // Color logic: Gray if 0%, Blue if allocated
  const allocationColor = roundedAllocation === 0 ? "#94a3b8" : "#6366f1";

  const simplifiedData = [
    { name: "Allocated", value: roundedAllocation, color: allocationColor },
    { name: "Unallocated", value: 100 - roundedAllocation, color: "#e2e8f0" },
  ].filter((item) => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={simplifiedData}
          cx="50%"
          cy="75%" // Position for semi-circle
          innerRadius={75}
          outerRadius={110}
          startAngle={180} // Semi-circle start
          endAngle={0} // Semi-circle end
          dataKey="value"
        >
          {simplifiedData.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke={entry.color} />
          ))}
        </Pie>
      </PieChart>
      {/* Centered percentage display */}
      <div className="absolute bottom-4">
        <span className="text-4xl font-bold">{roundedAllocation}%</span>
        <span className="text-xs">Allocated</span>
      </div>
    </ResponsiveContainer>
  );
};
```

**Key Properties**:

- `startAngle={180}` + `endAngle={0}` = Semi-circle (bottom half)
- `cy="75%"` positions chart to show bottom portion
- Dynamic color based on allocation percentage

### 2. Monthly Daily Allocation Chart (Progress Bar)

**Component**: `MonthlyDailyAllocationChart`

```tsx
const MonthlyDailyAllocationChart: React.FC<{ dailyData: any[] }> = ({
  dailyData,
}) => {
  return (
    <div className="w-full">
      <div className="flex gap-0.5">
        {dailyData.map((segment, idx) => (
          <div
            key={idx}
            style={{
              width: `${(segment.dayCount / totalDays) * 100}%`,
              backgroundColor: segment.color,
              minHeight: "40px",
            }}
            className="transition-all hover:opacity-80"
          >
            <Tooltip>
              <span>{segment.projectName}</span>
              <span>{segment.dayCount} days</span>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Data Transformation**:

```typescript
const monthlyDailyAllocationData = useMemo(() => {
  const allDays = eachDayOfInterval({ start, end });

  const dailySegments = allDays.map((day) => {
    // Find which project this day belongs to
    const activeAllocation = allocations.find(
      (proj) =>
        day >= new Date(proj.startDate) && day <= new Date(proj.endDate),
    );

    return {
      date: format(day, "yyyy-MM-dd"),
      projectName: activeAllocation?.projectName || "Bench",
      color: activeAllocation?.color || "#9ca3af",
    };
  });

  // Merge consecutive days with same project
  const mergedSegments = [];
  dailySegments.forEach((segment) => {
    const lastSegment = mergedSegments[mergedSegments.length - 1];

    if (lastSegment?.projectName === segment.projectName) {
      lastSegment.endDate = segment.date;
      lastSegment.dayCount++;
    } else {
      mergedSegments.push({
        startDate: segment.date,
        endDate: segment.date,
        projectName: segment.projectName,
        color: segment.color,
        dayCount: 1,
      });
    }
  });

  return mergedSegments;
}, [projectAllocations, startDate, endDate]);
```

### 3. Approval Status Doughnut

**Component**: `ApprovalStatusDoughnut`

```tsx
const ApprovalStatusDoughnut: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          dataKey="value"
          label={({ name, percent }) =>
            `${name}: ${(percent * 100).toFixed(0)}%`
          }
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
```

**Data Structure**:

```typescript
const approvalStatusData = [
  { name: "Approved", value: 120, color: "#10B981" }, // Green
  { name: "Pending", value: 45, color: "#F59E0B" }, // Orange
  { name: "Revision", value: 8, color: "#FBBF24" }, // Amber
  { name: "Rejected", value: 2, color: "#EF4444" }, // Red
  { name: "Not Submitted", value: 25, color: "#94A3B8" }, // Gray
];
```

---

## UI Layout & Alignment

### Chart Section Layout Architecture

The Overview tab uses a **three-column responsive layout** optimized for visual hierarchy and space utilization.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                  Overview Tab (100% width)                       │
├──────────────┬──────────────────────────┬───────────────────────┤
│              │                          │                       │
│  Allocation  │   Project Allocations    │   Approval Status    │
│   Summary    │     (Timeline Bar)       │     (Doughnut)       │
│  (Semi-Cir)  │                          │                       │
│              │                          │                       │
│    25%       │          65%             │        35%           │
│              │   (of 75% section)       │   (of 75% section)    │
└──────────────┴──────────────────────────┴───────────────────────┘
```

#### Key CSS Classes

**Main Container**:

```tsx
<div className="flex lg:flex-row gap-6 items-stretch">
```

- `flex lg:flex-row` - Horizontal layout on large screens
- `gap-6` - 1.5rem spacing between columns
- `items-stretch` - Equal height for all cards

**Left Column (Allocation Summary - 25%)**:

```tsx
<Card className="w-[25%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
  <CardContent className="pt-4 flex-1 flex items-center justify-center">
```

- `w-[25%]` - Fixed 25% width for compact gauge
- `flex flex-col` - Vertical flex container for header + content
- `flex items-center justify-center` - Centers the semi-circle chart both horizontally and vertically
- `flex-1` - Content takes remaining space after header

**Right Section Wrapper (75%)**:

```tsx
<div className="w-[75%] flex gap-6">
```

- `w-[75%]` - Container for the two right-side charts
- `flex gap-6` - Horizontal flex with spacing

**Project Allocations Card (65% of right section)**:

```tsx
<Card className="w-[65%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
  <CardContent className="pt-4 flex flex-col flex-1">
    <div className="w-full min-w-full flex flex-col h-full">
      <div className="mt-auto w-full pb-20">
        <MonthlyDailyAllocationChart />
      </div>
    </div>
  </CardContent>
</Card>
```

- `w-[65%]` - Takes 65% of the 75% section (priority for timeline)
- `flex flex-col flex-1` - Vertical flex with full height
- `mt-auto` - **Critical**: Pushes chart to bottom of card
- `pb-20` - Bottom padding for visual breathing room
- `min-w-full` - Prevents shrinking on small content

**Approval Status Card (35% of right section)**:

```tsx
<Card className="w-[35%] border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col">
  <CardContent className="pt-4 flex-1">
```

- `w-[35%]` - Takes 35% of the 75% section
- `flex-1` - Content fills available space

#### Vertical Alignment Techniques

**1. Bottom Alignment (Project Allocations)**

```tsx
<div className="flex flex-col h-full">
  <div className="mt-auto w-full pb-20">{/* Chart component */}</div>
</div>
```

- Parent: `flex flex-col h-full` (vertical flex, full height)
- Child: `mt-auto` (margin-top: auto pushes to bottom)
- `pb-20` provides spacing below chart

**2. Center Alignment (Allocation Summary)**

```tsx
<CardContent className="pt-4 flex-1 flex items-center justify-center">
  {/* Semi-circle chart */}
</CardContent>
```

- `flex items-center justify-center` - Perfect centering
- `flex-1` - Takes available space for centering context

**3. Standard Top Alignment (Approval Status)**

```tsx
<CardContent className="pt-4 flex-1">{/* Doughnut chart */}</CardContent>
```

- `pt-4` - Standard top padding
- `flex-1` - Natural height expansion

#### Consistent Card Styling

All chart cards share unified styling:

```tsx
className =
  "border-none shadow-sm bg-slate-50/50 overflow-hidden flex flex-col";
```

| Class             | Purpose                                 |
| ----------------- | --------------------------------------- |
| `border-none`     | Removes default border for cleaner look |
| `shadow-sm`       | Subtle shadow for depth                 |
| `bg-slate-50/50`  | Light gray background with 50% opacity  |
| `overflow-hidden` | Clips content to card boundaries        |
| `flex flex-col`   | Vertical layout (header → content)      |

#### Responsive Behavior

```tsx
<div className="flex lg:flex-row gap-6 items-stretch">
```

- **Large screens (lg: 1024px+)**: Three-column horizontal layout
- **Smaller screens**: Could stack vertically (customize with `flex-col` for mobile)

#### Width Distribution Math

- **Total Width**: 100%
- **Left Section**: 25%
- **Right Section**: 75%
  - **Project Allocations**: 65% of 75% = **48.75% of total**
  - **Approval Status**: 35% of 75% = **26.25% of total**

**Visual weight**: Project Allocations gets the most space (48.75%) for detailed timeline visualization.

#### Quick Reference: Key Tailwind Classes

| Class Combination                      | Use Case              | Effect                               |
| -------------------------------------- | --------------------- | ------------------------------------ |
| `w-[25%]`                              | Left column width     | Allocation Summary gauge             |
| `w-[75%]`                              | Right section wrapper | Container for 2 charts               |
| `w-[65%]`                              | Project Allocations   | Timeline bar chart                   |
| `w-[35%]`                              | Approval Status       | Doughnut chart                       |
| `flex lg:flex-row gap-6 items-stretch` | Main container        | Horizontal layout with equal heights |
| `flex flex-col flex-1`                 | Card structure        | Vertical layout, full height         |
| `mt-auto pb-20`                        | Bottom alignment      | Push chart to bottom with padding    |
| `flex items-center justify-center`     | Center alignment      | Perfect centering                    |
| `border-none shadow-sm bg-slate-50/50` | Card styling          | Clean, subtle appearance             |
| `overflow-hidden`                      | Card clipping         | Prevent content overflow             |
| `min-w-full`                           | Chart containers      | Prevent shrinking                    |

#### Migration Tips

**Adjusting for Different Screen Sizes**:

```tsx
// Make responsive for mobile
<div className="flex flex-col lg:flex-row gap-6 items-stretch">
  <Card className="w-full lg:w-[25%]">...</Card>
  <div className="w-full lg:w-[75%] flex flex-col lg:flex-row gap-6">
    <Card className="w-full lg:w-[65%]">...</Card>
    <Card className="w-full lg:w-[35%]">...</Card>
  </div>
</div>
```

**Customizing Width Ratios**:

- Want equal-width charts? Use `w-[33.33%]` for each
- Need more space for timeline? Change to `w-[70%]` and `w-[30%]`
- Want two charts only? Use `w-[50%]` for each

**Adjusting Chart Heights**:

```tsx
// Fixed height container
<CardContent className="h-[400px] flex items-center justify-center">

// Responsive height
<CardContent className="min-h-[300px] lg:min-h-[400px]">
```

---

## Migration Checklist

### Phase 1: Database Setup

- [ ] **Create MongoDB collections**:
  - [ ] `timesheetentries`
  - [ ] `flresources`
  - [ ] `projects`
  - [ ] `employees`
- [ ] **Define Mongoose schemas** (copy from `server/src/models/`)
- [ ] **Create indexes**:
  ```javascript
  db.timesheetentries.createIndex({ employeeId: 1, date: 1 });
  db.timesheetentries.createIndex({ projectId: 1, approvalStatus: 1 });
  db.flresources.createIndex({ employeeId: 1 });
  db.flresources.createIndex({ projectId: 1 });
  ```

### Phase 2: Backend Migration

- [ ] **Copy backend files**:
  ```
  server/src/routes/employeeHoursReport.ts
  server/src/models/TimesheetEntry.ts
  server/src/models/FLResource.ts
  server/src/models/Project.ts
  server/src/models/Employee.ts
  ```
- [ ] **Install backend dependencies**:
  ```bash
  cd server
  npm install express mongoose cors dotenv
  ```
- [ ] **Register route in server.ts**:
  ```typescript
  import employeeHoursReportRouter from "./routes/employeeHoursReport";
  app.use("/api/employee-hours-report", employeeHoursReportRouter);
  ```
- [ ] **Configure environment variables**:
  ```env
  MONGODB_URI=mongodb://localhost:27017/employee_system
  PORT=5000
  ```
- [ ] **Test API endpoints**:

  ```bash
  # Test main report endpoint
  curl "http://localhost:5000/api/employee-hours-report?role=EMPLOYEE&employeeId=EMP001"

  # Test projects endpoint
  curl "http://localhost:5000/api/employee-hours-report/projects"

  # Test departments endpoint
  curl "http://localhost:5000/api/employee-hours-report/departments"
  ```

### Phase 3: Frontend Migration

- [ ] **Install frontend dependencies**:

  ```bash
  npm install recharts@2.15.0 date-fns@4.1.0 axios@1.13.2 zustand@5.0.2 lucide-react sonner

  # Shadcn UI components (install via CLI)
  npx shadcn-ui@latest add button card dialog input label select table tabs badge popover
  ```

- [ ] **Copy frontend files**:
  ```
  src/pages/rmg/reports/EmployeeHoursReport.tsx
  src/services/employeeHoursReportService.ts
  ```
- [ ] **Update API base URL** in `src/services/api.ts`:
  ```typescript
  const apiClient = axios.create({
    baseURL: "http://your-backend-url:5000/api",
    headers: { "Content-Type": "application/json" },
  });
  ```
- [ ] **Add route** in your routing configuration:

  ```tsx
  import EmployeeHoursReport from "@/pages/rmg/reports/EmployeeHoursReport";

  // In your router
  <Route path="/reports/employee-hours" element={<EmployeeHoursReport />} />;
  ```

### Phase 4: Integration with Existing System

- [ ] **Map user roles**:
  - Ensure your auth system returns: `user.role` as "EMPLOYEE" | "MANAGER" | "RMG"
  - Ensure user object has: `user.employeeId`, `user.name`, `user.email`
- [ ] **Integrate WeeklyTimesheet** (if not already present):
  - Copy `src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx`
  - Or replace with your existing timesheet component
- [ ] **Update auth store path**:
  ```typescript
  import { useAuthStore } from "@/store/authStore";
  ```
- [ ] **Test role-based access**:
  - [ ] EMPLOYEE can only see own data
  - [ ] MANAGER sees team members only
  - [ ] RMG sees all employees

### Phase 5: Styling & Customization

- [ ] **Configure Tailwind** (if not already):
  ```javascript
  // tailwind.config.js
  module.exports = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
      extend: {
        colors: {
          primary: "#6366f1",
          // ... your brand colors
        },
      },
    },
  };
  ```
- [ ] **Customize chart colors** in `CHART_COLORS` object
- [ ] **Adjust card layouts** for your design system
- [ ] **Update page title and description**

### Phase 6: Testing

- [ ] **Unit tests for backend**:
  - [ ] Test role-based filtering
  - [ ] Test date range calculations
  - [ ] Test aggregation logic
- [ ] **Integration tests**:
  - [ ] Test API endpoints with sample data
  - [ ] Test CSV export functionality
- [ ] **Manual testing**:
  - [ ] Test all date range options
  - [ ] Test custom date picker
  - [ ] Test chart rendering with various data
  - [ ] Test pagination in details view
  - [ ] Test search functionality
  - [ ] Test responsive design

### Phase 7: Deployment

- [ ] **Build frontend**:
  ```bash
  npm run build
  ```
- [ ] **Deploy backend**:
  - Set production MongoDB URI
  - Configure CORS for production domain
  - Set appropriate rate limits
- [ ] **Configure CDN/Static hosting** for frontend build
- [ ] **Set up monitoring**:
  - API response times
  - Chart load performance
  - Error tracking

### Phase 8: Documentation

- [ ] **Create user guide** for report features
- [ ] **Document API endpoints** for future developers
- [ ] **Create troubleshooting guide** for common issues
- [ ] **Document data model relationships**

---

## Troubleshooting

### Common Issues

#### 1. "role and month required" Error

**Solution**: Update backend validation to make `month` optional:

```typescript
// In employeeHoursReport.ts
if (!role) {
  // Only role is required
  return res.status(400).json({ message: "role is required" });
}
```

#### 2. Charts Not Rendering

**Check**:

- Is `recharts` installed? (`npm list recharts`)
- Are chart data arrays populated? (check browser console)
- Is ResponsiveContainer parent div sized? (min-height required)

#### 3. Date Range Not Working

**Check**:

- `date-fns` version compatibility
- Date format consistency (`yyyy-MM-dd`)
- Time zone handling (use UTC or local consistently)

#### 4. Manager Sees No Data

**Check**:

- Manager's `employeeId` matches `Project.projectManager.employeeId`
- FLResource entries have correct `projectId` (ObjectId vs string)

#### 5. Allocation Chart Always Shows 100%

**Solution**: Implemented in current version - check color logic:

```typescript
const allocationColor = roundedAllocation === 0 ? "#94a3b8" : "#6366f1";
```

---

## Performance Optimization

### Backend

1. **Add database indexes** (see Phase 1)
2. **Implement pagination** for large datasets
3. **Cache frequently accessed data** (e.g., project list)
4. **Use aggregation pipeline** for complex queries

### Frontend

1. **Memoize chart data**:
   ```typescript
   const chartData = useMemo(() => transformData(rawData), [rawData]);
   ```
2. **Debounce search input**:
   ```typescript
   const debouncedSearch = useDebouncedValue(searchQuery, 300);
   ```
3. **Lazy load WeeklyTimesheet**:
   ```typescript
   const WeeklyTimesheet = lazy(() => import("./WeeklyTimesheet"));
   ```
4. **Virtual scrolling** for large tables (use `@tanstack/react-virtual`)

---

## Additional Resources

### Documentation Links

- **Recharts**: https://recharts.org/
- **date-fns**: https://date-fns.org/
- **Shadcn UI**: https://ui.shadcn.com/
- **Tailwind CSS**: https://tailwindcss.com/

### Related Components

- `WeeklyTimesheet.tsx` - Embedded timesheet view
- `flResourceService.ts` - Project allocation API
- `projectService.ts` - Project management API

---

## Support

For issues or questions during migration:

1. Check this documentation first
2. Review error logs (browser console + backend logs)
3. Verify database queries in MongoDB Compass
4. Test API endpoints with Postman/Insomnia
5. Check network tab for failed requests

---

**Migration Version**: 1.0  
**Last Updated**: February 25, 2026  
**Prepared By**: System Documentation Team
