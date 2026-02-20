import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, PieChart } from 'lucide-react';

export function Reports() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <PieChart className="h-7 w-7 text-primary" />
            Reports & Analytics
          </h1>
          <p className="page-description">Generate and view comprehensive reports</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reports Dashboard
          </CardTitle>
          <CardDescription>Access various reports and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Feature implementation in progress...</p>
        </CardContent>
      </Card>
    </div>
  );
}
