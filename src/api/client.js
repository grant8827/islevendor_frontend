const TOKEN_STORAGE_KEY = 'islevendor_token';

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * Thin fetch wrapper — attaches the JWT, parses JSON, and turns non-2xx
 * responses into thrown Errors with the API's error message.
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

/**
 * Uploads an image file and returns its URL. Separate from apiRequest
 * because FormData needs the browser to set its own multipart Content-Type
 * (with boundary) — setting it manually breaks the upload.
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = getToken();
  const res = await fetch('/api/uploads/image', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Upload failed with status ${res.status}`);
  }
  return data.url;
}
