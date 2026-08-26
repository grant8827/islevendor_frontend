import { API_BASE, setToken } from './client.js';

/**
 * Submits one onboarding portal's form as multipart/form-data — text fields
 * plus KYC document files in a single request (see ISLE-105). Unlike
 * apiRequest (api/client.js), this is unauthenticated (no account exists
 * yet) and can't be JSON, since it carries files.
 *
 * `fields`: plain object of strings/booleans/numbers. Array values (e.g.
 * coverageParishes) are appended once per entry so the backend's
 * `toArray()` picks them up. `files`: { fieldName: File }.
 *
 * On success, stores the returned token so the applicant is immediately
 * logged in (their account exists, even while the profile is
 * PENDING_REVIEW) and returns the response body ({ referenceId, status, … }).
 */
async function submitOnboarding(path, fields, files = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      for (const item of value) formData.append(key, item);
    } else {
      formData.append(key, String(value));
    }
  }
  for (const [key, file] of Object.entries(files)) {
    if (file) formData.append(key, file);
  }

  const res = await fetch(`${API_BASE}/api/v1/onboarding/${path}`, { method: 'POST', body: formData });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(data?.error || `Application failed with status ${res.status}`);
  }

  if (data?.token) setToken(data.token);
  return data;
}

export const submitWarehouseApplication = (fields, files) => submitOnboarding('warehouse', fields, files);
export const submitResellerApplication = (fields, files) => submitOnboarding('reseller', fields, files);
export const submitVendorApplication = (fields, files) => submitOnboarding('small-vendor', fields, files);
export const submitDriverApplication = (fields, files) => submitOnboarding('driver', fields, files);
