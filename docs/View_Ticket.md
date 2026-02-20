Generate a React + TypeScript component for the "View Ticket" page inside the Helpdesk application.

### PURPOSE OF THE COMPONENT
When a user opens any ticket under “My Requests”, the system must display:
1. A Stepper-style progress tracker showing current ticket stage.
2. Detailed ticket information (category, sub-category, requester details, approval status, routing info, SLA, assignment info, and history).

### BUSINESS LOGIC FOR STEPPER FLOW
The stepper must dynamically change based on the ticket’s status.

Ticket lifecycle states:
1. Submitted
2. Pending Approval (only if requiresApproval = true)
   - Level-1 Manager Approval
   - Level-2 Manager Approval
   - Level-3 Manager Approval
3. Routed to Department
   - IT Processing Queue OR
   - Facilities Processing Queue OR
   - Finance Processing Queue
4. Assigned (technician / engineer / finance officer)
5. Work In Progress
6. Completed
7. User Confirmation Pending
8. Closed OR Auto-Closed

### STEPPER BEHAVIOR RULES
- If requiresApproval = false:
  Stepper must skip all approval stages and jump from “Submitted” → “Routed to Department”.
- If approvals exist:
  Highlight the current approval stage (L1/L2/L3).
- If ticket is rejected:
  Show rejection status with red indicator.
- If Auto-Close occurs:
  Show “Auto-Closed due to SLA” as final step.

### COMPONENT REQUIREMENTS
Create a file: `ViewTicket.tsx`

The UI must include:

### 1. Stepper Section
Use a horizontal stepper:
- Each step must display:
  - Title
  - Status (completed, active, pending)
  - Timestamp (if available)

### Step Titles:
- Submitted
- Level-1 Approval
- Level-2 Approval
- Level-3 Approval
- Routed to Department
- Assigned
- Work In Progress
- Completed
- User Confirmation
- Closed

### 2. Ticket Details Section
Show structured card layout with:
- Ticket ID
- High-Level Category (IT / Facilities / Finance)
- Sub-Category
- Request Description
- Requested By
- Requested Date
- Priority
- requiresApproval (true/false)
- approvalBypassed (true/false)
- Current Status
- Processing Queue + Specialist Queue
- Assigned To
- SLA timers
- Attachments
- History timeline (list chronological events)

### 3. Data Interface (must be generated)
Generate a TypeScript interface:

interface Ticket {
  ticketId: string;
  highLevelCategory: string;
  subCategory: string;
  requiresApproval: boolean;
  approvalBypassed: boolean;
  status: string;
  currentLevel?: number;
  approvalFlow?: {
    level1: { managerId: string; status: string; remarks?: string; timestamp?: string };
    level2: { managerId: string; status: string; remarks?: string; timestamp?: string };
    level3: { managerId: string; status: string; remarks?: string; timestamp?: string };
  };
  processingRoute: {
    processingQueue: string;
    specialistQueue: string;
  };
  assignedTo?: string;
  requestedBy: string;
  requestedDate: string;
  priority: string;
  description: string;
  attachments?: string[];
  sla: {
    approvalSlaHours: number;
    processingSlaHours: number;
  };
  history: Array<{ timestamp: string; event: string; by: string; remarks?: string }>;
}

### 4. State Logic
- Component receives ticket data via props OR API load.
- Based on ticket.status and requiresApproval, determine which step is active.
- Render stepper steps with dynamic states.

### 5. UI Requirements
- Use clean, modern UI (shadcn, MUI, or custom Tailwind components).
- Stepper should be responsive.
- Ticket details must be scrollable separately from the stepper.
- Highlight active step with accent color.

### 6. Optional Enhancements (generate if possible)
- Add Timeline component for full ticket history.
- Add status pill (Pending/Approved/Completed/Closed).
- Add icons to stepper steps.
- Show countdown for SLA.

### OUTPUT EXPECTATION
Generate:
- Full React component `ViewTicket.tsx`
- Supporting sub-components (Stepper, TicketDetails, HistoryTimeline)
- TypeScript interfaces
- Helper function: resolveCurrentStep(ticket: Ticket)
- Minimal sample ticket JSON for testing UI
