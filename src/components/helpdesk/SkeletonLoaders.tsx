import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton for individual ticket card
export const TicketCardSkeleton = React.memo(() => (
    <Card className="animate-pulse">
        <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </CardContent>
    </Card>
));

TicketCardSkeleton.displayName = 'TicketCardSkeleton';

// Skeleton for ticket list
export const TicketListSkeleton = React.memo<{ count?: number }>(({ count = 5 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }, (_, i) => (
            <TicketCardSkeleton key={i} />
        ))}
    </div>
));

TicketListSkeleton.displayName = 'TicketListSkeleton';

// Skeleton for ticket detail view
export const TicketDetailSkeleton = React.memo(() => (
    <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>
        </div>

        {/* Summary Section */}
        <Card className="animate-pulse">
            <CardHeader>
                <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-3/5" />
                </div>
            </CardContent>
        </Card>

        {/* Timeline Skeleton */}
        <Card className="animate-pulse">
            <CardHeader>
                <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                            <div className="space-y-1 flex-1">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Conversation Skeleton */}
        <Card className="animate-pulse">
            <CardHeader>
                <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
));

TicketDetailSkeleton.displayName = 'TicketDetailSkeleton';

// Skeleton for dashboard stats
export const StatCardSkeleton = React.memo(() => (
    <Card className="animate-pulse">
        <CardContent className="p-6">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </CardContent>
    </Card>
));

StatCardSkeleton.displayName = 'StatCardSkeleton';

// Skeleton for dashboard with stats
export const DashboardSkeleton = React.memo(() => (
    <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Ticket List */}
            <div className="lg:col-span-2">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <TicketListSkeleton count={3} />
                </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
                <Card className="animate-pulse">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

// Skeleton for search results
export const SearchResultsSkeleton = React.memo<{ count?: number }>(({ count = 3 }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
        </div>

        {Array.from({ length: count }, (_, i) => (
            <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-3/4" />
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-16 rounded-full" />
                                <Skeleton className="h-4 w-20 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
));

SearchResultsSkeleton.displayName = 'SearchResultsSkeleton';