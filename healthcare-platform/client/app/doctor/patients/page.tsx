"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Search, Stethoscope, ChevronRight, Loader2, User, AlertCircle } from "lucide-react";
import Link from "next/link";
import { appointmentApi, doctorApi, patientApi } from "@/lib/api";
import Toast, { useToast } from "@/app/components/doctor/Toast";
import type { Appointment } from "@/lib/doctorTypes";

// Derive unique patients from appointment history
interface PatientSummary {
  patientId: string;
  patientName: string;
  lastAppointmentDate: string;
  totalAppointments: number;
  lastReason?: string;
}



export default function DoctorPatientsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientDetails, setPatientDetails] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toasts, addToast, dismiss } = useToast();

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await doctorApi.getAppointments(doctorId);
        const apps = res.data ?? [];
        setAppointments(apps);

        const uniquePatientIds = Array.from(new Set<string>(apps.map((a: any) => a.patientId)));
        const detailsMap: Record<string, any> = {};

        await Promise.all(
          uniquePatientIds.map(async (pid) => {
            try {
              // Patients are stored using userId in the patient service
              const pRes = await patientApi.getProfileByUserId(pid);
              if (pRes.data) {
                detailsMap[pid] = pRes.data;
              }
            } catch (err) {
              console.error(`Failed to fetch patient details for ${pid}:`, err);
            }
          })
        );
        setPatientDetails(detailsMap);
      } catch {
        setAppointments([]);
        addToast("Failed to load patient history.", "error");
      } finally {
        setLoading(false);
      }
    };
    if (doctorId) load();
  }, [doctorId]);

  // Aggregate unique patients
  const patients = useMemo<PatientSummary[]>(() => {
    const map = new Map<string, PatientSummary>();
    appointments.forEach((a) => {
      const existing = map.get(a.patientId);
      const pDetails = patientDetails[a.patientId];
      if (!existing) {
        map.set(a.patientId, {
          patientId: a.patientId,
          patientName: pDetails?.fullName || pDetails?.patientName || "",
          lastAppointmentDate: a.appointmentDate,
          totalAppointments: 1,
          lastReason: a.reason,
        });
      } else {
        map.set(a.patientId, {
          ...existing,
          totalAppointments: existing.totalAppointments + 1,
          lastAppointmentDate:
            a.appointmentDate > existing.lastAppointmentDate
              ? a.appointmentDate
              : existing.lastAppointmentDate,
          lastReason:
            a.appointmentDate > existing.lastAppointmentDate
              ? a.reason
              : existing.lastReason,
        });
      }
    });
    // Filter out completely missing patient names to avoid showing bad data
    return Array.from(map.values())
      .filter((p) => p.patientName.trim().length > 0)
      .sort((a, b) => b.lastAppointmentDate.localeCompare(a.lastAppointmentDate));
  }, [appointments, patientDetails]);

  const filtered = patients.filter((p) =>
    (p.patientName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    (p.patientId?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
            My Patients
          </h1>
          <p className="text-clinical-gray text-sm mt-1">
            Patients derived from your appointment history
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary/10 rounded-xl">
          <Users className="w-4 h-4 text-brand-primary" />
          <span className="text-sm font-bold text-brand-primary">{patients.length} Total Patients</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
        <input
          id="patient-search"
          type="text"
          placeholder="Search by patient name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-clinical-dark dark:text-clinical-white placeholder-clinical-gray outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
        />
      </div>

      {/* Patient Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-3xl py-20 text-center"
        >
          <Users className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <p className="text-clinical-gray font-bold text-lg">No patients found</p>
          <p className="text-clinical-gray text-sm mt-1">
            Patients will appear here once you have appointment history.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((patient, idx) => (
            <motion.div
              key={patient.patientId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/doctor/patients/${patient.patientId}`}
                className="glass rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-brand-primary/30 border border-transparent transition-all group block"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white text-lg font-bold shrink-0 group-hover:scale-105 transition-transform">
                  {patient.patientName ? patient.patientName.charAt(0) : "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-clinical-dark dark:text-clinical-white truncate">
                    {patient.patientName}
                  </p>
                  {patient.lastReason && (
                    <p className="text-xs text-clinical-gray truncate mt-0.5">
                      Last: {patient.lastReason}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
                      {patient.totalAppointments} visit{patient.totalAppointments !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-clinical-gray">
                      {patient.lastAppointmentDate}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-clinical-gray opacity-40 group-hover:opacity-100 group-hover:text-brand-primary transition-all shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
