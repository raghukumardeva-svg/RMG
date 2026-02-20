# 📅 Timesheet System - Date-Based Redesign

## 🎯 Business Requirements

### Current Problems

1. **No date tracking**: Hours stored as arrays `["8:00", "0:00"...]` - can't identify which date
2. **Billing issues**: Cannot generate date-wise billing reports
3. **Approval workflow blocked**: Managers need to approve/reject specific days, not entire weeks
4. **Poor queryability**: Can't answer "What did employee work on Feb 3rd?"

### Future Requirements

1. **Billing System**: Generate invoices based on daily billable hours per project
2. **Approval Workflow**: Project Manager/Delivery Manager review and approve:
   - Specific days (not entire weeks)
   - Individual tasks/projects
   - Can revert back to employee with comments
3. **Reporting**:
   - Daily utilization reports
   - Project-wise time tracking
   - Employee productivity analysis

---

## 🏗️ Proposed Architecture

### New Data Model: Date-Based Entries

#### Before (Week-based - Current)

```json
{
  "_id": "6985ce089d3de700bf6a8e55",
  "employeeId": "RMG001",
  "weekStartDate": "2026-02-02",
  "weekEndDate": "2026-02-08",
  "rows": [
    {
      "projectId": "PRJ-123",
      "udaName": "Customer call",
      "hours": ["00:00", "8:00", "00:00", "00:00", "00:00", "00:00", "00:00"],
      "comments": [null, "Meeting", null, null, null, null, null]
    }
  ],
  "status": "submitted",
  "totalHours": 32
}
```

**Problems**:

- ❌ Date not explicit (index 1 = Tuesday, but which Tuesday?)
- ❌ Can't approve/reject single day
- ❌ Can't query "Show me all work on Feb 3rd"

#### After (Date-based - Proposed)

```json
{
  "_id": "6985ce089d3de700bf6a8e55",
  "employeeId": "RMG001",
  "employeeName": "Mohan Reddy",
  "entries": [
    {
      "_id": "entry1",
      "date": "2026-02-03",
      "projectId": "PRJ-123",
      "projectCode": "PRJ-123",
      "projectName": "Acuvate Test projet -1",
      "udaId": "6981f40d9fe4a66eb1fc910c",
      "udaName": "Customer call",
      "type": "Billable",
      "financialLineItem": "FL-001 (Development)",
      "billable": "Billable",
      "hours": "8:00",
      "comment": "Client meeting and requirements",
      "status": "submitted",
      "submittedAt": "2026-02-06T12:14:01.263Z",
      "approvalStatus": "pending",
      "approvedBy": null,
      "approvedAt": null,
      "rejectedReason": null
    },
    {
      "_id": "entry2",
      "date": "2026-02-03",
      "projectId": "N/A",
      "projectCode": "N/A",
      "projectName": "No Project",
      "udaId": "6981fb339fe4a66eb1fc915c",
      "udaName": "Skill Development / Training",
      "type": "Non-Billable",
      "financialLineItem": "N/A",
      "billable": "Non-Billable",
      "hours": "2:00",
      "comment": "React training",
      "status": "submitted",
      "submittedAt": "2026-02-06T12:14:01.263Z",
      "approvalStatus": "pending"
    },
    {
      "_id": "entry3",
      "date": "2026-02-04",
      "projectId": "PRJ-123",
      "udaName": "Project Work",
      "hours": "8:00",
      "status": "submitted",
      "approvalStatus": "approved",
      "approvedBy": "manager@example.com",
      "approvedAt": "2026-02-05T10:00:00Z"
    }
  ],
  "createdAt": "2026-02-06T11:18:32.426Z",
  "updatedAt": "2026-02-06T12:14:01.267Z"
}
```

**Benefits**:

- ✅ Each entry has explicit date
- ✅ Can approve/reject individual days
- ✅ Easy to query by date/project/employee
- ✅ Supports partial week submissions
- ✅ Audit trail per entry

---

## 🗄️ New MongoDB Schema

### TimesheetEntry Model

```typescript
export interface ITimesheetEntry {
  _id: mongoose.Types.ObjectId;

  // Core identifying info
  employeeId: string;
  employeeName: string;
  date: Date; // YYYY-MM-DD - The specific working date

  // Task details
  projectId: string; // Can be "N/A" for non-project tasks
  projectCode: string;
  projectName: string;
  udaId: string;
  udaName: string; // e.g., "Customer call", "Project Work", "Bench"
  type: string; // "Billable", "Non-Billable", "General"
  financialLineItem: string;
  billable: string; // "Billable" or "Non-Billable"

  // Time tracking
  hours: string; // e.g., "8:00", "4:30"
  comment: string | null;

  // Status tracking
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: Date;

  // Approval workflow
  approvalStatus: "pending" | "approved" | "rejected" | "revision_requested";
  approvedBy?: string; // Manager's employeeId or email
  approvedAt?: Date;
  rejectedReason?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
}
```

