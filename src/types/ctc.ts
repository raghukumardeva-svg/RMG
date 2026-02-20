export type Currency = 'INR' | 'USD';
export type UOM = 'Annual' | 'Monthly';

export interface CTCHistory {
    actualCTC: number;
    fromDate: string;
    toDate: string;
    currency: Currency;
    uom: UOM;
}

export interface CTCMaster {
    _id?: string;
    id?: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    latestAnnualCTC: number;
    latestActualCurrency: Currency;
    latestActualUOM: UOM;
    latestPlannedCTC: number;
    currency: Currency;
    uom: UOM;
    ctcHistory?: CTCHistory[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CTCFormData {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    latestAnnualCTC: number;
    latestActualCurrency: Currency;
    latestActualUOM: UOM;
    latestPlannedCTC: number;
    currency: Currency;
    uom: UOM;
    ctcHistory?: CTCHistory[];
}

export interface CTCFilters {
    search?: string;
    currency?: Currency;
}

export interface EmployeeSearchResult {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    department?: string;
    designation?: string;
}
