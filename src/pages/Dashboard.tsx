import { useAuthStore } from '@/store/authStore';
import { EmployeeDashboard } from '@/pages/employee/EmployeeDashboard';
import { HRDashboard } from '@/pages/hr/HRDashboard';
import { RMGDashboard } from '@/pages/rmg/RMGDashboard';
import { SuperAdminDashboard } from '@/pages/superadmin/SuperAdminDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  HeadphonesIcon,
  UserCircle2,
  Clock,
  TrendingUp,
  Calendar,
  FileText,
  Ticket,
  Settings,
  BarChart3,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAttendanceStore } from '@/store/attendanceStore';
import { useLeaveStore } from '@/store/leaveStore';

// Get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅', gradient: 'from-orange-400 to-yellow-400' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', gradient: 'from-blue-400 to-cyan-400' };
  return { text: 'Good Evening', emoji: '🌙', gradient: 'from-indigo-400 to-purple-400' };
};

// Role configuration with colors, icons, and descriptions
const roleConfig = {
  EMPLOYEE: {
    label: 'Employee',
    icon: UserCircle2,
    color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
    description: 'Your personal workspace'
  },
  MANAGER: {
    label: 'Manager',
    icon: Briefcase,
    color: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
    description: 'Team management & oversight'
  },
  IT_ADMIN: {
    label: 'IT Admin',
    icon: HeadphonesIcon,
    color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300',
    bgColor: 'bg-green-50/50 dark:bg-green-950/20',
    description: 'Technical support & systems'
  },
  HR: {
    label: 'HR',
    icon: Users,
    color: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300',
    bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
    description: 'Employee management & policies'
  },
  RMG: {
    label: 'RMG',
    icon: BarChart3,
    color: 'bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950 dark:text-pink-300',
    bgColor: 'bg-pink-50/50 dark:bg-pink-950/20',
    description: 'Resource management & analytics'
  },
  SUPER_ADMIN: {
    label: 'Super Admin',
    icon: ShieldCheck,
    color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300',
    bgColor: 'bg-red-50/50 dark:bg-red-950/20',
    description: 'System administration & control'
  }
};

// Quick actions based on role
const getQuickActions = (role: string, navigate: (path: string) => void) => {
  const actions: Record<string, Array<{ label: string; icon: any; path: string; color: string }>> = {
    EMPLOYEE: [
      { label: 'Apply Leave', icon: Calendar, path: '/leave', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'Raise Ticket', icon: Ticket, path: '/helpdesk', color: 'bg-green-500 hover:bg-green-600' },
      { label: 'View Attendance', icon: Clock, path: '/attendance', color: 'bg-purple-500 hover:bg-purple-600' }
    ],
    MANAGER: [
      { label: 'Team Approvals', icon: FileText, path: '/approvals', color: 'bg-purple-500 hover:bg-purple-600' },
      { label: 'View Team', icon: Users, path: '/employees', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'Reports', icon: BarChart3, path: '/reports', color: 'bg-green-500 hover:bg-green-600' }
    ],
    IT_ADMIN: [
      { label: 'View Tickets', icon: Ticket, path: '/helpdesk/queue', color: 'bg-green-500 hover:bg-green-600' },
      { label: 'Manage Users', icon: Users, path: '/it-admin/users', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'Settings', icon: Settings, path: '/it-admin/settings', color: 'bg-gray-500 hover:bg-gray-600' }
    ],
    HR: [
      { label: 'Add Announcement', icon: Sparkles, path: '/hr/announcements', color: 'bg-orange-500 hover:bg-orange-600' },
      { label: 'View Employees', icon: Users, path: '/employees', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'Manage Leaves', icon: Calendar, path: '/hr/leaves', color: 'bg-green-500 hover:bg-green-600' }
    ],
    RMG: [
      { label: 'Resources', icon: BarChart3, path: '/rmg/resources', color: 'bg-pink-500 hover:bg-pink-600' },
      { label: 'Analytics', icon: TrendingUp, path: '/rmg/analytics', color: 'bg-purple-500 hover:bg-purple-600' },
      { label: 'Reports', icon: FileText, path: '/reports', color: 'bg-blue-500 hover:bg-blue-600' }
    ],
    SUPER_ADMIN: [
      { label: 'Manage Categories', icon: FolderOpen, path: '/superadmin/categories', color: 'bg-red-500 hover:bg-red-600' },
      { label: 'View Users', icon: Users, path: '/superadmin/users', color: 'bg-blue-500 hover:bg-blue-600' },
      { label: 'System Health', icon: Settings, path: '/superadmin/settings', color: 'bg-green-500 hover:bg-green-600' }
    ]
  };
  return actions[role] || [];
};

export function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const greeting = getGreeting();
  const { getTodayRecord } = useAttendanceStore();
  const { leaveBalance, fetchLeaveBalance } = useLeaveStore();
  const [stats, setStats] = useState({ attendance: 0, pendingLeaves: 0, upcomingHolidays: 0 });

  useEffect(() => {
    if (user?.employeeId) {
      fetchLeaveBalance(user.employeeId);
    }
  }, [user?.employeeId, fetchLeaveBalance]);

  if (!user) return null;

  const config = roleConfig[user.role as keyof typeof roleConfig] || roleConfig.EMPLOYEE;
  const RoleIcon = config.icon;
  const quickActions = getQuickActions(user.role, navigate);
  const todayRecord = getTodayRecord(user?.employeeId || '');

  // Different dashboard content based on role
  const getDashboardContent = () => {
    switch (user.role) {
      case 'EMPLOYEE':
      case 'MANAGER':
      case 'IT_ADMIN':
        return <EmployeeDashboard />;
      case 'HR':
        return <HRDashboard />;
      case 'RMG':
        return <RMGDashboard />;
      case 'SUPER_ADMIN':
        return <SuperAdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Enhanced Header with Role-Based Background */}
      <div className={`relative overflow-hidden rounded-xl ${config.bgColor} border p-6`}>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left Section: Greeting & User Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${config.color} border-2`}>
                  <RoleIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      {greeting.text}, {user.name}! {greeting.emoji}
                    </h1>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {config.description}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Right Section: Quick Stats */}
            <div className="flex gap-3">
              {user.role === 'EMPLOYEE' && (
                <>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {todayRecord?.checkIn ? '✓' : '-'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Leave Balance</p>
                        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {leaveBalance?.earnedLeave?.remaining ?? 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      {quickActions.length > 0 && (
        <Card className="border-2 border-dashed animate-in slide-in-from-top-4 duration-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Actions
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((action, index) => {
                const ActionIcon = action.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`h-auto py-4 justify-start gap-3 hover:shadow-md transition-all duration-200 group`}
                    onClick={() => navigate(action.path)}
                  >
                    <div className={`p-2 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Content */}
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        {getDashboardContent()}
      </div>
    </div>
  );
}
