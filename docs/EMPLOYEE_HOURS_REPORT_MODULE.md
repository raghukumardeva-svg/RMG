# Employee Hours Report Module

## Overview

The Employee Hours Report module provides comprehensive monthly reporting of employee hours with role-based access control. It displays allocation hours, actual hours (billable/non-billable), and approved hours for employees.

---

## Features

### 📊 Report Columns

| Column                          | Description                             |
| ------------------------------- | --------------------------------------- |
| **Allocation Hours**            | Total allocated hours from FL Resources |
| **Actual Billable Hours**       | Hours worked on billable projects       |
| **Actual Non-Billable Hours**   | Hours worked on non-billable projects   |
| **Billable Approved Hours**     | Approved billable hours by managers     |
| **Non-Billable Approved Hours** | Approved non-billable hours by managers |
| **Actual Hours**                | Total of all actual hours worked        |
| **Approved Hours**              | Total of all approved hours             |

---

## Role-Based Access Control

### 1. **Employee Login** 👤

**Access Level:** View own data only

**Features:**

- View personal monthly hours report
- See all 7 report columns
- Select month to view historical data
- Export personal report to CSV

**Restrictions:**

- Cannot see other employees' data
- No project filtering
- No department filtering
- No date range filtering

---

### 2. **Project Manager Login** 👨‍💼

**Access Level:** View employees in managed projects

**Features:**

- View all employees allocated to their managed projects
- Month-wise data display
- Employee list in table format
- All 7 report columns
- Export to CSV

**Filters Available:**

- ✅ Month selector (required)
- ✅ Project dropdown (shows only managed projects)
- ✅ Start Date picker
- ✅ End Date picker
- ❌ Department filter (not available)

**Search:**

- Search by employee name, ID, or email
- Real-time filtering

---

### 3. **RMG Login** 👔

**Access Level:** View all employees

**Features:**

- View report for all employees in organization
- Month-wise data display
- Complete employee list
- All 7 report columns
- Summary totals row
- Export to CSV

**Filters Available:**

- ✅ Month selector (required)
- ✅ Project dropdown (all projects)
- ✅ Start Date picker
- ✅ End Date picker
- ✅ Department dropdown

**Search:**

- Search by employee name, ID, or email
- Real-time filtering

---

## API Endpoints

### 1. Get Employee Hours Report

```
GET /api/employee-hours-report
```

**Query Parameters:**

| Parameter    | Type   | Required    | Description                                |
| ------------ | ------ | ----------- | ------------------------------------------ |
| `role`       | string | Yes         | User role: 'EMPLOYEE', 'MANAGER', or 'RMG' |
| `month`      | string | Yes         | Month in YYYY-MM format                    |
| `employeeId` | string | Conditional | Required for EMPLOYEE role                 |
| `managerId`  | string | Conditional | Required for MANAGER role                  |
| `projectId`  | string | No          | Filter by project                          |
| `startDate`  | string | No          | Filter start date (YYYY-MM-DD)             |
| `endDate`    | string | No          | Filter end date (YYYY-MM-DD)               |
| `department` | string | No          | Filter by department (RMG only)            |

**Request Example:**

```typescript
// Employee
GET /api/employee-hours-report?role=EMPLOYEE&month=2026-02&employeeId=EMP001

// Manager
GET /api/employee-hours-report?role=MANAGER&month=2026-02&managerId=MGR001&projectId=P001

// RMG
GET /api/employee-hours-report?role=RMG&month=2026-02&department=IT&projectId=P001
```

**Response:**

```json
{
  "employees": [
    {
      "employeeId": "EMP001",
      "employeeName": "John Doe",
      "email": "john@example.com",
      "department": "IT",
      "allocationHours": 160,
      "actualBillableHours": 120.5,
      "actualNonBillableHours": 25.5,
      "billableApprovedHours": 115.0,
      "nonBillableApprovedHours": 20.0,
      "actualHours": 146.0,
      "approvedHours": 135.0
    }
  ],
  "summary": {
    "totalAllocationHours": 160,
    "totalActualBillableHours": 120.5,
    "totalActualNonBillableHours": 25.5,
    "totalBillableApprovedHours": 115.0,
    "totalNonBillableApprovedHours": 20.0,
    "totalActualHours": 146.0,
    "totalApprovedHours": 135.0
  },
  "filters": {
    "role": "EMPLOYEE",
    "month": "2026-02",
    "projectId": null,
    "startDate": null,
    "endDate": null,
    "department": null
  }
}
```

