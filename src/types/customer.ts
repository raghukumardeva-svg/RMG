export type Region = 'UK' | 'India' | 'USA' | 'ME' | 'Other';
export type CustomerStatus = 'Active' | 'Inactive';

export interface Customer {
  _id?: string;
  id?: string;
  customerNo: string;
  customerName: string;
  hubspotRecordId?: string;
  industry: string;
  region: Region;
  regionHead?: string;
  status: CustomerStatus;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CustomerFormData {
  customerNo: string;
  customerName: string;
  hubspotRecordId?: string;
  industry: string;
  region: Region;
  regionHead?: string;
  status: CustomerStatus;
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  byRegion: Array<{
    _id: Region;
    count: number;
  }>;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  region?: Region;
  search?: string;
}
