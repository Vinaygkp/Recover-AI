import api from './api';

export interface AuditQueryParams {
  event_type?: string;
  case_id?: string;
  limit?: number;
  skip?: number;
  [key: string]: unknown;
}

export const auditService = {
  list: async (params?: AuditQueryParams) => {
    try {
      const response = await api.get('/audit', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch audit log entries', error);
      throw error;
    }
  },
};