You are updating an existing Helpdesk system.
The architecture has been revised and must be implemented exactly as described below.

This is NOT a greenfield build.
Update backend (Node.js + Express + MongoDB) and frontend
(React + TypeScript + Tailwind + shadcn) to match the new flow.

=====================================================
1. CORE ARCHITECTURE CHANGE (CRITICAL)
=====================================================

Ticket flow must be driven by MODULE SELECTION at creation time.

While raising a ticket, the user MUST select:
- module = "IT" | "Finance" | "Facilities"

This module value becomes immutable and drives the entire lifecycle.

-----------------------------------------------------
Ticket schema must include:
-----------------------------------------------------
{
  module: "IT" | "Finance" | "Facilities",
  requiresApproval: boolean,
  currentApprovalLevel: "L1" | "L2" | "L3" | "NONE",
  approvalCompleted: boolean,
  sla: {
    startAt,
    dueAt,
    status
  }
}

=====================================================
2. TICKET CREATION FLOW
=====================================================

When a ticket is created:

- Persist ticket with selected module
- Start SLA immediately
- Evaluate requiresApproval based on request type

IF requiresApproval === false:
- currentApprovalLevel = "NONE"
- approvalCompleted = true
- status = "Routed"
- route ticket directly to the selected module admin

IF requiresApproval === true:
- Assign ticket visibility to L1, L2, L3
- currentApprovalLevel = "L1"
- approvalCompleted = false
- status = "Pending L1 Approval"
- DO NOT route to any admin yet

=====================================================
3. APPROVAL MODEL (SEQUENTIAL ACTION, PARALLEL VISIBILITY)
=====================================================

All approvers (L1, L2, L3):
- Can view the FULL activity timeline at all times
- Can act ONLY when currentApprovalLevel matches their role

Approval transitions:

L1 Approves:
- currentApprovalLevel = "L2"
- status = "Pending L2 Approval"

L2 Approves:
- currentApprovalLevel = "L3"
- status = "Pending L3 Approval"

L3 Approves (FINAL):
- currentApprovalLevel = "NONE"
- approvalCompleted = true
- status = "Routed"
- route ticket to module-specific admin

Any rejection:
- status = "Rejected"
- stop workflow

=====================================================
4. MODULE-DRIVEN ROUTING (KEY CHANGE)
=====================================================

Routing must use the selected module:

IF module === "IT":
- route to IT Admin dashboard

IF module === "Finance":
- route to Finance Admin dashboard

IF module === "Facilities":
- route to Facilities Admin dashboard

Admins must NEVER see:
- Tickets pending L1/L2/L3 approval

=====================================================
5. ADMIN & SPECIALIST FLOW
=====================================================

Admin responsibilities:
- View tickets routed to their module
- Assign ticket to a specialist within the same module

Specialist flow:
- Assigned → In Progress → Paused → Resume
- Completed → Awaiting User Confirmation
- Completed → Awaiting IT Closure
- Closed

Paused tickets MUST remain visible.

=====================================================
6. SLA (MANDATORY FOR ALL MODULES)
=====================================================

SLA rules:
- SLA starts at ticket creation
- SLA continues through:
  approval → assignment → work → closure

SLA states:
- On Track
- At Risk
- Breached

Expose SLA status to:
- Employee (read-only)
- Approvers
- Admins
- Specialists

=====================================================
7. ACTIVITY & CONVERSATION (UNIFIED)
=====================================================

Maintain a single timeline that includes:
- Ticket creation
- Approval actions (L1/L2/L3)
- Routing
- Assignment
- Pause / Resume
- User confirmation
- Closure
- User & specialist messages

Timeline must be visible end-to-end to:
- Employee
- L1/L2/L3
- Admin
- Specialist

=====================================================
8. FRONTEND UI RULES
=====================================================

- Module selection MUST be shown in "Raise a Request"
- Approval action buttons appear ONLY for the active approval level
- Admin dashboards are module-specific
- Specialist dashboards are module-specific
- Paused tickets are visible with a distinct badge
- Ticket Flow Stepper reflects full lifecycle

=====================================================
9. BACKEND ENFORCEMENT
=====================================================

- Enforce RBAC at API level
- Enforce approval gating in queries
- Prevent premature admin visibility
- Prevent cross-module assignment

=====================================================
10. ACCEPTANCE CRITERIA (MUST PASS)
=====================================================

1. User selects module at ticket creation
2. Ticket follows approval flow (if required)
3. L1/L2/L3 have full visibility but sequential control
4. Admin sees ticket ONLY after final approval
5. Ticket routes to correct module admin
6. SLA starts immediately and tracks end-to-end
7. Activity timeline shows full history
8. No ticket disappears unexpectedly

=====================================================
FINAL OUTPUT EXPECTATION
=====================================================

Generate the required backend and frontend changes to fully implement
this updated architecture without breaking existing functionality.
