import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { leaveService, type LeaveRequestData } from '@/services/leaveService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
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
import { Calendar, Plus, Eye, Search, Filter, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Paid Leave', 'Remote Work', 'Other'];

export function LeaveManagement() {
  const { user } = useAuthStore();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');

  // Form state
  const [formData, setFormData] = useState({
    leaveType: 'Casual Leave',
    fromDate: '',
    toDate: '',
    reason: '',
  });

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const data = await leaveService.getAllRequests();
      setLeaveRequests(data);
    } catch (error) {
      console.error('Failed to load leave requests:', error);
      toast.error('Failed to load leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter requests for current user
  const myRequests = useMemo(() => {
    if (!user?.employeeId) return [];
    
    let filtered = leaveRequests.filter(req => req.employeeId === user.employeeId);

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.leaveType.toLowerCase().includes(query) ||
        req.reason.toLowerCase().includes(query)
      );
    }

    // Sort by applied date (newest first)
    return filtered.sort((a, b) => new Date(b.appliedOn).getTime() - new Date(a.appliedOn).getTime());
  }, [leaveRequests, user, statusFilter, searchQuery]);

  const calculateDays = (from: string, to: string): number => {
    if (!from || !to) return 0;
    const start = new Date(from);
    const end = new Date(to);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmitLeave = async () => {
    if (!user?.employeeId || !user?.name || !user?.department) {
      console.error('User data missing:', user);
      toast.error('User information not available');
      return;
    }

    if (!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const days = calculateDays(formData.fromDate, formData.toDate);

    const requestData = {
      employeeId: user.employeeId,
      employeeName: user.name,
      department: user.department,
      leaveType: formData.leaveType,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
      days,
      reason: formData.reason,
    };

    try {
      setIsLoading(true);
      const result = await leaveService.createRequest(requestData);

      toast.success('Leave request submitted for approval');
      setShowApplyDialog(false);
      setFormData({
        leaveType: 'Casual Leave',
        fromDate: '',
        toDate: '',
        reason: '',
      });
      await loadLeaveRequests();
    } catch (error) {
      console.error('Failed to submit leave:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequest = (request: LeaveRequestData) => {
    setSelectedRequest(request);
    setShowViewDialog(true);
  };

  const getStatusBadge = (status: LeaveRequestData['status']) => {
    const variants: Record<LeaveRequestData['status'], { className: string }> = {
      Pending: { className: 'bg-orange-100 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400' },
      Approved: { className: 'bg-green-100 text-green-700' },
      Rejected: { className: 'bg-red-100 text-red-700' },
    };

    return (
      <Badge variant="outline" className={variants[status].className}>
        {status}
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const userRequests = user?.employeeId 
      ? leaveRequests.filter(r => r.employeeId === user.employeeId)
      : [];
    
    return {
      pending: userRequests.filter(r => r.status === 'Pending').length,
      approved: userRequests.filter(r => r.status === 'Approved').length,
      rejected: userRequests.filter(r => r.status === 'Rejected').length,
    };
  }, [leaveRequests, user]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <CalendarDays className="h-7 w-7 text-primary" />
            My Leave Requests
          </h1>
          <p className="page-description">Apply for leave and track your requests</p>
        </div>
        <Button onClick={() => setShowApplyDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Approved leaves</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>My Leave History</CardTitle>
              <CardDescription>View and track all your leave requests</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading leave requests...
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== 'all'
                ? 'No leave requests found matching your filters.'
                : 'No leave requests yet. Click "Apply Leave" to submit your first request.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((request) => (
                    <TableRow key={request.id || request._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {request.leaveType}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(request.fromDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(request.toDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{request.days} day{request.days > 1 ? 's' : ''}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {request.reason}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(request.appliedOn).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Leave Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>
              Submit a new leave request for manager approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leave-type">
                Leave Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
              >
                <SelectTrigger id="leave-type" className="mt-2">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from-date">
                  From Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="from-date"
                  type="date"
                  value={formData.fromDate}
                  onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="to-date">
                  To Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="to-date"
                  type="date"
                  value={formData.toDate}
                  onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                  className="mt-2"
                  min={formData.fromDate}
                />
              </div>
            </div>
            {formData.fromDate && formData.toDate && (
              <div className="text-sm text-muted-foreground">
                Duration: {calculateDays(formData.fromDate, formData.toDate)} day(s)
              </div>
            )}
            <div>
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for leave..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApplyDialog(false);
                setFormData({
                  leaveType: 'Casual Leave',
                  fromDate: '',
                  toDate: '',
                  reason: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitLeave}
              disabled={!formData.leaveType || !formData.fromDate || !formData.toDate || !formData.reason.trim() || isLoading}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
            <DialogDescription>
              Complete information about your leave request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Leave Type</Label>
                  <p className="mt-1 font-medium">{selectedRequest.leaveType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duration</Label>
                  <p className="mt-1">{selectedRequest.days} day{selectedRequest.days > 1 ? 's' : ''}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">From Date</Label>
                  <p className="mt-1">
                    {new Date(selectedRequest.fromDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">To Date</Label>
                  <p className="mt-1">
                    {new Date(selectedRequest.toDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap bg-muted-color p-3 rounded-md">{selectedRequest.reason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Applied On</Label>
                <p className="mt-1 text-sm">
                  {new Date(selectedRequest.appliedOn).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
              {selectedRequest.status === 'Approved' && selectedRequest.reviewedBy && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Approved By</Label>
                  <p className="mt-1">{selectedRequest.reviewedBy}</p>
                  {selectedRequest.reviewedOn && (
                    <p className="text-sm text-muted-foreground">
                      on {new Date(selectedRequest.reviewedOn).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {selectedRequest.status === 'Rejected' && selectedRequest.reviewedBy && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Rejected By</Label>
                  <p className="mt-1">{selectedRequest.reviewedBy}</p>
                  {selectedRequest.reviewedOn && (
                    <p className="text-sm text-muted-foreground">
                      on {new Date(selectedRequest.reviewedOn).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
