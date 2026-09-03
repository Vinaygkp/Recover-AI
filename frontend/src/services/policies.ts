import api from './api';

export const policyService = {
  get: async () => {
    try {
      const response = await api.get('/policies');
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve policy configuration settings', error);
      throw error;
    }
  },

  update: async (data: Record<string, unknown>) => {
    try {
      const response = await api.put('/policies', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update policy configuration settings', error);
      throw error;
    }
  },
};