import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinancialLineStore } from '@/store/financialLineStore';
import { useProjectStore } from '@/store/projectStore';
import { FinancialLineTable } from './components/FinancialLineTable';
import { CreateFLWizard } from './components/CreateFLWizard';

export function FinancialLineListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { fls = [], loading, filters, fetchFLs, setFilter } = useFinancialLineStore();
  const { projects = [], fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchFLs();
    fetchProjects({});
  }, [fetchFLs, fetchProjects]);

  useEffect(() => {
    fetchFLs();
  }, [filters, fetchFLs]);

  const activeProjects = projects?.filter((p) => p.status === 'Active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Lines</h1>
          <p className="text-muted-foreground">Manage financial lines with revenue planning and milestones</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Financial Line
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter financial lines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search by FL no, name..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
            
            <Select value={filters.status} onValueChange={(value) => setFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.locationType} onValueChange={(value) => setFilter('locationType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Location Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Locations</SelectItem>
                <SelectItem value="Onsite">Onsite</SelectItem>
                <SelectItem value="Offshore">Offshore</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.contractType} onValueChange={(value) => setFilter('contractType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Types</SelectItem>
                <SelectItem value="T&M">T&M</SelectItem>
                <SelectItem value="Fixed Price">Fixed Price</SelectItem>
                <SelectItem value="Retainer">Retainer</SelectItem>
                <SelectItem value="Milestone-based">Milestone-based</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.projectId} onValueChange={(value) => setFilter('projectId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Projects</SelectItem>
                {activeProjects.map((project) => (
                  <SelectItem key={project._id} value={project._id}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Lines</CardTitle>
          <CardDescription>
            {fls.length} {fls.length === 1 ? 'FL' : 'FLs'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialLineTable data={fls} loading={loading} />
        </CardContent>
      </Card>

      <CreateFLWizard
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchFLs();
        }}
      />
    </div>
  );
}
