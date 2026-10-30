import { api } from "./api";

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me")
};

export const dashboardApi = {
  summary: (params) => api.get("/admin/dashboard/summary", params)
};

export const categoriesApi = {
  list: (params) => api.get("/categories", { includeInactive: true, ...params }),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`)
};

export const subcategoriesApi = {
  list: () => Promise.resolve({ data: [] }),
  create: () => Promise.resolve({ data: {} }),
  update: () => Promise.resolve({ data: {} }),
  remove: () => Promise.resolve({ data: {} })
};

export const productsApi = {
  list: (params) => api.get("/products", { includeInactive: true, limit: 20, ...params }),
  getById: (id) => api.get(`/products/admin/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  toggleBestSeller: (id, value) => api.patch(`/products/${id}/best-seller`, { value }),
  toggleNewArrival: (id, value) => api.patch(`/products/${id}/new-arrival`, { value }),
  toggleShowOnHomepage: (id, value) => api.patch(`/products/${id}/show-on-homepage`, { value }),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  saveVariants: (id, variants) => api.put(`/products/${id}/variants`, { variants })
};

export const bannersApi = {
  list: (params) => api.get("/banners", { includeInactive: true, ...params }),
  create: (data) => api.post("/banners", data),
  update: (id, data) => api.put(`/banners/${id}`, data),
  remove: (id) => api.delete(`/banners/${id}`)
};

export const announcementsApi = {
  list: () => api.get("/announcements"),
  create: (data) => api.post("/announcements", data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  toggle: (id) => api.patch(`/announcements/${id}/toggle`),
  remove: (id) => api.delete(`/announcements/${id}`)
};

export const offersApi = {
  list: () => api.get("/offers"),
  create: (data) => api.post("/offers", data),
  update: (id, data) => api.patch(`/offers/${id}`, data),
  remove: (id) => api.delete(`/offers/${id}`)
};

export const homepageApi = {
  sections: () => api.get("/home/admin/sections"),
  updateSection: (key, data) => api.put(`/home/admin/sections/${key}`, data)
};

export const ordersApi = {
  list: (params) => api.get("/orders", params),
  getById: (id) => api.get(`/orders/${id}`),
  syncTracking: (id) => api.post(`/shipping/shipments/${id}/sync`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  approveCancellation: (id) => api.post(`/orders/${id}/approve-cancellation`),
  approveReturn: (id) => api.post(`/orders/${id}/approve-return`),
  rejectCancellation: (id, data) => api.post(`/orders/${id}/reject-cancellation`, data),
  markWarehouseReceived: (id, data) => api.post(`/orders/${id}/mark-warehouse-received`, data),
  processUpiRefund: (id, data) => api.post(`/orders/${id}/process-upi-refund`, data)
};

export const reviewsApi = {
  list: (params) => api.get("/products/admin/reviews", params),
  update: (id, data) => api.patch(`/products/admin/reviews/${id}`, data),
  remove: (id) => api.delete(`/products/admin/reviews/${id}`)
};

export const shippingApi = {
  list: (params) => api.get("/shipping/shipments", params),
  getById: (id) => api.get(`/shipping/shipments/${id}`),
  generateAwb: (id) => api.post(`/shipping/shipments/${id}/generate-awb`),
  syncTracking: (id) => api.post(`/shipping/shipments/${id}/sync`),
  updateStatus: (id, data) => api.patch(`/shipping/shipments/${id}/status`, data)
};

export const contactApi = {
  list: (params) => api.get("/contact", params),
  getById: (id) => api.get(`/contact/${id}`),
  updateStatus: (id, status) => api.patch(`/contact/${id}/status`, { status }),
  remove: (id) => api.delete(`/contact/${id}`)
};

export const customersApi = {
  list: (params) => api.get("/customers", params),
  getById: (id) => api.get(`/customers/${id}`)
};

export const uploadApi = {
  upload: (folder, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return api.upload(`/admin/uploads/${folder}`, formData);
  }
};

export const couponsApi = {
  list: (params) => api.get("/coupons", params),
  getById: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post("/coupons", data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  remove: (id) => api.delete(`/coupons/${id}`)
};

export const reportsApi = {
  sales: (params) => api.get("/admin/reports/sales", params),
  products: (params) => api.get("/admin/reports/products", params),
  orders: (params) => api.get("/admin/reports/orders", params)
};

export const seoApi = {
  get: () => api.get("/seo/settings"),
  update: (data) => api.put("/seo/settings", data),
  listPages: (params) => api.get("/seo/pages", params),
  getPageOptions: () => api.get("/seo/page-options"),
  getPage: (id) => api.get(`/seo/pages/${id}`),
  savePage: (data) => api.post("/seo/pages", data),
  deletePage: (id) => api.delete(`/seo/pages/${id}`),
  getSitemapSummary: () => api.get("/seo/sitemap-summary"),
  syncSitemap: () => api.post("/seo/sync-sitemap"),
  uploadSitemap: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload("/seo/upload-sitemap", formData);
  },
  uploadRobots: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload("/seo/upload-robots", formData);
  }
};

