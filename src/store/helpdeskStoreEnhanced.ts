import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { helpdeskService } from '@/services/helpdeskService';
import type { HelpdeskTicket, TicketStatus } from '@/types/helpdesk';
import { toast } from 'sonner';

// Cache for expensive computations
const ticketCache = new Map<string, HelpdeskTicket[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

// Memoized selectors
export const createTicketSelectors = (tickets: HelpdeskTicket[]) => {
  return {
    getByStatus: (status: string) => tickets.filter(t => t.status === status),
    getByPriority: (priority: string) => tickets.filter(t => t.urgency === priority),
    getByAssignee: (assigneeId: string) => tickets.filter(t => t.assignedTo === assigneeId),
    getPending: () => tickets.filter(t => ['Open', 'In Progress'].includes(t.status)),
    getResolved: () => tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)),
    getCount: () => tickets.length,
    getByDateRange: (startDate: Date, endDate: Date) => 
      tickets.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate >= startDate && createdDate <= endDate;
      }),
    getMetrics: () => {
      const total = tickets.length;
      const pending = tickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length;
      const resolved = tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length;
      const cancelled = tickets.filter(t => t.status === 'Cancelled').length;
      
      return {
        total,
        pending,
        resolved,
        cancelled,
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : '0'
      };
    }
  };
};

// Enhanced search functionality
export const createSearchFilters = (tickets: HelpdeskTicket[]) => {
  return {
    searchByText: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return tickets.filter(ticket => 
        ticket.subject.toLowerCase().includes(lowerQuery) ||
        ticket.description.toLowerCase().includes(lowerQuery) ||
        ticket.userName.toLowerCase().includes(lowerQuery) ||
        (ticket.id || '').toString().toLowerCase().includes(lowerQuery)
      );
    },
    
    filterByMultipleCriteria: (filters: {
      status?: string[];
      priority?: string[];
      assignee?: string[];
      dateRange?: { start: Date; end: Date };
      searchText?: string;
    }) => {
      return tickets.filter(ticket => {
        // Status filter
        if (filters.status?.length && !filters.status.includes(ticket.status)) {
          return false;
        }
        
        // Priority filter
        if (filters.priority?.length && !filters.priority.includes(ticket.urgency)) {
          return false;
        }
        
        // Assignee filter
        if (filters.assignee?.length && !filters.assignee.includes(ticket.assignedTo || '')) {
          return false;
        }
        
        // Date range filter
        if (filters.dateRange) {
          const ticketDate = new Date(ticket.createdAt);
          if (ticketDate < filters.dateRange.start || ticketDate > filters.dateRange.end) {
            return false;
          }
        }
        
        // Text search
        if (filters.searchText) {
          const lowerQuery = filters.searchText.toLowerCase();
          const matchesText = 
            ticket.subject.toLowerCase().includes(lowerQuery) ||
            ticket.description.toLowerCase().includes(lowerQuery) ||
            ticket.userName.toLowerCase().includes(lowerQuery);
          
          if (!matchesText) {
            return false;
          }
        }
        
        return true;
      });
    }
  };
};

interface HelpdeskStoreEnhanced {
  tickets: HelpdeskTicket[];
  isLoading: boolean;
  error: string | null;
  
