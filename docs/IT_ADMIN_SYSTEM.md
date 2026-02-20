# IT Admin System - Complete Guide

## Overview
The IT Admin system provides centralized ticket assignment management with role-based access control (RBAC), specialist assignment by expertise, and workload-aware ticket distribution.

## Architecture

### Role Hierarchy
```
IT_ADMIN (Admin Role)
├── Centralized ticket assignment
├── View all IT tickets
├── Assign to specialists by expertise
└── Track workload metrics

IT_EMPLOYEE (Specialist Role)
├── Receive ticket assignments
├── Manage assigned tickets
├── Update progress & complete work
└── View own workload

EMPLOYEE (Regular User)
├── Submit IT tickets
└── Track ticket status
```

### Data Flow
```
EMPLOYEE submits ticket
    ↓
Ticket enters unassigned queue
    ↓
IT_ADMIN views dashboard
    ↓
IT_ADMIN selects ticket → Opens assignment drawer
    ↓
System filters specialists by required expertise
    ↓
IT_ADMIN selects specialist (workload-aware)
    ↓
Ticket assigned with admin metadata
    ↓
IT_EMPLOYEE receives assignment
    ↓
IT_EMPLOYEE manages & completes work
```

## Test Users

### IT_ADMIN User
- **Email**: priya.sharma@acuvate.com
- **Password**: Priya@123
- **Role**: IT_ADMIN
- **Access**: IT Admin Dashboard, All IT Tickets (view-only)

### IT_EMPLOYEE Users
1. **David Smith** (Hardware Specialist)
   - Email: david.smith@company.com
   - Password: David@123
   - Specializations: Hardware Issue, Desktop Support, Printer/Peripheral
   - Team: Hardware Team

2. **Emily Chen** (Software Specialist)
   - Email: emily.chen@company.com
   - Password: Emily@123
   - Specializations: Software Issue, Software Installation, Application Error
   - Team: Software Team

3. **Michael Johnson** (Network Specialist)
   - Email: michael.johnson@company.com
   - Password: Michael@123
   - Specializations: Network/Connectivity, VPN Access, Internet Issue
   - Team: Network Team

4. **Sarah Williams** (Identity Specialist)
   - Email: sarah.williams@company.com
   - Password: Sarah@123
   - Specializations: Account/Login Problem, Password Reset, Access Request
   - Team: Identity Team

## Features

### 1. IT Admin Dashboard (`/itadmin/dashboard`)

#### KPI Cards
- **Total Tickets**: All IT tickets in system
- **Unassigned**: Tickets awaiting assignment
- **Assigned**: Tickets assigned to specialists
- **In Progress**: Tickets actively being worked on

#### Unassigned Queue Table
- Real-time search by ticket ID, subject, requester
- Priority sorting (Critical → High → Medium → Low)
- Category and status badges
- Quick assign buttons
- Created date display

#### Assigned Tickets Overview
- Recently assigned tickets by current admin
- Assignee name and assignment date
- Status and category tracking
- Admin notes display

#### Assignment Workflow
1. Click "Assign" on unassigned ticket
2. Drawer opens with ticket details
3. Specialist dropdown auto-filters by required expertise
4. Workload badges show availability:
   - 🟢 **Available**: < 50% capacity
   - 🟡 **Medium Load**: 50-80% capacity
   - 🔴 **High Load**: > 80% capacity
5. Add assignment notes (optional)
6. Click "Assign Ticket"
7. Ticket moves to assigned queue

### 2. IT Ticket Management (`/itadmin/tickets`)

#### IT_ADMIN View (Read-Only)
- **Purpose**: View all tickets by category
- **Notice**: Blue alert directing to dashboard for assignments
- **Tabs**: Hardware, Software, Network, Account, Access, Equipment, Other
- **Actions**: View details, send messages only (no assignment)

#### IT_EMPLOYEE View (Full Management)
- **Purpose**: Manage assigned tickets
- **Actions**: 
  - Assign to self
  - Update progress (Not Started, In Progress, On Hold, Completed)
  - Complete work with resolution notes
  - Send messages to requesters
  - View ticket details

### 3. Specialist Selection (ITEmployeeSelect)

#### Smart Filtering
- Auto-filters specialists by required expertise
- Example: "Hardware Issue" ticket → Shows only hardware specialists

#### Workload Display
```
David Smith (Hardware Specialist)
├── Specializations: Hardware Issue, Desktop Support
├── Active Tickets: 3 / 5
└── Badge: 🟡 Medium Load (60% utilization)
```

