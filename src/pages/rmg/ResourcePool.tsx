import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Loader2, Users } from 'lucide-react';
import { employeeService, type Employee } from '@/services/employeeService';
import { allocationService, type Allocation } from '@/services/allocationService';
import { toast } from 'sonner';

interface ResourceWithAllocation extends Employee {
  totalAllocation: number;
  isBillable: boolean;
  allocations: Allocation[];
}

export function ResourcePool() {
  const [resources, setResources] = useState<ResourceWithAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchResourcesWithAllocations = async () => {
      try {
        setIsLoading(true);

        // Fetch all active employees
        const employees = await employeeService.getActive();

        // Fetch all active allocations
        const allAllocations = await allocationService.getActive();

        // Combine employee and allocation data
        const resourcesData: ResourceWithAllocation[] = employees.map((emp) => {
          // Get allocations for this employee
          const empAllocations = allAllocations.filter((a) => a.employeeId === emp.employeeId);

          // Calculate total allocation percentage
          const totalAllocation = empAllocations.reduce((sum, a) => sum + a.allocation, 0);

          // Check if any allocation is billable
          const isBillable = empAllocations.some((a) => a.billable);

          return {
            ...emp,
            totalAllocation,
            isBillable,
            allocations: empAllocations,
          };
        });

        setResources(resourcesData);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        toast.error('Failed to load resource pool data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResourcesWithAllocations();
  }, []);

  // Filter resources based on search term
  const filteredResources = resources.filter((resource) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      resource.name.toLowerCase().includes(searchLower) ||
      resource.designation.toLowerCase().includes(searchLower) ||
      resource.department.toLowerCase().includes(searchLower)
    );
  });

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
            <Users className="h-7 w-7 text-primary" />
            Resource Pool
          </h1>
          <p className="page-description">View and manage available resources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Resources</CardTitle>
              <CardDescription>Total {resources.length} employees</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, role, department..."
                className="w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredResources.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No resources found matching your search' : 'No resources available'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredResources.map((resource) => (
                <div
                  key={resource.employeeId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {resource.profilePhoto ? (
                      <img
                        src={resource.profilePhoto}
                        alt={resource.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {resource.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-muted-foreground">{resource.designation}</p>
                      <p className="text-xs text-muted-foreground">{resource.employeeId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{resource.department}</p>
                      <p className="text-xs text-muted-foreground">
                        {resource.totalAllocation}% allocated
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {resource.allocations.length} project{resource.allocations.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={resource.isBillable ? 'default' : 'secondary'}>
                      {resource.isBillable ? 'Billable' : 'On Bench'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
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
