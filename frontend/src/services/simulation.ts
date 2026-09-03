import api from './api';

export interface SimulationPayload {
  case_ids?: string[];
  batch_size?: number;
  [key: string]: unknown;
}

export const simulationService = {
  runSimulation: async (data?: SimulationPayload) => {
    try {
      const response = await api.post('/simulation/run', data || {});
      return response.data;
    } catch (error) {
      console.error('Failed to execute simulation run', error);
      throw error;
    }
  },

  getJobStatus: async (jobId: string) => {
    try {
      const response = await api.get(`/simulation/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to retrieve job status for ${jobId}`, error);
      throw error;
    }
  },

  generateDemoData: async () => {
    try {
      const response = await api.post('/demo/generate-data');
      return response.data;
    } catch (error) {
      console.error('Failed to generate demo dataset', error);
      throw error;
    }
  },

  generateDemo: async () => {
    try {
      const response = await api.post('/demo/generate-data');
      return response.data;
    } catch (error) {
      console.error('Failed to generate demo dataset', error);
      throw error;
    }
  },

  run: async (data?: SimulationPayload) => {
    try {
      const response = await api.post('/simulation/run', data || {});
      return response.data;
    } catch (error) {
      console.error('Failed to execute simulation run', error);
      throw error;
    }
  },
};