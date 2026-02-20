import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { SLAComplianceDashboard } from './SLAComplianceDashboard';
import AgentWorkloadIndicators from './AgentWorkloadIndicators';
import PerformanceMetrics from './PerformanceMetrics';

/**
 * Analytics Integration Example
 * 
 * This component demonstrates how to integrate all three analytics components
 * from Phase 1 Priority 3: Basic Analytics
 * 
 * Components included:
 * 1. SLA Compliance Dashboard - Track SLA metrics and breach alerts
 * 2. Agent Workload Indicators - Monitor team capacity and distribution
 * 3. Performance Metrics - Analyze ticket volume and resolution trends
 */

export const AnalyticsExample: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive helpdesk analytics - SLA tracking, agent workload, and performance metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              SLA Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 tickets at risk
            </p>
            <Badge variant="secondary" className="mt-2">
              On Track
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-muted-foreground mt-1">
              40 active tickets
            </p>
            <Badge variant="secondary" className="mt-2">
              Balanced
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2h</div>
            <p className="text-xs text-muted-foreground mt-1">
              28min avg response
            </p>
            <Badge variant="secondary" className="mt-2">
              Below Target
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Analytics Views */}
      <Tabs defaultValue="sla" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
          <TabsTrigger value="workload">Agent Workload</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="space-y-4">
          <SLAComplianceDashboard />
        </TabsContent>

        <TabsContent value="workload" className="space-y-4">
          <AgentWorkloadIndicators />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMetrics />
        </TabsContent>
      </Tabs>

      {/* Integration Documentation */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            How to use these analytics components in your helpdesk system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. SLA Compliance Dashboard</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Monitor service level agreements and track breach alerts:
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`import { SLAComplianceDashboard } from '@/components/helpdesk/SLAComplianceDashboard';

// Basic usage
<SLAComplianceDashboard />

// With custom className
<SLAComplianceDashboard className="my-4" />`}
            </pre>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p>• Real-time SLA status tracking (on_track, at_risk, breached)</p>
              <p>• Compliance rate calculation with visual indicators</p>
              <p>• Average response and resolution time metrics</p>
              <p>• Filterable ticket tables with time remaining progress bars</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Agent Workload Indicators</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Track team capacity and optimize ticket distribution:
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`import AgentWorkloadIndicators from '@/components/helpdesk/AgentWorkloadIndicators';

// Basic usage
<AgentWorkloadIndicators />

// With custom className
<AgentWorkloadIndicators className="my-4" />`}
            </pre>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p>• Active ticket count per agent with capacity utilization</p>
              <p>• Priority-based ticket breakdown (urgent, high, medium, low)</p>
              <p>• Workload recommendations (overloaded, optimal, underutilized)</p>
              <p>• Auto-balance suggestions for ticket reassignment</p>
              <p>• Performance metrics (response time, resolution time, completion rate)</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Performance Metrics</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Analyze ticket volume trends and resolution performance:
            </p>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`import PerformanceMetrics from '@/components/helpdesk/PerformanceMetrics';

// Basic usage
<PerformanceMetrics />

// With custom className
<PerformanceMetrics className="my-4" />`}
            </pre>
            <div className="mt-2 text-xs text-muted-foreground space-y-1">
              <p>• Ticket volume trends (created vs resolved over time)</p>
              <p>• Resolution and response time analysis with distribution charts</p>
              <p>• Performance benchmarks with target comparisons</p>
              <p>• Category-based performance breakdown</p>
              <p>• Time range filtering (7, 30, 90 days)</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Best Practices</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use SLA Dashboard on the main helpdesk overview page</li>
              <li>Display Agent Workload in team management views</li>
              <li>Include Performance Metrics in admin/manager dashboards</li>
              <li>Combine all three in a comprehensive analytics page (like this example)</li>
              <li>Export reports for periodic team reviews and planning</li>
              <li>Monitor SLA breaches daily to maintain service quality</li>
              <li>Use workload indicators for intelligent ticket assignment</li>
              <li>Track performance trends to identify improvement areas</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Data Integration</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Currently using mock data. To integrate with real data:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Replace MOCK_TICKETS with API calls to fetch ticket data</li>
              <li>Replace MOCK_AGENTS with API calls to fetch agent information</li>
              <li>Replace MOCK_METRICS with API calls to fetch historical data</li>
              <li>Implement WebSocket connections for real-time updates</li>
              <li>Add data refresh intervals or manual refresh buttons</li>
              <li>Cache data appropriately to improve performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsExample;
