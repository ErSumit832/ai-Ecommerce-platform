import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try once to refresh the access token using the stored refresh token.
let isRefreshing = false;
let queue = [];

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({ resolve, reject, original });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refresh_token: refreshToken });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      queue.forEach((p) => p.resolve(client(p.original)));
      queue = [];
      return client(original);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      queue.forEach((p) => p.reject(refreshError));
      queue = [];
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
