import { create } from 'zustand';
import axios from 'axios';
import type { Customer, CustomerFormData, CustomerStats, CustomerFilters } from '@/types/customer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface CustomerStore {
  customers: Customer[];
  selectedCustomer: Customer | null;
  stats: CustomerStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCustomers: (filters?: CustomerFilters) => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  createCustomer: (data: CustomerFormData) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  setSelectedCustomer: (customer: Customer | null) => void;
  clearError: () => void;
}

export const useCustomerStore = create<CustomerStore>((set) => ({
  customers: [],
  selectedCustomer: null,
  stats: null,
  isLoading: false,
  error: null,

  fetchCustomers: async (filters?: CustomerFilters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.region) params.append('region', filters.region);
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get(`${API_URL}/customers?${params.toString()}`);
      set({ customers: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch customers';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/customers/${id}`);
      set({ selectedCustomer: response.data.data, isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to fetch customer';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  createCustomer: async (data: CustomerFormData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/customers`, data);
      const newCustomer = response.data.data;
      
      // Add to customers list
      set(state => ({
        customers: [newCustomer, ...state.customers],
        isLoading: false
      }));

      return newCustomer;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create customer';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCustomer: async (id: string, data: Partial<CustomerFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`${API_URL}/customers/${id}`, data);
      const updatedCustomer = response.data.data;
      
      // Update in customers list
      set(state => ({
        customers: state.customers.map(c => 
          c._id === id || c.id === id ? updatedCustomer : c
        ),
        selectedCustomer: state.selectedCustomer?._id === id || state.selectedCustomer?.id === id 
          ? updatedCustomer 
          : state.selectedCustomer,
        isLoading: false
      }));

      return updatedCustomer;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update customer';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteCustomer: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`${API_URL}/customers/${id}`);
      
      // Remove from customers list
      set(state => ({
        customers: state.customers.filter(c => c._id !== id && c.id !== id),
        selectedCustomer: state.selectedCustomer?._id === id || state.selectedCustomer?.id === id
          ? null
          : state.selectedCustomer,
        isLoading: false
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete customer';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/customers/stats`);
      set({ stats: response.data.data });
    } catch (error: unknown) {
      console.error('Failed to fetch customer stats:', error);
    }
  },

  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },

  clearError: () => {
    set({ error: null });
  }
}));
