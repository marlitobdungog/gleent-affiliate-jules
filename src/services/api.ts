const API_BASE_URL = '/api';

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toErrorMessage(body: unknown, fallback: string) {
  if (typeof body === "string") {
    const stripped = body.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return stripped || fallback;
  }

  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

async function handleResponse(response: Response) {
  if (response.status === 401) {
    localStorage.removeItem("auth_user");
    const path = window.location.pathname;
    if (!path.includes("/login") && !path.includes("/register")) {
      const loginPath = path.startsWith("/partner") ? "/partner/login" : "/admin/login";
      window.location.href = loginPath;
    }
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const error = body && typeof body === "object" ? body : { message: toErrorMessage(body, response.statusText) };
    throw error;
  }
  if (response.status === 204) return null;
  return body;
}

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  return headers;
};

export const api = {
  get: (url: string) =>
    fetch(`${API_BASE_URL}${url}`, {
        headers: getHeaders(),
        credentials: 'include'
    }).then(handleResponse),
  post: (url: string, data: any) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    }).then(handleResponse),
  put: (url: string, data: any) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
      credentials: 'include'
    }).then(handleResponse),
  delete: (url: string) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include'
    }).then(handleResponse),
};

export const productsApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const applicationsApi = {
  getAll: () => api.get('/applications'),
  getById: (id: string) => api.get(`/applications/${id}`),
  create: (data: any) => api.post('/applications', data),
  update: (id: string, data: any) => api.put(`/applications/${id}`, data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  approve: (id: string) => api.post(`/applications/${id}/approve`, {}),
  reject: (id: string, notes: string) => api.post(`/applications/${id}/reject`, { review_notes: notes }),
  needsMoreInfo: (id: string, notes: string) => api.post(`/applications/${id}/needs-more-info`, { review_notes: notes }),
};

export const partnersApi = {
  getAll: () => api.get('/partners'),
  getById: (id: string) => api.get(`/partners/${id}`),
  create: (data: any) => api.post('/partners', data),
  update: (id: string, data: any) => api.put(`/partners/${id}`, data),
  delete: (id: string) => api.delete(`/partners/${id}`),
  activate: (id: string) => api.post(`/partners/${id}/activate`, {}),
  suspend: (id: string) => api.post(`/partners/${id}/suspend`, {}),
};

export const referralsApi = {
  getAll: () => api.get('/referrals'),
  getById: (id: string) => api.get(`/referrals/${id}`),
  create: (data: any) => api.post('/referrals', data),
  update: (id: string, data: any) => api.put(`/referrals/${id}`, data),
  delete: (id: string) => api.delete(`/referrals/${id}`),
};

export const dealsApi = {
  getAll: () => api.get('/deals'),
  getById: (id: string) => api.get(`/deals/${id}`),
  create: (data: any) => api.post('/deals', data),
  update: (id: string, data: any) => api.put(`/deals/${id}`, data),
  delete: (id: string) => api.delete(`/deals/${id}`),
};

export const commissionsApi = {
  getAll: () => api.get('/commissions'),
  getById: (id: string) => api.get(`/commissions/${id}`),
  create: (data: any) => api.post('/commissions', data),
  update: (id: string, data: any) => api.put(`/commissions/${id}`, data),
  delete: (id: string) => api.delete(`/commissions/${id}`),
  approve: (id: string) => api.post(`/commissions/${id}/approve`, {}),
  reject: (id: string) => api.post(`/commissions/${id}/reject`, {}),
  markForPayout: (id: string) => api.post(`/commissions/${id}/mark-for-payout`, {}),
};

export const payoutsApi = {
  getAll: () => api.get('/payouts'),
  getById: (id: string) => api.get(`/payouts/${id}`),
  create: (data: any) => api.post('/payouts', data),
  update: (id: string, data: any) => api.put(`/payouts/${id}`, data),
  delete: (id: string) => api.delete(`/payouts/${id}`),
  markPaid: (id: string) => api.post(`/payouts/${id}/mark-paid`, {}),
  hold: (id: string) => api.post(`/payouts/${id}/hold`, {}),
  cancel: (id: string) => api.post(`/payouts/${id}/cancel`, {}),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
};

export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

export const authApi = {
  getCsrfCookie: () => fetch('/sanctum/csrf-cookie', { credentials: 'include' }),
  register: async (data: any) => {
    await authApi.getCsrfCookie();
    return api.post('/register', data);
  },
  login: async (data: any) => {
    await authApi.getCsrfCookie();
    return api.post('/login', data);
  },
  logout: () => api.post('/logout', {}),
  me: () => api.get('/me'),
};

export const partnerAuthApi = {
  register: async (data: any) => {
    await authApi.getCsrfCookie();
    return api.post('/partner/register', data);
  },
  login: async (data: any) => {
    await authApi.getCsrfCookie();
    return api.post('/partner/login', data);
  },
};

export const partnerPortalApi = {
  getProfile: () => api.get('/partner/profile'),
  updateProfile: (data: {
    name: string
    email: string
    company_name?: string
    phone?: string
  }) => api.put('/partner/profile', data),
  changePassword: (data: {
    current_password: string
    password: string
    password_confirmation: string
  }) => api.put('/partner/password', data),
  getDashboard: () => api.get('/partner/dashboard'),
  getReferrals: () => api.get('/partner/referrals'),
  submitReferral: (data: {
    product_id: number
    lead_name: string
    lead_email: string
    company_name: string
    notes?: string
  }) => api.post('/partner/referrals', data),
  getLeadStages: () => api.get('/partner/lead-stages'),
  getCommissions: () => api.get('/partner/commissions'),
  getPayouts: () => api.get('/partner/payouts'),
  getProducts: () => api.get('/partner/products'),
  getMarketingAssets: () => api.get('/partner/marketing-assets'),
  downloadMarketingAsset: (assetId: string) => {
    window.open(`/api/partner/marketing-assets/${assetId}/download`, '_blank');
  },
};
