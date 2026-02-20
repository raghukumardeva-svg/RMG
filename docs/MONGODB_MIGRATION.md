# MongoDB Migration Guide - IT Admin System

## Overview
All data has been migrated from localStorage to MongoDB for production-ready persistence and scalability.

## What Changed

### Before (localStorage)
- ✗ IT Specialists: JSON file (`src/data/itSpecialists.json`)
- ✗ Helpdesk Tickets: Browser localStorage
- ✗ Assignments: Browser localStorage
- ✗ Users: JSON file (`src/data/users.json`)

### After (MongoDB)
- ✅ IT Specialists: MongoDB collection (`itspecialists`)
- ✅ Helpdesk Tickets: MongoDB collection (`helpdesktickets`)
- ✅ Assignments: Embedded in helpdesk tickets
- ✅ Users: MongoDB collection (`users`) - uses existing auth system

## New Backend Components

### 1. ITSpecialist Model
**File**: `server/src/models/ITSpecialist.ts`

**Schema**:
```typescript
{
  employeeId: String (unique)
  name: String
  email: String (unique)
  role: 'IT_EMPLOYEE'
  specializations: [String]
  team: String
  status: 'active' | 'inactive'
  activeTicketCount: Number (default: 0)
  maxCapacity: Number (default: 5)
  phone: String
  designation: String
  createdAt: Date
  updatedAt: Date
}
```

**Indexes**:
- `employeeId` (unique)
- `email` (unique)
- `status`
- `specializations`

### 2. IT Specialists API Routes
**File**: `server/src/routes/itSpecialists.ts`

**Endpoints**:
```
GET    /api/it-specialists                    # Get all specialists
GET    /api/it-specialists?status=active      # Filter by status
GET    /api/it-specialists/:id                # Get by MongoDB ID
GET    /api/it-specialists/employee/:employeeId # Get by employee ID
GET    /api/it-specialists/specialization/:spec # Get by specialization
POST   /api/it-specialists                    # Create specialist
PUT    /api/it-specialists/:id                # Update specialist
POST   /api/it-specialists/:id/increment-tickets # Increment count
POST   /api/it-specialists/:id/decrement-tickets # Decrement count
DELETE /api/it-specialists/:id                # Delete specialist
```

### 3. Helpdesk Assignment Endpoint
**File**: `server/src/routes/helpdesk.ts`

**New Endpoint**:
```
POST /api/helpdesk/:id/assign
```

**Request Body**:
```json
{
  "employeeId": "IT001",
  "employeeName": "David Smith",
  "assignedById": "5",
  "assignedByName": "Priya Sharma",
  "notes": "Urgent - CEO laptop"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "id": "...",
    "ticketNumber": "TKT0001",
    "assignment": {
      "assignedToId": "IT001",
      "assignedToName": "David Smith",
      "assignedById": "5",
      "assignedByName": "Priya Sharma",
      "assignedByRole": "IT_ADMIN",
      "assignedAt": "2024-12-10T...",
      "assignmentNotes": "Urgent - CEO laptop"
    },
    "status": "Assigned",
    ...
  }
}
```

**Side Effects**:
- Updates ticket status to "Assigned"
- Increments specialist's `activeTicketCount`
- Adds history entry to ticket

## Frontend Changes

### Updated Services
**File**: `src/services/helpdeskService.ts`

**Before**:
```typescript
// Fetch from static JSON file
getITSpecialists: async () => {
  const response = await fetch('/src/data/itSpecialists.json');
  return await response.json();
}
```

**After**:
```typescript
// Fetch from MongoDB API
getITSpecialists: async () => {
  const response = await apiClient.get('/it-specialists?status=active');
  return response.data.data;
}
```

**All Updated Methods**:
- `getITSpecialists()` - Now fetches from `/api/it-specialists`
- `getSpecialistsBySpecialization(specialization)` - Uses `/api/it-specialists/specialization/:spec`
- `assignToITEmployee()` - Now calls `/api/helpdesk/:id/assign`

## Setup Instructions

### 1. Start MongoDB
Ensure MongoDB is running:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2. Configure Environment
**File**: `server/.env`
```env
MONGODB_URI=mongodb://localhost:27017/rmg-portal
PORT=5000
JWT_SECRET=your-secret-key
```

### 3. Seed IT Specialists Data
```bash
cd server
npm run seed:specialists
```

**Expected Output**:
```
🌱 Seeding IT Specialists...
✅ Cleared existing IT specialists
✅ Created 10 IT specialists

📊 IT Specialists Summary:
  - David Smith (IT001) - Hardware Team
    Specializations: Hardware Issue, Desktop Support, Printer/Peripheral
  - Emily Chen (IT002) - Software Team
    Specializations: Software Issue, Software Installation, Application Error
  ...

✅ Seeding completed successfully!
```

### 4. Start Backend Server
```bash
cd server
npm run dev
```

**Expected Output**:
```
🚀 MongoDB Server running on http://localhost:5000
📊 Database: MongoDB (rmg-portal)
🔐 JWT Authentication enabled
✅ MongoDB Connected: localhost
📊 Database: rmg-portal
```

### 5. Start Frontend
```bash
npm run dev
```

## Testing the Migration

### Test 1: Fetch IT Specialists
```bash
curl http://localhost:5000/api/it-specialists?status=active
```

**Expected**: JSON array of 10 active specialists

### Test 2: Filter by Specialization
```bash
curl http://localhost:5000/api/it-specialists/specialization/Hardware%20Issue
```

**Expected**: Specialists with "Hardware Issue" in specializations

