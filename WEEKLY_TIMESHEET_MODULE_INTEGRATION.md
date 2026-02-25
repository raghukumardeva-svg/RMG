# Weekly Timesheet Module - Complete Integration Guide

> **Version:** 1.0  
> **Date:** February 20, 2026  
> **Purpose:** Complete documentation for integrating the Weekly Timesheet module into an existing codebase

---

## 📋 Table of Contents

1. [Module Overview](#module-overview)
2. [Architecture](#architecture)
3. [File Structure & Dependencies](#file-structure--dependencies)
4. [Database Collections](#database-collections)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Integration Steps](#integration-steps)
8. [Testing Guide](#testing-guide)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Module Overview

### What is the Weekly Timesheet Module?

The Weekly Timesheet module is a comprehensive time tracking system that allows employees to:

- Log hours worked on projects and activities
- Submit weekly timesheets for manager approval
- Track billable vs non-billable hours
- Save drafts and submit for approval
- View approval status and history

### Key Features

✅ **Week-Based Entry** - Monday to Sunday timesheet view  
✅ **Project Selection** - Link hours to specific projects  
✅ **UDA Integration** - User Defined Activity categorization  
✅ **Billable Tracking** - Separate billable and non-billable hours  
✅ **Draft/Submit Workflow** - Save progress or submit for approval  
✅ **Date-Based Storage** - Granular storage for reporting and analytics  
✅ **Approval System** - Manager review and approval workflow  
✅ **Status Indicators** - Visual feedback for draft/submitted/approved states

### Business Value

- **Accurate Billing:** Track billable hours per project per day
- **Resource Management:** Analyze employee utilization
- **Compliance:** Meet labor law reporting requirements
- **Analytics:** Generate insights from time-tracking data
- **Transparency:** Clear visibility into work allocation

---

## 🏗️ Architecture

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WEEKLY TIMESHEET ARCHITECTURE             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Employee UI     │ (React Component)
│  WeeklyTimesheet │
└────────┬─────────┘
         │
         ├─ Select Week (Monday-Sunday)
         ├─ Add Project + UDA rows
         ├─ Enter hours per day
         ├─ Add comments
         │
         v
┌──────────────────────────────────────┐
│  Frontend Service Layer               │
│  timesheetService.ts                  │
└────────┬─────────────────────────────┘
         │
         ├─ API Calls (Axios)
         │
         v
┌──────────────────────────────────────┐
│  Backend API Routes                   │
│  /api/timesheet-entries/*             │
└────────┬─────────────────────────────┘
         │
         ├─ Authentication Middleware
         ├─ Request Validation
         │
         v
┌──────────────────────────────────────┐
│  Data Transformation Layer            │
│  timesheetTransformers.ts             │
└────────┬─────────────────────────────┘
         │
         ├─ Week Format ↔ Date Format
         │
         v
┌──────────────────────────────────────┐
│  MongoDB Database                     │
│  - timesheetentries (date-based)      │
│  - timesheets (week-based - legacy)   │
└───────────────────────────────────────┘
```

### Storage Strategy

**Two-Collection Approach:**

1. **Primary: `timesheetentries`** (Date-based)
   - Each document = 1 task on 1 specific date
   - Better for billing, reporting, and approval granularity
   - Current implementation

2. **Legacy: `timesheets`** (Week-based)
   - Each document = 1 week's worth of data
   - Maintained for backward compatibility
   - Can be phased out

### Data Transformation

The system uses a **transformation layer** to convert between formats:

```javascript
// Frontend sends: Week-based
{
  projectId: "PRJ-001",
  hours: ["8:00", "8:00", "0:00", "8:00", "8:00", "0:00", "0:00"]
}

// ↓ Transform (weekRowsToDateEntries)

// Backend stores: Date-based
[
  { date: "2026-02-03", hours: "8:00", projectId: "PRJ-001" },
  { date: "2026-02-04", hours: "8:00", projectId: "PRJ-001" },
  { date: "2026-02-06", hours: "8:00", projectId: "PRJ-001" },
  { date: "2026-02-07", hours: "8:00", projectId: "PRJ-001" }
]
// Days with "0:00" are skipped

// ↑ Transform (dateEntriesToWeekRows)

// Frontend receives: Week-based
{
  projectId: "PRJ-001",
  hours: ["8:00", "8:00", "0:00", "8:00", "8:00", "0:00", "0:00"]
}
```

---

## 📁 File Structure & Dependencies

### Complete File List

#### Backend Files (8 files)

```
server/
├── src/
│   ├── models/
│   │   ├── TimesheetEntry.ts          ⭐ PRIMARY MODEL
│   │   ├── Timesheet.ts               (Legacy, optional)
│   │   ├── Project.ts                 ⚡ DEPENDENCY
│   │   ├── UDA.ts                     ⚡ DEPENDENCY
│   │   └── Employee.ts                ⚡ DEPENDENCY (if not exists)
│   │
│   ├── routes/
│   │   ├── timesheetEntries.ts        ⭐ PRIMARY API
│   │   ├── timesheets.ts              (Legacy, optional)
│   │   ├── projects.ts                ⚡ DEPENDENCY
│   │   └── udaConfigurations.ts       ⚡ DEPENDENCY
│   │
│   ├── utils/
│   │   └── timesheetTransformers.ts   ⭐ REQUIRED UTILITY
│   │
│   └── middleware/
│       └── auth.ts                    ⚡ DEPENDENCY
```

#### Frontend Files (6 files)

```
src/
├── pages/
│   └── rmg/
│       └── uda-configuration/
│           └── WeeklyTimesheet.tsx    ⭐ MAIN COMPONENT
│
├── services/
│   ├── timesheetService.ts            ⭐ API CLIENT
│   └── api.ts                         ⚡ DEPENDENCY (Base Axios client)
│
├── types/
│   ├── timesheet.ts                   ⭐ TYPE DEFINITIONS
│   ├── udaConfiguration.ts            ⚡ DEPENDENCY
│   └── project.ts                     ⚡ DEPENDENCY (if exists)
│
├── utils/
│   ├── timesheetValidation.ts         ⭐ VALIDATION UTILS
│   └── timesheetUtils.ts              ⭐ HELPER FUNCTIONS
│
└── store/
    ├── authStore.ts                   ⚡ DEPENDENCY
    └── udaConfigurationStore.ts       ⚡ DEPENDENCY (optional)
```

### Dependency Graph

```
WeeklyTimesheet.tsx
  ├─ Requires: timesheetService.ts
  ├─ Requires: timesheetValidation.ts
  ├─ Requires: timesheetUtils.ts
  ├─ Requires: authStore.ts (for user.employeeId)
  └─ Requires: UI components (Button, Dialog, etc.)

timesheetService.ts
  ├─ Requires: api.ts (Axios base client)
  └─ Requires: timesheet.ts (TypeScript types)

timesheetEntries.ts (Backend)
  ├─ Requires: TimesheetEntry.ts (Model)
  ├─ Requires: Project.ts (Model)
  ├─ Requires: timesheetTransformers.ts (Utils)
  └─ Requires: auth.ts (Middleware - optional)

timesheetTransformers.ts
  └─ No dependencies (pure functions)
```

---

## 🗄️ Database Collections

### 1. `timesheetentries` Collection (Primary)

**Purpose:** Store individual timesheet entries per date

#### Schema Definition

```javascript
{
  // Employee Information
  employeeId: String,          // e.g., "EMP001"
  employeeName: String,        // e.g., "John Doe"
  date: Date,                  // Specific date: "2026-02-03T00:00:00.000Z"

  // Task Information
  projectId: String,           // e.g., "PRJ-2026-001" or "N/A"
  projectCode: String,         // e.g., "ERP-2026"
  projectName: String,         // e.g., "Enterprise ERP Implementation"
  udaId: String,              // e.g., "UDA-001"
  udaName: String,            // e.g., "Development"
  type: String,               // "Billable" | "Non-Billable" | "General"
  financialLineItem: String,  // e.g., "CC-1000" (Cost center)
  billable: String,           // "Billable" | "Non-Billable"

  // Time and Notes
  hours: String,              // Format: "HH:MM" e.g., "8:00", "4:30"
  comment: String | null,     // Optional notes for the day

  // Status and Workflow
  status: String,             // "draft" | "submitted" | "approved" | "rejected"
  submittedAt: Date,          // When employee submitted

  // Approval Workflow (Future Feature)
  approvalStatus: String,     // "pending" | "approved" | "rejected" | "revision_requested"
  approvedBy: String,         // Manager's employeeId
  approvedAt: Date,           // When approved
  rejectedReason: String,     // Reason for rejection

  // Audit Trail
  createdAt: Date,            // Auto-generated by MongoDB
  updatedAt: Date             // Auto-generated by MongoDB
}
```

#### Indexes (IMPORTANT - Run These)

```javascript
// Single field indexes
db.timesheetentries.createIndex({ employeeId: 1 });
db.timesheetentries.createIndex({ date: 1 });
db.timesheetentries.createIndex({ status: 1 });
db.timesheetentries.createIndex({ approvalStatus: 1 });

// Compound indexes (for better query performance)
db.timesheetentries.createIndex({ employeeId: 1, date: 1 });
db.timesheetentries.createIndex({ projectId: 1, date: 1 });
db.timesheetentries.createIndex({ approvalStatus: 1, submittedAt: 1 });
db.timesheetentries.createIndex({ billable: 1, date: 1 });

// UNIQUE constraint - Prevents duplicate entries
db.timesheetentries.createIndex(
  { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
  { unique: true },
);
```

#### Sample Document

```json
{
  "_id": "65c9d4e8f7b2a3c4d5e6f7g8",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "date": "2026-02-03T00:00:00.000Z",
  "projectId": "PRJ-2026-001",
  "projectCode": "ERP-2026",
  "projectName": "Enterprise ERP Implementation",
  "udaId": "UDA-001",
  "udaName": "Development",
  "type": "Billable",
  "financialLineItem": "CC-1000",
  "billable": "Billable",
  "hours": "8:00",
  "comment": "Implemented user authentication module",
  "status": "submitted",
  "submittedAt": "2026-02-09T17:30:00.000Z",
  "approvalStatus": "pending",
  "approvedBy": null,
  "approvedAt": null,
  "rejectedReason": null,
  "createdAt": "2026-02-03T09:15:00.000Z",
  "updatedAt": "2026-02-09T17:30:00.000Z"
}
```

---

### 2. `timesheets` Collection (Legacy - Optional)

**Purpose:** Week-based timesheet storage (backward compatibility)

#### Schema Definition

```javascript
{
  employeeId: String,
  employeeName: String,
  weekStartDate: Date,        // Monday of the week
  weekEndDate: Date,          // Sunday of the week

  rows: [{                    // Array of timesheet rows
    projectId: String,
    projectCode: String,
    projectName: String,
    udaId: String,
    udaName: String,
    type: String,
    financialLineItem: String,
    billable: String,
    hours: [String],          // 7 elements [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    comments: [String | null] // 7 elements matching hours
  }],

  status: String,             // "draft" | "submitted" | "approved" | "rejected"
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: String,
  rejectedAt: Date,
  rejectedBy: String,
  rejectionReason: String,
  totalHours: Number,

  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes

```javascript
db.timesheets.createIndex({ employeeId: 1, weekStartDate: 1 });
```

---

### 3. Supporting Collections (Dependencies)

#### `projects` Collection

```javascript
{
  projectId: String,          // Unique identifier
  projectName: String,
  status: String,             // "Active" | "Draft" | "On Hold" | "Closed"
  customerId: ObjectId,
  projectStartDate: Date,
  projectEndDate: Date,
  // ... other project fields
}
```

**Index:**

```javascript
db.projects.createIndex({ projectId: 1 }, { unique: true });
db.projects.createIndex({ status: 1 });
```

#### `udas` Collection

```javascript
{
  udaNumber: String,          // Unique identifier
  name: String,
  type: String,               // "Billable" | "Non-Billable"
  billable: String,
  projectRequired: String,    // "Y" | "N"
  active: String,             // "Y" | "N"
  // ... other UDA fields
}
```

**Index:**

```javascript
db.udas.createIndex({ udaNumber: 1 }, { unique: true });
db.udas.createIndex({ active: 1 });
```

#### `employees` Collection

```javascript
{
  employeeId: String,         // Unique identifier
  name: String,
  email: String,
  department: String,
  designation: String,
  active: Boolean,
  // ... other employee fields
}
```

**Index:**

```javascript
db.employees.createIndex({ employeeId: 1 }, { unique: true });
```

---

## 🔌 API Endpoints

### Base URL

```
http://localhost:5000/api
```

### Authentication

All endpoints require JWT authentication:

```javascript
headers: {
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

---

### 1. Get Timesheet for Week

**Endpoint:** `GET /api/timesheet-entries/week/:employeeId/:weekStartDate`

**Description:** Retrieve timesheet entries for a specific week, transformed to week-based format

**Parameters:**

- `employeeId` - Employee identifier (e.g., "EMP001")
- `weekStartDate` - Monday of the week in YYYY-MM-DD format (e.g., "2026-02-03")

**Request Example:**

```http
GET /api/timesheet-entries/week/EMP001/2026-02-03
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "weekStartDate": "2026-02-03",
  "weekEndDate": "2026-02-09",
  "rows": [
    {
      "projectId": "PRJ-2026-001",
      "projectCode": "ERP-2026",
      "projectName": "Enterprise ERP Implementation",
      "udaId": "UDA-001",
      "udaName": "Development",
      "type": "Billable",
      "financialLineItem": "CC-1000",
      "billable": "Billable",
      "hours": ["8:00", "8:00", "7:30", "8:00", "6:00", "0:00", "0:00"],
      "comments": [null, null, "Half day", null, "Short day", null, null],
      "entryMeta": [
        {
          "approvalStatus": "pending",
          "rejectedReason": null,
          "date": "2026-02-03",
          "entryId": "65c9d4e8f7b2a3c4d5e6f7g8"
        }
        // ... meta for other days
      ]
    }
  ],
  "status": "submitted",
  "totalHours": 37.5,
  "submittedAt": "2026-02-09T17:30:00.000Z"
}
```

**No Data Response (200):**

```json
null
```

**Error Response (500):**

```json
{
  "message": "Failed to fetch timesheet"
}
```

---

### 2. Submit Timesheet

**Endpoint:** `POST /api/timesheet-entries/submit`

**Description:** Submit weekly timesheet, converting week-based to date-based entries

**Request Body:**

```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "weekStartDate": "2026-02-03",
  "weekEndDate": "2026-02-09",
  "rows": [
    {
      "projectId": "PRJ-2026-001",
      "projectCode": "ERP-2026",
      "projectName": "Enterprise ERP Implementation",
      "udaId": "UDA-001",
      "udaName": "Development",
      "type": "Billable",
      "financialLineItem": "CC-1000",
      "billable": "Billable",
      "hours": ["8:00", "8:00", "7:30", "8:00", "6:00", "0:00", "0:00"],
      "comments": [null, null, "Half day", null, "Short day", null, null]
    }
  ]
}
```

**Success Response (201):**

```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "weekStartDate": "2026-02-03",
  "weekEndDate": "2026-02-09",
  "rows": [...],
  "status": "submitted",
  "totalHours": 37.5,
  "submittedAt": "2026-02-09T17:30:00.000Z",
  "message": "Successfully submitted 5 timesheet entries",
  "_meta": {
    "entriesCreated": 5,
    "entriesUpdated": 0
  }
}
```

**Validation Error (400):**

```json
{
  "message": "Missing required fields"
}
```

**No Hours Error (400):**

```json
{
  "message": "No hours entered"
}
```

---

### 3. Save Draft

**Endpoint:** `POST /api/timesheets/draft`

**Description:** Save timesheet as draft (week-based format)

**Request Body:** (Same as Submit)

**Success Response (201):**

```json
{
  "_id": "65c9d4e8f7b2a3c4d5e6f7g9",
  "employeeId": "EMP001",
  "status": "draft",
  "weekStartDate": "2026-02-03",
  "weekEndDate": "2026-02-09",
  "rows": [...],
  "totalHours": 37.5,
  "message": "Draft saved successfully"
}
```

---

### 4. Recall/Delete Timesheet

**Endpoint:** `DELETE /api/timesheet-entries/recall/:employeeId/:weekStartDate`

**Description:** Delete all timesheet entries for a specific week

**Request Example:**

```http
DELETE /api/timesheet-entries/recall/EMP001/2026-02-03
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "message": "Timesheet recalled successfully",
  "deletedCount": 5
}
```

---

### 5. Delete Specific Row

**Endpoint:** `DELETE /api/timesheet-entries/row/:employeeId/:weekStartDate/:projectId/:udaId`

**Description:** Delete entries for a specific project/UDA combination in a week

**Request Example:**

```http
DELETE /api/timesheet-entries/row/EMP001/2026-02-03/PRJ-001/UDA-001
Authorization: Bearer <token>
```

**Success Response (200):**

```json
{
  "message": "Row deleted successfully",
  "deletedCount": 3
}
```

---

### 6. Approve Entry (Manager)

**Endpoint:** `PUT /api/timesheet-entries/approve/:entryId`

**Description:** Approve a specific timesheet entry

**Request Body:**

```json
{
  "approvedBy": "MGR001"
}
```

**Success Response (200):**

```json
{
  "_id": "65c9d4e8f7b2a3c4d5e6f7g8",
  "employeeId": "EMP001",
  "approvalStatus": "approved",
  "approvedBy": "MGR001",
  "approvedAt": "2026-02-10T09:00:00.000Z"
  // ... other fields
}
```

---

### 7. Reject Entry (Manager)

**Endpoint:** `PUT /api/timesheet-entries/reject/:entryId`

**Description:** Reject a timesheet entry with reason

**Request Body:**

```json
{
  "approvedBy": "MGR001",
  "rejectedReason": "Incorrect project selected. Please update."
}
```

**Success Response (200):**

```json
{
  "_id": "65c9d4e8f7b2a3c4d5e6f7g8",
  "employeeId": "EMP001",
  "approvalStatus": "rejected",
  "approvedBy": "MGR001",
  "rejectedReason": "Incorrect project selected. Please update."
  // ... other fields
}
```

---

## 🎨 Frontend Components

### WeeklyTimesheet.tsx

**Location:** `src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx`

**Purpose:** Main timesheet entry interface

#### Key Features

1. **Week Navigation**
   - Previous/Next week buttons
   - Date range display
   - Auto-load data on week change

2. **Dynamic Row Management**
   - Add new project/UDA rows
   - Delete rows
   - Multiple rows per week

3. **Hour Input**
   - 7 columns (Monday-Sunday)
   - Format validation ("008:00" → "8:00")
   - Empty/zero hour handling

4. **Comments**
   - Optional per-day comments
   - Expand/collapse functionality

5. **Status Indicators**
   - Color-coded backgrounds
   - Status badges
   - Visual feedback

6. **Actions**
   - Save Draft button
   - Submit Week button
   - Delete Row button

#### Component Structure

```tsx
const WeeklyTimesheet = () => {
  // State
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [timesheetStatus, setTimesheetStatus] = useState<string | null>(null);
  const [totalHours, setTotalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get user from auth store
  const { user } = useAuthStore();

  // Effects
  useEffect(() => {
    loadTimesheetForWeek();
  }, [currentDate, user?.employeeId]);

  // Functions
  const loadTimesheetForWeek = async () => { ... }
  const handleAddRow = () => { ... }
  const handleDeleteRow = (index: number) => { ... }
  const handleHourChange = (rowIndex: number, dayIndex: number, value: string) => { ... }
  const handleCommentChange = (rowIndex: number, dayIndex: number, value: string) => { ... }
  const handleSaveDraft = async () => { ... }
  const handleSubmitWeek = async () => { ... }
  const calculateTotalHours = () => { ... }

  return (
    <div>
      {/* Week Navigation */}
      {/* Status Badge */}
      {/* Timesheet Grid */}
      {/* Action Buttons */}
    </div>
  );
};
```

#### Props & State

```typescript
interface TimesheetRow {
  projectId: string;
  projectCode: string;
  projectName: string;
  udaId: string;
  udaName: string;
  type: string;
  financialLineItem: string;
  billable: string;
  hours: (string | null)[]; // 7 elements
  comments: (string | null)[]; // 7 elements
  entryMeta?: (ApprovalEntryMeta | null)[];
}

interface ApprovalEntryMeta {
  approvalStatus: "pending" | "approved" | "rejected" | "revision_requested";
  rejectedReason?: string | null;
  date: string;
  entryId: string;
}
```

#### Visual States

| Status    | Background Color   | Badge Color | Input State |
| --------- | ------------------ | ----------- | ----------- |
| Draft     | `bg-blue-50/30`    | Secondary   | Enabled     |
| Submitted | `bg-amber-50/30`   | Default     | Disabled    |
| Approved  | `bg-emerald-50/30` | Outline     | Disabled    |
| Rejected  | `bg-red-50/30`     | Destructive | Enabled     |

---

### timesheetService.ts

**Location:** `src/services/timesheetService.ts`

**Purpose:** API client for timesheet operations

#### Available Methods

```typescript
const timesheetService = {
  // Get timesheet for specific week
  getTimesheetForWeek: async (
    employeeId: string,
    weekStartDate: string
  ): Promise<Timesheet | null>

  // Get all timesheets for employee
  getEmployeeTimesheets: async (
    employeeId: string,
    status?: string
  ): Promise<Timesheet[]>

  // Save draft
  saveDraft: async (
    timesheet: Omit<Timesheet, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Timesheet>

  // Submit timesheet
  submitTimesheet: async (
    timesheet: Omit<Timesheet, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<Timesheet>

  // Approve timesheet
  approveTimesheet: async (
    id: string,
    approvedBy: string
  ): Promise<Timesheet>

  // Reject timesheet
  rejectTimesheet: async (
    id: string,
    rejectedBy: string,
    rejectionReason: string
  ): Promise<Timesheet>

  // Delete timesheet (recall)
  deleteTimesheet: async (id: string): Promise<void>
};
```

#### Usage Example

```typescript
import timesheetService from '@/services/timesheetService';

// Load timesheet
const timesheet = await timesheetService.getTimesheetForWeek(
  'EMP001',
  '2026-02-03'
);

// Submit timesheet
await timesheetService.submitTimesheet({
  employeeId: 'EMP001',
  employeeName: 'John Doe',
  weekStartDate: '2026-02-03',
  weekEndDate: '2026-02-09',
  rows: [...],
  status: 'submitted',
  totalHours: 40
});
```

---

## 🔧 Integration Steps

### Step 1: Backend Setup

#### 1.1 Copy Backend Files

```bash
# Navigate to target project
cd /path/to/target/project

# Create directories if they don't exist
mkdir -p server/src/models
mkdir -p server/src/routes
mkdir -p server/src/utils

# Copy model files
cp /source/server/src/models/TimesheetEntry.ts server/src/models/
cp /source/server/src/models/Timesheet.ts server/src/models/

# Copy route files
cp /source/server/src/routes/timesheetEntries.ts server/src/routes/
cp /source/server/src/routes/timesheets.ts server/src/routes/

# Copy utility files
cp /source/server/src/utils/timesheetTransformers.ts server/src/utils/
```

#### 1.2 Install Dependencies (if needed)

```bash
cd server
npm install express mongoose
npm install -D @types/express @types/node typescript
```

#### 1.3 Register Routes

Edit `server/src/server.ts` or `server/src/app.ts`:

```typescript
import express from "express";
import timesheetEntryRoutes from "./routes/timesheetEntries";
import timesheetRoutes from "./routes/timesheets";

const app = express();

// Middleware
app.use(express.json());

// Register routes
app.use("/api/timesheet-entries", timesheetEntryRoutes);
app.use("/api/timesheets", timesheetRoutes);

// ... other routes

export default app;
```

#### 1.4 Verify Model Imports

Make sure dependencies are available:

```typescript
// In timesheetEntries.ts, verify these imports work:
import TimesheetEntry from "../models/TimesheetEntry";
import Project from "../models/Project"; // Must exist
import { authenticateToken } from "../middleware/auth"; // If using auth
```

---

### Step 2: Database Setup

#### 2.1 Create Indexes

Run in MongoDB shell or via script:

```javascript
use your_database_name;

// TimesheetEntry indexes
db.timesheetentries.createIndex({ employeeId: 1, date: 1 });
db.timesheetentries.createIndex({ projectId: 1, date: 1 });
db.timesheetentries.createIndex({ approvalStatus: 1, submittedAt: 1 });
db.timesheetentries.createIndex({ billable: 1, date: 1 });
db.timesheetentries.createIndex(
  { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
  { unique: true }
);

// Timesheet indexes (if using legacy)
db.timesheets.createIndex({ employeeId: 1, weekStartDate: 1 });

print("Indexes created successfully!");
```

#### 2.2 Seed Sample Data (Optional)

Create `server/src/seed/timesheetSeed.ts`:

```typescript
import mongoose from "mongoose";
import TimesheetEntry from "../models/TimesheetEntry";

async function seedTimesheets() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const sampleEntries = [
    {
      employeeId: "EMP001",
      employeeName: "John Doe",
      date: new Date("2026-02-03"),
      projectId: "PRJ-001",
      projectCode: "TEST-01",
      projectName: "Test Project",
      udaId: "UDA-001",
      udaName: "Development",
      type: "Billable",
      financialLineItem: "CC-1000",
      billable: "Billable",
      hours: "8:00",
      comment: null,
      status: "submitted",
      submittedAt: new Date(),
      approvalStatus: "pending",
    },
  ];

  await TimesheetEntry.insertMany(sampleEntries);
  console.log("Sample timesheet entries created!");

  await mongoose.disconnect();
}

seedTimesheets();
```

Run: `npx ts-node server/src/seed/timesheetSeed.ts`

---

### Step 3: Frontend Setup

#### 3.1 Copy Frontend Files

```bash
# Navigate to target project
cd /path/to/target/project

# Create directories
mkdir -p src/pages/rmg/uda-configuration
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils

# Copy component files
cp /source/src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx src/pages/rmg/uda-configuration/

# Copy service files
cp /source/src/services/timesheetService.ts src/services/

# Copy type files
cp /source/src/types/timesheet.ts src/types/

# Copy utility files
cp /source/src/utils/timesheetValidation.ts src/utils/
cp /source/src/utils/timesheetUtils.ts src/utils/
```

#### 3.2 Install Frontend Dependencies

```bash
npm install axios
npm install date-fns
npm install zustand  # If using state management
npm install @radix-ui/react-dialog  # For dialogs
npm install lucide-react  # For icons
```

#### 3.3 Configure API Base URL

Edit `src/services/api.ts`:

```typescript
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

#### 3.4 Add Route to Router

Edit `src/router/index.tsx` or your routing file:

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import WeeklyTimesheet from "@/pages/rmg/uda-configuration/WeeklyTimesheet";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... other routes */}
        <Route path="/timesheet" element={<WeeklyTimesheet />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### Step 4: Environment Configuration

#### 4.1 Backend Environment Variables

Create/update `server/.env`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/employee_connect

# JWT (if using authentication)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Server
PORT=5000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### 4.2 Frontend Environment Variables

Create/update `.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

### Step 5: Verify Dependencies

#### 5.1 Check Backend Dependencies

Ensure these are in your project:

```typescript
// server/src/models/Project.ts - Must exist
export interface IProject {
  projectId: string;
  projectName: string;
  // ... other fields
}

// server/src/models/UDA.ts - Must exist
export interface IUDA {
  udaNumber: string;
  name: string;
  // ... other fields
}

// server/src/middleware/auth.ts - Optional but recommended
export const authenticateToken = (req, res, next) => {
  // JWT verification logic
};
```

#### 5.2 Check Frontend Dependencies

Ensure these are available:

```typescript
// src/store/authStore.ts - Must exist
interface AuthState {
  user: {
    employeeId: string;  // REQUIRED
    name: string;
    email: string;
  } | null;
}

// src/services/api.ts - Must exist
const apiClient = axios.create({ ... });
export default apiClient;
```

---

### Step 6: Testing

#### 6.1 Backend API Testing

Use Postman or curl:

```bash
# Test get timesheet
curl -X GET "http://localhost:5000/api/timesheet-entries/week/EMP001/2026-02-03" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test submit timesheet
curl -X POST "http://localhost:5000/api/timesheet-entries/submit" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "weekStartDate": "2026-02-03",
    "weekEndDate": "2026-02-09",
    "rows": [
      {
        "projectId": "PRJ-001",
        "projectCode": "TEST",
        "projectName": "Test Project",
        "udaId": "UDA-001",
        "udaName": "Development",
        "type": "Billable",
        "financialLineItem": "CC-1000",
        "billable": "Billable",
        "hours": ["8:00", "8:00", "0:00", "8:00", "8:00", "0:00", "0:00"],
        "comments": [null, null, null, null, null, null, null]
      }
    ]
  }'
```

#### 6.2 Frontend Testing

1. **Navigate to Timesheet Page**
   - URL: `http://localhost:3000/timesheet`
   - Verify page loads without errors

2. **Test Week Navigation**
   - Click Previous/Next week buttons
   - Verify date range updates

3. **Test Add Row**
   - Click "Add Task" button
   - Select project and UDA

4. **Test Hour Input**
   - Enter hours in various formats: "8", "08:00", "008:00"
   - Verify formatting: all become "8:00"

5. **Test Save Draft**
   - Enter some hours
   - Click "Save Draft"
   - Verify toast message shows employee ID
   - Navigate away and back - data should persist

6. **Test Submit Week**
   - Fill timesheet completely
   - Click "Submit Week"
   - Verify status changes to "Submitted"
   - Inputs should become disabled
   - Background color changes to amber

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Basic Functionality

- [ ] Page loads without console errors
- [ ] Week navigation works (Previous/Next)
- [ ] Add new row creates empty timesheet row
- [ ] Delete row removes from list
- [ ] Hour inputs accept text
- [ ] Comment fields expand/collapse

#### Hour Validation

- [ ] "8" converts to "8:00"
- [ ] "08:00" converts to "8:00"
- [ ] "008:00" converts to "8:00"
- [ ] "8:30" stays as "8:30"
- [ ] "0:45" stays as "0:45"
- [ ] Invalid input shows error

#### Save Draft

- [ ] Save Draft button enabled when rows exist
- [ ] Toast shows "Saved for Employee ID: XXX"
- [ ] Data persists after page refresh
- [ ] Can edit draft multiple times

#### Submit Week

- [ ] Submit Week disabled when no hours
- [ ] Submit Week enabled when hours entered
- [ ] Toast shows "Submitted for Employee ID: XXX"
- [ ] Status changes to "Submitted"
- [ ] All inputs become disabled
- [ ] Background color changes to amber

#### Data Persistence

- [ ] Load draft from previous week
- [ ] Navigate to different week and back
- [ ] Submitted timesheet shows correct status
- [ ] Total hours calculated correctly

---

### Automated Testing

#### Backend Unit Tests

Create `server/src/tests/timesheetEntries.test.ts`:

```typescript
import request from "supertest";
import app from "../server";
import mongoose from "mongoose";
import TimesheetEntry from "../models/TimesheetEntry";

describe("Timesheet Entry API", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI!);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await TimesheetEntry.deleteMany({});
  });

  describe("POST /api/timesheet-entries/submit", () => {
    it("should submit timesheet successfully", async () => {
      const response = await request(app)
        .post("/api/timesheet-entries/submit")
        .set("Authorization", "Bearer test-token")
        .send({
          employeeId: "EMP001",
          employeeName: "John Doe",
          weekStartDate: "2026-02-03",
          weekEndDate: "2026-02-09",
          rows: [
            {
              projectId: "PRJ-001",
              projectCode: "TEST",
              projectName: "Test Project",
              udaId: "UDA-001",
              udaName: "Development",
              type: "Billable",
              financialLineItem: "CC-1000",
              billable: "Billable",
              hours: ["8:00", "8:00", "0:00", "0:00", "0:00", "0:00", "0:00"],
              comments: [null, null, null, null, null, null, null],
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("submitted");
      expect(response.body.totalHours).toBeGreaterThan(0);
    });

    it("should return 400 when no hours entered", async () => {
      const response = await request(app)
        .post("/api/timesheet-entries/submit")
        .set("Authorization", "Bearer test-token")
        .send({
          employeeId: "EMP001",
          employeeName: "John Doe",
          weekStartDate: "2026-02-03",
          weekEndDate: "2026-02-09",
          rows: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("No hours");
    });
  });

  describe("GET /api/timesheet-entries/week/:employeeId/:weekStartDate", () => {
    it("should retrieve timesheet for week", async () => {
      // Seed test data
      await TimesheetEntry.create({
        employeeId: "EMP001",
        employeeName: "John Doe",
        date: new Date("2026-02-03"),
        projectId: "PRJ-001",
        projectCode: "TEST",
        projectName: "Test Project",
        udaId: "UDA-001",
        udaName: "Development",
        type: "Billable",
        financialLineItem: "CC-1000",
        billable: "Billable",
        hours: "8:00",
        status: "submitted",
        approvalStatus: "pending",
      });

      const response = await request(app)
        .get("/api/timesheet-entries/week/EMP001/2026-02-03")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body.employeeId).toBe("EMP001");
      expect(response.body.rows).toHaveLength(1);
    });

    it("should return null when no data exists", async () => {
      const response = await request(app)
        .get("/api/timesheet-entries/week/EMP999/2026-02-03")
        .set("Authorization", "Bearer test-token");

      expect(response.status).toBe(200);
      expect(response.body).toBeNull();
    });
  });
});
```

Run tests:

```bash
npm test
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Cannot read property 'employeeId' of null"

**Cause:** User not authenticated or authStore not properly configured

**Solution:**

```typescript
// In WeeklyTimesheet.tsx
const { user } = useAuthStore();

if (!user || !user.employeeId) {
  return <div>Please log in to access timesheets</div>;
}
```

#### 2. "E11000 duplicate key error"

**Cause:** Trying to insert duplicate entry (same employee, date, project, UDA)

**Solution:**

- The unique index is working correctly
- User is trying to log same task twice on same day
- Either update existing entry or choose different project/UDA

#### 3. Hours Not Saving

**Cause:** API endpoint not registered or CORS issue

**Solution:**

```typescript
// server.ts - Verify routes are registered
app.use("/api/timesheet-entries", timesheetEntryRoutes);

// Check CORS configuration
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);
```

#### 4. "Project is required" validation error

**Cause:** UDA has `projectRequired: "Y"` but project not selected

**Solution:**

```typescript
// In WeeklyTimesheet.tsx
// Check UDA projectRequired field before allowing submission
if (uda.projectRequired === "Y" && !row.projectId) {
  toast.error("Project selection is required for this activity");
  return;
}
```

#### 5. Week Navigation Shows Wrong Data

**Cause:** Timezone issues with date calculations

**Solution:**

```typescript
// Use consistent date handling
const weekStart = new Date(year, month - 1, day);
weekStart.setHours(0, 0, 0, 0); // Start of day
```

#### 6. Total Hours Incorrect

**Cause:** Including "00:00" or "0:00" in calculations

**Solution:**

```typescript
// Skip zero hours
const totalHours = rows.reduce((sum, row) => {
  return (
    sum +
    row.hours.reduce((rowSum, hour) => {
      if (!hour || hour === "00:00" || hour === "0:00") return rowSum;
      const [h, m] = hour.split(":").map(Number);
      return rowSum + h + m / 60;
    }, 0)
  );
}, 0);
```

---

## 📚 Additional Resources

### Related Documentation

- [Complete Migration Guide](./TIMESHEET_UDA_CTC_MIGRATION_GUIDE.md)
- [UDA Configuration Guide](./UDA_CONFIGURATION_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

### Support

For issues or questions:

- Check this documentation first
- Review console errors (browser & server)
- Check MongoDB logs
- Verify environment variables

---

## ✅ Integration Checklist

### Pre-Integration

- [ ] Review this entire document
- [ ] Verify MongoDB is running
- [ ] Verify Node.js version (18+)
- [ ] Have Git access to source repository
- [ ] Have admin access to target system

### Backend Integration

- [ ] Copy all backend files
- [ ] Install backend dependencies
- [ ] Register API routes in server.ts
- [ ] Configure environment variables
- [ ] Verify model dependencies exist
- [ ] Create database indexes
- [ ] Test API endpoints with Postman

### Frontend Integration

- [ ] Copy all frontend files
- [ ] Install frontend dependencies
- [ ] Configure API base URL
- [ ] Add route to router
- [ ] Verify authStore provides employeeId
- [ ] Test page loads without errors

### Testing

- [ ] Manual testing complete
- [ ] All checklist items pass
- [ ] No console errors
- [ ] Data persists correctly
- [ ] API calls successful

### Production Ready

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained on new module
- [ ] Backup strategy in place
- [ ] Monitoring configured

---

## 📞 Contact & Support

**Documentation Author:** System Integration Team  
**Last Updated:** February 20, 2026  
**Version:** 1.0

For technical support during integration:

- **Email:** dev-support@yourcompany.com
- **Slack:** #timesheet-integration
- **Documentation:** https://github.com/your-org/RMG

---

**End of Document**
