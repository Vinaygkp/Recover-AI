import api from './api';

export interface RecoveryCaseQueryParams {
  status?: string;
  priority?: string;
  limit?: number;
  skip?: number;
  has_ai_diagnosis?: boolean;
  [key: string]: unknown;
}

export const recoveryService = {
  getCases: async (params?: RecoveryCaseQueryParams) => {
    try {
      const response = await api.get('/recovery/cases', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve recovery cases list', error);
      throw error;
    }
  },

  getCaseById: async (id: string) => {
    try {
      const response = await api.get(`/recovery/cases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve recovery case details for ID: ${id}`, error);
      throw error;
    }
  },

  getCase: async (id: string) => { // alias
    try {
      const response = await api.get(`/recovery/cases/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve recovery case for ID: ${id}`, error);
      throw error;
    }
  },

  retry: async (id: string) => {
    try {
      const response = await api.post(`/recovery/${id}/retry`);
      return response.data;
    } catch (error) {
      console.error(`Failed to execute retry intervention for recovery case ID: ${id}`, error);
      throw error;
    }
  },

  remind: async (id: string) => {
    try {
      const response = await api.post(`/recovery/${id}/remind`);
      return response.data;
    } catch (error) {
      console.error(`Failed to dispatch reminder intervention for recovery case ID: ${id}`, error);
      throw error;
    }
  },

  manualReview: async (id: string) => {
    try {
      const response = await api.post(`/recovery/${id}/manual-review`);
      return response.data;
    } catch (error) {
      console.error(`Failed to flag manual review for recovery case ID: ${id}`, error);
      throw error;
    }
  },

  stop: async (id: string) => {
    try {
      const response = await api.post(`/recovery/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error(`Failed to stop recovery workflow for case ID: ${id}`, error);
      throw error;
    }
  },
};