# Timesheet Revision Workflow - Complete Guide

## ✅ Current Implementation Summary

### 🔄 **Complete Workflow**

#### **Step 1: Employee Submits Timesheet**

1. Employee fills hours in Weekly Timesheet
2. Clicks "Submit Timesheet"
3. Status changes to `submitted`
4. `approvalStatus` set to `pending`
5. Notification sent to Project Manager

#### **Step 2: Manager Reviews**

Manager can take 3 actions:

**Option A: Approve All ✅**

- Clicks "Bulk Approve"
- All entries get `approvalStatus: 'approved'`
- Employee can no longer edit (fields locked)

**Option B: Approve Specific Days ✅**

- Selects individual days
- Clicks "Approve Selected"
- Only those days get `approvalStatus: 'approved'`

**Option C: Request Revision ⚠️**

- Selects days that need changes
- Enters comment explaining what needs to be fixed
- Comment is saved as `rejectedReason` in database
- Entries get `approvalStatus: 'revision_requested'`

#### **Step 3: Employee Sees Revision Request**

**Visual Indicators:**

- 🔶 **Amber-bordered input field** - Shows which entries need revision
- 🔴 **Red "!" Badge** - Animates to draw attention
- 📝 **Comment Display** - Shows below the input field
- 💬 **Tooltip** - Hover over "!" badge to see full comment

**Example:**

```
┌────────────────────────┐
│  08:00  ← Input field  │  🔴 !  ← Red badge
└────────────────────────┘
📝 "Please correct: Should be 6 hours, not 8"  ← Comment visible
```

#### **Step 4: Employee Makes Changes & Resubmits**

**Simple Flow (No "Recall" Needed!):**

1. ✅ Employee can directly edit the amber-highlighted fields
2. ✅ Makes corrections based on manager's comment
3. ✅ Clicks "Submit Timesheet" again
4. ✅ Backend automatically:
   - Saves new hours
   - Resets `approvalStatus` to `'pending'`
   - Clears `rejectedReason`
   - Updates `submittedAt` timestamp
5. ✅ Frontend refreshes automatically (NEW FIX!)
6. ✅ Manager sees updated timesheet for re-approval

---

## 🆕 **What Was Fixed Today**

### **Issue #1: Old Hours Showing After Resubmit**

**Problem:** Employee changed hours and clicked Submit, but old hours were still visible.

**Root Cause:** Frontend wasn't refreshing data from server after submission.

**Solution Applied:**

```typescript
// Added in handleSubmitWeek() after successful submission:
await loadTimesheet(); // 🔄 Refresh from server
```

**Location:** [WeeklyTimesheet.tsx](../src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx) lines ~1143-1145

---

### **Issue #2: Comments Not Visible to Employee**

**Status:** ✅ **Already Working!** Comments ARE saved and displayed.

**How It Works:**

1. Manager enters comment when requesting revision
2. Backend saves to `rejectedReason` field in `timesheetentries` collection
3. Frontend displays in 3 places:
   - Small text below input: `📝 "comment"`
   - Tooltip on "!" badge
   - Amber border on input field

**No Changes Needed** - This was already implemented!

---

## 🔘 **"Recall for Edit" Button - When to Use**

### **Purpose:**

Allows employee to pull back a submitted timesheet BEFORE manager reviews it.

### **When It's Useful:**

- Employee realizes a mistake right after submitting
- Employee wants to add more entries before manager sees it
- Employee needs to change approved entries (use with caution)

### **How It Works:**

```
Before Recall:  Status = "submitted"     → Manager can see it
After Recall:   Status = "draft"         → Manager cannot see it
                Fields become editable   → Employee can modify
                Click Submit again       → Returns to "submitted"
```

### **Key Difference from Revision Flow:**

| Scenario       | "Recall for Edit"  | Revision by Manager      |
| -------------- | ------------------ | ------------------------ |
| Who initiates? | Employee           | Manager                  |
| When?          | Right after submit | After manager reviews    |
| Comments?      | No comments        | Manager adds comment     |
| Required?      | Optional           | Required for corrections |

---

## 📊 **Database Fields Used**

### **TimesheetEntry Schema:**

```typescript
{
  employeeId: string,           // Who submitted
  projectId: string,            // Which project
  udaId: string,                // Which activity
  date: Date,                   // Specific day
  hours: string,                // "08:00"
  status: string,               // "draft" | "submitted" | "approved"
  approvalStatus: string,       // "pending" | "approved" | "revision_requested"
  rejectedReason: string,       // 📝 Manager's comment! (saved here)
  approvedBy: string,           // Manager employeeId
  approvedAt: Date,             // Timestamp
  submittedAt: Date             // When employee submitted
}
```

---

## 🔍 **Backend Routes Involved**

