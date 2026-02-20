import React, { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  Calendar,
  Download,
  RefreshCw,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow, format, differenceInHours } from 'date-fns';
import type { HelpdeskTicket } from '@/types/helpdeskNew';

interface SLATicket {
  id: string;
  ticketNumber: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
  category: string;
  assignedTo: string;
  createdAt: string;
  responseDeadline: string;
  resolutionDeadline: string;
  firstResponseAt?: string;
  resolvedAt?: string;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
  breachType?: 'response' | 'resolution' | 'both';
}

interface SLAMetrics {
  totalTickets: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  complianceRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

interface SLAComplianceDashboardProps {
  className?: string;
  tickets?: HelpdeskTicket[]; // Real tickets from parent component
}

// Mock SLA data
const MOCK_TICKETS: SLATicket[] = [
  {
    id: '1',
    ticketNumber: 'TKT-001',
    subject: 'Login issues with company portal',
    priority: 'high',
    status: 'in_progress',
    category: 'Authentication',
    assignedTo: 'John Doe',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    responseDeadline: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    resolutionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    slaStatus: 'on_track',
  },
  {
    id: '2',
    ticketNumber: 'TKT-002',
    subject: 'System outage - Production environment',
    priority: 'urgent',
    status: 'in_progress',
    category: 'Infrastructure',
    assignedTo: 'Jane Smith',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    responseDeadline: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    resolutionDeadline: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    slaStatus: 'at_risk',
  },
  {
    id: '3',
    ticketNumber: 'TKT-003',
    subject: 'Password reset request',
    priority: 'low',
    status: 'open',
    category: 'Account Management',
    assignedTo: 'Bob Johnson',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    responseDeadline: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    resolutionDeadline: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    slaStatus: 'breached',
    breachType: 'response',
  },
  {
    id: '4',
    ticketNumber: 'TKT-004',
    subject: 'Email delivery delays',
    priority: 'medium',
    status: 'pending',
    category: 'Email',
    assignedTo: 'Alice Williams',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    responseDeadline: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    resolutionDeadline: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    slaStatus: 'breached',
    breachType: 'resolution',
  },
  {
    id: '5',
    ticketNumber: 'TKT-005',
    subject: 'Software license activation',
    priority: 'medium',
    status: 'resolved',
    category: 'Licensing',
    assignedTo: 'John Doe',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    responseDeadline: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    resolutionDeadline: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    firstResponseAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    slaStatus: 'on_track',
  },
];

const PRIORITY_COLORS: Record<SLATicket['priority'], string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const SLA_STATUS_CONFIG = {
  on_track: {
    label: 'On Track',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    icon: CheckCircle2,
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    icon: AlertTriangle,
  },
  breached: {
    label: 'Breached',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900',
    icon: XCircle,
  },
};

// Convert HelpdeskTicket to SLATicket format
const convertToSLATicket = (ticket: HelpdeskTicket): SLATicket => {
  const now = Date.now();
  const createdTime = new Date(ticket.createdAt).getTime();
  const approvalDeadline = ticket.sla?.approvalDeadline ? new Date(ticket.sla.approvalDeadline).getTime() : now + 1000 * 60 * 60 * 24;
  const processingDeadline = ticket.sla?.processingDeadline ? new Date(ticket.sla.processingDeadline).getTime() : now + 1000 * 60 * 60 * 48;
  
  // Determine which deadline to use based on ticket state
  const isApprovalPending = ticket.requiresApproval && !ticket.approvalCompleted;
  const relevantDeadline = isApprovalPending ? approvalDeadline : processingDeadline;
  
  // Calculate SLA status
  let slaStatus: 'on_track' | 'at_risk' | 'breached' = 'on_track';
  let breachType: 'response' | 'resolution' | 'both' | undefined;
  
  // Check if breached
  if (ticket.sla?.isOverdue || now > relevantDeadline) {
    slaStatus = 'breached';
    breachType = isApprovalPending ? 'response' : 'resolution';
  } else {
    // Check if at risk (within 25% of deadline)
    const timeElapsed = now - createdTime;
    const totalTime = relevantDeadline - createdTime;
    if (totalTime > 0 && (timeElapsed / totalTime) > 0.75) {
      slaStatus = 'at_risk';
    }
  }
  
  // Map urgency levels
  const urgencyMap: Record<string, 'low' | 'medium' | 'high' | 'urgent'> = {
    'Low': 'low',
    'Medium': 'medium',
    'High': 'high',
    'Critical': 'urgent'
  };
  
  // Get first response time (from conversation or assignment)
  const firstResponseAt = ticket.conversation && ticket.conversation.length > 0
    ? ticket.conversation.find(c => c.sender !== 'employee')?.timestamp
    : ticket.assignment?.assignedAt;
  
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    priority: urgencyMap[ticket.urgency] || 'medium',
    status: ticket.status.toLowerCase().replace(/ /g, '_') as any,
    category: ticket.subCategory,
    assignedTo: ticket.assignment?.assignedToName || ticket.assignment?.assignedTo || 'Unassigned',
    createdAt: ticket.createdAt,
    responseDeadline: ticket.sla?.approvalDeadline || new Date(now + 1000 * 60 * 60 * 2).toISOString(),
    resolutionDeadline: ticket.sla?.processingDeadline || new Date(now + 1000 * 60 * 60 * 24).toISOString(),
    firstResponseAt,
    resolvedAt: ticket.closedAt || ticket.completedAt,
    slaStatus,
    breachType
  };
};

