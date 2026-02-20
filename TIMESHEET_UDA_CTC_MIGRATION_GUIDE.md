# Timesheet, UDA Configuration & CTC Master - Complete Migration Guide

> **Version:** 1.0  
> **Date:** February 20, 2026  
> **Purpose:** Complete documentation for migrating Weekly Timesheet, UDA Configurations, and CTC Master modules to another system

---

## 📋 Table of Contents

1. [Module Overview](#module-overview)
2. [Folder Structure](#folder-structure)
3. [Database Collections](#database-collections)
4. [API Endpoints](#api-endpoints)
5. [Data Flow & Architecture](#data-flow--architecture)
6. [Frontend Components](#frontend-components)
7. [Integration Points & Dependencies](#integration-points--dependencies)
8. [Migration Checklist](#migration-checklist)

---

## 🎯 Module Overview

### 1. Weekly Timesheet Module

**Purpose:** Employee time tracking system with project-based hour logging, approval workflows, and reporting capabilities.

**Key Features:**

- Week-based timesheet entry (Monday-Sunday)
- Project and UDA (User Defined Activity) selection
- Billable/Non-billable hour tracking
- Draft and submission workflow
- Manager approval system
- Date-based granular storage for reporting

**Business Value:**

- Accurate project billing
- Resource utilization tracking
- Compliance with labor regulations
- Analytics and reporting

---

### 2. UDA Configuration Module

**Purpose:** Manage User Defined Activities (work categories) that employees can log time against.

**Key Features:**

- Create and manage activity types
- Billable/Non-billable classification
- Project requirement settings
- Parent-child UDA relationships
- Active/Inactive status management

**Business Value:**

- Standardized activity tracking
- Flexible categorization
- Better project cost allocation

---

### 3. CTC Master Module

**Purpose:** Centralized Cost-to-Company (compensation) management for all employees.

**Key Features:**

- Employee compensation tracking
- Currency support (INR, USD)
- Annual/Monthly UOM (Unit of Measure)
- Historical CTC tracking
- Planned vs Actual CTC comparison

**Business Value:**

- Centralized compensation data
- Budget planning and forecasting
- Historical compensation analysis
- Multi-currency support

---

## 📁 Folder Structure

```
Employee_Connect/
│
├── server/                          # Backend (Node.js/Express)
│   └── src/
│       ├── models/                  # MongoDB Mongoose Models
│       │   ├── Timesheet.ts         # Week-based timesheet model (legacy)
│       │   ├── TimesheetEntry.ts    # Date-based entry model (current)
│       │   ├── UDA.ts               # UDA configuration model
│       │   ├── CTCMaster.ts         # CTC master model
│       │   ├── Project.ts           # Project master data
│       │   ├── Customer.ts          # Customer master data
│       │   └── Employee.ts          # Employee master data
│       │
│       ├── routes/                  # API Route Handlers
│       │   ├── timesheets.ts        # Week-based timesheet API (legacy)
│       │   ├── timesheetEntries.ts  # Date-based entry API (current)
│       │   ├── udaConfigurations.ts # UDA CRUD operations
│       │   ├── ctcMaster.ts         # CTC CRUD operations
│       │   ├── projects.ts          # Project API
│       │   └── employees.ts         # Employee API
│       │
│       ├── utils/                   # Utility Functions
│       │   └── timesheetTransformers.ts  # Week ↔ Date conversion
│       │
│       ├── middleware/              # Express Middleware
│       │   └── auth.ts              # JWT authentication
│       │
│       └── server.ts                # Express server entry point
│
├── src/                             # Frontend (React/TypeScript)
│   ├── pages/
│   │   └── rmg/
│   │       └── uda-configuration/
│   │           ├── WeeklyTimesheet.tsx      # Timesheet UI
│   │           ├── UDAConfigurationPage.tsx # UDA management UI
│   │           └── components/
│   │               ├── UDAConfigurationTable.tsx
│   │               └── UDAConfigurationForm.tsx
│   │
│   ├── services/                    # API Service Layer
│   │   ├── timesheetService.ts      # Timesheet API client
│   │   ├── ctcService.ts            # CTC API client
│   │   └── api.ts                   # Base API client (Axios)
│   │
│   ├── types/                       # TypeScript Type Definitions
│   │   ├── timesheet.ts
│   │   ├── udaConfiguration.ts
│   │   └── ctc.ts
│   │
│   ├── store/                       # State Management (Zustand)
│   │   ├── udaConfigurationStore.ts
│   │   └── authStore.ts
│   │
│   └── utils/                       # Frontend Utilities
│       ├── timesheetValidation.ts
│       └── timesheetUtils.ts
│
└── docs/                            # Documentation
    ├── TIMESHEET_IMPLEMENTATION_GUIDE.md
    ├── EMPLOYEE_HOURS_REPORT_MODULE.md
    └── TIMESHEET_UDA_CTC_MIGRATION_GUIDE.md (this file)
```

---

## � Complete File Paths for Migration

### Backend Files (Node.js/Express)

#### Models (MongoDB Schemas)

```
server/src/models/Timesheet.ts
server/src/models/TimesheetEntry.ts
server/src/models/UDA.ts
server/src/models/CTCMaster.ts
server/src/models/Project.ts
server/src/models/Customer.ts
server/src/models/Employee.ts
```

#### Routes (API Endpoints)

```
server/src/routes/timesheets.ts
server/src/routes/timesheetEntries.ts
server/src/routes/udaConfigurations.ts
server/src/routes/ctcMaster.ts
server/src/routes/projects.ts
server/src/routes/employees.ts
```

#### Utilities

```
server/src/utils/timesheetTransformers.ts
```

#### Middleware

```
server/src/middleware/auth.ts
```

#### Server Configuration

```
server/src/server.ts
server/package.json
server/.env
```

---

### Frontend Files (React/TypeScript)

#### Pages & Components

```
src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx
src/pages/rmg/uda-configuration/UDAConfigurationPage.tsx
src/pages/rmg/uda-configuration/components/UDAConfigurationTable.tsx
src/pages/rmg/uda-configuration/components/UDAConfigurationForm.tsx
```

#### Services (API Clients)

```
src/services/timesheetService.ts
src/services/ctcService.ts
src/services/api.ts
```

#### TypeScript Types

```
src/types/timesheet.ts
src/types/udaConfiguration.ts
src/types/ctc.ts
```

#### State Management (Zustand)

```
src/store/udaConfigurationStore.ts
src/store/authStore.ts
```

#### Utilities

```
src/utils/timesheetValidation.ts
src/utils/timesheetUtils.ts
```

#### Configuration Files

```
src/router/index.tsx
package.json
.env
```

---

### Documentation Files

```
docs/TIMESHEET_IMPLEMENTATION_GUIDE.md
docs/EMPLOYEE_HOURS_REPORT_MODULE.md
docs/TIMESHEET_UDA_CTC_MIGRATION_GUIDE.md
```

---

### Quick Copy Commands

**Copy all backend model files:**

```bash
# Unix/Linux/Mac
cp server/src/models/{Timesheet.ts,TimesheetEntry.ts,UDA.ts,CTCMaster.ts,Project.ts,Customer.ts,Employee.ts} <destination>/models/

# Windows PowerShell
Copy-Item -Path "server\src\models\Timesheet.ts","server\src\models\TimesheetEntry.ts","server\src\models\UDA.ts","server\src\models\CTCMaster.ts","server\src\models\Project.ts","server\src\models\Customer.ts","server\src\models\Employee.ts" -Destination "<destination>\models\"
```

**Copy all backend route files:**

```bash
# Unix/Linux/Mac
cp server/src/routes/{timesheets.ts,timesheetEntries.ts,udaConfigurations.ts,ctcMaster.ts,projects.ts,employees.ts} <destination>/routes/

# Windows PowerShell
Copy-Item -Path "server\src\routes\timesheets.ts","server\src\routes\timesheetEntries.ts","server\src\routes\udaConfigurations.ts","server\src\routes\ctcMaster.ts","server\src\routes\projects.ts","server\src\routes\employees.ts" -Destination "<destination>\routes\"
```

**Copy all frontend service files:**

```bash
# Unix/Linux/Mac
cp src/services/{timesheetService.ts,ctcService.ts,api.ts} <destination>/services/

# Windows PowerShell
Copy-Item -Path "src\services\timesheetService.ts","src\services\ctcService.ts","src\services\api.ts" -Destination "<destination>\services\"
```

**Copy all frontend type definitions:**

```bash
# Unix/Linux/Mac
cp src/types/{timesheet.ts,udaConfiguration.ts,ctc.ts} <destination>/types/

# Windows PowerShell
Copy-Item -Path "src\types\timesheet.ts","src\types\udaConfiguration.ts","src\types\ctc.ts" -Destination "<destination>\types\"
```

---

## �🗄️ Database Collections

### 1. `timesheetentries` Collection

**Purpose:** Date-based individual timesheet entries (current implementation)

**MongoDB Schema:**

```javascript
{
  // Identity
  employeeId: String,          // Foreign key to employees
  employeeName: String,        // Denormalized for performance
  date: Date,                  // Specific working date (YYYY-MM-DD)

  // Task Details
  projectId: String,           // Foreign key to projects (can be "N/A")
  projectCode: String,         // Denormalized project identifier
  projectName: String,         // Denormalized project name
  udaId: String,              // Foreign key to UDAs
  udaName: String,            // Denormalized UDA name
  type: String,               // "Billable" | "Non-Billable" | "General"
  financialLineItem: String,  // Cost center or GL code
  billable: String,           // "Billable" | "Non-Billable"

  // Time Tracking
  hours: String,              // Format: "HH:MM" (e.g., "8:00", "4:30")
  comment: String | null,     // Optional notes for this day

  // Workflow Status
  status: String,             // "draft" | "submitted" | "approved" | "rejected"
  submittedAt: Date,          // Timestamp of submission

  // Approval Workflow
  approvalStatus: String,     // "pending" | "approved" | "rejected" | "revision_requested"
  approvedBy: String,         // Manager's employeeId
  approvedAt: Date,           // Approval timestamp
  rejectedReason: String,     // Reason for rejection

  // Audit
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

**Indexes:**

```javascript
// Compound Indexes
db.timesheetentries.createIndex({ employeeId: 1, date: 1 });
db.timesheetentries.createIndex({ projectId: 1, date: 1 });
db.timesheetentries.createIndex({ approvalStatus: 1, submittedAt: 1 });
db.timesheetentries.createIndex({ billable: 1, date: 1 });

// Unique Constraint (prevents duplicates)
db.timesheetentries.createIndex(
  { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
  { unique: true },
);
```

**Sample Document:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
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
  "comment": "Completed user authentication module",
  "status": "submitted",
  "submittedAt": "2026-02-09T17:30:00.000Z",
  "approvalStatus": "pending",
  "createdAt": "2026-02-03T09:15:00.000Z",
  "updatedAt": "2026-02-09T17:30:00.000Z"
}
```

---

### 2. `timesheets` Collection (Legacy - Week-based)

**Purpose:** Week-based timesheet aggregation (maintained for backward compatibility)

**MongoDB Schema:**

```javascript
{
  employeeId: String,         // Foreign key to employees
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
    comments: [String | null] // 7 elements matching hours array
  }],

  status: String,             // "draft" | "submitted" | "approved" | "rejected"
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: String,
  rejectedAt: Date,
  rejectedBy: String,
  rejectionReason: String,
  totalHours: Number,         // Calculated total

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

```javascript
db.timesheets.createIndex({ employeeId: 1, weekStartDate: 1 });
```

---

### 3. `udas` Collection

**Purpose:** User Defined Activity master data

**MongoDB Schema:**

```javascript
{
  udaNumber: String,          // Unique identifier (e.g., "UDA-001")
  name: String,               // Display name (e.g., "Development")
  description: String,        // Detailed description
  parentUDA: String,          // Parent UDA number (for hierarchy)
  type: String,               // "Billable" | "Non-Billable"
  billable: String,           // "Billable" | "Non-Billable" (redundant with type)
  projectRequired: String,    // "Y" | "N" (whether project selection is mandatory)
  active: String,             // "Y" | "N" (active status)

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

```javascript
db.udas.createIndex({ udaNumber: 1 }, { unique: true });
db.udas.createIndex({ name: 1 });
db.udas.createIndex({ active: 1 });
db.udas.createIndex({ type: 1 });
```

**Sample Document:**

```json
{
  "_id": "507f191e810c19729de860ea",
  "udaNumber": "UDA-001",
  "name": "Development",
  "description": "Software development activities including coding and testing",
  "parentUDA": "",
  "type": "Billable",
  "billable": "Billable",
  "projectRequired": "Y",
  "active": "Y",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

---

### 4. `ctcmasters` Collection

**Purpose:** Employee Cost-to-Company (compensation) tracking

**MongoDB Schema:**

```javascript
{
  employeeId: String,         // Unique employee identifier
  employeeName: String,       // Employee full name
  employeeEmail: String,      // Employee email

  // Latest CTC Information
  latestAnnualCTC: Number,    // Current annual CTC amount
  latestActualCurrency: String,  // "INR" | "USD"
  latestActualUOM: String,    // "Annual" | "Monthly"
  latestPlannedCTC: Number,   // Planned/budgeted CTC
  currency: String,           // "INR" | "USD" (default currency)
  uom: String,                // "Annual" | "Monthly" (default UOM)

  // Historical CTC Records
  ctcHistory: [{
    actualCTC: Number,        // CTC amount
    fromDate: String,         // Effective from date (YYYY-MM-DD)
    toDate: String,           // Effective to date (YYYY-MM-DD)
    currency: String,         // "INR" | "USD"
    uom: String              // "Annual" | "Monthly"
  }],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**

```javascript
db.ctcmasters.createIndex({ employeeId: 1 }, { unique: true });
db.ctcmasters.createIndex({ employeeName: 1 });
db.ctcmasters.createIndex({ currency: 1 });
```

**Sample Document:**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g6",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "latestAnnualCTC": 1200000,
  "latestActualCurrency": "INR",
  "latestActualUOM": "Annual",
  "latestPlannedCTC": 1300000,
  "currency": "INR",
  "uom": "Annual",
  "ctcHistory": [
    {
      "actualCTC": 1000000,
      "fromDate": "2024-01-01",
      "toDate": "2025-03-31",
      "currency": "INR",
      "uom": "Annual"
    },
    {
      "actualCTC": 1200000,
      "fromDate": "2025-04-01",
      "toDate": "9999-12-31",
      "currency": "INR",
      "uom": "Annual"
    }
  ],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2025-04-01T10:30:00.000Z"
}
```

---

### 5. Supporting Collections (Dependencies)

#### `projects` Collection

```javascript
{
  projectId: String,          // Unique project identifier (e.g., "PRJ-2026-001")
  projectName: String,        // Project display name
  customerId: ObjectId,       // Foreign key to customers
  accountName: String,        // Customer account name
  legalEntity: String,        // Legal entity
  hubspotDealId: String,      // External CRM identifier
  billingType: String,        // "T&M" | "Fixed Bid" | "Fixed Monthly" | "License"
  practiceUnit: String,       // "AiB & Automation" | "GenAI" | "Data & Analytics" | etc.
  region: String,             // "UK" | "India" | "USA" | "ME" | "Other"
  projectManager: {
    employeeId: String,
    name: String
  },
  deliveryManager: {
    employeeId: String,
    name: String
  },
  projectStartDate: Date,
  projectEndDate: Date,
  projectCurrency: String,    // "USD" | "GBP" | "INR" | "EUR" | "AED"
  estimatedValue: Number,
  status: String,             // "Draft" | "Active" | "On Hold" | "Closed"
  createdAt: Date,
  updatedAt: Date
}
```

#### `customers` Collection

```javascript
{
  customerNo: String,         // Unique customer number
  customerName: String,       // Customer company name
  hubspotRecordId: String,    // External CRM identifier
  industry: String,           // Industry classification
  region: String,             // "UK" | "India" | "USA" | "ME" | "Other"
  regionHead: String,         // Regional head name
  status: String,             // "Active" | "Inactive"
  createdAt: Date,
  updatedAt: Date
}
```

#### `employees` Collection

```javascript
{
  employeeId: String,         // Unique employee identifier
  name: String,               // Full name
  email: String,              // Email address
  department: String,         // Department name
  designation: String,        // Job title
  role: String,               // Application role
  active: Boolean,            // Employment status
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Weekly Timesheet APIs

#### 1. Get Timesheet for Specific Week

**Endpoint:** `GET /api/timesheet-entries/week/:employeeId/:weekStartDate`

**Purpose:** Retrieve all timesheet entries for a specific week, transformed to week-based format

**URL Parameters:**

- `employeeId` (string): Employee identifier (e.g., "EMP001")
- `weekStartDate` (string): Monday of the week in YYYY-MM-DD format

**Request Example:**

```http
GET /api/timesheet-entries/week/EMP001/2026-02-03
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

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
          "entryId": "507f1f77bcf86cd799439011"
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

**Response (No Data - 200):**

```json
null
```

**Response (Error - 500):**

```json
{
  "message": "Failed to fetch timesheet"
}
```

**Business Logic:**

1. Parse `weekStartDate` to calculate week start (Monday) and week end (Sunday)
2. Query `timesheetentries` collection for all entries within date range
3. Group entries by `projectId` and `udaId` combination
4. Transform date-based entries into week-based rows (7-element arrays)
5. Calculate total hours across all entries
6. Determine overall status from individual entry statuses
7. Return formatted response with approval metadata

---

#### 2. Submit Timesheet

**Endpoint:** `POST /api/timesheet-entries/submit`

**Purpose:** Submit weekly timesheet, converting week-based format to date-based entries

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

**Response (Success - 201):**

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

**Response (Validation Error - 400):**

```json
{
  "message": "Missing required fields"
}
```

**Response (No Hours - 400):**

```json
{
  "message": "No hours entered"
}
```

**Business Logic:**

1. Validate required fields (employeeId, employeeName, weekStartDate, rows)
2. Parse weekStartDate to Date object
3. Transform week-based rows to individual date-based entries
4. Skip entries with "00:00" or "0:00" hours
5. For each valid entry:
   - Calculate specific date (Monday + day offset)
   - Create entry object with all fields
   - Set status to "submitted", approvalStatus to "pending"
6. Perform bulk upsert operation (update if exists, insert if new)
7. Calculate total hours
8. Return response with metadata

**Data Transformation Example:**

```javascript
// Input (Week-based)
{
  projectId: "PRJ-001",
  udaId: "UDA-001",
  hours: ["8:00", "0:00", "6:00", ...]
}

// Output (Date-based entries)
[
  {
    date: "2026-02-03" (Monday),
    hours: "8:00",
    projectId: "PRJ-001",
    udaId: "UDA-001"
  },
  {
    date: "2026-02-05" (Wednesday),
    hours: "6:00",
    projectId: "PRJ-001",
    udaId: "UDA-001"
  }
]
// Tuesday (0:00) is skipped
```

---

#### 3. Recall/Delete Timesheet

**Endpoint:** `DELETE /api/timesheet-entries/recall/:employeeId/:weekStartDate`

**Purpose:** Delete all timesheet entries for a specific week

**URL Parameters:**

- `employeeId` (string): Employee identifier
- `weekStartDate` (string): Monday of the week (YYYY-MM-DD)

**Request Example:**

```http
DELETE /api/timesheet-entries/recall/EMP001/2026-02-03
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "message": "Timesheet recalled successfully",
  "deletedCount": 5
}
```

**Business Logic:**

1. Calculate week end date (weekStart + 6 days)
2. Delete all entries matching:
   - employeeId
   - date between weekStart and weekEnd
3. Return deletion count

---

#### 4. Delete Specific Row

**Endpoint:** `DELETE /api/timesheet-entries/row/:employeeId/:weekStartDate/:projectId/:udaId`

**Purpose:** Delete all entries for a specific project/UDA combination in a week

**URL Parameters:**

- `employeeId` (string): Employee identifier
- `weekStartDate` (string): Monday of the week
- `projectId` (string): Project identifier
- `udaId` (string): UDA identifier

**Request Example:**

```http
DELETE /api/timesheet-entries/row/EMP001/2026-02-03/PRJ-001/UDA-001
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "message": "Row deleted successfully",
  "deletedCount": 3
}
```

---

#### 5. Get Entries by Date Range

**Endpoint:** `GET /api/timesheet-entries/date-range/:employeeId/:startDate/:endDate`

**Purpose:** Retrieve raw date-based entries for reporting/analytics

**URL Parameters:**

- `employeeId` (string): Employee identifier
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Request Example:**

```http
GET /api/timesheet-entries/date-range/EMP001/2026-02-01/2026-02-28
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "date": "2026-02-03T00:00:00.000Z",
    "projectId": "PRJ-2026-001",
    "projectCode": "ERP-2026",
    "projectName": "Enterprise ERP Implementation",
    "udaId": "UDA-001",
    "udaName": "Development",
    "hours": "8:00",
    "billable": "Billable",
    "approvalStatus": "approved",
    "approvedBy": "MGR001",
    "approvedAt": "2026-02-10T09:00:00.000Z"
  }
  // ... more entries
]
```

---

#### 6. Approve Entry

**Endpoint:** `PUT /api/timesheet-entries/approve/:entryId`

**Purpose:** Approve a specific timesheet entry (manager action)

**URL Parameters:**

- `entryId` (string): MongoDB ObjectId of the entry

**Request Body:**

```json
{
  "approvedBy": "MGR001"
}
```

**Response (Success - 200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "employeeId": "EMP001",
  "approvalStatus": "approved",
  "approvedBy": "MGR001",
  "approvedAt": "2026-02-10T09:00:00.000Z"
  // ... other fields
}
```

**Response (Not Found - 404):**

```json
{
  "message": "Entry not found"
}
```

---

#### 7. Reject Entry

**Endpoint:** `PUT /api/timesheet-entries/reject/:entryId`

**Purpose:** Reject a timesheet entry with reason (manager action)

**URL Parameters:**

- `entryId` (string): MongoDB ObjectId of the entry

**Request Body:**

```json
{
  "approvedBy": "MGR001",
  "rejectedReason": "Incorrect project selected. Please update."
}
```

**Response (Success - 200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "employeeId": "EMP001",
  "approvalStatus": "rejected",
  "approvedBy": "MGR001",
  "rejectedReason": "Incorrect project selected. Please update."
  // ... other fields
}
```

---

### UDA Configuration APIs

#### 1. Get All UDA Configurations

**Endpoint:** `GET /api/uda-configurations`

**Purpose:** Retrieve all UDA configurations with optional filtering

**Query Parameters:**

- `active` (optional): "Y" | "N" - Filter by active status
- `type` (optional): "Billable" | "Non-Billable" - Filter by type
- `search` (optional): string - Search in udaNumber or name

**Request Examples:**

```http
GET /api/uda-configurations
GET /api/uda-configurations?active=Y
GET /api/uda-configurations?type=Billable&active=Y
GET /api/uda-configurations?search=development
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
[
  {
    "_id": "507f191e810c19729de860ea",
    "udaNumber": "UDA-001",
    "name": "Development",
    "description": "Software development activities",
    "parentUDA": "",
    "type": "Billable",
    "billable": "Billable",
    "projectRequired": "Y",
    "active": "Y",
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-01-15T10:00:00.000Z"
  }
  // ... more UDAs
]
```

---

#### 2. Get Single UDA Configuration

**Endpoint:** `GET /api/uda-configurations/:id`

**Purpose:** Retrieve a specific UDA configuration by ID

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Example:**

```http
GET /api/uda-configurations/507f191e810c19729de860ea
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "_id": "507f191e810c19729de860ea",
  "udaNumber": "UDA-001",
  "name": "Development",
  "description": "Software development activities",
  "parentUDA": "",
  "type": "Billable",
  "billable": "Billable",
  "projectRequired": "Y",
  "active": "Y",
  "createdAt": "2026-01-15T10:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

**Response (Not Found - 404):**

```json
{
  "message": "UDA configuration not found"
}
```

---

#### 3. Create UDA Configuration

**Endpoint:** `POST /api/uda-configurations`

**Purpose:** Create a new UDA configuration

**Request Body:**

```json
{
  "udaNumber": "UDA-005",
  "name": "Testing",
  "description": "Quality assurance and testing activities",
  "parentUDA": "UDA-001",
  "type": "Billable",
  "billable": "Billable",
  "projectRequired": "Y",
  "active": "Y"
}
```

**Response (Success - 201):**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g7",
  "udaNumber": "UDA-005",
  "name": "Testing",
  "description": "Quality assurance and testing activities",
  "parentUDA": "UDA-001",
  "type": "Billable",
  "billable": "Billable",
  "projectRequired": "Y",
  "active": "Y",
  "createdAt": "2026-02-20T10:00:00.000Z",
  "updatedAt": "2026-02-20T10:00:00.000Z"
}
```

**Response (Duplicate - 400):**

```json
{
  "message": "UDA number already exists"
}
```

**Validation Rules:**

- `udaNumber` must be unique
- `name` is required
- `type` must be "Billable" or "Non-Billable"
- `projectRequired` must be "Y" or "N"
- `active` must be "Y" or "N"

---

#### 4. Update UDA Configuration

**Endpoint:** `PUT /api/uda-configurations/:id`

**Purpose:** Update an existing UDA configuration

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Body:**

```json
{
  "name": "Testing & QA",
  "description": "Updated description for testing activities",
  "active": "N"
}
```

**Response (Success - 200):**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g7",
  "udaNumber": "UDA-005",
  "name": "Testing & QA",
  "description": "Updated description for testing activities",
  "parentUDA": "UDA-001",
  "type": "Billable",
  "billable": "Billable",
  "projectRequired": "Y",
  "active": "N",
  "createdAt": "2026-02-20T10:00:00.000Z",
  "updatedAt": "2026-02-20T15:30:00.000Z"
}
```

**Response (Not Found - 404):**

```json
{
  "message": "UDA configuration not found"
}
```

---

#### 5. Delete UDA Configuration

**Endpoint:** `DELETE /api/uda-configurations/:id`

**Purpose:** Delete a UDA configuration

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Example:**

```http
DELETE /api/uda-configurations/65a7b8c9e4b0a1c2d3e4f5g7
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "message": "UDA configuration deleted successfully"
}
```

**Response (Not Found - 404):**

```json
{
  "message": "UDA configuration not found"
}
```

**Important Note:** Deleting a UDA that is referenced in timesheet entries may cause data integrity issues. Consider implementing soft delete (setting `active: "N"`) instead.

---

### CTC Master APIs

#### 1. Get All CTC Records

**Endpoint:** `GET /api/ctc-master`

**Purpose:** Retrieve all CTC records with optional filtering

**Query Parameters:**

- `search` (optional): string - Search by employeeId or employeeName
- `currency` (optional): "INR" | "USD" | "all" - Filter by currency

**Request Examples:**

```http
GET /api/ctc-master
GET /api/ctc-master?currency=INR
GET /api/ctc-master?search=john
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
[
  {
    "_id": "65a7b8c9e4b0a1c2d3e4f5g6",
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "employeeEmail": "john.doe@company.com",
    "latestAnnualCTC": 1200000,
    "latestActualCurrency": "INR",
    "latestActualUOM": "Annual",
    "latestPlannedCTC": 1300000,
    "currency": "INR",
    "uom": "Annual",
    "ctcHistory": [
      {
        "actualCTC": 1000000,
        "fromDate": "2024-01-01",
        "toDate": "2025-03-31",
        "currency": "INR",
        "uom": "Annual"
      },
      {
        "actualCTC": 1200000,
        "fromDate": "2025-04-01",
        "toDate": "9999-12-31",
        "currency": "INR",
        "uom": "Annual"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2025-04-01T10:30:00.000Z"
  }
  // ... more records
]
```

**Response (Error - 500):**

```json
{
  "success": false,
  "message": "Failed to fetch CTC records"
}
```

---

#### 2. Get Single CTC Record

**Endpoint:** `GET /api/ctc-master/:id`

**Purpose:** Retrieve a specific CTC record by ID

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Example:**

```http
GET /api/ctc-master/65a7b8c9e4b0a1c2d3e4f5g6
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g6",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "latestAnnualCTC": 1200000,
  "latestActualCurrency": "INR",
  "latestActualUOM": "Annual",
  "latestPlannedCTC": 1300000,
  "currency": "INR",
  "uom": "Annual",
  "ctcHistory": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2025-04-01T10:30:00.000Z"
}
```

**Response (Not Found - 404):**

```json
{
  "success": false,
  "message": "CTC record not found"
}
```

---

#### 3. Create CTC Record

**Endpoint:** `POST /api/ctc-master`

**Purpose:** Create a new CTC record for an employee

**Request Body:**

```json
{
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "latestAnnualCTC": 1200000,
  "latestActualCurrency": "INR",
  "latestActualUOM": "Annual",
  "latestPlannedCTC": 1300000,
  "currency": "INR",
  "uom": "Annual"
}
```

**Response (Success - 201):**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g6",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "latestAnnualCTC": 1200000,
  "latestActualCurrency": "INR",
  "latestActualUOM": "Annual",
  "latestPlannedCTC": 1300000,
  "currency": "INR",
  "uom": "Annual",
  "ctcHistory": [],
  "createdAt": "2026-02-20T10:00:00.000Z",
  "updatedAt": "2026-02-20T10:00:00.000Z"
}
```

**Response (Duplicate - 400):**

```json
{
  "success": false,
  "message": "CTC record already exists for this employee"
}
```

**Response (Validation Error - 400):**

```json
{
  "success": false,
  "message": "Employee ID, name, and email are required"
}
```

---

#### 4. Update CTC Record

**Endpoint:** `PUT /api/ctc-master/:id`

**Purpose:** Update an existing CTC record

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Body:**

```json
{
  "latestAnnualCTC": 1400000,
  "latestPlannedCTC": 1500000
}
```

**Response (Success - 200):**

```json
{
  "_id": "65a7b8c9e4b0a1c2d3e4f5g6",
  "employeeId": "EMP001",
  "employeeName": "John Doe",
  "employeeEmail": "john.doe@company.com",
  "latestAnnualCTC": 1400000,
  "latestActualCurrency": "INR",
  "latestActualUOM": "Annual",
  "latestPlannedCTC": 1500000,
  "currency": "INR",
  "uom": "Annual",
  "ctcHistory": [...],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-20T15:45:00.000Z"
}
```

**Response (Not Found - 404):**

```json
{
  "success": false,
  "message": "CTC record not found"
}
```

---

#### 5. Delete CTC Record

**Endpoint:** `DELETE /api/ctc-master/:id`

**Purpose:** Delete a CTC record

**URL Parameters:**

- `id` (string): MongoDB ObjectId

**Request Example:**

```http
DELETE /api/ctc-master/65a7b8c9e4b0a1c2d3e4f5g6
Authorization: Bearer <jwt_token>
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "CTC record deleted successfully"
}
```

**Response (Not Found - 404):**

```json
{
  "success": false,
  "message": "CTC record not found"
}
```

---

## 🔄 Data Flow & Architecture

### Weekly Timesheet Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      WEEKLY TIMESHEET FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. EMPLOYEE VIEW LOADS
   ↓
   Frontend (WeeklyTimesheet.tsx)
   │
   ├─→ useEffect on week change
   │   └─→ timesheetService.getTimesheetForWeek(employeeId, weekStartDate)
   │
   └─→ API: GET /api/timesheet-entries/week/EMP001/2026-02-03
       │
       Backend (timesheetEntries.ts)
       │
       ├─→ Calculate weekStart and weekEnd dates
       ├─→ Query TimesheetEntry.find({
       │     employeeId: "EMP001",
       │     date: { $gte: weekStart, $lte: weekEnd }
       │   })
       │
       ├─→ Transform date-based entries → week-based rows
       │   (dateEntriesToWeekRows utility)
       │
       │   Date Entries:
       │   [
       │     { date: "2026-02-03", hours: "8:00", projectId: "PRJ-001" },
       │     { date: "2026-02-04", hours: "7:00", projectId: "PRJ-001" }
       │   ]
       │
       │   ↓ TRANSFORM
       │
       │   Week-based Row:
       │   {
       │     projectId: "PRJ-001",
       │     hours: ["8:00", "7:00", "0:00", "0:00", "0:00", "0:00", "0:00"]
       │   }
       │
       ├─→ Calculate totalHours
       ├─→ Determine overall status
       └─→ Return formatted response
           │
           ↓
   Frontend receives data
   └─→ Sets state: rows[], timesheetStatus, totalHours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. EMPLOYEE ENTERS HOURS
   ↓
   Frontend
   │
   ├─→ User types in hour input field
   ├─→ handleHourChange() validates and formats
   │   │
   │   Examples:
   │   "008:00" → "8:00"
   │   "8" → "8:00"
   │   "0:45" → "0:45"
   │
   └─→ Updates local state (rows array)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. EMPLOYEE CLICKS "SAVE DRAFT"
   ↓
   Frontend
   │
   └─→ timesheetService.saveDraft({
         employeeId: "EMP001",
         employeeName: "John Doe",
         weekStartDate: "2026-02-03",
         weekEndDate: "2026-02-09",
         rows: [...]
       })
       │
       API: POST /api/timesheets/draft
       │
       Backend (timesheets.ts - legacy route)
       │
       ├─→ Validates required fields
       ├─→ Upserts Timesheet document (week-based)
       │   findOneAndUpdate({
       │     employeeId, weekStartDate
       │   }, {
       │     status: 'draft',
       │     rows: [...]
       │   }, { upsert: true })
       │
       └─→ Returns saved timesheet
           │
           ↓
   Frontend
   └─→ Shows toast: "Timesheet saved as draft for Employee ID: EMP001"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. EMPLOYEE CLICKS "SUBMIT WEEK"
   ↓
   Frontend
   │
   └─→ timesheetService.submitTimesheet({
         employeeId: "EMP001",
         employeeName: "John Doe",
         weekStartDate: "2026-02-03",
         weekEndDate: "2026-02-09",
         rows: [...]
       })
       │
       API: POST /api/timesheet-entries/submit
       │
       Backend (timesheetEntries.ts)
       │
       ├─→ Validates required fields
       ├─→ Transforms week-based rows → date-based entries
       │   (weekRowsToDateEntries utility)
       │
       │   Week-based Row:
       │   {
       │     projectId: "PRJ-001",
       │     udaId: "UDA-001",
       │     hours: ["8:00", "7:00", "0:00", "6:00", "8:00", "0:00", "0:00"]
       │   }
       │
       │   ↓ TRANSFORM
       │
       │   Date Entries:
       │   [
       │     {
       │       employeeId: "EMP001",
       │       date: "2026-02-03" (Mon),
       │       projectId: "PRJ-001",
       │       udaId: "UDA-001",
       │       hours: "8:00",
       │       status: "submitted",
       │       approvalStatus: "pending"
       │     },
       │     {
       │       date: "2026-02-04" (Tue),
       │       hours: "7:00",
       │       // ... other fields
       │     },
       │     {
       │       date: "2026-02-06" (Thu),
       │       hours: "6:00"
       │     },
       │     {
       │       date: "2026-02-07" (Fri),
       │       hours: "8:00"
       │     }
       │   ]
       │   // Wed, Sat, Sun skipped (0:00 hours)
       │
       ├─→ Performs bulk upsert via bulkWrite()
       │   updateOne operations with upsert: true
       │
       │   Filter: { employeeId, date, projectId, udaId }
       │   Update: { $set: { ...entry } }
       │
       ├─→ Calculates total hours
       └─→ Returns success response with metadata
           │
           ↓
   Frontend
   ├─→ Shows toast: "Timesheet submitted for Employee ID: EMP001"
   ├─→ Sets timesheetStatus = "submitted"
   ├─→ Disables all input fields
   └─→ Changes background color to amber

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. MANAGER APPROVES/REJECTS (Future Feature)
   ↓
   Manager Dashboard
   │
   ├─→ Views all submitted timesheets
   ├─→ Reviews employee hours
   │
   └─→ APPROVE: PUT /api/timesheet-entries/approve/:entryId
       │ Body: { approvedBy: "MGR001" }
       │
       OR
       │
       REJECT: PUT /api/timesheet-entries/reject/:entryId
       │ Body: { approvedBy: "MGR001", rejectedReason: "..." }
       │
       Backend updates entry:
       │
       ├─→ approvalStatus: "approved" | "rejected"
       ├─→ approvedBy: "MGR001"
       ├─→ approvedAt: Date
       ├─→ rejectedReason: "..." (if rejected)
       │
       ↓
   Employee sees updated status in their view
   │
   ├─→ If approved: Green background, locked
   └─→ If rejected: Red background, can edit and resubmit
```

---

### UDA Configuration Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   UDA CONFIGURATION FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. PAGE LOAD
   ↓
   Frontend (UDAConfigurationPage.tsx)
   │
   └─→ useEffect on mount
       └─→ udaConfigurationStore.fetchUDAs()
           │
           API: GET /api/uda-configurations
           │
           Backend (udaConfigurations.ts)
           │
           ├─→ Applies filters if provided (active, type, search)
           ├─→ UDA.find(query).sort({ createdAt: -1 })
           └─→ Returns array of UDA documents
               │
               ↓
   Frontend
   └─→ Updates Zustand store state
       └─→ UDAConfigurationTable renders list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. CREATE NEW UDA
   ↓
   Frontend
   │
   ├─→ User clicks "Add UDA"
   ├─→ UDAConfigurationForm dialog opens
   ├─→ User fills form fields
   └─→ Click "Save"
       │
       udaConfigurationStore.createUDA(formData)
       │
       API: POST /api/uda-configurations
       │ Body: {
       │   udaNumber: "UDA-005",
       │   name: "Testing",
       │   description: "...",
       │   type: "Billable",
       │   projectRequired: "Y",
       │   active: "Y"
       │ }
       │
       Backend
       │
       ├─→ Validates udaNumber uniqueness
       ├─→ Creates new UDA document
       ├─→ Saves to database
       └─→ Returns created document
           │
           ↓
   Frontend
   ├─→ Refreshes UDA list
   ├─→ Shows success toast
   └─→ Closes dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. EDIT UDA
   ↓
   Frontend
   │
   ├─→ User clicks edit icon
   ├─→ Form pre-filled with existing data
   ├─→ User modifies fields
   └─→ Click "Update"
       │
       udaConfigurationStore.updateUDA(id, formData)
       │
       API: PUT /api/uda-configurations/:id
       │ Body: { name: "Updated Name", active: "N" }
       │
       Backend
       │
       ├─→ Validates if udaNumber changed (check uniqueness)
       ├─→ Updates document
       └─→ Returns updated document
           │
           ↓
   Frontend
   ├─→ Refreshes list
   └─→ Shows success toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. DELETE UDA
   ↓
   Frontend
   │
   ├─→ User clicks delete icon
   ├─→ Confirmation dialog appears
   └─→ Confirms deletion
       │
       udaConfigurationStore.deleteUDA(id)
       │
       API: DELETE /api/uda-configurations/:id
       │
       Backend
       │
       ├─→ Deletes document from database
       └─→ Returns success message
           │
           ↓
   Frontend
   ├─→ Removes from list
   └─→ Shows success toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. UDA USAGE IN TIMESHEET
   ↓
   WeeklyTimesheet Component
   │
   ├─→ Loads active UDAs
   │   GET /api/uda-configurations?active=Y
   │
   ├─→ User selects UDA from dropdown
   │
   │   Validates projectRequired field:
   │   │
   │   ├─→ If projectRequired === "Y"
   │   │   → Project selection mandatory
   │   │   → Project dropdown enabled
   │   │
   │   └─→ If projectRequired === "N"
   │       → Project optional
   │       → Can use projectId: "N/A"
   │
   ├─→ Maps billable field to timesheet entry
   │   billable: uda.billable ("Billable" | "Non-Billable")
   │
   └─→ Submits timesheet with UDA information
```

---

### CTC Master Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      CTC MASTER FLOW                              │
└─────────────────────────────────────────────────────────────────┘

1. PAGE LOAD
   ↓
   Frontend (CTCMasterPage.tsx)
   │
   └─→ useEffect on mount
       └─→ ctcService.getCTCRecords()
           │
           API: GET /api/ctc-master
           │
           Backend (ctcMaster.ts)
           │
           ├─→ Applies filters (search, currency)
           ├─→ CTCMaster.find(filter).sort({ createdAt: -1 })
           └─→ Returns array of CTC documents
               │
               ↓
   Frontend
   └─→ Renders CTC table with records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. CREATE NEW CTC RECORD
   ↓
   Frontend
   │
   ├─→ User clicks "Add Employee CTC"
   ├─→ Form dialog opens
   ├─→ User enters:
   │   ├─→ Employee ID, Name, Email
   │   ├─→ Latest Annual CTC
   │   ├─→ Currency (INR/USD)
   │   ├─→ UOM (Annual/Monthly)
   │   └─→ Planned CTC
   │
   └─→ Click "Save"
       │
       ctcService.createCTCRecord(formData)
       │
       API: POST /api/ctc-master
       │ Body: {
       │   employeeId: "EMP001",
       │   employeeName: "John Doe",
       │   employeeEmail: "john@company.com",
       │   latestAnnualCTC: 1200000,
       │   latestActualCurrency: "INR",
       │   latestActualUOM: "Annual",
       │   latestPlannedCTC: 1300000,
       │   currency: "INR",
       │   uom: "Annual"
       │ }
       │
       Backend
       │
       ├─→ Validates required fields
       ├─→ Checks employeeId uniqueness
       ├─→ Creates new CTCMaster document
       │   ctcHistory: [] (empty initially)
       ├─→ Saves to database
       └─→ Returns created document
           │
           ↓
   Frontend
   ├─→ Refreshes list
   ├─→ Shows success toast
   └─→ Closes dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. UPDATE CTC RECORD
   ↓
   Frontend
   │
   ├─→ User clicks edit icon
   ├─→ Form pre-filled with current values
   ├─→ User updates CTC amounts
   │
   └─→ Click "Update"
       │
       ctcService.updateCTCRecord(id, formData)
       │
       API: PUT /api/ctc-master/:id
       │ Body: {
       │   latestAnnualCTC: 1400000,
       │   latestPlannedCTC: 1500000
       │ }
       │
       Backend
       │
       ├─→ Updates document with new values
       ├─→ Optionally adds to ctcHistory array
       │   (business logic for historical tracking)
       │
       └─→ Returns updated document
           │
           ↓
   Frontend
   ├─→ Refreshes list
   └─→ Shows success toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. VIEW CTC HISTORY
   ↓
   Frontend
   │
   ├─→ User clicks "View History" button
   │
   └─→ API: GET /api/ctc-master/:id
       │
       Backend returns complete document with ctcHistory array
       │
       ↓
   Frontend
   └─→ Displays timeline/table of historical CTC records
       │
       Example:
       ├─→ 2024-01-01 to 2025-03-31: ₹10,00,000
       └─→ 2025-04-01 to current: ₹12,00,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. INTEGRATION WITH REPORTING
   ↓
   Employee Hours Report / Analytics Dashboard
   │
   ├─→ Fetches timesheet entries
   │   GET /api/timesheet-entries/date-range/EMP001/...
   │
   ├─→ Fetches CTC data
   │   GET /api/ctc-master?search=EMP001
   │
   ├─→ Calculates:
   │   ├─→ Total billable hours
   │   ├─→ Total non-billable hours
   │   ├─→ Hourly rate = Annual CTC / (52 weeks × 40 hours)
   │   ├─→ Revenue potential = Billable hours × Hourly rate
   │   └─→ Utilization % = Billable hours / Total hours
   │
   └─→ Generates reports and analytics
```

---

## 🎨 Frontend Components

### 1. WeeklyTimesheet Component

**Location:** `src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx`

**Purpose:** Main timesheet entry interface for employees

**Key Features:**

- Week-based calendar view (Mon-Sun)
- Dynamic row addition with project/UDA selection
- Hour input with validation and formatting
- Status-based visual indicators
- Draft save and submission workflow

**State Management:**

```typescript
const [rows, setRows] = useState<TimesheetRow[]>([]);
const [currentDate, setCurrentDate] = useState<Date>(new Date());
const [timesheetStatus, setTimesheetStatus] = useState<string | null>(null);
const [totalHours, setTotalHours] = useState(0);
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

**Key Functions:**

- `loadTimesheetForWeek()` - Fetches timesheet data for current week
- `handleAddRow()` - Adds new project/UDA row
- `handleDeleteRow()` - Removes a row
- `handleHourChange()` - Validates and formats hour input
- `handleSaveDraft()` - Saves timesheet as draft
- `handleSubmitWeek()` - Submits timesheet for approval
- `calculateTotalHours()` - Sums all hours

**Visual States:**

- **Draft:** Blue background (`bg-blue-50/30`)
- **Submitted:** Amber background (`bg-amber-50/30`)
- **Approved:** Green background (`bg-emerald-50/30`)
- **Rejected:** Red background (`bg-red-50/30`)

---

### 2. UDAConfigurationPage Component

**Location:** `src/pages/rmg/uda-configuration/UDAConfigurationPage.tsx`

**Purpose:** Management interface for UDA configurations

**Key Features:**

- List all UDA configurations
- Filter by active status and type
- Search by UDA number or name
- Create new UDA
- Edit existing UDA
- Delete UDA

**Sub-components:**

- `UDAConfigurationTable` - Displays UDA list with actions
- `UDAConfigurationForm` - Dialog form for create/edit

**Store Integration:**

```typescript
const udaStore = useUDAConfigurationStore();

// Actions
udaStore.fetchUDAs(filters);
udaStore.createUDA(formData);
udaStore.updateUDA(id, formData);
udaStore.deleteUDA(id);
```

---

### 3. CTCMaster Component (Not shown but similar pattern)

**Location:** `src/pages/hr/CTCMasterPage.tsx` (example location)

**Purpose:** HR interface for managing employee CTC records

**Key Features:**

- List all employee CTC records
- Filter by currency
- Search by employee ID/name
- Create new CTC record
- Update CTC amounts
- View CTC history
- Currency conversion display

---

## 🔗 Integration Points & Dependencies

### 1. Authentication & Authorization

**Authentication Middleware:**

```typescript
// server/src/middleware/auth.ts
export const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};
```

**Usage in Routes:**

```typescript
// Protected routes require authentication
router.get("/", authenticateToken, async (req, res) => {
  // Route handler
});
```

**Frontend Authentication:**

```typescript
// src/store/authStore.ts
interface AuthState {
  user: {
    id: string;
    employeeId: string; // Used for timesheet lookups
    name: string;
    email: string;
    role: string;
  } | null;
  token: string | null;
  login: (credentials) => Promise<void>;
  logout: () => void;
}
```

---

### 2. Project Master Integration

**Dependency:**

- Timesheet entries require valid project selection
- Projects are filtered by status ("Active" projects only)

**API Integration:**

```typescript
// Get active projects for dropdown
GET /api/projects?status=Active

// Response structure
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "projectId": "PRJ-2026-001",
      "projectName": "Enterprise ERP Implementation",
      "customerId": "...",
      "status": "Active",
      // ... other fields
    }
  ]
}
```

**Frontend Usage:**

```typescript
const [projects, setProjects] = useState([]);

