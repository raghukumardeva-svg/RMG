You are generating a complete Helpdesk workflow system.

### MODULES INCLUDED
1. IT Helpdesk  
2. Facilities Helpdesk  
3. Finance Helpdesk  

Each module has multiple sub-categories. Each sub-category contains routing rules:
- requiresApproval: true | false  
- processingQueue: IT / Facilities / Finance  
- specialistQueue: based on sub-category mapping  

### CORE BUSINESS LOGIC
When a user submits a request:
1. Select High-Level Category → Sub-category  
2. System loads subCategoryMapping.json to check:
   - requiresApproval (bool)
   - specialistQueue
   - processingQueue
3. If requiresApproval = true:
   - Ticket enters 3-level approval flow:
        Level-1 Manager → Level-2 Manager → Level-3 Manager
   - On final approval, route to relevant processing queue.
4. If requiresApproval = false:
   - Skip all approvals
   - Route ticket directly to processingQueue + specialistQueue.
   - Mark approvalBypassed = true and log audit event “Approvals Skipped”.

### DEPARTMENTS / PROCESSING QUEUES
- IT Processing Queue
    - Hardware Team
    - Software Team
    - Network Team
    - Identity Team
    - Security Team

- Facilities Processing Queue
    - Building Maintenance
    - Furniture & Layout
    - Housekeeping
    - Physical Security
    - Office Services

- Finance Processing Queue
    - Expense Claims
    - Reimbursements
    - Travel Requests
    - Invoice Processing
    - Vendor Payments
    - Payroll Queries

### AFTER ROUTING
1. Assigned to technician / facilities engineer / finance officer
2. Work In Progress
3. Completed
4. User Confirmation
5. Closed or Auto-close based on SLA.

### WHAT YOU MUST GENERATE
Generate code and structure for:

#### 1. React + TypeScript Frontend
- CreateRequestForm.tsx  
  - High-Level Category dropdown
  - Sub-Category dropdown (dependent)
  - Dynamic fields based on sub-category
  - Show badge: “Requires Approval” or “Auto-routed to <specialistQueue>”
- MyRequests list + details view
- ManagerApprovals
  - Filter by approval level
  - Approve / Reject with remarks
- ITQueue, FacilitiesQueue, FinanceQueue pages
  - Specialist filtering
  - Assignment modal
- Audit trail timeline component
- SLA countdown badge

#### 2. API Layer Structure (TypeScript or Node)
Endpoints:
POST /api/helpdesk/tickets  
GET /api/helpdesk/tickets/:id  
POST /api/helpdesk/tickets/:id/approve  
POST /api/helpdesk/tickets/:id/reject  
GET /api/helpdesk/approvals?managerId=  
GET /api/helpdesk/queues/:department  
POST /api/helpdesk/tickets/:id/assign  
POST /api/helpdesk/tickets/:id/progress  
POST /api/helpdesk/tickets/:id/close  

#### 3. Data Models
Ticket object must include:
- highLevelCategory
- subCategory
- requiresApproval
- approvalBypassed
- status
- currentLevel
- approvalFlow(level1, level2, level3)
- processingRoute(processingQueue, specialistQueue)
- SLA definitions (approval & processing)
- history logs

#### 4. subCategoryMapping.json (Auto-generated)
Mapping example:
{
  "Computers & Laptops": {
    "requiresApproval": true,
    "processingQueue": "IT",
    "specialistQueue": "Hardware Team Queue"
  },
  "Peripherals & Accessories": {
    "requiresApproval": false,
    "processingQueue": "IT",
    "specialistQueue": "Hardware Team Queue"
  },
  "Cleaning Services": {
    "requiresApproval": false,
    "processingQueue": "Facilities",
    "specialistQueue": "Housekeeping Queue"
  },
  "Expense Claims": {
    "requiresApproval": true,
    "processingQueue": "Finance",
    "specialistQueue": "Finance Team Queue"
  }
}

#### 5. Approval Engine Logic
Implement centralized helper:
evaluateApproval(ticket):
- If ticket.requiresApproval = false → return routeToDepartment(ticket)
- Else → continue approval chain
- If rejection occurs → mark ticket closed with remarks
- If final approval → routeToDepartment(ticket)

routeToDepartment(ticket):
- ticket.status = "Routed"
- ticket.processingQueue, specialistQueue from mapping
- push ticket into appropriate team queue.

#### 6. Assignment Flow
When routed:
- IT: assign technician
- Facilities: assign engineer or vendor
- Finance: assign finance officer

Must update:
- assignedTo
- progressStatus
- timestamps
- history logs

#### 7. SLA Processing
Define 2 SLA windows:
- approvalSlaHours
- processingSlaHours
Auto-close conditions:
- User does not confirm after completion
- Ticket exceeds processing SLA

#### 8. Notifications (stub functions)
notifyManager(level, ticket)
notifyTeam(queue, ticket)
notifyUser(ticket)

Create stubs for integration later.

### OUTPUT REQUIREMENTS FOR COPILOT
- Generate full folder structure
- Generate TypeScript interfaces
- Generate React components skeleton
- Generate API service layer
- Generate mock JSON storage logic
- Ensure the entire flow matches the architecture diagram exactly:
  - Category selection
  - Approval decision node
  - Optional 3-level approval
  - Routing to IT / Facilities / Finance
  - Specialist queue assignment
  - Work → Completed → User Confirmation → Close / Auto-Close