export const SLAComplianceDashboard = React.memo<SLAComplianceDashboardProps>(({ className = '', tickets: realTickets = [] }) => {
  // Convert real tickets to SLA format, fallback to mock if no tickets provided
  const slaTickets = useMemo(() => {
    if (realTickets.length > 0) {
      return realTickets
        .filter(t => t.status !== 'Draft' && t.status !== 'Cancelled')
        .map(convertToSLATicket);
    }
    return MOCK_TICKETS;
  }, [realTickets]);
  
  const [tickets] = useState<SLATicket[]>(slaTickets);
  const [statusFilter] = useState<'all' | SLATicket['slaStatus']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | SLATicket['priority']>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Calculate SLA metrics
  const metrics = useMemo((): SLAMetrics => {
    const totalTickets = tickets.length;
    const onTrack = tickets.filter(t => t.slaStatus === 'on_track').length;
    const atRisk = tickets.filter(t => t.slaStatus === 'at_risk').length;
    const breached = tickets.filter(t => t.slaStatus === 'breached').length;
    const complianceRate = totalTickets > 0 ? Math.round((onTrack / totalTickets) * 100) : 0;

    // Calculate average response time (in minutes)
    const ticketsWithResponse = tickets.filter(t => t.firstResponseAt);
    const avgResponseTime = ticketsWithResponse.length > 0
      ? ticketsWithResponse.reduce((sum, t) => {
          const responseTime = new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime();
          return sum + responseTime / (1000 * 60);
        }, 0) / ticketsWithResponse.length
      : 0;

    // Calculate average resolution time (in hours)
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    const avgResolutionTime = resolvedTickets.length > 0
      ? resolvedTickets.reduce((sum, t) => {
          const resolutionTime = new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime();
          return sum + resolutionTime / (1000 * 60 * 60);
        }, 0) / resolvedTickets.length
      : 0;

    return {
      totalTickets,
      onTrack,
      atRisk,
      breached,
      complianceRate,
      avgResponseTime,
      avgResolutionTime,
    };
  }, [tickets]);

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesStatus = statusFilter === 'all' || ticket.slaStatus === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      return matchesStatus && matchesPriority;
    });
  }, [tickets, statusFilter, priorityFilter]);

  // Calculate time remaining percentage
  const getTimeRemainingPercentage = useCallback((ticket: SLATicket): number => {
    const now = Date.now();
    const created = new Date(ticket.createdAt).getTime();
    const deadline = new Date(ticket.resolutionDeadline).getTime();
    const total = deadline - created;
    const elapsed = now - created;
    const remaining = Math.max(0, 100 - (elapsed / total) * 100);
    return Math.round(remaining);
  }, []);

  // Get time remaining display
  const getTimeRemainingDisplay = useCallback((deadline: string): string => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff < 0) {
      return `Overdue by ${formatDistanceToNow(deadlineDate)}`;
    }

    const hours = differenceInHours(deadlineDate, now);
    if (hours < 1) {
      const minutes = Math.round(diff / (1000 * 60));
      return `${minutes}m remaining`;
    }
    if (hours < 24) {
      return `${hours}h remaining`;
    }
    return formatDistanceToNow(deadlineDate, { addSuffix: true });
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    toast.success('Dashboard refreshed');
  }, []);

  // Handle export
  const handleExport = useCallback(() => {
    toast.success('Exporting SLA report...');
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SLA Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor service level agreements and track breach alerts
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tickets</CardDescription>
            <CardTitle className="text-3xl">{metrics.totalTickets}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="w-4 h-4 mr-1" />
              Active monitoring
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Rate</CardDescription>
            <CardTitle className="text-3xl text-green-600">{metrics.complianceRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={metrics.complianceRate} className="h-2" />
            <div className="flex items-center text-sm text-green-600 mt-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              {metrics.onTrack} tickets on track
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>At Risk</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{metrics.atRisk}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Breached</CardDescription>
            <CardTitle className="text-3xl text-red-600">{metrics.breached}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="w-4 h-4 mr-1" />
              SLA violations
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Response & Resolution Times */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Response Time</CardTitle>
            <CardDescription>Time to first response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.round(metrics.avgResponseTime)} min
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Target: 60 minutes for high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Resolution Time</CardTitle>
            <CardDescription>Time to ticket closure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics.avgResolutionTime.toFixed(1)} hrs
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Target: 4 hours for urgent issues
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">
              All Tickets
              <Badge className="ml-2">{tickets.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="at_risk">
              At Risk
              <Badge className="ml-2 bg-orange-100 text-orange-800">{metrics.atRisk}</Badge>
            </TabsTrigger>
            <TabsTrigger value="breached">
              Breached
              <Badge className="ml-2 bg-red-100 text-red-800">{metrics.breached}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <SLATicketsTable 
            tickets={filteredTickets} 
            getTimeRemainingPercentage={getTimeRemainingPercentage}
            getTimeRemainingDisplay={getTimeRemainingDisplay}
          />
        </TabsContent>

        <TabsContent value="at_risk" className="space-y-4">
          <SLATicketsTable 
            tickets={filteredTickets.filter(t => t.slaStatus === 'at_risk')} 
            getTimeRemainingPercentage={getTimeRemainingPercentage}
            getTimeRemainingDisplay={getTimeRemainingDisplay}
          />
        </TabsContent>

        <TabsContent value="breached" className="space-y-4">
          <SLATicketsTable 
            tickets={filteredTickets.filter(t => t.slaStatus === 'breached')} 
            getTimeRemainingPercentage={getTimeRemainingPercentage}
            getTimeRemainingDisplay={getTimeRemainingDisplay}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
});

