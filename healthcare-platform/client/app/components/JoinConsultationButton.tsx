"use client";

import { Video, Loader2, Clock, CheckCircle2, WifiOff } from "lucide-react";
import { useState } from "react";

interface JoinConsultationButtonProps {
  meetingUrl: string;
  appointmentDate: string; // "YYYY-MM-DD"
  timeSlot: string;        // "HH:mm" or "HH:mm - HH:mm"
  /**
   * When true, bypasses the appointment-time check so the button is always enabled.
   * Use this when the doctor has already activated the session (status === "ACTIVE").
   */
  forceEnabled?: boolean;
  disabled?: boolean;
}

/**
 * Determines whether the appointment time has been reached.
 * Allows joining 5 minutes before the start time.
 */
function isAppointmentTimeReached(appointmentDate: string, timeSlot: string): boolean {
  try {
    const startTime = timeSlot.split("-")[0].trim();
    const [hours, minutes] = startTime.split(":").map(Number);
    const apptDate = new Date(
      `${appointmentDate}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    );
    const now = new Date();
    apptDate.setMinutes(apptDate.getMinutes() - 5); // 5-min early window
    return now >= apptDate;
  } catch {
    return true; // If parsing fails, don't block the user
  }
}

export default function JoinConsultationButton({
  meetingUrl,
  appointmentDate,
  timeSlot,
  forceEnabled = false,
  disabled = false,
}: JoinConsultationButtonProps) {
  const [isJoining, setIsJoining] = useState(false);

  // If forceEnabled (doctor started → ACTIVE), skip the time check
  const timeReached = forceEnabled || isAppointmentTimeReached(appointmentDate, timeSlot);
  const isDisabled = disabled || !timeReached;

  const handleJoin = () => {
    if (isDisabled || !meetingUrl) return;
    setIsJoining(true);
    window.open(meetingUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => setIsJoining(false), 1500);
  };

  return (
    <div className="relative group/btn">
      <button
        id={`join-consultation-${appointmentDate}`}
        onClick={handleJoin}
        disabled={isDisabled || isJoining}
        aria-label={isDisabled ? "Consultation not available yet" : "Join video consultation"}
        className={`
          relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold
          transition-all duration-300 select-none
          ${isDisabled
            ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 hover:scale-105 hover:shadow-emerald-500/50 active:scale-95"
          }
        `}
      >
        {isJoining ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Video className="w-4 h-4" />
        )}
        <span>{isJoining ? "Opening..." : "Join Consultation"}</span>

        {/* Glow ring on hover (enabled state only) */}
        {!isDisabled && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300 pointer-events-none" />
        )}
      </button>

      {/* Tooltip when button is disabled */}
      {isDisabled && (
        <div
          role="tooltip"
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg
            whitespace-nowrap pointer-events-none z-50
            opacity-0 group-hover/btn:opacity-100
            transition-opacity duration-200
            flex items-center gap-1.5 shadow-xl
          "
        >
          <Clock className="w-3 h-3 text-yellow-400 shrink-0" />
          Doctor has not started the session yet
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </div>
      )}
    </div>
  );
}
