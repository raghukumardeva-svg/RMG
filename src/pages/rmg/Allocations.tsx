import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Plus, Loader2, FolderKanban } from 'lucide-react';
import { allocationService, type Allocation } from '@/services/allocationService';
import { projectService, type Project } from '@/services/projectService';
import { employeeService, type Employee } from '@/services/employeeService';
import { toast } from 'sonner';

interface AllocationWithDetails extends Allocation {
  projectName: string;
  employeeName: string;
  employeeRole: string;
  projectStatus?: string;
}

export function Allocations() {
  const [allocations, setAllocations] = useState<AllocationWithDetails[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    billable: 0,
    avgAllocation: 0,
    fullAllocation: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllocationsWithDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [allocationsData, projectsData, employeesData] = await Promise.all([
          allocationService.getActive(),
          projectService.getAll(),
          employeeService.getAll(),
        ]);

        // Combine allocation data with project and employee details
        const enrichedAllocations: AllocationWithDetails[] = allocationsData.map((alloc) => {
          const project = projectsData.find((p) => p.projectId === alloc.projectId);
          const employee = employeesData.find((e) => e.employeeId === alloc.employeeId);

          return {
            ...alloc,
            projectName: project?.name || 'Unknown Project',
            projectStatus: project?.status,
            employeeName: employee?.name || 'Unknown Employee',
            employeeRole: employee?.designation || 'Unknown Role',
          };
        });

        setAllocations(enrichedAllocations);

        // Calculate statistics
        const totalAllocations = enrichedAllocations.length;
        const billableCount = enrichedAllocations.filter((a) => a.billable).length;
        const avgAllocation = totalAllocations > 0
          ? Math.round(
              enrichedAllocations.reduce((acc, a) => acc + a.allocation, 0) / totalAllocations
            )
          : 0;
        const fullAllocationCount = enrichedAllocations.filter((a) => a.allocation === 100).length;

        setStats({
          total: totalAllocations,
          billable: billableCount,
          avgAllocation,
          fullAllocation: fullAllocationCount,
        });
      } catch (error) {
        console.error('Failed to fetch allocations:', error);
        toast.error('Failed to load allocation data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllocationsWithDetails();
  }, []);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <FolderKanban className="h-7 w-7 text-primary" />
            Resource Allocations
          </h1>
          <p className="page-description">Manage project assignments and resource allocation</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Allocation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Billable Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.billable}</div>
            <p className="text-xs text-muted-foreground">Currently billable</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAllocation}%</div>
            <p className="text-xs text-muted-foreground">Per resource</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Full Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.fullAllocation}</div>
            <p className="text-xs text-muted-foreground">100% allocated</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Allocations</CardTitle>
          <CardDescription>Resource assignments by project</CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No allocations found</p>
          ) : (
            <div className="space-y-4">
              {allocations.map((allocation) => (
                <div key={allocation._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <GitBranch className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{allocation.projectName}</p>
                        <p className="text-sm text-muted-foreground">{allocation.employeeName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {allocation.projectStatus && (
                        <Badge variant="outline" className="capitalize">
                          {allocation.projectStatus}
                        </Badge>
                      )}
                      <Badge variant={allocation.billable ? 'default' : 'secondary'}>
                        {allocation.billable ? 'Billable' : 'Non-Billable'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Role</p>
                      <p className="text-sm font-medium">{allocation.employeeRole}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Allocation</p>
                      <p className="text-sm font-medium">{allocation.allocation}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {formatDate(allocation.startDate)} -{' '}
                        {allocation.endDate ? formatDate(allocation.endDate) : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${allocation.allocation}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
