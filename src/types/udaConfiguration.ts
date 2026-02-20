export interface UDAConfiguration {
    _id?: string;
    id?: string;
    udaNumber: string;
    name: string;
    description: string;
    parentUDA?: string;
    type: string;
    billable: 'Billable' | 'Non-Billable';
    projectRequired: 'Y' | 'N';
    active: 'Y' | 'N';
    createdAt?: string;
    updatedAt?: string;
}

export interface UDAConfigurationFilters {
    active?: string;
    type?: string;
    search?: string;
}

export interface UDAConfigurationFormData {
    udaNumber: string;
    name: string;
    description: string;
    parentUDA?: string;
    type: string;
    billable: 'Billable' | 'Non-Billable';
    projectRequired: 'Y' | 'N';
    active: 'Y' | 'N';
}

export interface CreateUDAConfigurationDTO extends UDAConfigurationFormData { }

export interface UpdateUDAConfigurationDTO extends Partial<UDAConfigurationFormData> {
    id: string;
}
