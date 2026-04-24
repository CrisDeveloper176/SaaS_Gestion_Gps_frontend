import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar el refresh del token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Evitar loop infinito si el refresh también falla
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh,
        });
        
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Reintentar la petición original
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (err) {
        // Logout forzado si el refresh expira o falla
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// Helpers de API Críticos
export const loginRequest = (username, password) => 
  axios.post(`${API_URL}/auth/login/`, { username, password });

// Endpoints Auxiliares
export const getVehicles = (params) => api.get('/fleet/vehicles/', { params });
export const getVehicleStatus = (id) => api.get(`/fleet/vehicles/${id}/status/`);
export const getDrivers = (params) => api.get('/fleet/drivers/', { params });
export const getAlerts = (params) => api.get('/alerts/alert-events/', { params });
export const getTrips = (params) => api.get('/trips/', { params });
export const getAnalyticsSummary = () => api.get('/analytics/summary/');

export default api;
