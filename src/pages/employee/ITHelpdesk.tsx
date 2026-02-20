import { useEffect, useState, useMemo } from 'react';
import { useHelpdeskStore } from '@/store/helpdeskStore';
import { useAuthStore } from '@/store/authStore';
import { sanitizeString } from '@/utils/sanitize';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { Badge } from '@/components/ui/badge';
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
  SheetDescription,
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
import { ConversationThread } from '@/components/helpdesk/ConversationThread';
import { TicketSummaryHeader } from '@/components/helpdesk/TicketSummaryHeader';
import { CompactTicketFlow } from '@/components/helpdesk/CompactTicketFlow';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import {
  Laptop,
  Monitor,
  Download,
  Key,
  Wifi,
  Mail,
  MoreHorizontal,
  Plus,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  FileText,
  Paperclip,
  MessageSquare,
  Activity,
  Info,
} from 'lucide-react';
import { REQUEST_TYPES, URGENCY_LEVELS, type HelpdeskFormData, type HelpdeskTicket } from '@/types/helpdesk';

const getRequestTypeIcon = (type: string) => {
  switch (type) {
    case 'Laptop Issue':
      return <Laptop className="h-4 w-4" />;
    case 'Monitor Issue':
      return <Monitor className="h-4 w-4" />;
    case 'Software Installation':
      return <Download className="h-4 w-4" />;
    case 'Access Request':
      return <Key className="h-4 w-4" />;
    case 'Network Issue':
      return <Wifi className="h-4 w-4" />;
    case 'Email Issue':
      return <Mail className="h-4 w-4" />;
    default:
      return <MoreHorizontal className="h-4 w-4" />;
  }
};

const getStatusBadge = (status: HelpdeskTicket['status']) => {
  const variants: Record<HelpdeskTicket['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactElement; className: string }> = {
    'Open': {
      variant: 'default',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
    },
    'In Progress': {
      variant: 'secondary',
      icon: <Clock className="h-3 w-3 mr-1" />,
      className: 'bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400'
    },
    'Resolved': {
      variant: 'outline',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
      className: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
    },
    'Closed': {
      variant: 'secondary',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900/30 dark:text-gray-400'
    },
    'Cancelled': {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
      className: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
    },
  };

  const config = variants[status];
  return (
    <Badge variant={config.variant} className={config.className}>
      {config.icon}
      {status}
    </Badge>
  );
};

const getUrgencyBadge = (urgency: string) => {
  const variants: Record<string, string> = {
    'Low': 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    'Medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'High': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    'Critical': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Badge variant="outline" className={variants[urgency]}>
      {urgency}
    </Badge>
  );
};

