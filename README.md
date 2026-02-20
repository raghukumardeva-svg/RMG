# RMG Portal - Multi-Role Dashboard System

A comprehensive role-based access control (RBAC) dashboard system built with React, TypeScript, and Vite. This portal provides separate dashboards for Employees, HR, and Resource Management Group (RMG) with dynamic navigation and theme support.

## 🚀 Features

### Core Features
- **Role-Based Access Control (RBAC)**: Secure page access based on user roles
- **Multi-Role Support**: Separate dashboards for Employee, HR, and RMG roles
- **Dynamic Navigation**: Sidebar menu items automatically show/hide based on user role
- **Theme Support**: Light and dark mode with persistent preferences
- **Mock Authentication**: Easy role switching for demo purposes
- **Responsive Design**: Mobile-friendly layout using TailwindCSS

### Role-Specific Features

#### Employee Dashboard
- Personal profile management
- Attendance tracking with clock-in/out
- Leave management and balance
- Payroll and payslip viewing
- Performance goals tracking
- Document access

#### HR Dashboard
- Employee management
- Attendance oversight
- Leave approval system
- Payroll processing
- Recruitment pipeline
- Performance reviews

#### RMG Dashboard
- Resource pool overview
- Project allocations
- Utilization tracking
- Demand forecasting
- Skills gap analysis

## 🛠️ Tech Stack

- **Framework**: React 19.2.0
- **Build Tool**: Vite 7.2.2
- **Language**: TypeScript 5.9.3
- **Routing**: React Router DOM 6.28.0
- **State Management**: Zustand 5.0.2
- **Styling**: TailwindCSS 3.4.17
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Notifications**: Sonner

## 📦 Installation & Usage

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm run dev
```

3. Build for production
```bash
npm run build
```

4. Preview production build
```bash
npm run preview
```

The application will be available at `http://localhost:5173/` (or the next available port).

## 🔐 Authentication & Roles

The application uses mock authentication for demonstration. Select a role on the login page:

### Employee Role
- **Default User**: John Doe (EMP001)
- **Access**: Personal dashboard, attendance, leave, payroll, performance, documents

### HR Role
- **Default User**: Michael Chen (EMP003)
- **Access**: Employee management, leave approvals, payroll, recruitment, performance reviews

### RMG Role
- **Default User**: Emily Rodriguez (EMP004)
- **Access**: Resource pool, allocations, utilization, forecasting, reports

Simply select your desired role on the login page and click "Sign In" - no password required for demo!

## 📁 Project Structure

```
src/
├── components/ui/          # Reusable UI components (Button, Card, Input, etc.)
├── data/                   # Mock JSON data files
├── layouts/                # Layout components (Sidebar, Topbar, DashboardLayout)
├── lib/                    # Utility functions
├── pages/                  # Page components organized by role
│   ├── auth/              # Login page
│   ├── employee/          # Employee pages
│   ├── hr/                # HR pages
│   ├── rmg/               # RMG pages
│   └── errors/            # Error pages (403)
├── router/                 # Routing configuration and RBAC
├── store/                  # Zustand state management
├── theme/                  # Theme provider
├── types/                  # TypeScript type definitions
└── App.tsx
```

## 🔒 Protected Routes & RBAC

All routes are protected based on user role:
- Authentication check redirects to `/login`
- Role-based access check redirects to `/403` if unauthorized
- Navigation menu dynamically shows/hides items based on role

Configuration is centralized in `src/router/roleConfig.ts`.

## 📊 Mock Data

Static JSON files provide realistic demo data:
- **employees.json**: 8 employees with skills and departments
- **attendance.json**: Clock-in/out records
- **payroll.json**: Salary breakdowns
- **projects.json**: 5 active projects
- **allocations.json**: Resource assignments

## 🚦 Available Routes

### Common
- `/login` - Authentication
- `/dashboard` - Role-specific dashboard
- `/reports` - Analytics (HR & RMG only)

### Employee Routes
- `/profile`, `/attendance`, `/leave`, `/payroll`, `/performance`, `/documents`

### HR Routes
- `/employees`, `/attendance-management`, `/leave-management`, `/payroll-management`
- `/recruitment`, `/performance-management`

### RMG Routes
- `/resource-pool`, `/allocations`, `/utilization`, `/forecasting`

## 🎨 Theme System

- Light/Dark mode toggle in top navigation
- Preferences persisted in local storage
- CSS custom properties for easy customization
- Fully responsive design

## 🔧 Key Implementation Details

### RBAC Configuration
```typescript
// src/router/roleConfig.ts
export const rolePermissions: Record<UserRole, string[]> = {
  EMPLOYEE: ['/dashboard', '/profile', ...],
  HR: ['/dashboard', '/employees', ...],
  RMG: ['/dashboard', '/resource-pool', ...],
};
```

### State Management
- **Auth Store**: User session with Zustand persistence
- **Theme Store**: Theme preference with local storage

### Path Aliases
```typescript
import { Button } from '@/components/ui/button';
```

## ✅ Project Status

- ✅ All core features implemented
- ✅ Role-based access control working
- ✅ All pages functional with mock data
- ✅ Theme toggle operational
- ✅ Build succeeds without errors
- ✅ Development server runs smoothly
- ✅ Responsive design implemented

## 🚀 Future Enhancements

- Backend API integration
- Advanced charts with Recharts
- Real-time notifications
- File upload/download
- Advanced search and filters
- Export functionality (PDF/Excel)
- Calendar integration
- Email notifications

## 📝 Development Notes

- TypeScript strict mode enabled
- ESLint configured for React
- Tailwind configured with custom theme
- All routes protected with authentication
- Mock data follows realistic patterns

---

**Built with React, TypeScript, Vite, TailwindCSS, and Zustand**
