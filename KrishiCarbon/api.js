function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    if (window.__API_BASE_URL__) return window.__API_BASE_URL__;
    const meta = document.querySelector('meta[name="api-base-url"]');
    if (meta && meta.getAttribute('content')) {
      return meta.getAttribute('content');
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:5000/api';
}

const API_BASE = getApiBaseUrl();

const TOKEN_KEY = 'krishicarbon_token';
const USER_KEY = 'krishicarbon_user';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

function setSession(token, user) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save session to localStorage', e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear session', e);
  }
}

function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  const token = getToken();

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, set json header
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (netErr) {
    console.error('Network error during fetch:', netErr);
    throw new Error('Unable to connect to the KrishiCarbon backend. Please ensure the backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }
    return null;
  }

  if (!response.ok || (data && data.success === false)) {
    if (response.status === 401) {
      clearSession();
      window.dispatchEvent(new CustomEvent('krishi:unauthorized'));
    }

    const errMessage = data?.error?.message || `Request failed with status ${response.status}`;
    const err = new Error(errMessage);
    err.code = data?.error?.code;
    err.details = data?.error?.details;
    err.status = response.status;
    throw err;
  }

  return data.data;
}

export const api = {
  getBaseUrl() {
    return API_BASE;
  },
  auth: {
    async register(payload) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.token) {
        setSession(data.token, data.user);
      }
      return data;
    },
    async login(payload) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.token) {
        setSession(data.token, data.user);
      }
      return data;
    },
    async getMe() {
      const data = await request('/auth/me', { method: 'GET' });
      if (data) {
        setSession(getToken(), data);
      }
      return data;
    },
    logout() {
      clearSession();
      window.dispatchEvent(new CustomEvent('krishi:auth-changed', { detail: null }));
    },
    getToken,
    getUser,
    isAuthenticated() {
      return Boolean(getToken());
    },
  },

  farmers: {
    getMe() {
      return request('/farmers/me', { method: 'GET' });
    },
    updateMe(payload) {
      return request('/farmers/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  farms: {
    createFarm(payload) {
      return request('/farms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getFarms() {
      return request('/farms', { method: 'GET' });
    },
    getFarm(id) {
      return request(`/farms/${id}`, { method: 'GET' });
    },
    updateFarm(id, payload) {
      return request(`/farms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    deleteFarm(id) {
      return request(`/farms/${id}`, { method: 'DELETE' });
    },
  },

  crops: {
    createCrop(payload) {
      return request('/crops', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    getFarmCrops(farmId) {
      return request(`/farms/${farmId}/crops`, { method: 'GET' });
    },
    deleteCrop(id) {
      return request(`/crops/${id}`, { method: 'DELETE' });
    },
  },

  assessments: {
    runAssessment(farmId) {
      return request('/assessments', {
        method: 'POST',
        body: JSON.stringify({ farmId }),
      });
    },
    getAssessment(id) {
      return request(`/assessments/${id}`, { method: 'GET' });
    },
    recalculate(id) {
      return request(`/assessments/${id}/recalculate`, {
        method: 'POST',
      });
    },
    getFarmAssessments(farmId) {
      return request(`/farms/${farmId}/assessments`, { method: 'GET' });
    },
    toggleRecommendation(recommendationId) {
      return request(`/assessments/recommendations/${recommendationId}/toggle`, {
        method: 'PATCH',
      });
    },
  },

  documents: {
    uploadDocument(farmId, type, file) {
      const formData = new FormData();
      formData.append('farmId', farmId);
      formData.append('type', type);
      formData.append('file', file);

      return request('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },
    getFarmDocuments(farmId) {
      return request(`/documents/farm/${farmId}`, { method: 'GET' });
    },
    getEvidenceSummary(farmId) {
      return request(`/documents/farm/${farmId}/evidence-summary`, { method: 'GET' });
    },
    deleteDocument(id) {
      return request(`/documents/${id}`, { method: 'DELETE' });
    },
  },

  admin: {
    getDashboard() {
      return request('/admin/dashboard', { method: 'GET' });
    },
    getFarmers() {
      return request('/admin/farmers', { method: 'GET' });
    },
    getFarms() {
      return request('/admin/farms', { method: 'GET' });
    },
    getAssessments() {
      return request('/admin/assessments', { method: 'GET' });
    },
    getStatistics() {
      return request('/admin/statistics', { method: 'GET' });
    },
    getAuditLogs() {
      return request('/admin/audit-logs', { method: 'GET' });
    },
  },
};

export default api;
