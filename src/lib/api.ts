import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  links?: Record<string, unknown>;
  errors?: Record<string, unknown | string[]>;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send current locale to backend for translated responses
    const locale = localStorage.getItem('civictwin-locale') || 'en';
    config.headers['Accept-Language'] = locale;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const method = response.config.method?.toLowerCase();
    if (method && ['post', 'put', 'patch', 'delete'].includes(method)) {
      if (response.data?.success && response.data?.message) {
        toast.success(response.data.message);
      }
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.message || 'An error occurred.';

    switch (status) {
      case 401:
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          if (!['/', '/login'].includes(window.location.pathname)) {
            toast.error(message);
            window.location.href = '/';
          }
        }
        break;
      case 403:
      case 404:
      case 422:
      case 500:
      default:
        toast.error(message);
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
