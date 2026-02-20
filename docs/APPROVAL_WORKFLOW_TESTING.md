# Multi-Level Approval System - Testing Guide

## 🔐 Approver Credentials

Successfully seeded 3 approver users in MongoDB:

### L1 Approver (Team Lead)
- **Email:** l1.approver@company.com
- **Password:** L1Approver@123
- **Employee ID:** L1001
- **Designation:** Team Lead
- **Role:** L1_APPROVER

### L2 Approver (Manager)
- **Email:** l2.approver@company.com
- **Password:** L2Approver@123
- **Employee ID:** L2001
- **Designation:** Manager
- **Role:** L2_APPROVER

### L3 Approver (Director)
- **Email:** l3.approver@company.com
- **Password:** L3Approver@123
- **Employee ID:** L3001
- **Designation:** Director
- **Role:** L3_APPROVER

## 🎯 Approval Workflow

### Sequential Flow
```
Ticket Creation (requiresApproval=true)
    ↓
Status: "Pending Level-1 Approval"
approvalLevel: "L1"
    ↓
L1 Approver Reviews (l1.approver@company.com)
    ├─ Approve → L2
    │   Status: "Pending Level-2 Approval"
    │   approvalLevel: "L2"
    └─ Reject → REJECTED
        Status: "Rejected"
        Workflow STOPS
    ↓
L2 Approver Reviews (l2.approver@company.com)
    ├─ Approve → L3
    │   Status: "Pending Level-3 Approval"
    │   approvalLevel: "L3"
    └─ Reject → REJECTED
        Status: "Rejected"
        Workflow STOPS
    ↓
L3 Approver Reviews (l3.approver@company.com)
    ├─ Approve → DEPARTMENT ROUTING
    │   Status: "In Queue"
    │   approvalLevel: "NONE"
    │   Routed to IT Department
    └─ Reject → REJECTED
        Status: "Rejected"
        Workflow STOPS
```

## 🔄 Testing Steps

### 1. Create Ticket Requiring Approval
```json
POST /api/helpdesk/workflow
{
  "highLevelCategory": "IT Support",
  "subCategory": "Software Installation",
  "subject": "Install Adobe Creative Suite",
  "description": "Need Adobe CC for marketing projects",
  "urgency": "high",
  "requiresApproval": true,
  "requesterId": "EMP001",
  "requesterName": "John Doe",
  "requesterEmail": "john.doe@company.com",
  "department": "Marketing"
}
```

**Result:**
- Status: "Pending Level-1 Approval"
- approvalLevel: "L1"
- approvalStatus: "Pending"

### 2. L1 Approver Login
1. Login as `l1.approver@company.com` / `L1Approver@123`
2. Navigate to `/approver` dashboard
3. See pending ticket in list
4. Click **Approve** or **Reject**
5. Add optional comments
6. Submit

**L1 Approve Result:**
```json
{
  "status": "Pending Level-2 Approval",
  "approvalLevel": "L2",
  "approverHistory": [
    {
      "level": "L1",
      "approverId": "L1001",
      "status": "Approved",
      "comments": "Budget approved",
      "timestamp": "2025-01-07T..."
    }
  ]
}
```

### 3. L2 Approver Login
1. Login as `l2.approver@company.com` / `L2Approver@123`
2. Navigate to `/approver` dashboard
3. See ticket now in L2 pending list
4. Click **Approve** or **Reject**
5. Add optional comments
6. Submit

**L2 Approve Result:**
```json
{
  "status": "Pending Level-3 Approval",
  "approvalLevel": "L3",
  "approverHistory": [
    {...L1 entry...},
    {
      "level": "L2",
      "approverId": "L2001",
      "status": "Approved",
      "comments": "Approved by manager",
      "timestamp": "2025-01-07T..."
    }
  ]
}
```

### 4. L3 Approver Login
1. Login as `l3.approver@company.com` / `L3Approver@123`
2. Navigate to `/approver` dashboard
3. See ticket now in L3 pending list
4. Click **Approve** or **Reject**
5. Add optional comments
6. Submit

**L3 Approve Result:**
```json
{
  "status": "In Queue",
  "approvalLevel": "NONE",
  "approvalStatus": "Approved",
  "department": "IT",
  "approverHistory": [
    {...L1 entry...},
    {...L2 entry...},
    {
      "level": "L3",
      "approverId": "L3001",
      "status": "Approved",
      "comments": "Final approval granted",
      "timestamp": "2025-01-07T..."
    }
  ]
}
```

### 5. IT Admin Assignment
1. Login as IT Admin
2. Navigate to `/itadmin/tickets`
3. See ticket with status "In Queue"
4. Assign to IT Specialist based on specialization
5. Ticket status: "Assigned"

## 🔐 RBAC Enforcement

