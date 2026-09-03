import api from './api';

export const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
  getAnalytics: async () => {
    const response = await api.get('/analytics');
    return response.data;
  },
};

// Alias for convenience
export const dashboardService = analyticsService;