export default function ITHelpdesk() {
  const { user } = useAuthStore();
  const { tickets, isLoading, fetchTickets, createTicket, deleteTicket, addMessage, getTicketById } = useHelpdeskStore();

  const [formData, setFormData] = useState<HelpdeskFormData>({
    requestType: 'Laptop Issue',
    subject: '',
    description: '',
    urgency: 'Low',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HelpdeskFormData, string>>>({});
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [showTicketDrawer, setShowTicketDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const saved = sessionStorage.getItem('it-helpdesk-status-filter');
    return saved ? JSON.parse(saved) : [];
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  // Persist status filter to session storage
  useEffect(() => {
    sessionStorage.setItem('it-helpdesk-status-filter', JSON.stringify(statusFilter));
  }, [statusFilter]);

  useEffect(() => {
    if (user?.id) {
      fetchTickets(user.id);
    }
  }, [user, fetchTickets]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'Open').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    const closed = tickets.filter(t => t.status === 'Closed').length;

    return { total, open, inProgress, resolved, closed };
  }, [tickets]);

  // Filter and search tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    // Apply status filter
    if (statusFilter.length > 0) {
      result = result.filter(t => statusFilter.includes(t.status));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.id.toLowerCase().includes(query) ||
        t.requestType.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tickets, statusFilter, searchQuery]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof HelpdeskFormData, string>> = {};

    if (!formData.requestType) {
      errors.requestType = 'Request type is required';
    }
    if (!formData.subject || formData.subject.trim().length === 0) {
      errors.subject = 'Subject is required';
    }
    if (!formData.description || formData.description.trim().length === 0) {
      errors.description = 'Description is required';
    }
    if (!formData.urgency) {
      errors.urgency = 'Urgency level is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      return;
    }

    try {
      // Sanitize and add attachments to form data
      const formDataWithAttachments = {
        ...formData,
        subject: sanitizeString(formData.subject),
        description: sanitizeString(formData.description),
        attachments: attachedFiles,
      };

      await createTicket(
        formDataWithAttachments,
        user.id,
        user.name,
        user.email,
        user.department
      );

      // Reset form
      setFormData({
        requestType: 'Laptop Issue',
        subject: '',
        description: '',
        urgency: 'Low',
      });
      setFormErrors({});
      setAttachedFiles([]);
    } catch (error) {
      console.error('Failed to submit ticket:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setAttachedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (field: keyof HelpdeskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleViewTicket = (ticket: HelpdeskTicket) => {
    setSelectedTicket(ticket);
    setShowTicketDrawer(true);
  };

  const handleDeleteTicket = (id: string) => {
    setTicketToDelete(id);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;

    try {
      await deleteTicket(ticketToDelete);
      setTicketToDelete(null);
      if (selectedTicket && (selectedTicket._id === ticketToDelete || selectedTicket.id === ticketToDelete)) {
        setShowTicketDrawer(false);
      }
    } catch (error) {
      console.error('Failed to delete ticket:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedTicket || !user) return;

    const ticketId = selectedTicket._id || selectedTicket.id;

    try {
      await addMessage(
        ticketId,
        'employee',
        user.name,
        message
      );

      // Fetch the updated ticket with conversation first
      const freshTicket = await getTicketById(ticketId);
      if (freshTicket) {
        setSelectedTicket(freshTicket);
      }
      
      // Then refresh all tickets list
      if (user.id) {
        await fetchTickets(user.id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const isFormValid = formData.requestType && formData.subject.trim() && formData.description.trim() && formData.urgency;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">
            <Laptop className="h-7 w-7 text-primary" />
            IT Helpdesk
          </h1>
          <p className="page-description">Submit and track IT support requests</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-gray-500" />
              Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Submit IT Request Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <Plus className="h-5 w-5" />
            Submit IT Request
          </CardTitle>
          <CardDescription className="text-sm">
            Fill out the form below to submit a new IT support request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Request Type */}
              <div className="space-y-2">
                <Label htmlFor="requestType" className="text-sm font-medium">
                  Request Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.requestType}
                  onValueChange={(value) => handleInputChange('requestType', value)}
                >
                  <SelectTrigger id="requestType" className={formErrors.requestType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {getRequestTypeIcon(type)}
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.requestType && (
                  <p className="text-sm text-red-500">{formErrors.requestType}</p>
                )}
              </div>

              {/* Urgency Level */}
              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-sm font-medium">
                  Urgency Level <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => handleInputChange('urgency', value)}
                >
                  <SelectTrigger id="urgency" className={formErrors.urgency ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_LEVELS.map(level => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.urgency && (
                  <p className="text-sm text-red-500">{formErrors.urgency}</p>
                )}
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Subject / Problem Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Brief description of the issue"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={formErrors.subject ? 'border-red-500' : ''}
              />
              {formErrors.subject && (
                <p className="text-sm text-red-500">{formErrors.subject}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Detailed explanation of the issue..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label htmlFor="attachments" className="text-sm font-medium">
                Attachments (Optional)
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="attachments"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="flex-1"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="space-y-1">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-xs">{file.name}</span>
                          <span className="text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="min-w-32"
              >
                {isLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">My Requests</CardTitle>
              <CardDescription className="text-sm">View and manage your IT support requests</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-64"
                />
              </div>
              {/* Status Filter */}
              <MultiSelect
                options={[
                  { label: 'Open', value: 'Open' },
                  { label: 'In Progress', value: 'In Progress' },
                  { label: 'Resolved', value: 'Resolved' },
                  { label: 'Closed', value: 'Closed' },
                ]}
                selected={statusFilter}
                onChange={setStatusFilter}
                placeholder="Filter by status"
                className="w-full sm:w-[220px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading tickets...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter.length > 0
                ? 'No tickets found matching your filters.'
                : 'No tickets found. Submit a request to get started.'}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created On</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket._id || ticket.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        #{ticket.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRequestTypeIcon(ticket.requestType)}
                          <span className="text-sm font-medium">{ticket.requestType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(ticket.urgency)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(ticket.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewTicket(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTicket(ticket._id || ticket.id)}
                            disabled={ticket.status === 'Closed'}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details Drawer */}
      <Sheet open={showTicketDrawer} onOpenChange={setShowTicketDrawer}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Ticket Details
              <span className="font-mono text-sm text-muted-foreground">
                #{selectedTicket?.id.slice(0, 8)}
              </span>
            </SheetTitle>
            <SheetDescription>
              View details and communicate with IT support
            </SheetDescription>
          </SheetHeader>

          {selectedTicket && (
            <div className="mt-6 space-y-6">
              {/* Ticket Summary Header */}
              <TicketSummaryHeader ticket={selectedTicket} />

              {/* Request Details Section */}
              <CollapsibleSection
                title="Request Details"
                icon={<Info className="h-4 w-4" />}
                defaultOpen={true}
              >
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Request Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getRequestTypeIcon(selectedTicket.requestType)}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {selectedTicket.requestType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Subject</Label>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {selectedTicket.subject}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Description</Label>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/30 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Attachments */}
                  {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Attachments</Label>
                      <div className="mt-2 space-y-2">
                        {selectedTicket.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/30 rounded-md text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              <span className="truncate text-gray-700 dark:text-gray-300">{attachment}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment, '_blank')}
                              className="h-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Created On</Label>
                      <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Last Updated</Label>
                      <p className="mt-1 text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {new Date(selectedTicket.updatedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Ticket Flow Section */}
              <CollapsibleSection
                title="Ticket Flow"
                icon={<Activity className="h-4 w-4" />}
                defaultOpen={false}
              >
                <CompactTicketFlow ticket={selectedTicket} />
              </CollapsibleSection>

              {/* Conversation Section */}
              <CollapsibleSection
                title="Conversation"
                icon={<MessageSquare className="h-4 w-4" />}
                defaultOpen={true}
                badge={
                  selectedTicket.conversation && selectedTicket.conversation.length > 0 ? (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {selectedTicket.conversation.length}
                    </span>
                  ) : null
                }
              >
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <ConversationThread
                    messages={selectedTicket.conversation || []}
                    currentUserType="employee"
                    currentUserName={user?.name || ''}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    ticketStatus={selectedTicket.status}
                  />
                </div>
              </CollapsibleSection>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!ticketToDelete} onOpenChange={(open) => !open && setTicketToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTicket}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
