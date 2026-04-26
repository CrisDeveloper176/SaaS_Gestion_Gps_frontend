import axios from 'axios';

// Read from environment variables — set in .env.local for local dev
// NEVER hardcode URLs here; use .env.example as a reference
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: inject the access token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: transparently refresh the access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Guard against infinite retry loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token available');

        const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);

        // Update the failed request's Authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (err) {
        // Refresh expired or invalid — signal AuthContext to perform a clean logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Dispatch event instead of navigating directly; AuthContext listens and calls
        // logout() which clears React state and navigates via React Router.
        window.dispatchEvent(new Event('auth:session-expired'));
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// ── Public (unauthenticated) helpers ───────────────────────────────────────
export const loginRequest = (username, password) =>
  axios.post(`${API_URL}/auth/login/`, { username, password });
export const registerTenant = (data) => axios.post(`${API_URL}/auth/register/`, data);
export const requestPasswordReset = (data) => axios.post(`${API_URL}/auth/password/reset/`, data);
export const confirmPasswordReset = (data) => axios.post(`${API_URL}/auth/password/confirm/`, data);

// ── Vehículos ──────────────────────────────────────────────────────────────
export const getVehicles = (params) => api.get('/fleet/vehicles/', { params });
export const createVehicle = (data) => api.post('/fleet/vehicles/', data);
export const updateVehicle = (id, data) => api.put(`/fleet/vehicles/${id}/`, data);
export const deleteVehicle = (id) => api.delete(`/fleet/vehicles/${id}/`);
export const unassignDriverFromVehicle = (id) => api.post(`/fleet/vehicles/${id}/unassign-driver/`);
export const getVehicleStatus = (id) => api.get(`/fleet/vehicles/${id}/status/`);

// ── Conductores ────────────────────────────────────────────────────────────
export const getDrivers = (params) => api.get('/fleet/drivers/', { params });
export const createDriver = (data) => api.post('/fleet/drivers/', data);
export const updateDriver = (id, data) => api.put(`/fleet/drivers/${id}/`, data);
export const deleteDriver = (id) => api.delete(`/fleet/drivers/${id}/`);
export const assignDriver = (id, vehicle_id) =>
  api.post(`/fleet/drivers/${id}/assign/`, { vehicle_id });

// ── Alertas (Reglas y Eventos) ─────────────────────────────────────────────
export const getAlertRules = (params) => api.get('/alerts/rules/', { params });
export const createAlertRule = (data) => api.post('/alerts/rules/', data);
export const updateAlertRule = (id, data) => api.put(`/alerts/rules/${id}/`, data);
export const deleteAlertRule = (id) => api.delete(`/alerts/rules/${id}/`);

export const getAlerts = (params) => api.get('/alerts/', { params });
export const markAlertAsRead = (id) => api.patch(`/alerts/${id}/`, { is_read: true });

// ── Geocercas ──────────────────────────────────────────────────────────────
export const getGeofences = (params) => api.get('/geofences/', { params });
export const createGeofence = (data) => api.post('/geofences/', data);
export const updateGeofence = (id, data) => api.put(`/geofences/${id}/`, data);
export const deleteGeofence = (id) => api.delete(`/geofences/${id}/`);

// ── Viajes e Historial GPS ─────────────────────────────────────────────────
export const getTrips = (params) => api.get('/gps/trips/', { params });
export const getTripDetail = (id) => api.get(`/gps/trips/${id}/`);
export const getGpsHistory = (params) => api.get('/gps/history/', { params });
export const getAnalyticsSummary = (params) => api.get('/analytics/summary/', { params });

export default api;
