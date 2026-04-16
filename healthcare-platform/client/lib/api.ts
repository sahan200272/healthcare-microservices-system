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

// Appointment API
export const appointmentApi = {
  searchDoctors: (params: { specialty?: string; search?: string }) => 
    api.get("/api/appointments/doctors", { params }),
  getDoctor: (doctorId: string) => 
    api.get(`/api/appointments/doctors/${doctorId}`),
  bookAppointment: (appointmentData: any) => 
    api.post("/api/appointments/book", appointmentData),
  getAppointments: (userId: string, role: "patient" | "doctor") => 
    api.get(`/api/appointments/${role}/${userId}`),
  updateAppointmentStatus: (appointmentId: string, status: string) => 
    api.put(`/api/appointments/${appointmentId}/status`, { status }),
  cancelAppointment: (appointmentId: string) => 
    api.put(`/api/appointments/${appointmentId}/cancel`, {}),
};

// Patient API
export const patientApi = {
  getProfile: (patientId: string) => 
    api.get(`/api/patients/${patientId}`),
  updateProfile: (patientId: string, profileData: any) => 
    api.put(`/api/patients/${patientId}`, profileData),
  uploadDocument: (patientId: string, formData: FormData) => 
    api.post(`/api/patients/${patientId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDocuments: (patientId: string) => 
    api.get(`/api/patients/${patientId}/documents`),
  getPrescriptions: (patientId: string) => 
    api.get(`/api/patients/${patientId}/prescriptions`),
  getMedicalHistory: (patientId: string) => 
    api.get(`/api/patients/${patientId}/medical-history`),
};

// Doctor API
export const doctorApi = {
  getProfile: (doctorId: string) => 
    api.get(`/api/doctors/${doctorId}`),
  updateProfile: (doctorId: string, profileData: any) => 
    api.put(`/api/doctors/${doctorId}`, profileData),
  setAvailability: (doctorId: string, availabilityData: any) => 
    api.post(`/api/doctors/${doctorId}/availability`, availabilityData),
  getAvailability: (doctorId: string) => 
    api.get(`/api/doctors/${doctorId}/availability`),
  viewPatientReports: (patientId: string) => 
    api.get(`/api/doctors/patients/${patientId}/reports`),
  issuePrescription: (appointmentId: string, prescriptionData: any) => 
    api.post(`/api/doctors/prescriptions/issue`, { appointmentId, ...prescriptionData }),
};

// Payment API
export const paymentApi = {
  initiatePayment: (paymentData: any) => 
    api.post("/api/payments/initiate", paymentData),
  verifyPayment: (paymentId: string) => 
    api.get(`/api/payments/${paymentId}/verify`),
  getPaymentStatus: (transactionId: string) => 
    api.get(`/api/payments/${transactionId}/status`),
};

// Notification API
export const notificationApi = {
  sendAppointmentConfirmation: (notificationData: any) => 
    api.post("/api/notifications/appointment-confirmation", notificationData),
  sendConsultationReminder: (appointmentId: string) => 
    api.post(`/api/notifications/consultation-reminder/${appointmentId}`, {}),
  getNotifications: (userId: string) => 
    api.get(`/api/notifications/${userId}`),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => 
    api.get("/api/admin/dashboard/stats"),
  getUsers: () => 
    api.get("/api/admin/users"),
  verifyDoctor: (doctorId: string, verificationData: any) => 
    api.put(`/api/admin/doctors/${doctorId}/verify`, verificationData),
  rejectDoctor: (doctorId: string, reason: string) => 
    api.put(`/api/admin/doctors/${doctorId}/reject`, { reason }),
  getPendingDoctors: () => 
    api.get("/api/admin/doctors/pending"),
  getTransactions: () => 
    api.get("/api/admin/transactions"),
};

// AI Symptom Checker API
export const aiSymptomApi = {
  analyzeSympstoms: (symptoms: string[]) => 
    api.post("/api/ai/symptom-checker", { symptoms }),
  getRecommendedSpecialties: (symptoms: string[]) => 
    api.post("/api/ai/recommended-specialties", { symptoms }),
};

export default api;
