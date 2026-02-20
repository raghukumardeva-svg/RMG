import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerPOStore } from '@/store/customerPOStore';
import { useCustomerStore } from '@/store/customerStore';
import { useProjectStore } from '@/store/projectStore';
import { CustomerPOTable } from './components/CustomerPOTable';
import { CreateCustomerPODialog } from './components/CreateCustomerPODialog';
import { useState } from 'react';

export function CustomerPOListPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { pos = [], loading, filters, fetchPOs, setFilter } = useCustomerPOStore();
  const { customers = [], fetchCustomers } = useCustomerStore();
  const { projects = [], fetchProjects } = useProjectStore();

  useEffect(() => {
    fetchPOs();
    fetchCustomers({});
    fetchProjects({});
  }, [fetchPOs, fetchCustomers, fetchProjects]);

  useEffect(() => {
    fetchPOs();
  }, [filters, fetchPOs]);

  const activeCustomers = customers?.filter((c) => c.status === 'Active') || [];
  const activeProjects = projects?.filter((p) => p.status === 'Active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer POs</h1>
          <p className="text-muted-foreground">Manage purchase orders and contracts</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter customer POs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Search by contract no, PO no..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
            />
            
            <Select value={filters.status} onValueChange={(value) => setFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.bookingEntity} onValueChange={(value) => setFilter('bookingEntity', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Booking Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Entities</SelectItem>
                <SelectItem value="Eviden">Eviden</SelectItem>
                <SelectItem value="Habile">Habile</SelectItem>
                <SelectItem value="Akraya">Akraya</SelectItem>
                <SelectItem value="ECIS">ECIS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.customerId} onValueChange={(value) => setFilter('customerId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=" ">All Customers</SelectItem>
                {activeCustomers.map((customer) => (
                  <SelectItem key={customer._id} value={customer._id}>
                    {customer.customerName}
                  </SelectItem>
                ))}
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
                    {typeof project.projectName === 'string' ? project.projectName : 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>
            {pos.length} {pos.length === 1 ? 'PO' : 'POs'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerPOTable data={pos} loading={loading} />
        </CardContent>
      </Card>

      <CreateCustomerPODialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchPOs();
        }}
      />
    </div>
  );
}
