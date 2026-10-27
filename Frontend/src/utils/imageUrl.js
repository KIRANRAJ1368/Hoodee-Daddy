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

const RAW_API_URL = (
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && (process.env?.VITE_API_URL || process.env?.REACT_APP_API_URL)) ||
  getDefaultApiUrl()
).trim().replace(/\/+$/, "");
const API_URL = RAW_API_URL.replace(/\/api$/, "");

/**
 * Public catalogue images (/images/...) belong to the storefront build,
 * while upload paths belong to the API server. Keep absolute Admin URLs
 * unchanged and make relative upload URLs work in every deployment.
 */
export function imageUrl(value) {
  if (!value || typeof value !== "string") return "";
  const normalized = value.trim().replace(/\\/g, "/");
  if (!normalized) return "";
  if (normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }
  if (normalized.includes("/uploads/")) {
    const idx = normalized.indexOf("/uploads/");
    return `${API_URL}${normalized.slice(idx)}`;
  }
  if (normalized.startsWith("uploads/")) {
    return `${API_URL}/${normalized}`;
  }
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("/images/") || normalized.startsWith("/")) {
    return normalized;
  }
  if (normalized.startsWith("images/")) {
    return `/${normalized}`;
  }
  return normalized;
}

