# Notification System Documentation

## Overview
A fully dynamic, role-aware notification system that works across all modules in the RMG Portal application.

## Architecture

### Components Created

1. **[src/types/notification.ts](src/types/notification.ts)** - Type definitions
2. **[src/services/notificationService.ts](src/services/notificationService.ts)** - API service
3. **[src/store/notificationStore.ts](src/store/notificationStore.ts)** - Zustand store
4. **[src/components/notifications/NotificationsPanel.tsx](src/components/notifications/NotificationsPanel.tsx)** - Main panel component
5. **[src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx)** - Bell icon with badge
6. **[src/layouts/Topbar.tsx](src/layouts/Topbar.tsx)** - Integrated in navbar

## Features

### ✅ Role-Based Filtering
Notifications are filtered based on:
- `userId` - Specific user targeting
- `role` - Role-based (EMPLOYEE, MANAGER, HR, IT_ADMIN, RMG, all)

### ✅ Notification Types
- `leave` - Leave requests and approvals
- `ticket` - IT helpdesk tickets
- `announcement` - Company announcements
- `celebration` - Birthdays, anniversaries
- `reminder` - System reminders
- `approval` - Approval notifications
- `rejection` - Rejection notifications
- `system` - General system messages

### ✅ UI Features
- Bell icon with unread badge count
- Right-side slide-out panel
- Grouped by time (Today, Yesterday, This Week, Older)
- Color-coded by type
- Unread highlighting
- Click to navigate to related page
- Mark as Read / Mark All as Read
- Clear All notifications

### ✅ Real-time Updates
- Polls every 30 seconds for new notifications
- Auto-updates unread count
- Instant local state updates

## Notification Triggers

### Leave Module ([src/store/leaveStore.ts](src/store/leaveStore.ts))

#### Employee Applies for Leave
```typescript
// Notification sent to MANAGER
{
  title: 'New Leave Request',
  description: `${userName} has requested ${leaveType} from ${startDate} to ${endDate}`,
  type: 'leave',
  userId: managerId,
  role: 'MANAGER',
  meta: {
    leaveId,
    employeeId,
    employeeName,
    leaveType,
    actionUrl: '/manager/leave-approvals'
  }
}
```

#### Manager Approves Leave
```typescript
// Notification sent to EMPLOYEE
{
  title: 'Leave Request Approved ✓',
  description: `Your ${leaveType} request from ${startDate} to ${endDate} has been approved`,
  type: 'approval',
  userId: employeeId,
  role: 'EMPLOYEE',
  meta: {
    leaveId,
    actionUrl: '/leave'
  }
}
```

#### Manager Rejects Leave
```typescript
// Notification sent to EMPLOYEE
{
  title: 'Leave Request Rejected',
  description: `Your ${leaveType} request has been rejected. Reason: ${rejectionReason}`,
  type: 'rejection',
  userId: employeeId,
  role: 'EMPLOYEE',
  meta: {
    leaveId,
    actionUrl: '/leave'
  }
}
```

### IT Helpdesk Module ([src/store/helpdeskStore.ts](src/store/helpdeskStore.ts))

#### Employee Creates Ticket
```typescript
// Notification sent to IT_ADMIN
{
  title: 'New IT Helpdesk Ticket',
  description: `${userName} has raised a ${requestType} ticket (${urgency} priority): ${subject}`,
  type: 'ticket',
  role: 'IT_ADMIN',
  meta: {
    ticketId,
    employeeId,
    employeeName,
    requestType,
    urgency,
    actionUrl: '/it-helpdesk'
  }
}
```

#### IT Admin Responds to Ticket
```typescript
// Notification sent to EMPLOYEE
{
  title: 'IT Admin Response',
  description: `IT Admin has responded to your ticket: ${ticketSubject}`,
  type: 'ticket',
  userId: employeeId,
  role: 'EMPLOYEE',
  meta: {
    ticketId,
    actionUrl: '/it-helpdesk'
  }
}
```

#### Ticket Closed
```typescript
// Notification sent to EMPLOYEE
{
  title: 'Ticket Closed',
  description: `Your IT ticket "${ticketSubject}" has been closed. ${closingNote}`,
  type: 'system',
  userId: employeeId,
  role: 'EMPLOYEE',
  meta: {
    ticketId,
    actionUrl: '/it-helpdesk'
  }
}
```

### Announcements Module ([src/store/announcementStore.ts](src/store/announcementStore.ts))