---

### 2. Get Projects List

```
GET /api/employee-hours-report/projects
```

**Query Parameters:**

| Parameter   | Type   | Required | Description                      |
| ----------- | ------ | -------- | -------------------------------- |
| `role`      | string | No       | User role for filtering          |
| `managerId` | string | No       | Manager ID to get their projects |

**Response:**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "projectId": "P001",
    "projectName": "ERP System",
    "projectCode": "ERP-2026"
  }
]
```

---

### 3. Get Departments List

```
GET /api/employee-hours-report/departments
```

**Response:**

```json
["IT", "Finance", "HR", "Operations"]
```

---

## Frontend Usage

### Import Component

```typescript
import EmployeeHoursReport from "@/pages/rmg/reports/EmployeeHoursReport";
```

### Add to Router

```typescript
import { Route } from 'react-router-dom';

<Route path="/reports/employee-hours" element={<EmployeeHoursReport />} />
```

### Service Usage

```typescript
import employeeHoursReportService from "@/services/employeeHoursReportService";

// Get report
const report = await employeeHoursReportService.getReport({
  role: "RMG",
  month: "2026-02",
  projectId: "P001",
  department: "IT",
});

// Get projects
const projects = await employeeHoursReportService.getProjects(
  "MANAGER",
  "MGR001",
);

// Get departments
const departments = await employeeHoursReportService.getDepartments();
```

---

## Data Sources

### Allocation Hours

- **Source:** `flresources` collection
- **Field:** `monthlyAllocations` array
- **Calculation:** Sum of hours for the selected month

### Actual Hours

- **Source:** `timesheetentries` collection
- **Fields:** `hours`, `billable` flag
- **Calculation:** Sum of hours where `billable = true/false`

### Approved Hours

- **Source:** `timesheetentries` collection
- **Fields:** `hours`, `approvalStatus`, `billable`
- **Calculation:** Sum of hours where `approvalStatus = 'approved'`

---

## UI Features

### 1. **Filters Panel**

- Month selector (always visible)
- Project dropdown (RMG/Manager only)
- Date range pickers (RMG/Manager only)
- Department dropdown (RMG only)
- Generate Report button
- Clear Filters button

### 2. **Summary Cards**

- Total allocation hours
- Total actual billable hours (blue)
- Total actual non-billable hours (orange)
- Total billable approved hours (green)
- Total non-billable approved hours (emerald)
- Total actual hours (indigo)
- Total approved hours (teal)

### 3. **Data Table**

- Responsive design
- Color-coded columns
- Sortable headers
- Pagination (20 items per page)
- Search functionality
- Empty state handling
- Loading state

### 4. **Export Feature**

- Export to CSV
- Includes all data (not just visible page)
- Filename: `employee_hours_report_YYYY-MM.csv`

---

## Conditional Rendering

```typescript
// Check if user can see filters
const canSeeFilters = userRole === 'RMG' || userRole === 'MANAGER';

