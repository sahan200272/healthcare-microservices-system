"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp,
  ChevronRight,
  Loader2,
  Activity,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { appointmentApi, doctorApi } from "@/lib/api";
import StatsCard from "@/app/components/doctor/StatsCard";
import type { Appointment, PrescriptionResponse } from "@/lib/doctorTypes";

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  CONFIRMED: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  ACCEPTED:  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  COMPLETED: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  CANCELLED: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  REJECTED:  "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  ACTIVE:    "bg-brand-primary/10 text-brand-primary",
};

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  const doctorName =
    typeof window !== "undefined" ? localStorage.getItem("name") || "Doctor" : "Doctor";

  const fetchData = async () => {
    setLoading(true);
    try {
      const [apptRes, rxRes] = await Promise.allSettled([
        doctorApi.getAppointments(doctorId),
        doctorApi.getDoctorPrescriptions(doctorId),
      ]);
      setAppointments(
        apptRes.status === "fulfilled" ? apptRes.value.data ?? [] : []
      );
      setPrescriptions(
        rxRes.status === "fulfilled" ? rxRes.value.data ?? [] : []
      );
      setLastRefreshed(new Date());
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [doctorId]);

  const today = new Date().toISOString().split("T")[0];
  const stats = useMemo(() => ({
    today:      appointments.filter((a) => a.appointmentDate === today).length,
    pending:    appointments.filter((a) => a.status === "PENDING").length,
    confirmed:  appointments.filter((a) => a.status === "CONFIRMED" || a.status === "ACCEPTED" || a.status === "ACTIVE").length,
    completed:  appointments.filter((a) => a.status === "COMPLETED").length,
    totalRx:    prescriptions.length,
    patients:   new Set(appointments.map((a) => a.patientId)).size,
  }), [appointments, prescriptions, today]);

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED" || a.status === "ACCEPTED" || a.status === "ACTIVE")
        .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
        .slice(0, 5),
    [appointments]
  );

  const recentPrescriptions = useMemo(
    () => prescriptions.slice(0, 3),
    [prescriptions]
  );

  return (
    <div className="px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight"
          >
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"},
            {" "}
            <span className="text-brand-primary">Dr. {doctorName.split(" ")[0]}</span> 👋
          </motion.h1>
          <p className="text-clinical-gray mt-1 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-clinical-gray hover:text-brand-primary hover:border-brand-primary rounded-xl text-sm font-bold transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/doctor/appointments"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-primary/30"
          >
            <Calendar className="w-4 h-4" /> View Appointments
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.08 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <StatsCard label="Today"     value={stats.today}    icon={Calendar}   color="text-brand-primary"  bgColor="bg-brand-primary/10" />
          <StatsCard label="Pending"   value={stats.pending}  icon={Clock}      color="text-amber-500"       bgColor="bg-amber-500/10" />
          <StatsCard label="Confirmed" value={stats.confirmed} icon={CheckCircle2} color="text-emerald-500" bgColor="bg-emerald-500/10" />
          <StatsCard label="Completed" value={stats.completed} icon={Activity}  color="text-blue-500"        bgColor="bg-blue-500/10" />
          <StatsCard label="Rx Issued" value={stats.totalRx}  icon={FileText}   color="text-brand-accent"   bgColor="bg-brand-accent/10" />
          <StatsCard label="Patients"  value={stats.patients} icon={Users}      color="text-cyan-500"        bgColor="bg-cyan-500/10" />
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming Appointments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-primary" />
              Upcoming Appointments
            </h2>
            <Link
              href="/doctor/appointments"
              className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="glass rounded-2xl py-12 text-center">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-clinical-gray font-medium">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt, idx) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Stethoscope className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-clinical-dark dark:text-clinical-white truncate">
                      {apt.patientName}
                    </p>
                    <p className="text-xs text-clinical-gray truncate">{apt.reason}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-semibold text-clinical-dark dark:text-clinical-white flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-brand-primary" /> {apt.appointmentDate}
                      </span>
                      <span className="text-xs font-semibold text-clinical-dark dark:text-clinical-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-brand-primary" /> {apt.timeSlot}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[apt.status] ?? ""}`}>
                    {apt.status}
                  </span>
                  <Link
                    href={`/doctor/appointments`}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4 text-brand-primary" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { href: "/doctor/appointments", label: "Manage Appointments", icon: Calendar, color: "text-brand-primary bg-brand-primary/10 hover:bg-brand-primary/20" },
                { href: "/doctor/prescriptions", label: "Issue Prescription",  icon: FileText, color: "text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20" },
                { href: "/doctor/management",   label: "Update Profile",       icon: Stethoscope, color: "text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20" },
              ].map(({ href, label, icon: Icon, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${color}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-accent" />
                Recent Rx
              </h2>
              <Link href="/doctor/prescriptions" className="text-xs font-bold text-brand-primary hover:underline">
                View all
              </Link>
            </div>
            {recentPrescriptions.length === 0 ? (
              <div className="glass rounded-2xl py-8 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-clinical-gray">No prescriptions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPrescriptions.map((rx, idx) => (
                  <motion.div
                    key={rx.prescriptionId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="glass rounded-xl p-3 flex items-center gap-3"
                  >
                    <div className="p-2 bg-brand-accent/10 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-brand-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-clinical-dark dark:text-clinical-white truncate">
                        {rx.diagnosis}
                      </p>
                      <p className="text-[11px] text-clinical-gray">
                        {rx.issuedAt
                          ? new Date(rx.issuedAt).toLocaleDateString()
                          : "Recently"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