### Test 3: Assign Ticket
```bash
curl -X POST http://localhost:5000/api/helpdesk/TICKET_ID/assign \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "IT001",
    "employeeName": "David Smith",
    "assignedById": "5",
    "assignedByName": "Priya Sharma",
    "notes": "Test assignment"
  }'
```

**Expected**: Updated ticket with assignment details

### Test 4: Verify Specialist Workload
```bash
curl http://localhost:5000/api/it-specialists/employee/IT001
```

**Expected**: `activeTicketCount` incremented by 1

## Data Flow

### Assignment Workflow
```
1. IT Admin clicks "Assign" on ticket
   ↓
2. Frontend opens AssignTicketDrawer
   ↓
3. ITEmployeeSelect fetches specialists
   GET /api/it-specialists/specialization/Hardware Issue
   ↓
4. Returns filtered specialists sorted by workload
   ↓
5. Admin selects specialist and adds notes
   ↓
6. handleAssignTicket calls helpdeskService
   ↓
7. POST /api/helpdesk/:id/assign
   ↓
8. Backend updates ticket + increments specialist count
   ↓
9. Response returned with updated ticket
   ↓
10. Frontend refreshes ticket list
```

### Workload Tracking
```
Assignment Created:
  ✅ specialist.activeTicketCount++
  ✅ ticket.assignment set
  ✅ ticket.status = "Assigned"

Ticket Completed:
  ✅ specialist.activeTicketCount--
  ✅ ticket.status = "Completed"
```

## MongoDB Collections

### itspecialists
```javascript
{
  "_id": ObjectId("..."),
  "employeeId": "IT001",
  "name": "David Smith",
  "email": "david.smith@company.com",
  "role": "IT_EMPLOYEE",
  "specializations": ["Hardware Issue", "Desktop Support"],
  "team": "Hardware Team",
  "status": "active",
  "activeTicketCount": 3,
  "maxCapacity": 5,
  "phone": "+1234567801",
  "designation": "Hardware Support Specialist",
  "createdAt": ISODate("2024-12-10T..."),
  "updatedAt": ISODate("2024-12-10T...")
}
```

### helpdesktickets (with assignment)
```javascript
{
  "_id": ObjectId("..."),
  "ticketNumber": "TKT0001",
  "userId": "EMP001",
  "userName": "John Doe",
  "subject": "Laptop not starting",
  "description": "...",
  "urgency": "high",
  "status": "Assigned",
  "highLevelCategory": "IT",
  "subCategory": "Hardware Issue",
  "assignment": {
    "assignedToId": "IT001",
    "assignedToName": "David Smith",
    "assignedById": "5",
    "assignedByName": "Priya Sharma",
    "assignedByRole": "IT_ADMIN",
    "assignedAt": ISODate("2024-12-10T..."),
    "assignmentNotes": "Urgent - CEO laptop"
  },
  "conversation": [],
  "attachments": [],
  "history": [
    {
      "action": "created",
      "timestamp": ISODate("..."),
      "by": "John Doe"
    },
    {
      "action": "assigned",
      "timestamp": ISODate("..."),
      "by": "Priya Sharma",
      "details": "Assigned to David Smith: Urgent - CEO laptop"
    }
  ],
  "createdAt": ISODate("2024-12-10T..."),
  "updatedAt": ISODate("2024-12-10T...")
}
```

## Benefits of MongoDB Migration

### 1. Data Persistence
- ✅ Survives browser refresh/clear
- ✅ Shared across all users
- ✅ Centralized data source

### 2. Performance
- ✅ Indexed queries (fast lookups)
- ✅ Efficient filtering and sorting
- ✅ Optimized for large datasets

### 3. Scalability
- ✅ Handles thousands of tickets
- ✅ Concurrent user access
- ✅ Production-ready architecture

### 4. Data Integrity
- ✅ ACID transactions
- ✅ Schema validation
- ✅ Referential integrity

### 5. Real-time Updates
- ✅ All clients see same data
- ✅ Instant workload updates
- ✅ Consistent assignment state

## Troubleshooting

### Issue: "Failed to fetch IT specialists"
**Cause**: Backend not running or MongoDB not connected
**Solution**:
```bash
# Check MongoDB status
mongosh
show dbs

# Restart backend
cd server
npm run dev
```

### Issue: "Specialist not found" during assignment
**Cause**: IT specialists not seeded
**Solution**:
```bash
cd server
npm run seed:specialists
```

### Issue: "activeTicketCount not updating"
**Cause**: Assignment endpoint not incrementing count
**Solution**: Check backend logs, ensure `/api/helpdesk/:id/assign` is called

### Issue: "Connection refused" error
**Cause**: MongoDB not running
**Solution**:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

## Rollback Plan

If you need to temporarily rollback to localStorage:

1. Revert `helpdeskService.ts` changes
2. Use local JSON files for specialists
3. Comment out MongoDB routes in server.ts

**Not recommended** - MongoDB is production-ready and more reliable.

## Next Steps

1. ✅ Run `npm run seed:specialists` to populate data
2. ✅ Start backend server
3. ✅ Test assignment workflow in UI
4. ✅ Verify workload tracking
5. ✅ Monitor MongoDB logs for errors

## Related Documentation
- [IT_ADMIN_SYSTEM.md](./IT_ADMIN_SYSTEM.md) - System architecture
- [IT_ADMIN_TEST_GUIDE.md](./IT_ADMIN_TEST_GUIDE.md) - Testing guide
- [MONGODB_SETUP.md](./MONGODB_SETUP.md) - MongoDB configuration

## Support

For MongoDB-related issues:
1. Check server logs: `cd server && npm run dev`
2. Verify MongoDB connection: `mongosh`
3. Check collection data: `db.itspecialists.find()`
4. Review API responses in browser DevTools Network tab
