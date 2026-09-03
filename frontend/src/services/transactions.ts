import api from './api';

export interface TransactionQueryParams {
  status?: string;
  search?: string;
  limit?: number;
  skip?: number;
  [key: string]: unknown;
}

export const transactionService = {
  list: async (params?: TransactionQueryParams) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve transactions list', error);
      throw error;
    }
  },

  getAll: async (params?: TransactionQueryParams) => {
    try {
      const response = await api.get('/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve all transactions ledger (getAll)', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve transaction record for ID: ${id}`, error);
      throw error;
    }
  },
};