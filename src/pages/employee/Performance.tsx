import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, BarChart3 } from 'lucide-react';

export function Performance() {
  const goals = [
    { id: 1, title: 'Complete React Training', progress: 100, status: 'completed' },
    { id: 2, title: 'Launch E-Commerce Platform', progress: 75, status: 'in-progress' },
    { id: 3, title: 'Improve Code Quality Score', progress: 60, status: 'in-progress' },
    { id: 4, title: 'Mentor Junior Developers', progress: 40, status: 'in-progress' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <BarChart3 className="h-7 w-7 text-primary" />
            Performance & Goals
          </h1>
          <p className="page-description">Track your goals and performance metrics</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Performance Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.5/5</div>
            <p className="text-xs text-muted-foreground">Last review: Q3 2025</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12/15</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Goals</CardTitle>
          <CardDescription>Your active objectives and progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{goal.title}</span>
                </div>
                <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'}>
                  {goal.status}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{goal.progress}% complete</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Feedback</CardTitle>
          <CardDescription>Recent feedback from your manager</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeedbackItem
            title="Excellent Problem Solving"
            feedback="Demonstrated outstanding analytical skills in debugging complex issues."
            date="Oct 15, 2025"
          />
          <FeedbackItem
            title="Great Team Collaboration"
            feedback="Actively helps team members and contributes to a positive work environment."
            date="Sep 20, 2025"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackItem({ title, feedback, date }: { title: string; feedback: string; date: string }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <h4 className="font-medium">{title}</h4>
        </div>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
      <p className="text-sm text-muted-foreground">{feedback}</p>
    </div>
  );
}
