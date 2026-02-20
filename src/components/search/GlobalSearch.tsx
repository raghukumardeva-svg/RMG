import { useState, useEffect, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Clock, 
  Calendar, 
  UserCheck, 
  FileText, 
  DollarSign,
  LogOut,
  ArrowUp,
  ArrowDown,
  CornerDownLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { employeeService } from '@/services/employeeService';
import { escapeHtml } from '@/utils/sanitize';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Clock;
  path: string;
  keywords: string[];
}

interface Employee {
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  photo?: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'web-clock-in',
    label: 'Web Clock-In',
    description: 'Mark your attendance for today',
    icon: Clock,
    path: '/attendance',
    keywords: ['clock in', 'check in', 'punch in', 'web clock', 'attendance'],
  },
  {
    id: 'web-clock-out',
    label: 'Web Clock-Out',
    description: 'Clock out from your shift',
    icon: LogOut,
    path: '/attendance',
    keywords: ['clock out', 'check out', 'punch out', 'logout'],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'View your attendance records',
    icon: UserCheck,
    path: '/attendance',
    keywords: ['attendance', 'present', 'absent', 'records'],
  },
  {
    id: 'apply-leave',
    label: 'Apply Leave',
    description: 'Submit a new leave request',
    icon: FileText,
    path: '/leave',
    keywords: ['apply', 'leave', 'vacation', 'time off', 'request'],
  },
  {
    id: 'payslips',
    label: 'Payslips',
    description: 'View and download payslips',
    icon: DollarSign,
    path: '/payroll',
    keywords: ['payslips', 'salary', 'payment', 'payroll'],
  },
  {
    id: 'leaves',
    label: 'Leaves',
    description: 'View leave history and balance',
    icon: Calendar,
    path: '/leave',
    keywords: ['leaves', 'leave history', 'time off', 'balance'],
  },
];

export function GlobalSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Compute filtered results with memoization for performance
  const query = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);
  
  const filteredActions = useMemo(() => {
    if (!query) return quickActions;
    return quickActions.filter((action) =>
      action.keywords.some((keyword) => keyword.includes(query)) ||
      action.label.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredEmployees = useMemo(() => {
    if (!query) return [];
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(query) ||
      emp.employeeId.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      emp.designation.toLowerCase().includes(query) ||
      emp.department.toLowerCase().includes(query)
    ).slice(0, 5); // Limit to 5 results
  }, [query, employees]);

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await employeeService.getAll();
        setEmployees(data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  // Handle Alt + K shortcut
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const totalItems = filteredActions.length + filteredEmployees.length;

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectItem(selectedIndex);
    }
  };

  const handleSelectItem = (index: number) => {
    if (index < filteredActions.length) {
      // Navigate to action
      const action = filteredActions[index];
      navigate(action.path);
    } else {
      // Navigate to employee profile
      const employeeIndex = index - filteredActions.length;
      const employee = filteredEmployees[employeeIndex];
      navigate(`/employee/profile/${employee.employeeId}`);
    }
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleActionClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const handleEmployeeClick = (employeeId: string) => {
    navigate(`/employee/profile/${employeeId}`);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  const showDropdown = isOpen && (filteredActions.length > 0 || filteredEmployees.length > 0 || !searchQuery.trim());

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return escapeHtml(text);
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part) => 
      part.toLowerCase() === query.toLowerCase() 
        ? `<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-gray-900 dark:text-white">${escapeHtml(part)}</mark>`
        : escapeHtml(part)
    ).join('');
  };

  const quickTags = ['Apply Leave', 'Web Clock-In'];

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Search Input - Full Rounded Pill Style */}
      <div className="relative">
        <Search 
          className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" 
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search employees or actions (Ex: Apply Leave)"
          aria-label="Global search"
          aria-expanded={showDropdown}
          aria-controls="search-drawer"
          aria-autocomplete="list"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-24 h-12 rounded-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-medium">
            <span className="text-xs">Alt</span>
            <span>+</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Search Drawer */}
      {showDropdown && (
        <div
          id="search-drawer"
          role="dialog"
          aria-modal="true"
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery.trim() ? 'Search results' : 'Search any action or ask for help'}
            </p>
            {!searchQuery.trim() && (
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => setSearchQuery(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Content */}
          <div className="max-h-[400px] overflow-y-auto">
            {/* Quick Actions Section */}
            {filteredActions.length > 0 && (
              <div className="p-3">
                <div className="px-2 py-1 mb-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quick Actions
                  </p>
                </div>
                <div className="space-y-1" role="listbox">
                  {filteredActions.map((action, index) => {
                    const Icon = action.icon;
                    const isSelected = index === selectedIndex;
                    return (
                      <button
                        key={action.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleActionClick(action.path)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-left ${
                          isSelected
                            ? 'bg-primary/10 dark:bg-primary/20'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {action.label}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {action.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Employees Section */}
            {filteredEmployees.length > 0 && (
              <>
                {filteredActions.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700" />
                )}
                <div className="p-3">
                  <div className="px-2 py-1 mb-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Employees
                    </p>
                  </div>
                  <div className="space-y-1" role="listbox">
                    {filteredEmployees.map((employee, index) => {
                      const actualIndex = filteredActions.length + index;
                      const isSelected = actualIndex === selectedIndex;
                      return (
                        <button
                          key={employee.employeeId}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleEmployeeClick(employee.employeeId)}
                          onMouseEnter={() => setSelectedIndex(actualIndex)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-left ${
                            isSelected
                              ? 'bg-primary/10 dark:bg-primary/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium overflow-hidden flex-shrink-0">
                            {employee.photo ? (
                              <img src={employee.photo} alt={employee.name} className="h-full w-full object-cover" />
                            ) : (
                              employee.name.charAt(0)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="text-sm font-medium text-gray-900 dark:text-white"
                              dangerouslySetInnerHTML={{ __html: highlightMatch(employee.name, query) }}
                            />
                            <p className="text-xs text-muted-foreground truncate">
                              {employee.designation} • {employee.department}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* No Results */}
            {searchQuery.trim() && filteredActions.length === 0 && filteredEmployees.length === 0 && (
              <div className="p-6 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No results found</p>
                <p className="text-xs text-muted-foreground">
                  Try searching for employees, actions, or features
                </p>
              </div>
            )}
          </div>

          {/* Keyboard Navigation Footer */}
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="font-medium">Navigate</span>
                  <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px]">
                    <ArrowUp className="h-3 w-3" />
                  </kbd>
                  <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px]">
                    <ArrowDown className="h-3 w-3" />
                  </kbd>
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-medium">To select</span>
                  <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px]">
                    <CornerDownLeft className="h-3 w-3" />
                  </kbd>
                </span>
              </div>
              <span className="flex items-center gap-2">
                <span className="font-medium">Close</span>
                <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px]">
                  ESC
                </kbd>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
