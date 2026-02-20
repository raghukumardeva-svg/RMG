import express from 'express';
import { Request, Response } from 'express';
import Allocation from '../models/Allocation';
import Employee from '../models/Employee';
import Project from '../models/Project';

const router = express.Router();

// Type definitions
interface ResourceUtilizationSummary {
  totalResources: number;
  utilizedResources: number;
  overallUtilization: number;
  billableUtilization: number;
  nonBillableUtilization: number;
  benchStrength: number;
}

interface DepartmentBreakdown {
  department: string;
  totalResources: number;
  utilization: number;
  billableHours: number;
  nonBillableHours: number;
  benchCount: number;
}

interface TrendDataPoint {
  date: string;
  utilization: number;
  billable: number;
  nonBillable: number;
}

interface TopPerformer {
  employeeId: string;
  name: string;
  department: string;
  utilization: number;
  billablePercentage: number;
}

interface BenchResource {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  utilization: number;
  skills: string[];
  availableSince: Date | null;
}

interface UserAllocation {
  employeeId: string;
  totalAllocation: number;
  billableAllocation: number;
  nonBillableAllocation: number;
}

interface EmployeeAllocation {
  employee: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  totalAllocation: number;
  allocations: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * GET /api/rmg-analytics/resource-utilization
 * Get resource utilization metrics and analytics
 * 
 * @access Private (RMG, SUPER_ADMIN)
 * @queryparam {string} startDate - Start date (YYYY-MM-DD)
 * @queryparam {string} endDate - End date (YYYY-MM-DD)
 * @queryparam {string} [department] - Filter by department
 * @queryparam {string} [role] - Filter by role/designation
 * @queryparam {boolean} [billable] - Filter by billable status
 */
router.get('/resource-utilization', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      department,
      role,
      billable
    } = req.query;

    // Default to current month if no date range provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getFullYear(), end.getMonth(), 1);

    // Build employee filter
    const employeeFilter: Record<string, unknown> = {
      status: 'active',
      isActive: true
    };

    if (department) {
      employeeFilter.department = department;
    }

    if (role) {
      employeeFilter.designation = role;
    }

    // Fetch all active employees matching filter
    const employees = await Employee.find(employeeFilter).lean();

    // Build allocation filter
    const allocationFilter: Record<string, unknown> = {
      status: 'active',
      $or: [
        {
          startDate: { $lte: end },
          $or: [
            { endDate: { $gte: start } },
            { endDate: null }
          ]
        }
      ]
    };

    if (billable !== undefined) {
      allocationFilter.billable = billable === 'true';
    }

    // Fetch allocations for the period
    const allocations = await Allocation.find(allocationFilter).lean();

    // Calculate utilization for each employee
    const employeeUtilization = new Map();
    const departmentMap = new Map();

    employees.forEach(emp => {
      const empAllocations = allocations.filter(a => a.employeeId === emp.employeeId);
      const totalAllocation = empAllocations.reduce((sum, a) => sum + a.allocation, 0);
      const billableAllocation = empAllocations
        .filter(a => a.billable)
        .reduce((sum, a) => sum + a.allocation, 0);
      const nonBillableAllocation = empAllocations
        .filter(a => !a.billable)
        .reduce((sum, a) => sum + a.allocation, 0);

      employeeUtilization.set(emp.employeeId, {
        employee: emp,
        totalAllocation: Math.min(totalAllocation, 100),
        billableAllocation,
        nonBillableAllocation,
        allocationCount: empAllocations.length
      });

      // Track department stats
      const dept = emp.department;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, {
          totalEmployees: 0,
          totalUtilization: 0,
          billableHours: 0,
          nonBillableHours: 0,
          benchCount: 0
        });
      }

      const deptStats = departmentMap.get(dept);
      deptStats.totalEmployees++;
      deptStats.totalUtilization += totalAllocation;
      deptStats.billableHours += billableAllocation;
      deptStats.nonBillableHours += nonBillableAllocation;
      