### Authorization Checks
- **L1 Approver** can ONLY approve tickets with `approvalLevel === "L1"`
- **L2 Approver** can ONLY approve tickets with `approvalLevel === "L2"`
- **L3 Approver** can ONLY approve tickets with `approvalLevel === "L3"`

### Middleware Protection
```typescript
// server/src/middleware/auth.ts
export const checkApproverRole = (requiredRole: 'L1_APPROVER' | 'L2_APPROVER' | 'L3_APPROVER') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || user.role !== requiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have the required approver role' 
      });
    }
    next();
  };
};
```

### Route Protection
```typescript
// L1 Approval - Only L1_APPROVER can access
router.post('/l1/:ticketId', 
  authenticate, 
  checkApproverRole('L1_APPROVER'), 
  approveL1
);

// L2 Approval - Only L2_APPROVER can access
router.post('/l2/:ticketId', 
  authenticate, 
  checkApproverRole('L2_APPROVER'), 
  approveL2
);

// L3 Approval - Only L3_APPROVER can access
router.post('/l3/:ticketId', 
  authenticate, 
  checkApproverRole('L3_APPROVER'), 
  approveL3
);
```

## 📊 API Endpoints

### Approval Actions
```bash
# L1 Approve
POST /api/approvals/l1/:ticketId
Body: { approverId, status: "Approved"|"Rejected", comments? }

# L2 Approve
POST /api/approvals/l2/:ticketId
Body: { approverId, status: "Approved"|"Rejected", comments? }

# L3 Approve
POST /api/approvals/l3/:ticketId
Body: { approverId, status: "Approved"|"Rejected", comments? }
```

### Query Endpoints
```bash
# Get pending approvals for approver
GET /api/approvals/pending/:approverId

# Get approval history for ticket
GET /api/approvals/history/:ticketId
```

## 🎨 Frontend Components

### ApproverDashboard
**Path:** `/approver`  
**Component:** `src/components/helpdesk/ApproverDashboard.tsx`

**Features:**
- Shows pending tickets for logged-in approver
- Displays ticket details (subject, category, urgency, requester)
- Approve/Reject buttons with comment textarea
- Real-time update after approval action
- Badge showing pending count
- Access control (only approver roles)

### ApprovalHistory
**Path:** (Embedded in ticket view)  
**Component:** `src/components/helpdesk/ApprovalHistory.tsx`

**Features:**
- Timeline of all approval actions
- Shows level, approver name, status, comments, timestamp
- Color-coded badges (green for approved, red for rejected)
- Empty state for tickets without approvals

## 🧪 Testing Checklist

### ✅ Backend Testing
- [ ] L1 approver can approve/reject L1 tickets
- [ ] L1 approver CANNOT approve L2/L3 tickets (403 Forbidden)
- [ ] L2 approver can approve/reject L2 tickets
- [ ] L2 approver CANNOT approve L1/L3 tickets (403 Forbidden)
- [ ] L3 approver can approve/reject L3 tickets
- [ ] L3 approver CANNOT approve L1/L2 tickets (403 Forbidden)
- [ ] Duplicate approval prevention works
- [ ] L3 approval routes ticket to department (status = "In Queue")
- [ ] Rejection at any level stops workflow (status = "Rejected")
- [ ] Approval history is correctly stored and retrievable

### ✅ Frontend Testing
- [ ] Approver dashboard shows only pending tickets for logged-in approver
- [ ] Approve button updates ticket and removes from pending list
- [ ] Reject button updates ticket and removes from pending list
- [ ] Comments are optional but stored when provided
- [ ] Badge count matches actual pending tickets
- [ ] Navigation shows "Approvals" menu item only for approver roles
- [ ] Access denied message for non-approvers
- [ ] Approval history displays correctly in ticket view

### ✅ Workflow Testing
- [ ] Ticket with requiresApproval=true starts at L1
- [ ] Ticket with requiresApproval=false goes directly to "In Queue"
- [ ] L1 approval moves to L2
- [ ] L2 approval moves to L3
- [ ] L3 approval routes to department
- [ ] Rejection at any level stops workflow
- [ ] History shows complete approval trail
- [ ] IT Admin can see approved tickets in queue

## 🚀 Next Steps

1. **Frontend Enhancements:**
   - Add approval checkbox to ticket creation form
   - Integrate ApprovalHistory into ticket view modal
   - Add notification system for approvers
   - Create approver performance analytics

2. **Backend Enhancements:**
   - Email notifications to approvers
   - SLA timers for approval actions
   - Auto-escalation if approval not done in X hours
   - Approval delegation feature

3. **Testing:**
   - Create automated test suite for approval workflow
   - Load testing with multiple concurrent approvals
   - Edge case testing (network failures, timeouts)

## 📝 Notes

- All approver users are active (`isActive: true`)
- Passwords are bcrypt hashed in MongoDB
- JWT tokens include user role for RBAC
- Approval history is immutable (append-only)
- Duplicate approvals are prevented at API level
- Frontend uses React Query for real-time updates (if implemented)
