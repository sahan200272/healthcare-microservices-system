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
    api.get("/api/doctors", { params }),
  getDoctor: (doctorId: string) => 
    api.get(`/api/doctors/${doctorId}`),
  bookAppointment: (appointmentData: any) => 
    api.post("/api/appointments", appointmentData),
  getAppointments: (userId: string, role: "patient" | "doctor") => 
    api.get(`/api/appointments/${role}/${userId}`),
  updateAppointmentStatus: (appointmentId: string, status: string) => 
    api.put(`/api/appointments/${appointmentId}/status`, { status }),
  confirmAppointment: (appointmentId: string) => 
    api.put(`/api/appointments/${appointmentId}/confirm`, {}),
  cancelAppointment: (appointmentId: string) => 
    api.put(`/api/appointments/${appointmentId}/cancel`, {}),
  rescheduleAppointment: (appointmentId: string, request: { appointmentDate: string, timeSlot: string }) => 
    api.put(`/api/appointments/${appointmentId}/reschedule`, request),
};

// Patient API
export const patientApi = {
  createProfile: (profileData: any) => 
    api.post("/api/patients", profileData),
  getProfile: (patientId: string) => 
    api.get(`/api/patients/${patientId}`),
  getProfileByUserId: (userId: string) => 
    api.get(`/api/patients/by-user/${userId}`),
  updateProfile: (patientId: string, profileData: any) => 
    api.put(`/api/patients/${patientId}`, profileData),
  uploadReport: (patientId: string, formData: FormData) => 
    api.post(`/api/patients/${patientId}/reports`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateReport: (patientId: string, reportId: string, formData: FormData) => 
    api.put(`/api/patients/${patientId}/reports/${reportId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getReports: (patientId: string) => 
    api.get(`/api/patients/${patientId}/reports`),
  getPrescriptions: (patientId: string) => 
    api.get(`/api/patients/${patientId}/prescriptions`),
  updatePrescriptionNotes: (patientId: string, prescriptionId: string, notes: string) => 
    api.put(`/api/patients/${patientId}/prescriptions/${prescriptionId}/notes`, { notes }),
  getMedicalHistory: (patientId: string) => 
    api.get(`/api/patients/${patientId}/history`),
  addMedicalHistory: (patientId: string, historyData: any) => 
    api.post(`/api/patients/${patientId}/history`, historyData),
};

// Doctor API
export const doctorApi = {
  // Profile
  registerProfile: (profileData: any) =>
    api.post(`/api/doctors/register`, profileData),
  getProfile: (doctorId: string) =>
    api.get(`/api/doctors/${doctorId}`),
  getProfileByUserId: (userId: string) =>
    api.get(`/api/doctors/user/${userId}`),
  updateProfile: (doctorId: string, profileData: any) =>
    api.patch(`/api/doctors/${doctorId}`, profileData),
  getAllDoctors: () =>
    api.get(`/api/doctors`),

  // Availability
  setAvailability: (doctorId: string, availabilityData: any) =>
    api.post(`/api/doctors/${doctorId}/availability`, availabilityData),
  getAvailability: (doctorId: string) =>
    api.get(`/api/doctors/${doctorId}/availability`),

  // Appointment actions (Doctor Service endpoints)
  acceptAppointment: (doctorId: string, appointmentId: string) =>
    api.put(`/api/doctors/${doctorId}/appointments/${appointmentId}/accept`, {}),
  rejectAppointment: (doctorId: string, appointmentId: string) =>
    api.put(`/api/doctors/${doctorId}/appointments/${appointmentId}/reject`, {}),
  getReportsByAppointment: (doctorId: string, appointmentId: string) =>
    api.get(`/api/doctors/${doctorId}/appointments/${appointmentId}/reports`),

  // Patient view
  getPatientDetails: (doctorId: string, patientId: string) =>
    api.get(`/api/doctors/${doctorId}/patients/${patientId}`),
  getPatientReports: (doctorId: string, patientId: string) =>
    api.get(`/api/doctors/${doctorId}/patients/${patientId}/reports`),

  // Prescriptions
  issuePrescription: (doctorId: string, prescriptionData: any) =>
    api.post(`/api/doctors/${doctorId}/prescriptions`, prescriptionData),
  getDoctorPrescriptions: (doctorId: string) =>
    api.get(`/api/doctors/${doctorId}/prescriptions`),

  // Appointment list (Appointment Service)
  getAppointments: (doctorId: string) =>
    api.get(`/api/appointments/doctor/${doctorId}`),
  completeAppointment: (appointmentId: string) =>
    api.put(`/api/appointments/${appointmentId}/complete`, {}),
};

// Payment API
export const paymentApi = {
  createPayment: (paymentData: any) => 
    api.post("/api/payments", paymentData),
  verifyStripePayment: (sessionId: string) => 
    api.post(`/api/payments/verify?sessionId=${sessionId}`),
  getPaymentByAppointmentId: (appointmentId: string) => 
    api.get(`/api/payments/appointment/${appointmentId}`),
  getPaymentsByPatientId: (patientId: string) => 
    api.get(`/api/payments/patient/${patientId}`),
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
