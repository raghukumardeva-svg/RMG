export interface CustomerPO {
  _id: string;
  contractNo: string;
  poNo: string;
  customerId: string | { _id: string; customerName: string; customerNo: string };
  projectId: string | { _id: string; projectName: string; projectId: string };
  customerName: string;
  bookingEntity: 'Eviden' | 'Habile' | 'Akraya' | 'ECIS';
  poCreationDate: string;
  poStartDate: string;
  poValidityDate: string;
  poAmount: number;
  poCurrency: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60' | 'Net 90' | 'Immediate' | 'Custom';
  autoRelease: boolean;
  status: 'Active' | 'Closed' | 'Expired';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPOFormData {
  contractNo: string;
  poNo: string;
  customerId: string;
  projectId: string;
  bookingEntity: 'Eviden' | 'Habile' | 'Akraya' | 'ECIS';
  poCreationDate: string;
  poStartDate: string;
  poValidityDate: string;
  poAmount: number;
  poCurrency: string;
  paymentTerms: 'Net 30' | 'Net 45' | 'Net 60' | 'Net 90' | 'Immediate' | 'Custom';
  autoRelease: boolean;
  status: 'Active' | 'Closed' | 'Expired';
  notes?: string;
}

export interface CustomerPOFilters {
  search: string;
  status: string;
  bookingEntity: string;
  customerId: string;
  projectId: string;
}

export interface CustomerPOStats {
  total: number;
  active: number;
  closed: number;
  expired: number;
  totalActiveAmount: number;
}
