import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  BarChart3,
  LineChart,
  Calendar,
  AlertTriangle,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, subDays, isWithinInterval } from 'date-fns';

interface TicketMetric {
  date: string;
  created: number;
  resolved: number;
  avgResolutionTime: number; // in hours
  avgResponseTime: number; // in minutes
}

interface PerformanceBenchmark {
  metric: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface CategoryPerformance {
  category: string;
  ticketCount: number;
  avgResolutionTime: number;
  satisfactionRate: number;
}

interface PerformanceMetricsProps {
  className?: string;
}

type TimeRange = '7days' | '30days' | '90days' | 'custom';

// Generate mock data for the past 30 days
const generateMockData = (days: number): TicketMetric[] => {
  const data: TicketMetric[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      created: isWeekend ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 15) + 8,
      resolved: isWeekend ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 14) + 7,
      avgResolutionTime: Math.random() * 6 + 2,
      avgResponseTime: Math.random() * 40 + 15,
    });
  }
  
  return data;
};

const MOCK_METRICS = generateMockData(90);

const MOCK_BENCHMARKS: PerformanceBenchmark[] = [
  {
    metric: 'Average Response Time',
    current: 28,
    target: 30,
    unit: 'minutes',
    trend: 'down',
    trendValue: 5.2,
  },
  {
    metric: 'Average Resolution Time',
    current: 4.2,
    target: 6,
    unit: 'hours',
    trend: 'down',
    trendValue: 8.1,
  },
  {
    metric: 'First Contact Resolution',
    current: 68,
    target: 70,
    unit: '%',
    trend: 'up',
    trendValue: 3.5,
  },
  {
    metric: 'Customer Satisfaction',
    current: 4.6,
    target: 4.5,
    unit: '/5.0',
    trend: 'up',
    trendValue: 2.2,
  },
  {
    metric: 'SLA Compliance',
    current: 92,
    target: 95,
    unit: '%',
    trend: 'stable',
    trendValue: 0.3,
  },
  {
    metric: 'Ticket Backlog',
    current: 18,
    target: 20,
    unit: 'tickets',
    trend: 'down',
    trendValue: 15.8,
  },
];

const MOCK_CATEGORY_PERFORMANCE: CategoryPerformance[] = [
  { category: 'Authentication', ticketCount: 145, avgResolutionTime: 2.5, satisfactionRate: 92 },
  { category: 'Network', ticketCount: 98, avgResolutionTime: 5.2, satisfactionRate: 85 },
  { category: 'Hardware', ticketCount: 67, avgResolutionTime: 8.5, satisfactionRate: 88 },
  { category: 'Email', ticketCount: 123, avgResolutionTime: 1.8, satisfactionRate: 95 },
  { category: 'Software', ticketCount: 234, avgResolutionTime: 3.9, satisfactionRate: 90 },
  { category: 'Database', ticketCount: 45, avgResolutionTime: 6.2, satisfactionRate: 87 },
  { category: 'Infrastructure', ticketCount: 56, avgResolutionTime: 7.8, satisfactionRate: 83 },
  { category: 'Security', ticketCount: 34, avgResolutionTime: 4.5, satisfactionRate: 94 },
];

