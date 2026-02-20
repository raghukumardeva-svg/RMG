export interface ProjectCatalogItem {
    _id: string;
    projectId: string;
    projectCode?: string; // Optional, defaults to projectId if not set
    projectName: string;
    customerId: string;
    accountName: string;
    legalEntity: string;
    hubspotDealId: string;
    billingType: string;
    practiceUnit: string;
    region: string;
    projectManager: string;
    projectManagerEmployeeId?: string;
    deliveryManager: string;
    industry: string;
    clientType: string;
    revenueType: string;
    projectStartDate: string;
    projectEndDate: string;
    projectCurrency: string;
    estimatedValue: number;
    status: string;
    description: string;
    utilization: number;
    teamSize: number;
    allocationPercentage: number;
    createdAt: string;
    updatedAt: string;
}

export const DEFAULT_DAILY_HOURS = 8;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export const getProjectKey = (project: ProjectCatalogItem) =>
    project.projectId || project._id;

export const isProjectActive = (project: ProjectCatalogItem, today = new Date()) => {
    if (!project.projectEndDate) return true;
    const endDate = new Date(project.projectEndDate);
    endDate.setHours(0, 0, 0, 0);
    const current = new Date(today);
    current.setHours(0, 0, 0, 0);
    return endDate >= current;
};

export const formatProjectLabel = (project: ProjectCatalogItem) => {
    const projectId = project.projectId || project._id || 'N/A';
    const projectName = project.projectName || 'Unnamed Project';
    const allocation = project.allocationPercentage || 0;
    return `${projectId} (${allocation}%) - ${projectName}`;
};

export const normalizeTimeInput = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value) return "00:00";

    if (/^\d{1,2}$/.test(value)) {
        const hours = Number(value);
        if (Number.isNaN(hours) || hours > 23) return null;
        return `${hours.toString().padStart(2, "0")}:00`;
    }

    if (/^\d{1,2}:\d{1,2}$/.test(value)) {
        const [hoursRaw, minutesRaw] = value.split(":");
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        if (hours > 23 || minutes > 59) return null;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    }

    if (TIME_PATTERN.test(value)) {
        const [hoursRaw, minutesRaw] = value.split(":");
        const hours = Number(hoursRaw);
        const minutes = Number(minutesRaw);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        if (hours > 23 || minutes > 59) return null;
        return value;
    }

    return null;
};

export const normalizeTimeValue = (rawValue?: string | null) => {
    if (!rawValue) return "00:00";
    return normalizeTimeInput(rawValue) || "00:00";
};

export const parseTimeToMinutes = (value: string) => {
    if (!TIME_PATTERN.test(value)) return null;
    const [hoursRaw, minutesRaw] = value.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
};

export const formatMinutesToTime = (minutes: number) => {
    const clamped = Math.max(0, Math.min(minutes, 23 * 60 + 59));
    const hours = Math.floor(clamped / 60);
    const mins = clamped % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}`;
};

export const formatHoursDecimal = (minutes: number) => {
    const hours = Math.round((minutes / 60) * 100) / 100;
    return Number.isInteger(hours) ? hours.toString() : hours.toString();
};

export const getAllowedMinutes = (
    totalAllocation: number,
    baseHours = DEFAULT_DAILY_HOURS,
) => {
    const effectiveAllocation = totalAllocation > 0 ? totalAllocation : 100;
    const rawMinutes = Math.round((effectiveAllocation / 100) * baseHours * 60);
    return Math.min(rawMinutes, 23 * 60 + 59);
};

export const sumAllocationPercent = (
    projectIds: string[],
    projects: ProjectCatalogItem[],
) => {
    const uniqueIds = Array.from(new Set(projectIds.filter(Boolean)));
    return uniqueIds.reduce((sum, projectId) => {
        const project = projects.find(
            (item) => item.projectId === projectId || item._id === projectId,
        );
        return sum + (project?.allocationPercentage || 0);
    }, 0);
};
