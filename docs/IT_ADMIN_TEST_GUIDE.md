# IT Admin System - Quick Test Guide

## Test User Credentials

### IT Admin
- **Email**: `priya.sharma@acuvate.com`
- **Password**: `Priya@123`
- **Role**: IT_ADMIN

### IT Employees (Specialists)
1. **Hardware Specialist**
   - Email: `david.smith@company.com`
   - Password: `David@123`

2. **Software Specialist**
   - Email: `emily.chen@company.com`
   - Password: `Emily@123`

3. **Network Specialist**
   - Email: `michael.johnson@company.com`
   - Password: `Michael@123`

4. **Identity Specialist**
   - Email: `sarah.williams@company.com`
   - Password: `Sarah@123`

### Regular Employee
- **Email**: `sainikhil.bomma@acuvate.com`
- **Password**: `Nikhil@123`

## Test Scenarios

### Scenario 1: IT Admin Assignment Workflow ✅

**Steps:**
1. Login as IT Admin (priya.sharma@acuvate.com)
2. Navigate to **IT Admin Dashboard** (/itadmin/dashboard)
3. Verify KPI cards show correct counts
4. Find an unassigned ticket in the queue
5. Click **"Assign"** button
6. Verify assignment drawer opens with ticket details
7. Select a specialist from dropdown (auto-filtered by expertise)
8. Check workload badge (🟢 Available / 🟡 Medium / 🔴 High)
9. Add assignment notes: "Test assignment"
10. Click **"Assign Ticket"**
11. Verify success toast appears
12. Check ticket moved to "Assigned Tickets" section
13. Verify assignee name and notes displayed

**Expected Results:**
- ✅ Dashboard loads without errors
- ✅ KPIs show accurate counts
- ✅ Drawer opens smoothly
- ✅ Specialist dropdown filters by ticket expertise
- ✅ Workload badges display correctly
- ✅ Assignment saves successfully
- ✅ Ticket appears in assigned section

### Scenario 2: RBAC Enforcement ✅

**Steps:**
1. Login as Regular Employee (sainikhil.bomma@acuvate.com)
2. Try to access `/itadmin/dashboard` directly
3. Verify redirect to main dashboard
4. Check for error toast: "Access denied. IT Admin role required."
5. Login as IT Admin
6. Verify access granted

**Expected Results:**
- ✅ Non-IT_ADMIN users redirected
- ✅ Error toast displayed
- ✅ IT_ADMIN users access granted

### Scenario 3: Read-Only Ticket View ✅

**Steps:**
1. Login as IT Admin (priya.sharma@acuvate.com)
2. Navigate to **IT Tickets** (/itadmin/tickets)
3. Verify blue notice alert appears: "Use IT Admin Dashboard to assign tickets"
4. Verify page title shows "IT Tickets - View Only"
5. Attempt to find assignment buttons (should be hidden)
6. Verify can still send messages

**Expected Results:**
- ✅ Notice alert visible
- ✅ View-only mode enforced
- ✅ No assignment buttons
- ✅ Message functionality works

### Scenario 4: IT Employee Workflow ✅

**Steps:**
1. Login as IT Admin
2. Assign a ticket to David Smith (hardware ticket)
3. Logout and login as David (david.smith@company.com)
4. Navigate to **IT Tickets** (/itadmin/tickets)
5. Verify assigned ticket appears in "My Assigned" section
6. Click on ticket to view details
7. Update progress to "In Progress"
8. Add resolution notes
9. Click **"Complete Work"**
10. Verify ticket status updates

**Expected Results:**
- ✅ Assigned ticket visible
- ✅ Progress updates work
- ✅ Work completion succeeds
- ✅ Status reflects changes

### Scenario 5: Workload Distribution ✅

**Steps:**
1. Login as IT Admin
2. Create or find 3 hardware tickets
3. Assign all to David Smith
4. Open assignment drawer for new hardware ticket
5. Verify David's workload shows "3/5" (60%)
6. Verify badge shows "🟡 Medium Load"
7. Add 2 more assignments to David
8. Verify workload shows "5/5" (100%)
9. Verify badge shows "🔴 High Load"

**Expected Results:**
- ✅ Workload count updates correctly
- ✅ Utilization percentage accurate
- ✅ Badge color changes based on load
- ✅ Specialist sorting by utilization

