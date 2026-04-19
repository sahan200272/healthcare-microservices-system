/**
 * Doctor Service — TypeScript Type Definitions
 * Mirrors the Spring Boot DTOs exactly.
 */

// ─── Doctor ────────────────────────────────────────────────────────────────

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface DoctorProfile {
  doctorId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  licenseNumber: string;
  experienceYears: number;
  bio: string;
  consultationFee: number;
  verificationStatus: VerificationStatus;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorUpdateRequest {
  fullName?: string;
  phone?: string;
  specialization?: string;
  qualification?: string;
  bio?: string;
  consultationFee?: number;
  experienceYears?: number;
}

// ─── Appointment ────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | "ACTIVE";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  appointmentDate: string;   // "YYYY-MM-DD"
  timeSlot: string;          // "09:00 AM"
  status: AppointmentStatus;
  reason?: string;
  type?: "IN_PERSON" | "TELEMEDICINE";
  createdAt?: string;
}

export interface AppointmentActionResponse {
  appointmentId: string;
  status: AppointmentStatus;
  message: string;
}

// ─── Prescription ───────────────────────────────────────────────────────────

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionRequest {
  patientId: string;
  appointmentId: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
}

export interface PrescriptionResponse {
  prescriptionId: string;
  doctorId: string;
  patientId: string;
  patientName?: string;  // Enriched client-side from appointments lookup
  appointmentId: string;
  diagnosis: string;
  medications: Medication[];
  notes?: string;
  issuedAt: string;
}

// ─── Availability ───────────────────────────────────────────────────────────

export interface AvailabilityRequest {
  availableDate: string;   // "YYYY-MM-DD"
  timeSlots: string[];     // ["09:00", "09:30", "10:00"]
}

export interface AvailabilityResponse {
  availabilityId: string;
  doctorId: string;
  availableDate: string;
  timeSlots: string[];
}

// ─── Patient ────────────────────────────────────────────────────────────────

export interface PatientDetails {
  patientId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  address?: string;
  emergencyContact?: string;
}

export interface MedicalReport {
  reportId: string;
  patientId: string;
  title: string;
  description?: string;
  reportType: string;
  fileUrl?: string;
  fileName?: string;
  uploadedAt: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export interface DoctorDashboardStats {
  todayAppointments: number;
  pendingRequests: number;
  totalPrescriptions: number;
  totalPatients: number;
  upcomingAppointments: Appointment[];
  recentPrescriptions: PrescriptionResponse[];
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}
