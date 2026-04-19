"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  CheckCircle2,
  FileText,
  Video,
  Stethoscope,
  Loader2,
  Play,
  Radio,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/lib/doctorTypes";
import { telemedicineApi, VideoSession } from "@/lib/api";

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDING:   { label: "Pending",    color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-l-amber-400" },
  ACCEPTED:  { label: "Confirmed",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-l-emerald-400" },
  CONFIRMED: { label: "Confirmed",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-l-emerald-400" },
  COMPLETED: { label: "Completed",  color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-900/20",       border: "border-l-blue-400" },
  CANCELLED: { label: "Cancelled",  color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20",         border: "border-l-red-400" },
  REJECTED:  { label: "Cancelled",  color: "text-red-600 dark:text-red-400",         bg: "bg-red-50 dark:bg-red-900/20",         border: "border-l-red-400" },
  ACTIVE:    { label: "In Session", color: "text-brand-primary",                     bg: "bg-brand-primary/10",                  border: "border-l-brand-primary" },
};

// ─── Session status badge ─────────────────────────────────────────────────────

function SessionBadge({ status }: { status: string }) {
  if (status === "ACTIVE") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <Radio className="w-3 h-3 animate-pulse" />
        LIVE
      </span>
    );
  }
  if (status === "COMPLETED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">
        <CheckCircle2 className="w-3 h-3" />
        Completed
      </span>
    );
  }
  if (status === "CREATED") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500">
        <Clock className="w-3 h-3" />
        Not Started
      </span>
    );
  }
  return null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppointmentCardProps {
  appointment: Appointment;
  doctorId: string;
  index?: number;
  actionLoading?: string | null;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppointmentCard({
  appointment: apt,
  doctorId,
  index = 0,
  actionLoading,
  onAccept,
  onReject,
  onComplete,
}: AppointmentCardProps) {
  const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.PENDING;
  const isActioning = (suffix: string) => actionLoading === apt.id + suffix;

  // Only fetch/show session for CONFIRMED / ACCEPTED appointments
  const isConfirmed = apt.status === "CONFIRMED" || apt.status === "ACCEPTED";

  const [session, setSession] = useState<VideoSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // ── Load existing session status on mount ──────────────────────────────────
  const fetchSession = useCallback(async () => {
    if (!isConfirmed) return;
    setSessionLoading(true);
    try {
      const res = await telemedicineApi.getVideoSession(apt.id);
      setSession(res.data);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setSession(null); // No session yet — that's fine
      }
      // Silently ignore other errors; doctor can still click Start
    } finally {
      setSessionLoading(false);
    }
  }, [apt.id, isConfirmed]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // ── Handle Start Consultation ──────────────────────────────────────────────
  const handleStartConsultation = async () => {
    if (startLoading) return;
    setStartLoading(true);
    setStartError(null);
    try {
      const res = await telemedicineApi.activateSession(apt.id);
      const { meetingUrl, status, sessionId } = res.data;

      // Update local session state
      setSession((prev) => ({
        ...(prev ?? { appointmentId: apt.id, meetingUrl }),
        id: sessionId,
        meetingUrl,
        status,
      }));

      // Open Jitsi in a new tab
      if (meetingUrl) {
        window.open(meetingUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      const msg =
        err?.response?.status === 409
          ? "Session already completed — cannot re-activate."
          : "Failed to start consultation. Please try again.";
      setStartError(msg);
    } finally {
      setStartLoading(false);
    }
  };

  const sessionIsActive    = session?.status === "ACTIVE";
  const sessionIsCompleted = session?.status === "COMPLETED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
      className={`glass rounded-[1.75rem] p-6 border-l-4 ${cfg.border} hover:shadow-lg transition-all group`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Patient info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <User className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-clinical-dark dark:text-clinical-white">
                {apt.patientName}
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
              {apt.type && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-clinical-gray">
                  {apt.type === "TELEMEDICINE" ? "Video" : "In-Person"}
                </span>
              )}
              {/* Session status badge */}
              {isConfirmed && session && <SessionBadge status={session.status} />}
            </div>
            {apt.reason && (
              <p className="text-sm text-clinical-gray mt-0.5 max-w-xs truncate">{apt.reason}</p>
            )}
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-clinical-dark dark:text-clinical-white">
                <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                {apt.appointmentDate}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-clinical-dark dark:text-clinical-white">
                <Clock className="w-3.5 h-3.5 text-brand-primary" />
                {apt.timeSlot}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View patient profile */}
          <Link
            href={`/doctor/patients/${apt.patientId}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-brand-primary/10 hover:text-brand-primary text-clinical-gray rounded-xl text-xs font-bold transition-all"
          >
            <Stethoscope className="w-3.5 h-3.5" /> Patient
          </Link>

          {/* Prescribe */}
          {(apt.status === "CONFIRMED" || apt.status === "ACCEPTED" || apt.status === "COMPLETED") && (
            <Link
              href={`/doctor/prescriptions?appointmentId=${apt.id}&patientId=${apt.patientId}&patientName=${encodeURIComponent(apt.patientName || "Unknown")}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-brand-accent/10 hover:bg-brand-accent/20 text-brand-accent rounded-xl text-xs font-bold transition-all"
            >
              <FileText className="w-3.5 h-3.5" /> Prescribe
            </Link>
          )}

          {/* ▶ Start Consultation button (CONFIRMED / ACCEPTED only) */}
          {isConfirmed && !sessionIsCompleted && (
            <button
              id={`start-consultation-${apt.id}`}
              onClick={handleStartConsultation}
              disabled={startLoading || sessionLoading}
              title={sessionIsActive ? "Session is live — click to rejoin" : "Start video consultation"}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all
                disabled:opacity-60 disabled:cursor-not-allowed
                ${sessionIsActive
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-brand-primary hover:bg-brand-primary/90 text-white shadow-sm shadow-brand-primary/30"
                }
              `}
            >
              {startLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : sessionIsActive ? (
                <Radio className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {startLoading
                ? "Starting..."
                : sessionIsActive
                ? "Rejoin Session"
                : "Start Consultation"}
            </button>
          )}

          {/* Join meeting link when already active (direct link alternative) */}
          {isConfirmed && sessionIsActive && session?.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 rounded-xl text-xs font-bold transition-all"
              title="Open meeting link"
            >
              <Video className="w-3.5 h-3.5" /> Open Link
            </a>
          )}

          {/* Accept (PENDING only) */}
          {apt.status === "PENDING" && onAccept && (
            <button
              id={`accept-${apt.id}`}
              onClick={() => onAccept(apt.id)}
              disabled={!!actionLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-sm shadow-emerald-500/30"
            >
              {isActioning("-accept") ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Accept
            </button>
          )}



          {/* Reject / Cancel */}
          {(apt.status === "PENDING" || apt.status === "CONFIRMED" || apt.status === "ACCEPTED") && onReject && (
            <button
              id={`reject-${apt.id}`}
              onClick={() => onReject(apt.id)}
              disabled={!!actionLoading}
              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
              title="Reject / Cancel"
            >
              {isActioning("-reject") ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────────── */}
      {startError && (
        <div className="mt-3 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
          <X className="w-3.5 h-3.5 shrink-0" />
          {startError}
        </div>
      )}

      {/* ── Session info row (when ACTIVE, shows meeting URL hint) ───────────── */}
      {isConfirmed && sessionIsActive && session?.meetingUrl && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs text-clinical-gray font-medium">Session is live.</span>
          <span className="text-xs text-clinical-gray truncate max-w-xs opacity-60">
            {session.meetingUrl}
          </span>
        </div>
      )}
    </motion.div>
  );
}
