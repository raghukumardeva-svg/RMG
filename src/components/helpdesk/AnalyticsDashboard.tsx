import React, { useMemo, useState, useCallback } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart,
} from 'recharts';
import {
    Calendar,
    Clock,
    TrendingUp,
    Users,
    AlertTriangle,
    CheckCircle,
    Timer,
    Target,
    Filter,
    Download,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import type { HelpdeskTicket } from '@/types/helpdesk';
import { useHelpdeskStoreEnhanced } from '@/store/helpdeskStoreEnhanced';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface AnalyticsDashboardProps {
    className?: string;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    icon: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}

interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

type TimeRange = '7d' | '30d' | '90d' | 'custom';
type MetricType = 'tickets' | 'resolution' | 'satisfaction' | 'workload';

const COLORS = {
    blue: '#3B82F6',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
    purple: '#8B5CF6',
    gray: '#6B7280',
};

const STATUS_COLORS = {
    Open: COLORS.blue,
    'In Progress': COLORS.yellow,
    Resolved: COLORS.green,
    Closed: COLORS.gray,
    Cancelled: COLORS.red,
};

const PRIORITY_COLORS = {
    Low: COLORS.green,
    Medium: COLORS.blue,
    High: COLORS.yellow,
    Critical: COLORS.red,
};

export const AnalyticsDashboard = React.memo<AnalyticsDashboardProps>(({ className = '' }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('tickets');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { tickets, analytics } = useHelpdeskStoreEnhanced();

    // Calculate date range for filtering
    const effectiveDateRange = useMemo(() => {
        if (timeRange === 'custom' && dateRange?.from && dateRange?.to) {
            return { from: dateRange.from, to: dateRange.to };
        }

        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
        }[timeRange] || 30;

        return {
            from: startOfDay(subDays(new Date(), days)),
            to: endOfDay(new Date()),
        };
    }, [timeRange, dateRange]);

    // Filter tickets by date range
    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            return ticketDate >= effectiveDateRange.from && ticketDate <= effectiveDateRange.to;
        });
    }, [tickets, effectiveDateRange]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const totalTickets = filteredTickets.length;
        const resolvedTickets = filteredTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
        const openTickets = filteredTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
        const criticalTickets = filteredTickets.filter(t => t.urgency === 'Critical').length;

        // Calculate resolution rate
        const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;

        // Calculate average resolution time (mock calculation)
        const avgResolutionHours = resolvedTickets > 0 ?
            filteredTickets
                .filter(t => t.status === 'Resolved' || t.status === 'Closed')
                .reduce((sum, ticket) => {
                    const created = new Date(ticket.createdAt);
                    const resolved = new Date(ticket.updatedAt || ticket.createdAt);
                    return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60)
                }, 0) / resolvedTickets : 0;

        // Previous period for trend calculation (simplified)
        const prevPeriodTickets = tickets.filter(ticket => {
            const ticketDate = new Date(ticket.createdAt);
            const periodLength = effectiveDateRange.to.getTime() - effectiveDateRange.from.getTime();
            const prevStart = new Date(effectiveDateRange.from.getTime() - periodLength);
            const prevEnd = effectiveDateRange.from;
            return ticketDate >= prevStart && ticketDate < prevEnd;
        }).length;

        const ticketsTrend = prevPeriodTickets > 0 ?
            ((totalTickets - prevPeriodTickets) / prevPeriodTickets) * 100 : 0;

        return {
            totalTickets,
            openTickets,
            resolvedTickets,
            criticalTickets,
            resolutionRate,
            avgResolutionHours,
            ticketsTrend,
        };
    }, [filteredTickets, tickets, effectiveDateRange]);

    // Chart data
    const statusDistribution: ChartData[] = useMemo(() => {
        const statusCounts = filteredTickets.reduce((acc, ticket) => {
            acc[ticket.status] = (acc[ticket.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(statusCounts).map(([status, count]) => ({
            name: status,
            value: count,
        }));
    }, [filteredTickets]);

    const priorityDistribution: ChartData[] = useMemo(() => {
        const priorityCounts = filteredTickets.reduce((acc, ticket) => {
            acc[ticket.urgency] = (acc[ticket.urgency] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(priorityCounts).map(([priority, count]) => ({
            name: priority,
            value: count,
        }));
    }, [filteredTickets]);

    // Tickets over time (daily)
    const ticketTrend: ChartData[] = useMemo(() => {
        const days = {};

        // Initialize all days in range
        for (let d = new Date(effectiveDateRange.from); d <= effectiveDateRange.to; d.setDate(d.getDate() + 1)) {
            const dateKey = format(d, 'MMM dd');
            days[dateKey] = { created: 0, resolved: 0 };
        }

        // Count tickets by day
        filteredTickets.forEach(ticket => {
            const createdDay = format(new Date(ticket.createdAt), 'MMM dd');
            if (days[createdDay]) {
                days[createdDay].created++;
            }

            if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
                const resolvedDay = format(new Date(ticket.updatedAt || ticket.createdAt), 'MMM dd');
                if (days[resolvedDay]) {
                    days[resolvedDay].resolved++;
                }
            }
        });

        return Object.entries(days).map(([date, counts]) => ({
            name: date,
            created: counts.created,
            resolved: counts.resolved,
        }));
    }, [filteredTickets, effectiveDateRange]);

    // Team performance
    const teamPerformance: ChartData[] = useMemo(() => {
        const assigneeCounts = filteredTickets.reduce((acc, ticket) => {
            const assignee = ticket.assignedTo || 'Unassigned';
            if (!acc[assignee]) {
                acc[assignee] = { total: 0, resolved: 0 };
            }
            acc[assignee].total++;
            if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
                acc[assignee].resolved++;
            }
            return acc;
        }, {} as Record<string, { total: number; resolved: number }>);

        return Object.entries(assigneeCounts)
            .map(([assignee, counts]) => ({
                name: assignee.split('.').map(n => n.charAt(0).toUpperCase() + n.slice(1)).join(' '),
                total: counts.total,
                resolved: counts.resolved,
                rate: counts.total > 0 ? (counts.resolved / counts.total) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [filteredTickets]);

    // Handlers
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    }, []);

    const handleExportData = useCallback(() => {
        const exportData = {
            metrics,
            statusDistribution,
            priorityDistribution,
            ticketTrend,
            teamPerformance,
            dateRange: effectiveDateRange,
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `helpdesk-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [metrics, statusDistribution, priorityDistribution, ticketTrend, teamPerformance, effectiveDateRange]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor helpdesk performance and ticket trends
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-1"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                        className="gap-1"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Time Range Controls */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Time Range:</span>
                </div>

                <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="custom">Custom range</SelectItem>
                    </SelectContent>
                </Select>

                {timeRange === 'custom' && (
                    <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                        className="w-[280px]"
                    />
                )}
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Tickets"
                    value={metrics.totalTickets}
                    subtitle={`${metrics.openTickets} active`}
                    trend={{
                        value: Math.abs(metrics.ticketsTrend),
                        isPositive: metrics.ticketsTrend >= 0,
                    }}
                    icon={<Target className="w-4 h-4" />}
                    color="blue"
                />

                <MetricCard
                    title="Resolution Rate"
                    value={`${metrics.resolutionRate.toFixed(1)}%`}
                    subtitle={`${metrics.resolvedTickets} resolved`}
                    icon={<CheckCircle className="w-4 h-4" />}
                    color="green"
                />

                <MetricCard
                    title="Avg Resolution Time"
                    value={`${metrics.avgResolutionHours.toFixed(1)}h`}
                    subtitle="Time to resolve"
                    icon={<Clock className="w-4 h-4" />}
                    color="purple"
                />

                <MetricCard
                    title="Critical Issues"
                    value={metrics.criticalTickets}
                    subtitle="High priority"
                    icon={<AlertTriangle className="w-4 h-4" />}
                    color="red"
                />
            </div>

            {/* Charts */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="team">Team Performance</TabsTrigger>
                    <TabsTrigger value="sla">SLA Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Status Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ticket Status Distribution</CardTitle>
                                <CardDescription>Current status breakdown</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusDistribution}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {statusDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS.gray} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Priority Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Priority Distribution</CardTitle>
                                <CardDescription>Tickets by priority level</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={priorityDistribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value">
                                            {priorityDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || COLORS.gray} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    {/* Ticket Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ticket Volume Trends</CardTitle>
                            <CardDescription>Daily ticket creation and resolution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={ticketTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="created"
                                        stroke={COLORS.blue}
                                        name="Created"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="resolved"
                                        stroke={COLORS.green}
                                        name="Resolved"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team" className="space-y-4">
                    {/* Team Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Performance</CardTitle>
                            <CardDescription>Resolution rates by team member</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teamPerformance.map((member, index) => (
                                    <div key={member.name} className="space-y-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-medium">{member.name}</span>
                                            <span className="text-muted-foreground">
                                                {member.resolved}/{member.total} ({member.rate.toFixed(0)}%)
                                            </span>
                                        </div>
                                        <Progress value={member.rate} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sla" className="space-y-4">
                    {/* SLA Metrics - Placeholder */}
                    <Card>
                        <CardHeader>
                            <CardTitle>SLA Performance</CardTitle>
                            <CardDescription>Service Level Agreement metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-muted-foreground">
                                <Timer className="w-12 h-12 mx-auto mb-4" />
                                <p>SLA tracking coming soon...</p>
                                <p className="text-sm">Integration with deadline and escalation system in progress.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
});

AnalyticsDashboard.displayName = 'AnalyticsDashboard';

// Metric Card Component
const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    subtitle,
    trend,
    icon,
    color = 'blue',
}) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
        green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
        red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300',
        purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-md ${colorClasses[color]}`}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <div className="flex items-center justify-between">
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                    {trend && (
                        <Badge
                            variant={trend.isPositive ? 'default' : 'destructive'}
                            className="text-xs"
                        >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {trend.value.toFixed(1)}%
                        </Badge>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};