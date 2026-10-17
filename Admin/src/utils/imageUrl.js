const getDefaultApiUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:5000`;
    }
  }
  return "http://localhost:5000";
};

const RAW_API_URL = ((import.meta.env?.VITE_API_URL) || getDefaultApiUrl()).trim().replace(/\/+$/, "");
const API_URL = RAW_API_URL.replace(/\/api$/, "");

/**
 * Resolves any image URL to a reliable absolute or root-relative URL:
 * - If already data URI or blob, returns as is.
 * - If containing /uploads/, routes cleanly to backend API server.
 * - If starting with /images/, uses root-relative path (served by public/images).
 * - Otherwise preserves http/https URLs.
 */
export function resolveImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.includes("/uploads/")) {
    const idx = trimmed.indexOf("/uploads/");
    return `${API_URL}${trimmed.slice(idx)}`;
  }
  if (trimmed.startsWith("uploads/")) {
    return `${API_URL}/${trimmed}`;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }
  if (trimmed.startsWith("images/")) {
    return `/${trimmed}`;
  }
  return trimmed;
}