### Indexes for Performance

```typescript
// Find all entries for an employee in a date range
TimesheetEntrySchema.index({ employeeId: 1, date: 1 });

// Find entries pending approval for a manager
TimesheetEntrySchema.index({ approvalStatus: 1, submittedAt: 1 });

// Find billable entries for billing
TimesheetEntrySchema.index({ billable: 1, date: 1, projectId: 1 });

// Find entries by project for project reporting
TimesheetEntrySchema.index({ projectId: 1, date: 1 });
```

---

## 🔄 Migration Strategy

### Phase 1: Backend Schema (Current Task)

1. Create new `TimesheetEntry` model
2. Keep old `Timesheet` model for backward compatibility
3. Add dual-write: Save to both old and new schemas
4. Create migration script to convert existing data

### Phase 2: API Updates

1. New endpoints:
   - `POST /api/timesheet-entries/submit` - Submit daily entries
   - `GET /api/timesheet-entries/date-range/:employeeId/:startDate/:endDate`
   - `GET /api/timesheet-entries/week/:employeeId/:weekStartDate` - Returns flattened entries
   - `PUT /api/timesheet-entries/:id/approve` - Manager approves entry
   - `PUT /api/timesheet-entries/:id/reject` - Manager rejects entry
   - `GET /api/timesheet-entries/pending-approval/:managerId` - For approval dashboard

2. Keep old endpoints working (backward compatibility)

### Phase 3: Frontend Updates

1. Keep weekly UI (minimal change for users)
2. Transform data on save: Convert week-based rows to date-based entries
3. Transform data on load: Convert date-based entries back to week view
4. Remove "Save as Draft" button (as per user request)
5. Add approval dashboard for managers

### Phase 4: Approval Workflow (Future)

1. Manager dashboard to review timesheets
2. Date-wise approval/rejection
3. Email notifications
4. Revision request workflow

---

## 📝 Implementation Code

### 1. New Backend Model

**File**: `server/src/models/TimesheetEntry.ts`

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface ITimesheetEntry extends Document {
  employeeId: string;
  employeeName: string;
  date: Date;

  projectId: string;
  projectCode: string;
  projectName: string;
  udaId: string;
  udaName: string;
  type: string;
  financialLineItem: string;
  billable: string;

  hours: string;
  comment: string | null;

  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: Date;

  approvalStatus: "pending" | "approved" | "rejected" | "revision_requested";
  approvedBy?: string;
  approvedAt?: Date;
  rejectedReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const TimesheetEntrySchema = new Schema<ITimesheetEntry>(
  {
    employeeId: { type: String, required: true, index: true },
    employeeName: { type: String, required: true },
    date: { type: Date, required: true, index: true },

    projectId: { type: String, required: true },
    projectCode: { type: String, required: true },
    projectName: { type: String, required: true },
    udaId: { type: String, required: true },
    udaName: { type: String, required: true },
    type: { type: String, required: true },
    financialLineItem: { type: String, required: true },
    billable: { type: String, required: true },

    hours: { type: String, required: true },
    comment: { type: String, default: null },

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "submitted",
      index: true,
    },
    submittedAt: { type: Date },

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "revision_requested"],
      default: "pending",
      index: true,
    },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
TimesheetEntrySchema.index({ employeeId: 1, date: 1 });
TimesheetEntrySchema.index({ projectId: 1, date: 1 });
TimesheetEntrySchema.index({ approvalStatus: 1, submittedAt: 1 });
TimesheetEntrySchema.index({ billable: 1, date: 1 });

