import React, { useState, useCallback, useMemo } from 'react';
import {
    FileText,
    Plus,
    Edit3,
    Trash2,
    Copy,
    Search,
    Filter,
    Star,
    Clock,
    User,
    Tag,
    Save,
    X,
    Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { HelpdeskTicket } from '@/types/helpdesk';

interface TicketTemplate {
    id: string;
    name: string;
    category: string;
    subject: string;
    content: string;
    tags: string[];
    variables: string[];
    isPublic: boolean;
    isFavorite: boolean;
    usageCount: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface TicketTemplatesProps {
    onSelectTemplate?: (template: TicketTemplate) => void;
    className?: string;
}

interface TemplateEditorProps {
    template?: TicketTemplate;
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
}

interface TemplatePreviewProps {
    template: TicketTemplate;
    isOpen: boolean;
    onClose: () => void;
    onUse: (template: TicketTemplate) => void;
}

// Default templates
const DEFAULT_TEMPLATES: TicketTemplate[] = [
    {
        id: '1',
        name: 'Password Reset Request',
        category: 'IT Support',
        subject: 'Password Reset - {{ticketId}}',
        content: `Hi {{customerName}},

Thank you for contacting IT Support regarding your password reset request.

I have initiated the password reset process for your account. You should receive an email with reset instructions within the next 5-10 minutes.

If you don't receive the email, please check your spam folder or contact us again.

Please follow these steps:
1. Check your email for the password reset link
2. Click the link and follow the instructions
3. Create a strong password with at least 8 characters
4. Test your new password by logging in

If you continue to experience issues, please don't hesitate to reach out.

Best regards,
{{agentName}}
IT Support Team`,
        tags: ['password', 'reset', 'it-support', 'authentication'],
        variables: ['customerName', 'ticketId', 'agentName'],
        isPublic: true,
        isFavorite: true,
        usageCount: 47,
        createdBy: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-05T14:30:00Z',
    },
    {
        id: '2',
        name: 'Software Installation Confirmation',
        category: 'IT Support',
        subject: 'Software Installation Complete - {{softwareName}}',
        content: `Hi {{customerName}},

This is to confirm that the software installation for {{softwareName}} has been completed successfully on your system.

Installation Details:
- Software: {{softwareName}}
- Version: {{version}}
- Installation Date: {{currentDate}}
- License Type: {{licenseType}}

Next Steps:
1. You can find the software in your applications menu
2. Please test the software to ensure it's working correctly
3. If you need training or have questions, please let us know

If you experience any issues or need assistance with the new software, please create a new ticket or reply to this one.

Best regards,
{{agentName}}
IT Support Team`,
        tags: ['software', 'installation', 'completion', 'it-support'],
        variables: ['customerName', 'softwareName', 'version', 'currentDate', 'licenseType', 'agentName'],
        isPublic: true,
        isFavorite: false,
        usageCount: 23,
        createdBy: 'admin',
        createdAt: '2024-01-02T09:15:00Z',
        updatedAt: '2024-01-02T09:15:00Z',
    },
    {
        id: '3',
        name: 'Hardware Issue Investigation',
        category: 'IT Support',
        subject: 'Hardware Issue Investigation - {{ticketId}}',
        content: `Hi {{customerName}},

Thank you for reporting the hardware issue with your {{deviceType}}.

To help us diagnose the problem, could you please provide the following information:

1. Device Model: {{deviceModel}}
2. Serial Number: (if available)
3. Error Messages: (exact text if any)
4. When did the issue start?
5. Does the issue occur consistently or intermittently?
6. Any recent changes to your system?

Additional Steps:
- Please save any important work
- Try restarting your device if you haven't already
- Note any unusual sounds, lights, or behaviors

Once we receive this information, we'll schedule a time to either remotely diagnose the issue or arrange for on-site support.

Expected Response Time: Within {{responseTime}} business hours

Best regards,
{{agentName}}
IT Support Team`,
        tags: ['hardware', 'investigation', 'troubleshooting', 'it-support'],
        variables: ['customerName', 'deviceType', 'deviceModel', 'ticketId', 'responseTime', 'agentName'],
        isPublic: true,
        isFavorite: false,
        usageCount: 31,
        createdBy: 'admin',
        createdAt: '2024-01-03T11:20:00Z',
        updatedAt: '2024-01-06T16:45:00Z',
    },
];

const TEMPLATE_CATEGORIES = [
    'All Categories',
    'IT Support',
    'HR',
    'Finance',
    'General',
    'Facilities',
    'Security',
];

const COMMON_VARIABLES = [
    'customerName',
    'agentName',
    'ticketId',
    'currentDate',
    'companyName',
    'department',
    'priority',
    'category',
];

export const TicketTemplates = React.memo<TicketTemplatesProps>(({
    onSelectTemplate,
    className = ''
}) => {
    const [templates, setTemplates] = useState<TicketTemplate[]>(DEFAULT_TEMPLATES);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TicketTemplate | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | undefined>();

    // Filter templates based on search, category, and favorites
    const filteredTemplates = useMemo(() => {
        return templates.filter(template => {
            const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'All Categories' ||
                template.category === selectedCategory;

            const matchesFavorites = !showFavoritesOnly || template.isFavorite;

            return matchesSearch && matchesCategory && matchesFavorites;
        });
    }, [templates, searchTerm, selectedCategory, showFavoritesOnly]);

    // Handle template actions
    const handleNewTemplate = useCallback(() => {
        setEditingTemplate(undefined);
        setIsEditorOpen(true);
    }, []);

    const handleEditTemplate = useCallback((template: TicketTemplate) => {
        setEditingTemplate(template);
        setIsEditorOpen(true);
    }, []);

    const handlePreviewTemplate = useCallback((template: TicketTemplate) => {
        setSelectedTemplate(template);
        setIsPreviewOpen(true);
    }, []);

    const handleSaveTemplate = useCallback((templateData: Omit<TicketTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
        const now = new Date().toISOString();

        if (editingTemplate) {
            // Update existing template
            setTemplates(prev => prev.map(t =>
                t.id === editingTemplate.id
                    ? { ...templateData, id: t.id, createdAt: t.createdAt, updatedAt: now, usageCount: t.usageCount }
                    : t
            ));
            toast.success('Template updated successfully');
        } else {
            // Create new template
            const newTemplate: TicketTemplate = {
                ...templateData,
                id: Date.now().toString(),
                createdAt: now,
                updatedAt: now,
                usageCount: 0,
            };
            setTemplates(prev => [newTemplate, ...prev]);
            toast.success('Template created successfully');
        }

        setIsEditorOpen(false);
    }, [editingTemplate]);

    const handleDeleteTemplate = useCallback((templateId: string) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        toast.success('Template deleted successfully');
    }, []);

    const handleToggleFavorite = useCallback((templateId: string) => {
        setTemplates(prev => prev.map(t =>
            t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
        ));
    }, []);

    const handleUseTemplate = useCallback((template: TicketTemplate) => {
        // Increment usage count
        setTemplates(prev => prev.map(t =>
            t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
        ));

        onSelectTemplate?.(template);
        setIsPreviewOpen(false);
        toast.success(`Template "${template.name}" applied`);
    }, [onSelectTemplate]);

    const handleDuplicateTemplate = useCallback((template: TicketTemplate) => {
        const now = new Date().toISOString();
        const duplicatedTemplate: TicketTemplate = {
            ...template,
            id: Date.now().toString(),
            name: `${template.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            isFavorite: false,
        };

        setTemplates(prev => [duplicatedTemplate, ...prev]);
        toast.success('Template duplicated successfully');
    }, []);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ticket Templates</h2>
                    <p className="text-muted-foreground">
                        Manage and use pre-defined templates for faster ticket responses
                    </p>
                </div>

                <Button onClick={handleNewTemplate} className="gap-1">
                    <Plus className="w-4 h-4" />
                    New Template
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder="Search templates, content, or tags..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {TEMPLATE_CATEGORIES.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <Label htmlFor="favorites" className="text-sm font-medium">
                                Favorites only
                            </Label>
                            <Switch
                                id="favorites"
                                checked={showFavoritesOnly}
                                onCheckedChange={setShowFavoritesOnly}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-medium mb-2">No templates found</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchTerm || selectedCategory !== 'All Categories' || showFavoritesOnly
                                ? 'Try adjusting your filters or search terms'
                                : 'Get started by creating your first template'
                            }
                        </p>
                        <Button onClick={handleNewTemplate} variant="outline">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Button>
                    </div>
                ) : (
                    filteredTemplates.map(template => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {template.name}
                                            {template.isFavorite && (
                                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {template.category} • Used {template.usageCount} times
                                        </CardDescription>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Preview & Use
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleFavorite(template.id)}>
                                                <Star className={`w-4 h-4 mr-2 ${template.isFavorite ? 'text-yellow-500' : ''}`} />
                                                {template.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => handleDeleteTemplate(template.id)}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium mb-1">Subject Template:</p>
                                    <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                        {template.subject}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium mb-2">Content Preview:</p>
                                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-24 overflow-hidden relative">
                                        {template.content.split('\n').slice(0, 3).join(' ')}
                                        {template.content.split('\n').length > 3 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent" />
                                        )}
                                    </div>
                                </div>

                                {template.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {template.tags.slice(0, 3).map(tag => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                        {template.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">
                                                +{template.tags.length - 3} more
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handlePreviewTemplate(template)}
                                        className="flex-1"
                                        size="sm"
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Use Template
                                    </Button>
                                    <Button
                                        onClick={() => handleEditTemplate(template)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Template Editor Dialog */}
            <TemplateEditor
                template={editingTemplate}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveTemplate}
            />

            {/* Template Preview Dialog */}
            {selectedTemplate && (
                <TemplatePreview
                    template={selectedTemplate}
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    onUse={handleUseTemplate}
                />
            )}
        </div>
    );
});

TicketTemplates.displayName = 'TicketTemplates';

// Template Editor Component
const TemplateEditor: React.FC<TemplateEditorProps> = ({
    template,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'General',
        subject: '',
        content: '',
        tags: [] as string[],
        variables: [] as string[],
        isPublic: true,
        isFavorite: false,
        createdBy: 'current-user', // Would come from auth context
    });

    const [newTag, setNewTag] = useState('');
    const [newVariable, setNewVariable] = useState('');

    // Initialize form data when template changes
    React.useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                category: template.category,
                subject: template.subject,
                content: template.content,
                tags: [...template.tags],
                variables: [...template.variables],
                isPublic: template.isPublic,
                isFavorite: template.isFavorite,
                createdBy: template.createdBy,
            });
        } else {
            setFormData({
                name: '',
                category: 'General',
                subject: '',
                content: '',
                tags: [],
                variables: [],
                isPublic: true,
                isFavorite: false,
                createdBy: 'current-user',
            });
        }
    }, [template, isOpen]);

    const handleSave = () => {
        if (!formData.name.trim() || !formData.content.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        onSave(formData);
    };

    const handleAddTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim().toLowerCase())) {
            setFormData(prev => ({
                ...prev,
                tags: [...prev.tags, newTag.trim().toLowerCase()]
            }));
            setNewTag('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(t => t !== tag)
        }));
    };

    const handleAddVariable = () => {
        if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
            setFormData(prev => ({
                ...prev,
                variables: [...prev.variables, newVariable.trim()]
            }));
            setNewVariable('');
        }
    };

    const handleRemoveVariable = (variable: string) => {
        setFormData(prev => ({
            ...prev,
            variables: prev.variables.filter(v => v !== variable)
        }));
    };

    const addCommonVariable = (variable: string) => {
        if (!formData.variables.includes(variable)) {
            setFormData(prev => ({
                ...prev,
                variables: [...prev.variables, variable]
            }));
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {template ? 'Edit Template' : 'Create New Template'}
                    </DialogTitle>
                    <DialogDescription>
                        Create reusable templates for faster ticket responses with dynamic variables
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Template Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Password Reset Response"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(category) => setFormData({ ...formData, category })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATE_CATEGORIES.slice(1).map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Subject Template */}
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject Template</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Use {{variables}} for dynamic content, e.g., Password Reset - {{ticketId}}"
                        />
                    </div>

                    {/* Content Template */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Content Template *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={8}
                            placeholder="Enter your template content here...

Use {{variables}} for dynamic content like {{customerName}}, {{agentName}}, etc."
                        />
                        <p className="text-xs text-muted-foreground">
                            Use double curly braces for variables: {'{{'}variableName{'}}'}
                        </p>
                    </div>

                    {/* Variables */}
                    <div className="space-y-3">
                        <Label>Variables</Label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    value={newVariable}
                                    onChange={(e) => setNewVariable(e.target.value)}
                                    placeholder="Enter variable name (e.g., customerName)"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddVariable()}
                                />
                                <Button onClick={handleAddVariable} size="sm">
                                    Add
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                <span className="text-sm text-muted-foreground mr-2">Quick add:</span>
                                {COMMON_VARIABLES.filter(v => !formData.variables.includes(v)).map(variable => (
                                    <Button
                                        key={variable}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-6"
                                        onClick={() => addCommonVariable(variable)}
                                    >
                                        {variable}
                                    </Button>
                                ))}
                            </div>

                            {formData.variables.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {formData.variables.map(variable => (
                                        <Badge key={variable} className="gap-1">
                                            {variable}
                                            <button
                                                onClick={() => handleRemoveVariable(variable)}
                                                className="ml-1 hover:bg-white/20 rounded"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-3">
                        <Label>Tags</Label>
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Add tags for organization"
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                />
                                <Button onClick={handleAddTag} size="sm">
                                    Add
                                </Button>
                            </div>

                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="gap-1">
                                            {tag}
                                            <button
                                                onClick={() => handleRemoveTag(tag)}
                                                className="ml-1 hover:bg-white/20 rounded"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Public Template</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow other team members to use this template
                                </p>
                            </div>
                            <Switch
                                checked={formData.isPublic}
                                onCheckedChange={(isPublic) => setFormData({ ...formData, isPublic })}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Add to Favorites</Label>
                                <p className="text-sm text-muted-foreground">
                                    Mark this template as a favorite for quick access
                                </p>
                            </div>
                            <Switch
                                checked={formData.isFavorite}
                                onCheckedChange={(isFavorite) => setFormData({ ...formData, isFavorite })}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        {template ? 'Update Template' : 'Create Template'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Template Preview Component
const TemplatePreview: React.FC<TemplatePreviewProps> = ({
    template,
    isOpen,
    onClose,
    onUse
}) => {
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    // Initialize variable values
    React.useEffect(() => {
        if (isOpen) {
            const initialValues: Record<string, string> = {};
            template.variables.forEach(variable => {
                // Set default values for common variables
                switch (variable) {
                    case 'currentDate':
                        initialValues[variable] = new Date().toLocaleDateString();
                        break;
                    case 'agentName':
                        initialValues[variable] = 'Your Name'; // Would come from auth context
                        break;
                    case 'companyName':
                        initialValues[variable] = 'Your Company';
                        break;
                    default:
                        initialValues[variable] = `{{${variable}}}`;
                }
            });
            setVariableValues(initialValues);
        }
    }, [template.variables, isOpen]);

    // Replace variables in content
    const processedSubject = useMemo(() => {
        let result = template.subject;
        Object.entries(variableValues).forEach(([variable, value]) => {
            result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
        });
        return result;
    }, [template.subject, variableValues]);

    const processedContent = useMemo(() => {
        let result = template.content;
        Object.entries(variableValues).forEach(([variable, value]) => {
            result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
        });
        return result;
    }, [template.content, variableValues]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Preview Template: {template.name}
                    </DialogTitle>
                    <DialogDescription>
                        Preview and customize variables before using this template
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Template Info */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Category:</span>
                                <div className="font-medium">{template.category}</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Used:</span>
                                <div className="font-medium">{template.usageCount} times</div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Created:</span>
                                <div className="font-medium">
                                    {new Date(template.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Variables:</span>
                                <div className="font-medium">{template.variables.length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Variable Inputs */}
                    {template.variables.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium">Customize Variables</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {template.variables.map(variable => (
                                    <div key={variable} className="space-y-1">
                                        <Label htmlFor={variable}>{variable}</Label>
                                        <Input
                                            id={variable}
                                            value={variableValues[variable] || ''}
                                            onChange={(e) => setVariableValues(prev => ({
                                                ...prev,
                                                [variable]: e.target.value
                                            }))}
                                            placeholder={`Enter ${variable}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="space-y-4">
                        <h4 className="font-medium">Template Preview</h4>

                        <div className="space-y-3">
                            <div>
                                <Label className="text-sm font-medium">Subject:</Label>
                                <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-950/20 rounded border">
                                    {processedSubject}
                                </div>
                            </div>

                            <div>
                                <Label className="text-sm font-medium">Content:</Label>
                                <div className="mt-1 p-4 bg-gray-50 dark:bg-gray-800 rounded border whitespace-pre-wrap">
                                    {processedContent}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                        <div>
                            <Label className="text-sm font-medium">Tags:</Label>
                            <div className="mt-1 flex flex-wrap gap-1">
                                {template.tags.map(tag => (
                                    <Badge key={tag} variant="secondary">{tag}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onUse(template)}>
                        Use This Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TicketTemplates;