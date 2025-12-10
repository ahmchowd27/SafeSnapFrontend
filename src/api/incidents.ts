import { apiClient } from './client';
import {
  IncidentListResponse,
  IncidentDetail,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  IncidentQueryParams,
  IncidentStatus,
} from '@/types';

export const incidentsApi = {
  // Get user's incidents (paginated) with frontend proxy URLs
  getMyIncidents: async (params?: IncidentQueryParams): Promise<IncidentListResponse> => {
    const response = await apiClient.get<IncidentListResponse>('/incidents/frontend', { params });
    return response.data;
  },

  // Get all team incidents (managers only) with frontend proxy URLs
  getAllIncidents: async (params?: IncidentQueryParams): Promise<IncidentListResponse> => {
    const response = await apiClient.get<IncidentListResponse>('/incidents/all/frontend', { params });
    return response.data;
  },

  // Get specific incident details with frontend proxy URLs
  getIncident: async (id: string): Promise<IncidentDetail> => {
    const response = await apiClient.get<IncidentDetail>(`/incidents/${id}/frontend`);
    return response.data;
  },

  // Create new incident
  createIncident: async (data: CreateIncidentRequest): Promise<IncidentDetail> => {
    const response = await apiClient.post<IncidentDetail>('/incidents', data);
    return response.data;
  },

  // Update existing incident
  updateIncident: async (id: string, data: UpdateIncidentRequest): Promise<IncidentDetail> => {
    const response = await apiClient.put<IncidentDetail>(`/incidents/${id}`, data);
    return response.data;
  },

  // Delete incident (managers only)
  deleteIncident: async (id: string): Promise<void> => {
    await apiClient.delete(`/incidents/${id}`);
  },

  // Update incident status (managers only)
  updateStatus: async (id: string, status: IncidentStatus): Promise<IncidentDetail> => {
    const response = await apiClient.patch<IncidentDetail>(`/incidents/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  // Assign incident (managers only)
  assignIncident: async (id: string, assigneeEmail: string): Promise<IncidentDetail> => {
    const response = await apiClient.patch<IncidentDetail>(`/incidents/${id}/assign`, null, {
      params: { assigneeEmail },
    });
    return response.data;
  },
};
