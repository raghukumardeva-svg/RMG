Implement a multi-level approval workflow (L1 → L2 → L3) for Helpdesk requests using MongoDB (Mongoose), including test approver users persisted in the database and strict role-based approval logic.

=====================================================
### 1. APPROVER USERS (DATABASE-BASED)
=====================================================

Create approval users directly in MongoDB (NOT mock files).

Seed the database with 3 approver roles:

L1 Approver:
{
  name: "L1 Approver",
  email: "l1.approver@company.com",
  role: "L1_APPROVER",
  designation: "Team Lead",
  isActive: true
}

L2 Approver:
{
  name: "L2 Approver",
  email: "l2.approver@company.com",
  role: "L2_APPROVER",
  designation: "Manager",
  isActive: true
}

L3 Approver:
{
  name: "L3 Approver",
  email: "l3.approver@company.com",
  role: "L3_APPROVER",
  designation: "Director",
  isActive: true
}

Use:
- MongoDB seed script (seedApprovers.ts)

=====================================================
### 2. APPROVAL RULES (LATEST FLOW)
=====================================================

Approval is required ONLY for request types where:
- requiresApproval = true

Approval sequence must be strictly:
1. L1 Approval
2. L2 Approval
3. L3 Approval
4. Route to department (IT / Facilities / Finance)

If approval is NOT required:
- Skip all approval steps
- Directly route ticket to department

=====================================================
### 3. MONGODB TICKET SCHEMA UPDATE
=====================================================

Extend the Ticket (Mongoose) schema to support approvals:

{
  requiresApproval: Boolean,
  approvalLevel: {
    type: String,
    enum: ["L1", "L2", "L3", "NONE"],
    default: "NONE"
  },
  approvalStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"]
  },
  approverHistory: [
    {
      level: String,
      approverId: ObjectId,
      status: String,
      timestamp: Date,
      comments: String
    }
  ]
}

=====================================================
### 4. APPROVAL WORKFLOW LOGIC (BACKEND)
=====================================================

On ticket creation:

IF requiresApproval = false:
    ticket.approvalLevel = "NONE"
    ticket.status = "Routed"
    Save ticket and route immediately

IF requiresApproval = true:
    ticket.approvalLevel = "L1"
    ticket.approvalStatus = "Pending"
    ticket.status = "Pending Level-1 Approval"
    Save ticket

-----------------------------------------------------
### L1 APPROVAL HANDLER
-----------------------------------------------------
- Endpoint: POST /api/approvals/l1/:ticketId

If APPROVED:
    push approverHistory entry
    ticket.approvalLevel = "L2"
    ticket.status = "Pending Level-2 Approval"

If REJECTED:
    push approverHistory entry
    ticket.status = "Rejected"

-----------------------------------------------------
### L2 APPROVAL HANDLER
-----------------------------------------------------
- Endpoint: POST /api/approvals/l2/:ticketId

If APPROVED:
    push approverHistory entry
    ticket.approvalLevel = "L3"
    ticket.status = "Pending Level-3 Approval"

If REJECTED:
    push approverHistory entry
    ticket.status = "Rejected"

-----------------------------------------------------
### L3 APPROVAL HANDLER (FINAL)
-----------------------------------------------------
- Endpoint: POST /api/approvals/l3/:ticketId

If APPROVED:
    push approverHistory entry
    ticket.approvalLevel = "NONE"
    ticket.approvalStatus = "Approved"
    ticket.status = "Routed"
    Route ticket to IT / Facilities / Finance

If REJECTED:
    push approverHistory entry
    ticket.status = "Rejected"

=====================================================
### 5. ROLE-BASED ACCESS CONTROL
=====================================================

Enforce RBAC at API and UI level:

- Only L1_APPROVER can approve when approvalLevel = "L1"
- Only L2_APPROVER can approve when approvalLevel = "L2"
- Only L3_APPROVER can approve when approvalLevel = "L3"
- Employees cannot approve

Use middleware:
- checkUserRole(requiredRole)

=====================================================
### 6. UI BEHAVIOR (FRONTEND)
=====================================================

On View Ticket page:

- Show Approve / Reject buttons ONLY if:
    user.role matches ticket.approvalLevel

- Disable buttons otherwise

- On approval/rejection:
    - Call correct API endpoint
    - Refresh ticket state
    - Append activity timeline entry

=====================================================
### 7. ACTIVITY TIMELINE INTEGRATION
=====================================================

Every approval action must create timeline events:

- "L1 Approved by <name>"
- "L2 Approved by <name>"
- "L3 Approved by <name>"
- "Ticket Routed to Department"
- "Rejected by <name>"

=====================================================
### 8. ERROR & EDGE CASES
=====================================================

Handle:
- Duplicate approvals
- Invalid approval level access
- Double submission
- Concurrent approvals (use optimistic locking)

=====================================================
### 9. OUTPUT EXPECTATION
=====================================================

Copilot should generate:
- Mongoose schema updates
- MongoDB seed script for approvers
- Approval controllers & services
- Secure API routes with RBAC
- UI logic for approval buttons
- Activity timeline integration
- Clean, maintainable workflow code
