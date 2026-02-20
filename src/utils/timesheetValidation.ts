/**
 * Validates and formats a time string in HH:mm format.
 * Returns the formatted string if valid, or null if invalid.
 */
export const validateAndFormatTime = (value: string): string | null => {
    if (!value) return "00:00";

    if (value.includes(":")) {
        const parts = value.split(":");
        if (parts.length === 2) {
            let hours = parts[0].replace(/^0+/, "") || "0";
            let minutes = parts[1].padEnd(2, "0").substring(0, 2);

            let hoursNum = parseInt(hours, 10);
            let minutesNum = parseInt(minutes, 10);

            if (isNaN(hoursNum) || isNaN(minutesNum) || minutesNum >= 60) {
                return null; // Invalid time
            }

            return `${hoursNum.toString().padStart(2, '0')}:${minutesNum.toString().padStart(2, '0')}`;
        }
    } else if (/^\d+$/.test(value)) {
        const hoursNum = parseInt(value, 10);
        if (!isNaN(hoursNum)) {
            return `${hoursNum.toString().padStart(2, '0')}:00`;
        }
    }

    return null;
};

/**
 * Calculates the total decimal hours for a day from row's hours.
 */
export const calculateTotalDayHours = (rows: any[], dayIdx: number): number => {
    return rows.reduce((sum, row) => {
        const val = row.hours[dayIdx] || "00:00";
        const [h, m] = val.split(":").map((v: string) => parseInt(v) || 0);
        return sum + h + m / 60;
    }, 0);
};

/**
 * Checks if projects have expired.
 */
export const isProjectExpired = (projectEndDate: string | Date | undefined): boolean => {
    if (!projectEndDate) return false;
    const endDate = new Date(projectEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
};
