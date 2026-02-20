import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export interface WeeklyPatternSummary {
  totalCreated: number;
  totalResolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  busiestDay: string;
  slowestDay: string;
  peakHour: string;
  peakHourTickets: number;
}

export interface DailyPattern {
  day: string;
  created: number;
  resolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export interface HourlyPattern {
  [hour: number]: {
    [day: string]: number;
  };
}

export interface WeeklyComparison {
  ticketsCreated: {
    current: number;
    previous: number;
    change: number;
  };
  ticketsResolved: {
    current: number;
    previous: number;
    change: number;
  };
  avgResponseTime: {
    current: number;
    previous: number;
    change: number;
  };
  avgResolutionTime: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface PreviousWeekStats {
  totalCreated: number;
  totalResolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}

export interface WeeklyPatternData {
  dateRange: {
    start: string;
    end: string;
  };
  summary: WeeklyPatternSummary;
  dailyPattern: DailyPattern[];
  hourlyPattern: HourlyPattern;
  previousWeek?: PreviousWeekStats;
  comparison?: WeeklyComparison;
}

export interface WeeklyPatternParams {
  startDate?: string;
  endDate?: string;
  category?: string;
  priority?: string;
  assignee?: string;
}

export interface MonthlyStats {
  totalCreated: number;
  totalResolved: number;
  openTickets: number;
  resolutionRate: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  reopenedTickets: number;
}

export interface CategoryDistribution {
  name: string;
  count: number;
}

export interface PriorityDistribution {
  name: string;
  count: number;
}

export interface StatusDistribution {
  name: string;
  count: number;
}

export interface AgentPerformance {
  name: string;
  ticketsHandled: number;
  ticketsResolved: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

export interface DailyTrend {
  date: string;
  created: number;
  resolved: number;
}

export interface Comparison {
  ticketsCreated: {
    current: number;
    previous: number;
    change: number;
  };
  ticketsResolved: {
    current: number;
    previous: number;
    change: number;
  };
  avgResolutionTime: {
    current: number;
    previous: number;
    change: number;
  };
  resolutionRate: {
    current: number;
    previous: number;
    change: number;
  };
}

export interface YearOverYear {
  ticketsCreated: {
    current: number;
    lastYear: number;
    change: number;
  };
  ticketsResolved: {
    current: number;
    lastYear: number;
    change: number;
  };
}

export interface MonthlyStatisticsData {
  period: {
    year: number;
    month: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  currentMonth: MonthlyStats;
  categoryDistribution: CategoryDistribution[];
  priorityDistribution: PriorityDistribution[];
  statusDistribution: StatusDistribution[];
  agentPerformance: AgentPerformance[];
  dailyTrend: DailyTrend[];
  monthOverMonth: Comparison;
  yearOverYear: YearOverYear;
}

export interface MonthlyStatisticsParams {
  year?: number;
  month?: number;
  category?: string;
  priority?: string;
  assignee?: string;
}

class AnalyticsService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async getWeeklyPattern(params?: WeeklyPatternParams): Promise<WeeklyPatternData> {
    const response = await axios.get(`${API_BASE_URL}/analytics/weekly-pattern`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }

  async exportWeeklyPattern(params?: WeeklyPatternParams): Promise<Blob> {
    const response = await axios.get(`${API_BASE_URL}/analytics/weekly-pattern/export`, {
      params,
      headers: this.getAuthHeader(),
      responseType: 'blob'
    });
    return response.data;
  }

  async getMonthlyStatistics(params?: MonthlyStatisticsParams): Promise<MonthlyStatisticsData> {
    const response = await axios.get(`${API_BASE_URL}/analytics/monthly-statistics`, {
      params,
      headers: this.getAuthHeader()
    });
    return response.data.data;
  }
}

export const analyticsService = new AnalyticsService();
