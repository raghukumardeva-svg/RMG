import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, AlertTriangle, TrendingUp, RefreshCw, Loader2, Users } from 'lucide-react';
import { rmgAnalyticsService, type DemandForecastData, type SkillsGapData } from '@/services/rmgAnalyticsService';
import { toast } from 'sonner';

export function Forecasting() {
  const [forecastData, setForecastData] = useState<DemandForecastData | null>(null);
  const [skillsData, setSkillsData] = useState<SkillsGapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch next 3 months forecast
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      endDate.setMonth(endDate.getMonth() + 3);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      const [forecast, skills] = await Promise.all([
        rmgAnalyticsService.getDemandForecast(params),
        rmgAnalyticsService.getSkillsGap({ futureMonths: 3 })
      ]);

      setForecastData(forecast);
      setSkillsData(skills);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      toast.error('Failed to load forecast data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    fetchData();
    toast.success('Data refreshed');
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading forecast data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!forecastData || !skillsData) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Unable to load forecast data. Please try again.
            </p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <TrendingUp className="h-7 w-7 text-primary" />
            Demand Forecasting
          </h1>
          <p className="page-description">Plan for upcoming resource requirements</p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecastData.summary.upcomingProjectsCount}</div>
            <p className="text-xs text-muted-foreground">Next 3 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resources Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forecastData.summary.totalDemand}</div>
            <p className="text-xs text-muted-foreground">Total demand</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {forecastData.summary.availableResources}
            </div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Skills Gap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {forecastData.summary.totalGap}
            </div>
            <p className="text-xs text-muted-foreground">Positions to hire</p>
          </CardContent>
        </Card>
      </div>

      {/* Demand by Role */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Demand by Role</CardTitle>
          <CardDescription>Upcoming project resource requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {forecastData.demandByRole.map((demand, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <LineChart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{demand.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {demand.demand} needed • {demand.available} available
                      </p>
                    </div>
                  </div>
                  {demand.gap > 0 && (
                    <Badge variant="destructive">
                      Gap: {demand.gap}
                    </Badge>
                  )}
                  {demand.gap === 0 && (
                    <Badge variant="default">
                      Sufficient
                    </Badge>
                  )}
                </div>

                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      demand.gap === 0
                        ? 'bg-green-500'
                        : demand.gap <= 2
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((demand.available / demand.demand) * 100, 100)}%` }}
                  />
                </div>

                {demand.gap > 0 && (
                  <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Immediate hiring required for {demand.gap} {demand.gap === 1 ? 'position' : 'positions'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Skills Gap Analysis</CardTitle>
          <CardDescription>
            Required vs available skills ({skillsData.summary.totalSkillsRequired} total skills tracked)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Critical Gaps</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {skillsData.summary.criticalGaps}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Moderate Gaps</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {skillsData.summary.moderateGaps}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {skillsData.skillsGap.map((skill, idx) => (
              <SkillGap
                key={idx}
                skill={skill.skill}
                required={skill.required}
                available={skill.available}
                gap={skill.gap}
                status={skill.status}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hiring Recommendations */}
      {skillsData.hiringRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hiring Recommendations</CardTitle>
            <CardDescription>Prioritized hiring needs based on demand forecast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skillsData.hiringRecommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className={`border-l-4 rounded-lg p-4 ${
                    rec.priority === 'high'
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                      : rec.priority === 'medium'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                      : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{rec.skill}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hire {rec.requiredCount} {rec.requiredCount === 1 ? 'resource' : 'resources'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        rec.priority === 'high'
                          ? 'destructive'
                          : rec.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {rec.priority.toUpperCase()} PRIORITY
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SkillGapProps {
  skill: string;
  required: number;
  available: number;
  gap: number;
  status: 'shortage' | 'sufficient';
}

function SkillGap({ skill, required, available, gap, status }: SkillGapProps) {
  const percentage = (available / required) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{skill}</span>
        <span className="text-sm text-muted-foreground">
          {available}/{required} available
          {status === 'shortage' && (
            <Badge variant="destructive" className="ml-2">
              Gap: {gap}
            </Badge>
          )}
          {status === 'sufficient' && (
            <Badge variant="default" className="ml-2">
              Sufficient
            </Badge>
          )}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 80 ? 'bg-primary' : percentage >= 50 ? 'bg-yellow-500' : 'bg-destructive'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
