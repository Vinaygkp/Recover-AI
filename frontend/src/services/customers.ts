import api from './api';

export interface CustomerQueryParams {
  [key: string]: unknown;
}

export const customerService = {
  list: async (params?: CustomerQueryParams) => {
    try {
      const response = await api.get('/customers', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve customer directory list', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve customer details for ID: ${id}`, error);
      throw error;
    }
  }
};