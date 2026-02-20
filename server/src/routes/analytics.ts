import express from 'express';
import { Request, Response } from 'express';
import HelpdeskTicket from '../models/HelpdeskTicket';

const router = express.Router();

// Type definitions
interface TicketDocument {
  createdAt: Date | string;
  closedAt?: Date | string | null;
  status: string;
  subCategory?: string;
  urgency?: string;
  assignment?: {
    assignedAt?: Date | string;
    assignedTo?: string;
    assignedToId?: string;
  };
  reopenCount?: number;
}

interface AgentPerformanceData {
  name: string;
  ticketsHandled: number;
  ticketsResolved: number;
  totalResolutionTime: number;
  resolutionCount: number;
}

// GET /api/analytics/weekly-pattern - Get weekly pattern analytics
router.get('/weekly-pattern', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      category,
      priority,
      assignee
    } = req.query;

    // Default to last 7 days if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build filter query
    const filter: Record<string, unknown> = {
      createdAt: {
        $gte: start,
        $lte: end
      }
    };

    if (category) {
      filter.subCategory = category;
    }

    if (priority) {
      filter.urgency = priority;
    }

    if (assignee) {
      filter['assignment.assignedToId'] = assignee;
    }

    // Fetch tickets matching the filter
    const tickets = await HelpdeskTicket.find(filter).lean();

    // Calculate daily statistics (Mon-Sun)
    const dailyStats = {
      Monday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Tuesday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Wednesday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Thursday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Friday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Saturday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Sunday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 }
    };

    // Calculate hourly statistics (0-23)
    const hourlyStats: { [hour: number]: { [day: string]: number } } = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = {
        Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0
      };
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    tickets.forEach(ticket => {
      const createdDate = new Date(ticket.createdAt);
      const dayName = dayNames[createdDate.getDay()];
      const hour = createdDate.getHours();

      // Count created tickets
      dailyStats[dayName as keyof typeof dailyStats].created++;
      
      // Count hourly distribution
      hourlyStats[hour][dayName]++;

      // Count resolved tickets
      if (['Closed', 'Completed', 'Confirmed', 'Auto-Closed'].includes(ticket.status)) {
        dailyStats[dayName as keyof typeof dailyStats].resolved++;

        // Calculate resolution time (in hours)
        if (ticket.closedAt) {
          const closedDate = new Date(ticket.closedAt);
          const resolutionTime = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          dailyStats[dayName as keyof typeof dailyStats].totalResolutionTime += resolutionTime;
          dailyStats[dayName as keyof typeof dailyStats].resolutionCount++;
        }
      }

      // Calculate response time (time to first assignment)
      if (ticket.assignment?.assignedAt) {
        const assignedDate = new Date(ticket.assignment.assignedAt);
        const responseTime = (assignedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        dailyStats[dayName as keyof typeof dailyStats].totalResponseTime += responseTime;
        dailyStats[dayName as keyof typeof dailyStats].responseCount++;
      }
    });

    // Calculate averages and format response
    const dailyPattern = Object.keys(dailyStats).map(day => ({
      day,
      created: dailyStats[day as keyof typeof dailyStats].created,
      resolved: dailyStats[day as keyof typeof dailyStats].resolved,
      avgResponseTime: dailyStats[day as keyof typeof dailyStats].responseCount > 0
        ? dailyStats[day as keyof typeof dailyStats].totalResponseTime / dailyStats[day as keyof typeof dailyStats].responseCount
        : 0,
      avgResolutionTime: dailyStats[day as keyof typeof dailyStats].resolutionCount > 0
        ? dailyStats[day as keyof typeof dailyStats].totalResolutionTime / dailyStats[day as keyof typeof dailyStats].resolutionCount
        : 0
    }));

    // Find busiest day
    const busiestDay = dailyPattern.reduce((max, current) =>
      current.created > max.created ? current : max
    );

    // Find slowest day (highest avg resolution time)
    const slowestDay = dailyPattern.reduce((max, current) =>
      current.avgResolutionTime > max.avgResolutionTime ? current : max
    );

    // Find peak hour (across all days)
    let peakHour = 0;
    let maxTickets = 0;
    Object.keys(hourlyStats).forEach(hourStr => {
      const hour = parseInt(hourStr);
      const totalForHour = Object.values(hourlyStats[hour]).reduce((sum, count) => sum + count, 0);
      if (totalForHour > maxTickets) {
        maxTickets = totalForHour;
        peakHour = hour;
      }
    });

    // Calculate overall metrics
    const totalCreated = tickets.length;
    const totalResolved = tickets.filter(t =>
      ['Closed', 'Completed', 'Confirmed', 'Auto-Closed'].includes(t.status)
    ).length;

    const allResponseTimes = tickets
      .filter(t => t.assignment?.assignedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const assigned = new Date(t.assignment!.assignedAt!).getTime();
        return (assigned - created) / (1000 * 60 * 60);
      });

    const allResolutionTimes = tickets
      .filter(t => t.closedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const closed = new Date(t.closedAt!).getTime();
        return (closed - created) / (1000 * 60 * 60);
      });

    const avgResponseTime = allResponseTimes.length > 0
      ? allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length
      : 0;

    const avgResolutionTime = allResolutionTimes.length > 0
      ? allResolutionTimes.reduce((sum, time) => sum + time, 0) / allResolutionTimes.length
      : 0;

    // Fetch previous week data for comparison
    const weekDuration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - weekDuration);
    const prevEnd = new Date(start.getTime() - 1); // Day before current week starts

    const prevFilter = { ...filter };
    prevFilter.createdAt = {
      $gte: prevStart,
      $lte: prevEnd
    };

    const prevWeekTickets = await HelpdeskTicket.find(prevFilter).lean();

    // Calculate previous week metrics
    const prevTotalCreated = prevWeekTickets.length;
    const prevTotalResolved = prevWeekTickets.filter(t =>
      ['Closed', 'Completed', 'Confirmed', 'Auto-Closed'].includes(t.status)
    ).length;

    const prevResponseTimes = prevWeekTickets
      .filter(t => t.assignment?.assignedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const assigned = new Date(t.assignment!.assignedAt!).getTime();
        return (assigned - created) / (1000 * 60 * 60);
      });

    const prevResolutionTimes = prevWeekTickets
      .filter(t => t.closedAt)
      .map(t => {
        const created = new Date(t.createdAt).getTime();
        const closed = new Date(t.closedAt!).getTime();
        return (closed - created) / (1000 * 60 * 60);
      });

    const prevAvgResponseTime = prevResponseTimes.length > 0
      ? prevResponseTimes.reduce((sum, time) => sum + time, 0) / prevResponseTimes.length
      : 0;

    const prevAvgResolutionTime = prevResolutionTimes.length > 0
      ? prevResolutionTimes.reduce((sum, time) => sum + time, 0) / prevResolutionTimes.length
      : 0;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.json({
      success: true,
      data: {
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        summary: {
          totalCreated,
          totalResolved,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
          busiestDay: busiestDay.day,
          slowestDay: slowestDay.day,
          peakHour: `${peakHour}:00`,
          peakHourTickets: maxTickets
        },
        dailyPattern,
        hourlyPattern: hourlyStats,
        previousWeek: {
          totalCreated: prevTotalCreated,
          totalResolved: prevTotalResolved,
          avgResponseTime: Math.round(prevAvgResponseTime * 10) / 10,
          avgResolutionTime: Math.round(prevAvgResolutionTime * 10) / 10
        },
        comparison: {
          ticketsCreated: {
            current: totalCreated,
            previous: prevTotalCreated,
            change: calculateChange(totalCreated, prevTotalCreated)
          },
          ticketsResolved: {
            current: totalResolved,
            previous: prevTotalResolved,
            change: calculateChange(totalResolved, prevTotalResolved)
          },
          avgResponseTime: {
            current: Math.round(avgResponseTime * 10) / 10,
            previous: Math.round(prevAvgResponseTime * 10) / 10,
            change: calculateChange(avgResponseTime, prevAvgResponseTime)
          },
          avgResolutionTime: {
            current: Math.round(avgResolutionTime * 10) / 10,
            previous: Math.round(prevAvgResolutionTime * 10) / 10,
            change: calculateChange(avgResolutionTime, prevAvgResolutionTime)
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching weekly pattern analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly pattern analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/weekly-pattern/export - Export weekly pattern as CSV
router.get('/weekly-pattern/export', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      category,
      priority,
      assignee
    } = req.query;

    // Default to last 7 days if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Build filter query
    const filter: Record<string, unknown> = {
      createdAt: {
        $gte: start,
        $lte: end
      }
    };

    if (category) {
      filter.subCategory = category;
    }

    if (priority) {
      filter.urgency = priority;
    }

    if (assignee) {
      filter['assignment.assignedToId'] = assignee;
    }

    // Fetch tickets matching the filter
    const tickets = await HelpdeskTicket.find(filter).lean();

    // Calculate daily statistics
    const dailyStats = {
      Monday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Tuesday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Wednesday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Thursday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Friday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Saturday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 },
      Sunday: { created: 0, resolved: 0, totalResponseTime: 0, totalResolutionTime: 0, responseCount: 0, resolutionCount: 0 }
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    tickets.forEach(ticket => {
      const createdDate = new Date(ticket.createdAt);
      const dayName = dayNames[createdDate.getDay()];

      dailyStats[dayName as keyof typeof dailyStats].created++;

      if (['Closed', 'Completed', 'Confirmed', 'Auto-Closed'].includes(ticket.status)) {
        dailyStats[dayName as keyof typeof dailyStats].resolved++;

        if (ticket.closedAt) {
          const closedDate = new Date(ticket.closedAt);
          const resolutionTime = (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
          dailyStats[dayName as keyof typeof dailyStats].totalResolutionTime += resolutionTime;
          dailyStats[dayName as keyof typeof dailyStats].resolutionCount++;
        }
      }

      if (ticket.assignment?.assignedAt) {
        const assignedDate = new Date(ticket.assignment.assignedAt);
        const responseTime = (assignedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
        dailyStats[dayName as keyof typeof dailyStats].totalResponseTime += responseTime;
        dailyStats[dayName as keyof typeof dailyStats].responseCount++;
      }
    });

    // Generate CSV content
    const csvRows = [];
    
    // Header
    csvRows.push('Weekly Pattern Analytics Report');
    csvRows.push(`Date Range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`);
    csvRows.push('');
    
    // Summary section
    csvRows.push('Summary');
    csvRows.push(`Total Tickets Created,${tickets.length}`);
    csvRows.push(`Total Tickets Resolved,${tickets.filter(t => ['Closed', 'Completed', 'Confirmed', 'Auto-Closed'].includes(t.status)).length}`);
    csvRows.push('');
    
    // Daily breakdown
    csvRows.push('Daily Breakdown');
    csvRows.push('Day,Created,Resolved,Avg Response Time (hrs),Avg Resolution Time (hrs)');
    
    Object.keys(dailyStats).forEach(day => {
      const stats = dailyStats[day as keyof typeof dailyStats];
      const avgResponseTime = stats.responseCount > 0 
        ? (stats.totalResponseTime / stats.responseCount).toFixed(2) 
        : '0.00';
      const avgResolutionTime = stats.resolutionCount > 0 
        ? (stats.totalResolutionTime / stats.resolutionCount).toFixed(2) 
        : '0.00';
      
      csvRows.push(`${day},${stats.created},${stats.resolved},${avgResponseTime},${avgResolutionTime}`);
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=weekly-analytics-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`);
    
    // Send CSV content
    res.send(csvRows.join('\n'));

  } catch (error) {
    console.error('Error exporting weekly pattern analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export weekly pattern analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/monthly-statistics - Get monthly statistics
router.get('/monthly-statistics', async (req: Request, res: Response) => {
  try {
    const {
      year,
      month,
      category,
      priority,
      assignee
    } = req.query;

    // Default to current month if not provided
    const currentDate = new Date();
    const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1; // 1-12

    // Calculate date ranges
    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
    
    // Previous month for comparison
    const startOfPrevMonth = new Date(targetYear, targetMonth - 2, 1);
    const endOfPrevMonth = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59, 999);

    // Same month last year for YoY comparison
    const startOfLastYearMonth = new Date(targetYear - 1, targetMonth - 1, 1);
    const endOfLastYearMonth = new Date(targetYear - 1, targetMonth, 0, 23, 59, 59, 999);

    // Build filter query
    const buildFilter = (startDate: Date, endDate: Date) => {
      const filter: Record<string, unknown> = {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      };

      if (category) filter.subCategory = category;
      if (priority) filter.urgency = priority;
      if (assignee) filter['assignment.assignedToId'] = assignee;

      return filter;
    };

    // Fetch tickets for current month
    const currentMonthTickets = await HelpdeskTicket.find(buildFilter(startOfMonth, endOfMonth)).lean() as unknown as TicketDocument[];
    
    // Fetch tickets for previous month
    const prevMonthTickets = await HelpdeskTicket.find(buildFilter(startOfPrevMonth, endOfPrevMonth)).lean() as unknown as TicketDocument[];
    
    // Fetch tickets for same month last year
    const lastYearTickets = await HelpdeskTicket.find(buildFilter(startOfLastYearMonth, endOfLastYearMonth)).lean() as unknown as TicketDocument[];

    // Calculate statistics for current month
    const calculateStats = (tickets: TicketDocument[]) => {
      const totalCreated = tickets.length;
      const resolved = tickets.filter(t => t.status === 'Closed');
      const totalResolved = resolved.length;
      const openTickets = totalCreated - totalResolved;
      const resolutionRate = totalCreated > 0 ? ((totalResolved / totalCreated) * 100) : 0;

      // Calculate average times
      let totalResponseTime = 0;
      let responseCount = 0;
      let totalResolutionTime = 0;
      let resolutionCount = 0;

      tickets.forEach(ticket => {
        // Response time: creation to first assignment
        if (ticket.assignment?.assignedAt) {
          const responseTime = new Date(ticket.assignment.assignedAt).getTime() - new Date(ticket.createdAt).getTime();
          totalResponseTime += responseTime / (1000 * 60 * 60); // Convert to hours
          responseCount++;
        }

        // Resolution time: creation to closure
        if (ticket.status === 'Closed' && ticket.closedAt) {
          const resolutionTime = new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime();
          totalResolutionTime += resolutionTime / (1000 * 60 * 60); // Convert to hours
          resolutionCount++;
        }
      });

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0;

      // Reopened tickets
      const reopenedTickets = tickets.filter(t => t.reopenCount && t.reopenCount > 0).length;

      return {
        totalCreated,
        totalResolved,
        openTickets,
        resolutionRate,
        avgResponseTime,
        avgResolutionTime,
        reopenedTickets
      };
    };

    const currentStats = calculateStats(currentMonthTickets);
    const prevStats = calculateStats(prevMonthTickets);
    const lastYearStats = calculateStats(lastYearTickets);

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    currentMonthTickets.forEach(ticket => {
      const cat = ticket.subCategory || 'Uncategorized';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // Priority distribution
    const priorityDistribution: Record<string, number> = {};
    currentMonthTickets.forEach(ticket => {
      const pri = ticket.urgency || 'None';
      priorityDistribution[pri] = (priorityDistribution[pri] || 0) + 1;
    });

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    currentMonthTickets.forEach(ticket => {
      const status = ticket.status || 'Unknown';
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
    });

    // Agent performance metrics
    const agentPerformance: Record<string, AgentPerformanceData> = {};
    currentMonthTickets.forEach(ticket => {
      if (ticket.assignment?.assignedTo) {
        const agentName = ticket.assignment.assignedTo;
        if (!agentPerformance[agentName]) {
          agentPerformance[agentName] = {
            name: agentName,
            ticketsHandled: 0,
            ticketsResolved: 0,
            totalResolutionTime: 0,
            resolutionCount: 0
          };
        }

        agentPerformance[agentName].ticketsHandled++;

        if (ticket.status === 'Closed') {
          agentPerformance[agentName].ticketsResolved++;

          if (ticket.closedAt) {
            const resolutionTime = new Date(ticket.closedAt).getTime() - new Date(ticket.createdAt).getTime();
            agentPerformance[agentName].totalResolutionTime += resolutionTime / (1000 * 60 * 60);
            agentPerformance[agentName].resolutionCount++;
          }
        }
      }
    });

    // Calculate average resolution time per agent
    const agentMetrics = Object.values(agentPerformance).map((agent: AgentPerformanceData) => ({
      name: agent.name,
      ticketsHandled: agent.ticketsHandled,
      ticketsResolved: agent.ticketsResolved,
      avgResolutionTime: agent.resolutionCount > 0 ? agent.totalResolutionTime / agent.resolutionCount : 0,
      resolutionRate: agent.ticketsHandled > 0 ? (agent.ticketsResolved / agent.ticketsHandled) * 100 : 0
    })).sort((a, b) => b.ticketsResolved - a.ticketsResolved);

    // Daily trend for the month
    const dailyTrend: Record<string, { created: number; resolved: number }> = {};
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyTrend[dateStr] = { created: 0, resolved: 0 };
    }

    currentMonthTickets.forEach(ticket => {
      const date = new Date(ticket.createdAt).toISOString().split('T')[0];
      if (dailyTrend[date]) {
        dailyTrend[date].created++;
      }
    });

    currentMonthTickets.forEach(ticket => {
      if (ticket.status === 'Closed' && ticket.closedAt) {
        const date = new Date(ticket.closedAt).toISOString().split('T')[0];
        if (dailyTrend[date]) {
          dailyTrend[date].resolved++;
        }
      }
    });

    // Calculate comparisons
    const monthOverMonth = {
      ticketsCreated: {
        current: currentStats.totalCreated,
        previous: prevStats.totalCreated,
        change: prevStats.totalCreated > 0 ? ((currentStats.totalCreated - prevStats.totalCreated) / prevStats.totalCreated * 100) : 0
      },
      ticketsResolved: {
        current: currentStats.totalResolved,
        previous: prevStats.totalResolved,
        change: prevStats.totalResolved > 0 ? ((currentStats.totalResolved - prevStats.totalResolved) / prevStats.totalResolved * 100) : 0
      },
      avgResolutionTime: {
        current: currentStats.avgResolutionTime,
        previous: prevStats.avgResolutionTime,
        change: prevStats.avgResolutionTime > 0 ? ((currentStats.avgResolutionTime - prevStats.avgResolutionTime) / prevStats.avgResolutionTime * 100) : 0
      },
      resolutionRate: {
        current: currentStats.resolutionRate,
        previous: prevStats.resolutionRate,
        change: prevStats.resolutionRate > 0 ? ((currentStats.resolutionRate - prevStats.resolutionRate) / prevStats.resolutionRate * 100) : 0
      }
    };

    const yearOverYear = {
      ticketsCreated: {
        current: currentStats.totalCreated,
        lastYear: lastYearStats.totalCreated,
        change: lastYearStats.totalCreated > 0 ? ((currentStats.totalCreated - lastYearStats.totalCreated) / lastYearStats.totalCreated * 100) : 0
      },
      ticketsResolved: {
        current: currentStats.totalResolved,
        lastYear: lastYearStats.totalResolved,
        change: lastYearStats.totalResolved > 0 ? ((currentStats.totalResolved - lastYearStats.totalResolved) / lastYearStats.totalResolved * 100) : 0
      }
    };

    res.json({
      success: true,
      data: {
        period: {
          year: targetYear,
          month: targetMonth,
          monthName: new Date(targetYear, targetMonth - 1).toLocaleString('en-US', { month: 'long' }),
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString()
        },
        currentMonth: currentStats,
        categoryDistribution: Object.entries(categoryDistribution).map(([name, count]) => ({ name, count })),
        priorityDistribution: Object.entries(priorityDistribution).map(([name, count]) => ({ name, count })),
        statusDistribution: Object.entries(statusDistribution).map(([name, count]) => ({ name, count })),
        agentPerformance: agentMetrics,
        dailyTrend: Object.entries(dailyTrend).map(([date, data]) => ({ date, ...data })),
        monthOverMonth,
        yearOverYear
      }
    });
  } catch (error) {
    console.error('Error fetching monthly statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
