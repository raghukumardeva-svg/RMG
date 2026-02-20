import React, { useState, useCallback, useMemo } from 'react';
import {
  Mail,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  trigger: EmailTrigger;
  enabled: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

interface EmailNotificationRecord {
  id: string;
  templateId: string;
  templateName: string;
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
  ticketId?: string;
  ticketNumber?: string;
  retryCount: number;
}

type EmailTrigger = 
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_assigned'
  | 'ticket_resolved'
  | 'ticket_closed'
  | 'comment_added'
  | 'sla_warning'
  | 'sla_breach'
  | 'manual';

interface EmailNotificationsProps {
  className?: string;
}

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: '1',
    name: 'Ticket Created Confirmation',
    subject: 'Your support ticket {{ticketNumber}} has been created',
    body: `Hi {{customerName}},

Thank you for contacting {{companyName}} support. We have received your request and created ticket {{ticketNumber}}.

Ticket Details:
• Subject: {{ticketSubject}}
• Priority: {{ticketPriority}}
• Created: {{ticketCreatedDate}}

Our team will review your request and respond within {{expectedResponseTime}}.

You can track the status of your ticket at: {{ticketUrl}}

Best regards,
{{companyName}} Support Team`,
    trigger: 'ticket_created',
    enabled: true,
    variables: ['customerName', 'companyName', 'ticketNumber', 'ticketSubject', 'ticketPriority', 'ticketCreatedDate', 'expectedResponseTime', 'ticketUrl'],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Ticket Assigned Notification',
    subject: 'Ticket {{ticketNumber}} has been assigned to {{agentName}}',
    body: `Hi {{customerName}},

Good news! Your support ticket {{ticketNumber}} has been assigned to {{agentName}}, who will be handling your request.

{{agentName}} will review your case and reach out to you shortly. You can expect an update within {{responseTime}}.

Ticket Details:
• Subject: {{ticketSubject}}
• Status: {{ticketStatus}}
• Assigned Agent: {{agentName}}

Track your ticket: {{ticketUrl}}

Best regards,
{{companyName}} Support Team`,
    trigger: 'ticket_assigned',
    enabled: true,
    variables: ['customerName', 'ticketNumber', 'agentName', 'ticketSubject', 'ticketStatus', 'responseTime', 'ticketUrl', 'companyName'],
    createdAt: '2024-01-02T09:00:00Z',
    updatedAt: '2024-01-02T09:00:00Z',
  },
  {
    id: '3',
    name: 'Ticket Resolved Notification',
    subject: 'Your ticket {{ticketNumber}} has been resolved',
    body: `Hi {{customerName}},

Great news! Your support ticket {{ticketNumber}} has been resolved.

Resolution Summary:
{{resolutionSummary}}

If the issue has been fully resolved to your satisfaction, no further action is needed. If you need additional assistance or have any questions, please reply to this email or reopen the ticket.

We value your feedback! Please take a moment to rate your support experience: {{feedbackUrl}}

Thank you for choosing {{companyName}}.

Best regards,
{{companyName}} Support Team`,
    trigger: 'ticket_resolved',
    enabled: true,
    variables: ['customerName', 'ticketNumber', 'resolutionSummary', 'feedbackUrl', 'companyName'],
    createdAt: '2024-01-03T14:00:00Z',
    updatedAt: '2024-01-03T14:00:00Z',
  },
  {
    id: '4',
    name: 'SLA Breach Warning',
    subject: 'URGENT: Ticket {{ticketNumber}} approaching SLA deadline',
    body: `Hi {{agentName}},

This is an urgent notification that ticket {{ticketNumber}} is approaching its SLA deadline.

Ticket Details:
• Subject: {{ticketSubject}}
• Priority: {{ticketPriority}}
• Customer: {{customerName}}
• SLA Deadline: {{slaDeadline}}
• Time Remaining: {{timeRemaining}}

Please take immediate action to prevent an SLA breach.

View ticket: {{ticketUrl}}

RMG Portal Automation`,
    trigger: 'sla_warning',
    enabled: true,
    variables: ['agentName', 'ticketNumber', 'ticketSubject', 'ticketPriority', 'customerName', 'slaDeadline', 'timeRemaining', 'ticketUrl'],
    createdAt: '2024-01-04T11:00:00Z',
    updatedAt: '2024-01-04T11:00:00Z',
  },
];