useEffect(() => {
  const fetchProjects = async () => {
    const response = await apiClient.get("/projects?status=Active");
    setProjects(response.data.data);
  };
  fetchProjects();
}, []);
```

---

### 3. Customer Master Integration

**Dependency:**

- Projects are linked to customers
- Reporting may aggregate by customer

**Data Relationship:**

```
Customer (1) ←→ (N) Projects ←→ (N) Timesheet Entries
```

---

### 4. Employee Master Integration

**Dependency:**

- All modules reference employee data
- Employee master is source of truth for employee information

**Integration Points:**

1. **Timesheet Entries:**
   - `employeeId` foreign key
   - `employeeName` denormalized for performance

2. **CTC Master:**
   - `employeeId` unique constraint
   - Employee search for CTC record creation

3. **UDA Configuration:**
   - No direct dependency, but UDAs are used by employees

**Employee Search API:**

```typescript
GET /api/employees?search=john&active=true

// Response
[
  {
    "id": "...",
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john@company.com",
    "department": "Engineering",
    "designation": "Senior Developer"
  }
]
```

---

### 5. Approval Workflow Integration

**Future Feature:** Manager approval system

**Workflow:**

```
Employee → Submit Timesheet
    ↓
Manager → Review
    ↓
    ├─→ Approve → Lock timesheet
    └─→ Reject → Employee can revise
