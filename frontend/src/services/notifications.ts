import api from './api';

export const notificationService = {
  list: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve notification list', error);
      throw error;
    }
  },

  markRead: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Failed to mark notification ID ${id} as read`, error);
      throw error;
    }
  },
};