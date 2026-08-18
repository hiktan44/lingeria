const configuredBackendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();

// Production defaults to the same origin. Next rewrites /api and /health to the
// internal backend, so browser bundles never fall back to localhost.
const BACKEND_URL = (configuredBackendUrl || '').replace(/\/$/, '');

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : { error: (await response.text()) || `API error: ${response.status}` };

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

export const api = {
  getToken,
  setToken,
  removeToken,

  async register(email: string, password: string) {
    const data = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) setToken(data.token);
    return data;
  },

  async logout() {
    removeToken();
  },

  async getMe() {
    return apiRequest('/api/v1/auth/me');
  },

  async getBalance() {
    return apiRequest('/api/v1/user/balance');
  },

  async getGenerations() {
    return apiRequest('/api/v1/user/generations');
  },

  async translate(text: string) {
    return apiRequest('/api/v1/ai/translate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async analyzeImage(image: string) {
    return apiRequest('/api/v1/ai/analyze-image', {
      method: 'POST',
      body: JSON.stringify({ image }),
    });
  },

  async generate(body: any) {
    return apiRequest('/api/v1/ai/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async getTask(taskId: string) {
    return apiRequest(`/api/v1/ai/task/${taskId}`);
  },
};

export { BACKEND_URL };
