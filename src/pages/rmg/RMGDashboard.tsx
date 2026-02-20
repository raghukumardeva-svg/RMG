import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, FileText, Users } from 'lucide-react';
import { AnnouncementsFeed } from '@/components/dashboard/AnnouncementsFeed';

export function RMGDashboard() {
  const stats = [
    { label: 'Total Resources', value: '185', icon: Users, color: 'text-primary' },
    { label: 'Utilization Rate', value: '78%', icon: TrendingUp, color: 'text-primary' },
    { label: 'On Bench', value: '23', icon: Calendar, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Active Projects', value: '42', icon: FileText, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
            <CardDescription>Current project assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                title="E-Commerce Platform"
                description="15 resources | 85% utilized"
                time="Active"
              />
              <ActivityItem
                title="Mobile Banking App"
                description="12 resources | 92% utilized"
                time="Active"
              />
              <ActivityItem
                title="Healthcare Portal"
                description="18 resources | 75% utilized"
                time="Active"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Demands</CardTitle>
            <CardDescription>Resource requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <EventItem
                title="New AI Project"
                date="Starts Dec 1, 2025"
                type="5 ML Engineers needed"
              />
              <EventItem
                title="Mobile App Phase 2"
                date="Starts Dec 15, 2025"
                type="3 React Native Devs"
              />
              <EventItem
                title="Cloud Migration"
                date="Starts Jan 1, 2026"
                type="4 DevOps Engineers"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements & Polls */}
      <AnnouncementsFeed maxHeight="400px" />
    </div>
  );
}

function ActivityItem({ title, description, time }: { title: string; description: string; time: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function EventItem({ title, date, type }: { title: string; date: string; type: string }) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">{type}</span>
    </div>
  );
}
