/**
 * Super Admin Dashboard
 * Main dashboard showing system overview, stats, and quick actions
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Ticket,
  Clock,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AnnouncementsFeed } from '@/components/dashboard/AnnouncementsFeed';
import { getDashboardStats, getSystemHealth } from '@/services/superAdminService';
import type { DashboardStats, SystemHealth } from '@/types/superAdmin';

export function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, healthData] = await Promise.all([
        getDashboardStats(),
        getSystemHealth()
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button onClick={fetchData} className="mt-4" variant="outline">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPending = stats?.pendingApprovals.total || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and management</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/users')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.newUsersThisWeek ? `+${stats.newUsersThisWeek} this week` : 'No new users'}
            </p>
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.criticalTickets ? (
                <span className="text-destructive">{stats.criticalTickets} critical</span>
              ) : (
                'No critical tickets'
              )}
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/approvers')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">L1: {stats?.pendingApprovals.l1 || 0}</Badge>
              <Badge variant="outline" className="text-xs">L2: {stats?.pendingApprovals.l2 || 0}</Badge>
              <Badge variant="outline" className="text-xs">L3: {stats?.pendingApprovals.l3 || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/categories')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categoriesCount || 0}</div>
            <div className="flex gap-2 mt-1 flex-wrap">
              {stats?.categoriesByType && Object.entries(stats.categoriesByType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type}: {count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Manage your system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/superadmin/users')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/superadmin/categories')}
            >
              <span className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Manage Categories
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/superadmin/approvers')}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Manage Approvers
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                Database
              </span>
              <Badge variant={health?.database === 'connected' ? 'default' : 'destructive'} className="bg-primary">
                {health?.database === 'connected' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </span>
                ) : (
                  'Disconnected'
                )}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                API
              </span>
              <Badge variant={health?.api === 'running' ? 'default' : 'destructive'} className="bg-primary">
                {health?.api === 'running' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Running
                  </span>
                ) : (
                  'Down'
                )}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-4">
              Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval Pipeline Overview</CardTitle>
          <CardDescription>Current tickets waiting for approval at each level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* L1 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  Level 1 (Team Lead)
                </span>
                <span className="text-sm text-muted-foreground">{stats?.pendingApprovals.l1 || 0} pending</span>
              </div>
              <Progress
                value={totalPending > 0 ? ((stats?.pendingApprovals.l1 || 0) / totalPending) * 100 : 0}
                className="h-2"
              />
            </div>

            {/* L2 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  Level 2 (Manager)
                </span>
                <span className="text-sm text-muted-foreground">{stats?.pendingApprovals.l2 || 0} pending</span>
              </div>
              <Progress
                value={totalPending > 0 ? ((stats?.pendingApprovals.l2 || 0) / totalPending) * 100 : 0}
                className="h-2"
              />
            </div>

            {/* L3 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  Level 3 (Director)
                </span>
                <span className="text-sm text-muted-foreground">{stats?.pendingApprovals.l3 || 0} pending</span>
              </div>
              <Progress
                value={totalPending > 0 ? ((stats?.pendingApprovals.l3 || 0) / totalPending) * 100 : 0}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements & Polls */}
      <AnnouncementsFeed maxHeight="400px" />
    </div>
  );
}

export default SuperAdminDashboard;
