import WeeklyTimesheet from "@/pages/rmg/uda-configuration/WeeklyTimesheet";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Login } from "@/pages/auth/Login";
import { NotAuthorized } from "@/pages/errors/NotAuthorized";
import { Dashboard } from "@/pages/Dashboard";

// Employee Pages
import { Profile } from "@/pages/employee/Profile";
import { MyTeam } from "@/pages/employee/MyTeam";
import { Attendance } from "@/pages/employee/Attendance";
import { Leave } from "@/pages/employee/Leave";
import { Payroll } from "@/pages/employee/Payroll";
import { Performance } from "@/pages/employee/Performance";
import { Documents } from "@/pages/employee/Documents";
import Helpdesk from "@/pages/employee/Helpdesk";

// Manager Pages
import { ManagerDashboard } from "@/pages/manager/ManagerDashboard";
import { ManagerLeaveApprovals } from "@/pages/manager/ManagerLeaveApprovals";

// IT Admin Pages
import { ITAdminDashboard } from "@/pages/itadmin/ITAdminDashboard";
import { ITTicketManagement } from "@/pages/itadmin/ITTicketManagement";
import { ITAnalytics } from "@/pages/itadmin/ITAnalytics";

// Finance Admin Pages
import { FinanceAdminDashboard } from "@/pages/financeadmin/FinanceAdminDashboard";
import { FinanceTicketManagement } from "@/pages/financeadmin/FinanceTicketManagement";

// Facilities Admin Pages
import { FacilitiesAdminDashboard } from "@/pages/facilitiesadmin/FacilitiesAdminDashboard";
import { FacilitiesTicketManagement } from "@/pages/facilitiesadmin/FacilitiesTicketManagement";

// Approver Pages
import ApproverPage from "@/pages/approver/ApproverPage";

// HR Pages
import { EmployeeManagement } from "@/pages/hr/EmployeeManagement";
import { AttendanceManagement } from "@/pages/hr/AttendanceManagement";
import { LeaveManagement } from "@/pages/hr/LeaveManagement";
import { PayrollManagement } from "@/pages/hr/PayrollManagement";
import { Recruitment } from "@/pages/hr/Recruitment";
import { PerformanceManagement } from "@/pages/hr/PerformanceManagement";
import { NewAnnouncement } from "@/pages/hr/NewAnnouncement";
import { AdminAnnouncements } from "@/pages/hr/AdminAnnouncements";
import { CTCMasterPage } from "@/pages/hr/CTCMasterPage";

// RMG Pages
import { ResourcePool } from "@/pages/rmg/ResourcePool";
import { Allocations } from "@/pages/rmg/Allocations";
import { Utilization } from "@/pages/rmg/Utilization";
import { Forecasting } from "@/pages/rmg/Forecasting";
import { RMGAnalytics } from "@/pages/rmg/RMGAnalytics";
import { CustomerListPage } from "@/pages/rmg/customers/CustomerListPage";
import { ProjectListPage } from "@/pages/rmg/projects/ProjectListPage";
import { FinancialLineListPage } from "@/pages/rmg/financial-lines/FinancialLineListPage";
import { UDAConfigurationPage } from "@/pages/rmg/uda-configuration/UDAConfigurationPage";
import EmployeeHoursReport from "@/pages/rmg/reports/EmployeeHoursReport";

// Super Admin Pages
import { SuperAdminDashboard } from "@/pages/superadmin/SuperAdminDashboard";
import { CategoryManagement } from "@/pages/superadmin/CategoryManagement";
import { UserManagement } from "@/pages/superadmin/UserManagement";
import { ApproverOverview } from "@/pages/superadmin/ApproverOverview";

// Common Pages
import { Reports } from "@/pages/Reports";
import { Employees } from "@/pages/Employees";

// Wrapper component for viewing other employee profiles
function ProfileWithParams() {
  const { employeeId } = useParams<{ employeeId: string }>();
  return <Profile employeeId={employeeId} />;
}

