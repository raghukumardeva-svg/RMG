/**
 * UI Component Exports
 * 
 * This file re-exports commonly used UI components for easier imports.
 * Import from '@/components/ui' instead of individual files.
 */

// Core UI Components (shadcn/ui based)
export { Button, buttonVariants } from './button';
export { Badge, badgeVariants } from './badge';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Input } from './input';
export { Label } from './label';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from './sheet';
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './dropdown-menu';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Checkbox } from './checkbox';
export { Switch } from './switch';
export { Textarea } from './textarea';
export { Separator } from './separator';
export { Progress } from './progress';
export { Skeleton } from './skeleton';
export { ScrollArea } from './scroll-area';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Calendar } from './calendar';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog';
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

// Custom UI Components (Design System)
export { PageContainer, PageHeader, SectionHeader, ContentGrid } from './page-layout';
export { StatCard, MiniStatCard } from './stat-card';
export { UserAvatar, UserInfo } from './user-avatar';
export { StatusBadge, PriorityBadge } from './status-badge';

// Specialized Components
export { DatePicker } from './date-picker';
export { HolidayCard } from './holiday-card';
export { LoadingOverlay } from './loading-overlay';
export { SkeletonCard } from './skeleton-card';
export { CollapsibleSection } from './collapsible-section';
export { FileUploadWithProgress } from './file-upload-with-progress';
export { RichTextEditor } from './rich-text-editor';
export { PeoplePicker } from './people-picker';
