# Leave Workflow Fix - Employee to Manager Sync

## Problem
When employees applied for leave, their requests were **not appearing** in the Manager Leave Approval page.

## Root Cause
There was a **field name mismatch** between leave creation and manager filtering:

1. **Leave Creation** ([src/store/leaveStore.ts:107](src/store/leaveStore.ts#L107))
   - Only set `userId` field
   - Did NOT set `employeeId` field

2. **Manager Filtering** ([src/pages/manager/ManagerLeaveApprovals.tsx:93](src/pages/manager/ManagerLeaveApprovals.tsx#L93))
   - Filtered by `employeeId` field
   - Ignored `userId` field

This caused all employee leave requests to be invisible to managers.

## Solution Applied

### 1. Fixed Leave Creation ([src/store/leaveStore.ts:108](src/store/leaveStore.ts#L108))
```typescript
const leaveData = {
  userId,
  employeeId: userId, // ✅ ADDED: Set employeeId for manager filtering
  userName,
  userEmail,
  // ... rest of the fields
};
```

### 2. Made Manager Filtering Robust ([src/pages/manager/ManagerLeaveApprovals.tsx:94-97](src/pages/manager/ManagerLeaveApprovals.tsx#L94-L97))
```typescript
let filtered = leaves.filter(leave => {
  const empId = leave.employeeId || leave.userId; // ✅ Check BOTH fields
  return empId && reportingIds.has(empId);
});
```

### 3. Removed Debug Console Logs ([src/pages/manager/ManagerLeaveApprovals.tsx:161-165](src/pages/manager/ManagerLeaveApprovals.tsx#L161-L165))
- Cleaned up 7 console.log statements used for debugging

## Testing Steps

### As an Employee:
1. Go to Leave page
2. Click "Apply Leave"
3. Fill in leave details:
   - Select dates
   - Choose leave type
   - Provide justification
4. Submit the request
5. ✅ Verify status shows as "Pending"

### As a Manager:
1. Log in with manager credentials
2. Go to "Manager Leave Approvals" page
3. ✅ Verify you can see leave requests from your reporting employees
4. ✅ Verify you can filter by status (Pending/Approved/Rejected)
5. Test approval:
   - Click "Approve" on a leave request
   - ✅ Verify status changes to "Approved"
6. Test rejection:
   - Click "Reject" on a leave request
   - Provide rejection reason
   - ✅ Verify status changes to "Rejected"

### As an Employee (verification):
1. Go back to Leave page
2. ✅ Verify your leave request shows updated status (Approved/Rejected)
3. ✅ If rejected, verify you can see the rejection reason

## Files Modified

1. [src/store/leaveStore.ts](src/store/leaveStore.ts)
   - Added `employeeId: userId` to leave creation data

2. [src/pages/manager/ManagerLeaveApprovals.tsx](src/pages/manager/ManagerLeaveApprovals.tsx)
   - Updated filtering logic to check both `employeeId` and `userId`
   - Removed debug console.log statements

## Data Model

The `LeaveRequest` type supports both fields for backwards compatibility:

```typescript
export interface LeaveRequest {
  userId: string;      // Original field
  employeeId?: string; // New field for manager filtering
  userName: string;
  department: string;
  managerId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  // ... other fields
}
```

## Workflow Flow

```
Employee Applies Leave
        ↓
Leave Created with:
  - userId ✅
  - employeeId ✅ (same as userId)
  - managerId (employee's reporting manager)
        ↓
Manager Opens Approval Page
        ↓
Filters leaves where:
  - employeeId OR userId matches reporting employee IDs
        ↓
Manager Approves/Rejects
        ↓
Employee Sees Updated Status
```

## Notes

- **Backwards Compatible**: The fix checks BOTH `employeeId` and `userId` fields, so it works with old and new leave records
- **No Data Migration Needed**: Existing leave records will still work
- **Clean Code**: Removed unnecessary console.log statements
- **Consistent**: Both employee and manager modules now use the same field

## Additional Fix: Hide Cancelled Leaves from Manager View

### Problem
Cancelled leave requests (cancelled by employees) were still appearing in the Manager Leave Approvals page.

### Solution
Added filter to exclude cancelled leaves from manager's view ([src/pages/manager/ManagerLeaveApprovals.tsx:99-100](src/pages/manager/ManagerLeaveApprovals.tsx#L99-L100)):

```typescript
// Exclude cancelled leaves - they should not appear in manager's view
filtered = filtered.filter(l => l.status !== 'cancelled');
```

### Behavior
- **Pending** leaves → ✅ Show to manager (needs action)
- **Approved** leaves → ✅ Show to manager (historical record)
- **Rejected** leaves → ✅ Show to manager (historical record)
- **Cancelled** leaves → ❌ Hidden from manager (employee withdrew request)

## Status
✅ **FIXED** - Leave requests now correctly flow from Employee → Manager for approval
✅ **FIXED** - Cancelled leaves are hidden from manager view
