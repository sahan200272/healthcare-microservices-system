"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Activity,
  Plus,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCcw,
  History,
  ChevronRight,
  CreditCard,
  Video,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi, paymentApi, telemedicineApi, VideoSession } from "@/lib/api";
import JoinConsultationButton from "@/app/components/JoinConsultationButton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  speciality: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  paid?: boolean;
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

interface AppointmentCardProps {
  apt: Appointment;
  index: number;
  onCancel: (id: string) => void;
}

type SessionState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "found"; session: VideoSession }
  | { phase: "not_found" }
  | { phase: "error" };

function AppointmentCard({ apt, index, onCancel }: AppointmentCardProps) {
  const router = useRouter();
  const isConfirmed = apt.status === "CONFIRMED" || apt.status === "ACTIVE";

  const [sessionState, setSessionState] = useState<SessionState>({ phase: "idle" });

  // ── fetchVideoSession ──────────────────────────────────────────────────────
  const fetchVideoSession = useCallback(async () => {
    if (!isConfirmed) return;
    setSessionState((prev) =>
      prev.phase === "idle" ? { phase: "loading" } : prev
    );
    try {
      const res = await telemedicineApi.getVideoSession(apt.id);
      const session = res.data;
      if (session?.meetingUrl) {
        setSessionState({ phase: "found", session });
      } else {
        setSessionState({ phase: "not_found" });
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSessionState({ phase: "not_found" });
      } else {
        setSessionState({ phase: "error" });
      }
    }
  }, [apt.id, isConfirmed]);

  // Initial fetch
  useEffect(() => {
    if (isConfirmed) {
      setSessionState({ phase: "loading" });
      fetchVideoSession();
    }
  }, [fetchVideoSession, isConfirmed]);

  // ── Poll every 10 seconds until session is ACTIVE or COMPLETED ─────────────
  useEffect(() => {
    if (!isConfirmed) return;

    // Stop polling if already in a terminal state
    const shouldStopPolling =
      sessionState.phase === "found" &&
      (sessionState.session.status === "ACTIVE" || sessionState.session.status === "COMPLETED");

    if (shouldStopPolling) return;

    const interval = setInterval(() => {
      fetchVideoSession();
    }, 10_000); // poll every 10 seconds

    return () => clearInterval(interval);
  }, [isConfirmed, sessionState, fetchVideoSession]);

  // Determine if session is ACTIVE
  const sessionIsActive =
    sessionState.phase === "found" && sessionState.session.status === "ACTIVE";
  const sessionIsCompleted =
    sessionState.phase === "found" && sessionState.session.status === "COMPLETED";
  const sessionIsCreated =
    sessionState.phase === "found" && sessionState.session.status === "CREATED";

  return (
    <motion.div
      key={apt.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass p-6 rounded-3xl flex flex-col gap-4 border-l-4 border-l-brand-primary group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
    >
      {/* Top row: doctor info + status badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Doctor info */}
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
              {apt.doctorName}
            </h4>
            <p className="text-sm text-clinical-gray">{apt.speciality}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-clinical-dark dark:text-clinical-white">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" /> {apt.appointmentDate}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold text-clinical-dark dark:text-clinical-white">
                <Clock className="w-3.5 h-3.5 text-brand-primary" /> {apt.timeSlot}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons + Status badges */}
        <div className="flex items-center gap-3 flex-wrap self-end md:self-auto">
          <button
            onClick={() => router.push(`/doctors/${apt.doctorId}/book?reschedule=${apt.id}`)}
            className="p-3 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
            title="Reschedule"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reschedule</span>
          </button>
          <button
            onClick={() => onCancel(apt.id)}
            className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
            title="Cancel"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>

          {/* Confirmed / Active badges */}
          {isConfirmed && (
            <>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Confirmed
              </span>
              {apt.paid ? (
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Paid
                </span>
              ) : (
                <button
                  onClick={() =>
                    (window.location.href = `/payments?appointmentId=${apt.id}&doctorId=${apt.doctorId}`)
                  }
                  className="bg-brand-primary text-white hover:bg-brand-primary/90 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Pay Fee
                </button>
              )}
            </>
          )}

          {/* Pending badge */}
          {apt.status === "PENDING" && apt.paid && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Paid
            </span>
          )}
          {apt.status === "PENDING" && !apt.paid && (
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <Clock className="w-4 h-4" /> Pending
            </span>
          )}

          {/* Completed badge */}
          {apt.status === "COMPLETED" && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </span>
          )}

          {/* Cancelled / Rejected badge */}
          {(apt.status === "CANCELLED" || apt.status === "REJECTED") && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {apt.status === "REJECTED" ? "Rejected" : "Cancelled"}
            </span>
          )}
        </div>
      </div>

      {/* ── Video Session Row (only for CONFIRMED / ACTIVE appointments) ─────── */}
      {isConfirmed && (
        <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-clinical-gray">
            <Video className="w-4 h-4 text-teal-500 shrink-0" />
            <span className="font-medium">Video Consultation</span>
          </div>

          {/* Loading state */}
          {sessionState.phase === "loading" && (
            <span className="flex items-center gap-2 text-xs text-clinical-gray animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking session...
            </span>
          )}

          {/* ── ACTIVE → Join Consultation ─────────────────────────────────── */}
          {sessionIsActive && sessionState.phase === "found" && (
            <div className="flex flex-col items-end gap-1">
              <JoinConsultationButton
                meetingUrl={sessionState.session.meetingUrl}
                appointmentDate={apt.appointmentDate}
                timeSlot={apt.timeSlot}
                forceEnabled={true}  // Doctor activated → always allow join
              />
              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Session is live
              </span>
            </div>
          )}

          {/* ── CREATED → Waiting for doctor ──────────────────────────────── */}
          {sessionIsCreated && (
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Waiting for doctor to start...
              </span>
              <span className="text-xs text-clinical-gray opacity-60">
                Doctor has not started the session yet
              </span>
            </div>
          )}

          {/* ── COMPLETED → Session Completed ─────────────────────────────── */}
          {sessionIsCompleted && (
            <span className="flex items-center gap-2 text-xs font-semibold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Session Completed
            </span>
          )}

          {/* ── not_found → no session created yet ────────────────────────── */}
          {sessionState.phase === "not_found" && (
            <div className="flex flex-col items-end gap-1">
              <span className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">
                <Clock className="w-3.5 h-3.5" /> Waiting for doctor to start...
              </span>
              <span className="text-xs text-clinical-gray opacity-60">
                Doctor has not started the session yet
              </span>
            </div>
          )}

          {/* ── error → retry ──────────────────────────────────────────────── */}
          {sessionState.phase === "error" && (
            <button
              onClick={fetchVideoSession}
              className="flex items-center gap-2 text-xs font-semibold text-orange-500 hover:text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-full transition-colors"
              title="Retry loading session"
            >
              <WifiOff className="w-3.5 h-3.5" /> Retry
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── PatientDashboard ─────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const [userDetails, setUserDetails] = useState<{ name: string; email: string; id: string }>({
    name: "Patient",
    email: "patient@example.com",
    id: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "history">("confirmed");

  // ── Load appointments ──────────────────────────────────────────────────────
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const authUserId = localStorage.getItem("id");
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        if (!authUserId) {
          setError("Session expired. Please log in again.");
          setIsLoading(false);
          return;
        }

        setUserDetails({
          name: name || "Patient",
          email: email || "patient@example.com",
          id: authUserId,
        });

        // Fetch appointments
        const response = await appointmentApi.getAppointments(authUserId, "patient");
        let fetchedAppointments: Appointment[] = response.data || [];

        // Merge payment status
        try {
          const paymentsRes = await paymentApi.getPaymentsByPatientId(authUserId);
          const payments = paymentsRes.data || [];
          fetchedAppointments = fetchedAppointments.map((apt) => {
            const hasMatch = payments.some(
              (p: any) =>
                String(p.appointmentId).trim() === String(apt.id).trim() &&
                p.paymentStatus === "COMPLETED"
            );
            return { ...apt, paid: hasMatch };
          });
        } catch (payErr) {
          console.warn("Could not fetch payments for status sync", payErr);
        }

        setAppointments(fetchedAppointments);

        // Auto-switch tab logic
        const confirmedCount = fetchedAppointments.filter(
          (a) => a.status === "CONFIRMED" || a.status === "ACTIVE" || a.paid
        ).length;
        const pendingCount = fetchedAppointments.filter(
          (a) => (a.status === "PENDING" || a.status === "REQUESTED") && !a.paid
        ).length;

        if (confirmedCount === 0 && pendingCount > 0) {
          setActiveTab("pending");
        }
      } catch (err: any) {
        console.error("Error loading appointments:", err);
        setError("Failed to load your appointments. Please ensure all services are running.");
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // ── Cancel appointment ─────────────────────────────────────────────────────
  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await appointmentApi.cancelAppointment(appointmentId);
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
      alert("Appointment cancelled successfully.");
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === "pending") return (apt.status === "PENDING" || apt.status === "REQUESTED") && !apt.paid;
    if (activeTab === "confirmed") return apt.status === "CONFIRMED" || apt.status === "ACTIVE" || apt.paid;
    if (activeTab === "history") return apt.status === "COMPLETED" || apt.status === "CANCELLED";
    return false;
  });

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Syncing your health data...</p>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Hello, <span className="text-brand-primary">{userDetails.name}</span>
            </h1>
            <p className="text-clinical-gray mt-2">Check your appointment status and schedule</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/book-appointment"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all flex items-center space-x-3 font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-6 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 to-transparent"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white">Confirmed</h3>
            </div>
            <p className="text-3xl font-bold text-brand-primary">
              {appointments.filter((a) => a.status === "CONFIRMED" || a.status === "ACTIVE" || a.paid).length}
            </p>
            <p className="text-sm text-clinical-gray">Ready for visitation</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass p-6 rounded-3xl border border-yellow-500/10 bg-gradient-to-br from-yellow-500/5 to-transparent"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white">Awaiting Approval</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-500">
              {appointments.filter((a) => (a.status === "PENDING" || a.status === "REQUESTED") && !a.paid).length}
            </p>
            <p className="text-sm text-clinical-gray">Pending doctor's review</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass p-6 rounded-3xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white">User Profile</h3>
            </div>
            <p className="text-sm text-clinical-gray truncate">{userDetails.email}</p>
            <button className="text-brand-primary text-xs font-bold hover:underline mt-2">Edit Settings</button>
          </motion.div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 w-max">
          {(["confirmed", "pending", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary"
                  : "text-clinical-gray"
              }`}
            >
              {tab === "pending" ? "Requested" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {filteredAppointments.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 glass rounded-3xl"
              >
                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-clinical-gray">No appointments found in this category.</p>
              </motion.div>
            ) : (
              filteredAppointments.map((apt, idx) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  index={idx}
                  onCancel={handleCancelAppointment}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/payments/history"
            className="glass p-8 rounded-3xl flex items-center gap-6 group border border-blue-500/10 hover:border-blue-500/30 transition-all"
          >
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <CreditCard className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-clinical-dark dark:text-clinical-white">Payment History</h4>
              <p className="text-sm text-clinical-gray">View receipts and past invoices</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/patient-profile" className="glass p-8 rounded-3xl flex items-center gap-6 group">
            <div className="w-14 h-14 bg-brand-secondary/10 rounded-2xl flex items-center justify-center text-brand-secondary group-hover:scale-110 transition-transform">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-clinical-dark dark:text-clinical-white">Medical History</h4>
              <p className="text-sm text-clinical-gray">View your past reports and prescriptions</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/symptom-checker" className="glass p-8 rounded-3xl flex items-center gap-6 group">
            <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-clinical-dark dark:text-clinical-white">Symptom Checker</h4>
              <p className="text-sm text-clinical-gray">Quickly analyze your symptoms with AI</p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
