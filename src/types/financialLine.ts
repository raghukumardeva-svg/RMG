export interface RevenuePlanning {
  month: string;
  plannedUnits: number;
  plannedRevenue: number;
  actualUnits: number;
  forecastedUnits: number;
  variance: number;
}

export interface PaymentMilestone {
  milestoneName: string;
  milestoneAmount: number;
  dueDate: string;
  status: 'Pending' | 'Paid';
}

export interface FinancialLine {
  _id: string;
  flNo: string;
  flName: string;
  projectId: string | { _id: string; projectName: string; projectId: string; startDate: string; endDate: string; billingType: string; currency: string };
  contractType: string;
  locationType: 'Onsite' | 'Offshore' | 'Hybrid';
  executionEntity: string;
  timesheetApprover: string;
  scheduleStart: string;
  scheduleEnd: string;
  currency: string;
  customerPOId: string | { _id: string; poNo: string; contractNo: string; poAmount: number; poCurrency: string };
  poNo: string;
  contractNo: string;
  unitRate: number;
  fundingUnits: number;
  unitUOM: 'Hour' | 'Day' | 'Month';
  fundingValue: number;
  revenuePlanning: RevenuePlanning[];
  paymentMilestones: PaymentMilestone[];
  status: 'Draft' | 'Active' | 'On Hold' | 'Closed' | 'Completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Step 1: Basic Details
export interface FLBasicDetails {
  flName: string;
  projectId: string;
  contractType: string;
  locationType: 'Onsite' | 'Offshore' | 'Hybrid';
  executionEntity: string;
  timesheetApprover: string;
  scheduleStart: string;
  scheduleEnd: string;
  currency: string;
}

// Step 2: Funding Details
export interface FLFundingDetails {
  customerPOId: string;
  poNo: string;
  contractNo: string;
  unitRate: number;
  fundingUnits: number;
  unitUOM: 'Hour' | 'Day' | 'Month';
  fundingValue: number;
}

// Step 3: Revenue Planning
export interface FLRevenuePlanning {
  revenuePlanning: RevenuePlanning[];
}

// Step 4: Payment Milestones
export interface FLPaymentMilestones {
  paymentMilestones: PaymentMilestone[];
}

// Complete FL Form Data (all steps combined)
export interface FinancialLineFormData extends FLBasicDetails, FLFundingDetails, FLRevenuePlanning, FLPaymentMilestones {
  status: 'Draft' | 'Active' | 'On Hold' | 'Closed' | 'Completed';
  notes?: string;
}

export interface FinancialLineFilters {
  search: string;
  status: string;
  locationType: string;
  contractType: string;
  projectId: string;
}

export interface FinancialLineStats {
  total: number;
  active: number;
  draft: number;
  closed: number;
  totalActiveFunding: number;
}
