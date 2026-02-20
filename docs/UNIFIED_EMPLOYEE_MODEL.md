# Unified Employee Model Implementation

## ✅ Migration Complete!

Successfully unified all users (approvers, IT specialists, regular employees) into a single **Employee** collection with role-based login access.

---

## 🎯 Key Changes

### Before (Fragmented System)
- ❌ **User** collection - Login credentials
- ❌ **Employee** collection - Employee data  
- ❌ **ITSpecialist** collection - IT staff data
- ❌ Separate models, duplicate data, complex synchronization

### After (Unified System)
- ✅ **Employee** collection - ALL users in one place
- ✅ Role-based access control (RBAC)
- ✅ `hasLoginAccess` flag determines who can log in
- ✅ Single source of truth

---

## 📊 Employee Model Schema

```typescript
{
  // Identity
  employeeId: String (unique, required)
  name: String (required)
  email: String (unique, required)
  
  // Authentication (for users with login access)
  password: String (hashed, optional)
  hasLoginAccess: Boolean (default: false)
  isActive: Boolean (default: true)
  
  // Role-Based Access Control
  role: Enum [
    'EMPLOYEE',      // Regular employee
    'MANAGER',       // Team manager
    'HR',            // HR personnel
    'RMG',           // Resource Management Group
    'IT_ADMIN',      // IT Administrator
    'IT_EMPLOYEE',   // IT Specialist/Support
    'L1_APPROVER',   // Level 1 Approver (Team Lead)
    'L2_APPROVER',   // Level 2 Approver (Manager)
    'L3_APPROVER',   // Level 3 Approver (Director)
  ]
  
  // Employee Details
  department: String (required)
  designation: String (required)
  phone: String
  dateOfJoining: String
  reportingManager: Mixed
  location: String
  status: Enum ['active', 'inactive', 'on-leave']
  avatar: String
  skills: [String]
  experience: Number
  education: String
  address: Mixed
  emergencyContact: Mixed
  
  // IT Specialist Fields (for IT_EMPLOYEE role)
  specializations: [String]
  team: String
  activeTicketCount: Number (default: 0)
  maxCapacity: Number (default: 10)
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

---

## 🔄 Migration Results

### Successfully Migrated:
```
📊 Total Employees: 24

📋 Employee breakdown by role:
   EMPLOYEE: 7
   HR: 1
   IT_ADMIN: 1
   IT_EMPLOYEE: 10
   L1_APPROVER: 1
   L2_APPROVER: 1
   L3_APPROVER: 1
   MANAGER: 1
   RMG: 1

📋 Login access breakdown:
   Has login access: 18
   No login access: 6
```

### Migration Actions:
1. ✅ Updated 5 existing employees with user credentials
2. ✅ Merged 2 IT specialists into existing employees
3. ✅ Created 3 employee records for approvers (L1, L2, L3)
4. ✅ Created 8 employee records for IT specialists
5. ✅ All passwords migrated and bcrypt-hashed

---

## 🔐 Login Access Control

### Employees with Login Access (`hasLoginAccess: true`)
- L1_APPROVER, L2_APPROVER, L3_APPROVER
- IT_ADMIN, IT_EMPLOYEE (all 10 specialists)
- MANAGER, HR, RMG
- EMPLOYEE (with configured credentials)

### Employees without Login (`hasLoginAccess: false`)
- Regular employees without system access
- New joiners (until credentials configured)
- Inactive employees

### Authentication Logic
```typescript
// Login requires:
1. email + password match
2. hasLoginAccess === true
3. isActive === true
4. role must be valid

