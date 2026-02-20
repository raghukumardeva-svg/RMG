import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Users, GitBranch, Building, Building2, MapPin, DollarSign, FileText, Mail, Phone, Briefcase, ChevronDown, ChevronRight } from 'lucide-react';
import { useEmployeeStore } from '@/store/employeeStore';

// Local type for component use
interface Employee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: string;
  department: string;
  joiningDate: string;
  reportingManager: string;
  status: string;
  phone: string;
  avatar: string;
}

interface Filters {
  businessUnit: string;
  department: string;
  location: string;
  costCenter: string;
  legalEntity: string;
  search: string;
}

interface TreeNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone: string;
  avatar: string;
  children: TreeNode[];
}

export function Employees() {
  const { employees: storeEmployees, isLoading, fetchEmployees } = useEmployeeStore();
  const [activeTab, setActiveTab] = useState('directory');
  const [filters, setFilters] = useState<Filters>({
    businessUnit: '',
    department: '',
    location: '',
    costCenter: '',
    legalEntity: '',
    search: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Map store employees to component format
  const employees = storeEmployees.map(emp => ({
    id: emp._id || emp.employeeId,
    name: emp.name,
    email: emp.email,
    employeeId: emp.employeeId,
    role: emp.designation,
    department: emp.department,
    joiningDate: emp.dateOfJoining,
    reportingManager: emp.reportingManager?.name || 'CEO',
    status: emp.status,
    phone: emp.phone,
    avatar: emp.profilePhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${emp.name}`,
  }));

  // Extract unique filter values
  const businessUnits = ['All', 'Technology', 'Marketing & Sales', 'Finance & Operations', 'Human Resources'];
  const departments = ['All', ...new Set(employees.map(e => e.department))];
  const locations = ['All', 'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Chicago, IL', 'Seattle, WA'];
  const costCenters = ['All', 'CC-001', 'CC-002', 'CC-003', 'CC-004', 'CC-005'];
  const legalEntities = ['All', 'Company Inc.', 'Company LLC', 'Company Corp'];

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesBusinessUnit = !filters.businessUnit || filters.businessUnit === 'All';
    const matchesDepartment = !filters.department || filters.department === 'All' || emp.department === filters.department;
    const matchesLocation = !filters.location || filters.location === 'All';
    const matchesCostCenter = !filters.costCenter || filters.costCenter === 'All';
    const matchesLegalEntity = !filters.legalEntity || filters.legalEntity === 'All';
    const matchesSearch = !filters.search || 
      emp.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.role.toLowerCase().includes(filters.search.toLowerCase());

    return matchesBusinessUnit && matchesDepartment && matchesLocation && 
           matchesCostCenter && matchesLegalEntity && matchesSearch;
  });

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      businessUnit: '',
      department: '',
      location: '',
      costCenter: '',
      legalEntity: '',
      search: '',
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Users className="h-7 w-7 text-primary" />
            Employees
          </h1>
          <p className="page-description">Browse employee directory and organization structure</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="directory" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Employee Directory
          </TabsTrigger>
          <TabsTrigger value="orgtree" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Organization Tree
          </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-6 mt-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Search */}
                <div className="lg:col-span-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or role..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Business Unit */}
                <FilterDropdown
                  icon={Building2}
                  label="Business Unit"
                  options={businessUnits}
                  value={filters.businessUnit}
                  onChange={(val) => handleFilterChange('businessUnit', val)}
                />

                {/* Department */}
                <FilterDropdown
                  icon={Building}
                  label="Department"
                  options={departments}
                  value={filters.department}
                  onChange={(val) => handleFilterChange('department', val)}
                />

                {/* Location */}
                <FilterDropdown
                  icon={MapPin}
                  label="Location"
                  options={locations}
                  value={filters.location}
                  onChange={(val) => handleFilterChange('location', val)}
                />

                {/* Cost Center */}
                <FilterDropdown
                  icon={DollarSign}
                  label="Cost Center"
                  options={costCenters}
                  value={filters.costCenter}
                  onChange={(val) => handleFilterChange('costCenter', val)}
                />

                {/* Legal Entity */}
                <FilterDropdown
                  icon={FileText}
                  label="Legal Entity"
                  options={legalEntities}
                  value={filters.legalEntity}
                  onChange={(val) => handleFilterChange('legalEntity', val)}
                />

                {/* Clear Filters */}
                <div className="flex items-end">
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>

          {/* Employee Cards */}
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-full bg-muted-color" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted-color rounded w-3/4" />
                        <div className="h-4 bg-muted-color rounded w-1/2" />
                        <div className="h-3 bg-muted-color rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmployees.map((employee) => (
                <EmployeeCard key={employee.id} employee={employee} />
              ))}
            </div>
          )}

          {!isLoading && filteredEmployees.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orgtree" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Organization Hierarchy
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 border rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted-color" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted-color rounded w-1/3" />
                          <div className="h-3 bg-muted-color rounded w-1/4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <OrganizationTree employees={employees} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Filter Dropdown Component
interface FilterDropdownProps {
  icon: React.ElementType;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

function FilterDropdown({ icon: Icon, label, options, value, onChange }: FilterDropdownProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-md bg-background"
      >
        <option value="">All</option>
        {options.filter(opt => opt !== 'All').map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Employee Card Component
function EmployeeCard({ employee }: { employee: Employee }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {employee.avatar ? (
                <img 
                  src={employee.avatar} 
                  alt={employee.name}
                  className="h-14 w-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{employee.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">{employee.department}</p>
                <Badge variant="secondary" className="mt-2">
                  {employee.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            {employee.avatar ? (
              <img 
                src={employee.avatar} 
                alt={employee.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">{employee.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
            </div>
          </div>
          <div className="space-y-3">
            <DetailRow icon={Mail} label="Email" value={employee.email} />
            <DetailRow icon={Phone} label="Phone" value={employee.phone || 'N/A'} />
            <DetailRow icon={Building} label="Department" value={employee.department} />
            <DetailRow icon={Briefcase} label="Employee ID" value={employee.employeeId} />
            <DetailRow icon={Users} label="Reports To" value={employee.reportingManager} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="p-1.5 rounded-md bg-primary/10 text-primary mt-0.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// Organization Tree Component
function OrganizationTree({ employees }: { employees: Employee[] }) {
  // Build tree structure based on reporting relationships
  const buildTree = (): TreeNode[] => {
    const employeeMap = new Map<string, TreeNode>();
    
    // Create nodes
    employees.forEach(emp => {
      employeeMap.set(emp.name, {
        id: emp.id,
        name: emp.name,
        title: emp.role,
        department: emp.department,
        email: emp.email,
        phone: emp.phone || 'N/A',
        avatar: emp.name.split(' ').map(n => n[0]).join('').toUpperCase(),
        children: [],
      });
    });

    const roots: TreeNode[] = [];

    // Build parent-child relationships
    employees.forEach(emp => {
      const node = employeeMap.get(emp.name);
      if (!node) return;

      if (emp.reportingManager === 'CEO' || !emp.reportingManager) {
        roots.push(node);
      } else {
        const parent = employeeMap.get(emp.reportingManager);
        if (parent) {
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  };

  const tree = buildTree();

  return (
    <div className="space-y-2">
      {tree.map(node => (
        <TreeNodeComponent key={node.id} node={node} level={0} />
      ))}
    </div>
  );
}

function TreeNodeComponent({ node, level }: { node: TreeNode; level: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  return (
    <div className="space-y-2">
      <div
        className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        {node.children.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-background rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {node.children.length === 0 && <div className="w-6" />}
        
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-80">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
                {node.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{node.name}</p>
                <p className="text-sm text-muted-foreground truncate">{node.title}</p>
              </div>
              <Badge variant="outline">{node.department}</Badge>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {node.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{node.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{node.title}</p>
                </div>
              </div>
              <div className="space-y-3">
                <DetailRow icon={Mail} label="Email" value={node.email} />
                <DetailRow icon={Phone} label="Phone" value={node.phone} />
                <DetailRow icon={Building} label="Department" value={node.department} />
                <DetailRow icon={Users} label="Direct Reports" value={node.children.length.toString()} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {isExpanded && node.children.length > 0 && (
        <div className="space-y-2">
          {node.children.map(child => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
