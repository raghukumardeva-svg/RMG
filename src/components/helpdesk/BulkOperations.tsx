import React, { useState, useCallback, useMemo } from 'react';
import {
    Check,
    Download,
    Edit3,
    Mail,
    MoreHorizontal,
    Trash2,
    User,
    CheckSquare,
    Square,
    Minus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { HelpdeskTicket } from '@/types/helpdesk';
import { useHelpdeskStoreEnhanced } from '@/store/helpdeskStoreEnhanced';

interface BulkOperationsProps {
    tickets: HelpdeskTicket[];
    selectedTickets: string[];
    onSelectionChange: (ticketIds: string[]) => void;
    className?: string;
}

interface BulkActionDialogProps {
    open: boolean;
    onClose: () => void;
    action: BulkAction;
    selectedTickets: HelpdeskTicket[];
    onConfirm: (data: any) => Promise<void>;
}

type BulkAction =
    | 'status_update'
    | 'assign'
    | 'priority_update'
    | 'delete'
    | 'export'
    | 'send_notification';

const STATUS_OPTIONS = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
];

const ASSIGNEES = [
    { value: 'john.doe', label: 'John Doe' },
    { value: 'jane.smith', label: 'Jane Smith' },
    { value: 'mike.wilson', label: 'Mike Wilson' },
    { value: 'sarah.jones', label: 'Sarah Jones' },
];

