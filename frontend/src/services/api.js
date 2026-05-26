import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'X-Company-ID': '1',   // Default tenant — swap with auth context once auth lands
    'X-User': 'Analyst',
  },
});

// ── Response interceptor: normalize errors ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      error?.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── Stats ─────────────────────────────────────────────────────────────────────
export const fetchStats = () => api.get('/stats').then((r) => r.data);

// ── Emission Records ──────────────────────────────────────────────────────────
export const fetchRecords = (params = {}) =>
  api.get('/records', { params }).then((r) => r.data);

export const approveRecord = (id) =>
  api.patch(`/records/${id}/approve`).then((r) => r.data);

export const rejectRecord = (id) =>
  api.patch(`/records/${id}/reject`).then((r) => r.data);

export const editRecord = (id, payload) =>
  api.patch(`/records/${id}/edit`, payload).then((r) => r.data);

// ── Uploads ───────────────────────────────────────────────────────────────────
const uploadCSV = (endpoint, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    .then((r) => r.data);
};

export const uploadSAP = (file, onProgress) =>
  uploadCSV('/upload/sap', file, onProgress);

export const uploadUtility = (file, onProgress) =>
  uploadCSV('/upload/utility', file, onProgress);

export const uploadTravel = (file, onProgress) =>
  uploadCSV('/upload/travel', file, onProgress);

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const fetchAuditLogs = () => api.get('/audit-logs').then((r) => r.data);

// ── Data Sources ─────────────────────────────────────────────────────────────
export const fetchDataSources = () => api.get('/data-sources').then((r) => r.data);

export default api;