### Scenario 6: Specialization Filtering ✅

**Steps:**
1. Login as IT Admin
2. Find a **Hardware** ticket
3. Open assignment drawer
4. Verify dropdown only shows hardware specialists (David)
5. Find a **Software** ticket
6. Open assignment drawer
7. Verify dropdown only shows software specialists (Emily)
8. Find a **Network** ticket
9. Verify dropdown only shows network specialists (Michael)

**Expected Results:**
- ✅ Filtering by specialization works
- ✅ Only relevant specialists shown
- ✅ Specialization matching accurate

## Quick Validation Checklist

### Login & Access
- [ ] IT_ADMIN can login and access dashboard
- [ ] IT_EMPLOYEE can login and access tickets
- [ ] Regular EMPLOYEE blocked from admin routes
- [ ] RBAC guard redirects correctly

### Dashboard Features
- [ ] KPI cards display correct counts
- [ ] Unassigned queue table loads
- [ ] Search filters tickets
- [ ] Priority sorting works
- [ ] Assigned tickets section shows data

### Assignment Workflow
- [ ] Assign button opens drawer
- [ ] Ticket details display correctly
- [ ] Specialist dropdown filters by expertise
- [ ] Workload badges show (Available/Medium/High)
- [ ] Utilization sorting works
- [ ] Assignment notes save
- [ ] Assignment completes successfully

### Data Integrity
- [ ] Assignment metadata saves (assignedById, assignedByName, assignedByRole)
- [ ] Specialist activeTicketCount increments
- [ ] Ticket status updates to "Assigned"
- [ ] Assignment timestamp accurate
- [ ] Notes persist after refresh

### UI/UX
- [ ] No console errors
- [ ] Toast notifications appear
- [ ] Drawer opens/closes smoothly
- [ ] Tables responsive
- [ ] Badges styled correctly
- [ ] Read-only notice visible for IT_ADMIN in tickets page

## Common Issues & Solutions

### Issue: "No specialists available"
**Cause**: Ticket subCategory doesn't match any specialist specializations
**Solution**: Check ticket.subCategory matches specialist.specializations (case-sensitive)

### Issue: Workload not updating
**Cause**: activeTicketCount not incremented in service
**Solution**: Verify assignToITEmployee service updates itSpecialists.json

### Issue: Access denied for IT_ADMIN
**Cause**: User role not set correctly
**Solution**: Check users.json - role must be exactly "IT_ADMIN"

### Issue: Assignment buttons visible for IT_ADMIN in ticket management
**Cause**: Conditional logic not working
**Solution**: Verify isITAdmin variable checks user.role === 'IT_ADMIN'

## Browser Console Checks

### Expected Console Logs (No Errors)
```
✅ Loading tickets...
✅ IT specialists loaded: 4 active
✅ Assignment successful: Ticket T001 → David Smith
✅ Workload updated: David Smith (3/5)
```

### Expected localStorage Structure
```javascript
// Tickets
{
  "id": "T001",
  "assignment": {
    "assignedToId": "IT001",
    "assignedToName": "David Smith",
    "assignedById": "5",
    "assignedByName": "Priya Sharma",
    "assignedByRole": "IT_ADMIN",
    "assignedAt": "2024-01-15T10:30:00Z",
    "assignmentNotes": "Urgent - CEO laptop"
  }
}

// IT Specialists
{
  "id": "IT001",
  "name": "David Smith",
  "activeTicketCount": 3,
  "maxCapacity": 5
}
```

## Performance Validation

### Load Times (Target)
- Dashboard load: < 500ms
- Specialist filtering: < 100ms
- Assignment save: < 200ms
- Ticket list render: < 300ms

### Memory Usage
- Check browser DevTools → Memory tab
- No memory leaks after multiple assignments
- Component cleanup on unmount

## Final Verification

Run through complete flow:
1. ✅ Login as IT_ADMIN
2. ✅ View dashboard with KPIs
3. ✅ Assign ticket to specialist
4. ✅ Verify workload updates
5. ✅ Check assigned tickets section
6. ✅ Navigate to tickets page (view-only)
7. ✅ Logout and login as IT_EMPLOYEE
8. ✅ View assigned ticket
9. ✅ Complete work
10. ✅ Verify status updates

**All steps pass = System working correctly! ✅**