export function AppRouter() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route path="/403" element={<NotAuthorized />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route element={<DashboardLayout />}>
          {/* Common Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPath="/dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute requiredPath="/profile">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile/:employeeId"
            element={
              <ProtectedRoute requiredPath="/my-team">
                <ProfileWithParams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-team"
            element={
              <ProtectedRoute requiredPath="/my-team">
                <MyTeam />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute requiredPath="/attendance">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute requiredPath="/leave">
                <Leave />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute requiredPath="/payroll">
                <Payroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance"
            element={
              <ProtectedRoute requiredPath="/performance">
                <Performance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute requiredPath="/documents">
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute requiredPath="/helpdesk">
                <Helpdesk />
              </ProtectedRoute>
            }
          />

          {/* Common Routes (All Roles) */}
          <Route
            path="/employees-directory"
            element={
              <ProtectedRoute requiredPath="/employees-directory">
                <Employees />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute requiredPath="/manager/dashboard">
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/leave-approvals"
            element={
              <ProtectedRoute requiredPath="/manager/leave-approvals">
                <ManagerLeaveApprovals />
              </ProtectedRoute>
            }
          />

          {/* IT Admin Routes */}
          <Route
            path="/itadmin/dashboard"
            element={
              <ProtectedRoute requiredPath="/itadmin/dashboard">
                <ITAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itadmin/tickets"
            element={
              <ProtectedRoute requiredPath="/itadmin/tickets">
                <ITTicketManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itadmin/analytics"
            element={
              <ProtectedRoute requiredPath="/itadmin/analytics">
                <ITAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Finance Admin Routes */}
          <Route
            path="/financeadmin/dashboard"
            element={
              <ProtectedRoute requiredPath="/financeadmin/dashboard">
                <FinanceAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeadmin/tickets"
            element={
              <ProtectedRoute requiredPath="/financeadmin/tickets">
                <FinanceTicketManagement />
              </ProtectedRoute>
            }
          />

          {/* Facilities Admin Routes */}
          <Route
            path="/facilitiesadmin/dashboard"
            element={
              <ProtectedRoute requiredPath="/facilitiesadmin/dashboard">
                <FacilitiesAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facilitiesadmin/tickets"
            element={
              <ProtectedRoute requiredPath="/facilitiesadmin/tickets">
                <FacilitiesTicketManagement />
              </ProtectedRoute>
            }
          />

          {/* Approver Routes */}
          <Route
            path="/approver"
            element={
              <ProtectedRoute requiredPath="/approver">
                <ApproverPage />
              </ProtectedRoute>
            }
          />

          {/* HR Routes */}
          <Route
            path="/employees"
            element={
              <ProtectedRoute requiredPath="/employees">
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-management"
            element={
              <ProtectedRoute requiredPath="/attendance-management">
                <AttendanceManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-management"
            element={
              <ProtectedRoute requiredPath="/leave-management">
                <LeaveManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll-management"
            element={
              <ProtectedRoute requiredPath="/payroll-management">
                <PayrollManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruitment"
            element={
              <ProtectedRoute requiredPath="/recruitment">
                <Recruitment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/performance-management"
            element={
              <ProtectedRoute requiredPath="/performance-management">
                <PerformanceManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-announcement"
            element={
              <ProtectedRoute requiredPath="/new-announcement">
                <NewAnnouncement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-announcements"
            element={
              <ProtectedRoute requiredPath="/admin-announcements">
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ctc-master"
            element={
              <ProtectedRoute requiredPath="/ctc-master">
                <CTCMasterPage />
              </ProtectedRoute>
            }
          />

          {/* RMG Routes */}
          <Route
            path="/resource-pool"
            element={
              <ProtectedRoute requiredPath="/resource-pool">
                <ResourcePool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocations"
            element={
              <ProtectedRoute requiredPath="/allocations">
                <Allocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/utilization"
            element={
              <ProtectedRoute requiredPath="/utilization">
                <Utilization />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecasting"
            element={
              <ProtectedRoute requiredPath="/forecasting">
                <Forecasting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rmg/analytics"
            element={
              <ProtectedRoute requiredPath="/rmg/analytics">
                <RMGAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rmg/reports/employee-hours"
            element={
              <ProtectedRoute requiredPath="/rmg/reports/employee-hours">
                <EmployeeHoursReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rmg/customers"
            element={
              <ProtectedRoute requiredPath="/rmg/customers">
                <CustomerListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rmg/financial-lines"
            element={
              <ProtectedRoute requiredPath="/rmg/financial-lines">
                <FinancialLineListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rmg/projects"
            element={
              <ProtectedRoute requiredPath="/rmg/projects">
                <ProjectListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet-management/uda-configuration"
            element={
              <ProtectedRoute requiredPath="/timesheet-management/uda-configuration">
                <UDAConfigurationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timesheet-management/weekly-timesheet"
            element={
              <ProtectedRoute requiredPath="/timesheet-management/weekly-timesheet">
                <WeeklyTimesheet />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute requiredPath="/superadmin/dashboard">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/categories"
            element={
              <ProtectedRoute requiredPath="/superadmin/categories">
                <CategoryManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute requiredPath="/superadmin/users">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/approvers"
            element={
              <ProtectedRoute requiredPath="/superadmin/approvers">
                <ApproverOverview />
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPath="/reports">
                <Reports />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all - redirect to 403 */}
        <Route path="*" element={<Navigate to="/403" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