// Unique constraint: Prevent duplicate entries for same employee-date-project-uda
TimesheetEntrySchema.index(
  { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
  { unique: true },
);

export default mongoose.model<ITimesheetEntry>(
  "TimesheetEntry",
  TimesheetEntrySchema,
);
```

### 2. Data Transformation Helper

**File**: `server/src/utils/timesheetTransformers.ts`

```typescript
import { addDays, format } from "date-fns";

/**
 * Convert week-based timesheet rows to date-based entries
 * Used when frontend submits weekly data
 */
export function weekRowsToDateEntries(
  employeeId: string,
  employeeName: string,
  weekStartDate: Date,
  rows: any[],
): any[] {
  const entries: any[] = [];

  rows.forEach((row) => {
    // Each row has 7 hours (Mon-Sun)
    row.hours.forEach((hours: string | null, dayIndex: number) => {
      // Skip if no hours for this day
      if (!hours || hours === "00:00" || hours === "0:00") {
        return;
      }

      const entryDate = addDays(weekStartDate, dayIndex);
      const comment = row.comments?.[dayIndex] || null;

      entries.push({
        employeeId,
        employeeName,
        date: entryDate,
        projectId: row.projectId,
        projectCode: row.projectCode,
        projectName: row.projectName,
        udaId: row.udaId,
        udaName: row.udaName,
        type: row.type || "General",
        financialLineItem: row.financialLineItem,
        billable: row.billable,
        hours,
        comment,
        status: "submitted",
        submittedAt: new Date(),
        approvalStatus: "pending",
      });
    });
  });

  return entries;
}

/**
 * Convert date-based entries back to week-based rows
 * Used when frontend loads weekly view
 */
export function dateEntriesToWeekRows(
  weekStartDate: Date,
  entries: any[],
): any[] {
  // Group entries by unique combination of project+uda
  const rowMap = new Map<string, any>();

  entries.forEach((entry) => {
    const key = `${entry.projectId}|${entry.udaId}`;

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        projectId: entry.projectId,
        projectCode: entry.projectCode,
        projectName: entry.projectName,
        udaId: entry.udaId,
        udaName: entry.udaName,
        type: entry.type,
        financialLineItem: entry.financialLineItem,
        billable: entry.billable,
        hours: new Array(7).fill("00:00"),
        comments: new Array(7).fill(null),
      });
    }

    const row = rowMap.get(key);

    // Calculate day index (0=Mon, 6=Sun)
    const entryDate = new Date(entry.date);
    const daysDiff = Math.floor(
      (entryDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff >= 0 && daysDiff < 7) {
      row.hours[daysDiff] = entry.hours;
      row.comments[daysDiff] = entry.comment;
    }
  });

  return Array.from(rowMap.values());
}
```

### 3. Updated Backend Routes

**File**: `server/src/routes/timesheetEntries.ts`

```typescript
import express from "express";
import TimesheetEntry from "../models/TimesheetEntry";
import {
  weekRowsToDateEntries,
  dateEntriesToWeekRows,
} from "../utils/timesheetTransformers";
import { addDays } from "date-fns";

const router = express.Router();

