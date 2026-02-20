/**
 * Category Management Page
 * Manage helpdesk categories with approval flow configuration
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  X,
  Download,
  Layers,
  Monitor,
  Building2,
  Wallet,
  ShieldCheck,
  ShieldOff,
  ToggleLeft,
  ToggleRight,
  FolderPlus,
  Settings2,
  ArrowRight,
  Info,
  Sparkles,
  UserCircle2,
  CircleDot,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  searchEmployees
} from '@/services/superAdminService';
import type {
  SubCategoryConfig,
  CategoryFormData,
  HighLevelCategory,
  ApprovalConfig,
  ApproverInfo,
  EmployeeSearchResult
} from '@/types/superAdmin';

const HIGH_LEVEL_CATEGORIES: HighLevelCategory[] = ['IT', 'Facilities', 'Finance'];

const PROCESSING_QUEUES = ['IT Support', 'Facilities Team', 'Finance Team', 'HR Team', 'General'];
const SPECIALIST_QUEUES = ['Hardware Team', 'Software Team', 'Network Team', 'Facilities', 'Finance', 'General'];

const getApprovalFlowLabel = (config?: ApprovalConfig) => {
  if (!config) return 'Not Configured';
  const levels: string[] = [];
  // Check if level is enabled AND has approvers
  if (config.l1?.enabled && config.l1.approvers?.length > 0) levels.push('L1');
  if (config.l2?.enabled && config.l2.approvers?.length > 0) levels.push('L2');
  if (config.l3?.enabled && config.l3.approvers?.length > 0) levels.push('L3');
  return levels.length > 0 ? levels.join(' → ') : 'Not Configured';
};

const getCategoryIcon = (category: string): React.ReactNode => {
  switch (category) {
    case 'IT': return <Monitor className="h-4 w-4" />;
    case 'Facilities': return <Building2 className="h-4 w-4" />;
    case 'Finance': return <Wallet className="h-4 w-4" />;
    default: return <FolderOpen className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'IT': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/20';
    case 'Facilities': return 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/10 dark:text-primary dark:border-primary/20';
    case 'Finance': return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  colorClass?: string;
}

function StatsCard({ title, value, icon, description, colorClass = 'bg-primary/10 text-primary' }: StatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClass}`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton Loading Component
function CategoryTableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-40 flex-1" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

// Visual Approval Flow Component
function ApprovalFlowIndicator({ config, requiresApproval }: { config?: ApprovalConfig; requiresApproval: boolean }) {
  if (!requiresApproval) {
    return (
      <Badge variant="secondary" className="gap-1">
        <ShieldOff className="h-3 w-3" />
        No Approval
      </Badge>
    );
  }

  // Check both enabled AND has approvers for a level to be truly configured
  const levels = [
    { key: 'l1', label: 'L1', enabled: config?.l1?.enabled && (config?.l1?.approvers?.length ?? 0) > 0, color: 'bg-blue-500' },
    { key: 'l2', label: 'L2', enabled: config?.l2?.enabled && (config?.l2?.approvers?.length ?? 0) > 0, color: 'bg-yellow-500' },
    { key: 'l3', label: 'L3', enabled: config?.l3?.enabled && (config?.l3?.approvers?.length ?? 0) > 0, color: 'bg-red-500' }
  ];

  const enabledLevels = levels.filter(l => l.enabled);
  
  if (enabledLevels.length === 0) {
    return (
      <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
        <AlertCircle className="h-3 w-3" />
        Not Configured
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            {levels.map((level, index) => (
              <div key={level.key} className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                    level.enabled 
                      ? `${level.color} text-white` 
                      : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                  }`}
                >
                  {level.label}
                </div>
                {index < levels.length - 1 && (
                  <ChevronRight className={`h-3 w-3 mx-0.5 ${level.enabled ? 'text-muted-foreground' : 'text-gray-300 dark:text-gray-600'}`} />
                )}
              </div>
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Approval Flow: {getApprovalFlowLabel(config)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Empty State Component
function EmptyState({ onAddCategory }: { onAddCategory: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <FolderPlus className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Categories help organize helpdesk requests. Create your first category to start configuring approval workflows.
      </p>
      <Button onClick={onAddCategory}>
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Category
      </Button>
    </div>
  );
}

// Queue suggestions based on category
const QUEUE_SUGGESTIONS: Record<string, { processing: string; specialist: string }> = {
  'IT': { processing: 'IT Support', specialist: 'Hardware Team' },
  'Facilities': { processing: 'Facilities Team', specialist: 'Facilities' },
  'Finance': { processing: 'Finance Team', specialist: 'Finance' }
};

// Form Step Indicator Component
interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; icon: React.ReactNode }[];
  onStepClick?: (step: number) => void;
}

function StepIndicator({ currentStep, steps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center flex-1">
          <button
            onClick={() => onStepClick?.(index)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : index < currentStep
                ? 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background/20 text-sm font-semibold">
              {index + 1}
            </span>
            <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
          </button>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${index < currentStep ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Live Preview Card Component
interface LivePreviewProps {
  formData: CategoryFormData;
}

function LivePreviewCard({ formData }: LivePreviewProps) {
  // A level is truly enabled only if it's enabled AND has approvers
  const enabledLevels = [
    formData.approvalConfig.l1.enabled && formData.approvalConfig.l1.approvers.length > 0 && 'L1',
    formData.approvalConfig.l2.enabled && formData.approvalConfig.l2.approvers.length > 0 && 'L2',
    formData.approvalConfig.l3.enabled && formData.approvalConfig.l3.approvers.length > 0 && 'L3'
  ].filter(Boolean);

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-primary">
          <Eye className="h-4 w-4" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category Badge & Name */}
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`gap-1.5 ${getCategoryColor(formData.highLevelCategory)}`}
          >
            {getCategoryIcon(formData.highLevelCategory)}
            {formData.highLevelCategory}
          </Badge>
          <span className="font-semibold text-lg">
            {formData.subCategory || 'Category Name'}
          </span>
          {!formData.isActive && (
            <Badge variant="secondary" className="text-xs">Inactive</Badge>
          )}
        </div>

        {/* Approval Flow Visual */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Approval:</span>
          {formData.requiresApproval ? (
            enabledLevels.length > 0 ? (
              <div className="flex items-center gap-1">
                {['L1', 'L2', 'L3'].map((level, idx) => {
                  const isEnabled = enabledLevels.includes(level);
                  const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-red-500'];
                  return (
                    <div key={level} className="flex items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isEnabled ? `${colors[idx]} text-white` : 'bg-gray-200 text-gray-400 dark:bg-gray-700'
                        }`}
                      >
                        {level}
                      </div>
                      {idx < 2 && (
                        <ArrowRight className={`h-3 w-3 mx-1 ${isEnabled ? 'text-primary' : 'text-gray-300'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
                <AlertCircle className="h-3 w-3" />
                Not Configured
              </Badge>
            )
          ) : (
            <Badge variant="secondary" className="gap-1">
              <ShieldOff className="h-3 w-3" />
              No Approval Required
            </Badge>
          )}
        </div>

        {/* Queue Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings2 className="h-3 w-3" />
          <span>{formData.processingQueue}</span>
          <ArrowRight className="h-3 w-3" />
          <span>{formData.specialistQueue}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Section Header Component
interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
}

function SectionHeader({ icon, title, description, badge }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            {title}
            {badge}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<SubCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SubCategoryConfig | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<SubCategoryConfig | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    highLevelCategory: 'IT',
    subCategory: '',
    requiresApproval: false,
    processingQueue: 'IT Support',
    specialistQueue: 'General',
    order: 999,
    isActive: true,
    approvalConfig: {
      l1: { enabled: false, approvers: [] },
      l2: { enabled: false, approvers: [] },
      l3: { enabled: false, approvers: [] }
    }
  });

  // Employee search state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [searchResults, setSearchResults] = useState<EmployeeSearchResult[]>([]);
  const [searchingEmployees, setSearchingEmployees] = useState(false);
  const [activeLevel, setActiveLevel] = useState<'l1' | 'l2' | 'l3' | null>(null);

  // Form step state
  const [currentStep, setCurrentStep] = useState(0);
  const formSteps = [
    { label: 'Basic Info', icon: <FolderOpen className="h-4 w-4" /> },
    { label: 'Queues', icon: <Settings2 className="h-4 w-4" /> },
    { label: 'Approval', icon: <CheckCircle2 className="h-4 w-4" /> }
  ];

  // Calculate stats
  const stats = useMemo(() => {
    const total = categories.length;
    const active = categories.filter(c => c.isActive).length;
    const requiresApproval = categories.filter(c => c.requiresApproval).length;
    const byCategory = {
      IT: categories.filter(c => c.highLevelCategory === 'IT').length,
      Facilities: categories.filter(c => c.highLevelCategory === 'Facilities').length,
      Finance: categories.filter(c => c.highLevelCategory === 'Finance').length
    };
    return { total, active, requiresApproval, byCategory };
  }, [categories]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories({
        highLevelCategory: filterCategory !== 'all' ? filterCategory : undefined,
        search: searchQuery || undefined,
        isActive: filterStatus !== 'all' ? filterStatus : undefined
      });
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchQuery, filterStatus]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Search employees with debounce
  useEffect(() => {
    const search = async () => {
      if (employeeSearch.length < 1) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchingEmployees(true);
        const results = await searchEmployees(employeeSearch);
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching employees:', err);
      } finally {
        setSearchingEmployees(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [employeeSearch]);

  const handleOpenForm = (category?: SubCategoryConfig) => {
    setCurrentStep(0); // Reset to first step
    if (category) {
      
      // Ensure approvalConfig has all levels properly defined
      const normalizedApprovalConfig = {
        l1: {
          enabled: category.approvalConfig?.l1?.enabled ?? false,
          approvers: category.approvalConfig?.l1?.approvers || []
        },
        l2: {
          enabled: category.approvalConfig?.l2?.enabled ?? false,
          approvers: category.approvalConfig?.l2?.approvers || []
        },
        l3: {
          enabled: category.approvalConfig?.l3?.enabled ?? false,
          approvers: category.approvalConfig?.l3?.approvers || []
        }
      };
      
      setEditingCategory(category);
      setFormData({
        highLevelCategory: category.highLevelCategory,
        subCategory: category.subCategory,
        requiresApproval: category.requiresApproval,
        processingQueue: category.processingQueue,
        specialistQueue: category.specialistQueue,
        order: category.order,
        isActive: category.isActive,
        approvalConfig: normalizedApprovalConfig
      });
    } else {
      setEditingCategory(null);
      setFormData({
        highLevelCategory: 'IT',
        subCategory: '',
        requiresApproval: false,
        processingQueue: 'IT Support',
        specialistQueue: 'Hardware Team',
        order: 999,
        isActive: true,
        approvalConfig: {
          l1: { enabled: false, approvers: [] },
          l2: { enabled: false, approvers: [] },
          l3: { enabled: false, approvers: [] }
        }
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.subCategory.trim()) {
      toast.error('Sub-category name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.id);
      toast.success('Category deleted successfully');
      setIsDeleteOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Failed to delete category');
    }
  };

  const handleAddApprover = (level: 'l1' | 'l2' | 'l3', employee: EmployeeSearchResult) => {
    const approvers = formData.approvalConfig[level].approvers;
    if (approvers.some(a => a.employeeId === employee.employeeId)) {
      return; // Already added
    }

    setFormData({
      ...formData,
      approvalConfig: {
        ...formData.approvalConfig,
        [level]: {
          ...formData.approvalConfig[level],
          approvers: [
            ...approvers,
            {
              employeeId: employee.employeeId,
              name: employee.name,
              email: employee.email,
              designation: employee.designation || ''
            }
          ]
        }
      }
    });
    setEmployeeSearch('');
    setSearchResults([]);
    setActiveLevel(null);
  };

  const handleRemoveApprover = (level: 'l1' | 'l2' | 'l3', employeeId: string) => {
    setFormData({
      ...formData,
      approvalConfig: {
        ...formData.approvalConfig,
        [level]: {
          ...formData.approvalConfig[level],
          approvers: formData.approvalConfig[level].approvers.filter(a => a.employeeId !== employeeId)
        }
      }
    });
  };

  const handleToggleLevel = (level: 'l1' | 'l2' | 'l3', enabled: boolean) => {
    setFormData({
      ...formData,
      approvalConfig: {
        ...formData.approvalConfig,
        [level]: {
          ...formData.approvalConfig[level],
          enabled
        }
      }
    });
  };

  // Quick toggle active status
  const handleQuickToggleActive = async (category: SubCategoryConfig) => {
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (err) {
      console.error('Error toggling category:', err);
      toast.error('Failed to update category status');
    }
  };

  // Export categories
  const handleExportCategories = () => {
    const exportData = categories.map(c => ({
      category: c.highLevelCategory,
      subCategory: c.subCategory,
      requiresApproval: c.requiresApproval,
      approvalFlow: c.requiresApproval ? getApprovalFlowLabel(c.approvalConfig) : 'None',
      processingQueue: c.processingQueue,
      status: c.isActive ? 'Active' : 'Inactive'
    }));
    
    const csv = [
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Categories exported successfully');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Category Management</h1>
            <p className="text-muted-foreground">Configure helpdesk categories and approval workflows</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCategories} disabled={categories.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Categories"
          value={stats.total}
          icon={<Layers className="h-5 w-5" />}
          description={`${stats.active} active`}
        />
        <StatsCard
          title="IT Categories"
          value={stats.byCategory.IT}
          icon={<Monitor className="h-5 w-5" />}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <StatsCard
          title="Facilities"
          value={stats.byCategory.Facilities}
          icon={<Building2 className="h-5 w-5" />}
          colorClass="bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400"
        />
        <StatsCard
          title="Finance"
          value={stats.byCategory.Finance}
          icon={<Wallet className="h-5 w-5" />}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400"
        />
        <StatsCard
          title="With Approval"
          value={stats.requiresApproval}
          icon={<ShieldCheck className="h-5 w-5" />}
          description={`${stats.total - stats.requiresApproval} without`}
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {HIGH_LEVEL_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    <span className="flex items-center gap-2">
                      {getCategoryIcon(cat)} {cat}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={fetchCategories} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh categories</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Categories
            {!loading && <Badge variant="secondary" className="ml-2">{categories.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CategoryTableSkeleton />
          ) : categories.length === 0 ? (
            <EmptyState onAddCategory={() => handleOpenForm()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Category</TableHead>
                  <TableHead>Sub-Category</TableHead>
                  <TableHead className="w-[180px]">Approval Flow</TableHead>
                  <TableHead className="w-[140px]">Processing Queue</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} className="group">
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`gap-1.5 ${getCategoryColor(category.highLevelCategory)}`}
                      >
                        {getCategoryIcon(category.highLevelCategory)}
                        {category.highLevelCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{category.subCategory}</TableCell>
                    <TableCell>
                      <ApprovalFlowIndicator 
                        config={category.approvalConfig} 
                        requiresApproval={category.requiresApproval} 
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category.processingQueue}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleQuickToggleActive(category)}
                              className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              {category.isActive ? (
                                <>
                                  <ToggleRight className="h-5 w-5 text-green-500" />
                                  <span className="text-sm text-green-600 dark:text-green-400">Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-5 w-5 text-gray-400" />
                                  <span className="text-sm text-gray-500">Inactive</span>
                                </>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            Click to {category.isActive ? 'deactivate' : 'activate'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenForm(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit category</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeletingCategory(category);
                                  setIsDeleteOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete category</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Category Form Drawer */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <SheetHeader className="mb-4">
              <SheetTitle className="flex items-center gap-2">
                {editingCategory ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </SheetTitle>
              <SheetDescription>
                Configure category details and approval workflow
              </SheetDescription>
            </SheetHeader>

            {/* Step Indicator */}
            <StepIndicator 
              currentStep={currentStep} 
              steps={formSteps} 
              onStepClick={setCurrentStep}
            />
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* Live Preview Card */}
            <LivePreviewCard formData={formData} />

            {/* Step 1: Basic Information */}
            {currentStep === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <SectionHeader
                    icon={<FolderOpen className="h-5 w-5" />}
                    title="Basic Information"
                    description="Define the category type and name"
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        High Level Category <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.highLevelCategory}
                        onValueChange={(v) => {
                          const suggestion = QUEUE_SUGGESTIONS[v];
                          setFormData({ 
                            ...formData, 
                            highLevelCategory: v as HighLevelCategory,
                            processingQueue: suggestion?.processing || formData.processingQueue,
                            specialistQueue: suggestion?.specialist || formData.specialistQueue
                          });
                        }}
                      >
                        <SelectTrigger className={getCategoryColor(formData.highLevelCategory)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HIGH_LEVEL_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>
                              <span className="flex items-center gap-2">
                                {getCategoryIcon(cat)} {cat}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Sub-Category Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formData.subCategory}
                        onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                        placeholder="e.g., New Laptop Request"
                        className={!formData.subCategory ? 'border-orange-300 focus:border-orange-500' : ''}
                      />
                      {!formData.subCategory && (
                        <p className="text-xs text-orange-500 flex items-center gap-1">
                          <Info className="h-3 w-3" /> Required field
                        </p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 999 })}
                        min={1}
                      />
                      <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label htmlFor="isActive" className="flex items-center gap-2 cursor-pointer">
                          {formData.isActive ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <span className="text-green-600 dark:text-green-400">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-500">Inactive</span>
                            </>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Queue Configuration */}
            {currentStep === 1 && (
              <Card>
                <CardContent className="pt-6">
                  <SectionHeader
                    icon={<Settings2 className="h-5 w-5" />}
                    title="Queue Configuration"
                    description="Assign processing and specialist queues"
                    badge={
                      QUEUE_SUGGESTIONS[formData.highLevelCategory] && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Sparkles className="h-3 w-3" />
                          Auto-suggested
                        </Badge>
                      )
                    }
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Processing Queue <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.processingQueue}
                        onValueChange={(v) => setFormData({ ...formData, processingQueue: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROCESSING_QUEUES.map(queue => (
                            <SelectItem key={queue} value={queue}>
                              {queue}
                              {QUEUE_SUGGESTIONS[formData.highLevelCategory]?.processing === queue && (
                                <Badge variant="secondary" className="ml-2 text-xs">Suggested</Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Initial team to handle requests</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Specialist Queue <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.specialistQueue}
                        onValueChange={(v) => setFormData({ ...formData, specialistQueue: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIST_QUEUES.map(queue => (
                            <SelectItem key={queue} value={queue}>
                              {queue}
                              {QUEUE_SUGGESTIONS[formData.highLevelCategory]?.specialist === queue && (
                                <Badge variant="secondary" className="ml-2 text-xs">Suggested</Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Specialized team for complex issues</p>
                    </div>
                  </div>

                  {/* Queue Flow Visualization */}
                  <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium mb-3">Request Flow</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">Employee</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="secondary">{formData.processingQueue}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge className="bg-primary">{formData.specialistQueue}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Approval Workflow Configuration */}
            {currentStep === 2 && (
              <Card>
                <CardContent className="pt-6">
                  <SectionHeader
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title="Approval Workflow"
                    description="Configure multi-level approval requirements"
                  />

                  {/* Requires Approval Toggle */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${formData.requiresApproval ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        {formData.requiresApproval ? (
                          <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <ShieldOff className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">Requires Approval</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.requiresApproval 
                            ? 'Requests need approval before processing' 
                            : 'Requests go directly to processing queue'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.requiresApproval}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresApproval: checked })}
                    />
                  </div>

                  {formData.requiresApproval && (
                    <div className="space-y-4">
                      {/* Level 1 - Always show when approval is required */}
                      <EnhancedApprovalLevelConfig
                        level="l1"
                        stepNumber={1}
                        label="L1"
                        description="First level approval"
                        color="blue"
                        config={formData.approvalConfig.l1}
                        onToggle={(enabled) => handleToggleLevel('l1', enabled)}
                        onAddApprover={(emp) => handleAddApprover('l1', emp)}
                        onRemoveApprover={(empId) => handleRemoveApprover('l1', empId)}
                        employeeSearch={activeLevel === 'l1' ? employeeSearch : ''}
                        setEmployeeSearch={(v) => {
                          setActiveLevel('l1');
                          setEmployeeSearch(v);
                        }}
                        searchResults={activeLevel === 'l1' ? searchResults : []}
                        searching={activeLevel === 'l1' && searchingEmployees}
                      />

                      {/* Show L2 if: L1 has approvers OR L2 is already configured (edit mode) */}
                      {((formData.approvalConfig.l1.enabled && formData.approvalConfig.l1.approvers.length > 0) || 
                        formData.approvalConfig.l2.enabled || 
                        formData.approvalConfig.l2.approvers.length > 0) && (
                        <>
                          {/* Connector */}
                          <div className="flex justify-center py-1">
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-4 bg-blue-500" />
                              <ChevronDown className="h-4 w-4 text-blue-500 -my-1" />
                            </div>
                          </div>

                          {/* Level 2 - Show card if enabled or has approvers, otherwise show add button */}
                          {!formData.approvalConfig.l2.enabled && formData.approvalConfig.l2.approvers.length === 0 ? (
                            <AddApprovalLevelButton
                              level="L2"
                              label="Add L2 Approval"
                              description="Add second level approval"
                              color="yellow"
                              onClick={() => handleToggleLevel('l2', true)}
                            />
                          ) : (
                            <EnhancedApprovalLevelConfig
                              level="l2"
                              stepNumber={2}
                              label="L2"
                              description="Second level approval"
                              color="yellow"
                              config={formData.approvalConfig.l2}
                              onToggle={(enabled) => handleToggleLevel('l2', enabled)}
                              onAddApprover={(emp) => handleAddApprover('l2', emp)}
                              onRemoveApprover={(empId) => handleRemoveApprover('l2', empId)}
                              employeeSearch={activeLevel === 'l2' ? employeeSearch : ''}
                              setEmployeeSearch={(v) => {
                                setActiveLevel('l2');
                                setEmployeeSearch(v);
                              }}
                              searchResults={activeLevel === 'l2' ? searchResults : []}
                              searching={activeLevel === 'l2' && searchingEmployees}
                            />
                          )}
                        </>
                      )}

                      {/* Show L3 if: L2 has approvers OR L3 is already configured (edit mode) */}
                      {((formData.approvalConfig.l2.enabled && formData.approvalConfig.l2.approvers.length > 0) ||
                        formData.approvalConfig.l3.enabled ||
                        formData.approvalConfig.l3.approvers.length > 0) && (
                        <>
                          {/* Connector */}
                          <div className="flex justify-center py-1">
                            <div className="flex flex-col items-center">
                              <div className="w-0.5 h-4 bg-yellow-500" />
                              <ChevronDown className="h-4 w-4 text-yellow-500 -my-1" />
                            </div>
                          </div>

                          {/* Level 3 - Show card if enabled or has approvers, otherwise show add button */}
                          {!formData.approvalConfig.l3.enabled && formData.approvalConfig.l3.approvers.length === 0 ? (
                            <AddApprovalLevelButton
                              level="L3"
                              label="Add L3 Approval"
                              description="Add final level approval"
                              color="red"
                              onClick={() => handleToggleLevel('l3', true)}
                            />
                          ) : (
                            <EnhancedApprovalLevelConfig
                              level="l3"
                              stepNumber={3}
                              label="L3"
                              description="Final level approval"
                              color="red"
                              config={formData.approvalConfig.l3}
                              onToggle={(enabled) => handleToggleLevel('l3', enabled)}
                              onAddApprover={(emp) => handleAddApprover('l3', emp)}
                              onRemoveApprover={(empId) => handleRemoveApprover('l3', empId)}
                              employeeSearch={activeLevel === 'l3' ? employeeSearch : ''}
                              setEmployeeSearch={(v) => {
                                setActiveLevel('l3');
                                setEmployeeSearch(v);
                              }}
                              searchResults={activeLevel === 'l3' ? searchResults : []}
                              searching={activeLevel === 'l3' && searchingEmployees}
                            />
                          )}
                        </>
                      )}

                      {/* Flow Summary - Show if any level has approvers configured */}
                      {((formData.approvalConfig.l1.enabled && formData.approvalConfig.l1.approvers.length > 0) ||
                        (formData.approvalConfig.l2.enabled && formData.approvalConfig.l2.approvers.length > 0) ||
                        (formData.approvalConfig.l3.enabled && formData.approvalConfig.l3.approvers.length > 0)) && (
                        <div className="bg-primary/5 rounded-lg p-4 mt-4 border border-primary/20">
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <CircleDot className="h-4 w-4 text-primary" />
                            Approval Flow Summary
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">Employee Request</Badge>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            {formData.approvalConfig.l1.enabled && formData.approvalConfig.l1.approvers.length > 0 && (
                              <>
                                <Badge className="bg-blue-500">L1</Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </>
                            )}
                            {formData.approvalConfig.l2.enabled && formData.approvalConfig.l2.approvers.length > 0 && (
                              <>
                                <Badge className="bg-yellow-500 text-black">L2</Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </>
                            )}
                            {formData.approvalConfig.l3.enabled && formData.approvalConfig.l3.approvers.length > 0 && (
                              <>
                                <Badge className="bg-red-500">L3</Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </>
                            )}
                            <Badge variant="secondary">{formData.processingQueue}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4">
            {/* Mini Summary */}
            <div className="flex items-center justify-between mb-4 p-2 rounded-lg bg-muted/50 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getCategoryColor(formData.highLevelCategory)}>
                  {getCategoryIcon(formData.highLevelCategory)}
                  {formData.highLevelCategory}
                </Badge>
                <span className="text-muted-foreground">›</span>
                <span className="font-medium">{formData.subCategory || 'Untitled'}</span>
              </div>
              <div className="flex items-center gap-2">
                {formData.requiresApproval ? (
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {getApprovalFlowLabel(formData.approvalConfig)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldOff className="h-3 w-3" />
                    No Approval
                  </Badge>
                )}
              </div>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                    Previous
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                {currentStep < formSteps.length - 1 ? (
                  <Button onClick={() => setCurrentStep(currentStep + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !formData.subCategory}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Category
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.subCategory}"? This will deactivate the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Add Approval Level Button Component
interface AddApprovalLevelButtonProps {
  level: string;
  label: string;
  description: string;
  color: 'blue' | 'yellow' | 'red';
  onClick: () => void;
}

function AddApprovalLevelButton({ level, label, description, color, onClick }: AddApprovalLevelButtonProps) {
  const colorConfig = {
    blue: {
      border: 'border-blue-300 hover:border-blue-500',
      bg: 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40',
      badge: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400'
    },
    yellow: {
      border: 'border-yellow-300 hover:border-yellow-500',
      bg: 'bg-yellow-50/50 hover:bg-yellow-50 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/40',
      badge: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400'
    },
    red: {
      border: 'border-red-300 hover:border-red-500',
      bg: 'bg-red-50/50 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/40',
      badge: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400'
    }
  };

  const colors = colorConfig[color];

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 border-dashed ${colors.border} ${colors.bg} transition-all duration-200 group`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${colors.badge} opacity-60 group-hover:opacity-100 transition-opacity`}>
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-left flex-1">
          <p className={`font-semibold ${colors.text} flex items-center gap-2`}>
            {label}
            <Badge variant="outline" className="text-xs">{level}</Badge>
          </p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight className={`h-5 w-5 ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </div>
    </button>
  );
}

// Enhanced Approval Level Configuration Component
interface EnhancedApprovalLevelConfigProps {
  level: 'l1' | 'l2' | 'l3';
  stepNumber: number;
  label: string;
  description: string;
  color: 'blue' | 'yellow' | 'red';
  config: { enabled: boolean; approvers: ApproverInfo[] };
  onToggle: (enabled: boolean) => void;
  onAddApprover: (employee: EmployeeSearchResult) => void;
  onRemoveApprover: (employeeId: string) => void;
  employeeSearch: string;
  setEmployeeSearch: (v: string) => void;
  searchResults: EmployeeSearchResult[];
  searching: boolean;
}

function EnhancedApprovalLevelConfig({
  level,
  stepNumber,
  label,
  description,
  color,
  config,
  onToggle,
  onAddApprover,
  onRemoveApprover,
  employeeSearch,
  setEmployeeSearch,
  searchResults,
  searching
}: EnhancedApprovalLevelConfigProps) {
  const colorConfig = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      badge: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      lightBg: 'bg-blue-100 dark:bg-blue-900/50'
    },
    yellow: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      badge: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      lightBg: 'bg-yellow-100 dark:bg-yellow-900/50'
    },
    red: {
      border: 'border-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      badge: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      lightBg: 'bg-red-100 dark:bg-red-900/50'
    }
  };

  const colors = colorConfig[color];

  return (
    <div className={`border-l-4 rounded-lg overflow-hidden ${colors.border} ${colors.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${colors.badge}`}>
            {stepNumber}
          </div>
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              {label}
              {config.approvers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {config.approvers.length} approver{config.approvers.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`enable-${level}`}
            checked={config.enabled}
            onCheckedChange={onToggle}
          />
          <Label htmlFor={`enable-${level}`} className={`text-sm font-medium ${config.enabled ? colors.text : 'text-muted-foreground'}`}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Label>
        </div>
      </div>

      {/* Content */}
      {config.enabled ? (
        <div className="p-4 space-y-3">
          {/* Approver Search */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees to add as approvers..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900"
              />
            </div>
            {(searchResults.length > 0 || searching) && employeeSearch && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searching ? (
                  <div className="p-3 text-center text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                    Searching...
                  </div>
                ) : (
                  searchResults.map(emp => (
                    <button
                      key={emp.employeeId}
                      className="w-full p-3 text-left hover:bg-muted flex items-center justify-between border-b last:border-b-0"
                      onClick={() => onAddApprover(emp)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.email}</div>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Approvers */}
          <div className="space-y-2">
            {config.approvers.length > 0 ? (
              <div className="grid gap-2">
                {config.approvers.map(approver => (
                  <div
                    key={approver.employeeId}
                    className={`flex items-center justify-between p-2 rounded-lg ${colors.lightBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                        <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{approver.name}</div>
                        <div className="text-xs text-muted-foreground">{approver.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveApprover(approver.employeeId)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                No approvers assigned. Search and add employees above.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4" />
          Enable this level to configure approvers
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;
