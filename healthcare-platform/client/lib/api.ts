import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: any) => api.post("/api/auth/login", credentials),
  register: (userData: any) => api.post("/api/auth/register", userData),
};

export const telemedicineApi = {
  getSessions: (userId: string, role: "patient" | "doctor") => 
    api.get(`/api/sessions/${role}/${userId}`),
  createSession: (sessionData: any) => api.post("/api/sessions/create", sessionData),
  getSessionInfo: (appointmentId: string) => api.get(`/api/sessions/appointment/${appointmentId}`),
  startSession: (sessionId: string) => api.put(`/api/sessions/${sessionId}/start`),
  endSession: (sessionId: string) => api.put(`/api/sessions/${sessionId}/end`),
};

export default api;
