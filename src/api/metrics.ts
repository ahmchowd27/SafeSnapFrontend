import { apiClient } from './client';
import { MetricsSummary, RcaStatistics } from '@/types';

export const metricsApi = {
  // Get business metrics summary
  getSummary: async (): Promise<MetricsSummary> => {
    const response = await apiClient.get<MetricsSummary>('/metrics/summary');
    return response.data;
  },

  // Get RCA statistics (managers only)
  getRcaStatistics: async (): Promise<RcaStatistics> => {
    const response = await apiClient.get<RcaStatistics>('/rca/statistics');
    return response.data;
  },
};
