import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLeaveStore } from '@/store/leaveStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  UserCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ManagerDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { leaves, fetchLeaves } = useLeaveStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchLeaves(), fetchEmployees()]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchLeaves, fetchEmployees]);

  // Get reporting employees
  const reportingEmployees = useMemo(() => {
    if (!user?.employeeId) return [];
    return employees.filter(emp => emp.reportingManagerId === user.employeeId);
  }, [employees, user]);

  // Filter leaves for reporting employees
  const teamLeaves = useMemo(() => {
    const reportingIds = new Set(reportingEmployees.map(emp => emp.employeeId));
    return leaves.filter(leave => leave.employeeId && reportingIds.has(leave.employeeId));
  }, [leaves, reportingEmployees]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = teamLeaves.filter(l => l.status === 'pending').length;
    const approvedToday = teamLeaves.filter(l => {
      if (l.status !== 'approved' || !l.approvedAt) return false;
      const today = new Date().toDateString();
      return new Date(l.approvedAt).toDateString() === today;
    }).length;

    const upcoming = teamLeaves.filter(l => {
      if (l.status !== 'approved') return false;
      const startDate = new Date(l.startDate);
      const today = new Date();
      const diff = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 7;
    }).length;

    const activeEmployees = reportingEmployees.filter(emp => emp.status === 'active').length;

    return { pending, approvedToday, upcoming, activeEmployees, totalTeam: reportingEmployees.length };
  }, [teamLeaves, reportingEmployees]);

  // Recent pending leaves
  const recentPendingLeaves = useMemo(() => {
    return teamLeaves
      .filter(l => l.status === 'pending')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [teamLeaves]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            Manager Dashboard
          </h1>
          <p className="page-description">
            Manage your team and approve leave requests
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Approved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Leaves approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              Upcoming Leaves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-500" />
              Team Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalTeam}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Pending Leave Requests
            </CardTitle>
            <CardDescription>
              Review and approve leave requests from your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPendingLeaves.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending requests
              </p>
            ) : (
              <>
                {recentPendingLeaves.map((leave) => (
                  <div
                    key={leave._id || leave.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{leave.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {leave.leaveType} • {leave.days} day{leave.days > 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400">
                      Pending
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/manager/leave-approvals')}
                >
                  View All Requests
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Team Overview
            </CardTitle>
            <CardDescription>
              Quick view of your reporting employees
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportingEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No reporting employees
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Employees</span>
                    <span className="font-semibold">{stats.totalTeam}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-semibold text-green-600">{stats.activeEmployees}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Inactive</span>
                    <span className="font-semibold text-gray-600">
                      {stats.totalTeam - stats.activeEmployees}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/my-team')}
                >
                  View Team Members
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
