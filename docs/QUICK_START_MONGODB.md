# 🚀 Quick Start - MongoDB Implementation

Follow these steps to migrate from JSON files to MongoDB database.

## ✅ Step-by-Step Instructions

### Step 1: Start MongoDB

**Option A - Using Windows Service (Recommended):**
```powershell
net start MongoDB
```

**Option B - Using MongoDB Compass:**
1. Open MongoDB Compass
2. Click "Connect" with connection string: `mongodb://localhost:27017`
3. If connection fails, MongoDB is not running

**Option C - Install MongoDB (if not installed):**
- Download from: https://www.mongodb.com/try/download/community
- Install with default settings
- MongoDB will run as a Windows service

---

### Step 2: Verify MongoDB is Running

Open MongoDB Compass and connect to: `mongodb://localhost:27017`

You should see:
- ✅ "Connected" status in green
- Left sidebar showing databases

---

### Step 3: Run Automated Setup (EASIEST)

**Just double-click this file:**
```
start-mongodb.bat
```

This will:
1. ✅ Check if MongoDB is running
2. ✅ Install server dependencies
3. ✅ Create database and seed all data
4. ✅ Start the backend server

---

### Step 4: Manual Setup (Alternative)

If you prefer manual setup:

#### 4.1 Install Dependencies
```powershell
cd server
npm install
```

#### 4.2 Seed Database
```powershell
npm run seed
```

You should see:
```
✅ Connected to MongoDB
✅ Cleared existing data
📥 Importing users...
✅ Imported 10 users
📥 Importing employees...
✅ Imported 50 employees
... (and so on)
🎉 Database seeding completed successfully!
```

#### 4.3 Start Backend Server
```powershell
npm run dev
```

Server will start at: **http://localhost:5000**

---

### Step 5: Verify Database in MongoDB Compass

1. Open MongoDB Compass
2. You should see database: **rmg-portal**
3. Click on it to see collections:
   - ✅ users
   - ✅ employees
   - ✅ attendance
   - ✅ leaves
   - ✅ holidays
   - ✅ announcements
   - ✅ celebrations
   - ✅ newjoiners
   - ✅ projects
   - ✅ allocations
   - ✅ payrolls
   - ✅ helpdesktickets
   - ✅ subcategorymappings

4. Click on any collection to view documents

---

### Step 6: Update Frontend Configuration

**Edit `.env` in project root:**

Change from:
```env
VITE_USE_MOCK_API=true
```

To:
```env
VITE_USE_MOCK_API=false
VITE_API_URL=http://localhost:5000/api
```

---

### Step 7: Start Frontend

```powershell
# From project root (not server folder)
npm run dev
```

Frontend will start at: **http://localhost:5173**

---

### Step 8: Test the Application

1. Open browser: http://localhost:5173
2. Login with any user from `users.json`:
   ```
   Email: nikhil.bomma@acuvate.com
   Password: Nikhil@123
   ```

3. Navigate through:
   - ✅ Dashboard
   - ✅ Employees
   - ✅ Attendance
   - ✅ Leave Management
   - ✅ Helpdesk

4. Try CRUD operations:
   - ✅ Add employee
   - ✅ Update attendance
   - ✅ Submit leave request
   - ✅ Create helpdesk ticket

---

## 🔧 Troubleshooting

### Error: MongoDB Connection Failed

**Problem:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```powershell
# Start MongoDB service
net start MongoDB

# Or check if MongoDB is installed
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --version
```

---

### Error: Port 5000 Already in Use

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution 1 - Kill process:**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Solution 2 - Change port:**
Edit `server/.env`:
```env
PORT=5001
```

---

### Error: Cannot Find Module

**Problem:**
```
Error: Cannot find module 'mongoose'
```

**Solution:**
```powershell
cd server
npm install
```

---

### Seed Script Fails

**Problem:**
```
Error reading JSON file
```

**Solution:**
Make sure all JSON files exist in `src/data/`:
- users.json
- employees.json
- attendance.json
- leaves.json
- holidays.json
- announcements.json
- celebrations.json
- newJoiners.json
- projects.json
- allocations.json
- payroll.json
- subCategoryMapping.json

---

## 📊 What Happens During Seeding?

The seed script (`server/src/seed.ts`) does:

1. **Connects to MongoDB** at `localhost:27017`
2. **Creates database** `rmg-portal` (if not exists)
3. **Clears old data** from all collections
4. **Reads JSON files** from `src/data/`
5. **Imports data** into MongoDB collections
6. **Creates indexes** for better performance
7. **Displays summary** of imported records

---

## 🎯 Next Steps After Setup

### 1. Explore API Endpoints

Test in browser or Postman:

```
GET  http://localhost:5000/api/users
GET  http://localhost:5000/api/employees
GET  http://localhost:5000/api/attendance
GET  http://localhost:5000/api/leaves
POST http://localhost:5000/api/auth/login
```

### 2. Check MongoDB Compass

- View collections
- Query documents
- Update records
- Monitor performance

### 3. Test Frontend Features

- Login/Logout
- CRUD operations
- Helpdesk workflow
- Notifications
- Search functionality

---

## 📝 Important Notes

### Data Persistence

✅ **With MongoDB:** Data is persistent across server restarts
❌ **With JSON:** Data resets when server restarts

### Scalability

✅ **MongoDB:** Handles large datasets efficiently
❌ **JSON:** Performance degrades with large files

### Multi-user Support

✅ **MongoDB:** Supports concurrent users
❌ **JSON:** File locking issues with concurrent writes

---

## 🌐 Production Deployment

For production, use **MongoDB Atlas** (Cloud):

1. Create account: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rmg-portal
   ```

---

## ✅ Checklist

- [ ] MongoDB installed and running
- [ ] MongoDB Compass connected
- [ ] Server dependencies installed (`npm install`)
- [ ] Database seeded (`npm run seed`)
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend `.env` updated
- [ ] Frontend running (`npm run dev`)
- [ ] Login successful
- [ ] CRUD operations working
- [ ] Data persisting after server restart

---

## 🆘 Need Help?

If you encounter issues:

1. Check server terminal for error messages
2. Check MongoDB Compass connection
3. Verify `.env` configuration
4. Clear browser cache and retry
5. Review `MONGODB_SETUP.md` for detailed instructions

---

**You're all set! 🎉**

Your RMG Portal is now running with MongoDB database!
