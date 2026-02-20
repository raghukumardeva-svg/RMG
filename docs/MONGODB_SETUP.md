# MongoDB Setup Guide for RMG Portal

## Prerequisites
✅ MongoDB Compass installed
✅ MongoDB running locally (default port: 27017)

## Step 1: Start MongoDB Server

### Windows:
```powershell
# If MongoDB is installed as a service (default)
net start MongoDB

# Or start manually
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath="C:\data\db"
```

### Verify MongoDB is Running:
- Open MongoDB Compass
- Connect to: `mongodb://localhost:27017`
- You should see a successful connection

## Step 2: Create Database

In MongoDB Compass:
1. Click "Create Database"
2. Database Name: `rmg-portal`
3. Collection Name: `users` (we'll add more collections via script)

## Step 3: Configure Server Environment

Create `.env` file in the `server` folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/rmg-portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Step 4: Seed Database with JSON Data

Run the seed script (already created for you):

```powershell
# From project root
cd server
npm run seed
```

This will import all JSON data from `src/data/` into MongoDB collections:
- ✅ users
- ✅ employees
- ✅ attendance
- ✅ leaves
- ✅ holidays
- ✅ announcements
- ✅ celebrations
- ✅ newJoiners
- ✅ projects
- ✅ allocations
- ✅ payroll
- ✅ helpdesk tickets
- ✅ subCategoryMapping

## Step 5: Start Server

```powershell
# From server folder
npm run dev
```

Server will start at: `http://localhost:5000`

## Step 6: Update Frontend Environment

Update `.env` in project root:

```env
# Use real backend API
VITE_USE_MOCK_API=false
VITE_API_URL=http://localhost:5000/api
```

## Step 7: Start Frontend

```powershell
# From project root
npm run dev
```

Frontend will start at: `http://localhost:5173`

---

## Database Structure

### Collections:

#### 1. `users`
- Authentication and user profiles
- Fields: email, password (hashed), name, role, department, etc.

#### 2. `employees`
- Employee master data
- Fields: employeeId, name, email, department, designation, etc.

#### 3. `attendance`
- Daily attendance records
- Fields: employeeId, date, status, checkIn, checkOut, etc.

#### 4. `leaves`
- Leave requests and approvals
- Fields: employeeId, leaveType, startDate, endDate, status, etc.

#### 5. `holidays`
- Company holidays calendar
- Fields: name, date, type, etc.

#### 6. `announcements`
- Company announcements
- Fields: title, content, priority, publishedBy, etc.

#### 7. `helpdeskTickets`
- IT/Facilities/Finance helpdesk tickets
- Fields: ticketNumber, category, status, assignedTo, etc.

#### 8. `projects`
- Project and allocation data
- Fields: projectId, name, client, resources, etc.

#### 9. `payroll`
- Payroll records
- Fields: employeeId, month, salary, deductions, etc.

---

## Verification Steps

### 1. Check MongoDB Compass:
- Database `rmg-portal` should be visible
- All collections should have documents

### 2. Test API Endpoints:

```bash
# Get all users
curl http://localhost:5000/api/users

# Get all employees
curl http://localhost:5000/api/employees

# Login test
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nikhil.bomma@acuvate.com","password":"Nikhil@123"}'
```

### 3. Test Frontend:
- Login with credentials from `users.json`
- Navigate through different modules
- Create/Edit/Delete operations should work

---

## Troubleshooting

### MongoDB Connection Error:
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB service
```powershell
net start MongoDB
```

### Seeding Error:
```
Error: Collection already exists
```
**Solution:** Drop collections in Compass or use `dropIfExists` flag

### Port Already in Use:
```
Error: Port 5000 is already in use
```
**Solution:** Change PORT in `.env` or kill process using port 5000

---

## Next Steps

1. ✅ Start MongoDB
2. ✅ Configure `.env` files
3. ✅ Run seed script
4. ✅ Start backend server
5. ✅ Update frontend `.env`
6. ✅ Start frontend
7. ✅ Test application

---

## Production Deployment

For production, use MongoDB Atlas (cloud):
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update `MONGODB_URI` in production `.env`