  // Core operations
  createTicket: (data: Omit<HelpdeskTicket, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicket: (id: string, data: Partial<HelpdeskTicket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  fetchTickets: (userId?: string) => Promise<void>;
  
  // Performance optimizations
  cachedSelectors: ReturnType<typeof createTicketSelectors> | null;
  cachedSearch: ReturnType<typeof createSearchFilters> | null;
  lastFetchTime: number;
  
  // Cache management
  clearCache: () => void;
  invalidateUserCache: (userId: string) => void;
  
  // Enhanced operations
  fetchTicketsOptimized: (userId?: string, forceRefresh?: boolean) => Promise<void>;
  getTicketSelectors: () => ReturnType<typeof createTicketSelectors>;
  getSearchFilters: () => ReturnType<typeof createSearchFilters>;
  
  // Bulk operations
  bulkUpdateStatus: (ticketIds: string[], status: TicketStatus) => Promise<void>;
  bulkAssignTickets: (ticketIds: string[], assigneeId: string, assigneeName: string) => Promise<void>;
  
  // Analytics
  getAnalytics: (dateRange?: { start: Date; end: Date }) => {
    totalTickets: number;
    averageResolutionTime: number;
    ticketsByStatus: Record<string, number>;
    ticketsByPriority: Record<string, number>;
    trendsData: { date: string; count: number }[];
  };
}

export const useHelpdeskStoreEnhanced = create<HelpdeskStoreEnhanced>()(
  subscribeWithSelector((set, get) => ({
    tickets: [],
    isLoading: false,
    error: null,
    cachedSelectors: null,
    cachedSearch: null,
    lastFetchTime: 0,

    // Core operations
    createTicket: async (data: Omit<HelpdeskTicket, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isLoading: true, error: null });
      try {
        await helpdeskService.create(data);
        // Refresh tickets after creation
        await get().fetchTicketsOptimized(undefined, true);
        toast.success('Ticket created successfully');
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create ticket',
          isLoading: false 
        });
        toast.error('Failed to create ticket');
        throw error;
      }
    },

    updateTicket: async (id: string, data: Partial<HelpdeskTicket>) => {
      set({ isLoading: true, error: null });
      try {
        await helpdeskService.update(id, data);
        // Update local state
        const currentTickets = get().tickets;
        const updatedTickets = currentTickets.map(t => 
          (t.id === id || t._id === id) ? { ...t, ...data } : t
        );
        const selectors = createTicketSelectors(updatedTickets);
        const searchFilters = createSearchFilters(updatedTickets);
        
        set({ 
          tickets: updatedTickets,
          cachedSelectors: selectors,
          cachedSearch: searchFilters,
          isLoading: false 
        });
        toast.success('Ticket updated successfully');
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update ticket',
          isLoading: false 
        });
        toast.error('Failed to update ticket');
        throw error;
      }
    },

    deleteTicket: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await helpdeskService.delete(id);
        // Remove from local state
        const currentTickets = get().tickets;
        const filteredTickets = currentTickets.filter(t => t.id !== id && t._id !== id);
        const selectors = createTicketSelectors(filteredTickets);
        const searchFilters = createSearchFilters(filteredTickets);
        
        set({ 
          tickets: filteredTickets,
          cachedSelectors: selectors,
          cachedSearch: searchFilters,
          isLoading: false 
        });
        toast.success('Ticket deleted successfully');
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete ticket',
          isLoading: false 
        });
        toast.error('Failed to delete ticket');
        throw error;
      }
    },

    fetchTickets: async (userId?: string) => {
      return get().fetchTicketsOptimized(userId);
    },

    // Cache management
    clearCache: () => {
      ticketCache.clear();
      cacheTimestamps.clear();
      set({ cachedSelectors: null, cachedSearch: null, lastFetchTime: 0 });
    },

    invalidateUserCache: (userId: string) => {
      ticketCache.delete(userId);
      cacheTimestamps.delete(userId);
    },

    // Enhanced fetch with caching
    fetchTicketsOptimized: async (userId?: string, forceRefresh = false) => {
      const cacheKey = userId || 'all';
      const now = Date.now();
      const cachedData = ticketCache.get(cacheKey);
      const cacheTime = cacheTimestamps.get(cacheKey) || 0;

      // Return cached data if still fresh and not forcing refresh
      if (!forceRefresh && cachedData && (now - cacheTime) < CACHE_TTL) {
        const selectors = createTicketSelectors(cachedData);
        const searchFilters = createSearchFilters(cachedData);
        set({ 
          tickets: cachedData, 
          cachedSelectors: selectors,
          cachedSearch: searchFilters,
          lastFetchTime: cacheTime 
        });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const data = userId 
          ? await helpdeskService.getByUserId(userId) 
          : await helpdeskService.getAll();
        
        const tickets = data as HelpdeskTicket[];
        const selectors = createTicketSelectors(tickets);
        const searchFilters = createSearchFilters(tickets);
        
        // Update cache
        ticketCache.set(cacheKey, tickets);
        cacheTimestamps.set(cacheKey, now);
        
        set({ 
          tickets, 
          cachedSelectors: selectors,
          cachedSearch: searchFilters,
          lastFetchTime: now,
          isLoading: false 
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to fetch tickets',
          isLoading: false
        });
        toast.error('Failed to load tickets', {
          description: 'Please check your connection and try again'
        });
        throw error;
      }
    },

    getTicketSelectors: () => {
      const state = get();
      return state.cachedSelectors || createTicketSelectors(state.tickets);
    },

    getSearchFilters: () => {
      const state = get();
      return state.cachedSearch || createSearchFilters(state.tickets);
    },

    // Bulk operations
    bulkUpdateStatus: async (ticketIds: string[], status: TicketStatus) => {
      set({ isLoading: true, error: null });
      try {
        await Promise.all(
          ticketIds.map(id => helpdeskService.update(id, { status }))
        );
        
        // Invalidate cache and refetch
        get().clearCache();
        await get().fetchTicketsOptimized(undefined, true);
        
        toast.success(`Updated ${ticketIds.length} tickets`);
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update tickets',
          isLoading: false 
        });
        toast.error('Failed to update tickets');
        throw error;
      }
    },

    bulkAssignTickets: async (ticketIds: string[], assigneeId: string, assigneeName: string) => {
      set({ isLoading: true, error: null });
      try {
        await Promise.all(
          ticketIds.map(id => helpdeskService.update(id, { 
            assignedTo: assigneeId
          }))
        );
        
        // Invalidate cache and refetch
        get().clearCache();
        await get().fetchTicketsOptimized(undefined, true);
        
        toast.success(`Assigned ${ticketIds.length} tickets to ${assigneeName}`);
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to assign tickets',
          isLoading: false 
        });
        toast.error('Failed to assign tickets');
        throw error;
      }
    },

    // Analytics
    getAnalytics: (dateRange) => {
      const tickets = get().tickets;
      const filteredTickets = dateRange 
        ? tickets.filter(t => {
            const date = new Date(t.createdAt);
            return date >= dateRange.start && date <= dateRange.end;
          })
        : tickets;

      // Calculate average resolution time
      const resolvedTickets = filteredTickets.filter(t => 
        (t.status === 'Resolved' || t.status === 'Closed') && t.updatedAt
      );
      const averageResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, ticket) => {
            const created = new Date(ticket.createdAt).getTime();
            const resolved = new Date(ticket.updatedAt || ticket.createdAt).getTime();
            return sum + (resolved - created);
          }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
        : 0;

      // Group by status
      const ticketsByStatus = filteredTickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group by priority
      const ticketsByPriority = filteredTickets.reduce((acc, ticket) => {
        acc[ticket.urgency] = (acc[ticket.urgency] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Generate trends data (last 30 days)
      const trendsData = [];
      const endDate = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const count = filteredTickets.filter(t => {
          const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
          return ticketDate === dateStr;
        }).length;
        
        trendsData.push({ date: dateStr, count });
      }

      return {
        totalTickets: filteredTickets.length,
        averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
        ticketsByStatus,
        ticketsByPriority,
        trendsData
      };
    }
  }))
);