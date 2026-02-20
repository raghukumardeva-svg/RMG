# Helpdesk Ticket Submission - Debug Guide

## Issue Summary
User reports that helpdesk ticket submission is failing with "failed to submit request" error.

## Investigation Completed

### ✅ Backend Status (WORKING)
- **API Endpoint**: `/api/helpdesk/workflow` is **functional and tested**
- **MongoDB**: Connected and working
- **Server**: Running on port 5000
- **Test Result**: Successfully created test ticket (TKT0001) via curl

### ✅ Frontend Changes Applied
- Updated `helpdeskService.createWithWorkflow()` to accept email and department
- Updated `Helpdesk.tsx` to pass user email and department
- Updated `GlobalHelpdeskContext.tsx` to pass user email and department
- Updated `helpdeskStore.ts` to handle new parameters

### ✅ Backend Validation
- Added email validation to `/api/helpdesk/workflow` endpoint
- Returns clear error messages for missing required fields

## Diagnostic Logging Added

The following console logs have been added to help identify the issue:

### 1. Frontend Service Logging
**File**: `src/services/helpdeskService.ts`
```javascript
console.log('[HelpdeskService] Creating ticket with payload:', payload);
console.log('[HelpdeskService] User data:', { requesterId, requesterName, requesterEmail, department });
console.log('[HelpdeskService] Ticket created successfully:', response.data);
```

### 2. Helpdesk Page Logging
**File**: `src/pages/employee/Helpdesk.tsx`
```javascript
console.log('[Helpdesk] User object:', user);
console.log('[Helpdesk] User validation - id:', user?.id, 'name:', user?.name, 'email:', user?.email);
console.log('[Helpdesk] Submitting ticket with user data:', { id, name, email, department });
```

### 3. Global Context Logging
**File**: `src/contexts/GlobalHelpdeskContext.tsx`
```javascript
console.log('[GlobalHelpdeskContext] User object:', user);
console.log('[GlobalHelpdeskContext] User validation - id:', user?.id, 'name:', user?.name, 'email:', user?.email);
console.log('[GlobalHelpdeskContext] Submitting ticket with user data:', { id, name, email, department });
```

## Testing Steps

### Step 1: Start the Application

1. **Start Backend** (if not already running):
   ```bash
   cd server
   npm run dev
   ```
   Should see: "MongoDB Connected" and "Server running on port 5000"

2. **Start Frontend**:
   ```bash
   npm run dev
   ```
   Should start on http://localhost:5173 (or similar)

### Step 2: Login and Check User Data

1. **Login** with any user from `src/data/users.json`:
   - Email: `sainikhil.bomma@acuvate.com`
   - Password: `Nikhil@123`

2. **Open Browser Console** (F12 → Console tab)

3. **Check User Object** - In console, type:
   ```javascript
   JSON.parse(localStorage.getItem('auth-storage'))
   ```

   **Expected Output**: Should show user object with email field
   ```json
   {
     "state": {
       "user": {
         "id": "...",
         "name": "Sai Nikhil Bomma",
         "email": "sainikhil.bomma@acuvate.com",  // ← Should be present
         "role": "EMPLOYEE",
         "department": "Engineering",
         "employeeId": "EMP001"
       }
     }
   }
   ```

### Step 3: Test Helpdesk Submission

1. **Navigate to Helpdesk** page

2. **Click "Raise New Request"** button

3. **Fill in the form**:
   - Category: IT
   - Sub-category: Hardware
   - Subject: Test Ticket
   - Description: Testing helpdesk submission
   - Urgency: Medium

4. **Watch Console Logs** - You should see:
   ```
   [Helpdesk] User object: { id: "...", name: "...", email: "...", ... }
   [Helpdesk] User validation - id: ... name: ... email: ...
   [Helpdesk] Submitting ticket with user data: { ... }
   [HelpdeskService] Creating ticket with payload: { ... }
   [HelpdeskService] User data: { requesterId, requesterName, requesterEmail, department }
   [HelpdeskService] Ticket created successfully: { ... }
   ```

