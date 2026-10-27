const getDefaultApiUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      const proto = window.location.protocol === "https:" ? "https:" : "http:";
      return `${proto}//${host}:5000`;
    }
  }
  return "http://localhost:5000";
};

const RAW_API_URL = ((import.meta.env?.VITE_API_URL) || getDefaultApiUrl()).trim().replace(/\/+$/, "");
const API_URL = RAW_API_URL.replace(/\/api$/, "");
const TOKEN_KEY = "hd_admin_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("zmw_admin_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("zmw_admin_token");
  }
}

/**
 * Thrown for any non-2xx response. Carries the backend's error code/message
 * and, for validation failures, the field-level details array so forms can
 * highlight the right inputs.
 */
export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || [];
  }
}

async function request(path, { method = "GET", body, isFormData = false, params } = {}) {
  const url = new URL(`${API_URL}/api${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, value);
    });
  }

  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body)
    });
  } catch (err) {
    throw new ApiError(
      err?.message ? `Could not reach the server: ${err.message}` : "Could not reach the server. Check your connection and try again.",
      { status: 0, code: "NETWORK_ERROR" }
    );
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    // Empty/non-JSON body (e.g. some 204s) — fine, payload stays null.
  }

  if (!res.ok) {
    const err = payload?.error || {};
    if (res.status === 401) setToken(null);
    throw new ApiError(err.message || payload?.message || `The request failed with status ${res.status}. Please try again.`, {
      status: res.status,
      code: err.code,
      details: err.details
    });
  }

  return payload;
}

export const api = {
  get: (path, params) => request(path, { method: "GET", params }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData, isFormData: true })
};