SLAComplianceDashboard.displayName = 'SLAComplianceDashboard';

// SLA Tickets Table Component
interface SLATicketsTableProps {
  tickets: SLATicket[];
  getTimeRemainingPercentage: (ticket: SLATicket) => number;
  getTimeRemainingDisplay: (deadline: string) => string;
}

const SLATicketsTable: React.FC<SLATicketsTableProps> = ({ 
  tickets, 
  getTimeRemainingPercentage,
  getTimeRemainingDisplay 
}) => {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No tickets match the current filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>SLA Status</TableHead>
              <TableHead>Time Remaining</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const statusConfig = SLA_STATUS_CONFIG[ticket.slaStatus];
              const StatusIcon = statusConfig.icon;
              const timeRemaining = getTimeRemainingPercentage(ticket);
              const timeDisplay = getTimeRemainingDisplay(ticket.resolutionDeadline);

              return (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ticket.ticketNumber}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {ticket.subject}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge className={PRIORITY_COLORS[ticket.priority]}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>{ticket.assignedTo}</TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {ticket.breachType && (
                        <span className="text-xs text-muted-foreground">
                          ({ticket.breachType})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={timeRemaining} 
                          className={`h-2 flex-1 ${
                            timeRemaining < 25 ? '[&>div]:bg-red-600' : 
                            timeRemaining < 50 ? '[&>div]:bg-orange-600' : 
                            '[&>div]:bg-green-600'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground w-8">
                          {timeRemaining}%
                        </span>
                      </div>
                      <div className={`text-xs ${
                        timeDisplay.includes('Overdue') ? 'text-red-600 font-medium' :
                        timeDisplay.includes('m remaining') || timeDisplay.includes('h remaining') && parseInt(timeDisplay) < 2 ? 'text-orange-600' :
                        'text-muted-foreground'
                      }`}>
                        {timeDisplay}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(ticket.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SLAComplianceDashboard;
