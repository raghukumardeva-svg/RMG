import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  UserCheck, 
  UserX, 
  Home, 
  Briefcase,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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
import { useEmployeeStore } from '@/store/employeeStore';
import { useAttendanceStore } from '@/store/attendanceStore';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'wfh' | 'half-day';

interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workHours?: string;
  isLate?: boolean;
}

export function AttendanceManagement() {
  const { employees, fetchEmployees } = useEmployeeStore();
  const { records, fetchAttendanceRecords } = useAttendanceStore();
  
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, [fetchEmployees, fetchAttendanceRecords]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = employees.map(emp => emp.department);
    return ['all', ...Array.from(new Set(depts))];
  }, [employees]);

  // Generate mock attendance data (replace with real API data)
  const attendanceData = useMemo((): AttendanceRecord[] => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    
    return activeEmployees.map(emp => {
      const hasRecord = records.find(r => r.employeeId === emp.employeeId);
      const randomStatus = Math.random();
      
      let status: AttendanceStatus = 'absent';
      let checkIn: string | undefined;
      let checkOut: string | undefined;
      let workHours: string | undefined;
      let isLate = false;

      if (hasRecord?.checkIn) {
        status = hasRecord.checkOut ? 'present' : 'present';
        checkIn = hasRecord.checkIn;
        checkOut = hasRecord.checkOut;
        workHours = hasRecord.effectiveHours;
        
        // Check if late (after 9:30 AM)
        const checkInTime = new Date(`2000-01-01 ${checkIn}`);
        const lateThreshold = new Date('2000-01-01 09:30:00');
        isLate = checkInTime > lateThreshold;
      } else {
        // Simulate attendance for demo
        if (randomStatus < 0.75) {
          status = 'present';
          checkIn = `09:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          checkOut = `18:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          workHours = `${8 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 6)}`;
          isLate = parseInt(checkIn.split(':')[1]) > 30;
        } else if (randomStatus < 0.85) {
          status = 'wfh';
          checkIn = `09:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
          workHours = `${8 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 6)}`;
        } else if (randomStatus < 0.90) {
          status = 'leave';
        } else if (randomStatus < 0.95) {
          status = 'half-day';
          checkIn = `09:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}`;
          checkOut = `13:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          workHours = '4.0';
        }
      }

      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        date: selectedDate,
        status,
        checkIn,
        checkOut,
        workHours,
        isLate,
      };
    });
  }, [employees, records, selectedDate]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = attendanceData.length;
    const present = attendanceData.filter(a => a.status === 'present' || a.status === 'wfh').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;
    const onLeave = attendanceData.filter(a => a.status === 'leave').length;
    const wfh = attendanceData.filter(a => a.status === 'wfh').length;
    const lateArrivals = attendanceData.filter(a => a.isLate).length;
    const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';

    return { total, present, absent, onLeave, wfh, lateArrivals, attendanceRate };
  }, [attendanceData]);

  // Department-wise breakdown
  const departmentStats = useMemo(() => {
    const stats: Record<string, { total: number; present: number; absent: number }> = {};
    
    attendanceData.forEach(record => {
      if (!stats[record.department]) {
        stats[record.department] = { total: 0, present: 0, absent: 0 };
      }
      stats[record.department].total += 1;
      if (record.status === 'present' || record.status === 'wfh') {
        stats[record.department].present += 1;
      } else {
        stats[record.department].absent += 1;
      }
    });

    return Object.entries(stats).map(([dept, data]) => ({
      department: dept,
      ...data,
      rate: ((data.present / data.total) * 100).toFixed(1),
    }));
  }, [attendanceData]);

  // Filter attendance data
  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [attendanceData, searchQuery, departmentFilter, statusFilter]);

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants = {
      present: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      absent: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      leave: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      wfh: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      'half-day': 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
    };

    const labels = {
      present: 'Present',
      absent: 'Absent',
      leave: 'On Leave',
      wfh: 'WFH',
      'half-day': 'Half Day',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleExport = () => {
    toast.success('Exporting attendance data...', {
      description: 'Your report will be downloaded shortly',
    });
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = direction === 'prev' 
      ? subDays(currentDate, 1) 
      : new Date(currentDate.getTime() + 86400000);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Calendar className="h-7 w-7 text-primary" />
            Attendance Management
          </h1>
          <p className="page-description">Monitor and manage company-wide attendance</p>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Date Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleDateChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
              >
                Today
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={dateRange === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('today')}
              >
                Today
              </Button>
              <Button
                variant={dateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('week')}
              >
                This Week
              </Button>
              <Button
                variant={dateRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('month')}
              >
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Briefcase className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            <p className="text-xs text-muted-foreground">
              {stats.attendanceRate}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.onLeave}</div>
            <p className="text-xs text-muted-foreground">Approved leaves</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.lateArrivals}</div>
            <p className="text-xs text-muted-foreground">After 9:30 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Department-wise Attendance
          </CardTitle>
          <CardDescription>Attendance breakdown by department for {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.department}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      {dept.present}/{dept.total} present
                    </span>
                    <span className="font-semibold text-green-600">{dept.rate}%</span>
                  </div>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${dept.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Employee Attendance Records</CardTitle>
              <CardDescription>
                {filteredData.length} of {attendanceData.length} employees
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="leave">On Leave</SelectItem>
                  <SelectItem value="wfh">WFH</SelectItem>
                  <SelectItem value="half-day">Half Day</SelectItem>
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
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => (
                    <TableRow key={record.employeeId} className={record.isLate ? 'bg-orange-50 dark:bg-orange-900/5' : ''}>
                      <TableCell className="font-medium">
                        {record.employeeId}
                        {record.isLate && (
                          <Badge variant="outline" className="ml-2 text-xs bg-orange-100 text-orange-700">
                            Late
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.department}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.checkIn || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {record.checkOut || '-'}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {record.workHours ? `${record.workHours}h` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
