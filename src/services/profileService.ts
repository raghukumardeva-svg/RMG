import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/profiles`;

export interface ProfileUpdateData {
  summary?: string;
  personalEmail?: string;
  workPhone?: string;
  emergencyContact?: string;
  gender?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  bloodGroup?: string;
  nationality?: string;
  panNumber?: string;
  aadharNumber?: string;
  passportNumber?: string;
  currentAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  permanentAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  employmentType?: string;
  noticePeriod?: string;
  photo?: string;
}

export interface ProfileSectionData {
  [key: string]: string | number | boolean | object | undefined;
}

export const profileService = {
  getProfile: async (employeeId: string) => {
    const response = await axios.get(`${API_URL}/${employeeId}`);
    return response.data.data;
  },

  updateProfile: async (employeeId: string, data: ProfileUpdateData) => {
    const response = await axios.put(`${API_URL}/${employeeId}`, data);
    return response.data.data;
  },

  updateSection: async (employeeId: string, section: string, data: ProfileSectionData) => {
    const response = await axios.patch(`${API_URL}/${employeeId}/${section}`, data);
    return response.data.data;
  }
};
