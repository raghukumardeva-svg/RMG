import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Send, 
  TrendingUp,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployeeStore } from '@/store/employeeStore';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PayrollRecord {
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  basicSalary: number;
  hra: number;
  da: number;
  allowances: number;
  grossSalary: number;
  taxDeduction: number;
  pfDeduction: number;
  otherDeductions: number;
  netSalary: number;
  status: 'pending' | 'processed' | 'paid';
  paymentDate?: string;
  payPeriod: string;
}

interface SalaryComponent {
  name: string;
  amount: number;
  percentage?: number;
}

export function PayrollManagement() {
  const { employees, fetchEmployees } = useEmployeeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollRecord | null>(null);
  const [showPayslipDialog, setShowPayslipDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Generate payroll records with salary components
  const payrollRecords = useMemo((): PayrollRecord[] => {
    const activeEmployees = employees.filter(emp => emp.status === 'active');
    
    return activeEmployees.map((emp) => {
      // Salary structure (mock data - replace with actual salary from employee data)
      const basicSalary = 50000 + Math.floor(Math.random() * 100000);
      const hra = basicSalary * 0.40; // 40% of basic
      const da = basicSalary * 0.15; // 15% of basic
      const allowances = basicSalary * 0.10; // 10% of basic
      const grossSalary = basicSalary + hra + da + allowances;
      
      // Deductions
      const taxDeduction = grossSalary * 0.10; // 10% tax
      const pfDeduction = basicSalary * 0.12; // 12% PF on basic
      const otherDeductions = Math.floor(Math.random() * 2000);
      const netSalary = grossSalary - taxDeduction - pfDeduction - otherDeductions;

      const statusOptions: PayrollRecord['status'][] = ['pending', 'processed', 'paid'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

      return {
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.department,
        designation: emp.designation,
        basicSalary,
        hra,
        da,
        allowances,
        grossSalary,
        taxDeduction,
        pfDeduction,
        otherDeductions,
        netSalary,
        status,
        paymentDate: status === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        payPeriod: selectedMonth,
      };
    });
  }, [employees, selectedMonth]);

  // Get unique departments
  const departments = useMemo(() => {
    const depts = employees.map(emp => emp.department);
    return ['all', ...Array.from(new Set(depts))];
  }, [employees]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPayroll = payrollRecords.reduce((sum, rec) => sum + rec.netSalary, 0);
    const totalEmployees = payrollRecords.length;
    const avgSalary = totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0;
    const processedCount = payrollRecords.filter(r => r.status === 'processed' || r.status === 'paid').length;
    const pendingCount = payrollRecords.filter(r => r.status === 'pending').length;
    const paidCount = payrollRecords.filter(r => r.status === 'paid').length;

    return {
      totalPayroll,
      totalEmployees,
      avgSalary,
      processedCount,
      pendingCount,
      paidCount,
    };
  }, [payrollRecords]);

  // Department-wise breakdown
  const departmentStats = useMemo(() => {
    const stats: Record<string, { employees: number; amount: number }> = {};
    
    payrollRecords.forEach(record => {
      if (!stats[record.department]) {
        stats[record.department] = { employees: 0, amount: 0 };
      }
      stats[record.department].employees += 1;
      stats[record.department].amount += record.netSalary;
    });

    return Object.entries(stats)
      .map(([dept, data]) => ({
        department: dept,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [payrollRecords]);

  // Filter payroll records
  const filteredRecords = useMemo(() => {
    return payrollRecords.filter(record => {
      const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           record.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || record.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [payrollRecords, searchQuery, departmentFilter, statusFilter]);

  const getStatusBadge = (status: PayrollRecord['status']) => {
    const variants = {
      pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      processed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    };

    const labels = {
      pending: 'Pending',
      processed: 'Processed',
      paid: 'Paid',
    };

    return (
      <Badge variant="outline" className={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleViewPayslip = (record: PayrollRecord) => {
    setSelectedEmployee(record);
    setShowPayslipDialog(true);
  };

  const handleProcessPayroll = () => {
    toast.success('Processing payroll...', {
      description: `Processing payroll for ${stats.pendingCount} employees`,
    });
  };

  const handleExport = () => {
    toast.success('Exporting payroll data...', {
      description: 'Your report will be downloaded shortly',
    });
  };

  const handleSendPayslips = () => {
    toast.success('Sending payslips...', {
      description: `Emailing payslips to ${stats.processedCount} employees`,
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <DollarSign className="h-7 w-7 text-primary" />
            Payroll Management
          </h1>
          <p className="page-description">Process and manage employee payroll</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSendPayslips} disabled={stats.processedCount === 0}>
            <Send className="h-4 w-4 mr-2" />
            Send Payslips
          </Button>
        </div>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <Label className="text-sm font-medium">Pay Period:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button onClick={handleProcessPayroll} disabled={stats.pendingCount === 0}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Process Payroll ({stats.pendingCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active count</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgSalary.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidCount}</div>
            <p className="text-xs text-muted-foreground">
              Paid / {stats.processedCount} Processed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="payroll">
        <TabsList>
          <TabsTrigger value="payroll">Payroll Records</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Payroll Records Tab */}
        <TabsContent value="payroll" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Payroll</CardTitle>
                  <CardDescription>
                    {filteredRecords.length} of {payrollRecords.length} employees
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
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
                      <TableHead className="text-right">Gross Salary</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No payroll records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.employeeId}>
                          <TableCell className="font-medium">{record.employeeId}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{record.designation}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{record.department}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${record.grossSalary.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -${(record.taxDeduction + record.pfDeduction + record.otherDeductions).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            ${record.netSalary.toLocaleString()}
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPayslip(record)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Breakdown</CardTitle>
              <CardDescription>Payroll summary by department for {format(new Date(selectedMonth), 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept) => (
                  <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div>
                      <p className="font-semibold text-lg">{dept.department}</p>
                      <p className="text-sm text-muted-foreground">{dept.employees} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${dept.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Avg: ${Math.round(dept.amount / dept.employees).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
              <CardDescription>Past payroll transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TransactionItem
                  description="November 2025 Payroll"
                  amount={stats.totalPayroll}
                  date={format(new Date(), 'MMM dd, yyyy')}
                  status="completed"
                />
                <TransactionItem
                  description="October 2025 Payroll"
                  amount={2350000}
                  date="Nov 1, 2025"
                  status="completed"
                />
                <TransactionItem
                  description="October 2025 Tax Filing"
                  amount={450000}
                  date="Oct 15, 2025"
                  status="completed"
                />
                <TransactionItem
                  description="Bonus Payout - Q3 2025"
                  amount={350000}
                  date="Oct 5, 2025"
                  status="completed"
                />
                <TransactionItem
                  description="September 2025 Payroll"
                  amount={2280000}
                  date="Oct 1, 2025"
                  status="completed"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payslip Dialog */}
      <Dialog open={showPayslipDialog} onOpenChange={setShowPayslipDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.payPeriod && format(new Date(selectedEmployee.payPeriod), 'MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Employee Name</p>
                  <p className="font-semibold">{selectedEmployee.employeeName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee ID</p>
                  <p className="font-semibold">{selectedEmployee.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Designation</p>
                  <p className="font-semibold">{selectedEmployee.designation}</p>
                </div>
              </div>

              {/* Earnings */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Earnings
                </h3>
                <div className="space-y-2 border rounded-lg p-4">
                  <SalaryRow label="Basic Salary" amount={selectedEmployee.basicSalary} />
                  <SalaryRow label="House Rent Allowance (HRA)" amount={selectedEmployee.hra} />
                  <SalaryRow label="Dearness Allowance (DA)" amount={selectedEmployee.da} />
                  <SalaryRow label="Other Allowances" amount={selectedEmployee.allowances} />
                  <div className="border-t pt-2 mt-2">
                    <SalaryRow 
                      label="Gross Salary" 
                      amount={selectedEmployee.grossSalary} 
                      isTotal 
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-red-500" />
                  Deductions
                </h3>
                <div className="space-y-2 border rounded-lg p-4">
                  <SalaryRow label="Income Tax (TDS)" amount={selectedEmployee.taxDeduction} isDeduction />
                  <SalaryRow label="Provident Fund (PF)" amount={selectedEmployee.pfDeduction} isDeduction />
                  <SalaryRow label="Other Deductions" amount={selectedEmployee.otherDeductions} isDeduction />
                  <div className="border-t pt-2 mt-2">
                    <SalaryRow 
                      label="Total Deductions" 
                      amount={selectedEmployee.taxDeduction + selectedEmployee.pfDeduction + selectedEmployee.otherDeductions} 
                      isTotal 
                      isDeduction
                    />
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border-2 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Net Salary</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${selectedEmployee.netSalary.toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(selectedEmployee.status)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => toast.success('Downloading payslip...')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={() => toast.success('Sending payslip via email...')}>
                  <Send className="h-4 w-4 mr-2" />
                  Email Payslip
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SalaryRow({ 
  label, 
  amount, 
  isTotal = false, 
  isDeduction = false 
}: { 
  label: string; 
  amount: number; 
  isTotal?: boolean;
  isDeduction?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${isTotal ? 'font-bold' : ''}`}>
      <span className={isTotal ? 'text-base' : 'text-sm text-muted-foreground'}>{label}</span>
      <span className={`${isTotal ? 'text-lg' : 'text-sm'} ${isDeduction ? 'text-red-600' : ''}`}>
        ${amount.toLocaleString()}
      </span>
    </div>
  );
}

function TransactionItem({
  description,
  amount,
  date,
  status,
}: {
  description: string;
  amount: number;
  date: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="font-medium">{description}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {date}
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-4">
        <p className="text-lg font-semibold">${amount.toLocaleString()}</p>
        <Badge variant="outline" className="bg-green-100 text-green-700">
          {status}
        </Badge>
      </div>
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
