# RMG Portal - Quick Start Guide

## 🚀 Getting Started (3 Steps)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Browser**
   - Navigate to `http://localhost:5173/` (or shown port)
   - You'll see the login page

## 🔐 Login & Test

### Quick Test Flow:

#### Test as Employee
1. Select "EMPLOYEE" role on login page
2. Click "Sign In"
3. You'll see the Employee Dashboard
4. Try navigating to: Profile, Attendance, Leave, Payroll

#### Test as HR
1. Logout (top-right icon)
2. Select "HR" role on login
3. Click "Sign In"
4. You'll see the HR Dashboard
5. Try navigating to: Employee Management, Leave Management, Payroll Management

#### Test as RMG
1. Logout
2. Select "RMG" role on login
3. Click "Sign In"
4. You'll see the RMG Dashboard
5. Try navigating to: Resource Pool, Allocations, Utilization

## 🎨 Test Theme Toggle
- Look for the Sun/Moon toggle in the top navigation bar
- Click the switch to toggle between Light and Dark mode
- Preference is saved automatically

## 🔍 What to Look For

### RBAC Verification
- ✅ Each role sees different sidebar menu items
- ✅ Trying to access unauthorized pages redirects to 403
- ✅ Dashboard content changes based on role

### UI Features
- ✅ Responsive design (resize browser window)
- ✅ Theme toggle works on all pages
- ✅ Clean, professional interface
- ✅ Active page highlighted in sidebar

### Data Display
- ✅ Employee profiles with skills and certifications
- ✅ Attendance records with hours
- ✅ Payroll breakdown with salary details
- ✅ Project allocations and utilization metrics

## 📂 Key Files to Explore

### Entry Points
- `src/App.tsx` - Main application component
- `src/main.tsx` - Application entry point
- `src/router/AppRouter.tsx` - All routes defined here

### RBAC Configuration
- `src/router/roleConfig.ts` - Role permissions defined here
- `src/router/ProtectedRoute.tsx` - Route protection logic

### State Management
- `src/store/authStore.ts` - User authentication state
- `src/store/themeStore.ts` - Theme preference state

### Mock Data
- `src/data/employees.json` - 8 employee profiles
- `src/data/attendance.json` - Attendance records
- `src/data/payroll.json` - Salary information
- `src/data/projects.json` - 5 projects
- `src/data/allocations.json` - Resource assignments

### Page Examples
- `src/pages/Dashboard.tsx` - Role-specific dashboards
- `src/pages/employee/Profile.tsx` - Employee profile page
- `src/pages/hr/EmployeeManagement.tsx` - HR employee list
- `src/pages/rmg/ResourcePool.tsx` - RMG resource pool

### UI Components
- `src/components/ui/button.tsx` - Reusable button
- `src/components/ui/card.tsx` - Card component
- `src/components/ui/input.tsx` - Input field
- `src/components/ui/badge.tsx` - Status badge

### Layouts
- `src/layouts/DashboardLayout.tsx` - Main layout wrapper
- `src/layouts/Sidebar.tsx` - Navigation sidebar
- `src/layouts/Topbar.tsx` - Top navigation bar

## 🛠️ Build Commands

```bash
# Development
npm run dev          # Start dev server (default: http://localhost:5173)

# Production
npm run build        # Build for production (outputs to ./dist)
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## 🎯 Feature Checklist

Test these features:

### Employee Features
- [ ] View personal profile
- [ ] Check attendance history
- [ ] View leave balance
- [ ] Check payroll/salary
- [ ] View performance goals
- [ ] Access documents

### HR Features
- [ ] View all employees
- [ ] Approve/reject leave requests
- [ ] Manage payroll
- [ ] View recruitment pipeline
- [ ] Check attendance reports

### RMG Features
- [ ] View resource pool with skills
- [ ] See project allocations
- [ ] Check utilization rates
- [ ] View demand forecasting
- [ ] Check skills gap

### Common Features
- [ ] Login with different roles
- [ ] Toggle light/dark theme
- [ ] Navigate between pages
- [ ] Logout functionality
- [ ] View role-specific dashboard

## 📱 Browser Testing

Test in multiple browsers:
- Chrome/Edge (Recommended)
- Firefox
- Safari

All modern browsers are supported.

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
# Kill processes on port 5173
npx kill-port 5173
npm run dev
```

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### TypeScript Errors
```bash
# Check TypeScript compilation
npx tsc --noEmit
```

## 📊 Project Statistics

- **Total Files**: 50+ source files
- **Pages**: 20+ page components
- **UI Components**: 6 reusable components
- **Routes**: 20+ protected routes
- **Mock Data**: 5 JSON files
- **Lines of Code**: 3000+ lines
- **Build Size**: ~900KB (minified)

## 🎓 Learning Points

This project demonstrates:
1. Role-Based Access Control (RBAC)
2. Protected routing with React Router
3. Global state management with Zustand
4. Theme system with CSS variables
5. TypeScript best practices
6. Component composition
7. Mock data patterns
8. Responsive design with Tailwind

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **Requirements**: See `Project_REQUIREMENT.md`

## ✨ Quick Tips

1. **Use the theme toggle** to see how the entire UI adapts
2. **Try accessing unauthorized pages** to see 403 error
3. **Check the sidebar** - it changes for each role
4. **Look at mock data files** to understand data structure
5. **Inspect roleConfig.ts** to see RBAC configuration

---

**Enjoy exploring the RMG Portal!** 🚀

For questions or enhancements, refer to the detailed documentation in README.md.