export const PerformanceMetrics = React.memo<PerformanceMetricsProps>(({ className = '' }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'resolution' | 'response'>('volume');

  // Filter metrics based on time range
  const filteredMetrics = useMemo(() => {
    const today = new Date();
    let daysToInclude = 30;
    
    switch (timeRange) {
      case '7days':
        daysToInclude = 7;
        break;
      case '30days':
        daysToInclude = 30;
        break;
      case '90days':
        daysToInclude = 90;
        break;
      default:
        daysToInclude = 30;
    }
    
    const startDate = subDays(today, daysToInclude);
    return MOCK_METRICS.filter(m => {
      const metricDate = new Date(m.date);
      return isWithinInterval(metricDate, { start: startDate, end: today });
    });
  }, [timeRange]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalCreated = filteredMetrics.reduce((sum, m) => sum + m.created, 0);
    const totalResolved = filteredMetrics.reduce((sum, m) => sum + m.resolved, 0);
    const avgResolutionTime = filteredMetrics.reduce((sum, m) => sum + m.avgResolutionTime, 0) / filteredMetrics.length;
    const avgResponseTime = filteredMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / filteredMetrics.length;
    const resolutionRate = totalCreated > 0 ? (totalResolved / totalCreated) * 100 : 0;
    
    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(filteredMetrics.length / 2);
    const firstHalf = filteredMetrics.slice(0, midPoint);
    const secondHalf = filteredMetrics.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, m) => sum + m.created, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, m) => sum + m.created, 0) / secondHalf.length;
    const volumeTrend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    return {
      totalCreated,
      totalResolved,
      avgResolutionTime,
      avgResponseTime,
      resolutionRate,
      volumeTrend,
      backlog: totalCreated - totalResolved,
    };
  }, [filteredMetrics]);

  // Get resolution time distribution
  const resolutionTimeDistribution = useMemo(() => {
    const ranges = [
      { label: '< 2 hours', min: 0, max: 2, count: 0 },
      { label: '2-4 hours', min: 2, max: 4, count: 0 },
      { label: '4-8 hours', min: 4, max: 8, count: 0 },
      { label: '8-24 hours', min: 8, max: 24, count: 0 },
      { label: '> 24 hours', min: 24, max: Infinity, count: 0 },
    ];
    
    filteredMetrics.forEach(m => {
      const range = ranges.find(r => m.avgResolutionTime >= r.min && m.avgResolutionTime < r.max);
      if (range) range.count += m.resolved;
    });
    
    const total = ranges.reduce((sum, r) => sum + r.count, 0);
    return ranges.map(r => ({
      ...r,
      percentage: total > 0 ? (r.count / total) * 100 : 0,
    }));
  }, [filteredMetrics]);

  const handleExportReport = useCallback(() => {
    console.log('Exporting performance report...');
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
          <p className="text-muted-foreground">
            Track ticket volume, resolution times, and team performance
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Created</CardDescription>
            <CardTitle className="text-3xl">{summaryStats.totalCreated}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              {summaryStats.volumeTrend >= 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-green-600">
                    +{summaryStats.volumeTrend.toFixed(1)}% from previous period
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 mr-1 text-red-600" />
                  <span className="text-red-600">
                    {summaryStats.volumeTrend.toFixed(1)}% from previous period
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Resolved</CardDescription>
            <CardTitle className="text-3xl">{summaryStats.totalResolved}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {summaryStats.resolutionRate.toFixed(1)}% resolution rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Resolution Time</CardDescription>
            <CardTitle className="text-3xl">
              {summaryStats.avgResolutionTime.toFixed(1)}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">
                {summaryStats.avgResponseTime.toFixed(0)}m avg response
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Backlog</CardDescription>
            <CardTitle className="text-3xl">{summaryStats.backlog}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              {summaryStats.backlog > 20 ? (
                <>
                  <AlertTriangle className="w-4 h-4 mr-1 text-orange-600" />
                  <span className="text-orange-600">High backlog</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-green-600">Manageable</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">
            <LineChart className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="benchmarks">
            <Target className="w-4 h-4 mr-2" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="categories">
            <BarChart3 className="w-4 h-4 mr-2" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <Activity className="w-4 h-4 mr-2" />
            Distribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ticket Volume Trend</CardTitle>
                  <CardDescription>Created vs Resolved over time</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedMetric === 'volume' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMetric('volume')}
                  >
                    Volume
                  </Button>
                  <Button
                    variant={selectedMetric === 'resolution' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMetric('resolution')}
                  >
                    Resolution Time
                  </Button>
                  <Button
                    variant={selectedMetric === 'response' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedMetric('response')}
                  >
                    Response Time
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedMetric === 'volume' && (
                <div className="space-y-4">
                  {filteredMetrics.map((metric, index) => {
                    const maxValue = Math.max(...filteredMetrics.map(m => Math.max(m.created, m.resolved)));
                    const createdWidth = (metric.created / maxValue) * 100;
                    const resolvedWidth = (metric.resolved / maxValue) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(metric.date), 'MMM dd')}
                          </span>
                          <div className="flex gap-4">
                            <span className="text-blue-600">Created: {metric.created}</span>
                            <span className="text-green-600">Resolved: {metric.resolved}</span>
                          </div>
                        </div>
                        <div className="relative h-8 flex gap-1">
                          <div
                            className="h-full bg-blue-200 dark:bg-blue-900 rounded"
                            style={{ width: `${createdWidth}%` }}
                          />
                          <div
                            className="h-full bg-green-200 dark:bg-green-900 rounded"
                            style={{ width: `${resolvedWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedMetric === 'resolution' && (
                <div className="space-y-4">
                  {filteredMetrics.map((metric, index) => {
                    const maxValue = Math.max(...filteredMetrics.map(m => m.avgResolutionTime));
                    const width = (metric.avgResolutionTime / maxValue) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(metric.date), 'MMM dd')}
                          </span>
                          <span>{metric.avgResolutionTime.toFixed(1)} hours</span>
                        </div>
                        <Progress value={width} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedMetric === 'response' && (
                <div className="space-y-4">
                  {filteredMetrics.map((metric, index) => {
                    const maxValue = Math.max(...filteredMetrics.map(m => m.avgResponseTime));
                    const width = (metric.avgResponseTime / maxValue) * 100;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {format(new Date(metric.date), 'MMM dd')}
                          </span>
                          <span>{metric.avgResponseTime.toFixed(0)} minutes</span>
                        </div>
                        <Progress value={width} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_BENCHMARKS.map((benchmark, index) => {
              const progress = (benchmark.current / benchmark.target) * 100;
              const isAboveTarget = benchmark.current >= benchmark.target;
              
              return (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{benchmark.metric}</CardTitle>
                      <Badge variant={isAboveTarget ? 'default' : 'secondary'}>
                        {isAboveTarget ? 'On Target' : 'Below Target'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{benchmark.current}</span>
                      <span className="text-muted-foreground">{benchmark.unit}</span>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          Target: {benchmark.target} {benchmark.unit}
                        </span>
                        <span className="text-sm font-medium">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>
                    
                    <div className="flex items-center text-sm pt-2 border-t">
                      {benchmark.trend === 'up' ? (
                        <>
                          <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                          <span className="text-green-600">
                            +{benchmark.trendValue.toFixed(1)}% this period
                          </span>
                        </>
                      ) : benchmark.trend === 'down' ? (
                        <>
                          <TrendingDown className="w-4 h-4 mr-1 text-blue-600" />
                          <span className="text-blue-600">
                            -{benchmark.trendValue.toFixed(1)}% this period
                          </span>
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4 mr-1 text-gray-600" />
                          <span className="text-gray-600">
                            ±{benchmark.trendValue.toFixed(1)}% this period
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Category</CardTitle>
              <CardDescription>Resolution time and satisfaction rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_CATEGORY_PERFORMANCE
                  .sort((a, b) => b.ticketCount - a.ticketCount)
                  .map((category, index) => (
                    <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{category.ticketCount}</Badge>
                          <span className="font-medium">{category.category}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>{category.avgResolutionTime.toFixed(1)}h</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span className={
                              category.satisfactionRate >= 90 ? 'text-green-600' :
                              category.satisfactionRate >= 80 ? 'text-blue-600' :
                              'text-orange-600'
                            }>
                              {category.satisfactionRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Resolution Time</div>
                          <Progress 
                            value={(category.avgResolutionTime / 10) * 100} 
                            className="h-1.5"
                          />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Satisfaction</div>
                          <Progress 
                            value={category.satisfactionRate} 
                            className="h-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolution Time Distribution</CardTitle>
              <CardDescription>Tickets resolved by time range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolutionTimeDistribution.map((range, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{range.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{range.count} tickets</span>
                        <span className="font-medium">{range.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress value={range.percentage} className="h-2" />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Based on {summaryStats.totalResolved} resolved tickets in selected period
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Daily Average</div>
                  <div className="text-2xl font-bold">
                    {(summaryStats.totalCreated / filteredMetrics.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">tickets created</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Daily Resolved</div>
                  <div className="text-2xl font-bold">
                    {(summaryStats.totalResolved / filteredMetrics.length).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">tickets resolved</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Peak Day</div>
                  <div className="text-2xl font-bold">
                    {Math.max(...filteredMetrics.map(m => m.created))}
                  </div>
                  <div className="text-xs text-muted-foreground">tickets created</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Best Resolution</div>
                  <div className="text-2xl font-bold">
                    {Math.min(...filteredMetrics.map(m => m.avgResolutionTime)).toFixed(1)}h
                  </div>
                  <div className="text-xs text-muted-foreground">fastest time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

PerformanceMetrics.displayName = 'PerformanceMetrics';

export default PerformanceMetrics;
