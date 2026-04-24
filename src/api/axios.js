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
export const registerTenant = (data) => axios.post(`${API_URL}/auth/register/`, data);
export const requestPasswordReset = (data) => axios.post(`${API_URL}/auth/password/reset/`, data);
export const confirmPasswordReset = (data) => axios.post(`${API_URL}/auth/password/confirm/`, data);

// --- VEHÍCULOS ---
export const getVehicles = (params) => api.get('/fleet/vehicles/', { params });
export const createVehicle = (data) => api.post('/fleet/vehicles/', data);
export const updateVehicle = (id, data) => api.put(`/fleet/vehicles/${id}/`, data);
export const deleteVehicle = (id) => api.delete(`/fleet/vehicles/${id}/`);
export const unassignDriverFromVehicle = (id) => api.post(`/fleet/vehicles/${id}/unassign-driver/`);
export const getVehicleStatus = (id) => api.get(`/fleet/vehicles/${id}/status/`);

// --- CONDUCTORES ---
export const getDrivers = (params) => api.get('/fleet/drivers/', { params });
export const createDriver = (data) => api.post('/fleet/drivers/', data);
export const updateDriver = (id, data) => api.put(`/fleet/drivers/${id}/`, data);
export const deleteDriver = (id) => api.delete(`/fleet/drivers/${id}/`);
export const assignDriver = (id, vehicle_id) => api.post(`/fleet/drivers/${id}/assign/`, { vehicle_id });

// --- ALERTAS (Reglas y Eventos) ---
export const getAlertRules = (params) => api.get('/alerts/rules/', { params });
export const createAlertRule = (data) => api.post('/alerts/rules/', data);
export const updateAlertRule = (id, data) => api.put(`/alerts/rules/${id}/`, data);
export const deleteAlertRule = (id) => api.delete(`/alerts/rules/${id}/`);

export const getAlerts = (params) => api.get('/alerts/', { params });
export const markAlertAsRead = (id) => api.patch(`/alerts/${id}/`, { is_read: true });

// --- GEOCERCAS ---
export const getGeofences = (params) => api.get('/geofences/', { params });
export const createGeofence = (data) => api.post('/geofences/', data);
export const updateGeofence = (id, data) => api.put(`/geofences/${id}/`, data);
export const deleteGeofence = (id) => api.delete(`/geofences/${id}/`);

// --- VIAJES E HISTORIAL GPS ---
export const getTrips = (params) => api.get('/gps/trips/', { params });
export const getTripDetail = (id) => api.get(`/gps/trips/${id}/`);
export const getGpsHistory = (params) => api.get('/gps/history/', { params });
export const getAnalyticsSummary = () => api.get('/analytics/summary/');

export default api;
