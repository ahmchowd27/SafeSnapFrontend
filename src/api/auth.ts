import { apiClient } from './client';
import { AuthResponse, BackendAuthResponse, LoginRequest, RegisterRequest } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<BackendAuthResponse>('/auth/login', data);
    
    // Transform backend response to frontend format
    return {
      token: response.data.token,
      user: {
        id: 1, // Backend doesn't seem to return ID, using placeholder
        name: data.email.split('@')[0], // Extract name from email as placeholder
        email: data.email,
        role: response.data.role
      }
    };
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<BackendAuthResponse>('/auth/register', data);
    
    // Transform backend response to frontend format
    return {
      token: response.data.token,
      user: {
        id: 1, // Backend doesn't seem to return ID, using placeholder
        name: data.name,
        email: data.email,
        role: response.data.role
      }
    };
  },

  logout: () => {
    localStorage.removeItem('safesnap_token');
    localStorage.removeItem('safesnap_user');
  },
};
