import { Card, CardContent } from '@/components/ui/card';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface KpiItem {
  label: string;
  value: number;
  color: string;
  icon?: React.ReactNode;
}

interface HelpdeskKpiBarProps {
  title?: string;
  total?: number;
  items?: KpiItem[];
}

export function HelpdeskKpiBar({
  title = 'Total Requests',
  total = 23,
  items = [
    { label: 'In Progress', value: 12, color: '#3b82f6', icon: <Clock className="h-5 w-5" /> },
    { label: 'Resolved', value: 6, color: '#22c55e', icon: <CheckCircle2 className="h-5 w-5" /> },
    { label: 'Rejected', value: 4, color: '#ef4444', icon: <XCircle className="h-5 w-5" /> },
  ],
}: HelpdeskKpiBarProps) {
  // Calculate percentages for bar segments
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items.map((item) => ({
    ...item,
    percentage: totalValue > 0 ? (item.value / totalValue) * 100 : 0,
  }));

  return (
    <Card className="border-brand-light-gray dark:border-gray-700">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-brand-navy dark:text-gray-100">
            {title}
          </h3>
          <span className="text-2xl font-bold text-brand-navy dark:text-gray-100">
            {total}
          </span>
        </div>

        {/* Segmented Horizontal Bar */}
        <div className="mb-4">
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
            {segments.map((segment) => (
              <div
                key={segment.label}
                className="transition-all duration-300"
                style={{ 
                  width: `${segment.percentage}%`,
                  backgroundColor: segment.color
                }}
                title={`${segment.label}: ${segment.value}`}
              />
            ))}
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="flex gap-4">
          {items.map((item) => (
            <Card 
              key={item.label} 
              className="border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-1"
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <div style={{ color: item.color }}>
                        {item.icon}
                      </div>
                    </div>
                    <p className="text-sm text-brand-slate dark:text-gray-400">
                      {item.label}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-brand-navy dark:text-gray-100">
                    {item.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