// Show employee columns only for Manager/RMG
{canSeeFilters && (
  <>
    <TableCell>Employee ID</TableCell>
    <TableCell>Name</TableCell>
    <TableCell>Department</TableCell>
  </>
)}
```

---

## Data Flow

```
┌─────────────┐
│   User      │
│  Selects    │
│  Filters    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Frontend Component         │
│  - Validates role           │
│  - Builds query params      │
│  - Calls API                │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Backend API                │
│  - Role-based filtering     │
│  - Fetches from DB          │
│  - Calculates totals        │
│  - Returns JSON             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Display Results            │
│  - Summary cards            │
│  - Data table               │
│  - Pagination               │
│  - Export option            │
└─────────────────────────────┘
```

---

## Error Handling

### Backend Errors

1. **Missing Required Fields**

```json
{
  "message": "role and month are required"
}
```

2. **Invalid Role**

```json
{
  "message": "employeeId is required for EMPLOYEE role"
}
```

3. **Server Error**

```json
{
  "message": "Failed to generate report",
  "error": "Database connection failed"
}
```

### Frontend Handling

```typescript
try {
  const response = await employeeHoursReportService.getReport(filters);
  setReportData(response.employees);
} catch (error: any) {
  toast.error(error.response?.data?.message || "Failed to load report");
  setReportData([]);
}
```

---

## Performance Optimization

### Backend

- ✅ Indexed queries on `employeeId`, `date`, `projectId`
- ✅ Limited employee list queries
- ✅ Efficient aggregation pipelines
- ✅ Date range filters

### Frontend

- ✅ Pagination (20 items per page)
- ✅ Lazy loading of filter options
- ✅ Debounced search
- ✅ Memoized calculations

---

## Testing Guide

### Test Case 1: Employee View

**Steps:**

1. Login as employee (EMP001)
2. Navigate to Employee Hours Report
3. Select month: February 2026
4. Click "Generate Report"

**Expected:**

- ✅ Only own data visible
- ✅ No filters visible except month
- ✅ All 7 columns displayed
- ✅ Can export to CSV

---

### Test Case 2: Manager View

**Steps:**

1. Login as manager (MGR001)
2. Navigate to Employee Hours Report
3. Select month: February 2026
4. Select project: P001
5. Click "Generate Report"

**Expected:**

- ✅ Shows employees in P001
- ✅ Project filter visible
- ✅ Date filters visible
- ✅ No department filter
- ✅ Can search employees
- ✅ Can export to CSV

---

### Test Case 3: RMG View

**Steps:**

1. Login as RMG user
2. Navigate to Employee Hours Report
3. Select month: February 2026
4. Select department: IT
5. Select project: P001
6. Click "Generate Report"

**Expected:**

- ✅ Shows all IT employees on P001
- ✅ All filters visible
- ✅ Department filter available
- ✅ Summary totals displayed
- ✅ Can search employees
- ✅ Pagination works
- ✅ Can export to CSV

---

## Troubleshooting

### Issue: "No data available"

**Possible Causes:**

1. No timesheet entries for selected month
2. No allocation in FL Resources
3. Filters too restrictive

**Solution:**

- Check if employee has submitted timesheets
- Verify FL Resources allocation exists
- Try clearing filters

---

### Issue: Incorrect hours calculation

**Check:**

1. Time format in database (should be "HH:MM")
2. Billable flag is correctly set
3. Approval status is properly updated

**Debug:**

```javascript
// Check console logs
console.log("Entries:", entries);
console.log("Allocations:", allocations);
console.log("Calculated hours:", actualHours);
```

---

## Database Queries Used

### Get Timesheet Entries

```javascript
await TimesheetEntry.find({
  employeeId: "EMP001",
  date: { $gte: monthStart, $lte: monthEnd },
  projectId: "P001", // optional
});
```

### Get Allocations

```javascript
await FLResource.find({
  employeeId: "EMP001",
  projectId: projectObjectId, // optional
});
```

### Get Projects

```javascript
await Project.find({
  "projectManager.employeeId": "MGR001",
}).select("projectId projectName projectCode");
```

---

## Future Enhancements

- [ ] Add drill-down view (click employee → see daily breakdown)
- [ ] Add charts/graphs for visual representation
- [ ] Add year-over-year comparison
- [ ] Add employee utilization percentage
- [ ] Add project-wise breakdown
- [ ] Add email report scheduling
- [ ] Add PDF export option
- [ ] Add custom date range (not just month)
- [ ] Add variance analysis (planned vs actual)

---

**Last Updated:** February 12, 2026  
**Version:** 1.0  
**Status:** ✅ Production Ready
