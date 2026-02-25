# Project Allocations Chart - Technical Guide

## Overview

This document explains how the **Project Allocations Chart** is generated in the Employee Hours Report and how the allocation percentages are calculated.

---

## Chart Location

**File**: `src/pages/rmg/reports/EmployeeHoursReport.tsx`

**Component**: `MultiProjectAllocationChart` (Lines 231-310)

**Rendered In**: Overview Tab → "Project Allocations" Card (Lines 1334-1355)

---

## 1. Data Flow Architecture

```
┌─────────────────────────┐
│   FLResource Table      │ ← Source: Allocation data from database
│  (Resource Allocations) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ loadProjectAllocations()│ ← Function fetches data based on user role
│      (Lines 532-710)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Calculate Hours &     │ ← Aggregation: Sum hours per project
│   Percentages           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  projectAllocations     │ ← State: Stored in React state
│      State Variable     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│MultiProjectAllocationChart│ ← Visual: Horizontal bar chart
│      Component          │
└─────────────────────────┘
```

---

## 2. Data Source by User Role

### **RMG Role** (e.g., mohan.reddy@acuvate.com)

```typescript
allocations = await flResourceService.getAll();
```

- Fetches **ALL allocations** across **ALL projects** in the organization
- No filtering by project or employee
- Used for organization-wide visibility

### **MANAGER Role**

```typescript
const managedProjects = await projectService.getAll();
const userManagedProjects = managedProjects.filter(
  (project) => project.projectManager?.employeeId === user.employeeId,
);

allocations = await Promise.all(
  userManagedProjects.map(async (project) => {
    return await flResourceService.getByProjectId(project._id);
  }),
);
```

- Fetches only projects where the user is the **Project Manager**
- Shows allocations for managed projects only

### **EMPLOYEE Role**

```typescript
allocations = await flResourceService.getByEmployeeId(employeeId);
```

- Fetches only allocations for that specific employee
- Personal view of their own project assignments

---

## 3. Percentage Calculation Algorithm

### Step 1: Aggregate Hours per Project

```typescript
const projectMap: Record<string, any> = {};
let totalHours = 0;

allocations.forEach((alloc: any) => {
  const projectKey = alloc.projectCode || alloc.projectId;

  if (!projectMap[projectKey]) {
    projectMap[projectKey] = {
      projectName: alloc.projectName || alloc.projectCode,
      hours: 0,
      startDate: alloc.startDate || alloc.expectedStartDate,
      endDate: alloc.expectedEndDate || alloc.endDate,
      color: generateProjectColor(alloc.projectName),
    };
  }

  // Extract allocation hours
  const hours = Number.parseFloat(
    alloc.totalAllocation || alloc.allocation || 0,
  );

  projectMap[projectKey].hours += hours; // Sum per project
  totalHours += hours; // Sum total
});
```

**Key Points:**

- Groups allocations by `projectCode` or `projectId`
- Sums `totalAllocation` or `allocation` field from FLResource
- Tracks both per-project hours and total hours

### Step 2: Calculate Percentage

```typescript
const projectData = Object.values(projectMap)
  .map((proj: any) => ({
    ...proj,
    hours: Math.round(proj.hours),
    percentage: totalHours > 0 ? (proj.hours / totalHours) * 100 : 0,
  }))
  .filter((p: any) => p.hours > 0);
```

**Formula:**

```
Project Percentage = (Project Hours / Total Hours) × 100
```

**Example Calculation:**

- **Suntory Bot**: 40 hours
- **Acuvate Test Project-1**: 40 hours
- **Total Hours**: 80 hours

```
Suntory Bot Percentage = (40 / 80) × 100 = 50.0%
Acuvate Test Project-1 Percentage = (40 / 80) × 100 = 50.0%
```

### Step 3: Add "Bench" if Needed

```typescript
const totalPercentage = projectData.reduce(
  (sum: number, proj: any) => sum + proj.percentage,
  0,
);

if (totalPercentage < 100 && totalPercentage > 0) {
  const benchPercentage = 100 - totalPercentage;

  projectData.push({
    projectName: "Bench",
    hours: 0,
    percentage: benchPercentage,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    color: CHART_COLORS.slateLight, // Gray color
  });
}
```

**Bench Calculation:**

- Represents employees **not allocated** to any project
- Only added if total allocated percentage < 100%
- `Bench Percentage = 100% - Total Allocated Percentage`

---

## 4. Data Structure

Each project in the chart has this structure:

```typescript
{
  projectName: string; // "Suntory Bot"
  hours: number; // 40 (total allocation hours)
  percentage: number; // 50.0 (calculated percentage)
  startDate: string; // "2026-02-01"
  endDate: string; // "2026-06-30"
  color: string; // "#3B82F6" (hex color)
}
```

---

## 5. Chart Rendering

### Component: MultiProjectAllocationChart

```typescript
<ResponsiveContainer width="100%" height={Math.max(180, data.length * 45)}>
  <BarChart
    data={projectData}
    layout="vertical"
    margin={{ top: 10, right: 60, bottom: 10, left: 100 }}
  >
    <XAxis type="number" hide />
    <YAxis
      dataKey="projectName"
      type="category"
      width={90}
    />

    <Bar dataKey="percentage" barSize={20}>
      {data.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={
            isEndingSoon(entry.endDate)
              ? CHART_COLORS.orange    // Orange if ending soon
              : entry.color            // Normal project color
          }
          fillOpacity={isEndingSoon(entry.endDate) ? 1 : 0.8}
        />
      ))}

      <LabelList
        dataKey="percentage"
        position="right"
        formatter={(value: number) => `${value.toFixed(1)}%`}
      />
    </Bar>
  </BarChart>
</ResponsiveContainer>
```

