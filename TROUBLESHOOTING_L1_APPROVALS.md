# Troubleshooting L1 Approval Issues

## Problem
L1 user gets error: "Failed to load pending approvals"

## Root Causes & Solutions

### 1. Backend Server Not Running ⚠️

**Check if server is running:**
```bash
# From the server directory
cd server
npm run dev
```

The server should start on `http://localhost:5000`

**Expected output:**
```
Server running on port 5000
MongoDB connected successfully
```

---

### 2. Database Connection Issue

**Check MongoDB connection:**
- Ensure MongoDB is running locally or the connection string is correct
- Check `server/.env` for MongoDB connection string
- Default: `mongodb://localhost:27017/rmg-portal`

---

### 3. No Tickets Requiring L1 Approval

**The endpoint looks for tickets with:**
- `approvalLevel`: 'L1'
- `approvalStatus`: 'Pending'

**To test, create a ticket that requires approval:**

1. Log in as a regular employee
2. Create a helpdesk ticket (IT category with certain subcategories require approval)
3. The ticket should automatically be set to require L1 approval

**OR manually check database:**
```javascript
// In MongoDB shell or Compass
db.helpdesktickets.find({
  approvalLevel: "L1",
  approvalStatus: "Pending"
})
```

---

### 4. User Role Not Set Correctly

**Verify L1 user has correct role:**

```javascript
// In MongoDB shell
db.employees.findOne({ email: "l1approver@example.com" })
```

**Should show:**
```json
{
  "role": "L1_APPROVER",
  "name": "L1 Approver Name",
  ...
}
```

---

### 5. CORS or Network Issues

**If server is running but requests fail:**

Check browser console (F12) for:
- CORS errors
- Network errors
- 404 Not Found
- 401 Unauthorized
- 500 Internal Server Error

**Common fixes:**
- Ensure `VITE_API_URL=http://localhost:5000/api` in `.env`
- Restart both frontend and backend servers
- Clear browser cache

---

## Quick Fix Commands

### Start Backend Server
```bash
cd server
npm install  # if first time
npm run dev
```

### Start Frontend
```bash
cd ..  # back to root
npm run dev
```

### Seed Test Data (if needed)
```bash
cd server
npm run seed:approvers  # Creates L1, L2, L3 approver users
```

---

## Testing the Fix

1. **Open browser developer tools** (F12) → Network tab
2. **Log in as L1 approver**
3. **Check the network request** to `/api/approvals/pending/{userId}`
4. **Look for:**
   - Status 200 OK → Success
   - Status 404 → User not found
   - Status 500 → Server error (check server logs)
   - Failed to fetch → Server not running

---

## Expected API Response

**Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "id": "...",
      "ticketNumber": "TKT-0001",
      "subject": "Need laptop",
      "approvalLevel": "L1",
      "approvalStatus": "Pending",
      "urgency": "high",
      ...
    }
  ]
}
```

**No pending tickets (200):**
```json
{
  "success": true,
  "data": []
}
```

**Error response:**
```json
{
  "success": false,
  "message": "Approver not found"  // or other error
}
```
