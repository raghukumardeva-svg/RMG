# Checking L1 User Configuration

## After Backend Starts, Verify L1 User Exists

### Method 1: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Select database: `rmg-portal`
4. Go to collection: `employees`
5. Find your L1 user - look for:
   ```json
   {
     "role": "L1_APPROVER",
     "email": "your-l1-email@example.com",
     "name": "L1 Approver Name"
   }
   ```

### Method 2: Using MongoDB Shell

```bash
mongosh

use rmg-portal

# Find L1 approver users
db.employees.find({ role: "L1_APPROVER" })
```

### Method 3: Create L1 User If Missing

If no L1 user exists, create one:

**In the server terminal:**
```bash
# Navigate to server directory
cd c:\Users\sainikhil.bomma.ACUVATE\RMG-Portal\server

# Run the seed script to create approver users
npm run seed:approvers
```

This will create:
- L1 Approver: `l1.approver@company.com` / password: `password123`
- L2 Approver: `l2.approver@company.com` / password: `password123`
- L3 Approver: `l3.approver@company.com` / password: `password123`

---

## Checking Browser Console for Errors

1. Open browser Developer Tools: Press **F12**
2. Go to **Console** tab
3. Look for red errors
4. Common errors and fixes:

### Error: "Failed to load pending approvals"
- **Cause**: Backend not running or wrong user ID
- **Fix**: Start backend, verify user exists

### Error: "Network request failed"
- **Cause**: Backend server not responding
- **Fix**: Verify backend is running on port 5000

### Error: 404 Not Found
- **Cause**: API endpoint doesn't exist
- **Fix**: Check API URL is correct: `http://localhost:5000/api`

### Error: 401 Unauthorized
- **Cause**: Not logged in or token expired
- **Fix**: Log out and log back in

---

## Check Network Tab

1. Press **F12** → **Network** tab
2. Refresh the page
3. Look for request to: `approvals/pending/...`
4. Click on it to see:
   - **Status**: Should be `200 OK`
   - **Response**: Should show JSON with tickets or empty array

**If Status is 500:**
- Check backend server logs for errors
- Check MongoDB connection

**If Status is 404:**
- Verify backend routes are registered
- Check server logs

**If Status is 403:**
- User doesn't have L1_APPROVER role
- Check user in database
