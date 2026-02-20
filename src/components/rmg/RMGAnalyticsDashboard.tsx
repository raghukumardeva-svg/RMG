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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Users, 
  Activity, 
  Download, 
  FileDown, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Target,
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { 
  rmgAnalyticsService,
  type ResourceUtilizationData,
  type AllocationEfficiencyData,
  type SkillsGapData,
  type DemandForecastData,
  type CostSummaryData
} from '@/services/rmgAnalyticsService';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function RMGAnalyticsDashboard() {
  const [data, setData] = useState<ResourceUtilizationData | null>(null);
  const [efficiencyData, setEfficiencyData] = useState<AllocationEfficiencyData | null>(null);
  const [skillsData, setSkillsData] = useState<SkillsGapData | null>(null);
  const [forecastData, setForecastData] = useState<DemandForecastData | null>(null);
  const [costData, setCostData] = useState<CostSummaryData | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filters
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [department, setDepartment] = useState<string>('all');

  // Generate year options (last 5 years)
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
      // Calculate date range for selected month
      const startDate = new Date(selectedYear, selectedMonth - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth, 0);
      
      const params: Record<string, string> = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      if (department && department !== 'all') {
        params.department = department;
      }

      // Fetch all analytics data
      const [utilizationData, efficiency, skills, forecast, costs] = await Promise.all([
        rmgAnalyticsService.getResourceUtilization(params),
        rmgAnalyticsService.getAllocationEfficiency(params),
        rmgAnalyticsService.getSkillsGap({ futureMonths: 3 }),
        rmgAnalyticsService.getDemandForecast(params),
        rmgAnalyticsService.getCostSummary(params)
      ]);

      setData(utilizationData);
      setEfficiencyData(efficiency);
      setSkillsData(skills);
      setForecastData(forecast);
      setCostData(costs);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
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

  const handleClearFilters = () => {
    setSelectedYear(currentDate.getFullYear());
    setSelectedMonth(currentDate.getMonth() + 1);
    setDepartment('all');
  };

  const handleExportCSV = async () => {
    if (!data) return;
    
    setIsExporting(true);
    try {
      // Create CSV content
      let csv = 'Resource Management Analytics Report\n\n';
      csv += `Period: ${data.period.start} to ${data.period.end}\n\n`;
      
      // Summary
      csv += 'SUMMARY\n';
      csv += `Total Resources,${data.summary.totalResources}\n`;
      csv += `Utilized Resources,${data.summary.utilizedResources}\n`;
      csv += `Overall Utilization,${data.summary.overallUtilization}%\n`;
      csv += `Billable Utilization,${data.summary.billableUtilization}%\n`;
      csv += `Non-Billable Utilization,${data.summary.nonBillableUtilization}%\n`;
      csv += `Bench Strength,${data.summary.benchStrength}\n\n`;
      
      // Department breakdown
      csv += 'DEPARTMENT BREAKDOWN\n';
      csv += 'Department,Total Resources,Utilization %,Billable Hours,Non-Billable Hours,Bench Count\n';
      data.departmentBreakdown.forEach(dept => {
        csv += `${dept.department},${dept.totalResources},${dept.utilization},${dept.billableHours},${dept.nonBillableHours},${dept.benchCount}\n`;
      });
      csv += '\n';
      
      // Top performers
      csv += 'TOP PERFORMERS\n';
      csv += 'Name,Department,Utilization %,Billable %\n';
      data.topPerformers.forEach(perf => {
        csv += `${perf.name},${perf.department},${perf.utilization},${perf.billablePercentage}\n`;
      });
      csv += '\n';
      
      // Bench resources
      csv += 'BENCH RESOURCES\n';
      csv += 'Name,Department,Designation,Utilization %,Skills\n';
      data.benchResources.forEach(bench => {
        csv += `${bench.name},${bench.department},${bench.designation},${bench.utilization},"${bench.skills.join(', ')}"\n`;
      });
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rmg-analytics-${data.period.start}-to-${data.period.end}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const getUtilizationBadgeVariant = (utilization: number): "default" | "secondary" | "destructive" => {
    if (utilization >= 80) return 'default';
    if (utilization >= 60) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Unable to load analytics data. Please try again.
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Filters</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExporting}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as Excel (Coming Soon)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.summary.totalResources}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.summary.utilizedResources} actively utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.summary.overallUtilization}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall resource utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              Billable Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.summary.billableUtilization}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue-generating work
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              Bench Strength
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.summary.benchStrength}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available resources (&lt;50%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Utilization Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Utilization Trend</CardTitle>
                <CardDescription>Daily utilization pattern</CardDescription>
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
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="utilization" 
                      stroke="#3b82f6" 
                      name="Overall"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="billable" 
                      stroke="#10b981" 
                      name="Billable"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nonBillable" 
                      stroke="#f59e0b" 
                      name="Non-Billable"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Department Utilization</CardTitle>
                <CardDescription>Utilization by department</CardDescription>
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

          {/* Top Performers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Highly utilized resources</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Utilization</TableHead>
                    <TableHead className="text-right">Billable %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topPerformers.slice(0, 10).map((perf) => (
                    <TableRow key={perf.employeeId}>
                      <TableCell className="font-medium">{perf.name}</TableCell>
                      <TableCell>{perf.department}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getUtilizationBadgeVariant(perf.utilization)}>
                          {perf.utilization}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{perf.billablePercentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bench Resources</CardTitle>
              <CardDescription>Under-utilized resources (less than 50% allocated)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.benchResources.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No bench resources - all resources are well utilized!</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead className="text-right">Utilization</TableHead>
                      <TableHead>Skills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.benchResources.map((bench) => (
                      <TableRow key={bench.employeeId}>
                        <TableCell className="font-medium">{bench.name}</TableCell>
                        <TableCell>{bench.department}</TableCell>
                        <TableCell>{bench.designation}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{bench.utilization}%</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {bench.skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {bench.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{bench.skills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-4">
          {efficiencyData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Over-Allocated
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {efficiencyData.summary.overAllocatedCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Resources &gt;100%</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Optimal Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {efficiencyData.summary.optimalCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {efficiencyData.summary.optimalRate}% of resources
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Utilization Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {efficiencyData.summary.utilizationRate}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {efficiencyData.summary.totalAllocated} / {efficiencyData.summary.totalCapacity}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {efficiencyData.overAllocated.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      Over-Allocated Resources
                    </CardTitle>
                    <CardDescription>Resources allocated beyond 100%</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Allocation</TableHead>
                          <TableHead className="text-right">Excess</TableHead>
                          <TableHead className="text-right">Projects</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {efficiencyData.overAllocated.map((resource) => (
                          <TableRow key={resource.employeeId}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.department}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="destructive">{resource.allocation}%</Badge>
                            </TableCell>
                            <TableCell className="text-right text-red-600 dark:text-red-400">
                              +{resource.excess}%
                            </TableCell>
                            <TableCell className="text-right">{resource.projectCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Cost Tab */}
        <TabsContent value="cost" className="space-y-4">
          {costData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Resource Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₹{(costData.summary.totalResourceCost / 100000).toFixed(2)}L
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {costData.period.months.toFixed(1)} months
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Billable Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ₹{(costData.summary.billableResourceCost / 100000).toFixed(2)}L
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {costData.summary.totalResourceCost > 0 
                        ? ((costData.summary.billableResourceCost / costData.summary.totalResourceCost) * 100).toFixed(1)
                        : 0}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Bench Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      ₹{(costData.summary.benchCost / 100000).toFixed(2)}L
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {costData.summary.benchCount} resources idle
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Budget Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {costData.summary.budgetUtilization.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Of total budget
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Department Cost Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Cost Breakdown</CardTitle>
                  <CardDescription>Cost distribution across departments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={costData.departmentCosts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => `₹${(value / 100000).toFixed(2)}L`}
                      />
                      <Legend />
                      <Bar dataKey="billableCost" fill="#10b981" name="Billable" />
                      <Bar dataKey="nonBillableCost" fill="#f59e0b" name="Non-Billable" />
                      <Bar dataKey="benchCost" fill="#ef4444" name="Bench" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Project Costs with ROI */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Cost Analysis</CardTitle>
                  <CardDescription>Budget vs actual costs with ROI metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead className="text-right">Budget</TableHead>
                        <TableHead className="text-right">Actual Cost</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">ROI %</TableHead>
                        <TableHead className="text-right">Resources</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.projectCosts.slice(0, 10).map((proj) => (
                        <TableRow key={proj.projectId}>
                          <TableCell className="font-medium">{proj.projectName}</TableCell>
                          <TableCell className="text-right">
                            ₹{(proj.budget / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(proj.actualCost / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={proj.variance >= 0 ? 'default' : 'destructive'}>
                              {proj.variance >= 0 ? '+' : ''}₹{(proj.variance / 100000).toFixed(2)}L
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={proj.roi >= 0 ? 'default' : 'destructive'}
                            >
                              {proj.roi >= 0 ? '+' : ''}{proj.roi.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{proj.resourceCount}</TableCell>
                        </TableRow>
                      ))}
                      {costData.projectCosts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No project cost data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Top Cost Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Cost Contributors</CardTitle>
                  <CardDescription>Highest cost employees in this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Monthly Salary</TableHead>
                        <TableHead className="text-right">Period Cost</TableHead>
                        <TableHead className="text-right">Billable Cost</TableHead>
                        <TableHead className="text-right">Utilization</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.topCostEmployees.map((emp) => (
                        <TableRow key={emp.employeeId}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell>{emp.department}</TableCell>
                          <TableCell className="text-right">
                            ₹{(emp.monthlySalary / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(emp.periodCost / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(emp.billableCost / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">{emp.utilization}%</TableCell>
                          <TableCell>
                            <Badge variant={emp.isBench ? 'destructive' : 'default'}>
                              {emp.isBench ? 'Bench' : 'Active'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Department Cost Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Department-wise Cost Details</CardTitle>
                  <CardDescription>Detailed cost breakdown by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Resources</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Avg Cost/Resource</TableHead>
                        <TableHead className="text-right">Billable</TableHead>
                        <TableHead className="text-right">Bench ({costData.departmentCosts.reduce((sum, d) => sum + d.benchCount, 0)})</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costData.departmentCosts.map((dept) => (
                        <TableRow key={dept.department}>
                          <TableCell className="font-medium">{dept.department}</TableCell>
                          <TableCell className="text-right">{dept.resourceCount}</TableCell>
                          <TableCell className="text-right">
                            ₹{(dept.totalCost / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(dept.avgCostPerResource / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{(dept.billableCost / 100000).toFixed(2)}L
                          </TableCell>
                          <TableCell className="text-right">
                            {dept.benchCount > 0 ? (
                              <Badge variant="destructive">
                                {dept.benchCount} (₹{(dept.benchCost / 100000).toFixed(2)}L)
                              </Badge>
                            ) : (
                              <Badge variant="default">0</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Skills Gap Tab */}
        <TabsContent value="skills" className="space-y-4">
          {skillsData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Skills Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{skillsData.summary.totalSkillsRequired}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Skills Available
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {skillsData.summary.totalSkillsAvailable}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Critical Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {skillsData.summary.criticalGaps}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Moderate Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {skillsData.summary.moderateGaps}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hiring Recommendations</CardTitle>
                  <CardDescription>Prioritized hiring needs based on skills gap</CardDescription>
                </CardHeader>
                <CardContent>
                  {skillsData.hiringRecommendations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No immediate hiring needs - skills are well covered!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Skill / Role</TableHead>
                          <TableHead className="text-right">Hires Needed</TableHead>
                          <TableHead>Priority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {skillsData.hiringRecommendations.map((rec, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{rec.skill}</TableCell>
                            <TableCell className="text-right">{rec.requiredCount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  rec.priority === 'high'
                                    ? 'destructive'
                                    : rec.priority === 'medium'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {rec.priority.toUpperCase()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          {forecastData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Upcoming Projects
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{forecastData.summary.upcomingProjectsCount}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Demand
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {forecastData.summary.totalDemand}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Available Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {forecastData.summary.availableResources}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Resource Gap
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {forecastData.summary.totalGap}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Demand by Role</CardTitle>
                  <CardDescription>Resource requirements for upcoming projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role / Skill</TableHead>
                        <TableHead className="text-right">Demand</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Gap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {forecastData.demandByRole.slice(0, 10).map((demand, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{demand.role}</TableCell>
                          <TableCell className="text-right">{demand.demand}</TableCell>
                          <TableCell className="text-right">{demand.available}</TableCell>
                          <TableCell className="text-right">
                            {demand.gap > 0 ? (
                              <Badge variant="destructive">{demand.gap}</Badge>
                            ) : (
                              <Badge variant="default">0</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
