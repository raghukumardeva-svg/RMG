import express from 'express';
import TimesheetEntry from '../models/TimesheetEntry';
import FLResource from '../models/FLResource';
import Project from '../models/Project';
import Employee from '../models/Employee';

const router = express.Router();

/**
 * Get Employee Hours Report
 * Route: GET /api/employee-hours-report
 * 
 * Query Parameters:
 * - employeeId: string (required for employee role)
 * - role: 'EMPLOYEE' | 'RMG' | 'MANAGER'
 * - month: string (format: YYYY-MM)
 * - projectId: string (optional filter)
 * - startDate: string (optional filter)
 * - endDate: string (optional filter)
 * - department: string (optional filter)
 * - managerId: string (required for MANAGER role)
 */
router.get('/', async (req, res) => {
    try {
        const {
            employeeId,
            role,
            month,
            projectId,
            startDate,
            endDate,
            department,
            managerId
        } = req.query;

        // Validate role is always required
        if (!role) {
            return res.status(400).json({
                message: 'role is required'
            });
        }

        // Calculate date range - use month OR startDate/endDate OR default to current month
        let monthStart: Date;
        let monthEnd: Date;

        if (startDate && endDate) {
            // Use provided date range
            monthStart = new Date(startDate as string);
            monthStart.setHours(0, 0, 0, 0);
            monthEnd = new Date(endDate as string);
            monthEnd.setHours(23, 59, 59, 999);
        } else if (month) {
            // Parse month to get date range
            const [year, monthNum] = String(month).split('-').map(Number);
            monthStart = new Date(year, monthNum - 1, 1);
            monthStart.setHours(0, 0, 0, 0);
            monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);
        } else {
            // Default to current month
            const now = new Date();
            monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            monthStart.setHours(0, 0, 0, 0);
            monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        console.log(`[Employee Hours Report] Role: ${role}, Date Range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`);

        // Role-based data fetching
        let employeeIds: string[] = [];

        if (role === 'EMPLOYEE') {
            // Employee can only see their own report
            if (!employeeId) {
                return res.status(400).json({ message: 'employeeId is required for EMPLOYEE role' });
            }
            employeeIds = [employeeId as string];
            console.log(`[Employee Hours Report] Employee ID: ${employeeId}`);
        } else if (role === 'MANAGER') {
            // Manager can see employees in their projects
            if (!managerId) {
                return res.status(400).json({ message: 'managerId is required for MANAGER role' });
            }

            // Find projects managed by this manager
            const managerProjects = await Project.find({
                'projectManager.employeeId': managerId
            }).select('projectId');

            const projectIds = managerProjects.map(p => p.projectId);

            if (projectIds.length === 0) {
                return res.json({ employees: [], summary: null });
            }

            // Find employees allocated to these projects
            const flResources = await FLResource.find({
                projectId: {
                    $in: projectIds.map(id => {
                        // Handle both string and ObjectId
                        const project = managerProjects.find(p => p.projectId === id);
                        return project?._id;
                    }).filter(Boolean)
                }
            }).select('employeeId');

            employeeIds = [...new Set(flResources.map(r => r.employeeId))];

            if (employeeIds.length === 0) {
                return res.json({ employees: [], summary: null });
            }
        } else if (role === 'RMG') {
            // RMG can see all employees or filter by project allocation

            if (projectId) {
                // If project is selected, get employees allocated to that project from FLResource
                const project = await Project.findOne({ projectId: projectId as string });

                if (!project) {
                    return res.json({
                        employees: [],
                        summary: null,
                        message: 'Project not found'
                    });
                }

                console.log(`[Employee Hours Report] RMG - Project ObjectId: ${project._id}`);

                // Find employees allocated to this project in FLResource
                const flResources = await FLResource.find({
                    projectId: project._id
                }).select('employeeId');

                employeeIds = [...new Set(flResources.map(r => r.employeeId))];

                console.log(`[Employee Hours Report] RMG - Found ${employeeIds.length} employees allocated to project ${projectId}`);

                if (employeeIds.length === 0) {
                    return res.json({
                        employees: [],
                        summary: null,
                        message: 'No employees allocated to this project'
                    });
                }
            } else {
                // No project filter - get all employees (optionally filtered by department)
                let employeeQuery: any = {};

                if (department) {
                    employeeQuery.department = department;
                }

                const employees = await Employee.find(employeeQuery).select('employeeId');
                employeeIds = employees.map(e => e.employeeId);
            }
        }

        // Apply additional filters
        let dateFilter: any = {
            date: { $gte: monthStart, $lte: monthEnd }
        };

        if (startDate) {
            dateFilter.date.$gte = new Date(startDate as string);
        }
        if (endDate) {
            dateFilter.date.$lte = new Date(endDate as string);
        }

        // Build report data for each employee
        const reportData = await Promise.all(
            employeeIds.map(async (empId) => {
                // Base query
                let query: any = {
                    employeeId: empId,
                    ...dateFilter
                };

                if (projectId) {
                    query.projectId = projectId;
                }

                // Fetch all entries for this employee in the period
                const entries = await TimesheetEntry.find(query);

                console.log(`[Employee Hours Report] Employee: ${empId}, Query:`, JSON.stringify(query));
                console.log(`[Employee Hours Report] Found ${entries.length} timesheet entries`);

                // Fetch allocation data from flresources
                let allocationQuery: any = { employeeId: empId };
                if (projectId) {
                    // Find project ObjectId
                    const project = await Project.findOne({ projectId: projectId as string });
                    if (project) {
                        allocationQuery.projectId = project._id;
                    }
                }

                const allocations = await FLResource.find(allocationQuery);

                console.log(`[Employee Hours Report] Found ${allocations.length} FL Resource allocations`);

                // Calculate allocation hours from totalAllocation field
                const allocationHours = allocations.reduce((total, alloc) => {
                    // totalAllocation is a string, convert to number
                    const totalAlloc = alloc.totalAllocation ? Number.parseFloat(alloc.totalAllocation) : 0;
                    return total + totalAlloc;
                }, 0);

                // Calculate actual hours
                const actualBillableHours = entries
                    .filter(e => e.billable === "Billable")
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                const actualNonBillableHours = entries
                    .filter(e => e.billable === "Non-Billable")
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                const actualHours = actualBillableHours + actualNonBillableHours;

                // Calculate approved hours
                const billableApprovedHours = entries
                    .filter(e => e.billable === "Billable" && e.approvalStatus === 'approved')
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                const nonBillableApprovedHours = entries
                    .filter(e => e.billable === "Non-Billable" && e.approvalStatus === 'approved')
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                const approvedHours = billableApprovedHours + nonBillableApprovedHours;

                // Calculate pending approved hours
                const pendingEntries = entries.filter(e => e.approvalStatus === 'pending');
                const pendingApprovedHours = pendingEntries
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                // Calculate rejected hours
                const rejectedHours = entries
                    .filter(e => e.approvalStatus === 'rejected')
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                // Calculate revision requested hours
                const revisionRequestedHours = entries
                    .filter(e => e.approvalStatus === 'revision_requested')
                    .reduce((sum, e) => sum + convertHoursToDecimal(e.hours), 0);

                // Build pending details with project manager name
                const pendingProjectIds = [...new Set(pendingEntries.map(e => e.projectId).filter(Boolean))];
                const pendingProjects = pendingProjectIds.length > 0
                    ? await Project.find({ projectId: { $in: pendingProjectIds } })
                        .select('projectId projectName projectManager')
                    : [];
                const pendingProjectMap = new Map(
                    pendingProjects.map(p => [p.projectId, p])
                );
                const pendingDetails = pendingEntries.map((entry) => {
                    const project = pendingProjectMap.get(entry.projectId);
                    return {
                        date: entry.date.toISOString(),
                        projectId: entry.projectId,
                        projectName: entry.projectName || project?.projectName || 'N/A',
                        projectManagerName: project?.projectManager?.name || 'N/A'
                    };
                });

                // Get employee details
                const employee = await Employee.findOne({ employeeId: empId })
                    .select('employeeId name email department');

                console.log(`[Employee Hours Report] ${empId} Results:`, {
                    allocationHours,
                    actualBillableHours: actualBillableHours.toFixed(2),
                    actualNonBillableHours: actualNonBillableHours.toFixed(2),
                    billableApprovedHours: billableApprovedHours.toFixed(2),
                    nonBillableApprovedHours: nonBillableApprovedHours.toFixed(2),
                    actualHours: actualHours.toFixed(2),
                    approvedHours: approvedHours.toFixed(2)
                });

                return {
                    employeeId: empId,
                    employeeName: employee?.name || entries[0]?.employeeName || 'Unknown',
                    email: employee?.email || '',
                    department: employee?.department || '',
                    allocationHours: Number.parseFloat(allocationHours.toFixed(2)),
                    actualBillableHours: Number.parseFloat(actualBillableHours.toFixed(2)),
                    actualNonBillableHours: Number.parseFloat(actualNonBillableHours.toFixed(2)),
                    billableApprovedHours: Number.parseFloat(billableApprovedHours.toFixed(2)),
                    nonBillableApprovedHours: Number.parseFloat(nonBillableApprovedHours.toFixed(2)),
                    actualHours: Number.parseFloat(actualHours.toFixed(2)),
                    approvedHours: Number.parseFloat(approvedHours.toFixed(2)),
                    pendingApprovedHours: Number.parseFloat(pendingApprovedHours.toFixed(2)),
                    rejectedHours: Number.parseFloat(rejectedHours.toFixed(2)),
                    revisionRequestedHours: Number.parseFloat(revisionRequestedHours.toFixed(2)),
                    pendingDetails
                };
            })
        );

        // Calculate summary totals
        const summary = {
            totalAllocationHours: reportData.reduce((sum, r) => sum + r.allocationHours, 0),
            totalActualBillableHours: reportData.reduce((sum, r) => sum + r.actualBillableHours, 0),
            totalActualNonBillableHours: reportData.reduce((sum, r) => sum + r.actualNonBillableHours, 0),
            totalBillableApprovedHours: reportData.reduce((sum, r) => sum + r.billableApprovedHours, 0),
            totalNonBillableApprovedHours: reportData.reduce((sum, r) => sum + r.nonBillableApprovedHours, 0),
            totalActualHours: reportData.reduce((sum, r) => sum + r.actualHours, 0),
            totalApprovedHours: reportData.reduce((sum, r) => sum + r.approvedHours, 0),
            totalPendingApprovedHours: reportData.reduce((sum, r) => sum + r.pendingApprovedHours, 0),
            totalRejectedHours: reportData.reduce((sum, r) => sum + r.rejectedHours, 0),
            totalRevisionRequestedHours: reportData.reduce((sum, r) => sum + r.revisionRequestedHours, 0)
        };

        console.log(`[Employee Hours Report] Returning ${reportData.length} employees with data`);

        res.json({
            employees: reportData,
            summary,
            filters: {
                role,
                month,
                projectId: projectId || null,
                startDate: startDate || null,
                endDate: endDate || null,
                department: department || null
            }
        });

    } catch (error) {
        console.error('Error generating employee hours report:', error);
        res.status(500).json({
            message: 'Failed to generate report',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Get available projects for filter
 * Route: GET /api/employee-hours-report/projects
 */
router.get('/projects', async (req, res) => {
    try {
        const { managerId, role } = req.query;

        let query: any = {};

        if (role === 'MANAGER' && managerId) {
            query['projectManager.employeeId'] = managerId;
        }

        const projects = await Project.find(query)
            .select('projectId projectName projectCode')
            .sort({ projectName: 1 });

        res.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Failed to fetch projects' });
    }
});

/**
 * Get available departments for filter
 * Route: GET /api/employee-hours-report/departments
 */
router.get('/departments', async (req, res) => {
    try {
        const departments = await Employee.distinct('department');
        res.json(departments.filter(d => d)); // Filter out null/undefined
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

/**
 * Helper function to convert time string to decimal hours
 */
function convertHoursToDecimal(timeString: string): number {
    if (!timeString) return 0;

    // Handle formats like "08:00" or "8:30"
    const parts = timeString.split(':');
    if (parts.length !== 2) return 0;

    const hours = Number.parseInt(parts[0], 10);
    const minutes = Number.parseInt(parts[1], 10);

    return hours + (minutes / 60);
}

export default router;