// Auth endpoint checks Employee model instead of User model
const employee = await Employee.findOne({ 
  email: email.toLowerCase(),
  hasLoginAccess: true,
  isActive: true
}).select('+password');
```

---

## 🚀 Updated Backend Files

### 1. Employee Model (`server/src/models/Employee.ts`)
**Changes:**
- Added `password` field (select: false for security)
- Added `role` enum with all 9 roles
- Added `hasLoginAccess` and `isActive` flags
- Added IT specialist fields (specializations, team, capacity)
- Added indexes for role and hasLoginAccess

### 2. Auth Routes (`server/src/routes/auth.ts`)
**Changes:**
- Changed from `User` model to `Employee` model
- Added `hasLoginAccess` and `isActive` checks
- Updated login response to include more employee details
- Updated `/verify` and `/me` endpoints

### 3. Seed Approvers (`server/src/seedApprovers.ts`)
**Changes:**
- Changed from `User` model to `Employee` model
- Added employee fields (status, dateOfJoining, phone, location)
- Sets `hasLoginAccess: true` for all approvers

### 4. Migration Script (`server/src/migrateToUnifiedEmployee.ts`)
**Purpose:**
- Merges User, Employee, and ITSpecialist collections
- Creates single unified Employee collection
- Preserves all data with proper field mapping
- **Run once:** `npm run migrate:unified-employee`

---

## 📝 package.json Scripts

```json
{
  "scripts": {
    "migrate:unified-employee": "ts-node src/migrateToUnifiedEmployee.ts",
    "seed:approvers": "ts-node src/seedApprovers.ts",
    "seed:specialists": "ts-node src/seedITSpecialists.ts"
  }
}
```

---

## 🔑 Login Credentials (After Migration)

### Approvers
```
L1 Approver:
  Email: l1.approver@company.com
  Password: L1Approver@123
  Role: L1_APPROVER

L2 Approver:
  Email: l2.approver@company.com
  Password: L2Approver@123
  Role: L2_APPROVER

L3 Approver:
  Email: l3.approver@company.com
  Password: L3Approver@123
  Role: L3_APPROVER