// Submit timesheet (converts week-based to date-based)
router.post("/submit", async (req, res) => {
  try {
    const { employeeId, employeeName, weekStartDate, weekEndDate, rows } =
      req.body;

    if (!employeeId || !employeeName || !weekStartDate || !rows) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const weekStart = new Date(weekStartDate);

    // Transform week-based rows to date-based entries
    const entries = weekRowsToDateEntries(
      employeeId,
      employeeName,
      weekStart,
      rows,
    );

    if (entries.length === 0) {
      return res.status(400).json({ message: "No hours entered" });
    }

    // Bulk upsert entries (update if exists, insert if new)
    const bulkOps = entries.map((entry) => ({
      updateOne: {
        filter: {
          employeeId: entry.employeeId,
          date: entry.date,
          projectId: entry.projectId,
          udaId: entry.udaId,
        },
        update: { $set: entry },
        upsert: true,
      },
    }));

    const result = await TimesheetEntry.bulkWrite(bulkOps);

    // Calculate total hours
    const totalHours = entries.reduce((sum, e) => {
      const val = parseFloat(e.hours.replace(":", ".")) || 0;
      return sum + val;
    }, 0);

    res.json({
      message: "Timesheet submitted successfully",
      entriesCreated: result.upsertedCount,
      entriesUpdated: result.modifiedCount,
      totalHours,
      entries: entries.length,
    });
  } catch (error) {
    console.error("Error submitting timesheet:", error);
    res.status(500).json({
      message: "Failed to submit timesheet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get entries for a week (returns in week-based format for UI)
router.get("/week/:employeeId/:weekStartDate", async (req, res) => {
  try {
    const { employeeId, weekStartDate } = req.params;

    const weekStart = new Date(weekStartDate);
    const weekEnd = addDays(weekStart, 6);

    // Find all entries for this week
    const entries = await TimesheetEntry.find({
      employeeId,
      date: { $gte: weekStart, $lte: weekEnd },
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.json(null);
    }

    // Transform to week-based format for UI
    const rows = dateEntriesToWeekRows(weekStart, entries);

    // Calculate total hours
    const totalHours = entries.reduce((sum, entry) => {
      const val = parseFloat(entry.hours.replace(":", ".")) || 0;
      return sum + val;
    }, 0);

    // Determine overall status
    const allApproved = entries.every((e) => e.approvalStatus === "approved");
    const anyRejected = entries.some((e) => e.approvalStatus === "rejected");

    const status = allApproved
      ? "approved"
      : anyRejected
        ? "rejected"
        : "submitted";

    res.json({
      employeeId,
      employeeName: entries[0]?.employeeName,
      weekStartDate,
      weekEndDate: addDays(weekStart, 6).toISOString().split("T")[0],
      rows,
      status,
      totalHours,
      submittedAt: entries[0]?.submittedAt,
    });
  } catch (error) {
    console.error("Error fetching timesheet:", error);
    res.status(500).json({ message: "Failed to fetch timesheet" });
  }
});

// Get all entries for date range (for reporting/billing)
router.get("/date-range/:employeeId/:startDate/:endDate", async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.params;

    const entries = await TimesheetEntry.find({
      employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1, createdAt: 1 });

    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ message: "Failed to fetch entries" });
  }
});

// Approve specific entry (for manager)
router.put("/approve/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const { approvedBy } = req.body; // Manager's employeeId

    const entry = await TimesheetEntry.findByIdAndUpdate(
      entryId,
      {
        approvalStatus: "approved",
        approvedBy,
        approvedAt: new Date(),
      },
      { new: true },
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Error approving entry:", error);
    res.status(500).json({ message: "Failed to approve entry" });
  }
});

// Reject specific entry (for manager)
router.put("/reject/:entryId", async (req, res) => {
  try {
    const { entryId } = req.params;
    const { approvedBy, rejectedReason } = req.body;

    const entry = await TimesheetEntry.findByIdAndUpdate(
      entryId,
      {
        approvalStatus: "rejected",
        approvedBy,
        rejectedReason,
      },
      { new: true },
    );

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    console.error("Error rejecting entry:", error);
    res.status(500).json({ message: "Failed to reject entry" });
  }
});

// Get pending approvals for manager
router.get("/pending-approval/:managerId", async (req, res) => {
  try {
    const { managerId } = req.params;

    // TODO: Join with projects to find entries where managerId is the project manager
    // For now, return all pending entries

    const entries = await TimesheetEntry.find({
      approvalStatus: "pending",
    }).sort({ submittedAt: -1 });

    res.json(entries);
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
});

export default router;
```

---

## 🧪 Testing Strategy

### API Testing with PowerShell

```powershell
# Test 1: Submit weekly timesheet (converts to date-based)
$payload = @{
    employeeId = "RMG001"
    employeeName = "Mohan Reddy"
    weekStartDate = "2026-02-02"
    weekEndDate = "2026-02-08"
    rows = @(
        @{
            projectId = "PRJ-123"
            projectCode = "PRJ-123"
            projectName = "Test Project"
            udaId = "UDA-001"
            udaName = "Customer call"
            type = "Billable"
            financialLineItem = "FL-001"
            billable = "Billable"
            hours = @("8:00", "8:00", "4:00", "0:00", "0:00", "0:00", "0:00")
            comments = @("Meeting", "Dev work", "Half day", $null, $null, $null, $null)
        }
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Method POST -Uri "http://localhost:5000/api/timesheet-entries/submit" -ContentType "application/json" -Body $payload

# Test 2: Get week view (converts back to week-based)
Invoke-RestMethod -Method GET -Uri "http://localhost:5000/api/timesheet-entries/week/RMG001/2026-02-02"

# Test 3: Get date range (raw date-based entries for billing)
Invoke-RestMethod -Method GET -Uri "http://localhost:5000/api/timesheet-entries/date-range/RMG001/2026-02-01/2026-02-28"
```

---

## 📊 Benefits Summary

### For Employees

- ✅ Still see weekly view (minimal UI change)
- ✅ Can track work date-wise
- ✅ Clear approval status per day

### For Managers

- ✅ Review and approve specific days
- ✅ Reject with reason and request revision
- ✅ Dashboard showing pending approvals

### For Billing Team

- ✅ Query exact hours per project per date
- ✅ Generate accurate invoices
- ✅ Track billable vs non-billable by date

### For System

- ✅ Better database performance (indexed queries)
- ✅ Accurate audit trail
- ✅ Flexible reporting capabilities
- ✅ Supports future enhancements (time-off integration, forecasting, etc.)

---

## 🚀 Next Steps

1. **Review this document** with stakeholders
2. **Approve architecture** and proceed with implementation
3. **Create TimesheetEntry model** (backend)
4. **Add transformation utilities** (backend)
5. **Create new API routes** (backend)
6. **Update frontend** to use new APIs
7. **Test thoroughly** with real data
8. **Migration script** for existing data
9. **Deploy Phase 1** (date-based storage)
10. **Build approval dashboard** (Phase 2)

---

## ⚠️ Migration Notes

### Existing Data

- Old `Timesheet` collection will remain intact
- New `TimesheetEntry` collection will be created
- Migration script will convert old week-based data to new date-based entries
- Both systems can coexist during transition

### Rollback Plan

- If issues arise, can revert to old `Timesheet` model
- Data is not deleted, only transformed

---

**Document Version**: 1.0  
**Created**: February 6, 2026  
**Last Updated**: February 6, 2026  
**Status**: Awaiting Approval