      // Bench: < 50% allocated
      if (totalAllocation < 50) {
        deptStats.benchCount++;
      }
    });

    // Calculate summary metrics
    const totalResources = employees.length;
    const utilizedResources = Array.from(employeeUtilization.values())
      .filter((u: UserAllocation) => u.totalAllocation >= 50).length;
    
    const totalUtilizationSum = Array.from(employeeUtilization.values())
      .reduce((sum: number, u: UserAllocation) => sum + u.totalAllocation, 0);
    
    const overallUtilization = totalResources > 0 
      ? Math.round((totalUtilizationSum / (totalResources * 100)) * 100 * 100) / 100
      : 0;

    const totalBillableSum = Array.from(employeeUtilization.values())
      .reduce((sum: number, u: UserAllocation) => sum + u.billableAllocation, 0);
    
    const billableUtilization = totalResources > 0 
      ? Math.round((totalBillableSum / (totalResources * 100)) * 100 * 100) / 100
      : 0;

    const totalNonBillableSum = Array.from(employeeUtilization.values())
      .reduce((sum: number, u: UserAllocation) => sum + u.nonBillableAllocation, 0);
    
    const nonBillableUtilization = totalResources > 0 
      ? Math.round((totalNonBillableSum / (totalResources * 100)) * 100 * 100) / 100
      : 0;

    const benchStrength = Array.from(employeeUtilization.values())
      .filter((u: UserAllocation) => u.totalAllocation < 50).length;
    const summary: ResourceUtilizationSummary = {
      totalResources,
      utilizedResources,
      overallUtilization,
      billableUtilization,
      nonBillableUtilization,
      benchStrength
    };

    // Department breakdown
    const departmentBreakdown: DepartmentBreakdown[] = Array.from(departmentMap.entries())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(([dept, stats]: [string, any]) => ({
        department: dept,
        totalResources: stats.totalEmployees,
        utilization: stats.totalEmployees > 0
          ? Math.round((stats.totalUtilization / (stats.totalEmployees * 100)) * 100 * 100) / 100
          : 0,
        billableHours: Math.round(stats.billableHours * 100) / 100,
        nonBillableHours: Math.round(stats.nonBillableHours * 100) / 100,
        benchCount: stats.benchCount
      }))
      .sort((a, b) => b.utilization - a.utilization);

    // Generate trend data (daily aggregation)
    const trendData: TrendDataPoint[] = [];
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      trendData.push({
        date: currentDate.toISOString().split('T')[0],
        utilization: overallUtilization,
        billable: billableUtilization,
        nonBillable: nonBillableUtilization
      });
    }

    // Top performers (highly utilized resources)
    const topPerformers: TopPerformer[] = Array.from(employeeUtilization.values())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((u: any) => u.totalAllocation >= 50)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => b.totalAllocation - a.totalAllocation)
      .slice(0, 10)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((u: any) => ({
        employeeId: u.employee.employeeId,
        name: u.employee.name,
        department: u.employee.department,
        utilization: Math.round(u.totalAllocation * 100) / 100,
        billablePercentage: u.totalAllocation > 0
          ? Math.round((u.billableAllocation / u.totalAllocation) * 100 * 100) / 100
          : 0
      }));

    // Bench resources (under-utilized)
    const benchResources: BenchResource[] = Array.from(employeeUtilization.values())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((u: any) => u.totalAllocation < 50)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.totalAllocation - b.totalAllocation)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((u: any) => ({
        employeeId: u.employee.employeeId,
        name: u.employee.name,
        department: u.employee.department,
        designation: u.employee.designation,
        utilization: Math.round(u.totalAllocation * 100) / 100,
        skills: u.employee.skills || [],
        availableSince: u.allocationCount === 0 ? u.employee.dateOfJoining : null
      }));

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        summary,
        departmentBreakdown,
        trendData,
        topPerformers,
        benchResources
      }
    });

  } catch (error) {
    console.error('Error fetching resource utilization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource utilization data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rmg-analytics/allocation-efficiency
 * Get allocation efficiency metrics
 * 
 * @access Private (RMG, SUPER_ADMIN)
 * @queryparam {string} startDate - Start date (YYYY-MM-DD)
 * @queryparam {string} endDate - End date (YYYY-MM-DD)
 * @queryparam {string} [projectId] - Filter by project
 * @queryparam {string} [department] - Filter by department
 */
router.get('/allocation-efficiency', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId, department } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getFullYear(), end.getMonth(), 1);

    // Build filters
    const allocationFilter: Record<string, unknown> = {
      status: 'active',
      $or: [
        {
          startDate: { $lte: end },
          $or: [
            { endDate: { $gte: start } },
            { endDate: null }
          ]
        }
      ]
    };

    if (projectId) {
      allocationFilter.projectId = projectId;
    }

    const allocations = await Allocation.find(allocationFilter).lean();
    const employeeIds = [...new Set(allocations.map(a => a.employeeId))];
    
    const employeeFilter: Record<string, unknown> = {
      employeeId: { $in: employeeIds },
      status: 'active'
    };

    if (department) {
      employeeFilter.department = department;
    }

    const employees = await Employee.find(employeeFilter).lean();
    const projects = await Project.find({ status: 'active' }).lean();

    // Calculate allocation per employee
    const employeeAllocations = new Map();
    employees.forEach(emp => {
      const empAllocs = allocations.filter(a => a.employeeId === emp.employeeId);
      const totalAllocation = empAllocs.reduce((sum, a) => sum + a.allocation, 0);
      
      employeeAllocations.set(emp.employeeId, {
        employee: emp,
        totalAllocation,
        allocations: empAllocs
      });
    });

    // Over-allocated resources (>100%)
    const overAllocated = Array.from(employeeAllocations.values())
      .filter((ea: EmployeeAllocation) => ea.totalAllocation > 100)
      .map((ea: EmployeeAllocation) => ({
        employeeId: ea.employee.employeeId,
        name: ea.employee.name,
        department: ea.employee.department,
        allocation: ea.totalAllocation,
        excess: ea.totalAllocation - 100,
        projectCount: ea.allocations.length
      }));

    // Under-allocated resources (<50%)
    const underAllocated = Array.from(employeeAllocations.values())
      .filter((ea: EmployeeAllocation) => ea.totalAllocation < 50)
      .map((ea: EmployeeAllocation) => ({
        employeeId: ea.employee.employeeId,
        name: ea.employee.name,
        department: ea.employee.department,
        allocation: ea.totalAllocation,
        available: 100 - ea.totalAllocation,
        projectCount: ea.allocations.length
      }));

    // Optimal allocation (50-100%)
    const optimalCount = Array.from(employeeAllocations.values())
      .filter((ea: EmployeeAllocation) => ea.totalAllocation >= 50 && ea.totalAllocation <= 100)
      .length;

    const optimalRate = employees.length > 0
      ? Math.round((optimalCount / employees.length) * 100 * 100) / 100
      : 0;

    // Project-wise allocation summary
    const projectSummary = projects.map(proj => {
      const projAllocs = allocations.filter(a => a.projectId === proj.projectId);
      const resourceCount = new Set(projAllocs.map(a => a.employeeId)).size;
      const totalAllocation = projAllocs.reduce((sum, a) => sum + a.allocation, 0);
      const avgAllocation = resourceCount > 0 ? totalAllocation / resourceCount : 0;

      return {
        projectId: proj.projectId,
        projectName: proj.name,
        resourceCount,
        totalAllocation: Math.round(totalAllocation * 100) / 100,
        avgAllocation: Math.round(avgAllocation * 100) / 100,
        status: proj.status
      };
    }).filter(p => p.resourceCount > 0);

    // Capacity vs allocation
    const totalCapacity = employees.length * 100;
    const totalAllocated = Array.from(employeeAllocations.values())
      .reduce((sum: number, ea: EmployeeAllocation) => sum + ea.totalAllocation, 0);
    const utilizationRate = totalCapacity > 0
      ? Math.round((totalAllocated / totalCapacity) * 100 * 100) / 100
      : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        summary: {
          totalResources: employees.length,
          overAllocatedCount: overAllocated.length,
          underAllocatedCount: underAllocated.length,
          optimalCount,
          optimalRate,
          totalCapacity,
          totalAllocated: Math.round(totalAllocated * 100) / 100,
          utilizationRate
        },
        overAllocated,
        underAllocated,
        projectSummary
      }
    });

  } catch (error) {
    console.error('Error fetching allocation efficiency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch allocation efficiency data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rmg-analytics/cost-summary
 * Get cost analysis with real salary/rate calculations
 * 
 * @access Private (RMG, SUPER_ADMIN)
 */
router.get('/cost-summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId, department } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date(end.getFullYear(), end.getMonth(), 1);

    // Calculate days in period
    const daysInPeriod = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const monthsInPeriod = daysInPeriod / 30; // Approximate months

    // Get all active employees
    const employeeFilter: Record<string, unknown> = {
      status: 'active',
      isActive: true
    };
    if (department) {
      employeeFilter.department = department;
    }
    const employees = await Employee.find(employeeFilter).lean();

    // Get allocations for the period
    const allocationFilter: Record<string, unknown> = {
      status: 'active',
      startDate: { $lte: end },
      $or: [
        { endDate: { $gte: start } },
        { endDate: null }
      ]
    };
    const allocations = await Allocation.find(allocationFilter).lean();

    // Get projects
    const projectFilter: Record<string, unknown> = { status: { $in: ['active', 'on-hold', 'completed'] } };
    if (projectId) {
      projectFilter.projectId = projectId;
    }
    const projects = await Project.find(projectFilter).lean();

    // Calculate costs per employee
    interface EmployeeCost {
      employeeId: string;
      name: string;
      department: string;
      monthlySalary: number;
      periodCost: number;
      allocations: typeof allocations;
      billableAllocation: number;
      nonBillableAllocation: number;
      billableCost: number;
      nonBillableCost: number;
      isBench: boolean;
    }

    const employeeCosts = new Map<string, EmployeeCost>();

    employees.forEach(emp => {
      const empAllocs = allocations.filter(a => a.employeeId === emp.employeeId);
      const billableAllocs = empAllocs.filter(a => a.billable !== false);
      const nonBillableAllocs = empAllocs.filter(a => a.billable === false);

      const billableAllocation = billableAllocs.reduce((sum, a) => sum + a.allocation, 0);
      const nonBillableAllocation = nonBillableAllocs.reduce((sum, a) => sum + a.allocation, 0);
      const totalAllocation = billableAllocation + nonBillableAllocation;

      const monthlySalary = (emp as any).monthlySalary || 0; // eslint-disable-line @typescript-eslint/no-explicit-any
      const periodCost = monthlySalary * monthsInPeriod;

      // Proportional cost calculation
      const billableCost = totalAllocation > 0 
        ? (periodCost * billableAllocation) / 100 
        : 0;
      const nonBillableCost = totalAllocation > 0 
        ? (periodCost * nonBillableAllocation) / 100 
        : 0;

      employeeCosts.set(emp.employeeId, {
        employeeId: emp.employeeId,
        name: emp.name,
        department: emp.department,
        monthlySalary,
        periodCost,
        allocations: empAllocs,
        billableAllocation,
        nonBillableAllocation,
        billableCost,
        nonBillableCost,
        isBench: totalAllocation === 0
      });
    });

    // Calculate summary totals
    const totalResourceCost = Array.from(employeeCosts.values())
      .reduce((sum, ec) => sum + ec.periodCost, 0);

    const billableResourceCost = Array.from(employeeCosts.values())
      .reduce((sum, ec) => sum + ec.billableCost, 0);

    const nonBillableResourceCost = Array.from(employeeCosts.values())
      .reduce((sum, ec) => sum + ec.nonBillableCost, 0);

    const benchCost = Array.from(employeeCosts.values())
      .filter(ec => ec.isBench)
      .reduce((sum, ec) => sum + ec.periodCost, 0);

    // Department-wise cost breakdown
    const departmentCostMap = new Map<string, {
      department: string;
      resourceCount: number;
      totalCost: number;
      billableCost: number;
      nonBillableCost: number;
      benchCost: number;
      benchCount: number;
    }>();

    Array.from(employeeCosts.values()).forEach(ec => {
      if (!departmentCostMap.has(ec.department)) {
        departmentCostMap.set(ec.department, {
          department: ec.department,
          resourceCount: 0,
          totalCost: 0,
          billableCost: 0,
          nonBillableCost: 0,
          benchCost: 0,
          benchCount: 0
        });
      }

      const deptData = departmentCostMap.get(ec.department)!;
      deptData.resourceCount++;
      deptData.totalCost += ec.periodCost;
      deptData.billableCost += ec.billableCost;
      deptData.nonBillableCost += ec.nonBillableCost;
      if (ec.isBench) {
        deptData.benchCost += ec.periodCost;
        deptData.benchCount++;
      }
    });

    const departmentCosts = Array.from(departmentCostMap.values())
      .map(d => ({
        ...d,
        totalCost: Math.round(d.totalCost * 100) / 100,
        billableCost: Math.round(d.billableCost * 100) / 100,
        nonBillableCost: Math.round(d.nonBillableCost * 100) / 100,
        benchCost: Math.round(d.benchCost * 100) / 100,
        avgCostPerResource: Math.round((d.totalCost / d.resourceCount) * 100) / 100
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    // Project-wise cost calculation
    const projectCostMap = new Map<string, {
      projectId: string;
      projectName: string;
      budget: number;
      actualCost: number;
      resourceCount: number;
      variance: number;
      variancePercent: number;
      roi: number;
    }>();

    projects.forEach(proj => {
      const projAllocs = allocations.filter(a => a.projectId === proj.projectId && a.billable !== false);
      const resourceIds = new Set(projAllocs.map(a => a.employeeId));
      
      let projectCost = 0;
      projAllocs.forEach(alloc => {
        const empCost = employeeCosts.get(alloc.employeeId);
        if (empCost) {
          // Cost = (Monthly Salary * Months * Allocation %)
          projectCost += (empCost.monthlySalary * monthsInPeriod * alloc.allocation) / 100;
        }
      });

      const budget = proj.budget || 0;
      const variance = budget - projectCost;
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0;
      const roi = projectCost > 0 ? ((budget - projectCost) / projectCost) * 100 : 0;

      if (resourceIds.size > 0) {
        projectCostMap.set(proj.projectId, {
          projectId: proj.projectId,
          projectName: proj.name,
          budget,
          actualCost: Math.round(projectCost * 100) / 100,
          resourceCount: resourceIds.size,
          variance: Math.round(variance * 100) / 100,
          variancePercent: Math.round(variancePercent * 100) / 100,
          roi: Math.round(roi * 100) / 100
        });
      }
    });

    const projectCosts = Array.from(projectCostMap.values())
      .sort((a, b) => b.actualCost - a.actualCost);

    // Top cost contributors
    const topCostEmployees = Array.from(employeeCosts.values())
      .filter(ec => ec.periodCost > 0)
      .sort((a, b) => b.periodCost - a.periodCost)
      .slice(0, 10)
      .map(ec => ({
        employeeId: ec.employeeId,
        name: ec.name,
        department: ec.department,
        monthlySalary: ec.monthlySalary,
        periodCost: Math.round(ec.periodCost * 100) / 100,
        billableCost: Math.round(ec.billableCost * 100) / 100,
        utilization: ec.billableAllocation + ec.nonBillableAllocation,
        isBench: ec.isBench
      }));

    // Cost efficiency metrics
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const budgetUtilization = totalBudget > 0 
      ? (billableResourceCost / totalBudget) * 100 
      : 0;

    const costPerProject = projectCosts.length > 0 
      ? billableResourceCost / projectCosts.length 
      : 0;

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
          days: daysInPeriod,
          months: Math.round(monthsInPeriod * 100) / 100
        },
        summary: {
          totalResourceCost: Math.round(totalResourceCost * 100) / 100,
          billableResourceCost: Math.round(billableResourceCost * 100) / 100,
          nonBillableResourceCost: Math.round(nonBillableResourceCost * 100) / 100,
          benchCost: Math.round(benchCost * 100) / 100,
          totalBudget: Math.round(totalBudget * 100) / 100,
          budgetUtilization: Math.round(budgetUtilization * 100) / 100,
          costPerProject: Math.round(costPerProject * 100) / 100,
          resourceCount: employees.length,
          benchCount: Array.from(employeeCosts.values()).filter(ec => ec.isBench).length
        },
        departmentCosts,
        projectCosts,
        topCostEmployees,
        trends: {
          // Month-over-month trends would require historical data
          // Placeholder for future enhancement
          currentMonth: Math.round(totalResourceCost * 100) / 100,
          previousMonth: 0,
          change: 0,
          changePercent: 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching cost summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cost summary data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rmg-analytics/skills-gap
 * Get skills gap analysis
 * 
 * @access Private (RMG, SUPER_ADMIN)
 */
router.get('/skills-gap', async (req: Request, res: Response) => {
  try {
    const { projectId, futureMonths = 3 } = req.query;

    // Get all active employees with their skills
    const employees = await Employee.find({ 
      status: 'active',
      isActive: true 
    }).lean();

    // Get upcoming projects
    const upcomingDate = new Date();
    upcomingDate.setMonth(upcomingDate.getMonth() + Number(futureMonths));

    const projectFilter: Record<string, unknown> = {
      status: { $in: ['active', 'on-hold'] },
      startDate: { $lte: upcomingDate }
    };

    if (projectId) {
      projectFilter.projectId = projectId;
    }

    const projects = await Project.find(projectFilter).lean();

    // Collect all required skills from projects
    const requiredSkillsMap = new Map();
    projects.forEach(proj => {
      if (proj.requiredSkills && Array.isArray(proj.requiredSkills)) {
        proj.requiredSkills.forEach(skill => {
          requiredSkillsMap.set(skill, (requiredSkillsMap.get(skill) || 0) + 1);
        });
      }
    });

    // Collect available skills from employees
    const availableSkillsMap = new Map();
    employees.forEach(emp => {
      if (emp.skills && Array.isArray(emp.skills)) {
        emp.skills.forEach(skill => {
          if (!availableSkillsMap.has(skill)) {
            availableSkillsMap.set(skill, []);
          }
          availableSkillsMap.get(skill).push({
            employeeId: emp.employeeId,
            name: emp.name,
            department: emp.department
          });
        });
      }
    });

    // Calculate skills gap
    const skillsGap = Array.from(requiredSkillsMap.entries())
      .map(([skill, required]) => {
        const available = availableSkillsMap.has(skill) 
          ? availableSkillsMap.get(skill).length 
          : 0;
        const gap = Math.max(0, required - available);
        
        return {
          skill,
          required,
          available,
          gap,
          status: gap > 0 ? 'shortage' : 'sufficient',
          employees: availableSkillsMap.get(skill) || []
        };
      })
      .sort((a, b) => b.gap - a.gap);

    // Hiring recommendations
    const hiringRecommendations = skillsGap
      .filter(sg => sg.gap > 0)
      .map(sg => ({
        skill: sg.skill,
        requiredCount: sg.gap,
        priority: sg.gap >= 3 ? 'high' : sg.gap >= 2 ? 'medium' : 'low',
        suggestedRole: sg.skill
      }));

    // Training needs (skills with low availability)
    const trainingNeeds = Array.from(requiredSkillsMap.entries())
      .map(([skill, required]) => {
        const available = availableSkillsMap.has(skill) 
          ? availableSkillsMap.get(skill).length 
          : 0;
        
        return {
          skill,
          currentEmployees: available,
          additionalNeeded: Math.max(0, Math.ceil(required * 0.5) - available)
        };
      })
      .filter(tn => tn.additionalNeeded > 0)
      .sort((a, b) => b.additionalNeeded - a.additionalNeeded);

    res.json({
      success: true,
      data: {
        period: {
          futureMonths: Number(futureMonths),
          upcomingProjectsCount: projects.length
        },
        summary: {
          totalSkillsRequired: requiredSkillsMap.size,
          totalSkillsAvailable: availableSkillsMap.size,
          criticalGaps: skillsGap.filter(sg => sg.gap >= 3).length,
          moderateGaps: skillsGap.filter(sg => sg.gap >= 1 && sg.gap < 3).length
        },
        skillsGap,
        hiringRecommendations,
        trainingNeeds
      }
    });

  } catch (error) {
    console.error('Error fetching skills gap:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skills gap data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/rmg-analytics/demand-forecast
 * Get resource demand forecast
 * 
 * @access Private (RMG, SUPER_ADMIN)
 */
router.get('/demand-forecast', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department, role } = req.query;

    const end = endDate ? new Date(endDate as string) : new Date();
    end.setMonth(end.getMonth() + 6); // Look 6 months ahead
    
    const start = startDate 
      ? new Date(startDate as string) 
      : new Date();

    // Get upcoming and active projects
    const projects = await Project.find({
      status: { $in: ['active', 'on-hold'] },
      startDate: { $gte: start, $lte: end }
    }).lean();

    // Get current allocations to understand demand
    const allocations = await Allocation.find({
      status: 'active'
    }).lean();

    // Build employee filter
    const employeeFilter: Record<string, unknown> = {
      status: 'active',
      isActive: true
    };

    if (department) {
      employeeFilter.department = department;
    }

    if (role) {
      employeeFilter.designation = role;
    }

    const employees = await Employee.find(employeeFilter).lean();

    // Calculate current utilization
    const currentUtilization = new Map();
    employees.forEach(emp => {
      const empAllocs = allocations.filter(a => a.employeeId === emp.employeeId);
      const totalAlloc = empAllocs.reduce((sum, a) => sum + a.allocation, 0);
      currentUtilization.set(emp.employeeId, totalAlloc);
    });

    const availableResources = employees.filter(emp => 
      (currentUtilization.get(emp.employeeId) || 0) < 80
    ).length;

    // Project demands by role
    const roleDemands = new Map();
    projects.forEach(proj => {
      if (proj.requiredSkills && Array.isArray(proj.requiredSkills)) {
        proj.requiredSkills.forEach(skill => {
          roleDemands.set(skill, (roleDemands.get(skill) || 0) + 1);
        });
      }
    });

    const demandByRole = Array.from(roleDemands.entries())
      .map(([role, demand]) => {
        const availableWithSkill = employees.filter(emp => 
          emp.skills && emp.skills.includes(role) &&
          (currentUtilization.get(emp.employeeId) || 0) < 80
        ).length;

        return {
          role,
          demand,
          available: availableWithSkill,
          gap: Math.max(0, demand - availableWithSkill)
        };
      })
      .sort((a, b) => b.gap - a.gap);

    // Upcoming project timeline
    const upcomingProjects = projects.map(proj => ({
      projectId: proj.projectId,
      projectName: proj.name,
      startDate: proj.startDate,
      estimatedTeamSize: proj.teamSize || 5,
      requiredSkills: proj.requiredSkills || [],
      status: proj.status
    })).sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Gap analysis
    const totalDemand = Array.from(roleDemands.values())
      .reduce((sum: number, d) => sum + (d as number), 0);
    const totalGap = demandByRole.reduce((sum, d) => sum + d.gap, 0);

    // Hiring timeline recommendations
    const hiringTimeline = demandByRole
      .filter(d => d.gap > 0)
      .map(d => ({
        role: d.role,
        hiresNeeded: d.gap,
        urgency: d.gap >= 3 ? 'immediate' : d.gap >= 2 ? 'within-month' : 'within-quarter',
        suggestedStartDate: new Date()
      }));

    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        summary: {
          upcomingProjectsCount: projects.length,
          totalDemand,
          availableResources,
          totalGap,
          utilizationRate: employees.length > 0
            ? Math.round((Array.from(currentUtilization.values()).reduce((s: number, u) => s + u, 0) / (employees.length * 100)) * 100 * 100) / 100
            : 0
        },
        demandByRole,
        upcomingProjects,
        hiringTimeline
      }
    });

  } catch (error) {
    console.error('Error fetching demand forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demand forecast data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
