Update the Employee Helpdesk Dashboard in React + TypeScript to display 4 KPI cards based on the updated Helpdesk workflow.

=====================================================
### 1. KPI REQUIREMENTS (EMPLOYEE MODULE)
=====================================================

Show exactly **four** KPIs — no more, no duplicates — in the following order:

1. Total Requests  
2. Resolved  
3. In Progress  
4. Rejected  

Definitions:

- **Total Requests**  
  Count of all tickets created by the employee.

- **Resolved**  
  Tickets that are fully completed and no longer active.  
  Includes:
    - Closed  
    - Auto-Closed  

- **In Progress**  
  Count of all tickets that are NOT Resolved or Rejected.  
  Includes statuses:
    - Pending Level-1 Approval  
    - Pending Level-2 Approval  
    - Pending Level-3 Approval  
    - Routed  
    - Assigned  
    - In Progress  
    - Completed – Awaiting Confirmation  

- **Rejected**  
  Tickets rejected at any approval level.

=====================================================
### 2. DATA MODEL (TICKET STATUS RULES)
=====================================================

Statuses to treat as RESOLVED:
- "Closed"
- "Auto-Closed"

Statuses to treat as IN PROGRESS:
- "Pending Level-1 Approval"
- "Pending Level-2 Approval"
- "Pending Level-3 Approval"
- "Routed"
- "Assigned"
- "In Progress"
- "Completed – Awaiting Confirmation"

Statuses to treat as REJECTED:
- "Rejected"

=====================================================
### 3. IMPLEMENTATION DETAILS
=====================================================

Create or update component:
- **EmployeeKPISection.tsx**

Fetch ticket list via API:
GET /api/helpdesk/my-requests

Process the API response to compute KPI values:

- totalRequests = tickets.length
- resolved = tickets.filter(status in RESOLVED_STATUS_LIST)
- inProgress = tickets.filter(status in IN_PROGRESS_STATUS_LIST)
- rejected = tickets.filter(status == "Rejected")

=====================================================
### 4. UI REQUIREMENTS (Tailwind / shadcn)
=====================================================

Each KPI card must include:
- Title (e.g., "Total Requests")
- Value (large number)
- Icon (lucide-react)
- Clean spacing, rounded corners, subtle shadow

Layout:
- Responsive grid:
  - Desktop: 4 columns  
  - Tablet: 2 columns  
  - Mobile: 1 column  

Example JSX layout:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <KpiCard title="Total Requests" value={totalRequests} icon={<FileText />} />
  <KpiCard title="Resolved" value={resolved} icon={<CheckCircle />} />
  <KpiCard title="In Progress" value={inProgress} icon={<Clock />} />
  <KpiCard title="Rejected" value={rejected} icon={<XCircle />} />
</div>

=====================================================
### 5. REUSABLE KPI CARD COMPONENT
=====================================================

Create:
- **KpiCard.tsx**

Props:
- title: string
- value: number
- icon: ReactNode

=====================================================
### 6. OUTPUT EXPECTATION
=====================================================

Copilot should generate:

- EmployeeKPISection.tsx
- KpiCard.tsx
- API integration logic
- Status grouping helper:
  getKpiCounts(tickets: Ticket[]): {
    totalRequests,
    resolved,
    inProgress,