#### Sorting Logic
- Sorts by utilization (activeTicketCount / maxCapacity)
- Shows least busy specialists first
- Promotes balanced workload distribution

### 4. Assignment Metadata Tracking

```typescript
interface Assignment {
  assignedToId: string;           // Specialist employee ID
  assignedToName: string;         // Specialist name
  assignedById: string;           // Admin employee ID
  assignedByName: string;         // Admin name
  assignedByRole: 'IT_ADMIN';     // Admin role
  assignedAt: string;             // ISO timestamp
  assignmentNotes?: string;       // Admin notes
  queue?: SpecialistQueue;        // Legacy team queue
}
```

## RBAC Implementation

### Route Protection
**File**: `src/router/roleConfig.ts`

```typescript
IT_ADMIN: [
  '/dashboard',
  '/itadmin/dashboard',    // Admin-only dashboard
  '/itadmin/tickets',      // View-only for IT_ADMIN
  '/profile',
  // ... other employee routes
]
```

### Component Guard
**File**: `src/hooks/useITAdminGuard.ts`

```typescript
export function useITAdminGuard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'IT_ADMIN') {
      toast.error('Access denied. IT Admin role required.');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
}
```

**Usage in ITAdminDashboard**:
```typescript
export function ITAdminDashboard() {
  useITAdminGuard(); // Redirects non-IT_ADMIN users
  // ... rest of component
}
```

### Read-Only Enforcement
**File**: `src/pages/itadmin/ITTicketManagement.tsx`

```typescript
const isITAdmin = user?.role === 'IT_ADMIN';

// Conditional handler passing
<SpecialistQueuePage
  onAssignToSelf={isITAdmin ? undefined : handleAssignToSelf}
  onAssignToSpecialist={isITAdmin ? undefined : handleAssignToSpecialist}
  onUpdateProgress={isITAdmin ? undefined : handleUpdateProgress}
  onCompleteWork={isITAdmin ? undefined : handleCompleteWork}
  // ... other props
/>
```

## Service Layer

### helpdeskService Methods

#### Get IT Specialists
```typescript
async getITSpecialists() {
  const specialists = await import('../data/itSpecialists.json');
  return specialists.default.filter(s => s.status === 'active');
}
```

#### Get Specialists by Specialization
```typescript
async getSpecialistsBySpecialization(specialization: string) {
  const specialists = await this.getITSpecialists();
  return specialists.filter(s => 
    s.specializations.includes(specialization)
  );
}
```

#### Assign to IT Employee
```typescript
async assignToITEmployee(
  ticketId: string,
  employeeId: string,
  employeeName: string,
  assignedById: string,
  assignedByName: string,
  notes?: string
) {
  // Update ticket with assignment metadata
  // Increment specialist activeTicketCount
  // Save to localStorage
}
```

## Data Files

### itSpecialists.json
**Location**: `server/src/data/itSpecialists.json`

```json
{
  "id": "IT001",
  "employeeId": "IT001",
  "name": "David Smith",
  "email": "david.smith@company.com",
  "role": "IT_EMPLOYEE",
  "specializations": ["Hardware Issue", "Desktop Support", "Printer/Peripheral"],
  "team": "Hardware Team",
  "status": "active",
  "activeTicketCount": 3,
  "maxCapacity": 5,
  "phone": "+1234567801",
  "designation": "Hardware Support Specialist"
}
```

### users.json
**Location**: `src/data/users.json`

```json
{
  "id": "5",
  "name": "Priya Sharma",
  "email": "priya.sharma@acuvate.com",
  "password": "Priya@123",
  "role": "IT_ADMIN",
  "department": "IT Support",
  "employeeId": "IT001"
}
```

## Testing Workflow

### Complete Assignment Flow

1. **Login as IT_ADMIN**
   - Email: priya.sharma@acuvate.com
   - Password: Priya@123

2. **Navigate to IT Admin Dashboard**
   - URL: `/itadmin/dashboard`
   - View KPI cards and unassigned queue

3. **Assign a Ticket**
   - Click "Assign" on any unassigned ticket
   - Review ticket details in drawer
   - Select specialist from dropdown (auto-filtered by expertise)
   - Check workload badge (Available/Medium/High Load)
   - Add assignment notes (optional)
   - Click "Assign Ticket"

4. **Verify Assignment**
   - Ticket moves to "Assigned Tickets" section
   - Assignment metadata visible (assignee, date, notes)
   - Unassigned count decrements
   - Assigned count increments

5. **Login as IT_EMPLOYEE**
   - Example: david.smith@company.com / David@123
   - Navigate to `/itadmin/tickets`

