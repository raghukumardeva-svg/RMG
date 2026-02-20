import { RMGAnalyticsDashboard } from '@/components/rmg/RMGAnalyticsDashboard';

export function RMGAnalytics() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Resource Management Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analytics and insights for resource utilization, allocation efficiency, skills gap analysis, and demand forecasting.
        </p>
      </div>
      <RMGAnalyticsDashboard />
    </div>
  );
}
