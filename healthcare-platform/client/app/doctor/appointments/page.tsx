"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { appointmentApi, doctorApi } from "@/lib/api";
import AppointmentCard from "@/app/components/doctor/AppointmentCard";
import Toast, { useToast } from "@/app/components/doctor/Toast";
import type { Appointment, AppointmentStatus } from "@/lib/doctorTypes";

type FilterStatus = "ALL" | AppointmentStatus;

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const { toasts, addToast, dismiss } = useToast();

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  useEffect(() => { fetchAppointments(); }, [doctorId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getAppointments(doctorId);
      setAppointments(res.data ?? []);
    } catch {
      setAppointments([]);
      addToast("Failed to load appointments.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id + "-accept");
    try {
      await doctorApi.acceptAppointment(doctorId, id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CONFIRMED" } : a))
      );
      addToast("Appointment accepted successfully.", "success");
    } catch {
      addToast("Failed to accept appointment.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "-reject");
    try {
      await doctorApi.rejectAppointment(doctorId, id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
      addToast("Appointment rejected.", "info");
    } catch {
      addToast("Failed to reject appointment.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id + "-complete");
    try {
      await doctorApi.completeAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "COMPLETED" } : a))
      );
      addToast("Appointment marked as completed.", "success");
    } catch {
      addToast("Failed to complete appointment.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (a.patientName?.toLowerCase().includes(q) ?? false) ||
        (a.reason?.toLowerCase().includes(q) ?? false) ||
        (a.appointmentDate?.includes(q) ?? false);
        
      const isConfirmed = a.status === "CONFIRMED" || a.status === "ACCEPTED" || a.status === "ACTIVE";
      const isCancelled = a.status === "CANCELLED" || a.status === "REJECTED";
      
      let matchStatus = false;
      if (statusFilter === "ALL") matchStatus = true;
      else if (statusFilter === "CONFIRMED") matchStatus = isConfirmed;
      else if (statusFilter === "CANCELLED") matchStatus = isCancelled;
      else matchStatus = a.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [appointments, searchQuery, statusFilter]);

  const counts = useMemo(
    () => ({
      all:       appointments.length,
      pending:   appointments.filter((a) => a.status === "PENDING").length,
      confirmed: appointments.filter((a) => a.status === "CONFIRMED" || a.status === "ACCEPTED" || a.status === "ACTIVE").length,
      completed: appointments.filter((a) => a.status === "COMPLETED").length,
      cancelled: appointments.filter((a) => a.status === "CANCELLED" || a.status === "REJECTED").length,
    }),
    [appointments]
  );

  const FILTERS: { label: string; value: FilterStatus; count: number; color: string }[] = [
    { label: "All",       value: "ALL",       count: counts.all,       color: "text-clinical-dark dark:text-clinical-white" },
    { label: "Pending",   value: "PENDING",   count: counts.pending,   color: "text-amber-500" },
    { label: "Confirmed", value: "CONFIRMED", count: counts.confirmed, color: "text-emerald-500" },
    { label: "Completed", value: "COMPLETED", count: counts.completed, color: "text-blue-500" },
    { label: "Cancelled", value: "CANCELLED", count: counts.cancelled, color: "text-red-500" },
  ];

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Appointments
            </h1>
            <p className="text-clinical-gray text-sm mt-1">
              Manage patient appointment requests and sessions
            </p>
          </div>
          <button
            onClick={fetchAppointments}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-clinical-gray hover:text-brand-primary hover:border-brand-primary transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats filter chips */}
        <div className="flex flex-wrap gap-3">
          {FILTERS.map(({ label, value, count, color }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                statusFilter === value
                  ? "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/30"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-clinical-gray hover:border-brand-primary"
              }`}
            >
              <span className={statusFilter === value ? "text-white" : color}>
                {count}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
          <input
            id="appointment-search"
            type="text"
            placeholder="Search patient name, reason, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-clinical-dark dark:text-clinical-white placeholder-clinical-gray outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-3xl py-20 text-center"
              >
                <Calendar className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-clinical-gray font-bold text-lg">No appointments found</p>
                <p className="text-clinical-gray text-sm mt-1">
                  Try adjusting your search or filter.
                </p>
              </motion.div>
            ) : (
              <motion.div key="list" className="space-y-4">
                {filtered.map((apt, idx) => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    doctorId={doctorId}
                    index={idx}
                    actionLoading={actionLoading}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
}