6. **Manage Assigned Ticket**
   - See assigned tickets in queue
   - Update progress
   - Add resolution notes
   - Complete work

### Verification Checklist
- ✅ IT_ADMIN can access dashboard
- ✅ Non-IT_ADMIN redirected with error toast
- ✅ Specialist dropdown filters by ticket expertise
- ✅ Workload badges display correctly
- ✅ Assignment saves with admin metadata
- ✅ IT_EMPLOYEE receives assignment
- ✅ IT_ADMIN view of tickets is read-only
- ✅ Assignment notes persist

## UI Components

### ITAdminDashboard.tsx
- **Purpose**: Central hub for ticket assignment
- **RBAC**: useITAdminGuard hook
- **Features**: KPIs, search, sorting, assignment workflow
- **State**: Tickets, selected ticket, drawer open/close

### AssignTicketDrawer.tsx
- **Purpose**: Assignment dialog UI
- **Props**: ticket, specialists, onAssign, onClose
- **Features**: Ticket details, specialist select, notes textarea

### ITEmployeeSelect.tsx
- **Purpose**: Smart specialist dropdown
- **Props**: specialization, value, onChange
- **Features**: Auto-filtering, workload display, utilization sorting

## Navigation Structure

```
Sidebar (IT_ADMIN user)
├── Dashboard
├── IT Admin
│   ├── IT Admin Dashboard  ← Main assignment hub
│   └── IT Tickets          ← View-only
├── My Profile
├── My Team
├── Attendance
├── Leave
└── ... other employee routes
```

## Best Practices

### For IT Admins
1. Always use IT Admin Dashboard for assignments (not ticket management page)
2. Check specialist workload before assigning (prefer Available specialists)
3. Add assignment notes for context (e.g., "Urgent - CEO laptop")
4. Verify ticket expertise matches specialist specialization

### For IT Employees
1. Update ticket progress regularly
2. Add detailed resolution notes when completing work
3. Use IT Ticket Management page for work queue
4. Communicate with requesters via messages

### For Development
1. Keep itSpecialists.json in sync with users.json (matching IDs)
2. Update activeTicketCount when tickets assigned/completed
3. Validate specialization strings match exactly (case-sensitive)
4. Test RBAC guards after role changes
5. Monitor localStorage for assignment data consistency

## Troubleshooting

### Issue: IT_ADMIN can't access dashboard
- **Check**: User role in users.json is "IT_ADMIN"
- **Check**: roleConfig.ts includes /itadmin/dashboard for IT_ADMIN
- **Solution**: Verify login with correct test user credentials

### Issue: Specialist dropdown empty
- **Check**: Ticket has valid subCategory/specialization
- **Check**: itSpecialists.json has matching specializations
- **Solution**: Ensure specialization strings match exactly (case-sensitive)

### Issue: Workload not updating
- **Check**: assignToITEmployee service increments activeTicketCount
- **Check**: localStorage has updated specialist data
- **Solution**: Verify service saves to both tickets and specialists collections

### Issue: Assignment buttons visible for IT_ADMIN in ticket management
- **Check**: isITAdmin variable checks user.role === 'IT_ADMIN'
- **Check**: Handler props passed as undefined for IT_ADMIN
- **Solution**: Verify conditional logic in ITTicketManagement.tsx

## Future Enhancements

### Potential Features
- [ ] Auto-assign based on lowest workload
- [ ] Specialist availability calendar
- [ ] Ticket priority-based assignment rules
- [ ] SLA tracking and alerts
- [ ] Assignment history reports
- [ ] Workload analytics dashboard
- [ ] Multi-specialist assignment (team tickets)
- [ ] Reassignment workflow
- [ ] Bulk assignment operations
- [ ] Integration with email notifications

### Performance Optimizations
- [ ] Memoize specialist filtering
- [ ] Debounce search input
- [ ] Virtualize large ticket tables
- [ ] Cache specialist workload data
- [ ] Optimize re-renders with React.memo

## Related Documentation
- [HELPDESK_DEBUG_GUIDE.md](./HELPDESK_DEBUG_GUIDE.md) - General helpdesk troubleshooting
- [BACKEND_API_SPEC.md](./BACKEND_API_SPEC.md) - API endpoints reference
- [RBAC System](../src/router/roleConfig.ts) - Role configuration
- [Types](../src/types/helpdeskNew.ts) - TypeScript interfaces

## Support
For issues or questions:
1. Check this documentation first
2. Review related documentation files
3. Check browser console for errors
4. Verify localStorage data consistency
5. Test with provided test user credentials
