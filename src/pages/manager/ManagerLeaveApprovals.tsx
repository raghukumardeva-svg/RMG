import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useEmployeeStore } from '@/store/employeeStore';
import { useLeaveStore } from '@/store/leaveStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, XCircle, Eye, Search, Filter, MoreVertical, Calendar, Clock, FileText, Mail, Building2, User, Palmtree, CircleDot, Circle, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaveRequest } from '@/types/leave';
import { format } from 'date-fns';

export function ManagerLeaveApprovals() {
  const { user } = useAuthStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { leaves, fetchLeaves, approveLeave, rejectLeave } = useLeaveStore();

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showViewRequestDrawer, setShowViewRequestDrawer] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [actionRequest, setActionRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const loadLeaveRequests = useCallback(async () => {
    try {
      // Fetch all leaves - will filter to team members later
      await fetchLeaves();
    } catch {
      toast.error('Failed to load leave requests');
    }
  }, [fetchLeaves]);

  useEffect(() => {
    fetchEmployees();
    loadLeaveRequests();
  }, [fetchEmployees, loadLeaveRequests]);

  // Get reporting employees (team members)
  const reportingEmployees = useMemo(() => {
    if (!user?.employeeId) return [];
    return employees.filter(emp => emp.reportingManagerId === user.employeeId);
  }, [employees, user]);

  // Filter leave requests for team members
  const teamLeaveRequests = useMemo(() => {
    const reportingIds = new Set(reportingEmployees.map(emp => emp.employeeId));

    let filtered = leaves.filter(leave => {
      // Filter by team members
      const isTeamMember = reportingIds.has(leave.employeeId || leave.userId);
      // Filter by manager ID as well
      const isMyTeam = leave.managerId === user?.employeeId;
      return isTeamMember || isMyTeam;
    });

    // Apply status filter
    if (requestStatusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === requestStatusFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(req =>
        req.userName?.toLowerCase().includes(query) ||
        req.leaveType.toLowerCase().includes(query) ||
        req.department?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, reportingEmployees, requestStatusFilter, searchQuery, user]);

  const handleApproveRequest = (request: LeaveRequest) => {
    setActionRequest(request);
    setShowApproveDialog(true);
  };

  const confirmApprove = async () => {
    if (!actionRequest || !user?.name) return;

    try {
      const leaveId = actionRequest.id || actionRequest._id || '';
      await approveLeave(leaveId, user.name);
      toast.success('Leave approved successfully');
      setShowApproveDialog(false);
      setActionRequest(null);
      await loadLeaveRequests();
    } catch {
      toast.error('Failed to approve leave');
    }
  };

  const handleRejectRequest = (request: LeaveRequest) => {
    setActionRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!actionRequest || !user?.name || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      const leaveId = actionRequest.id || actionRequest._id || '';
      await rejectLeave(leaveId, user.name, rejectionReason);
      toast.success('Leave rejected');
      setShowRejectDialog(false);
      setActionRequest(null);
      setRejectionReason('');
      await loadLeaveRequests();
    } catch {
      toast.error('Failed to reject leave');
    }
  };

  const handleViewRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setShowViewRequestDrawer(true);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'cancelled':
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <CalendarCheck className="h-7 w-7 text-primary" />
            Leave Approvals
          </h1>
          <p className="page-description">
            Review and approve leave requests from your team
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamLeaveRequests.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teamLeaveRequests.filter(r => r.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamLeaveRequests.length}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Unified Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Team Leave Requests</CardTitle>
              <CardDescription>
                {teamLeaveRequests.length} request{teamLeaveRequests.length !== 1 ? 's' : ''} from your team
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              <Select value={requestStatusFilter} onValueChange={(value) => setRequestStatusFilter(value as typeof requestStatusFilter)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {teamLeaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || requestStatusFilter !== 'all'
                ? 'No leave requests found matching your filters.'
                : 'No leave requests from your team.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamLeaveRequests.map((request) => (
                    <TableRow
                      key={request.id || request._id}
                      className={request.status === 'pending' ? 'bg-orange-50 dark:bg-orange-900/10' : ''}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.employeeName || request.userName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{request.employeeId || request.userId}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.leaveType}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(request.startDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(request.endDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {request.days} day{request.days > 1 ? 's' : ''}
                        {request.isHalfDay && <span className="text-xs text-muted-foreground ml-1">(Half)</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeClass(request.status)}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewRequest(request)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {request.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleApproveRequest(request)}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleRejectRequest(request)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Leave Request Confirmation */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this leave request for <strong>{actionRequest?.userName}</strong>?
              <br />
              <br />
              Leave Type: {actionRequest?.leaveType}
              <br />
              Duration: {actionRequest?.days} day{actionRequest && actionRequest.days > 1 ? 's' : ''}
              <br />
              Dates: {actionRequest && format(new Date(actionRequest.startDate), 'MMM dd')} - {actionRequest && format(new Date(actionRequest.endDate), 'MMM dd, yyyy')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmApprove}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              Approve Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Leave Request Confirmation */}
      <AlertDialog open={showRejectDialog} onOpenChange={(open) => {
        setShowRejectDialog(open);
        if (!open) {
          setActionRequest(null);
          setRejectionReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Leave Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this leave request for <strong>{actionRequest?.userName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={!rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Reject Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Leave Request Drawer */}
      <Sheet open={showViewRequestDrawer} onOpenChange={setShowViewRequestDrawer}>
        <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b bg-background">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-xl">
                <Palmtree className="h-5 w-5 text-primary" />
                Leave Request Details
              </SheetTitle>
            </SheetHeader>
          </div>
          
          {/* Scrollable Body */}
          {selectedRequest && (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
              {/* Employee Header Card */}
              <div className="bg-primary/5 rounded-xl p-5 border">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    <AvatarImage src={employees.find(e => e.employeeId === (selectedRequest.employeeId || selectedRequest.userId))?.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                      {(selectedRequest.employeeName || selectedRequest.userName || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">
                      {selectedRequest.employeeName || selectedRequest.userName || 'Unknown'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {selectedRequest.employeeId || selectedRequest.userId}
                      </span>
                      {selectedRequest.department && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {selectedRequest.department}
                        </span>
                      )}
                    </div>
                    {selectedRequest.userEmail && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedRequest.userEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Date & Duration Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Leave Period</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {format(new Date(selectedRequest.startDate), 'MMM dd')} - {format(new Date(selectedRequest.endDate), 'MMM dd')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedRequest.startDate), 'yyyy')}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-900">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Duration</span>
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedRequest.days} {selectedRequest.days === 1 ? 'Day' : 'Days'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.isHalfDay 
                      ? (selectedRequest.halfDayType === 'first_half' ? 'First Half' : 'Second Half')
                      : 'Full Day'}
                  </p>
                </div>
              </div>

              {/* Leave Type & Status Row */}
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4 border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Palmtree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Leave Type</p>
                    <p className="font-semibold text-foreground">{selectedRequest.leaveType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={`text-sm px-3 py-1 ${getStatusBadgeClass(selectedRequest.status)}`}
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Reason Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Reason / Justification</Label>
                </div>
                <div className="bg-muted/30 border rounded-xl p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {selectedRequest.justification || selectedRequest.leaveReason || 'No reason provided'}
                  </p>
                </div>
              </div>

              {/* Leave Balance Indicator (Mock - would need actual balance data) */}
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    Leave Balance (After Approval)
                  </span>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                    {selectedRequest.leaveType}
                  </span>
                </div>
                <div className="space-y-2">
                  <Progress value={70} className="h-2 bg-amber-200 dark:bg-amber-900" />
                  <div className="flex justify-between text-xs text-amber-600 dark:text-amber-500">
                    <span>Used: {selectedRequest.days} days (this request)</span>
                    <span>Remaining balance will be updated after approval</span>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Request Timeline</Label>
                </div>
                <div className="relative pl-6 space-y-4">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
                  
                  {/* Applied */}
                  <div className="relative flex items-start gap-3">
                    <div className="absolute left-[-24px] top-0.5 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Request Submitted</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedRequest.createdAt), 'MMMM dd, yyyy \'at\' hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Current Status */}
                  {selectedRequest.status === 'pending' && (
                    <div className="relative flex items-start gap-3">
                      <div className="absolute left-[-24px] top-0.5 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                        <CircleDot className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Awaiting Approval</p>
                        <p className="text-xs text-muted-foreground">Pending manager review</p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <div className="relative flex items-start gap-3">
                      <div className="absolute left-[-24px] top-0.5 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Approved</p>
                        <p className="text-xs text-muted-foreground">
                          by {selectedRequest.approvedBy || 'Manager'}
                          {selectedRequest.approvedAt && ` on ${format(new Date(selectedRequest.approvedAt), 'MMM dd, yyyy')}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'rejected' && (
                    <div className="relative flex items-start gap-3">
                      <div className="absolute left-[-24px] top-0.5 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center">
                        <XCircle className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</p>
                        <p className="text-xs text-muted-foreground">
                          by {selectedRequest.rejectedBy || 'Manager'}
                          {selectedRequest.rejectedAt && ` on ${format(new Date(selectedRequest.rejectedAt), 'MMM dd, yyyy')}`}
                        </p>
                        {selectedRequest.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                            <p className="text-xs text-red-700 dark:text-red-400">{selectedRequest.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedRequest.status === 'cancelled' && (
                    <div className="relative flex items-start gap-3">
                      <div className="absolute left-[-24px] top-0.5 h-5 w-5 rounded-full bg-gray-500 flex items-center justify-center">
                        <Circle className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cancelled</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedRequest.cancelledBy && `by ${selectedRequest.cancelledBy}`}
                          {selectedRequest.cancelledAt && ` on ${format(new Date(selectedRequest.cancelledAt), 'MMM dd, yyyy')}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}

          {/* Fixed Footer - Action Buttons */}
          {selectedRequest && selectedRequest.status === 'pending' && (
            <div className="flex-shrink-0 px-6 py-4 border-t bg-background">
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowViewRequestDrawer(false);
                    handleApproveRequest(selectedRequest);
                  }}
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg shadow-green-500/25"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    setShowViewRequestDrawer(false);
                    handleRejectRequest(selectedRequest);
                  }}
                  variant="destructive"
                  className="flex-1 h-12 font-semibold shadow-lg shadow-red-500/25"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