const MOCK_NOTIFICATIONS: EmailNotificationRecord[] = [
  {
    id: '1',
    templateId: '1',
    templateName: 'Ticket Created Confirmation',
    recipient: 'customer@example.com',
    subject: 'Your support ticket TKT-001 has been created',
    status: 'delivered',
    sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    ticketId: 'TKT-001',
    ticketNumber: 'TKT-001',
    retryCount: 0,
  },
  {
    id: '2',
    templateId: '2',
    templateName: 'Ticket Assigned Notification',
    recipient: 'customer@example.com',
    subject: 'Ticket TKT-001 has been assigned to John Doe',
    status: 'sent',
    sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    ticketId: 'TKT-001',
    ticketNumber: 'TKT-001',
    retryCount: 0,
  },
  {
    id: '3',
    templateId: '4',
    templateName: 'SLA Breach Warning',
    recipient: 'agent@example.com',
    subject: 'URGENT: Ticket TKT-002 approaching SLA deadline',
    status: 'failed',
    sentAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    error: 'SMTP connection failed',
    ticketId: 'TKT-002',
    ticketNumber: 'TKT-002',
    retryCount: 2,
  },
];

const TRIGGER_LABELS: Record<EmailTrigger, string> = {
  ticket_created: 'Ticket Created',
  ticket_updated: 'Ticket Updated',
  ticket_assigned: 'Ticket Assigned',
  ticket_resolved: 'Ticket Resolved',
  ticket_closed: 'Ticket Closed',
  comment_added: 'Comment Added',
  sla_warning: 'SLA Warning',
  sla_breach: 'SLA Breach',
  manual: 'Manual',
};

const STATUS_COLORS: Record<EmailNotificationRecord['status'], string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  bounced: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const STATUS_ICONS: Record<EmailNotificationRecord['status'], React.ElementType> = {
  pending: Clock,
  sent: Send,
  delivered: CheckCircle2,
  failed: XCircle,
  bounced: AlertCircle,
};

