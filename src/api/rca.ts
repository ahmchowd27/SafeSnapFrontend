import { apiClient } from './client';
import {
  RcaAiSuggestions,
  RcaReport,
  CreateRcaReportRequest,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  ImageAnalysisStatus,
} from '@/types';

export const rcaApi = {
  // Get AI-generated RCA suggestions (managers only)
  getRcaSuggestions: async (incidentId: string): Promise<RcaAiSuggestions> => {
    const response = await apiClient.get<RcaAiSuggestions>(`/incidents/${incidentId}/rca/suggestions`);
    return response.data;
  },

  // Mark RCA suggestions as reviewed (managers only)
  reviewRcaSuggestions: async (incidentId: string): Promise<RcaAiSuggestions> => {
    const response = await apiClient.post<RcaAiSuggestions>(`/incidents/${incidentId}/rca/suggestions/review`);
    return response.data;
  },

  // Approve RCA suggestions (managers only)
  approveRcaSuggestions: async (incidentId: string): Promise<RcaAiSuggestions> => {
    const response = await apiClient.post<RcaAiSuggestions>(`/incidents/${incidentId}/rca/suggestions/approve`);
    return response.data;
  },

  // Create final RCA report (managers only)
  createRcaReport: async (incidentId: string, data: CreateRcaReportRequest): Promise<RcaReport> => {
    const response = await apiClient.post<RcaReport>(`/incidents/${incidentId}/rca/approve`, data);
    return response.data;
  },
};

export const imageAnalysisApi = {
  // Analyze image for safety hazards
  analyzeImage: async (data: ImageAnalysisRequest): Promise<ImageAnalysisResponse> => {
    const response = await apiClient.post<ImageAnalysisResponse>('/image-analysis/analyze', data);
    return response.data;
  },

  // Check Google Vision API health
  getAnalysisStatus: async (): Promise<ImageAnalysisStatus> => {
    const response = await apiClient.get<ImageAnalysisStatus>('/image-analysis/status');
    return response.data;
  },
};
