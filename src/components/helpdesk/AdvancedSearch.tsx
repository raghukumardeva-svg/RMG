import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, X, Calendar, User, Tag, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import type { HelpdeskTicket } from '@/types/helpdesk';

export interface SearchFilters {
    searchText?: string;
    status?: string[];
    priority?: string[];
    assignee?: string[];
    category?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

interface AdvancedSearchProps {
    onFiltersChange: (filters: SearchFilters) => void;
    tickets: HelpdeskTicket[];
    className?: string;
}

const STATUS_OPTIONS = [
    { value: 'Open', label: 'Open', color: 'bg-blue-100 text-blue-800' },
    { value: 'In Progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Resolved', label: 'Resolved', color: 'bg-green-100 text-green-800' },
    { value: 'Closed', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
    { value: 'Cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

const PRIORITY_OPTIONS = [
    { value: 'Low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'Medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'High', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'Critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

export const AdvancedSearch = React.memo<AdvancedSearchProps>(({
    onFiltersChange,
    tickets,
    className = ''
}) => {
    const [filters, setFilters] = useState<SearchFilters>({
        searchText: '',
        status: [],
        priority: [],
        assignee: [],
        category: [],
        dateRange: undefined
    });

    const [showAdvanced, setShowAdvanced] = useState(false);
    const [dateRangeOpen, setDateRangeOpen] = useState(false);
    const [fromDate, setFromDate] = useState<Date>();
    const [toDate, setToDate] = useState<Date>();

    // Extract unique values from tickets for filter options
    const filterOptions = useMemo(() => {
        const assignees = new Set<string>();
        const categories = new Set<string>();

        tickets.forEach(ticket => {
            if (ticket.assignedTo) assignees.add(ticket.assignedTo);
            if (ticket.requestType) categories.add(ticket.requestType);
        });

        return {
            assignees: Array.from(assignees).map(a => ({ value: a, label: a })),
            categories: Array.from(categories).map(c => ({ value: c, label: c }))
        };
    }, [tickets]);

    // Debounced search text update
    const updateSearchText = useCallback(
        debounce((text: string) => {
            const newFilters = { ...filters, searchText: text };
            setFilters(newFilters);
            onFiltersChange(newFilters);
        }, 300),
        [filters, onFiltersChange]
    );

    const handleFilterChange = useCallback((key: keyof SearchFilters, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    }, [filters, onFiltersChange]);

    const toggleArrayFilter = useCallback((key: 'status' | 'priority' | 'assignee' | 'category', value: string) => {
        const currentArray = filters[key] || [];
        const newArray = currentArray.includes(value)
            ? currentArray.filter(item => item !== value)
            : [...currentArray, value];

        handleFilterChange(key, newArray);
    }, [filters, handleFilterChange]);

    const handleDateRangeSelect = useCallback(() => {
        if (fromDate && toDate) {
            handleFilterChange('dateRange', { start: fromDate, end: toDate });
            setDateRangeOpen(false);
        }
    }, [fromDate, toDate, handleFilterChange]);

    const clearAllFilters = useCallback(() => {
        const clearedFilters: SearchFilters = {
            searchText: '',
            status: [],
            priority: [],
            assignee: [],
            category: [],
            dateRange: undefined
        };

        setFilters(clearedFilters);
        setFromDate(undefined);
        setToDate(undefined);
        onFiltersChange(clearedFilters);
    }, [onFiltersChange]);

    const hasActiveFilters = useMemo(() => {
        return (
            (filters.searchText && filters.searchText.trim() !== '') ||
            (filters.status && filters.status.length > 0) ||
            (filters.priority && filters.priority.length > 0) ||
            (filters.assignee && filters.assignee.length > 0) ||
            (filters.category && filters.category.length > 0) ||
            !!filters.dateRange
        );
    }, [filters]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchText?.trim()) count++;
        if (filters.status?.length) count++;
        if (filters.priority?.length) count++;
        if (filters.assignee?.length) count++;
        if (filters.category?.length) count++;
        if (filters.dateRange) count++;
        return count;
    }, [filters]);

    return (
        <Card className={`${className}`}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Search & Filter
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear All
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="relative"
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                            {activeFilterCount > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white"
                                >
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search tickets by ID, subject, description, or user..."
                        className="pl-10"
                        onChange={(e) => updateSearchText(e.target.value)}
                    />
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Status</Label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={filters.status?.includes(option.value) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleArrayFilter('status', option.value)}
                                        className="h-8"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Priority</Label>
                            <div className="flex flex-wrap gap-2">
                                {PRIORITY_OPTIONS.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={filters.priority?.includes(option.value) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleArrayFilter('priority', option.value)}
                                        className="h-8"
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Assignee Filter */}
                        {filterOptions.assignees.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Assigned To</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {filterOptions.assignees.map((assignee) => (
                                        <div key={assignee.value} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`assignee-${assignee.value}`}
                                                checked={filters.assignee?.includes(assignee.value)}
                                                onCheckedChange={() => toggleArrayFilter('assignee', assignee.value)}
                                            />
                                            <Label
                                                htmlFor={`assignee-${assignee.value}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {assignee.label}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Category Filter */}
                        {filterOptions.categories.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Category</Label>
                                <div className="flex flex-wrap gap-2">
                                    {filterOptions.categories.map((category) => (
                                        <Button
                                            key={category.value}
                                            variant={filters.category?.includes(category.value) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleArrayFilter('category', category.value)}
                                            className="h-8"
                                        >
                                            {category.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Date Range</Label>
                            <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal"
                                    >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {filters.dateRange
                                            ? `${format(filters.dateRange.start, 'MMM dd, yyyy')} - ${format(filters.dateRange.end, 'MMM dd, yyyy')}`
                                            : 'Select date range'
                                        }
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <Label>From Date</Label>
                                            <CalendarComponent
                                                mode="single"
                                                selected={fromDate}
                                                onSelect={setFromDate}
                                                disabled={(date) => date > new Date() || (toDate && date > toDate)}
                                                initialFocus
                                            />
                                        </div>

                                        {fromDate && (
                                            <div className="space-y-2">
                                                <Label>To Date</Label>
                                                <CalendarComponent
                                                    mode="single"
                                                    selected={toDate}
                                                    onSelect={setToDate}
                                                    disabled={(date) => date > new Date() || date < fromDate}
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleDateRangeSelect}
                                                disabled={!fromDate || !toDate}
                                                className="flex-1"
                                            >
                                                Apply
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setFromDate(undefined);
                                                    setToDate(undefined);
                                                    handleFilterChange('dateRange', undefined);
                                                    setDateRangeOpen(false);
                                                }}
                                                className="flex-1"
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="pt-4 border-t">
                        <div className="flex flex-wrap gap-2">
                            {filters.searchText && (
                                <Badge variant="secondary" className="gap-1">
                                    <Search className="w-3 h-3" />
                                    "{filters.searchText}"
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => handleFilterChange('searchText', '')}
                                    />
                                </Badge>
                            )}

                            {filters.status?.map(status => (
                                <Badge key={status} variant="secondary" className="gap-1">
                                    <Tag className="w-3 h-3" />
                                    {status}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => toggleArrayFilter('status', status)}
                                    />
                                </Badge>
                            ))}

                            {filters.priority?.map(priority => (
                                <Badge key={priority} variant="secondary" className="gap-1">
                                    {priority} Priority
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => toggleArrayFilter('priority', priority)}
                                    />
                                </Badge>
                            ))}

                            {filters.assignee?.map(assignee => (
                                <Badge key={assignee} variant="secondary" className="gap-1">
                                    <User className="w-3 h-3" />
                                    {assignee}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => toggleArrayFilter('assignee', assignee)}
                                    />
                                </Badge>
                            ))}

                            {filters.category?.map(category => (
                                <Badge key={category} variant="secondary" className="gap-1">
                                    {category}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => toggleArrayFilter('category', category)}
                                    />
                                </Badge>
                            ))}

                            {filters.dateRange && (
                                <Badge variant="secondary" className="gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(filters.dateRange.start, 'MMM dd')} - {format(filters.dateRange.end, 'MMM dd')}
                                    <X
                                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                                        onClick={() => handleFilterChange('dateRange', undefined)}
                                    />
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

AdvancedSearch.displayName = 'AdvancedSearch';

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}