#### New Announcement Posted
```typescript
// Notification sent to ALL users
{
  title: '${priorityEmoji} New Announcement',
  description: `${author} posted: ${title}`,
  type: 'announcement',
  role: 'all',
  meta: {
    announcementId,
    priority,
    actionUrl: '/dashboard'
  }
}
```
**Priority Emojis:** 🔴 High | 🟡 Medium | 🟢 Low

## Usage

### In Any Component
```typescript
import { useNotificationStore } from '@/store/notificationStore';

// Create a notification
const { createNotification } = useNotificationStore();

await createNotification({
  title: 'Your Title',
  description: 'Your description',
  type: 'system',
  userId: 'USER123', // Optional - specific user
  role: 'all', // or 'EMPLOYEE' | 'MANAGER' | 'HR' | 'IT_ADMIN' | 'RMG'
  meta: {
    actionUrl: '/some-page',
    customField: 'value'
  }
});
```

### Adding Notification Bell to Any Page
```typescript
import { NotificationBell } from '@/components/notifications/NotificationBell';

// In your component
<NotificationBell />
```

## API Endpoints Expected

```
GET    /api/notifications?userId={id}&role={role}        // Get all notifications
GET    /api/notifications/unread/count?userId={id}       // Get unread count
POST   /api/notifications                                // Create notification
PATCH  /api/notifications/:id/read                       // Mark as read
PATCH  /api/notifications/read-all?userId={id}           // Mark all as read
DELETE /api/notifications/:id                            // Delete one
DELETE /api/notifications/clear-all?userId={id}          // Clear all
```

## Data Structure

```typescript
interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  isRead: boolean;
  userId?: string;
  role: UserRole;
  meta?: NotificationMeta;
}
```

## Visibility Matrix

| Module | Sees Notifications From |
|--------|------------------------|
| **Employee** | Leave approvals/rejections, IT ticket responses, announcements (role=EMPLOYEE or role=all) |
| **Manager** | Team leave requests, escalations, announcements (role=MANAGER or role=all) |
| **HR** | Employee updates, system notifications (role=HR or role=all) |
| **IT Admin** | IT tickets, system alerts (role=IT_ADMIN or role=all) |
| **RMG** | Resource updates, project notifications (role=RMG or role=all) |

## Color Coding

- 🔵 **Leave** - Blue
- 🟣 **Ticket** - Purple
- 🟠 **Announcement** - Orange
- 🩷 **Celebration** - Pink
- 🟢 **Approval** - Green
- 🔴 **Rejection** - Red
- ⚪ **System** - Gray

## Future Enhancements

### Phase 2
- [ ] WebSocket integration for real-time push
- [ ] Sound notifications
- [ ] Browser notifications (Notification API)
- [ ] Email digest for unread notifications
- [ ] Notification preferences/settings
- [ ] Archive functionality
- [ ] Search within notifications
- [ ] Filter by type/date range

### Phase 3
- [ ] In-app notification center page
- [ ] Notification templates
- [ ] Bulk actions
- [ ] Analytics dashboard
- [ ] Custom notification rules

## Testing

### Manual Testing Steps

1. **Employee Module**
   - Apply for leave
   - ✅ Manager should receive notification
   - Manager approves/rejects
   - ✅ Employee should receive notification

2. **Bell Icon**
   - ✅ Badge shows correct unread count
   - ✅ Opens panel on click
   - ✅ Updates in real-time (30s polling)

3. **Panel Functionality**
   - ✅ Shows grouped notifications
   - ✅ Click notification navigates correctly
   - ✅ Mark as read works
   - ✅ Mark all as read works
   - ✅ Clear all works
   - ✅ Empty state displays correctly

4. **Role Filtering**
   - ✅ Each role sees only relevant notifications
   - ✅ Global (role=all) visible to everyone

## Status

✅ **Core System** - Complete
✅ **Leave Module Integration** - Complete
✅ **IT Helpdesk Integration** - Complete
✅ **Announcements Integration** - Complete
✅ **UI Components** - Complete
✅ **Bell Icon Integration** - Complete
⏳ **Backend API** - Requires implementation
⏳ **Real-time WebSocket** - Future enhancement

## Notes

- All notification triggers are wrapped in try-catch to prevent breaking core functionality
- Notifications poll every 30 seconds
- Backend API needs to be implemented to persist notifications
- Currently uses in-memory store (will persist when backend is ready)