### Visual Features

**1. Bar Color Logic:**

- **Orange**: Project ending within 7 days (warning)
- **Custom Color**: Normal state (generated per project name)

**2. Percentage Label:**

- Displayed on the right side of each bar
- Format: `50.0%` (1 decimal place)

**3. Dynamic Height:**

- Formula: `Math.max(180, data.length * 45)`
- Minimum 180px, scales with number of projects (45px per project)

---

## 6. "Ending Soon" Warning Feature

```typescript
const isEndingSoon = (endDate: string) => {
  const end = new Date(endDate);
  const today = new Date();
  const daysUntilEnd =
    (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  return daysUntilEnd <= 7 && daysUntilEnd >= 0;
  // Returns true if project ends within 7 days
};
```

**Visual Indicators:**

- **Bar Color**: Changes to orange (`#f97316`)
- **Tooltip**: Shows "⚠️ Ending next week" warning
- **Legend**: Small orange dot with "Ending Soon" label

---

## 7. Tooltip Information

When hovering over a bar, the tooltip displays:

```typescript
<Tooltip content={({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const warning = isEndingSoon(item.endDate);

    return (
      <div className={warning ? "bg-orange-50" : "bg-white"}>
        <p className="font-bold">{item.projectName}</p>
        <p>Allocation: {item.percentage.toFixed(1)}%</p>
        <p>
          {format(new Date(item.startDate), "MMM dd")} -
          {format(new Date(item.endDate), "MMM dd, yyyy")}
        </p>
        {warning && <p>⚠️ Ending next week</p>}
      </div>
    );
  }
  return null;
}} />
```

**Tooltip Shows:**

1. Project name
2. Allocation percentage
3. Date range (start - end)
4. Warning message (if ending soon)

---

## 8. Employee Allocation Counts

The function also calculates employee metrics:

```typescript
const uniqueEmployees = new Set(allocations.map((alloc) => alloc.employeeId));

const totalEmployees = reportData.length || uniqueEmployees.size;
const allocatedEmployees = uniqueEmployees.size;
const benchEmployees = Math.max(0, totalEmployees - allocatedEmployees);

setEmployeeAllocationCounts({
  total: totalEmployees, // All employees in view
  allocated: allocatedEmployees, // Employees with projects
  bench: benchEmployees, // Employees without projects
});
```

**Note:** These counts were previously displayed as cards above the chart but have been removed as per recent changes.

---

## 9. Color Generation

Project colors are generated deterministically based on project name:

```typescript
const generateProjectColor = (name: string) => {
  const hash = name
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);

  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};
```

**Algorithm:**

1. Create hash from project name characters
2. Convert hash to hue value (0-360)
3. Generate HSL color with 70% saturation, 60% lightness

**Result**: Consistent color for same project name across sessions

---

## 10. Real-World Example

### Scenario: February 2026 Report for RMG User

**Data from FLResource:**

- Employee 1 → Suntory Bot: 40h
- Employee 2 → Acuvate Test Project-1: 40h
- Employee 3 → No allocation (Bench)

**Calculation:**

```
Total Hours = 40 + 40 = 80h

Suntory Bot % = (40 / 80) × 100 = 50.0%
Acuvate Test Project-1 % = (40 / 80) × 100 = 50.0%
Total Allocated % = 100%

No Bench needed (100% allocated)
```

**Chart Display:**

```
Suntory Bot                 ████████████████ 50.0%
Acuvate Test Project-1      ████████████████ 50.0%
```

---

## 11. Key Takeaways

### Percentage Calculation

```
Formula: (Project Hours / Total Hours) × 100
```

### Data Source Hierarchy

1. **Primary**: `alloc.totalAllocation`
2. **Fallback**: `alloc.allocation`
3. **Default**: `0`

### Bench Logic

- Added only when: `totalPercentage < 100%` AND `totalPercentage > 0`
- Represents unallocated capacity

### Color Scheme

- **Normal Projects**: Generated from project name
- **Ending Soon**: Orange (#f97316)
- **Bench**: Slate Gray (#94A3B8)

### Role-Based Visibility

- **RMG**: All organization projects
- **MANAGER**: Only managed projects
- **EMPLOYEE**: Only personal allocations

---

## 12. Related Files

| File                                            | Purpose                  |
| ----------------------------------------------- | ------------------------ |
| `src/pages/rmg/reports/EmployeeHoursReport.tsx` | Main report component    |
| `src/services/flResourceService.ts`             | FLResource data fetching |
| `src/services/projectService.ts`                | Project data fetching    |
| `server/src/models/FLResource.ts`               | Database model           |

---

## 13. Troubleshooting

### Issue: Percentages don't add up to 100%

**Cause**: Rounding errors or missing "Bench" entry
**Solution**: Check if `totalPercentage < 100` condition is met

### Issue: No data showing

**Cause**: No allocations in FLResource table for selected month
**Solution**: Verify FLResource data exists for the user's scope

### Issue: Wrong projects shown

**Cause**: Role-based filtering may be incorrect
**Solution**: Check `userRole` and verify project manager assignments

### Issue: Colors look similar

**Cause**: Hash collision or similar project names
**Solution**: Color generation is deterministic; consider manual overrides if needed

---

## Last Updated

February 24, 2026

## Version

1.0.0