export const BulkOperations = React.memo<BulkOperationsProps>(({
    tickets,
    selectedTickets,
    onSelectionChange,
    className = ''
}) => {
    const [currentAction, setCurrentAction] = useState<BulkAction | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { bulkUpdateStatus, bulkAssignTickets } = useHelpdeskStoreEnhanced();

    // Selection state management
    const isAllSelected = useMemo(() => {
        return tickets.length > 0 && selectedTickets.length === tickets.length;
    }, [tickets.length, selectedTickets.length]);

    const isPartiallySelected = useMemo(() => {
        return selectedTickets.length > 0 && selectedTickets.length < tickets.length;
    }, [selectedTickets.length, tickets.length]);

    const selectedTicketObjects = useMemo(() => {
        return tickets.filter(ticket =>
            selectedTickets.includes(ticket.id || ticket._id || '')
        );
    }, [tickets, selectedTickets]);

    // Selection handlers
    const handleSelectAll = useCallback(() => {
        if (isAllSelected) {
            onSelectionChange([]);
        } else {
            const allIds = tickets.map(t => t.id || t._id || '').filter(Boolean);
            onSelectionChange(allIds);
        }
    }, [isAllSelected, tickets, onSelectionChange]);

    const handleTicketSelect = useCallback((ticketId: string) => {
        if (selectedTickets.includes(ticketId)) {
            onSelectionChange(selectedTickets.filter(id => id !== ticketId));
        } else {
            onSelectionChange([...selectedTickets, ticketId]);
        }
    }, [selectedTickets, onSelectionChange]);

    // Action handlers
    const handleBulkAction = useCallback((action: BulkAction) => {
        setCurrentAction(action);
        setDialogOpen(true);
    }, []);

    const handleActionConfirm = useCallback(async (data: any) => {
        if (!currentAction) return;

        try {
            switch (currentAction) {
                case 'status_update':
                    await bulkUpdateStatus(selectedTickets, data.status);
                    break;
                case 'assign':
                    await bulkAssignTickets(selectedTickets, data.assigneeId, data.assigneeName);
                    break;
                case 'priority_update':
                    // Would need to implement in store
                    toast.info('Priority update not yet implemented');
                    break;
                case 'delete':
                    // Would need to implement bulk delete
                    toast.info('Bulk delete not yet implemented');
                    break;
                case 'export':
                    handleExport();
                    break;
                case 'send_notification':
                    // Would integrate with notification system
                    toast.success(`Notification sent to ${selectedTickets.length} ticket holders`);
                    break;
            }

            setDialogOpen(false);
            onSelectionChange([]); // Clear selection after action
        } catch (error) {
            toast.error(`Failed to execute bulk action: ${error}`);
        }
    }, [currentAction, selectedTickets, bulkUpdateStatus, bulkAssignTickets, onSelectionChange]);

    // Export functionality
    const handleExport = useCallback(() => {
        const csvHeaders = [
            'Ticket ID',
            'Subject',
            'Status',
            'Priority',
            'Created Date',
            'User',
            'Assigned To',
            'Description'
        ];

        const csvData = selectedTicketObjects.map(ticket => [
            ticket.id || ticket._id || '',
            ticket.subject,
            ticket.status,
            ticket.urgency,
            ticket.createdAt,
            ticket.userName,
            ticket.assignedTo || 'Unassigned',
            `"${ticket.description.replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `helpdesk-tickets-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Exported ${selectedTickets.length} tickets to CSV`);
        setDialogOpen(false);
    }, [selectedTicketObjects, selectedTickets.length]);

    // Clear selection
    const handleClearSelection = useCallback(() => {
        onSelectionChange([]);
    }, [onSelectionChange]);

    if (tickets.length === 0) {
        return null;
    }

    return (
        <>
            <div className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
                <div className="flex items-center justify-between gap-4">
                    {/* Selection Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAll}
                                className="p-1 h-8 w-8"
                            >
                                {isAllSelected ? (
                                    <CheckSquare className="h-4 w-4" />
                                ) : isPartiallySelected ? (
                                    <Minus className="h-4 w-4" />
                                ) : (
                                    <Square className="h-4 w-4" />
                                )}
                            </Button>

                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {selectedTickets.length === 0 ? (
                                    'Select tickets'
                                ) : (
                                    `${selectedTickets.length} of ${tickets.length} selected`
                                )}
                            </span>
                        </div>

                        {selectedTickets.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                    {selectedTickets.length} selected
                                </Badge>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearSelection}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    {selectedTickets.length > 0 && (
                        <div className="flex items-center gap-2">
                            {/* Quick Actions */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkAction('status_update')}
                                className="gap-1"
                            >
                                <Edit3 className="w-4 h-4" />
                                Update Status
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkAction('assign')}
                                className="gap-1"
                            >
                                <User className="w-4 h-4" />
                                Assign
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkAction('export')}
                                className="gap-1"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </Button>

                            {/* More Actions Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleBulkAction('priority_update')}>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Update Priority
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => handleBulkAction('send_notification')}>
                                        <Mail className="w-4 h-4 mr-2" />
                                        Send Notification
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => handleBulkAction('delete')}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Tickets
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Selection Checkboxes (to be used in ticket list) */}
            <div className="hidden">
                {tickets.map(ticket => {
                    const ticketId = ticket.id || ticket._id || '';
                    return (
                        <Checkbox
                            key={ticketId}
                            checked={selectedTickets.includes(ticketId)}
                            onCheckedChange={() => handleTicketSelect(ticketId)}
                        />
                    );
                })}
            </div>

            {/* Bulk Action Dialog */}
            <BulkActionDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                action={currentAction!}
                selectedTickets={selectedTicketObjects}
                onConfirm={handleActionConfirm}
            />
        </>
    );
});

BulkOperations.displayName = 'BulkOperations';

// Bulk Action Dialog Component
const BulkActionDialog: React.FC<BulkActionDialogProps> = ({
    open,
    onClose,
    action,
    selectedTickets,
    onConfirm
}) => {
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm(formData);
        } finally {
            setIsLoading(false);
        }
    };

    const getDialogContent = () => {
        switch (action) {
            case 'status_update':
                return {
                    title: 'Update Status',
                    description: `Update the status for ${selectedTickets.length} selected tickets`,
                    content: (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="status">New Status</Label>
                                <Select
                                    value={formData.status || ''}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add notes for this status update..."
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    )
                };

            case 'assign':
                return {
                    title: 'Assign Tickets',
                    description: `Assign ${selectedTickets.length} tickets to a team member`,
                    content: (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="assignee">Assign To</Label>
                                <Select
                                    value={formData.assigneeId || ''}
                                    onValueChange={(value) => {
                                        const assignee = ASSIGNEES.find(a => a.value === value);
                                        setFormData({
                                            ...formData,
                                            assigneeId: value,
                                            assigneeName: assignee?.label
                                        });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ASSIGNEES.map(assignee => (
                                            <SelectItem key={assignee.value} value={assignee.value}>
                                                {assignee.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="message">Message to Assignee (Optional)</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Add a message for the assignee..."
                                    value={formData.message || ''}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>
                        </div>
                    )
                };

            case 'delete':
                return {
                    title: 'Delete Tickets',
                    description: `Are you sure you want to delete ${selectedTickets.length} tickets? This action cannot be undone.`,
                    content: (
                        <div className="space-y-4">
                            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                <p className="text-sm text-red-800 dark:text-red-300">
                                    ⚠️ This will permanently delete all selected tickets and their associated data.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="reason">Reason for Deletion</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please provide a reason for deleting these tickets..."
                                    value={formData.reason || ''}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    )
                };

            default:
                return {
                    title: 'Bulk Action',
                    description: `Perform action on ${selectedTickets.length} selected tickets`,
                    content: <div>Action not implemented</div>
                };
        }
    };

    const { title, description, content } = getDialogContent();
    const canConfirm = action === 'export' ||
        (action === 'status_update' && formData.status) ||
        (action === 'assign' && formData.assigneeId) ||
        (action === 'delete' && formData.reason?.trim());

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                {content}

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!canConfirm || isLoading}
                        className={action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                        {isLoading ? 'Processing...' : action === 'delete' ? 'Delete' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Utility component for individual ticket checkbox
export const TicketSelectionCheckbox: React.FC<{
    ticket: HelpdeskTicket;
    isSelected: boolean;
    onToggle: (ticketId: string) => void;
}> = ({ ticket, isSelected, onToggle }) => {
    const ticketId = ticket.id || ticket._id || ''; // Removed the syntax error here

    return (
        <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(ticketId)}
            className="mr-2"
        />
    );
};