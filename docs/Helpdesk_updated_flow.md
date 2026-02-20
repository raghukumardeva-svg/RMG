=====================================================
### 1. HELP DESK HOME PAGE — ENTRY FLOW
=====================================================

When user navigates to the Helpdesk module:

1. Show **My Requests** tab by default.
2. If the logged-in user has a manager role, also show:
   - **My Team Requests**
3. Display a primary button at the top-right:
   **“Raise a Request”**
4. On clicking this button, open a **Right-Side Drawer** (not a modal).

Right-side drawer behavior:
- Width: 800–900px
- Slide-in animation
- Close via “X” or clicking outside
- First element inside drawer: **Helpdesk Category Dropdown**  
  Options:
    - IT Helpdesk
    - Facilities Helpdesk
    - Finance Helpdesk

Required components:
- HelpdeskHome.tsx
- MyRequests.tsx
- MyTeamRequests.tsx
- RaiseRequestDrawer.tsx (new)

=====================================================
### 2. RAISE REQUEST — CATEGORY → TYPE → SUBCATEGORY FLOW
=====================================================

The drawer should dynamically load UI based on selected Helpdesk category.

-----------------------------------------------------
### A. IT HELP DESK — Updated Types and Approval Rules
-----------------------------------------------------

When user selects **IT Helpdesk**, show:

#### Step 1 → Dropdown: "Select IT Type"
Types:
- Hardware Issue (Approval Required)
- Software Issue (Approval Required)
- Network / Connectivity
- Account / Login Problem
- Access Request (Approval Required)
- New Equipment Request (Approval Required)
- Other (show a text input box)

#### Step 2 → Subcategory Handling
- For "Other", show an input field.
- For all others, predefined subcategories can be skipped; they directly become the subcategory.
- Tag approval-required types so submission will follow approval flow.

-----------------------------------------------------
### B. FACILITIES HELP DESK — Updated Types
-----------------------------------------------------

When user selects **Facilities Helpdesk**, show:

#### Step 1 → Dropdown: "Select Facilities Type"
Types:
- Maintenance Request
- Repair Request
- Cleaning / Janitorial
- Electrical Issue
- HVAC / Temperature Issue
- Plumbing
- Furniture / Fixture Request
- Safety / Hazard Concern
- AC

No approval logic unless mapped in subCategoryMapping.json.

-----------------------------------------------------
### C. FINANCE HELP DESK — Updated Types
-----------------------------------------------------

When user selects **Finance Helpdesk**, show:

#### Step 1 → Dropdown: "Select Finance Type"
Types:
- Payroll Question
- Expense Reimbursement Issue
- Invoice / Payment Issue
- Purchase Order Request
- Vendor Setup or Update
- Budget or Account Inquiry

These become subcategories directly.

=====================================================
### 3. TICKET CREATION LOGIC (Updated)
=====================================================

Upon submission:

1. Load values from **subCategoryMapping.json**:
   - requiresApproval: true/false
   - processingQueue: IT / Facilities / Finance
   - specialistQueue: based on type (e.g., Hardware Queue, Electrical Queue, Payroll Queue)

2. If requiresApproval = true:
   - Start approval workflow:
        Level-1 → Level-2 → Level-3
   - status = “Pending Level-1 Approval”

3. If requiresApproval = false:
   - Skip approvals
   - Set:
        approvalBypassed = true
        status = “Routed”
   - Directly route to department processing queue.

4. Add a history log entry with timestamp.

=====================================================
### 4. VIEW TICKET PAGE — STEPPER PROGRESS FLOW
=====================================================

Modify ViewTicket.tsx with a stepper showing the ticket lifecycle:

1. Submitted
2. Level-1 Approval (only shown if approval required)
3. Level-2 Approval
4. Level-3 Approval
5. Routed to Department
6. Assigned
7. Work In Progress
8. Completed
9. User Confirmation
10. Closed or Auto-Close

Rules:
- If approvalBypassed = true → Stepper hides Approval steps.
- Active step determined by ticket.status.
- Each step shows timestamp from ticket.history.

=====================================================
### 5. COMPONENTS TO UPDATE / GENERATE
=====================================================

Frontend Components:
- HelpdeskHome.tsx
- MyRequests.tsx
- MyTeamRequests.tsx
- RaiseRequestDrawer.tsx
- ITTypeSelector.tsx
- FacilitiesTypeSelector.tsx
- FinanceTypeSelector.tsx
- DynamicFormEngine.tsx
- ViewTicket.tsx (Stepper)
- TicketHistory.tsx

Data Files:
- Update **subCategoryMapping.json** to reflect:
    - IT Types (with approval flags)
    - Facilities Types
    - Finance Types
    - processingQueue
    - specialistQueue

Interfaces:
- Update Ticket interface:
    - highLevelCategory
    - type
    - subCategory
    - requiresApproval
    - approvalBypassed
    - processingRoute
    - specialistQueue
    - SLA fields
    - history[]

=====================================================
### 6. TECHNICAL GUIDELINES
=====================================================
- Use React + TypeScript + Tailwind or shadcn/ui
- Right drawer must use shadcn/ui Drawer component or custom slide panel
- All form fields should be dynamic (no hardcoded logic)
- Provide clean state management for dropdown transitions
- Code must allow future addition of new types/categories

=====================================================
### OUTPUT EXPECTATION
=====================================================
Copilot must generate:

- All updated components
- Type definitions
- Dynamic request flow
- Approval logic
- Stepper logic
- JSON mappings
- Clean, scalable architecture matching the updated flow diagram