```

### IT Admin
```
Email: priya.sharma@company.com
Password: (existing password)
Role: IT_ADMIN
```

### IT Specialists (10 total)
```
All 10 IT specialists have hasLoginAccess: true
Roles: IT_EMPLOYEE
Credentials: (existing passwords from ITSpecialist collection)
```

### Managers/HR/RMG
```
All existing user credentials preserved
Roles: MANAGER, HR, RMG
```

---

## 🎨 Frontend Impact

### No Changes Required!
The frontend already uses:
- `/api/auth/login` - Now returns employee data
- `/api/auth/verify` - Now validates against Employee model
- `/api/auth/me` - Now fetches from Employee model

### User Response Format (Unchanged)
```typescript
{
  id: string,
  _id: string,
  email: string,
  name: string,
  role: UserRole,
  department: string,
  designation: string,
  employeeId: string,
  avatar: string,
  phone: string,
  location: string
}
```

---

## 🧪 Testing the Migration

### 1. Verify Employee Count
```bash
# In MongoDB shell
use rmg-portal
db.employees.countDocuments()
# Should return 24
```

### 2. Check Role Distribution
```bash
db.employees.aggregate([
  { $group: { _id: '$role', count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])
```

### 3. Verify Login Access
```bash
db.employees.countDocuments({ hasLoginAccess: true })
# Should return 18
```

### 4. Test Login
```bash
# Try logging in as approver
POST /api/auth/login
{
  "email": "l1.approver@company.com",
  "password": "L1Approver@123"
}
# Should succeed and return employee data with role: L1_APPROVER
```

### 5. Test IT Specialist
```bash
# Verify IT specialist has both employee and specialist fields
db.employees.findOne({ role: 'IT_EMPLOYEE' })
# Should have: specializations, team, activeTicketCount, maxCapacity
```

---

## 🔧 Maintenance Tasks

### Adding New Employee with Login
```javascript
const newEmployee = new Employee({
  employeeId: 'EMP999',
  name: 'John Doe',
  email: 'john.doe@company.com',
  password: await bcrypt.hash('SecurePass123', 10),
  role: 'EMPLOYEE',
  department: 'Sales',
  designation: 'Sales Executive',
  hasLoginAccess: true,
  isActive: true,
  status: 'active',
  dateOfJoining: '2025-01-10'
});
await newEmployee.save();
```

### Adding Employee without Login
```javascript
const newEmployee = new Employee({
  employeeId: 'EMP888',
  name: 'Jane Smith',
  email: 'jane.smith@company.com',
  role: 'EMPLOYEE',
  department: 'Sales',
  designation: 'Sales Associate',
  hasLoginAccess: false, // No system access
  isActive: true,
  status: 'active',
  dateOfJoining: '2025-01-10'
});
await newEmployee.save();
```

### Granting Login Access
```javascript
await Employee.updateOne(
  { employeeId: 'EMP888' },
  {
    $set: {
      password: await bcrypt.hash('NewPassword123', 10),
      hasLoginAccess: true
    }
  }
);
```

### Revoking Login Access
```javascript
await Employee.updateOne(
  { employeeId: 'EMP999' },
  {
    $set: { hasLoginAccess: false },
    $unset: { password: '' } // Optional: remove password
  }
);
```

---

## ⚠️ Important Notes

### 1. Old Collections Still Exist
The migration **does not delete** the old collections:
- `users` collection - still intact
- `itspecialists` collection - still intact

**Action Required:**
After verifying the migration works correctly, you can manually drop these collections:
```javascript
use rmg-portal
db.users.drop()
db.itspecialists.drop()
```

### 2. Password Security
- All passwords stored with bcrypt hash
- `password` field has `select: false` (not returned in queries by default)
- Must explicitly select: `.select('+password')` when validating login

### 3. Index Warnings
You may see duplicate index warnings - these are harmless and occur when Mongoose creates indexes declared in both schema options and index() calls.

### 4. Backward Compatibility
- `id` field still exists for legacy compatibility
- Frontend continues to work without changes
- Existing JWT tokens remain valid

---

## 📈 Benefits of Unified Model

### ✅ Single Source of Truth
- No data duplication
- No synchronization issues
- Easier data management

### ✅ Simplified Queries
```typescript
// Before: Check 3 collections
const user = await User.findOne({ email });
const employee = await Employee.findOne({ email });
const specialist = await ITSpecialist.findOne({ email });

// After: One query
const employee = await Employee.findOne({ email });
// Has all data: auth, employee details, IT specialist fields
```

### ✅ Role-Based Access Control
- Single `role` field determines permissions
- Frontend routing based on employee.role
- Approval workflow checks employee.role
- IT assignment checks employee.specializations

### ✅ Flexible Access Management
- Employees can exist without login access
- Login access can be granted/revoked dynamically
- isActive flag for account suspension

### ✅ Scalability
- Add new roles easily (just extend enum)
- Add role-specific fields conditionally
- Single collection to backup/restore

---

## 🎯 Next Steps

### Recommended Actions:
1. ✅ **Test Login** - Verify all user types can log in
2. ✅ **Test RBAC** - Ensure role-based access works
3. ✅ **Test Approval Workflow** - Verify L1/L2/L3 approvers
4. ✅ **Test IT Assignment** - Verify IT specialists work
5. ⚠️ **Backup Database** - Before dropping old collections
6. ⚠️ **Drop Old Collections** - After confirming migration success

### Optional Enhancements:
- Add employee onboarding workflow (create → activate → grant login)
- Add employee offboarding workflow (revoke login → deactivate)
- Create admin panel to manage employee access
- Add audit log for login access changes
- Implement password reset functionality

---

## 📊 Summary

**Before:**
- 3 separate collections (User, Employee, ITSpecialist)
- 8 users + 13 employees + 10 specialists = 31 total records
- Complex synchronization logic
- Duplicate data

**After:**
- 1 unified Employee collection
- 24 employees (merged intelligently)
- Role-based access control
- Single source of truth

**Migration Result: ✅ SUCCESS**

All users, approvers, IT specialists, and employees are now unified in the Employee collection with proper role-based login access!
