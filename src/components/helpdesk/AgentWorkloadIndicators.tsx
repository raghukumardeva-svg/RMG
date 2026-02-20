import React, { useState, useMemo, useCallback } from 'react';
import {
  Users,
  User,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart,
  RefreshCw,
  UserPlus,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

interface AgentWorkload {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'available' | 'busy' | 'offline';
  activeTickets: number;
  maxCapacity: number;
  ticketsByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  avgResponseTime: number; // in minutes
  avgResolutionTime: number; // in hours
  completionRate: number; // percentage
  todayAssigned: number;
  todayResolved: number;
  categories: string[];
}

interface TeamMetrics {
  totalAgents: number;
  availableAgents: number;
  totalActiveTickets: number;
  avgCapacityUtilization: number;
  ticketsPerAgent: number;
  recommendedReassignment: number;
}

interface AgentWorkloadIndicatorsProps {
  className?: string;
}

// Mock agent data
const MOCK_AGENTS: AgentWorkload[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    status: 'available',
    activeTickets: 8,
    maxCapacity: 15,
    ticketsByPriority: { urgent: 2, high: 3, medium: 2, low: 1 },
    avgResponseTime: 25,
    avgResolutionTime: 3.5,
    completionRate: 92,
    todayAssigned: 3,
    todayResolved: 5,
    categories: ['Authentication', 'Network', 'Hardware'],
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    status: 'busy',
    activeTickets: 14,
    maxCapacity: 15,
    ticketsByPriority: { urgent: 3, high: 5, medium: 4, low: 2 },
    avgResponseTime: 35,
    avgResolutionTime: 4.2,
    completionRate: 88,
    todayAssigned: 4,
    todayResolved: 3,
    categories: ['Infrastructure', 'Email', 'Security'],
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob.johnson@company.com',
    status: 'available',
    activeTickets: 5,
    maxCapacity: 12,
    ticketsByPriority: { urgent: 0, high: 2, medium: 2, low: 1 },
    avgResponseTime: 20,
    avgResolutionTime: 2.8,
    completionRate: 95,
    todayAssigned: 2,
    todayResolved: 6,
    categories: ['Account Management', 'Licensing', 'Software'],
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice.williams@company.com',
    status: 'available',
    activeTickets: 10,
    maxCapacity: 15,
    ticketsByPriority: { urgent: 1, high: 4, medium: 3, low: 2 },
    avgResponseTime: 30,
    avgResolutionTime: 3.9,
    completionRate: 90,
    todayAssigned: 5,
    todayResolved: 4,
    categories: ['Database', 'Applications', 'API'],
  },
  {
    id: '5',
    name: 'Charlie Brown',
    email: 'charlie.brown@company.com',
    status: 'offline',
    activeTickets: 3,
    maxCapacity: 10,
    ticketsByPriority: { urgent: 0, high: 1, medium: 1, low: 1 },
    avgResponseTime: 45,
    avgResolutionTime: 5.1,
    completionRate: 85,
    todayAssigned: 0,
    todayResolved: 2,
    categories: ['General Support'],
  },
];

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900',
    dotColor: 'bg-green-600',
  },
  busy: {
    label: 'Busy',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    dotColor: 'bg-orange-600',
  },
  offline: {
    label: 'Offline',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-600',
  },
};