```

**Required Enhancements:**

1. Manager dashboard to view submitted timesheets
2. Approval/rejection UI with reason textarea
3. Email notifications
4. Audit trail

---

## ✅ Migration Checklist

### Pre-Migration Phase

- [ ] **Environment Setup**
  - [ ] Node.js 18+ installed
  - [ ] MongoDB 6.0+ running
  - [ ] Environment variables configured
  - [ ] SSL certificates (if applicable)

- [ ] **Database Preparation**
  - [ ] Create MongoDB database
  - [ ] Configure connection string
  - [ ] Set up indexes (run index scripts)
  - [ ] Enable replica set (for transactions)

- [ ] **Dependency Installation**
  - [ ] Backend: `cd server && npm install`
  - [ ] Frontend: `npm install`
  - [ ] Verify all dependencies resolve

---

### Migration Phase

#### Backend Migration

- [ ] **Copy Backend Files**
  - [ ] Copy `server/src/models/` directory
    - [ ] `Timesheet.ts`
    - [ ] `TimesheetEntry.ts`
    - [ ] `UDA.ts`
    - [ ] `CTCMaster.ts`
    - [ ] `Project.ts`
    - [ ] `Customer.ts`
    - [ ] `Employee.ts (if needed)`
  - [ ] Copy `server/src/routes/` files
    - [ ] `timesheets.ts`
    - [ ] `timesheetEntries.ts`
    - [ ] `udaConfigurations.ts`
    - [ ] `ctcMaster.ts`
    - [ ] `projects.ts`
  - [ ] Copy `server/src/utils/` files
    - [ ] `timesheetTransformers.ts`
  - [ ] Copy `server/src/middleware/` files
    - [ ] `auth.ts`

- [ ] **Register Routes in Server**

  ```typescript
  // server.ts or app.ts
  import timesheetRoutes from "./routes/timesheets";
  import timesheetEntryRoutes from "./routes/timesheetEntries";
  import udaRoutes from "./routes/udaConfigurations";
  import ctcRoutes from "./routes/ctcMaster";
  import projectRoutes from "./routes/projects";

  app.use("/api/timesheets", timesheetRoutes);
  app.use("/api/timesheet-entries", timesheetEntryRoutes);
  app.use("/api/uda-configurations", udaRoutes);
  app.use("/api/ctc-master", ctcRoutes);
  app.use("/api/projects", projectRoutes);
  ```

- [ ] **Environment Variables**
  ```env
  MONGODB_URI=mongodb://localhost:27017/employee_connect
  JWT_SECRET=your_secret_key_here
  PORT=5000
  NODE_ENV=production
  ```

#### Frontend Migration

- [ ] **Copy Frontend Files**
  - [ ] Copy `src/pages/rmg/uda-configuration/`
    - [ ] `WeeklyTimesheet.tsx`
    - [ ] `UDAConfigurationPage.tsx`
    - [ ] `components/UDAConfigurationTable.tsx`
    - [ ] `components/UDAConfigurationForm.tsx`
  - [ ] Copy `src/services/`
    - [ ] `timesheetService.ts`
    - [ ] `ctcService.ts`
    - [ ] `api.ts` (base API client)
  - [ ] Copy `src/types/`
    - [ ] `timesheet.ts`
    - [ ] `udaConfiguration.ts`
    - [ ] `ctc.ts`
  - [ ] Copy `src/store/`
    - [ ] `udaConfigurationStore.ts`
    - [ ] `authStore.ts` (if not exists)
  - [ ] Copy `src/utils/`
    - [ ] `timesheetValidation.ts`
    - [ ] `timesheetUtils.ts`

- [ ] **Update API Base URL**

  ```typescript
  // src/services/api.ts
  const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  });
  ```

- [ ] **Add Routes to Router**
  ```typescript
  // src/router/index.tsx
  <Route path="/timesheet" element={<WeeklyTimesheet />} />
  <Route path="/uda-config" element={<UDAConfigurationPage />} />
  <Route path="/ctc-master" element={<CTCMasterPage />} />
  ```

---

### Data Migration

- [ ] **Seed Initial Data**
  - [ ] Create sample projects
  - [ ] Create UDA configurations
  - [ ] Create employee records
  - [ ] (Optional) Import existing CTC data

- [ ] **Database Indexes**

  ```javascript
  // Run in MongoDB shell or migration script

  // TimesheetEntry indexes
  db.timesheetentries.createIndex({ employeeId: 1, date: 1 });
  db.timesheetentries.createIndex({ projectId: 1, date: 1 });
  db.timesheetentries.createIndex({ approvalStatus: 1, submittedAt: 1 });
  db.timesheetentries.createIndex({ billable: 1, date: 1 });
  db.timesheetentries.createIndex(
    { employeeId: 1, date: 1, projectId: 1, udaId: 1 },
    { unique: true },
  );

  // Timesheet indexes
  db.timesheets.createIndex({ employeeId: 1, weekStartDate: 1 });

  // UDA indexes
  db.udas.createIndex({ udaNumber: 1 }, { unique: true });
  db.udas.createIndex({ name: 1 });
  db.udas.createIndex({ active: 1 });
  db.udas.createIndex({ type: 1 });

  // CTC Master indexes
  db.ctcmasters.createIndex({ employeeId: 1 }, { unique: true });
  db.ctcmasters.createIndex({ employeeName: 1 });
  db.ctcmasters.createIndex({ currency: 1 });

  // Project indexes
  db.projects.createIndex({ projectId: 1 }, { unique: true });
  db.projects.createIndex({ status: 1 });

  // Customer indexes
  db.customers.createIndex({ customerNo: 1 }, { unique: true });
  db.customers.createIndex({ customerName: "text", customerNo: "text" });
  ```

---

### Testing Phase

#### Backend API Testing

- [ ] **Timesheet APIs**
  - [ ] GET week timesheet (with and without data)
  - [ ] POST submit timesheet
  - [ ] POST save draft
  - [ ] DELETE recall timesheet
  - [ ] DELETE specific row
  - [ ] PUT approve entry
  - [ ] PUT reject entry

- [ ] **UDA APIs**
  - [ ] GET all UDAs (with filters)
  - [ ] GET single UDA
  - [ ] POST create UDA
  - [ ] PUT update UDA
  - [ ] DELETE UDA
  - [ ] Test unique constraint on udaNumber

- [ ] **CTC APIs**
  - [ ] GET all CTC records (with filters)
  - [ ] GET single CTC record
  - [ ] POST create CTC record
  - [ ] PUT update CTC record
  - [ ] DELETE CTC record
  - [ ] Test unique constraint on employeeId

#### Frontend Testing

- [ ] **Weekly Timesheet**
  - [ ] Page loads successfully
  - [ ] Week navigation works
  - [ ] Add new row
  - [ ] Hour input validation ("008:00" → "8:00")
  - [ ] Comment input
  - [ ] Delete row
  - [ ] Save draft shows toast with employee ID
  - [ ] Submit week changes status and disables inputs
  - [ ] Status background colors display correctly
  - [ ] Total hours calculation

- [ ] **UDA Configuration**
  - [ ] Page loads with UDA list
  - [ ] Filters work (active, type, search)
  - [ ] Create new UDA
  - [ ] Edit existing UDA
  - [ ] Delete UDA with confirmation
  - [ ] Form validation

- [ ] **CTC Master**
  - [ ] Page loads with CTC records
  - [ ] Search and filter functionality
  - [ ] Create new CTC record
  - [ ] Update existing record
  - [ ] Currency selection
  - [ ] UOM selection
  - [ ] CTC history display

#### Integration Testing

- [ ] **Timesheet + UDA Integration**
  - [ ] Load active UDAs in timesheet dropdown
  - [ ] Select UDA with projectRequired="Y" → Project dropdown enabled
  - [ ] Select UDA with projectRequired="N" → Project optional
  - [ ] Billable/Non-billable reflects UDA setting

- [ ] **Timesheet + Project Integration**
  - [ ] Load active projects in dropdown
  - [ ] Project selection populates project details
  - [ ] Submit timesheet saves correct project reference

- [ ] **Authentication**
  - [ ] Protected routes require login
  - [ ] Employee ID from auth user used in timesheet
  - [ ] Token refresh works
  - [ ] Logout clears session

---

### Post-Migration Phase

- [ ] **Documentation**
  - [ ] Update internal API documentation
  - [ ] Create user guides
  - [ ] Document common issues and solutions
  - [ ] Update deployment guide

- [ ] **Monitoring**
  - [ ] Set up error logging (e.g., Sentry)
  - [ ] Monitor API performance
  - [ ] Database query optimization
  - [ ] Set up alerts for errors

- [ ] **Backup Strategy**
  - [ ] Automated database backups
  - [ ] Backup retention policy
  - [ ] Disaster recovery plan

- [ ] **User Training**
  - [ ] Train employees on timesheet entry
  - [ ] Train managers on approval workflow (future)
  - [ ] Train HR on CTC management
  - [ ] Train admins on UDA configuration

---

## 🔄 GitHub Migration Guide

### Step 1: Create GitHub Repository

#### Option A: Via GitHub Web Interface

1. **Log in to GitHub**
   - Navigate to https://github.com
   - Sign in with your credentials

2. **Create New Repository**
   - Click the **"+"** icon in the top-right corner
   - Select **"New repository"**

3. **Repository Configuration**

   ```
   Repository Name: employee-connect-timesheet
   Description: Weekly Timesheet, UDA Configuration & CTC Master modules
   Visibility: Private (recommended for proprietary code)
   □ Initialize with README (leave unchecked - we'll add our own)
   □ Add .gitignore (leave unchecked - we'll configure manually)
   □ Choose a license (configure later based on company policy)
   ```

4. **Create Repository**
   - Click **"Create repository"**
   - Copy the repository URL (e.g., `https://github.com/your-org/employee-connect-timesheet.git`)

#### Option B: Via GitHub CLI

```bash
# Install GitHub CLI (if not already installed)
# Windows: winget install --id GitHub.cli
# Mac: brew install gh
# Linux: See https://github.com/cli/cli#installation

# Authenticate
gh auth login

# Create repository
gh repo create employee-connect-timesheet --private --description "Weekly Timesheet, UDA Configuration & CTC Master modules"
```

---

### Step 2: Configure .gitignore

Create a `.gitignore` file in your project root:

```bash
# .gitignore for Employee Connect Project

# ============================================
# Node.js
# ============================================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# ============================================
# Environment Variables
# ============================================
.env
.env.local
.env.development
.env.test
.env.production
.env.*.local
server/.env
server/.env.local

# ============================================
# Build Outputs
# ============================================
dist/
build/
out/
.next/
*.tsbuildinfo
server/dist/
server/build/

# ============================================
# IDE & Editors
# ============================================
.vscode/
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
.DS_Store
*.sublime-workspace
*.sublime-project

# ============================================
# Operating System
# ============================================
Thumbs.db
Desktop.ini
.DS_Store
.AppleDouble
.LSOverride

# ============================================
# Testing
# ============================================
coverage/
*.lcov
.nyc_output

# ============================================
# Logs
# ============================================
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# ============================================
# MongoDB
# ============================================
data/db/
*.mdb
*.ldb
mongodb-data/

# ============================================
# Temporary Files
# ============================================
tmp/
temp/
*.tmp
*.bak
*.swp
.cache/

# ============================================
# Sensitive Data (CRITICAL - NEVER COMMIT)
# ============================================
# JWT secrets, API keys, database credentials
config/secrets.json
secrets/
private/
*.pem
*.key
*.cert
*.crt
id_rsa
id_rsa.pub

# ============================================
# Package Manager
# ============================================
.pnp
.pnp.js
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
package-lock.json
yarn.lock
pnpm-lock.yaml

# ============================================
# Production
# ============================================
/build
.vercel
.netlify
.serverless/
```

---

### Step 3: Initialize Git and First Commit

#### For New Project

```bash
# Navigate to your project directory
cd c:\Users\raghu.deva\Employe_Connect-main_latest

# Initialize Git repository
git init

# Add the .gitignore file
echo "# See .gitignore above" > .gitignore

# Configure Git user (if not already done)
git config user.name "Your Name"
git config user.email "your.email@company.com"

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: Weekly Timesheet, UDA Configuration & CTC Master modules

- Added complete timesheet management system with date-based entries
- Added UDA configuration module
- Added CTC Master module with historical tracking
- Included comprehensive API endpoints
- Added frontend components and services
- Documented complete migration guide"

# Add remote repository
git remote add origin https://github.com/your-org/employee-connect-timesheet.git

# Push to GitHub
git push -u origin main
```

#### For Existing Git Project

```bash
# Navigate to project directory
cd c:\Users\raghu.deva\Employe_Connect-main_latest

# Verify current remote
git remote -v

# Add new remote (if changing repository)
git remote add github https://github.com/your-org/employee-connect-timesheet.git

# Or update existing remote
git remote set-url origin https://github.com/your-org/employee-connect-timesheet.git

# Push to GitHub
git push -u origin main
```

---

### Step 4: Branch Strategy

#### Create Development Branches

```bash
# Create and switch to development branch
git checkout -b develop
git push -u origin develop

# Create feature branches for ongoing work
git checkout -b feature/timesheet-approval-workflow
git checkout -b feature/advanced-reporting
git checkout -b feature/mobile-responsive

# Create hotfix branch (for urgent production fixes)
git checkout -b hotfix/timesheet-submission-bug

# Branch naming conventions:
# - main (or master) - Production-ready code
# - develop - Integration branch for features
# - feature/<feature-name> - New features
# - bugfix/<bug-name> - Bug fixes
# - hotfix/<issue-name> - Urgent production fixes
# - release/<version> - Release preparation
```

#### Branch Protection Rules (Set on GitHub)

1. Navigate to: **Settings** → **Branches** → **Add rule**
2. Configure protection for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Restrict who can push to matching branches

---

### Step 5: Repository Structure and README

Create a comprehensive `README.md` in the root:

```markdown
# Employee Connect - Timesheet Management System

> Complete timesheet, UDA configuration, and CTC Master module for employee management

## 📋 Features

### 1. Weekly Timesheet

- Week-based time entry (Monday-Sunday)
- Project and UDA selection
- Billable/Non-billable tracking
- Draft and submission workflows
- Manager approval system

### 2. UDA Configuration

- User Defined Activity management
- Billable/Non-billable classification
- Project requirement settings
- Active/Inactive status control

### 3. CTC Master

- Employee compensation tracking
- Multi-currency support (INR, USD)
- Historical CTC records
- Planned vs Actual CTC tracking

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- npm or yarn

### Installation

\`\`\`bash

# Clone repository

git clone https://github.com/your-org/employee-connect-timesheet.git
cd employee-connect-timesheet

# Install backend dependencies

cd server
npm install

# Install frontend dependencies

cd ..
npm install

# Set up environment variables

cp server/.env.example server/.env
cp .env.example .env

# Start MongoDB

# Windows: net start MongoDB

# Mac/Linux: sudo systemctl start mongod

# Seed database (optional)

cd server
npm run seed

# Start backend server

npm run dev

# In another terminal, start frontend

cd ..
npm run dev
\`\`\`

## 📁 Project Structure

\`\`\`
├── server/ # Backend (Node.js/Express)
│ ├── src/
│ │ ├── models/ # MongoDB schemas
│ │ ├── routes/ # API endpoints
│ │ ├── utils/ # Utility functions
│ │ └── middleware/ # Express middleware
│ └── package.json
│
├── src/ # Frontend (React/TypeScript)
│ ├── pages/ # Page components
│ ├── services/ # API clients
│ ├── types/ # TypeScript definitions
│ ├── store/ # State management
│ └── utils/ # Frontend utilities
│
└── docs/ # Documentation
└── TIMESHEET_UDA_CTC_MIGRATION_GUIDE.md
\`\`\`

## 🔌 API Documentation

See [API Documentation](docs/API.md) for complete endpoint reference.

### Key Endpoints

#### Timesheet

- `GET /api/timesheet-entries/week/:employeeId/:weekStartDate`
- `POST /api/timesheet-entries/submit`
- `DELETE /api/timesheet-entries/recall/:employeeId/:weekStartDate`

#### UDA Configuration

- `GET /api/uda-configurations`
- `POST /api/uda-configurations`
- `PUT /api/uda-configurations/:id`

#### CTC Master

- `GET /api/ctc-master`
- `POST /api/ctc-master`
- `PUT /api/ctc-master/:id`

## 🧪 Testing

\`\`\`bash

# Run backend tests

cd server
npm test

# Run frontend tests

cd ..
npm test

# Run e2e tests

npm run test:e2e
\`\`\`

## 🚢 Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for production deployment instructions.

## 📖 Documentation

- [Complete Migration Guide](docs/TIMESHEET_UDA_CTC_MIGRATION_GUIDE.md)
- [Implementation Guide](docs/TIMESHEET_IMPLEMENTATION_GUIDE.md)
- [Employee Hours Report](docs/EMPLOYEE_HOURS_REPORT_MODULE.md)

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Submit a pull request
4. Wait for code review

### Commit Message Convention

\`\`\`
<type>: <subject>

<body>

<footer>
\`\`\`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
\`\`\`
feat: add weekly timesheet approval workflow

- Added manager dashboard for timesheet review
- Implemented approve/reject functionality
- Added email notifications

Closes #123
\`\`\`

## 📝 License

Proprietary and Confidential
© 2026 [Your Company Name]. All rights reserved.

## 📞 Support

- **Technical Lead:** [Name] - [email]
- **Project Manager:** [Name] - [email]

---

**Version:** 1.0.0
**Last Updated:** February 20, 2026
```

---

### Step 6: Set Up GitHub Actions (CI/CD)

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]
        mongodb-version: ["6.0", "7.0"]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Start MongoDB
        uses: supercharge/mongodb-github-action@1.10.0
        with:
          mongodb-version: ${{ matrix.mongodb-version }}

      - name: Install backend dependencies
        working-directory: ./server
        run: npm ci

      - name: Run backend linter
        working-directory: ./server
        run: npm run lint

      - name: Run backend tests
        working-directory: ./server
        run: npm test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret

  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install frontend dependencies
        run: npm ci

      - name: Run frontend linter
        run: npm run lint

      - name: Run frontend tests
        run: npm test

      - name: Build frontend
        run: npm run build

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Run security audit (backend)
        working-directory: ./server
        run: npm audit --audit-level=moderate

      - name: Run security audit (frontend)
        run: npm audit --audit-level=moderate
```

---

### Step 7: Create GitHub Issues and Project Board

#### Set Up Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Report a bug to help us improve
title: "[BUG] "
labels: bug
assignees: ""
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**

- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Node Version: [e.g. 18.17.0]
- MongoDB Version: [e.g. 6.0]

**Additional context**
Add any other context about the problem here.
```

Create `.github/ISSUE_TEMPLATE/feature_request.md`:

```markdown
---
name: Feature Request
about: Suggest a new feature for this project
title: "[FEATURE] "
labels: enhancement
assignees: ""
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

#### Create Project Board

1. Navigate to **Projects** tab on GitHub
2. Click **"New project"**
3. Choose **"Board"** template
4. Name: "Timesheet Development"
5. Add columns:
   - 📋 Backlog
   - 🎯 To Do
   - 🚧 In Progress
   - 👀 In Review
   - ✅ Done

---

### Step 8: Add Security Measures

#### Create SECURITY.md

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities to:

- Email: security@yourcompany.com
- Subject: [SECURITY] Employee Connect Timesheet

Please include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will respond within 48 hours and provide a timeline for fixes.

## Security Best Practices

- Never commit `.env` files
- Use strong JWT secrets (min 32 characters)
- Rotate MongoDB credentials regularly
- Enable 2FA on GitHub accounts
- Review dependencies for vulnerabilities
- Keep Node.js and MongoDB updated
```

#### Enable Dependabot

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  # Backend dependencies
  - package-ecosystem: "npm"
    directory: "/server"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "tech-lead"
    labels:
      - "dependencies"
      - "backend"

  # Frontend dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "tech-lead"
    labels:
      - "dependencies"
      - "frontend"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

### Step 9: Collaboration Workflow

#### Pull Request Template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## Description

<!-- Provide a brief description of the changes -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Related Issues

<!-- Link to related issues: Fixes #123, Closes #456 -->

## Changes Made

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors

## Screenshots (if applicable)

<!-- Add screenshots here -->

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Additional Notes

<!-- Any additional information -->
```

#### Recommended Git Workflow

```bash
# 1. Update your local develop branch
git checkout develop
git pull origin develop

# 2. Create a feature branch
git checkout -b feature/manager-approval-dashboard

# 3. Make changes and commit regularly
git add .
git commit -m "feat: add manager dashboard UI"

# 4. Push to GitHub
git push -u origin feature/manager-approval-dashboard

# 5. Create Pull Request on GitHub
# - Go to repository on GitHub
# - Click "Compare & pull request"
# - Fill in PR template
# - Request reviews
# - Wait for CI/CD checks

# 6. After PR approval, merge to develop
# (Done via GitHub UI)

# 7. Delete feature branch (optional)
git branch -d feature/manager-approval-dashboard
git push origin --delete feature/manager-approval-dashboard
```

---

### Step 10: GitHub Repository Settings

Configure these settings on GitHub:

#### General Settings

- ✅ Disable **"Allow merge commits"** (use squash and merge)
- ✅ Enable **"Automatically delete head branches"**
- ✅ Enable **"Allow auto-merge"**

#### Collaborators and Teams

- Add team members with appropriate permissions
  - **Admin:** Tech lead, DevOps
  - **Write:** Developers
  - **Read:** QA, Stakeholders

#### Webhooks (Optional)

- Slack/Teams notifications for PRs
- Deployment webhooks for staging/production

#### Secrets

Store sensitive values in **Settings** → **Secrets and variables** → **Actions**:

- `MONGODB_URI`
- `JWT_SECRET`
- `AWS_ACCESS_KEY` (if using AWS)
- `DEPLOYMENT_KEY`

---

### Quick Reference: Git Commands

```bash
# Clone repository
git clone https://github.com/your-org/employee-connect-timesheet.git

# Check status
git status

# View branches
git branch -a

# Switch branches
git checkout develop
git checkout -b feature/new-feature

# Stage changes
git add .
git add specific-file.ts

# Commit changes
git commit -m "feat: add new feature"

# Push changes
git push origin feature/new-feature

# Pull latest changes
git pull origin develop

# Merge develop into your branch
git merge develop

# View commit history
git log --oneline --graph

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- filename.ts
git restore filename.ts

# View differences
git diff
git diff develop..feature/my-branch

# Stash changes
git stash
git stash pop

# Tag a release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## ✅ GitHub Migration Checklist

- [ ] **Repository Setup**
  - [ ] Created GitHub repository (private/public)
  - [ ] Added repository description
  - [ ] Configured repository settings

- [ ] **Git Configuration**
  - [ ] Created `.gitignore` file
  - [ ] Initialized Git repository
  - [ ] Made initial commit
  - [ ] Pushed code to GitHub

- [ ] **Documentation**
  - [ ] Created comprehensive `README.md`
  - [ ] Added `SECURITY.md`
  - [ ] Updated migration guide
  - [ ] Added API documentation

- [ ] **Branch Protection**
  - [ ] Set up branch protection rules for `main`
  - [ ] Require PR reviews
  - [ ] Enable status checks
  - [ ] Created `develop` branch

- [ ] **CI/CD**
  - [ ] Set up GitHub Actions workflow
  - [ ] Configured automated tests
  - [ ] Added security scanning
  - [ ] Set up deployment pipeline

- [ ] **Collaboration**
  - [ ] Added issue templates
  - [ ] Created PR template
  - [ ] Set up project board
  - [ ] Invited team members

- [ ] **Security**
  - [ ] Enabled Dependabot
  - [ ] Added secrets to GitHub
  - [ ] Configured security policy
  - [ ] Enabled 2FA for all team members

- [ ] **Integration**
  - [ ] Connected to CI/CD tools
  - [ ] Set up monitoring/logging
  - [ ] Configured webhooks (if needed)

---

### Production Deployment

- [ ] **Build Process**
  - [ ] Frontend: `npm run build`
  - [ ] Backend: `npm run build` (if using TypeScript)
  - [ ] Test production builds locally

- [ ] **Server Configuration**
  - [ ] Configure reverse proxy (Nginx/Apache)
  - [ ] Set up SSL/TLS certificates
  - [ ] Configure firewall rules
  - [ ] Set process manager (PM2/systemd)

- [ ] **Environment Configuration**
  - [ ] Production environment variables
  - [ ] Database connection pooling
  - [ ] CORS configuration
  - [ ] Rate limiting

- [ ] **Go-Live Checklist**
  - [ ] Database indexes created
  - [ ] Seed data populated
  - [ ] Backups configured
  - [ ] Monitoring active
  - [ ] User access tested
  - [ ] Smoke tests passed

---

## 📞 Support & Troubleshooting

### Common Issues

#### 1. Hours Not Saving

**Symptom:** Hours entered don't persist after navigation
**Solution:**

- Check if employee ID is present in auth context
- Verify API endpoint connectivity
- Check browser console for errors
- Ensure MongoDB is running

#### 2. Duplicate Entry Error

**Symptom:** Error when submitting timesheet: "E11000 duplicate key error"
**Solution:**

- Check unique constraint on `timesheetentries`
- Employee cannot log multiple entries for same date+project+UDA
- Delete conflicting entry or modify existing one

#### 3. UDA Number Already Exists

**Symptom:** Cannot create UDA with error "UDA number already exists"
**Solution:**

- UDA numbers must be unique
- Check existing UDAs in database
- Use different UDA number

#### 4. Authentication Token Expired

**Symptom:** API returns 401 Unauthorized
**Solution:**

- Implement token refresh logic
- User needs to log in again
- Check JWT_SECRET configuration

#### 5. Project Required Validation

**Symptom:** Cannot submit timesheet without project
**Solution:**

- Check UDA `projectRequired` field
- If "Y", project selection is mandatory
- If "N", use projectId: "N/A"

---

## 🚀 Future Enhancements

### Phase 1: Manager Approval Workflow (Priority High)

- [ ] Manager dashboard to view submitted timesheets
- [ ] Approve/Reject buttons with reason textarea
- [ ] Email notifications on approval/rejection
- [ ] Bulk approval functionality
- [ ] Approval history and audit trail

### Phase 2: Advanced Reporting (Priority High)

- [ ] Employee utilization reports
- [ ] Project-wise hour allocation
- [ ] Billable vs non-billable analysis
- [ ] Revenue forecasting based on CTC and billable hours
- [ ] Export to Excel/PDF

### Phase 3: Enhanced UX (Priority Medium)

- [ ] Copy previous week's timesheet
- [ ] Timesheet templates for recurring tasks
- [ ] Mobile-responsive design improvements
- [ ] Offline capability with sync
- [ ] Keyboard shortcuts

### Phase 4: Integration & Automation (Priority Medium)

- [ ] Integration with payroll system
- [ ] Integration with project management tools
- [ ] Automated reminders for timesheet submission
- [ ] Slack/Teams notifications
- [ ] API webhooks for external systems

### Phase 5: Advanced Analytics (Priority Low)

- [ ] AI-powered project time prediction
- [ ] Anomaly detection in time entries
- [ ] Resource optimization suggestions
- [ ] Burnout risk indicators
- [ ] Client billing accuracy analysis

---

## 📄 License & Copyright

**Proprietary Software**
© 2026 [Your Company Name]. All rights reserved.

This documentation and associated code are proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

---

## 📝 Version History

| Version | Date       | Author | Changes                         |
| ------- | ---------- | ------ | ------------------------------- |
| 1.0     | 2026-02-20 | System | Initial migration guide created |

---

## 🤝 Contact & Support

For questions or issues during migration:

- **Technical Lead:** [Name] - [email]
- **Project Manager:** [Name] - [email]
- **Database Admin:** [Name] - [email]

---

**End of Document**
