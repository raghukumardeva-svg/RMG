/**
 * Utility functions to transform timesheet data between week-based (UI) format
 * and date-based (database) format
 */

/**
 * Convert week-based timesheet rows to date-based entries
 * Used when frontend submits weekly data to be stored in database
 * 
 * @param employeeId - Employee identifier
 * @param employeeName - Employee name
 * @param weekStartDate - Monday of the week (Date object)
 * @param rows - Array of timesheet rows with 7-day hours/comments
 * @returns Array of date-based timesheet entries
 */
export function weekRowsToDateEntries(
    employeeId: string,
    employeeName: string,
    weekStartDate: Date,
    rows: any[]
): any[] {
    const entries: any[] = [];

    rows.forEach((row) => {
        // Each row has 7 hours (Mon-Sun)
        row.hours.forEach((hours: string | null, dayIndex: number) => {
            // Skip if no hours for this day
            if (!hours || hours === '00:00' || hours === '0:00' || hours === '0' || hours === '') {
                return;
            }

            // Calculate the date for this day
            const entryDate = new Date(weekStartDate);
            entryDate.setDate(entryDate.getDate() + dayIndex);
            entryDate.setUTCHours(0, 0, 0, 0);

            const comment = row.comments && row.comments[dayIndex]
                ? row.comments[dayIndex]
                : null;

            entries.push({
                employeeId,
                employeeName,
                date: entryDate,
                projectId: row.projectId || 'N/A',
                projectCode: row.projectCode,
                projectName: row.projectName,
                udaId: row.udaId,
                udaName: row.udaName,
                type: row.type || 'General',
                financialLineItem: row.financialLineItem || '',
                billable: row.billable,
                hours: hours,
                comment: comment,
                status: 'submitted',
                approvalStatus: 'pending',
                submittedAt: new Date()
            });
        });
    });

    return entries;
}

/**
 * Convert date-based entries to week-based rows for UI display
 * Groups entries by project+UDA and creates 7-day hour arrays
 * 
 * @param weekStartDate - Monday of the week (Date object)
 * @param entries - Array of date-based timesheet entries
 * @returns Array of week-based rows with hours[7] array
 */
export function dateEntriesToWeekRows(
    weekStartDate: Date,
    entries: any[]
): any[] {
    // Create a map to group entries by project+UDA combination
    const rowMap = new Map<string, any>();

    entries.forEach((entry) => {
        const key = `${entry.projectId}|${entry.udaId}`;

        // Initialize row if it doesn't exist
        if (!rowMap.has(key)) {
            rowMap.set(key, {
                projectId: entry.projectId,
                projectCode: entry.projectCode,
                projectName: entry.projectName,
                udaId: entry.udaId,
                udaName: entry.udaName,
                type: entry.type,
                financialLineItem: entry.financialLineItem,
                billable: entry.billable,
                hours: new Array(7).fill('00:00'),
                comments: new Array(7).fill(null)
            });
        }

        const row = rowMap.get(key);

        // Calculate day index (0=Mon, 6=Sun)
        const entryDate = new Date(entry.date);
        entryDate.setHours(0, 0, 0, 0);

        const weekStart = new Date(weekStartDate);
        weekStart.setHours(0, 0, 0, 0);

        const dayIndex = Math.floor(
            (entryDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only set hours if day is within the week (0-6)
        if (dayIndex >= 0 && dayIndex < 7) {
            row.hours[dayIndex] = entry.hours || '00:00';
            row.comments[dayIndex] = entry.comment || null;
        }
    });

    return Array.from(rowMap.values());
}

/**
 * Calculate total hours from timesheet entries
 * Parses "HH:MM" format and returns decimal hours
 * 
 * @param entries - Array of date-based timesheet entries
 * @returns Total hours as decimal number
 */
export function calculateTotalHours(entries: any[]): number {
    let totalMinutes = 0;

    entries.forEach((entry) => {
        const hours = entry.hours || '00:00';

        // Parse hours in "HH:MM" format
        const parts = hours.split(':');
        if (parts.length === 2) {
            const hoursNum = parseInt(parts[0], 10) || 0;
            const minutesNum = parseInt(parts[1], 10) || 0;
            totalMinutes += hoursNum * 60 + minutesNum;
        } else {
            // Try parsing as decimal (e.g., "8.5")
            const decimal = parseFloat(hours) || 0;
            totalMinutes += decimal * 60;
        }
    });

    // Convert back to decimal hours
    return Math.round((totalMinutes / 60) * 100) / 100;
}

/**
 * Determine overall status based on all entries
 * - If any entry is rejected -> 'rejected'
 * - If all entries are approved -> 'approved'
 * - If all entries are draft -> 'draft'
 * - Otherwise -> 'submitted' (pending approval)
 * 
 * @param entries - Array of date-based timesheet entries
 * @returns Overall status string
 */
export function determineOverallStatus(
    entries: any[]
): 'draft' | 'submitted' | 'approved' | 'rejected' {
    if (entries.length === 0) {
        return 'draft';
    }

    // Check approval statuses
    const hasRejected = entries.some(
        (entry) => entry.approvalStatus === 'rejected'
    );

    if (hasRejected) {
        return 'rejected';
    }

    const allApproved = entries.every(
        (entry) => entry.approvalStatus === 'approved'
    );

    if (allApproved) {
        return 'approved';
    }

    const allDraft = entries.every(
        (entry) => entry.status === 'draft'
    );

    if (allDraft) {
        return 'draft';
    }

    // Default to submitted (pending approval)
    return 'submitted';
}