### **1. Submit Timesheet**

```
POST /api/timesheet/submit
```

- Converts weekly rows to date-based entries
- Uses `$set` to update existing entries (upsert)
- Resets `approvalStatus: 'pending'`
- Clears previous revision comments

### **2. Request Revision**

```
PUT /api/timesheet/approvals/revision-request
```

- Sets `approvalStatus: 'revision_requested'`
- Saves manager comment to `rejectedReason`
- Keeps `status: 'submitted'` so employee can resubmit

### **3. Approve Entries**

```
PUT /api/timesheet/approvals/approve-week
PUT /api/timesheet/approvals/bulk-approve-days
```

- Sets `approvalStatus: 'approved'`
- Records `approvedBy` and `approvedAt`

---

## ✅ **Testing the Flow**

### **Test Case 1: Revision & Resubmit**

**Steps:**

1. Login as Employee (e.g., ACUA0002)
2. Submit timesheet with 8 hours on Monday
3. Login as Manager
4. Go to Approve tab
5. Select Monday, click "Revert Selected"
6. Enter comment: "Should be 6 hours, not 8"
7. Logout & Login as Employee again
8. **Verify:**
   - ✅ Monday field has amber border
   - ✅ Red "!" badge visible
   - ✅ Comment shows: "Should be 6 hours, not 8"
9. Change hours to 6:00
10. Click "Submit Timesheet"
11. **Verify:**
    - ✅ Amber border disappears
    - ✅ Comment disappears
    - ✅ Field shows 6:00 (not 8:00!)
    - ✅ No revision indicator

### **Test Case 2: Recall for Edit**

**Steps:**

1. Login as Employee
2. Submit timesheet
3. Immediately click "Recall for Edit"
4. **Verify:**
   - ✅ Button appears only after submit
   - ✅ Fields become editable
   - ✅ Can make changes
5. Click "Submit Timesheet" again
6. **Verify:**
   - ✅ Manager can now see it

---

## 🔐 **Security Considerations**

1. **Manager Authorization:**
   - Only project managers can approve/revert entries for their projects
   - Checked via `projectManagerEmployeeId` field

2. **Edit Restrictions:**
   - Approved entries: Read-only (cannot edit)
   - Pending/Revision: Editable
   - Draft: Editable

3. **Audit Trail:**
   - `approvedBy`: Who approved/reverted
   - `approvedAt`: When action occurred
   - `submittedAt`: When employee submitted

---

## 📝 **Code Changes Summary**

### **File Modified:**

- `src/pages/rmg/uda-configuration/WeeklyTimesheet.tsx`

### **Changes Made:**

```typescript
// Added automatic refresh after submit
setTimesheetStatus("submitted");
setHasSubmittedThisSession(true);

// 🔄 NEW: Refresh timesheet from server
await loadTimesheet();

toast.success(`Timesheet submitted successfully`);
```

### **Impact:**

- ✅ Employee now sees updated hours immediately
- ✅ Revision indicators clear automatically
- ✅ No need to manually refresh page

---

## 🎯 **Simplified Flow Recommendations**

### **Current Flow is Actually Simple:**

```
Employee Submits
    ↓
Manager Reviews
    ↓
Manager Requests Revision + Comment
    ↓
Employee Sees Comment Directly in UI
    ↓
Employee Edits & Clicks Submit Again (No "Recall" needed!)
    ↓
Auto-refresh shows updated data
    ↓
Manager Re-approves
```

### **"Recall for Edit" is OPTIONAL:**

- Only use if employee wants to edit BEFORE manager reviews
- Not part of the revision workflow
- Can be kept for edge cases

---

## 🐛 **Debugging Checklist**

If revision comments aren't showing:

1. **Check Database:**

   ```javascript
   db.timesheetentries.findOne({
     employeeId: "EMP001",
     approvalStatus: "revision_requested",
   });
   ```

   Should show `rejectedReason` field populated

2. **Check Console Logs:**

   ```
   🔵 [Employee View] Loaded timesheet with entryMeta
   Cell [UDA Name] day 0: { isRevisionRequested: true, revisionReason: "..." }
   ```

3. **Check UI:**
   - Inspect element on input field
   - Should have classes: `bg-amber-100`, `border-amber-500`
   - "!" badge should be present

4. **Check Submission:**
   ```
   ✅ [Submit Success] Reloading timesheet from server...
   ```
   Should appear after successful submit

---

## 📞 **Support**

If issues persist:

1. Check browser console for errors
2. Verify MongoDB connection
3. Check backend logs: `[Revision Request]`, `[POST Submit]`
4. Ensure frontend dev server is running
5. Hard refresh browser: `Ctrl+Shift+R`

---

**Last Updated:** February 12, 2026  
**Status:** ✅ Fully Functional
