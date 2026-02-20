import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Activity, TrendingUp, Users, BarChart3, RefreshCw, Loader2, Calendar } from 'lucide-react';
import { rmgAnalyticsService, type ResourceUtilizationData } from '@/services/rmgAnalyticsService';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function Utilization() {
  const [data, setData] = useState<ResourceUtilizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [department, setDepartment] = useState<string>('all');

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const params: Record<string, string> = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      if (department && department !== 'all') {
        params.department = department;
      }

      const utilizationData = await rmgAnalyticsService.getResourceUtilization(params);
      setData(utilizationData);
    } catch (error) {
      console.error('Error fetching utilization data:', error);
      toast.error('Failed to load utilization data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, selectedMonth, department]);

  const handleRefresh = () => {
    fetchData();
    toast.success('Data refreshed');
  };

  const getUtilizationBadgeVariant = (utilization: number): "default" | "secondary" | "destructive" => {
    if (utilization >= 80) return 'default';
    if (utilization >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading utilization data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Unable to load utilization data. Please try again.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <BarChart3 className="h-7 w-7 text-primary" />
            Resource Utilization
          </h1>
          <p className="page-description">Track resource productivity and efficiency</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Month</label>
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {data.departmentBreakdown.map(dept => (
                    <SelectItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.summary.overallUtilization}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {data.summary.utilizedResources} of {data.summary.totalResources} resources
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Billable Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.summary.billableUtilization}%
            </div>
            <p className="text-xs text-muted-foreground">Revenue-generating work</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On Bench</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.summary.benchStrength}
            </div>
            <p className="text-xs text-muted-foreground">Resources available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.nonBillableUtilization}%</div>
            <p className="text-xs text-muted-foreground">Internal work</p>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Utilization */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Department-wise Utilization</CardTitle>
          <CardDescription>Resource utilization across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.departmentBreakdown.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{dept.department}</span>
                  </div>
                  <Badge variant={getUtilizationBadgeVariant(dept.utilization)}>
                    {dept.utilization}%
                  </Badge>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      dept.utilization >= 80 
                        ? 'bg-primary' 
                        : dept.utilization >= 60 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${dept.utilization}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {dept.totalResources} resources
                  </span>
                  <span>
                    {dept.billableHours}h billable • {dept.nonBillableHours}h non-billable • {dept.benchCount} bench
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Utilization Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Utilization Trends</CardTitle>
            <CardDescription>Daily utilization pattern for the month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#3b82f6" 
                  name="Overall %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="billable" 
                  stroke="#10b981" 
                  name="Billable %"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="nonBillable" 
                  stroke="#f59e0b" 
                  name="Non-Billable %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Department Comparison</CardTitle>
            <CardDescription>Utilization rate by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilization" name="Utilization %" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {data.topPerformers.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top Performers
            </CardTitle>
            <CardDescription>Highly utilized resources this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.topPerformers.slice(0, 6).map((performer) => (
                <Card key={performer.employeeId}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{performer.name}</p>
                      <Badge variant="default">{performer.utilization}%</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{performer.department}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {performer.billablePercentage}% billable
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bench Resources */}
      {data.benchResources.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Bench Resources</CardTitle>
            <CardDescription>Available resources for allocation (under 50% utilized)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.benchResources.map((bench) => (
                <div key={bench.employeeId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{bench.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {bench.department} • {bench.designation}
                      </p>
                    </div>
                    <Badge variant="destructive">{bench.utilization}%</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bench.skills.slice(0, 5).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {bench.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{bench.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