5. **Click Submit**

## Possible Issues and Solutions

### Issue 1: User Email is Undefined

**Symptom**: Console shows `email: undefined` in user object

**Cause**: User was logged in before the auth endpoint was updated

**Solution**:
```bash
# Clear local storage and login again
localStorage.clear()
# Then login again
```

### Issue 2: "User information is incomplete" Toast

**Symptom**: Toast appears saying "User information is incomplete"

**Console Log**:
```
[Helpdesk] Missing user data. User: { id: "...", name: "...", email: undefined }
```

**Solution**: Email is missing from user object. Clear storage and re-login:
```javascript
localStorage.clear()
location.reload()
```

### Issue 3: Network Error

**Symptom**: Error in console: "Network Error" or "Failed to fetch"

**Possible Causes**:
1. Backend server is not running
2. Backend is running on different port
3. CORS issue

**Solution**:
```bash
# Check backend is running
cd server
npm run dev

# Check .env file
cat .env
# Should show: VITE_API_URL=http://localhost:5000/api

# Test backend directly
curl http://localhost:5000/api/helpdesk/workflow -X POST -H "Content-Type: application/json" -d '{"requesterId":"1","requesterName":"Test","requesterEmail":"test@example.com","department":"IT","highLevelCategory":"IT","subCategory":"Hardware","subject":"Test","description":"Test","urgency":"medium"}'
```

### Issue 4: "User email is required" Error

**Symptom**: API returns 400 error with message "User email is required"

**Console Log**: Shows requesterEmail is empty or undefined

**Solution**: This means frontend is not passing email. Check:
1. User object has email field
2. Frontend service is called with correct parameters
3. Console logs show the correct data being passed

## Files Modified

1. **server/src/routes/helpdesk.ts**
   - Added email validation
   - Enhanced error messages

2. **src/services/helpdeskService.ts**
   - Added email and department parameters
   - Added console logging

3. **src/pages/employee/Helpdesk.tsx**
   - Pass email and department to service
   - Added user validation
   - Added console logging

4. **src/contexts/GlobalHelpdeskContext.tsx**
   - Pass email and department to service
   - Added user validation
   - Added console logging

5. **src/store/helpdeskStore.ts**
   - Updated function signature to include email and department

## Verification Checklist

- [ ] Backend server is running on port 5000
- [ ] MongoDB is connected
- [ ] Frontend is running
- [ ] User can login successfully
- [ ] User object in localStorage contains email field
- [ ] Console logs show user email when submitting ticket
- [ ] No network errors in browser console
- [ ] API endpoint test with curl succeeds

## Backend API Test

To verify backend is working independently:

```bash
curl -X POST http://localhost:5000/api/helpdesk/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "requesterId": "1",
    "requesterName": "Test User",
    "requesterEmail": "test@example.com",
    "department": "Engineering",
    "highLevelCategory": "IT",
    "subCategory": "Hardware",
    "subject": "Test Ticket",
    "description": "This is a test ticket",
    "urgency": "medium"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "ticketNumber": "TKT0001",
    "userId": "1",
    "userName": "Test User",
    "userEmail": "test@example.com",
    ...
  }
}
```

## Next Steps

1. **Restart Frontend**: Close and restart the frontend dev server to pick up changes
2. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R) or clear cache
3. **Re-login**: Clear localStorage and login again
4. **Test Submission**: Try creating a helpdesk ticket
5. **Check Console**: Look for the diagnostic logs above
6. **Report Findings**: Share the console output if issue persists

## Summary

The backend is **confirmed working**. The issue is most likely:
1. User email not being populated in frontend auth state (need to re-login)
2. Old cached version of frontend code (need to restart dev server)
3. Browser cache (need to hard refresh)

The diagnostic logs will help identify exactly where the issue is occurring.
