import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiError, RateLimitError } from '@/types';

export class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('safesnap_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('safesnap_token');
          localStorage.removeItem('safesnap_user');
          window.location.href = '/login';
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const rateLimitError: RateLimitError = error.response.data as RateLimitError;
          throw new Error(`Rate limit exceeded: ${rateLimitError.message}. Try again in ${rateLimitError.retryAfterSeconds} seconds.`);
        }

        // Handle API errors
        if (error.response?.data) {
          const apiError = error.response.data as ApiError;
          throw new Error(apiError.message || 'An error occurred');
        }

        throw error;
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
