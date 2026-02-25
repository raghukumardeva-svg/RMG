import express from 'express';
import TimesheetEntry from '../models/TimesheetEntry';
import Project from '../models/Project';
import Notification from '../models/Notification';
import {
    weekRowsToDateEntries,
    dateEntriesToWeekRows,
    calculateTotalHours,
    determineOverallStatus
} from '../utils/timesheetTransformers';

const router = express.Router();

/**
 * Get timesheet for a specific week
 * Returns data in week-based format (compatible with existing UI)
 * Internally queries date-based entries
 */
router.get('/week/:employeeId/:weekStartDate', async (req, res) => {
    try {
        const { employeeId, weekStartDate } = req.params;

        // Parse date correctly to avoid timezone issues
        const [year, month, day] = weekStartDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(year, month - 1, day + 6);
        weekEnd.setHours(23, 59, 59, 999);

        console.log(`[GET Week] Fetching for ${employeeId}, week: ${weekStartDate}, parsed as:`, {
            weekStart: weekStart.toISOString(),
            weekEnd: weekEnd.toISOString()
        });

        // Find all entries for this week
        const entries = await TimesheetEntry.find({
            employeeId,
            date: { $gte: weekStart, $lte: weekEnd }
        }).sort({ date: 1 });

        if (entries.length === 0) {
            return res.json(null);
        }

        // Transform to week-based format for UI
        const rows = dateEntriesToWeekRows(weekStart, entries);

        // Calculate total hours
        const totalHours = calculateTotalHours(entries);

        // Determine overall status
        const status = determineOverallStatus(entries);

        // Add approval metadata per day (for revision indicators)
        const rowMetaMap = new Map<string, any[]>();

        entries.forEach(entry => {
            const key = `${entry.projectId}|${entry.udaId}`;
            if (!rowMetaMap.has(key)) {
                rowMetaMap.set(key, new Array(7).fill(null));
            }

            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const weekStartCopy = new Date(weekStart);
            weekStartCopy.setHours(0, 0, 0, 0);

            const dayIndex = Math.floor(
                (entryDate.getTime() - weekStartCopy.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (dayIndex >= 0 && dayIndex < 7) {
                rowMetaMap.get(key)![dayIndex] = {
                    approvalStatus: entry.approvalStatus || 'pending',
                    rejectedReason: entry.rejectedReason || null,
                    date: entryDate.toISOString().split('T')[0],
                    entryId: entry._id
                };
            }
        });

        const rowsWithMeta = rows.map(row => ({
            ...row,
            entryMeta: rowMetaMap.get(`${row.projectId}|${row.udaId}`) || new Array(7).fill(null)
        }));

        const weekEndDateStr = weekEnd.toISOString().split('T')[0];

        console.log(`[GET Week] Employee ${employeeId}, Week ${weekStartDate}: ${entries.length} entries`);
        rowsWithMeta.forEach((row, idx) => {
            const hasRevisions = row.entryMeta?.some((meta: any) => meta?.approvalStatus === 'revision_requested');
            if (hasRevisions) {
                console.log(`[GET Week] Row ${idx} (${row.udaName}) has revisions:`, row.entryMeta);
            }
        });

        res.json({
            employeeId,
            employeeName: entries[0]?.employeeName,
            weekStartDate,
            weekEndDate: weekEndDateStr,
            rows: rowsWithMeta,
            status,
            totalHours,
            submittedAt: entries[0]?.submittedAt
        });

    } catch (error) {
        console.error('Error fetching timesheet:', error);
        res.status(500).json({ message: 'Failed to fetch timesheet' });
    }
});

/**
 * Get all timesheets for an employee
 * Groups entries by week and returns in week-based format
 */
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { status } = req.query;

        const query: any = { employeeId };
        if (status) {
            query.approvalStatus = status === 'approved' ? 'approved' :
                status === 'rejected' ? 'rejected' : 'pending';
        }

        // Get all entries, sorted by date
        const entries = await TimesheetEntry.find(query)
            .sort({ date: -1 })
            .limit(500); // Limit to recent entries

        if (entries.length === 0) {
            return res.json([]);
        }

        // Group entries by week
        const weekMap = new Map<string, any[]>();

        entries.forEach(entry => {
            const entryDate = new Date(entry.date);
            // Calculate Monday of the week
            const dayOfWeek = entryDate.getDay();
            const diff = entryDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            const monday = new Date(entryDate.setDate(diff));
            const mondayStr = monday.toISOString().split('T')[0];

            if (!weekMap.has(mondayStr)) {
                weekMap.set(mondayStr, []);
            }
            weekMap.get(mondayStr)!.push(entry);
        });

        // Convert each week's entries to timesheet format
        const timesheets = Array.from(weekMap.entries()).map(([weekStartDate, weekEntries]) => {
            const weekStart = new Date(weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            const rows = dateEntriesToWeekRows(weekStart, weekEntries);
            const totalHours = calculateTotalHours(weekEntries);
            const weekStatus = determineOverallStatus(weekEntries);

            return {
                employeeId,
                employeeName: weekEntries[0]?.employeeName,
                weekStartDate,
                weekEndDate: weekEnd.toISOString().split('T')[0],
                rows,
                status: weekStatus,
                totalHours,
                submittedAt: weekEntries[0]?.submittedAt,
                _id: `week-${weekStartDate}` // Virtual ID for week
            };
        });

        res.json(timesheets);

    } catch (error) {
        console.error('Error fetching timesheets:', error);
        res.status(500).json({ message: 'Failed to fetch timesheets' });
    }
});

