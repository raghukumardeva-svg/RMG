import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ============================================
// Type Definitions
// ============================================

export interface ResourceUtilizationParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  role?: string;
  billable?: boolean;
}

export interface AllocationEfficiencyParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  department?: string;
}

export interface CostSummaryParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
  department?: string;
}

export interface SkillsGapParams {
  projectId?: string;
  futureMonths?: number;
}

export interface DemandForecastParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  role?: string;
}

// Resource Utilization Types
export interface ResourceUtilizationSummary {
  totalResources: number;
  utilizedResources: number;
  overallUtilization: number;
  billableUtilization: number;
  nonBillableUtilization: number;
  benchStrength: number;
}

export interface DepartmentBreakdown {
  department: string;
  totalResources: number;
  utilization: number;
  billableHours: number;
  nonBillableHours: number;
  benchCount: number;
}

export interface TrendDataPoint {
  date: string;
  utilization: number;
  billable: number;
  nonBillable: number;
}

export interface TopPerformer {
  employeeId: string;
  name: string;
  department: string;
  utilization: number;
  billablePercentage: number;
}

export interface BenchResource {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  utilization: number;
  skills: string[];
  availableSince: Date | null;
}

export interface ResourceUtilizationData {
  period: {
    start: string;
    end: string;
  };
  summary: ResourceUtilizationSummary;
  departmentBreakdown: DepartmentBreakdown[];
  trendData: TrendDataPoint[];
  topPerformers: TopPerformer[];
  benchResources: BenchResource[];
}

// Allocation Efficiency Types
export interface AllocationEfficiencySummary {
  totalResources: number;
  overAllocatedCount: number;
  underAllocatedCount: number;
  optimalCount: number;
  optimalRate: number;
  totalCapacity: number;
  totalAllocated: number;
  utilizationRate: number;
}

export interface OverAllocatedResource {
  employeeId: string;
  name: string;
  department: string;
  allocation: number;
  excess: number;
  projectCount: number;
}

export interface UnderAllocatedResource {
  employeeId: string;
  name: string;
  department: string;
  allocation: number;
  available: number;
  projectCount: number;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  resourceCount: number;
  totalAllocation: number;
  avgAllocation: number;
  status: string;
}

export interface AllocationEfficiencyData {
  period: {
    start: string;
    end: string;
  };
  summary: AllocationEfficiencySummary;
  overAllocated: OverAllocatedResource[];
  underAllocated: UnderAllocatedResource[];
  projectSummary: ProjectSummary[];
}

// Cost Summary Types
export interface CostSummaryData {
  period: {
    start: string;
    end: string;
    days: number;
    months: number;
  };
  summary: {
    totalResourceCost: number;
    billableResourceCost: number;
    nonBillableResourceCost: number;
    benchCost: number;
    totalBudget: number;
    budgetUtilization: number;
    costPerProject: number;
    resourceCount: number;
    benchCount: number;
  };
  departmentCosts: Array<{
    department: string;
    resourceCount: number;
    totalCost: number;
    billableCost: number;
    nonBillableCost: number;
    benchCost: number;
    benchCount: number;
    avgCostPerResource: number;
  }>;
  projectCosts: Array<{
    projectId: string;
    projectName: string;
    budget: number;
    actualCost: number;
    resourceCount: number;
    variance: number;
    variancePercent: number;
    roi: number;
  }>;
  topCostEmployees: Array<{
    employeeId: string;
    name: string;
    department: string;
    monthlySalary: number;
    periodCost: number;
    billableCost: number;
    utilization: number;
    isBench: boolean;
  }>;
  trends: {
    currentMonth: number;
    previousMonth: number;
    change: number;
    changePercent: number;
  };
}

// Skills Gap Types
export interface SkillGap {
  skill: string;
  required: number;
  available: number;
  gap: number;
  status: 'shortage' | 'sufficient';
  employees: Array<{
    employeeId: string;
    name: string;
    department: string;
  }>;
}

export interface HiringRecommendation {
  skill: string;
  requiredCount: number;
  priority: 'high' | 'medium' | 'low';
  suggestedRole: string;
}

export interface TrainingNeed {
  skill: string;
  currentEmployees: number;
  additionalNeeded: number;
}

export interface SkillsGapData {
  period: {
    futureMonths: number;
    upcomingProjectsCount: number;
  };
  summary: {
    totalSkillsRequired: number;
    totalSkillsAvailable: number;
    criticalGaps: number;
    moderateGaps: number;
  };
  skillsGap: SkillGap[];
  hiringRecommendations: HiringRecommendation[];
  trainingNeeds: TrainingNeed[];
}

// Demand Forecast Types
export interface RoleDemand {
  role: string;
  demand: number;
  available: number;
  gap: number;
}

export interface UpcomingProject {
  projectId: string;
  projectName: string;
  startDate: Date;
  estimatedTeamSize: number;
  requiredSkills: string[];
  status: string;
}

export interface HiringTimeline {
  role: string;
  hiresNeeded: number;
  urgency: 'immediate' | 'within-month' | 'within-quarter';
  suggestedStartDate: Date;
}

export interface DemandForecastData {
  period: {
    start: string;
    end: string;
  };
  summary: {
    upcomingProjectsCount: number;
    totalDemand: number;
    availableResources: number;
    totalGap: number;
    utilizationRate: number;
  };
  demandByRole: RoleDemand[];
  upcomingProjects: UpcomingProject[];
  hiringTimeline: HiringTimeline[];
}

// ============================================
// RMG Analytics Service Class
// ============================================

class RMGAnalyticsService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get resource utilization metrics
   */
  async getResourceUtilization(
    params: ResourceUtilizationParams = {}
  ): Promise<ResourceUtilizationData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/resource-utilization`,
        {
          params,
          headers: this.getAuthHeader()
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching resource utilization:', error);
      throw error;
    }
  }

  /**
   * Get allocation efficiency metrics
   */
  async getAllocationEfficiency(
    params: AllocationEfficiencyParams = {}
  ): Promise<AllocationEfficiencyData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/allocation-efficiency`,
        {
          params,
          headers: this.getAuthHeader()
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching allocation efficiency:', error);
      throw error;
    }
  }

  /**
   * Get cost summary (placeholder - requires configuration)
   */
  async getCostSummary(
    params: CostSummaryParams = {}
  ): Promise<CostSummaryData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/cost-summary`,
        {
          params,
          headers: this.getAuthHeader()
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching cost summary:', error);
      throw error;
    }
  }

  /**
   * Get skills gap analysis
   */
  async getSkillsGap(
    params: SkillsGapParams = {}
  ): Promise<SkillsGapData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/skills-gap`,
        {
          params,
          headers: this.getAuthHeader()
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching skills gap:', error);
      throw error;
    }
  }

  /**
   * Get demand forecast
   */
  async getDemandForecast(
    params: DemandForecastParams = {}
  ): Promise<DemandForecastData> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/demand-forecast`,
        {
          params,
          headers: this.getAuthHeader()
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
      throw error;
    }
  }

  /**
   * Export report (placeholder for future implementation)
   */
  async exportReport(
    reportType: 'utilization' | 'efficiency' | 'skills' | 'forecast',
    format: 'csv' | 'xlsx' | 'pdf',
    params: Record<string, string | number> = {}
  ): Promise<Blob> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/rmg-analytics/export`,
        {
          params: { reportType, format, ...params },
          headers: this.getAuthHeader(),
          responseType: 'blob'
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const rmgAnalyticsService = new RMGAnalyticsService();
