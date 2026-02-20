/**
 * Approver Overview Page
 * View and manage approvers across categories
 */

import { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Users,
  FileCheck,
  Clock,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  getAllApprovers,
  getApproverStats,
  getApproversByCategory
} from '@/services/superAdminService';
import type { ApproverInfo, ApproverStats, CategoryApprovers } from '@/types/superAdmin';

interface ApproverWithStats extends ApproverInfo {
  totalApprovals?: number;
  pendingApprovals?: number;
  averageResponseTime?: string;
  categories?: string[];
  levels?: string[];
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getLevelColor = (level: string) => {
  switch (level) {
    case 'L1': return 'bg-blue-500';
    case 'L2': return 'bg-purple-500';
    case 'L3': return 'bg-orange-500';
    default: return 'bg-gray-500';
  }
};

export function ApproverOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ApproverStats | null>(null);
  const [approversByCategory, setApproversByCategory] = useState<CategoryApprovers[]>([]);
  const [allApprovers, setAllApprovers] = useState<ApproverWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, categoryData, approversData] = await Promise.all([
        getApproverStats(),
        getApproversByCategory(),
        getAllApprovers()
      ]);
      setStats(statsData);
      setApproversByCategory(categoryData);
      setAllApprovers(approversData);
    } catch (err) {
      console.error('Error fetching approver data:', err);
      toast.error('Failed to load approver data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const filteredApprovers = allApprovers.filter(approver => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!approver.name.toLowerCase().includes(query) &&
          !approver.email.toLowerCase().includes(query) &&
          !approver.employeeId.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filterLevel !== 'all' && !approver.levels?.includes(filterLevel)) {
      return false;
    }
    if (filterCategory !== 'all' && !approver.categories?.includes(filterCategory)) {
      return false;
    }
    return true;
  });

  const uniqueCategories = Array.from(
    new Set(approversByCategory.map(c => c.categoryName))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Approver Overview</h1>
            <p className="text-muted-foreground">Manage approval workflows and monitor approvers</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApprovers}</p>
                  <p className="text-sm text-muted-foreground">Total Approvers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalApprovals}</p>
                  <p className="text-sm text-muted-foreground">Total Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageResponseTime}</p>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Approvers by Level */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Approvers by Level</CardTitle>
            <CardDescription>Distribution of approvers across approval levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-500">L1 Approvers</Badge>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.byLevel?.L1 || 0}
                  </span>
                </div>
                <Progress value={((stats.byLevel?.L1 || 0) / (stats.totalApprovers || 1)) * 100} className="h-2" />
              </div>
              <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-purple-500">L2 Approvers</Badge>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.byLevel?.L2 || 0}
                  </span>
                </div>
                <Progress value={((stats.byLevel?.L2 || 0) / (stats.totalApprovers || 1)) * 100} className="h-2" />
              </div>
              <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-orange-500">L3 Approvers</Badge>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.byLevel?.L3 || 0}
                  </span>
                </div>
                <Progress value={((stats.byLevel?.L3 || 0) / (stats.totalApprovers || 1)) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Toggle and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'category' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('category')}
              >
                By Category
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                All Approvers
              </Button>
            </div>
            
            {viewMode === 'list' && (
              <div className="flex flex-wrap gap-4 flex-1 justify-end">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search approvers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="L1">L1</SelectItem>
                    <SelectItem value="L2">L2</SelectItem>
                    <SelectItem value="L3">L3</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category View */}
      {viewMode === 'category' && (
        <div className="space-y-4">
          {approversByCategory.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No categories with configured approvers.
              </CardContent>
            </Card>
          ) : (
            approversByCategory.map((category) => {
              const isExpanded = expandedCategories.has(category.categoryId);
              return (
                <Card key={category.categoryId}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(category.categoryId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{category.categoryName}</CardTitle>
                          <CardDescription>{category.subCategory}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {category.l1Approvers.length > 0 && (
                          <Badge variant="outline" className="border-blue-500 text-blue-500">
                            L1: {category.l1Approvers.length}
                          </Badge>
                        )}
                        {category.l2Approvers.length > 0 && (
                          <Badge variant="outline" className="border-purple-500 text-purple-500">
                            L2: {category.l2Approvers.length}
                          </Badge>
                        )}
                        {category.l3Approvers.length > 0 && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            L3: {category.l3Approvers.length}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* L1 Approvers */}
                        <div className="p-4 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Badge className="bg-blue-500">L1</Badge>
                            First Level Approvers
                          </h4>
                          {category.l1Approvers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No approvers configured</p>
                          ) : (
                            <div className="space-y-2">
                              {category.l1Approvers.map((approver) => (
                                <ApproverCard key={approver.employeeId} approver={approver} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* L2 Approvers */}
                        <div className="p-4 rounded-lg border bg-purple-50/50 dark:bg-purple-950/20">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Badge className="bg-purple-500">L2</Badge>
                            Second Level Approvers
                          </h4>
                          {category.l2Approvers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No approvers configured</p>
                          ) : (
                            <div className="space-y-2">
                              {category.l2Approvers.map((approver) => (
                                <ApproverCard key={approver.employeeId} approver={approver} />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* L3 Approvers */}
                        <div className="p-4 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20">
                          <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Badge className="bg-orange-500">L3</Badge>
                            Third Level Approvers
                          </h4>
                          {category.l3Approvers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No approvers configured</p>
                          ) : (
                            <div className="space-y-2">
                              {category.l3Approvers.map((approver) => (
                                <ApproverCard key={approver.employeeId} approver={approver} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="pt-6">
            {filteredApprovers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No approvers found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Approver</TableHead>
                    <TableHead>Levels</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Total Approvals</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Avg Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApprovers.map((approver) => (
                    <TableRow key={approver.employeeId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(approver.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{approver.name}</div>
                            <div className="text-sm text-muted-foreground">{approver.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {approver.levels?.map(level => (
                            <Badge key={level} className={getLevelColor(level)}>
                              {level}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {approver.categories?.slice(0, 2).map(cat => (
                            <Badge key={cat} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                          {(approver.categories?.length || 0) > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(approver.categories?.length || 0) - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{approver.totalApprovals || 0}</span>
                      </TableCell>
                      <TableCell>
                        {(approver.pendingApprovals || 0) > 0 ? (
                          <Badge className="bg-orange-500">{approver.pendingApprovals}</Badge>
                        ) : (
                          <Badge variant="secondary">0</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {approver.averageResponseTime || 'N/A'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Approver Card Component
function ApproverCard({ approver }: { approver: ApproverInfo }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-background">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">
          {getInitials(approver.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{approver.name}</p>
        <p className="text-xs text-muted-foreground truncate">{approver.designation}</p>
      </div>
    </div>
  );
}

export default ApproverOverview;