export const EmailNotifications = React.memo<EmailNotificationsProps>(({ className = '' }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>(DEFAULT_TEMPLATES);
  const [notifications, setNotifications] = useState<EmailNotificationRecord[]>(MOCK_NOTIFICATIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EmailNotificationRecord['status']>('all');
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewNotification, setPreviewNotification] = useState<EmailNotificationRecord | null>(null);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = 
        notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [notifications, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: notifications.length,
      delivered: notifications.filter(n => n.status === 'delivered').length,
      failed: notifications.filter(n => n.status === 'failed').length,
      pending: notifications.filter(n => n.status === 'pending').length,
      deliveryRate: notifications.length > 0 
        ? Math.round((notifications.filter(n => n.status === 'delivered').length / notifications.length) * 100)
        : 0,
    };
  }, [notifications]);

  // Handle template actions
  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(undefined);
    setIsTemplateEditorOpen(true);
  }, []);

  const handleEditTemplate = useCallback((template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsTemplateEditorOpen(true);
  }, []);

  const handleSaveTemplate = useCallback((templateData: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...templateData, id: t.id, createdAt: t.createdAt, updatedAt: now }
          : t
      ));
      toast.success('Email template updated');
    } else {
      const newTemplate: EmailTemplate = {
        ...templateData,
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setTemplates(prev => [newTemplate, ...prev]);
      toast.success('Email template created');
    }
    
    setIsTemplateEditorOpen(false);
  }, [editingTemplate]);

  const handleDeleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    toast.success('Email template deleted');
  }, []);

  const handleToggleTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, enabled: !t.enabled } : t
    ));
  }, []);

  // Handle notification actions
  const handleRetryNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId 
        ? { ...n, status: 'pending' as const, retryCount: n.retryCount + 1 }
        : n
    ));
    toast.success('Email notification queued for retry');
  }, []);

  const handleViewNotification = useCallback((notification: EmailNotificationRecord) => {
    setPreviewNotification(notification);
    setIsPreviewOpen(true);
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Notifications</h2>
          <p className="text-muted-foreground">
            Manage automated email templates and delivery tracking
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleNewTemplate}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sent</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail className="w-4 h-4 mr-1" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Delivered</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.delivered}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              {stats.deliveryRate}% delivery rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats.failed}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-red-600">
              <XCircle className="w-4 h-4 mr-1" />
              Requires attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-blue-600">
              <Clock className="w-4 h-4 mr-1" />
              In queue
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notification History
            <Badge className="ml-2">{notifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="templates">
            Email Templates
            <Badge className="ml-2">{templates.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by recipient, subject, or ticket..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | EmailNotificationRecord['status'])}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Retries</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No email notifications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNotifications.map((notification) => {
                      const StatusIcon = STATUS_ICONS[notification.status];
                      
                      return (
                        <TableRow key={notification.id}>
                          <TableCell>
                            <Badge className={STATUS_COLORS[notification.status]}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {notification.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{notification.recipient}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{notification.subject}</TableCell>
                          <TableCell>
                            {notification.ticketNumber && (
                              <Badge variant="outline">{notification.ticketNumber}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {notification.sentAt ? (
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true })}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {notification.retryCount > 0 ? (
                              <Badge variant="secondary">{notification.retryCount}</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewNotification(notification)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {notification.status === 'failed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetryNotification(notification.id)}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>
                        Trigger: {TRIGGER_LABELS[template.trigger]}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={() => handleToggleTemplate(template.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <p className="text-sm font-medium mt-1">{template.subject}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-muted-foreground">Body Preview</Label>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                      {template.body}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 4).map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {'{{' + variable + '}}'}
                      </Badge>
                    ))}
                    {template.variables.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.variables.length - 4} more
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <TemplateEditor
        template={editingTemplate}
        isOpen={isTemplateEditorOpen}
        onClose={() => setIsTemplateEditorOpen(false)}
        onSave={handleSaveTemplate}
      />

      {/* Notification Preview Dialog */}
      {previewNotification && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Email Notification Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={`${STATUS_COLORS[previewNotification.status]} mt-1`}>
                    {previewNotification.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Template</Label>
                  <p className="text-sm mt-1">{previewNotification.templateName}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Recipient</Label>
                <p className="text-sm mt-1">{previewNotification.recipient}</p>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="text-sm mt-1">{previewNotification.subject}</p>
              </div>
              
              {previewNotification.error && (
                <div>
                  <Label className="text-xs text-red-600">Error</Label>
                  <p className="text-sm text-red-600 mt-1">{previewNotification.error}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
});

EmailNotifications.displayName = 'EmailNotifications';

// Template Editor Component
interface TemplateEditorProps {
  template?: EmailTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    trigger: 'manual' as EmailTrigger,
    enabled: true,
    variables: [] as string[],
  });

  React.useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        trigger: template.trigger,
        enabled: template.enabled,
        variables: [...template.variables],
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        trigger: 'manual',
        enabled: true,
        variables: [],
      });
    }
  }, [template, isOpen]);

  const handleSave = () => {
    if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Extract variables from subject and body
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    
    const subjectMatches = formData.subject.matchAll(variableRegex);
    for (const match of subjectMatches) {
      variables.add(match[1]);
    }
    
    const bodyMatches = formData.body.matchAll(variableRegex);
    for (const match of bodyMatches) {
      variables.add(match[1]);
    }
    
    onSave({
      ...formData,
      variables: Array.from(variables),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Email Template' : 'Create New Email Template'}
          </DialogTitle>
          <DialogDescription>
            Create automated email notifications with dynamic variables
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ticket Created Email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger Event</Label>
              <Select 
                value={formData.trigger} 
                onValueChange={(trigger) => setFormData({ ...formData, trigger: trigger as EmailTrigger })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Use {{'{'}variable{'}'}} for dynamic content"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="body">Email Body *</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              placeholder="Use {{'{'}variable{'}'}} for dynamic content like {{'{'}customerName{'}'}, {{'}agentName{'}'}, etc."
            />
            <p className="text-xs text-muted-foreground">
              Use double curly braces for variables: {`{{variableName}}`}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Template</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send this email when triggered
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(enabled) => setFormData({ ...formData, enabled })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailNotifications;
