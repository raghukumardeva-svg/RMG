import React, { useState, useCallback, useMemo } from 'react';
import {
    MessageSquare,
    Plus,
    Edit3,
    Trash2,
    Copy,
    Search,
    Star,
    Clock,
    User,
    Tag,
    Save,
    X,
    Send,
    Zap
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface CannedResponse {
    id: string;
    name: string;
    category: string;
    content: string;
    shortcut: string;
    variables: string[];
    tags: string[];
    isPublic: boolean;
    isFavorite: boolean;
    usageCount: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

interface CannedResponsesProps {
    onSelectResponse?: (response: CannedResponse) => void;
    onInsertResponse?: (content: string) => void;
    className?: string;
}

interface ResponseEditorProps {
    response?: CannedResponse;
    isOpen: boolean;
    onClose: () => void;
    onSave: (response: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
}

interface QuickInsertProps {
    responses: CannedResponse[];
    onInsert: (content: string) => void;
    className?: string;
}

// Default canned responses
const DEFAULT_RESPONSES: CannedResponse[] = [
    {
        id: '1',
        name: 'Welcome & Acknowledge',
        category: 'Greeting',
        content: 'Hi {{customerName}},\n\nThank you for contacting {{companyName}} support. I\'ve received your request regarding "{{ticketSubject}}" and I\'m here to help.\n\nI\'ll review your case and get back to you within {{responseTime}}.\n\nBest regards,\n{{agentName}}',
        shortcut: '/welcome',
        variables: ['customerName', 'companyName', 'ticketSubject', 'responseTime', 'agentName'],
        tags: ['greeting', 'acknowledgment', 'welcome'],
        isPublic: true,
        isFavorite: true,
        usageCount: 156,
        createdBy: 'admin',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-05T14:30:00Z',
    },
    {
        id: '2',
        name: 'Request More Information',
        category: 'Information Request',
        content: 'Hi {{customerName}},\n\nTo better assist you with this issue, I\'ll need some additional information:\n\n• Please provide more details about when this issue started\n• Are there any error messages? If so, please share the exact text\n• What steps have you already tried to resolve this?\n• {{additionalQuestions}}\n\nOnce I have this information, I\'ll be able to provide you with a more targeted solution.\n\nThank you for your patience.\n\nBest regards,\n{{agentName}}',
        shortcut: '/moreinfo',
        variables: ['customerName', 'additionalQuestions', 'agentName'],
        tags: ['information', 'clarification', 'troubleshooting'],
        isPublic: true,
        isFavorite: true,
        usageCount: 89,
        createdBy: 'admin',
        createdAt: '2024-01-02T09:15:00Z',
        updatedAt: '2024-01-02T09:15:00Z',
    },
    {
        id: '3',
        name: 'Issue Resolved',
        category: 'Resolution',
        content: 'Hi {{customerName}},\n\nGreat news! I\'ve successfully resolved the issue you reported.\n\nSummary of what was done:\n{{resolutionSummary}}\n\nPlease test the solution and confirm that everything is working correctly. If you experience any further issues or have questions, please don\'t hesitate to reach out.\n\nIs there anything else I can help you with today?\n\nBest regards,\n{{agentName}}',
        shortcut: '/resolved',
        variables: ['customerName', 'resolutionSummary', 'agentName'],
        tags: ['resolution', 'completion', 'followup'],
        isPublic: true,
        isFavorite: false,
        usageCount: 234,
        createdBy: 'admin',
        createdAt: '2024-01-03T11:20:00Z',
        updatedAt: '2024-01-06T16:45:00Z',
    },
    {
        id: '4',
        name: 'Escalation Notice',
        category: 'Escalation',
        content: 'Hi {{customerName}},\n\nI want to keep you updated on the status of your ticket.\n\nDue to the complexity of your request, I\'ve escalated this to our {{specialistTeam}} team for further assistance. They have the specialized expertise needed to resolve your issue.\n\nExpected timeframe: {{escalationTimeframe}}\nEscalation reference: {{escalationReference}}\n\nYou can expect an update from our specialist team within {{updateTimeframe}}. In the meantime, if you have any questions, please don\'t hesitate to reach out.\n\nThank you for your patience.\n\nBest regards,\n{{agentName}}',
        shortcut: '/escalate',
        variables: ['customerName', 'specialistTeam', 'escalationTimeframe', 'escalationReference', 'updateTimeframe', 'agentName'],
        tags: ['escalation', 'specialist', 'complex'],
        isPublic: true,
        isFavorite: false,
        usageCount: 67,
        createdBy: 'admin',
        createdAt: '2024-01-04T14:00:00Z',
        updatedAt: '2024-01-04T14:00:00Z',
    },
    {
        id: '5',
        name: 'Closing Follow-up',
        category: 'Closure',
        content: 'Hi {{customerName}},\n\nI hope this message finds you well. I\'m following up on the support case we recently resolved for you.\n\nJust to confirm:\n✅ Has the issue been fully resolved?\n✅ Are you satisfied with the solution provided?\n✅ Do you need any additional assistance?\n\nIf everything looks good, I\'ll close this ticket. However, if you need any further help or have questions, please reply to this message and I\'ll be happy to assist.\n\nThank you for choosing {{companyName}}!\n\nBest regards,\n{{agentName}}',
        shortcut: '/followup',
        variables: ['customerName', 'companyName', 'agentName'],
        tags: ['closure', 'followup', 'satisfaction'],
        isPublic: true,
        isFavorite: true,
        usageCount: 145,
        createdBy: 'admin',
        createdAt: '2024-01-05T16:30:00Z',
        updatedAt: '2024-01-05T16:30:00Z',
    },
];

const RESPONSE_CATEGORIES = [
    'All Categories',
    'Greeting',
    'Information Request',
    'Resolution',
    'Escalation',
    'Closure',
    'Troubleshooting',
    'General',
];

const COMMON_VARIABLES = [
    'customerName',
    'agentName',
    'ticketId',
    'ticketSubject',
    'companyName',
    'currentDate',
    'responseTime',
    'department',
];

export const CannedResponses = React.memo<CannedResponsesProps>(({
    onSelectResponse,
    onInsertResponse,
    className = ''
}) => {
    const [responses, setResponses] = useState<CannedResponse[]>(DEFAULT_RESPONSES);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingResponse, setEditingResponse] = useState<CannedResponse | undefined>();
    const [showQuickInsert, setShowQuickInsert] = useState(false);

    // Filter responses based on search, category, and favorites
    const filteredResponses = useMemo(() => {
        return responses.filter(response => {
            const matchesSearch = response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.shortcut.toLowerCase().includes(searchTerm.toLowerCase()) ||
                response.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesCategory = selectedCategory === 'All Categories' ||
                response.category === selectedCategory;

            const matchesFavorites = !showFavoritesOnly || response.isFavorite;

            return matchesSearch && matchesCategory && matchesFavorites;
        });
    }, [responses, searchTerm, selectedCategory, showFavoritesOnly]);

    // Handle response actions
    const handleNewResponse = useCallback(() => {
        setEditingResponse(undefined);
        setIsEditorOpen(true);
    }, []);

    const handleEditResponse = useCallback((response: CannedResponse) => {
        setEditingResponse(response);
        setIsEditorOpen(true);
    }, []);

    const handleSaveResponse = useCallback((responseData: Omit<CannedResponse, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
        const now = new Date().toISOString();

        if (editingResponse) {
            // Update existing response
            setResponses(prev => prev.map(r =>
                r.id === editingResponse.id
                    ? { ...responseData, id: r.id, createdAt: r.createdAt, updatedAt: now, usageCount: r.usageCount }
                    : r
            ));
            toast.success('Canned response updated successfully');
        } else {
            // Create new response
            const newResponse: CannedResponse = {
                ...responseData,
                id: Date.now().toString(),
                createdAt: now,
                updatedAt: now,
                usageCount: 0,
            };
            setResponses(prev => [newResponse, ...prev]);
            toast.success('Canned response created successfully');
        }

        setIsEditorOpen(false);
    }, [editingResponse]);

    const handleDeleteResponse = useCallback((responseId: string) => {
        setResponses(prev => prev.filter(r => r.id !== responseId));
        toast.success('Canned response deleted successfully');
    }, []);

    const handleToggleFavorite = useCallback((responseId: string) => {
        setResponses(prev => prev.map(r =>
            r.id === responseId ? { ...r, isFavorite: !r.isFavorite } : r
        ));
    }, []);

    const handleUseResponse = useCallback((response: CannedResponse) => {
        // Increment usage count
        setResponses(prev => prev.map(r =>
            r.id === response.id ? { ...r, usageCount: r.usageCount + 1 } : r
        ));

        onSelectResponse?.(response);
        onInsertResponse?.(response.content);
        toast.success(`Canned response "${response.name}" inserted`);
    }, [onSelectResponse, onInsertResponse]);

    const handleDuplicateResponse = useCallback((response: CannedResponse) => {
        const now = new Date().toISOString();
        const duplicatedResponse: CannedResponse = {
            ...response,
            id: Date.now().toString(),
            name: `${response.name} (Copy)`,
            shortcut: `${response.shortcut}-copy`,
            createdAt: now,
            updatedAt: now,
            usageCount: 0,
            isFavorite: false,
        };

        setResponses(prev => [duplicatedResponse, ...prev]);
        toast.success('Canned response duplicated successfully');
    }, []);

    const mostUsedResponses = useMemo(() => {
        return [...responses]
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 6);
    }, [responses]);

    const favoriteResponses = useMemo(() => {
        return responses.filter(r => r.isFavorite);
    }, [responses]);

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Canned Responses</h2>
                    <p className="text-muted-foreground">
                        Manage quick response templates with personalization variables
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowQuickInsert(!showQuickInsert)}
                        className="gap-1"
                    >
                        <Zap className="w-4 h-4" />
                        Quick Insert
                    </Button>

                    <Button onClick={handleNewResponse} className="gap-1">
                        <Plus className="w-4 h-4" />
                        New Response
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">All Responses</TabsTrigger>
                    <TabsTrigger value="favorites">
                        Favorites
                        {favoriteResponses.length > 0 && (
                            <Badge className="ml-2">{favoriteResponses.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="popular">Most Used</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <Input
                                            placeholder="Search responses, content, shortcuts, or tags..."
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
                                        {RESPONSE_CATEGORIES.map(category => (
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

                    {/* Responses Grid */}
                    <ResponsesGrid
                        responses={filteredResponses}
                        onEdit={handleEditResponse}
                        onDelete={handleDeleteResponse}
                        onToggleFavorite={handleToggleFavorite}
                        onUse={handleUseResponse}
                        onDuplicate={handleDuplicateResponse}
                        emptyMessage="No responses found. Try adjusting your filters or create a new response."
                        onCreateNew={handleNewResponse}
                    />
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4">
                    <ResponsesGrid
                        responses={favoriteResponses}
                        onEdit={handleEditResponse}
                        onDelete={handleDeleteResponse}
                        onToggleFavorite={handleToggleFavorite}
                        onUse={handleUseResponse}
                        onDuplicate={handleDuplicateResponse}
                        emptyMessage="No favorite responses yet. Mark responses as favorites for quick access."
                        onCreateNew={handleNewResponse}
                    />
                </TabsContent>

                <TabsContent value="popular" className="space-y-4">
                    <ResponsesGrid
                        responses={mostUsedResponses}
                        onEdit={handleEditResponse}
                        onDelete={handleDeleteResponse}
                        onToggleFavorite={handleToggleFavorite}
                        onUse={handleUseResponse}
                        onDuplicate={handleDuplicateResponse}
                        emptyMessage="No usage data available yet. Start using responses to see popular ones here."
                        onCreateNew={handleNewResponse}
                    />
                </TabsContent>
            </Tabs>

            {/* Quick Insert Panel */}
            {showQuickInsert && onInsertResponse && (
                <QuickInsert
                    responses={responses}
                    onInsert={(content) => {
                        onInsertResponse(content);
                        setShowQuickInsert(false);
                    }}
                />
            )}

            {/* Response Editor Dialog */}
            <ResponseEditor
                response={editingResponse}
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveResponse}
            />
        </div>
    );
});

CannedResponses.displayName = 'CannedResponses';

// Responses Grid Component
interface ResponsesGridProps {
    responses: CannedResponse[];
    onEdit: (response: CannedResponse) => void;
    onDelete: (id: string) => void;
    onToggleFavorite: (id: string) => void;
    onUse: (response: CannedResponse) => void;
    onDuplicate: (response: CannedResponse) => void;
    emptyMessage: string;
    onCreateNew: () => void;
}

const ResponsesGrid: React.FC<ResponsesGridProps> = ({
    responses,
    onEdit,
    onDelete,
    onToggleFavorite,
    onUse,
    onDuplicate,
    emptyMessage,
    onCreateNew,
}) => {
    if (responses.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No responses found</h3>
                <p className="text-muted-foreground mb-4">{emptyMessage}</p>
                <Button onClick={onCreateNew} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Response
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {responses.map(response => (
                <Card key={response.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    {response.name}
                                    {response.isFavorite && (
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {response.category} • {response.shortcut} • Used {response.usageCount} times
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
                                    <DropdownMenuItem onClick={() => onUse(response)}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Use Response
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(response)}>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onDuplicate(response)}>
                                        <Copy className="w-4 h-4 mr-2" />
                                        Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onToggleFavorite(response.id)}>
                                        <Star className={`w-4 h-4 mr-2 ${response.isFavorite ? 'text-yellow-500' : ''}`} />
                                        {response.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(response.id)}
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
                            <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-24 overflow-hidden relative">
                                {response.content.split('\n').slice(0, 3).join(' ')}
                                {response.content.split('\n').length > 3 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent" />
                                )}
                            </p>
                        </div>

                        {response.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {response.tags.slice(0, 3).map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                                {response.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{response.tags.length - 3} more
                                    </Badge>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={() => onUse(response)}
                                className="flex-1"
                                size="sm"
                            >
                                <Send className="w-4 h-4 mr-1" />
                                Use Response
                            </Button>
                            <Button
                                onClick={() => onEdit(response)}
                                variant="outline"
                                size="sm"
                            >
                                <Edit3 className="w-4 h-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

// Response Editor Component
const ResponseEditor: React.FC<ResponseEditorProps> = ({
    response,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        name: '',
        category: 'General',
        content: '',
        shortcut: '',
        variables: [] as string[],
        tags: [] as string[],
        isPublic: true,
        isFavorite: false,
        createdBy: 'current-user',
    });

    const [newTag, setNewTag] = useState('');
    const [newVariable, setNewVariable] = useState('');

    // Initialize form data when response changes
    React.useEffect(() => {
        if (response) {
            setFormData({
                name: response.name,
                category: response.category,
                content: response.content,
                shortcut: response.shortcut,
                variables: [...response.variables],
                tags: [...response.tags],
                isPublic: response.isPublic,
                isFavorite: response.isFavorite,
                createdBy: response.createdBy,
            });
        } else {
            setFormData({
                name: '',
                category: 'General',
                content: '',
                shortcut: '',
                variables: [],
                tags: [],
                isPublic: true,
                isFavorite: false,
                createdBy: 'current-user',
            });
        }
    }, [response, isOpen]);

    const handleSave = () => {
        if (!formData.name.trim() || !formData.content.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.shortcut && !formData.shortcut.startsWith('/')) {
            setFormData(prev => ({ ...prev, shortcut: `/${prev.shortcut}` }));
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
                        {response ? 'Edit Canned Response' : 'Create New Canned Response'}
                    </DialogTitle>
                    <DialogDescription>
                        Create quick response templates with personalization variables for faster customer communication
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Response Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Welcome Message"
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
                                    {RESPONSE_CATEGORIES.slice(1).map(category => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="shortcut">Shortcut (Optional)</Label>
                        <Input
                            id="shortcut"
                            value={formData.shortcut}
                            onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                            placeholder="e.g., /welcome (will be auto-prefixed with /)"
                        />
                        <p className="text-xs text-muted-foreground">
                            Type this shortcut in message fields for quick insertion
                        </p>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                        <Label htmlFor="content">Response Content *</Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={8}
                            placeholder="Enter your response content here...

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
                                <Label>Public Response</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow other team members to use this response
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
                                    Mark this response as a favorite for quick access
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
                        {response ? 'Update Response' : 'Create Response'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Quick Insert Component
const QuickInsert: React.FC<QuickInsertProps> = ({ responses, onInsert, className = '' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedResponse, setSelectedResponse] = useState<CannedResponse | null>(null);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});

    const filteredResponses = useMemo(() => {
        return responses.filter(response =>
            response.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            response.shortcut.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 6);
    }, [responses, searchTerm]);

    const handleSelectResponse = (response: CannedResponse) => {
        setSelectedResponse(response);

        // Initialize variable values with defaults
        const initialValues: Record<string, string> = {};
        response.variables.forEach(variable => {
            switch (variable) {
                case 'currentDate':
                    initialValues[variable] = new Date().toLocaleDateString();
                    break;
                case 'agentName':
                    initialValues[variable] = 'Your Name';
                    break;
                case 'companyName':
                    initialValues[variable] = 'Your Company';
                    break;
                default:
                    initialValues[variable] = '';
            }
        });
        setVariableValues(initialValues);
    };

    const handleInsert = () => {
        if (!selectedResponse) return;

        let content = selectedResponse.content;
        Object.entries(variableValues).forEach(([variable, value]) => {
            content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value || `{{${variable}}}`);
        });

        onInsert(content);
        setSelectedResponse(null);
        setVariableValues({});
        setSearchTerm('');
    };

    if (selectedResponse) {
        return (
            <Card className={`border-blue-200 ${className}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Customize: {selectedResponse.name}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedResponse(null)}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {selectedResponse.variables.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Fill in variables:</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedResponse.variables.map(variable => (
                                    <div key={variable}>
                                        <Label htmlFor={variable} className="text-xs">
                                            {variable}
                                        </Label>
                                        <Input
                                            id={variable}
                                            size="sm"
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

                    <div className="flex gap-2">
                        <Button onClick={handleInsert} className="flex-1">
                            Insert Response
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSelectedResponse(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`border-green-200 ${className}`}>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    Quick Insert Response
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search responses or type shortcut..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="space-y-2">
                    {filteredResponses.map(response => (
                        <div
                            key={response.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                            onClick={() => handleSelectResponse(response)}
                        >
                            <div>
                                <div className="font-medium text-sm">{response.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {response.shortcut} • {response.category}
                                </div>
                            </div>
                            <Button size="sm" variant="outline">
                                Use
                            </Button>
                        </div>
                    ))}

                    {filteredResponses.length === 0 && searchTerm && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No responses found for "{searchTerm}"
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export { QuickInsert };
export default CannedResponses;