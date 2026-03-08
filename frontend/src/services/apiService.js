/** API base: set VITE_API_URL in Amplify env vars (e.g. https://xxx.execute-api.region.amazonaws.com/Prod) so build uses it; local dev uses /api (Vite proxy). */
export function getApiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (env) return env.replace(/\/$/, '') + '/api';
  return '/api';
}

const API_BASE_URL = getApiBase();

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok && response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  return response;
}

export async function uploadFile(file, endpoint = '/uploads') {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });
  
  return response;
}

export const API = {
  baseUrl: API_BASE_URL,
  
  // Auth
  sendOTP: (mobile) => apiRequest('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile }),
    skipAuth: true
  }),
  
  verifyOTP: (mobile, otp) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ mobile, otp }),
    skipAuth: true
  }),
  
  // Profiles
  getProfiles: () => apiRequest('/profiles'),
  createProfile: (profile) => apiRequest('/profiles', {
    method: 'POST',
    body: JSON.stringify(profile)
  }),
  updateProfile: (id, profile) => apiRequest(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(profile)
  }),
  deleteProfile: (id) => apiRequest(`/profiles/${id}`, {
    method: 'DELETE'
  }),
  
  // Schemes
  getSchemes: () => apiRequest('/schemes', { skipAuth: true }),
  getEligibleSchemes: (profile) => apiRequest('/schemes/eligible', {
    method: 'POST',
    body: JSON.stringify(profile),
    skipAuth: true
  }),
  
  // Applications
  getApplications: () => apiRequest('/applications'),
  createApplication: (application) => apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(application)
  }),
  updateApplicationStatus: (id, status) => apiRequest(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  
  // AI Services
  chatWithAI: (query, language = 'en') => apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ query, language })
  }),
  
  textToSpeech: (text, language = 'en') => apiRequest('/ai/speech', {
    method: 'POST',
    body: JSON.stringify({ text, language })
  }),
  
  translateText: (text, sourceLanguage, targetLanguage) => apiRequest('/ai/translate', {
    method: 'POST',
    body: JSON.stringify({ text, sourceLanguage, targetLanguage })
  }),
  
  // Uploads
  uploadFile: (file) => uploadFile(file),
  
  // Admin
  getPendingSchemes: (adminToken) => apiRequest('/admin/pending-schemes', {
    headers: { 'x-admin-token': adminToken }
  }),
  
  approveScheme: (schemeId, adminToken) => apiRequest(`/admin/approve-scheme/${schemeId}`, {
    method: 'POST',
    headers: { 'x-admin-token': adminToken }
  }),
  
  rejectScheme: (schemeId, adminToken) => apiRequest(`/admin/reject-scheme/${schemeId}`, {
    method: 'POST',
    headers: { 'x-admin-token': adminToken }
  })
};

export default API;
