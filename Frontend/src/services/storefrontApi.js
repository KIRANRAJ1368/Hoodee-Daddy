const getDefaultApiUrl = () => {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return `http://${host}:5000`;
    }
  }
  return "http://localhost:5000";
};

const RAW_API_URL = (
  (typeof process !== "undefined" && (process.env?.REACT_APP_API_URL || process.env?.VITE_API_URL)) ||
  getDefaultApiUrl()
).trim().replace(/\/+$/, "");
const API_URL = RAW_API_URL.replace(/\/api$/, "");

async function request(path, options = {}, includeMeta = false) {
  // Catalog/home content is admin-managed, so never reuse a browser cache.
  // Cart and wishlist continue to use their separate localStorage keys.
  const response = await fetch(`${API_URL}/api${path}`, { cache: "no-store", ...options });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      payload?.error?.message ||
      payload?.message ||
      `Storefront request failed (${response.status})`;
    throw new Error(errorMsg);
  }

  return includeMeta ? payload : payload.data;
}

function get(path) {
  return request(path);
}

export const storefrontApi = {
  home: () => get("/home"),
  categories: () => get("/categories"),
  products: async () => {
    // Fetch up to 500 items per request, handling multi-page catalogs seamlessly
    const first = await request("/products?limit=500", {}, true);
    const totalPages = first?.meta?.totalPages || 1;
    if (totalPages <= 1) return first?.data || [];

    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        request(`/products?limit=500&page=${index + 2}`, {}, true)
      )
    );
    return [first?.data || [], ...pages.map((page) => page?.data || [])].flat();
  },
  product: (idOrSlug) => get(`/products/${encodeURIComponent(idOrSlug)}`),
  getProductReviews: (idOrSlug, token = null) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request(`/products/${encodeURIComponent(idOrSlug)}/reviews`, { headers });
  },
  checkReviewEligibility: (idOrSlug, token = null) => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request(`/products/${encodeURIComponent(idOrSlug)}/reviews/eligibility`, { headers });
  },
  submitProductReview: (idOrSlug, reviewData, token) =>
    request(`/products/${encodeURIComponent(idOrSlug)}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(reviewData)
    }),
  updateProductReview: (idOrSlug, reviewId, reviewData, token) =>
    request(`/products/${encodeURIComponent(idOrSlug)}/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(reviewData)
    }),
  deleteProductReview: (idOrSlug, reviewId, token) =>
    request(`/products/${encodeURIComponent(idOrSlug)}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    }),
  createOrder: (order, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request("/orders", {
      method: "POST",
      headers,
      body: JSON.stringify(order)
    });
  },
  createRazorpayOrder: (payload, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request("/orders/razorpay/create-order", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  },
  verifyRazorpayPayment: (payload, token = null) => {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return request("/orders/razorpay/verify-payment", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
  },
  loginCustomer: (credentials) =>
    request("/auth/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    }),
  registerCustomer: (data) =>
    request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }),
  getCustomerProfile: (token) =>
    request("/auth/customer/me", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  updateCustomerProfile: (data, token) =>
    request("/auth/customer/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    }),
  getMyOrders: (token) =>
    request("/orders/my-orders", {
      headers: { Authorization: `Bearer ${token}` }
    }),
  uploadReviewImages: async (files, token) => {
    const formData = new FormData();
    Array.from(files).slice(0, 4).forEach((file) => formData.append("files", file));
    const response = await fetch(`${API_URL}/api/orders/upload-review-images`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error?.message || "Review image upload failed");
    return payload?.data?.urls || [];
  },
  forgotPassword: (email) =>
    request("/auth/customer/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    }),
  verifyOtp: (payload) =>
    request("/auth/customer/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  resetPassword: (payload) =>
    request("/auth/customer/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  trackOrder: (orderNumber, email) =>
    request(
      `/orders/track?orderNumber=${encodeURIComponent(orderNumber)}${email ? `&email=${encodeURIComponent(email)}` : ""}`
    ),
  cancelOrder: (orderId, reason, token) =>
    request(`/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(typeof reason === "object" ? reason : { reason })
    }),
  requestCancellation: (orderId, payload, token = null) =>
    request(`/orders/${orderId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    }),
  uploadReturnProof: async (files, token = null) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(`${API_URL}/api/orders/upload-proof`, {
      method: "POST",
      headers,
      body: formData
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(payload?.error?.message || payload?.message || "Proof upload failed");
    }
    return payload.data?.urls || payload.urls || [];
  },
  validateCoupon: (code, subtotal) =>
    request("/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal })
    }),
  availableCoupons: () => get("/coupons/available"),
  submitContact: (payload) =>
    request("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }),
  calculateShippingRate: async (payload) => {
    const res = await request("/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return res && typeof res === "object" ? { ...res, data: res } : res;
  },
  seoSettings: () => get("/seo/settings")
};

