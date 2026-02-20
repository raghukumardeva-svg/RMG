import React, { useState, useMemo, useCallback } from 'react';
import {
    Clock,
    AlertTriangle,
    CheckCircle,
    Timer,
    Calendar,
    TrendingUp,
    TrendingDown,
    Settings,
    Bell,
    Target,
    Zap,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { HelpdeskTicket } from '@/types/helpdesk';
import { useHelpdeskStoreEnhanced } from '@/store/helpdeskStoreEnhanced';
import { format, addHours, addDays, differenceInHours, isPast, isWithinInterval } from 'date-fns';

interface SLAManagementProps {
    className?: string;
}

interface SLARule {
    id: string;
    name: string;
    priority: string;
    category: string;
    firstResponseHours: number;
    resolutionHours: number;
    escalationHours: number;
    isActive: boolean;
    description?: string;
}

interface SLAStatus {
    ticketId: string;
    ticket: HelpdeskTicket;
    rule: SLARule;
    firstResponseDeadline: Date;
    resolutionDeadline: Date;
    escalationDeadline: Date;
    firstResponseStatus: 'met' | 'breached' | 'at_risk' | 'pending';
    resolutionStatus: 'met' | 'breached' | 'at_risk' | 'pending';
    escalationStatus: 'none' | 'escalated' | 'pending';
    overallStatus: 'good' | 'warning' | 'critical';
    hoursRemaining: {
        firstResponse: number;
        resolution: number;
        escalation: number;
    };
}

// Default SLA Rules
const DEFAULT_SLA_RULES: SLARule[] = [
    {
        id: 'critical-all',
        name: 'Critical Priority',
        priority: 'Critical',
        category: 'All',
        firstResponseHours: 1,
        resolutionHours: 4,
        escalationHours: 2,
        isActive: true,
        description: 'Immediate response required for business-critical issues',
    },
    {
        id: 'high-all',
        name: 'High Priority',
        priority: 'High',
        category: 'All',
        firstResponseHours: 4,
        resolutionHours: 24,
        escalationHours: 8,
        isActive: true,
        description: 'Urgent issues affecting business operations',
    },
    {
        id: 'medium-all',
        name: 'Medium Priority',
        priority: 'Medium',
        category: 'All',
        firstResponseHours: 8,
        resolutionHours: 72,
        escalationHours: 24,
        isActive: true,
        description: 'Standard business issues',
    },
    {
        id: 'low-all',
        name: 'Low Priority',
        priority: 'Low',
        category: 'All',
        firstResponseHours: 24,
        resolutionHours: 168, // 1 week
        escalationHours: 72,
        isActive: true,
        description: 'Non-urgent requests and minor issues',
    },
];

export const SLAManagement = React.memo<SLAManagementProps>(({ className = '' }) => {
    const [slaRules, setSlaRules] = useState<SLARule[]>(DEFAULT_SLA_RULES);
    const [selectedRule, setSelectedRule] = useState<SLARule | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isNewRuleDialogOpen, setIsNewRuleDialogOpen] = useState(false);

    const { tickets } = useHelpdeskStoreEnhanced();

    // Calculate SLA status for each ticket
    const slaStatuses = useMemo(() => {
        const activeTickets = tickets.filter(t =>
            t.status === 'Open' || t.status === 'In Progress'
        );

        return activeTickets.map(ticket => {
            // Find matching SLA rule
            const rule = slaRules.find(r =>
                r.isActive &&
                r.priority === ticket.urgency &&
                (r.category === 'All' || r.category === ticket.category)
            ) || slaRules.find(r => r.isActive && r.priority === ticket.urgency);

            if (!rule) {
                return null; // No matching rule
            }

            const createdAt = new Date(ticket.createdAt);
            const firstResponseDeadline = addHours(createdAt, rule.firstResponseHours);
            const resolutionDeadline = addHours(createdAt, rule.resolutionHours);
            const escalationDeadline = addHours(createdAt, rule.escalationHours);

            const now = new Date();
            const hasFirstResponse = ticket.firstResponse || ticket.assignedTo;
            const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';

            // Calculate status for first response
            let firstResponseStatus: SLAStatus['firstResponseStatus'];
            if (hasFirstResponse) {
                firstResponseStatus = 'met';
            } else if (isPast(firstResponseDeadline)) {
                firstResponseStatus = 'breached';
            } else if (differenceInHours(firstResponseDeadline, now) <= 1) {
                firstResponseStatus = 'at_risk';
            } else {
                firstResponseStatus = 'pending';
            }

            // Calculate status for resolution
            let resolutionStatus: SLAStatus['resolutionStatus'];
            if (isResolved) {
                const resolvedAt = new Date(ticket.updatedAt || ticket.createdAt);
                resolutionStatus = resolvedAt <= resolutionDeadline ? 'met' : 'breached';
            } else if (isPast(resolutionDeadline)) {
                resolutionStatus = 'breached';
            } else if (differenceInHours(resolutionDeadline, now) <= 2) {
                resolutionStatus = 'at_risk';
            } else {
                resolutionStatus = 'pending';
            }

            // Calculate escalation status
            let escalationStatus: SLAStatus['escalationStatus'];
            if (ticket.escalated) {
                escalationStatus = 'escalated';
            } else if (!isResolved && isPast(escalationDeadline)) {
                escalationStatus = 'pending';
            } else {
                escalationStatus = 'none';
            }

            // Calculate overall status
            let overallStatus: SLAStatus['overallStatus'];
            if (firstResponseStatus === 'breached' || resolutionStatus === 'breached') {
                overallStatus = 'critical';
            } else if (firstResponseStatus === 'at_risk' || resolutionStatus === 'at_risk' || escalationStatus === 'pending') {
                overallStatus = 'warning';
            } else {
                overallStatus = 'good';
            }

            // Calculate hours remaining
            const hoursRemaining = {
                firstResponse: Math.max(0, differenceInHours(firstResponseDeadline, now)),
                resolution: Math.max(0, differenceInHours(resolutionDeadline, now)),
                escalation: Math.max(0, differenceInHours(escalationDeadline, now)),
            };

            return {
                ticketId: ticket.id || ticket._id || '',
                ticket,
                rule,
                firstResponseDeadline,
                resolutionDeadline,
                escalationDeadline,
                firstResponseStatus,
                resolutionStatus,
                escalationStatus,
                overallStatus,
                hoursRemaining,
            } as SLAStatus;
        }).filter(Boolean) as SLAStatus[];
    }, [tickets, slaRules]);

    // Calculate SLA metrics
    const slaMetrics = useMemo(() => {
        const total = slaStatuses.length;
        const breached = slaStatuses.filter(s => s.overallStatus === 'critical').length;
        const atRisk = slaStatuses.filter(s => s.overallStatus === 'warning').length;
        const onTrack = slaStatuses.filter(s => s.overallStatus === 'good').length;

        const firstResponseMet = slaStatuses.filter(s => s.firstResponseStatus === 'met').length;
        const resolutionMet = slaStatuses.filter(s => s.resolutionStatus === 'met').length;

        const firstResponseRate = total > 0 ? (firstResponseMet / total) * 100 : 0;
        const resolutionRate = total > 0 ? (resolutionMet / total) * 100 : 0;
        const breachRate = total > 0 ? (breached / total) * 100 : 0;

        return {
            total,
            breached,
            atRisk,
            onTrack,
            firstResponseRate,
            resolutionRate,
            breachRate,
        };
    }, [slaStatuses]);

    // Get tickets requiring immediate attention
    const urgentTickets = useMemo(() => {
        return slaStatuses
            .filter(s => s.overallStatus === 'critical' || s.overallStatus === 'warning')
            .sort((a, b) => {
                // Sort by severity, then by time remaining
                if (a.overallStatus !== b.overallStatus) {
                    return a.overallStatus === 'critical' ? -1 : 1;
                }
                return Math.min(a.hoursRemaining.firstResponse, a.hoursRemaining.resolution) -
                    Math.min(b.hoursRemaining.firstResponse, b.hoursRemaining.resolution);
            });
    }, [slaStatuses]);

    // Handlers
    const handleCreateRule = useCallback(() => {
        setSelectedRule(null);
        setIsNewRuleDialogOpen(true);
    }, []);

    const handleEditRule = useCallback((rule: SLARule) => {
        setSelectedRule(rule);
        setIsEditDialogOpen(true);
    }, []);

    const handleSaveRule = useCallback((rule: SLARule) => {
        if (selectedRule) {
            setSlaRules(prev => prev.map(r => r.id === rule.id ? rule : r));
            toast.success('SLA rule updated successfully');
        } else {
            setSlaRules(prev => [...prev, { ...rule, id: Date.now().toString() }]);
            toast.success('SLA rule created successfully');
        }
        setIsEditDialogOpen(false);
        setIsNewRuleDialogOpen(false);
    }, [selectedRule]);

    const handleToggleRule = useCallback((ruleId: string) => {
        setSlaRules(prev => prev.map(r =>
            r.id === ruleId ? { ...r, isActive: !r.isActive } : r
        ));
    }, []);

    const getStatusBadge = (status: string) => {
        const config = {
            met: { color: 'bg-green-100 text-green-800', label: 'Met' },
            breached: { color: 'bg-red-100 text-red-800', label: 'Breached' },
            at_risk: { color: 'bg-yellow-100 text-yellow-800', label: 'At Risk' },
            pending: { color: 'bg-blue-100 text-blue-800', label: 'Pending' },
            good: { color: 'bg-green-100 text-green-800', label: 'On Track' },
            warning: { color: 'bg-yellow-100 text-yellow-800', label: 'At Risk' },
            critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
            escalated: { color: 'bg-purple-100 text-purple-800', label: 'Escalated' },
            none: { color: 'bg-gray-100 text-gray-800', label: 'None' },
        }[status] || { color: 'bg-gray-100 text-gray-800', label: status };

        return (
            <Badge className={config.color}>
                {config.label}
            </Badge>
        );
    };

    const formatTimeRemaining = (hours: number) => {
        if (hours < 0) return 'Overdue';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${Math.round(hours)}h`;
        return `${Math.round(hours / 24)}d`;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">SLA Management</h2>
                    <p className="text-muted-foreground">
                        Monitor service level agreements and escalation workflows
                    </p>
                </div>

                <Button onClick={handleCreateRule}>
                    <Settings className="w-4 h-4 mr-2" />
                    Create SLA Rule
                </Button>
            </div>

            {/* SLA Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Active</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{slaMetrics.total}</div>
                        <p className="text-xs text-muted-foreground">
                            {slaMetrics.onTrack} on track
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">SLA Breach Rate</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {slaMetrics.breachRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {slaMetrics.breached} breached
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">First Response Rate</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {slaMetrics.firstResponseRate.toFixed(1)}%
                        </div>
                        <Progress value={slaMetrics.firstResponseRate} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {slaMetrics.resolutionRate.toFixed(1)}%
                        </div>
                        <Progress value={slaMetrics.resolutionRate} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="urgent" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="urgent">Urgent Attention</TabsTrigger>
                    <TabsTrigger value="all">All SLA Status</TabsTrigger>
                    <TabsTrigger value="rules">SLA Rules</TabsTrigger>
                </TabsList>

                <TabsContent value="urgent" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5" />
                                Tickets Requiring Immediate Attention
                            </CardTitle>
                            <CardDescription>
                                SLA breaches and at-risk tickets that need immediate action
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {urgentTickets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                    <p>All tickets are within SLA targets</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {urgentTickets.map(slaStatus => (
                                        <div
                                            key={slaStatus.ticketId}
                                            className={`p-4 rounded-lg border ${slaStatus.overallStatus === 'critical'
                                                    ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                                                    : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-medium">
                                                        {slaStatus.ticket.subject}
                                                    </h4>
                                                    <Badge variant="outline">
                                                        {slaStatus.ticket.id || slaStatus.ticket._id}
                                                    </Badge>
                                                    {getStatusBadge(slaStatus.overallStatus)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Priority: {slaStatus.ticket.urgency}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium">First Response:</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getStatusBadge(slaStatus.firstResponseStatus)}
                                                        {slaStatus.firstResponseStatus === 'pending' && (
                                                            <span className="text-muted-foreground">
                                                                ({formatTimeRemaining(slaStatus.hoursRemaining.firstResponse)} left)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="font-medium">Resolution:</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getStatusBadge(slaStatus.resolutionStatus)}
                                                        {slaStatus.resolutionStatus === 'pending' && (
                                                            <span className="text-muted-foreground">
                                                                ({formatTimeRemaining(slaStatus.hoursRemaining.resolution)} left)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="font-medium">Escalation:</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {getStatusBadge(slaStatus.escalationStatus)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>All SLA Status</CardTitle>
                            <CardDescription>
                                Complete overview of SLA compliance for active tickets
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2">Ticket</th>
                                            <th className="text-left py-2">Priority</th>
                                            <th className="text-left py-2">First Response</th>
                                            <th className="text-left py-2">Resolution</th>
                                            <th className="text-left py-2">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slaStatuses.map(slaStatus => (
                                            <tr key={slaStatus.ticketId} className="border-b">
                                                <td className="py-3">
                                                    <div>
                                                        <div className="font-medium">
                                                            {slaStatus.ticket.subject}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {slaStatus.ticket.id || slaStatus.ticket._id}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="outline">
                                                        {slaStatus.ticket.urgency}
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(slaStatus.firstResponseStatus)}
                                                        {slaStatus.firstResponseStatus === 'pending' && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTimeRemaining(slaStatus.hoursRemaining.firstResponse)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(slaStatus.resolutionStatus)}
                                                        {slaStatus.resolutionStatus === 'pending' && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTimeRemaining(slaStatus.hoursRemaining.resolution)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {getStatusBadge(slaStatus.overallStatus)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="rules" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SLA Rules Configuration</CardTitle>
                            <CardDescription>
                                Define service level agreements for different priority levels and categories
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {slaRules.map(rule => (
                                    <div
                                        key={rule.id}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="font-medium">{rule.name}</h4>
                                                <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                                    {rule.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {rule.priority} Priority
                                                </Badge>
                                            </div>

                                            <div className="text-sm text-muted-foreground mb-2">
                                                {rule.description}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    First Response: {rule.firstResponseHours}h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Target className="w-3 h-3" />
                                                    Resolution: {rule.resolutionHours}h
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Escalation: {rule.escalationHours}h
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={rule.isActive}
                                                onCheckedChange={() => handleToggleRule(rule.id)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEditRule(rule)}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* SLA Rule Dialog */}
            <SLARuleDialog
                open={isEditDialogOpen || isNewRuleDialogOpen}
                onClose={() => {
                    setIsEditDialogOpen(false);
                    setIsNewRuleDialogOpen(false);
                }}
                rule={selectedRule}
                onSave={handleSaveRule}
            />
        </div>
    );
});

SLAManagement.displayName = 'SLAManagement';

// SLA Rule Dialog Component
interface SLARuleDialogProps {
    open: boolean;
    onClose: () => void;
    rule: SLARule | null;
    onSave: (rule: SLARule) => void;
}

const SLARuleDialog: React.FC<SLARuleDialogProps> = ({ open, onClose, rule, onSave }) => {
    const [formData, setFormData] = useState<Partial<SLARule>>({});

    React.useEffect(() => {
        if (rule) {
            setFormData(rule);
        } else {
            setFormData({
                name: '',
                priority: 'Medium',
                category: 'All',
                firstResponseHours: 8,
                resolutionHours: 72,
                escalationHours: 24,
                isActive: true,
                description: '',
            });
        }
    }, [rule, open]);

    const handleSave = () => {
        if (!formData.name || !formData.priority) {
            toast.error('Please fill in all required fields');
            return;
        }

        onSave(formData as SLARule);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>
                        {rule ? 'Edit SLA Rule' : 'Create SLA Rule'}
                    </DialogTitle>
                    <DialogDescription>
                        Define service level agreements for ticket response and resolution times
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Rule Name *</Label>
                            <Input
                                id="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., High Priority IT"
                            />
                        </div>

                        <div>
                            <Label htmlFor="priority">Priority Level *</Label>
                            <Select
                                value={formData.priority || ''}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={formData.category || 'All'}
                            onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                <SelectItem value="IT">IT</SelectItem>
                                <SelectItem value="HR">HR</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="General">General</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="firstResponse">First Response (hours)</Label>
                            <Input
                                id="firstResponse"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={formData.firstResponseHours || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    firstResponseHours: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="resolution">Resolution (hours)</Label>
                            <Input
                                id="resolution"
                                type="number"
                                min="1"
                                step="1"
                                value={formData.resolutionHours || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    resolutionHours: parseFloat(e.target.value)
                                })}
                            />
                        </div>

                        <div>
                            <Label htmlFor="escalation">Escalation (hours)</Label>
                            <Input
                                id="escalation"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={formData.escalationHours || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    escalationHours: parseFloat(e.target.value)
                                })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe when this SLA rule applies..."
                            rows={3}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={formData.isActive || false}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="active">Active rule</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        {rule ? 'Update Rule' : 'Create Rule'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};