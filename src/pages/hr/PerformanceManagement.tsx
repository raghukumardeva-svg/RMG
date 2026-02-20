import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Award, 
  Users, 
  Star,
  CheckCircle2,
  Clock,
  MessageSquare,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useEmployeeStore } from '@/store/employeeStore';
import { toast } from 'sonner';

interface Goal {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: 'individual' | 'team' | 'company';
  targetDate: string;
  progress: number;
  status: 'on-track' | 'at-risk' | 'completed' | 'overdue';
}

interface Review {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  reviewPeriod: string;
  reviewType: 'quarterly' | 'annual' | 'probation' | '360-feedback';
  overallRating: number;
  competencies: {
    name: string;
    rating: number;
  }[];
  strengths: string;
  areasOfImprovement: string;
  feedback: string;
  status: 'draft' | 'submitted' | 'completed';
  reviewedBy: string;
  reviewDate: string;
}

export function PerformanceManagement() {
  const { employees, fetchEmployees } = useEmployeeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'individual' as const,
    targetDate: '',
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    reviewType: 'quarterly' as const,
    overallRating: 3,
    strengths: '',
    areasOfImprovement: '',
    feedback: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Mock goals data (replace with API)
  const goals: Goal[] = useMemo(() => {
    return employees.slice(0, 10).flatMap((emp, idx) => [
      {
        id: `goal-${idx}-1`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        title: 'Complete certification training',
        description: 'Obtain AWS certification by Q1 2026',
        category: 'individual' as const,
        targetDate: '2026-03-31',
        progress: Math.floor(Math.random() * 100),
        status: Math.random() > 0.7 ? 'on-track' : Math.random() > 0.5 ? 'at-risk' : 'completed',
      },
      {
        id: `goal-${idx}-2`,
        employeeId: emp.employeeId,
        employeeName: emp.name,
        title: 'Improve team collaboration',
        description: 'Lead 2 cross-functional projects',
        category: 'team' as const,
        targetDate: '2026-06-30',
        progress: Math.floor(Math.random() * 80),
        status: Math.random() > 0.6 ? 'on-track' : 'at-risk',
      },
    ]);
  }, [employees]);

  // Mock reviews data (replace with API)
  const reviews: Review[] = useMemo(() => {
    return employees.slice(0, 15).map((emp, idx) => ({
      id: `review-${idx}`,
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      reviewPeriod: 'Q4 2025',
      reviewType: ['quarterly', 'annual', '360-feedback'][idx % 3] as any,
      overallRating: 3 + Math.floor(Math.random() * 2),
      competencies: [
        { name: 'Technical Skills', rating: 4 },
        { name: 'Communication', rating: 4 },
        { name: 'Teamwork', rating: 5 },
        { name: 'Problem Solving', rating: 4 },
      ],
      strengths: 'Strong technical skills, excellent team player',
      areasOfImprovement: 'Time management, presentation skills',
      feedback: 'Great performance this quarter. Keep up the good work!',
      status: ['draft', 'submitted', 'completed'][idx % 3] as any,
      reviewedBy: emp.reportingManager?.name || 'Manager',
      reviewDate: '2025-12-15',
    }));
  }, [employees]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = employees.map(emp => emp.department);
    return ['all', ...Array.from(new Set(depts))];
  }, [employees]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const onTrackGoals = goals.filter(g => g.status === 'on-track').length;
    const atRiskGoals = goals.filter(g => g.status === 'at-risk').length;
    
    const totalReviews = reviews.length;
    const completedReviews = reviews.filter(r => r.status === 'completed').length;
    const avgRating = reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length).toFixed(1)
      : '0';
    const pendingReviews = reviews.filter(r => r.status === 'draft' || r.status === 'submitted').length;

    return {
      totalGoals,
      completedGoals,
      onTrackGoals,
      atRiskGoals,
      totalReviews,
      completedReviews,
      avgRating,
      pendingReviews,
      goalCompletionRate: totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : '0',
    };
  }, [goals, reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      const matchesSearch = review.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           review.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || review.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [reviews, searchQuery, departmentFilter]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goals.filter(goal => {
      const matchesSearch = goal.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           goal.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [goals, searchQuery]);

  const getStatusBadge = (status: Goal['status']) => {
    const variants = {
      'on-track': 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'at-risk': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      'completed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      'overdue': 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    };

    const labels = {
      'on-track': 'On Track',
      'at-risk': 'At Risk',
      'completed': 'Completed',
      'overdue': 'Overdue',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getReviewStatusBadge = (status: Review['status']) => {
    const variants = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
      submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    };

    const labels = {
      draft: 'Draft',
      submitted: 'Submitted',
      completed: 'Completed',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const handleCreateGoal = () => {
    if (!goalForm.title || !goalForm.targetDate) {
      toast.error('Please fill all required fields');
      return;
    }

    toast.success('Goal created successfully');
    setShowGoalDialog(false);
    setGoalForm({
      title: '',
      description: '',
      category: 'individual',
      targetDate: '',
    });
  };

  const handleSubmitReview = () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    toast.success('Review submitted successfully');
    setShowReviewDialog(false);
    setReviewForm({
      reviewType: 'quarterly',
      overallRating: 3,
      strengths: '',
      areasOfImprovement: '',
      feedback: '',
    });
    setSelectedEmployee(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <BarChart3 className="h-7 w-7 text-primary" />
            Performance Management
          </h1>
          <p className="page-description">Track goals, reviews, and employee performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowGoalDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
          <Button onClick={() => setShowReviewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Review
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.goalCompletionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Goals</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.onTrackGoals} on track, {stats.atRiskGoals} at risk
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Completed</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completedReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews} pending reviews
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.avgRating}/5</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="feedback">360° Feedback</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest rated employees this quarter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reviews
                    .filter(r => r.status === 'completed')
                    .sort((a, b) => b.overallRating - a.overallRating)
                    .slice(0, 5)
                    .map((review) => (
                      <div key={review.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{review.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{review.department}</p>
                        </div>
                        {renderStars(review.overallRating)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Goal Progress Overview
                </CardTitle>
                <CardDescription>Company-wide goal completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed Goals</span>
                      <span className="font-semibold text-green-600">
                        {stats.completedGoals}/{stats.totalGoals}
                      </span>
                    </div>
                    <Progress value={parseInt(stats.goalCompletionRate)} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.onTrackGoals}</div>
                      <p className="text-xs text-muted-foreground">On Track</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{stats.atRiskGoals}</div>
                      <p className="text-xs text-muted-foreground">At Risk</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.completedGoals}</div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance Reviews</CardTitle>
              <CardDescription>Latest completed reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews
                  .filter(r => r.status === 'completed')
                  .slice(0, 5)
                  .map((review) => (
                    <div key={review.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium">{review.employeeName}</p>
                            <p className="text-sm text-muted-foreground">
                              {review.department} • {review.reviewPeriod}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{review.reviewType}</Badge>
                        {renderStars(review.overallRating)}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Goals</CardTitle>
                  <CardDescription>
                    {filteredGoals.length} goals tracked
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search goals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredGoals.map((goal) => (
                  <div key={goal.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{goal.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {goal.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {goal.employeeName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(goal.status)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Performance Reviews</CardTitle>
                  <CardDescription>
                    {filteredReviews.length} reviews
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reviews..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-full sm:w-64"
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No reviews found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{review.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{review.employeeId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{review.department}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{review.reviewPeriod}</TableCell>
                          <TableCell className="text-sm capitalize">{review.reviewType}</TableCell>
                          <TableCell>{renderStars(review.overallRating)}</TableCell>
                          <TableCell>{getReviewStatusBadge(review.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 360 Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                360° Feedback System
              </CardTitle>
              <CardDescription>
                Multi-source feedback from peers, managers, and direct reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">360° Feedback Coming Soon</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive multi-source feedback system is under development
                </p>
                <Button>Request Demo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>Set a new performance goal for an employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-employee">Employee *</Label>
              <Select value={selectedEmployee || ''} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="goal-employee" className="mt-2">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="goal-title">Goal Title *</Label>
              <Input
                id="goal-title"
                placeholder="e.g., Complete AWS Certification"
                value={goalForm.title}
                onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="goal-description">Description</Label>
              <Textarea
                id="goal-description"
                placeholder="Describe the goal and success criteria..."
                value={goalForm.description}
                onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-category">Category *</Label>
                <Select value={goalForm.category} onValueChange={(value: any) => setGoalForm({ ...goalForm, category: value })}>
                  <SelectTrigger id="goal-category" className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-target-date">Target Date *</Label>
                <Input
                  id="goal-target-date"
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal}>Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Performance Review</DialogTitle>
            <DialogDescription>Complete a performance review for an employee</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="review-employee">Employee *</Label>
              <Select value={selectedEmployee || ''} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="review-employee" className="mt-2">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === 'active').map((emp) => (
                    <SelectItem key={emp.employeeId} value={emp.employeeId}>
                      {emp.name} ({emp.department})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="review-type">Review Type *</Label>
              <Select value={reviewForm.reviewType} onValueChange={(value: any) => setReviewForm({ ...reviewForm, reviewType: value })}>
                <SelectTrigger id="review-type" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarterly">Quarterly Review</SelectItem>
                  <SelectItem value="annual">Annual Review</SelectItem>
                  <SelectItem value="probation">Probation Review</SelectItem>
                  <SelectItem value="360-feedback">360° Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="review-rating">Overall Rating: {reviewForm.overallRating}/5</Label>
              <Input
                id="review-rating"
                type="range"
                min="1"
                max="5"
                step="1"
                value={reviewForm.overallRating}
                onChange={(e) => setReviewForm({ ...reviewForm, overallRating: parseInt(e.target.value) })}
                className="mt-2"
              />
              <div className="mt-2">{renderStars(reviewForm.overallRating)}</div>
            </div>
            <div>
              <Label htmlFor="review-strengths">Key Strengths</Label>
              <Textarea
                id="review-strengths"
                placeholder="List the employee's key strengths..."
                value={reviewForm.strengths}
                onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="review-improvements">Areas of Improvement</Label>
              <Textarea
                id="review-improvements"
                placeholder="Areas where the employee can improve..."
                value={reviewForm.areasOfImprovement}
                onChange={(e) => setReviewForm({ ...reviewForm, areasOfImprovement: e.target.value })}
                rows={3}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="review-feedback">Overall Feedback</Label>
              <Textarea
                id="review-feedback"
                placeholder="Provide comprehensive feedback..."
                value={reviewForm.feedback}
                onChange={(e) => setReviewForm({ ...reviewForm, feedback: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
