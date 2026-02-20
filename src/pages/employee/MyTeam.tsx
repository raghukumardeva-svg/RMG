import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Search,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEmployeeStore } from '@/store/employeeStore';
import type { Employee } from '@/services/employeeService';
import { cn } from '@/lib/utils';

export function MyTeam() {
  const user = useAuthStore((state) => state.user);
  const employees = useEmployeeStore((state) => state.employees);
  const fetchEmployees = useEmployeeStore((state) => state.fetchEmployees);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('my-team');

  useEffect(() => {
    if (employees.length === 0) {
      fetchEmployees();
    }
  }, [employees.length, fetchEmployees]);

  // Extract unique departments and managers
  const { departments, reportingManagers } = useMemo(() => {
    const deptSet = new Set<string>();
    const managerMap = new Map<string, { id: string; name: string }>();

    employees.forEach((emp: Employee) => {
      if (emp.department) deptSet.add(emp.department);
      if (emp.reportingManager) {
        if (typeof emp.reportingManager === 'object' && emp.reportingManager !== null) {
          const manager = emp.reportingManager as { employeeId?: string; name?: string };
          if (manager.name && manager.employeeId) {
            managerMap.set(manager.employeeId, {
              id: manager.employeeId,
              name: manager.name,
            });
          }
        }
      }
    });

    return {
      departments: Array.from(deptSet).sort(),
      reportingManagers: Array.from(managerMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    };
  }, [employees]);

  // Filter team members based on logged-in user's team/reporting hierarchy
  const teamMembers = useMemo(() => {
    let filtered: Employee[] = [];

    // Default: Show employees reporting to the current user (for managers)
    // OR employees in the same department (for employees)
    if (filterManager === 'my-team') {
      if (user?.role === 'MANAGER') {
        // Show direct reports
        filtered = employees.filter((emp: Employee) => {
          if (emp.employeeId === user?.employeeId) return false;
          if (!emp.reportingManager) return false;

          if (typeof emp.reportingManager === 'object') {
            const manager = emp.reportingManager as { employeeId?: string; name?: string };
            return manager.employeeId === user?.employeeId || manager.name === user?.name;
          }
          return false;
        });
      } else {
        // Show peers in same department
        filtered = employees.filter(
          (emp: Employee) =>
            emp.department === user?.department && emp.employeeId !== user?.employeeId
        );
      }
    } else if (filterManager !== 'all') {
      // Filter by specific manager
      filtered = employees.filter((emp: Employee) => {
        if (emp.employeeId === user?.employeeId) return false;
        if (!emp.reportingManager) return false;

        if (typeof emp.reportingManager === 'object') {
          const manager = emp.reportingManager as { employeeId?: string };
          return manager.employeeId === filterManager;
        }
        return false;
      });
    } else {
      // Show all employees except current user
      filtered = employees.filter((emp: Employee) => emp.employeeId !== user?.employeeId);
    }

    // Apply department filter
    if (filterDepartment !== 'all') {
      filtered = filtered.filter((emp: Employee) => emp.department === filterDepartment);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (emp: Employee) =>
          emp.name.toLowerCase().includes(query) ||
          emp.email.toLowerCase().includes(query) ||
          emp.designation.toLowerCase().includes(query) ||
          (emp.location && emp.location.toLowerCase().includes(query))
      );
    }

    // Sort alphabetically by name (A → Z)
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, user, filterManager, filterDepartment, searchQuery]);

  // Format date helper
  const formatBirthday = (dateStr?: string) => {
    if (!dateStr) return 'Not specified';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Not specified';
    }
  };

  // Get status badge color
  const getStatusBadge = (status?: string) => {
    const actualStatus = status || 'active';
    return actualStatus.toLowerCase() === 'active'
      ? 'bg-brand-green-light text-brand-green dark:bg-brand-green/20 dark:text-brand-green-light'
      : 'bg-gray-100 text-brand-slate dark:bg-gray-800 dark:text-gray-400';
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Users className="h-7 w-7 text-primary" />
            My Team
          </h1>
          <p className="page-description">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} - Team Directory
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-slate dark:text-gray-400" />
          <Input
            placeholder="Search by name, email, role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Search team members"
          />
        </div>

        {/* Department Filter */}
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-full lg:w-[200px]" aria-label="Filter by department">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reporting Manager Filter */}
        <Select value={filterManager} onValueChange={setFilterManager}>
          <SelectTrigger className="w-full lg:w-[220px]" aria-label="Filter by reporting manager">
            <SelectValue placeholder="Reporting Manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-team">
              {user?.role === 'MANAGER' ? 'My Direct Reports' : 'My Department'}
            </SelectItem>
            <SelectItem value="all">All Employees</SelectItem>
            {reportingManagers.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold text-brand-slate dark:text-gray-400 uppercase">
                  By Manager
                </div>
                {reportingManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Employee Cards Grid */}
      {teamMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {teamMembers.map((member: Employee) => (
            <Card
              key={member.employeeId}
              className="group relative border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              onClick={() => navigate(`/employee/profile/${member.employeeId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/employee/profile/${member.employeeId}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View ${member.name}'s profile`}
            >
              <CardContent className="p-5">
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {member.name}
                    </h3>
                  </div>
                  <Badge
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0',
                      getStatusBadge(member.status)
                    )}
                  >
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Designation */}
                <p className="text-xs text-brand-slate dark:text-gray-400 mb-4">
                  {member.designation}
                </p>

                {/* Profile Picture */}
                <div className="flex justify-center mb-4">
                  {member.profilePhoto ? (
                    <img
                      src={member.profilePhoto}
                      alt={member.name}
                      className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold border-2 border-border">
                      {member.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                  )}
                </div>

                {/* Contact Information - Two Column Layout */}
                <div className="space-y-2.5">
                  {/* Email */}
                  <div className="flex items-start gap-2">
                    <Mail
                      className="h-4 w-4 text-brand-slate dark:text-gray-400 mt-0.5 flex-shrink-0"
                      aria-label="Email"
                    />
                    <span className="text-xs text-muted-foreground break-all leading-relaxed">
                      {member.email}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="h-4 w-4 text-brand-slate dark:text-gray-400 mt-0.5 flex-shrink-0"
                      aria-label="Location"
                    />
                    <span className="text-xs text-brand-navy dark:text-gray-300 leading-relaxed">
                      {member.location || 'Not specified'}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-2">
                    <Phone
                      className="h-4 w-4 text-brand-slate dark:text-gray-400 mt-0.5 flex-shrink-0"
                      aria-label="Phone"
                    />
                    <span className="text-xs text-brand-navy dark:text-gray-300 leading-relaxed">
                      {member.phone || 'Not specified'}
                    </span>
                  </div>

                  {/* Birthday */}
                  <div className="flex items-start gap-2">
                    <Calendar
                      className="h-4 w-4 text-brand-slate dark:text-gray-400 mt-0.5 flex-shrink-0"
                      aria-label="Birthday"
                    />
                    <span className="text-xs text-brand-navy dark:text-gray-300 leading-relaxed">
                      {formatBirthday(member.dateOfBirth)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm border-border">
          <CardContent className="py-16 text-center">
            <Users className="h-16 w-16 mx-auto text-brand-slate/50 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No team members found
            </h3>
            <p className="text-brand-slate dark:text-gray-400 max-w-md mx-auto">
              {searchQuery || filterDepartment !== 'all' || filterManager !== 'my-team'
                ? 'No members match your search criteria. Try adjusting your filters.'
                : 'There are no team members available at the moment.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