/**
 * Submit timesheet (converts week-based to date-based)
 * Frontend sends weekly data, backend stores as individual date entries
 */
router.post('/submit', async (req, res) => {
    try {
        const { employeeId, employeeName, weekStartDate, weekEndDate, rows } = req.body;

        if (!employeeId || !employeeName || !weekStartDate || !rows) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Parse date correctly to avoid timezone issues
        const [year, month, day] = weekStartDate.split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        weekStart.setHours(0, 0, 0, 0);

        console.log(`[POST Submit] Submitting timesheet for ${employeeId}, week: ${weekStartDate}`);

        // Transform week-based rows to date-based entries
        const entries = weekRowsToDateEntries(employeeId, employeeName, weekStart, rows);

        if (entries.length === 0) {
            return res.status(400).json({ message: 'No hours entered' });
        }

        // Bulk upsert entries (update if exists, insert if new)
        const bulkOps = entries.map(entry => ({
            updateOne: {
                filter: {
                    employeeId: entry.employeeId,
                    date: entry.date,
                    projectId: entry.projectId,
                    udaId: entry.udaId
                },
                update: { $set: entry },
                upsert: true
            }
        }));

        const result = await TimesheetEntry.bulkWrite(bulkOps);

        // Calculate total hours
        const totalHours = calculateTotalHours(entries);

        // Return response in week-based format (compatible with existing UI)
        res.status(201).json({
            employeeId,
            employeeName,
            weekStartDate,
            weekEndDate,
            rows, // Return original rows format
            status: 'submitted',
            totalHours,
            submittedAt: new Date(),
            message: `Successfully submitted ${entries.length} timesheet entries`,
            _meta: {
                entriesCreated: result.upsertedCount,
                entriesUpdated: result.modifiedCount
            }
        });

    } catch (error) {
        console.error('Error submitting timesheet:', error);
        res.status(500).json({
            message: 'Failed to submit timesheet',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

/**
 * Recall/Delete timesheet for a week
 * Deletes all date-based entries for the specified week
 */
router.delete('/recall/:employeeId/:weekStartDate', async (req, res) => {
    try {
        const { employeeId, weekStartDate } = req.params;

        const weekStart = new Date(weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Delete all entries for this week
        const result = await TimesheetEntry.deleteMany({
            employeeId,
            date: { $gte: weekStart, $lte: weekEnd }
        });

        res.json({
            message: 'Timesheet recalled successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error recalling timesheet:', error);
        res.status(500).json({ message: 'Failed to recall timesheet' });
    }
});

/**
 * Delete a specific row (project/UDA combination) for a week
 * Deletes all date-based entries matching the project and UDA for the specified week
 */
router.delete('/row/:employeeId/:weekStartDate/:projectId/:udaId', async (req, res) => {
    try {
        const { employeeId, weekStartDate, projectId, udaId } = req.params;

        const weekStart = new Date(weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Delete all entries for this project/UDA combination in the week
        const result = await TimesheetEntry.deleteMany({
            employeeId,
            projectId,
            udaId,
            date: { $gte: weekStart, $lte: weekEnd }
        });

        console.log(`[Delete Row] Deleted ${result.deletedCount} entries for employee ${employeeId}, project ${projectId}, UDA ${udaId}, week ${weekStartDate}`);

        res.json({
            message: 'Row deleted successfully',
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error deleting row:', error);
        res.status(500).json({ message: 'Failed to delete row' });
    }
});

/**
 * Get all entries for a date range (for reporting/billing)
 * Returns raw date-based entries (not week-grouped)
 */
router.get('/date-range/:employeeId/:startDate/:endDate', async (req, res) => {
    try {
        const { employeeId, startDate, endDate } = req.params;

        const entries = await TimesheetEntry.find({
            employeeId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }).sort({ date: 1, createdAt: 1 });

        res.json(entries);

    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ message: 'Failed to fetch entries' });
    }
});

/**
 * Approve specific entry (for future manager approval workflow)
 */
router.put('/approve/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { approvedBy } = req.body;

        const entry = await TimesheetEntry.findByIdAndUpdate(
            entryId,
            {
                approvalStatus: 'approved',
                approvedBy,
                approvedAt: new Date()
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.json(entry);

    } catch (error) {
        console.error('Error approving entry:', error);
        res.status(500).json({ message: 'Failed to approve entry' });
    }
});

/**
 * Reject specific entry (for future manager approval workflow)
 */
router.put('/reject/:entryId', async (req, res) => {
    try {
        const { entryId } = req.params;
        const { approvedBy, rejectedReason } = req.body;

        const entry = await TimesheetEntry.findByIdAndUpdate(
            entryId,
            {
                approvalStatus: 'rejected',
                approvedBy,
                rejectedReason
            },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.json(entry);

    } catch (error) {
        console.error('Error rejecting entry:', error);
        res.status(500).json({ message: 'Failed to reject entry' });
    }
});

/**
 * Get timesheets for approver (project manager)
 * Requires managerId, employeeId, and weekStartDate
 * projectId is optional - if "all" or omitted, fetches all projects
 */
router.get('/approvals', async (req, res) => {
    try {
        const { managerId, projectId, employeeId, weekStartDate } = req.query;

        if (!managerId || !employeeId || !weekStartDate) {
            return res.status(400).json({
                message: 'managerId, employeeId, and weekStartDate are required'
            });
        }

        // If projectId is provided and not "all", check if manager has access
        if (projectId && projectId !== 'all') {
            const managedProject = await Project.findOne({
                projectId,
                'projectManager.employeeId': managerId
            }).select('projectId');

            // For testing: If project not in DB, log warning but continue
            // In production, you might want to enforce: if (!managedProject) return res.json(null);
            if (!managedProject) {
                console.warn(`[Approvals] Project ${projectId} not found in Projects collection for manager ${managerId}. Proceeding with timesheet query...`);
            }
        }

        // Parse date correctly to avoid timezone issues
        const [year, month, day] = String(weekStartDate).split('-').map(Number);
        const weekStart = new Date(year, month - 1, day);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(year, month - 1, day + 6);
        weekEnd.setHours(23, 59, 59, 999);

        console.log(`[Approvals] Fetching for employee ${employeeId}, project ${projectId || 'all'}, week: ${weekStartDate}`);

        // Build query - only filter by projectId if it's provided and not "all"
        const query: any = {
            employeeId,
            date: { $gte: weekStart, $lte: weekEnd },
            status: 'submitted',
            approvalStatus: { $in: ['pending', 'revision_requested', 'approved'] }
        };

        if (projectId && projectId !== 'all') {
            query.projectId = projectId as string;
        }

        const entries = await TimesheetEntry.find(query).sort({ date: 1 });

        if (entries.length === 0) {
            return res.json(null);
        }

        const rows = dateEntriesToWeekRows(weekStart, entries);
        const totalHours = calculateTotalHours(entries);
        const status = determineOverallStatus(entries);

        const rowMetaMap = new Map<string, any[]>();

        entries.forEach(entry => {
            const key = `${entry.projectId}|${entry.udaId}`;
            if (!rowMetaMap.has(key)) {
                rowMetaMap.set(key, new Array(7).fill(null));
            }

            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const weekStartCopy = new Date(weekStart);
            weekStartCopy.setHours(0, 0, 0, 0);

            const dayIndex = Math.floor(
                (entryDate.getTime() - weekStartCopy.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (dayIndex >= 0 && dayIndex < 7) {
                rowMetaMap.get(key)![dayIndex] = {
                    approvalStatus: entry.approvalStatus,
                    rejectedReason: entry.rejectedReason || null,
                    date: entryDate.toISOString().split('T')[0],
                    entryId: entry._id
                };
            }
        });

        const rowsWithMeta = rows.map(row => ({
            ...row,
            entryMeta: rowMetaMap.get(`${row.projectId}|${row.udaId}`) || new Array(7).fill(null)
        }));

        console.log(`[GET Approvals] Returning ${entries.length} entries, ${rowsWithMeta.length} rows`);
        rowsWithMeta.forEach((row, idx) => {
            const hasRevisions = row.entryMeta.some((meta: any) => meta?.approvalStatus === 'revision_requested');
            if (hasRevisions) {
                console.log(`[GET Approvals] Row ${idx} has revisions:`, row.entryMeta);
            }
        });

        res.json({
            employeeId,
            employeeName: entries[0]?.employeeName,
            weekStartDate,
            weekEndDate: weekEnd.toISOString().split('T')[0],
            rows: rowsWithMeta,
            status,
            totalHours,
            submittedAt: entries[0]?.submittedAt
        });

    } catch (error) {
        console.error('Error fetching approvals:', error);
        res.status(500).json({ message: 'Failed to fetch approvals' });
    }
});

/**
 * Approve all entries for a week/project/employee
 */
router.put('/approvals/approve-week', async (req, res) => {
    try {
        const { managerId, projectId, employeeId, weekStartDate } = req.body;

        if (!managerId || !projectId || !employeeId || !weekStartDate) {
            return res.status(400).json({
                message: 'managerId, projectId, employeeId, and weekStartDate are required'
            });
        }

        // Check if project exists in Projects collection (for authorization)
        const managedProject = await Project.findOne({
            projectId,
            'projectManager.employeeId': managerId
        }).select('projectId');

        // For testing: If project not in DB, log warning but continue
        if (!managedProject) {
            console.warn(`[Approve Week] Project ${projectId} not found in Projects collection for manager ${managerId}. Proceeding...`);
        }

        const weekStart = new Date(String(weekStartDate));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const result = await TimesheetEntry.updateMany({
            employeeId,
            projectId: projectId as string,
            date: { $gte: weekStart, $lte: weekEnd },
            status: 'submitted',
            approvalStatus: { $in: ['pending', 'revision_requested'] }
        }, {
            $set: {
                approvalStatus: 'approved',
                approvedBy: managerId,
                approvedAt: new Date()
            }
        });

        res.json({ updatedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error approving week:', error);
        res.status(500).json({ message: 'Failed to approve week' });
    }
});

/**
 * Bulk approve selected days for a project/employee
 */
router.put('/approvals/bulk-approve-days', async (req, res) => {
    try {
        const { managerId, projectId, employeeId, weekStartDate, dayIndices } = req.body;

        if (!managerId || !projectId || !employeeId || !weekStartDate || !Array.isArray(dayIndices)) {
            return res.status(400).json({
                message: 'managerId, projectId, employeeId, weekStartDate, and dayIndices are required'
            });
        }

        if (dayIndices.length === 0) {
            return res.status(400).json({ message: 'dayIndices array cannot be empty' });
        }

        // Check if project exists in Projects collection (for authorization)
        const managedProject = await Project.findOne({
            projectId,
            'projectManager.employeeId': managerId
        }).select('projectId');

        if (!managedProject) {
            console.warn(`[Bulk Approve Days] Project ${projectId} not found in Projects collection for manager ${managerId}. Proceeding...`);
        }

        const weekStart = new Date(String(weekStartDate));

        // Calculate date ranges for selected days
        const bulkOps = dayIndices.map((dayIndex: number) => {
            const startOfDay = new Date(weekStart);
            startOfDay.setDate(startOfDay.getDate() + dayIndex);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(startOfDay);
            endOfDay.setHours(23, 59, 59, 999);

            return {
                updateMany: {
                    filter: {
                        employeeId,
                        projectId: projectId as string,
                        date: { $gte: startOfDay, $lte: endOfDay },
                        status: 'submitted',
                        approvalStatus: { $in: ['pending', 'revision_requested'] }
                    },
                    update: {
                        $set: {
                            approvalStatus: 'approved',
                            approvedBy: managerId,
                            approvedAt: new Date()
                        }
                    }
                }
            };
        });

        const result = await TimesheetEntry.bulkWrite(bulkOps);
        console.log(`[Bulk Approve Days] Approved ${result.modifiedCount} entries for days:`, dayIndices);

        res.json({ updatedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error bulk approving days:', error);
        res.status(500).json({ message: 'Failed to bulk approve days' });
    }
});

/**
 * Request revision for specific days with comment
 */
router.put('/approvals/revision-request', async (req, res) => {
    try {
        console.log('[Revision Request] Received payload:', JSON.stringify(req.body, null, 2));

        const { managerId, projectId, employeeId, weekStartDate, reverts } = req.body;

        if (!managerId || !projectId || !employeeId || !weekStartDate) {
            return res.status(400).json({
                message: 'managerId, projectId, employeeId, and weekStartDate are required'
            });
        }

        if (!Array.isArray(reverts) || reverts.length === 0) {
            return res.status(400).json({ message: 'reverts array is required' });
        }

        // Check if project exists in Projects collection (for authorization)
        const managedProject = await Project.findOne({
            projectId,
            'projectManager.employeeId': managerId
        }).select('projectId');

        // For testing: If project not in DB, log warning but continue
        if (!managedProject) {
            console.warn(`[Revision Request] Project ${projectId} not found in Projects collection for manager ${managerId}. Proceeding...`);
        }

        // Parse weekStartDate correctly to avoid timezone issues
        const [year, month, day] = String(weekStartDate).split('-').map(Number);
        const weekStart = new Date(year, month - 1, day); // month is 0-indexed

        const bulkOps = reverts.map((item: any) => {
            const dayIndex = Number(item.dayIndex);
            const udaId = item.udaId;
            const reason = item.reason;

            // Create date range to match any time on the target day
            const startOfDay = new Date(year, month - 1, day + dayIndex);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(year, month - 1, day + dayIndex);
            endOfDay.setHours(23, 59, 59, 999);

            console.log(`[Revision Request] Creating update for:`, {
                employeeId,
                projectId,
                udaId,
                dateRange: `${startOfDay.toISOString()} to ${endOfDay.toISOString()}`,
                dayIndex,
                reason,
                weekStartInput: weekStartDate
            });

            return {
                updateOne: {
                    filter: {
                        employeeId,
                        projectId: projectId as string,
                        udaId,
                        date: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        },
                        status: 'submitted'
                    },
                    update: {
                        $set: {
                            approvalStatus: 'revision_requested',
                            rejectedReason: reason,
                            approvedBy: managerId
                        }
                    }
                }
            };
        });

        console.log(`[Revision Request] Executing ${bulkOps.length} bulk operations...`);
        console.log(`[Revision Request] Sample filter:`, bulkOps[0]?.updateOne?.filter);

        // Check if entries exist before updating
        for (const op of bulkOps) {
            const filter = op.updateOne.filter;
            const existingEntry = await TimesheetEntry.findOne(filter).select('date udaId approvalStatus status');
            console.log(`[Revision Request] Checking entry with date ${filter.date}:`, existingEntry ? {
                found: true,
                date: existingEntry.date.toISOString().split('T')[0],
                udaId: existingEntry.udaId,
                status: existingEntry.status,
                approvalStatus: existingEntry.approvalStatus
            } : { found: false });
        }

        const result = await TimesheetEntry.bulkWrite(bulkOps);
        console.log(`[Revision Request] Result:`, {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
            upsertedCount: result.upsertedCount
        });

        // Fetch and log the updated entries to verify
        const updatedEntries = await TimesheetEntry.find({
            employeeId,
            projectId: projectId as string,
            date: { $gte: weekStart, $lte: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000) }
        }).select('date udaId udaName approvalStatus rejectedReason projectId');

        console.log(`[Revision Request] All entries for this week after update:`,
            updatedEntries.map(e => ({
                date: e.date.toISOString().split('T')[0],
                udaId: e.udaId,
                udaName: e.udaName,
                approvalStatus: e.approvalStatus,
                rejectedReason: e.rejectedReason
            }))
        );

        res.json({ updatedCount: result.modifiedCount });
    } catch (error) {
        console.error('Error requesting revision:', error);
        res.status(500).json({ message: 'Failed to request revision' });
    }
});

/**
 * Get pending approvals for manager (for future approval dashboard)
 */
router.get('/pending-approval/:managerId', async (req, res) => {
    try {
        const { managerId } = req.params;

        // TODO: Join with projects to find entries where managerId is the project manager
        // For now, return all pending entries

        const entries = await TimesheetEntry.find({
            approvalStatus: 'pending'
        }).sort({ submittedAt: -1 }).limit(100);

        res.json(entries);

    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ message: 'Failed to fetch pending approvals' });
    }
});

/**
 * Send reminder to employee for timesheet submission
 */
router.post('/send-reminder', async (req, res) => {
    try {
        const { employeeId, employeeName, managerId, managerName, projectId, projectName, weekStartDate, weekEndDate } = req.body;

        if (!employeeId || !managerId || !weekStartDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: employeeId, managerId, weekStartDate'
            });
        }

        // Create notification for employee
        const notification = new Notification({
            title: 'Timesheet Reminder',
            description: `Please submit your timesheet for week ${weekStartDate} - ${weekEndDate || ''} for ${projectName || 'project'}. Reminder from ${managerName || managerId}.`,
            type: 'reminder',
            userId: employeeId,
            role: 'EMPLOYEE',
            meta: {
                managerId,
                projectId,
                weekStartDate,
                weekEndDate
            }
        });

        await notification.save();

        res.status(201).json({
            success: true,
            message: `Reminder sent to ${employeeName || employeeId}`,
            data: notification
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder'
        });
    }
});

export default router;
