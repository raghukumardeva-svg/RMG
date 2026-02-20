import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Mail, Phone, MoreVertical, Edit, UserX, UserCheck, Trash2, Upload, Users } from 'lucide-react';
import { useEmployeeStore } from '@/store/employeeStore';
import type { Employee } from '@/services/employeeService';
import { useState, useEffect } from 'react';
import { AddEditEmployeeModal } from '@/components/modals/AddEditEmployeeModal';
import { UploadEmployeesModal } from '@/components/modals/UploadEmployeesModal';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function EmployeeManagement() {
  const { employees, isLoading, fetchEmployees, markInactive, activateEmployee, deleteEmployee } = useEmployeeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [employeeToMarkInactive, setEmployeeToMarkInactive] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const activeEmployees = employees.filter(emp => emp.status === 'active');
  const inactiveEmployees = employees.filter(emp => emp.status === 'inactive');

  const filteredActiveEmployees = activeEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInactiveEmployees = inactiveEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleMarkInactive = (employee: Employee) => {
    if (!employee._id) return;
    setEmployeeToMarkInactive(employee);
  };

  const confirmMarkInactive = async () => {
    if (!employeeToMarkInactive?._id) return;

    try {
      await markInactive(employeeToMarkInactive._id);
      toast.success(`${employeeToMarkInactive.name} marked as inactive`);
      setEmployeeToMarkInactive(null);
    } catch (error) {
      console.error('Failed to mark inactive:', error);
      toast.error('Failed to mark employee as inactive');
    }
  };

  const handleActivate = async (employee: Employee) => {
    if (!employee._id) return;

    try {
      await activateEmployee(employee._id);
      toast.success(`${employee.name} reactivated`);
    } catch (error) {
      console.error('Failed to reactivate:', error);
      toast.error('Failed to reactivate employee');
    }
  };

  const handleDelete = (employee: Employee) => {
    if (!employee._id) return;
    setEmployeeToDelete(employee);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete?._id) return;

    try {
      await deleteEmployee(employeeToDelete._id);
      toast.success(`${employeeToDelete.name} deleted`);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete employee');
    }
  };

  const EmployeeCard = ({ employee, isInactive = false }: { employee: Employee; isInactive?: boolean }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center gap-4">
        {employee.profilePhoto ? (
          <img 
            src={employee.profilePhoto} 
            alt={employee.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="font-semibold text-primary">{employee.name.charAt(0)}</span>
          </div>
        )}
        <div>
          <p className="font-medium">{employee.name}</p>
          <p className="text-sm text-muted-foreground">{employee.designation}</p>
          {employee.reportingManager && (
            <p className="text-xs text-muted-foreground">
              Reports to: {employee.reportingManager.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{employee.department}</p>
          <p className="text-xs text-muted-foreground">{employee.employeeId}</p>
          <p className="text-xs text-muted-foreground">{employee.location}</p>
        </div>
        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
          {employee.status}
        </Badge>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => window.open(`mailto:${employee.email}`)} aria-label={`Send email to ${employee.name}`}>
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${employee.phone}`)} aria-label={`Call ${employee.name}`}>
            <Phone className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`More actions for ${employee.name}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(employee)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!isInactive ? (
                <DropdownMenuItem onClick={() => handleMarkInactive(employee)} className="text-orange-600 dark:text-orange-400">
                  <UserX className="mr-2 h-4 w-4" />
                  Mark Inactive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleActivate(employee)} className="text-green-600">
                  <UserCheck className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(employee)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Users className="h-7 w-7 text-primary" />
            Employee Management
          </h1>
          <p className="page-description">Manage employee profiles and information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Excel
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active Employees ({activeEmployees.length})
          </TabsTrigger>
          <TabsTrigger value="inactive">
            Inactive Employees ({inactiveEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Employees</CardTitle>
                  <CardDescription>
                    {filteredActiveEmployees.length} of {activeEmployees.length} employees
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search employees..." 
                    className="w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted-color" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted-color rounded" />
                          <div className="h-3 w-24 bg-muted-color rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActiveEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No employees found matching your search' : 'No active employees'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredActiveEmployees.map((employee) => (
                    <EmployeeCard key={employee._id || employee.employeeId} employee={employee} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inactive Employees</CardTitle>
                  <CardDescription>
                    {filteredInactiveEmployees.length} of {inactiveEmployees.length} employees
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search employees..." 
                    className="w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted-color" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-muted-color rounded" />
                          <div className="h-3 w-24 bg-muted-color rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredInactiveEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No employees found matching your search' : 'No inactive employees'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInactiveEmployees.map((employee) => (
                    <EmployeeCard key={employee._id || employee.employeeId} employee={employee} isInactive={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Employee Modal */}
      <AddEditEmployeeModal
        open={showAddModal || editingEmployee !== null}
        onClose={() => {
          setShowAddModal(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSuccess={() => {
          // Don't call fetchEmployees - the store is already updated
          // Just close the modal (handled by onClose in the modal)
        }}
      />

      {/* Mark Inactive Confirmation Dialog */}
      <AlertDialog open={employeeToMarkInactive !== null} onOpenChange={(open) => !open && setEmployeeToMarkInactive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Employee as Inactive?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark <strong>{employeeToMarkInactive?.name}</strong> as inactive?
              This will remove them from the active employee list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToMarkInactive(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMarkInactive} className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30">
              Mark Inactive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Employee Confirmation Dialog */}
      <AlertDialog open={employeeToDelete !== null} onOpenChange={(open) => !open && setEmployeeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{employeeToDelete?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEmployeeToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Employees Modal */}
      <UploadEmployeesModal open={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