export const AgentWorkloadIndicators = React.memo<AgentWorkloadIndicatorsProps>(({ className = '' }) => {
  const [agents] = useState<AgentWorkload[]>(MOCK_AGENTS);
  const [sortBy, setSortBy] = useState<'workload' | 'performance' | 'name'>('workload');

  // Calculate team metrics
  const teamMetrics = useMemo((): TeamMetrics => {
    const totalAgents = agents.length;
    const availableAgents = agents.filter(a => a.status === 'available').length;
    const totalActiveTickets = agents.reduce((sum, a) => sum + a.activeTickets, 0);
    const totalCapacity = agents.reduce((sum, a) => sum + a.maxCapacity, 0);
    const usedCapacity = agents.reduce((sum, a) => sum + a.activeTickets, 0);
    const avgCapacityUtilization = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;
    const ticketsPerAgent = totalAgents > 0 ? Math.round(totalActiveTickets / totalAgents) : 0;

    // Find tickets that should be reassigned (from busy agents to available agents)
    const busyAgents = agents.filter(a => a.status === 'busy');
    const availableCapacity = agents
      .filter(a => a.status === 'available')
      .reduce((sum, a) => sum + (a.maxCapacity - a.activeTickets), 0);
    const overloadedTickets = busyAgents.reduce((sum, a) => {
      const overload = Math.max(0, a.activeTickets - a.maxCapacity + 2); // Keep 2 slot buffer
      return sum + overload;
    }, 0);
    const recommendedReassignment = Math.min(overloadedTickets, availableCapacity);

    return {
      totalAgents,
      availableAgents,
      totalActiveTickets,
      avgCapacityUtilization,
      ticketsPerAgent,
      recommendedReassignment,
    };
  }, [agents]);

  // Sort agents
  const sortedAgents = useMemo(() => {
    const sorted = [...agents];
    switch (sortBy) {
      case 'workload':
        return sorted.sort((a, b) => {
          const aUtil = (a.activeTickets / a.maxCapacity) * 100;
          const bUtil = (b.activeTickets / b.maxCapacity) * 100;
          return bUtil - aUtil;
        });
      case 'performance':
        return sorted.sort((a, b) => b.completionRate - a.completionRate);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }, [agents, sortBy]);

  // Get workload recommendations
  const getWorkloadRecommendation = useCallback((agent: AgentWorkload): {
    type: 'overloaded' | 'optimal' | 'underutilized';
    message: string;
  } => {
    const utilization = (agent.activeTickets / agent.maxCapacity) * 100;
    
    if (utilization >= 90) {
      return {
        type: 'overloaded',
        message: 'Consider reassigning some tickets',
      };
    }
    if (utilization < 40) {
      return {
        type: 'underutilized',
        message: 'Can take more tickets',
      };
    }
    return {
      type: 'optimal',
      message: 'Workload balanced',
    };
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    toast.success('Workload data refreshed');
  }, []);

  // Handle auto-balance
  const handleAutoBalance = useCallback(() => {
    if (teamMetrics.recommendedReassignment > 0) {
      toast.success(`Reassigning ${teamMetrics.recommendedReassignment} tickets for better distribution`);
    } else {
      toast.info('Team workload is already balanced');
    }
  }, [teamMetrics.recommendedReassignment]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Agent Workload Indicators</h2>
          <p className="text-muted-foreground">
            Monitor team capacity and optimize ticket distribution
          </p>
        </div>
        
        <div className="flex gap-2">
          {teamMetrics.recommendedReassignment > 0 && (
            <Button onClick={handleAutoBalance} className="gap-2">
              <Zap className="w-4 h-4" />
              Auto-Balance ({teamMetrics.recommendedReassignment})
            </Button>
          )}
          
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Team Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Agents</CardDescription>
            <CardTitle className="text-3xl">{teamMetrics.totalAgents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <Users className="w-4 h-4 mr-1" />
              {teamMetrics.availableAgents} available
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Tickets</CardDescription>
            <CardTitle className="text-3xl">{teamMetrics.totalActiveTickets}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {teamMetrics.ticketsPerAgent} per agent average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Capacity Utilization</CardDescription>
            <CardTitle className="text-3xl">
              {teamMetrics.avgCapacityUtilization}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={teamMetrics.avgCapacityUtilization} className="h-2" />
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              {teamMetrics.avgCapacityUtilization > 80 ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-1 text-orange-600" />
                  <span className="text-orange-600">High utilization</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                  <span className="text-green-600">Healthy capacity</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rebalance Suggestions</CardDescription>
            <CardTitle className="text-3xl">
              {teamMetrics.recommendedReassignment}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {teamMetrics.recommendedReassignment > 0 
                ? 'Tickets to reassign'
                : 'Workload balanced'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="details">
              <User className="w-4 h-4 mr-2" />
              Detailed View
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <PieChart className="w-4 h-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant={sortBy === 'workload' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('workload')}
            >
              By Workload
            </Button>
            <Button
              variant={sortBy === 'performance' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('performance')}
            >
              By Performance
            </Button>
            <Button
              variant={sortBy === 'name' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('name')}
            >
              By Name
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedAgents.map((agent) => {
              const utilization = Math.round((agent.activeTickets / agent.maxCapacity) * 100);
              const statusConfig = STATUS_CONFIG[agent.status];
              const recommendation = getWorkloadRecommendation(agent);

              return (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={agent.avatar} />
                          <AvatarFallback>
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <CardDescription>{agent.email}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-1`} />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Workload Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Workload: {agent.activeTickets}/{agent.maxCapacity}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {utilization}%
                        </span>
                      </div>
                      <Progress 
                        value={utilization} 
                        className={`h-2 ${
                          utilization >= 90 ? '[&>div]:bg-red-600' :
                          utilization >= 70 ? '[&>div]:bg-orange-600' :
                          '[&>div]:bg-green-600'
                        }`}
                      />
                      <p className={`text-xs mt-1 ${
                        recommendation.type === 'overloaded' ? 'text-red-600' :
                        recommendation.type === 'underutilized' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {recommendation.message}
                      </p>
                    </div>

                    {/* Priority Breakdown */}
                    <div>
                      <div className="text-sm font-medium mb-2">Tickets by Priority</div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground">Urgent</div>
                          <div className="text-lg font-bold text-red-600">
                            {agent.ticketsByPriority.urgent}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">High</div>
                          <div className="text-lg font-bold text-orange-600">
                            {agent.ticketsByPriority.high}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Medium</div>
                          <div className="text-lg font-bold text-blue-600">
                            {agent.ticketsByPriority.medium}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Low</div>
                          <div className="text-lg font-bold text-gray-600">
                            {agent.ticketsByPriority.low}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Today's Activity */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <UserPlus className="w-4 h-4" />
                        <span>Today: +{agent.todayAssigned}</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Resolved: {agent.todayResolved}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Active Tickets</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Avg Response</TableHead>
                    <TableHead>Avg Resolution</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Categories</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAgents.map((agent) => {
                    const utilization = Math.round((agent.activeTickets / agent.maxCapacity) * 100);
                    const statusConfig = STATUS_CONFIG[agent.status];

                    return (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={agent.avatar} />
                              <AvatarFallback className="text-xs">
                                {agent.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              <div className="text-xs text-muted-foreground">{agent.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                            <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} mr-1`} />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{agent.activeTickets}</span>
                            <Badge variant="secondary" className="text-xs">
                              U:{agent.ticketsByPriority.urgent} H:{agent.ticketsByPriority.high}
                            </Badge>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Progress value={utilization} className="h-1 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">
                                {utilization}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {agent.activeTickets}/{agent.maxCapacity}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm">{agent.avgResponseTime} min</span>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm">{agent.avgResolutionTime.toFixed(1)} hrs</span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{agent.completionRate}%</span>
                            {agent.completionRate >= 90 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : agent.completionRate < 80 ? (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            ) : (
                              <Activity className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {agent.categories.slice(0, 2).map(cat => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {agent.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{agent.categories.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Workload Distribution</CardTitle>
                <CardDescription>Tickets per agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedAgents.map((agent) => {
                    const utilization = (agent.activeTickets / agent.maxCapacity) * 100;
                    return (
                      <div key={agent.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-muted-foreground">
                            {agent.activeTickets} tickets
                          </span>
                        </div>
                        <Progress value={utilization} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sortedAgents
                    .sort((a, b) => b.completionRate - a.completionRate)
                    .map((agent) => (
                      <div key={agent.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-muted-foreground">
                            {agent.completionRate}%
                          </span>
                        </div>
                        <Progress value={agent.completionRate} className="h-2" />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

AgentWorkloadIndicators.displayName = 'AgentWorkloadIndicators';

export default AgentWorkloadIndicators;
