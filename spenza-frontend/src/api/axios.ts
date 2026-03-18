import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '../store/auth.store';
import { ApiService } from './api.service';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const requestId = uuidv4();
  config.headers['X-Request-ID'] = requestId;

  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, login, logout } = useAuthStore.getState();
      
      if (refreshToken) {
        try {
          const res = await ApiService.refresh(refreshToken);

          if (res.data.code === 200) {
            const newAccessToken = res.data.data[0].accessToken;
            const user = useAuthStore.getState().user;
            
            if (user) {
              login(newAccessToken, refreshToken, user);
            }
            
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axios(originalRequest);
          }
        } catch (refreshError: unknown) {
          logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
