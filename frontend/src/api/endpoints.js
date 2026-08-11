import client from "./client";

export const authApi = {
  register: (payload) => client.post("/api/v1/auth/register", payload),
  login: (payload) => client.post("/api/v1/auth/login", payload),
  me: () => client.get("/api/v1/auth/me"),
};

export const productsApi = {
  list: (params) => client.get("/api/v1/products", { params }),
  get: (id) => client.get(`/api/v1/products/${id}`),
  create: (payload) => client.post("/api/v1/products", payload),
  update: (id, payload) => client.put(`/api/v1/products/${id}`, payload),
  remove: (id) => client.delete(`/api/v1/products/${id}`),
};

export const categoriesApi = {
  list: () => client.get("/api/v1/categories"),
};

export const cartApi = {
  get: () => client.get("/api/v1/cart"),
  add: (payload) => client.post("/api/v1/cart/items", payload),
  update: (itemId, payload) => client.put(`/api/v1/cart/items/${itemId}`, payload),
  remove: (itemId) => client.delete(`/api/v1/cart/items/${itemId}`),
};

export const wishlistApi = {
  list: () => client.get("/api/v1/wishlist"),
  add: (productId) => client.post(`/api/v1/wishlist/${productId}`),
  remove: (itemId) => client.delete(`/api/v1/wishlist/${itemId}`),
};

export const ordersApi = {
  checkout: (payload) => client.post("/api/v1/orders/checkout", payload),
  list: () => client.get("/api/v1/orders"),
  get: (id) => client.get(`/api/v1/orders/${id}`),
  adminList: () => client.get("/api/v1/orders/admin/all"),
  adminUpdateStatus: (id, payload) => client.patch(`/api/v1/orders/admin/${id}/status`, payload),
};

export const reviewsApi = {
  list: (productId) => client.get(`/api/v1/products/${productId}/reviews`),
  create: (productId, payload) => client.post(`/api/v1/products/${productId}/reviews`, payload),
  aiSummary: (productId) => client.get(`/api/v1/products/${productId}/reviews/ai-summary`),
};

export const aiApi = {
  recommend: (payload) => client.post("/api/v1/ai/recommend", payload),
  chat: (payload) => client.post("/api/v1/ai/chat", payload),
  salesAnalytics: () => client.get("/api/v1/ai/sales-analytics"),
  incidentAnalysis: (payload) => client.post("/api/v1/ai/incident-analysis", payload),
};

export const adminApi = {
  dashboard: () => client.get("/api/v1/admin/dashboard"),
  users: () => client.get("/api/v1/admin/users"),
  toggleUserActive: (userId) => client.patch(`/api/v1/admin/users/${userId}/toggle-active`),
  lowStock: () => client.get("/api/v1/admin/inventory/low-stock"),
};
