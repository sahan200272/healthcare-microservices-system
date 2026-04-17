"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Plus,
  Loader2,
  Calendar,
  Pill,
  User,
  RefreshCw,
  AlertCircle,
  Search,
} from "lucide-react";
import { doctorApi } from "@/lib/api";
import PrescriptionModal from "@/app/components/doctor/PrescriptionModal";
import Toast, { useToast } from "@/app/components/doctor/Toast";
import type { PrescriptionResponse } from "@/lib/doctorTypes";

function PrescriptionsContent() {
  const searchParams = useSearchParams();
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { toasts, addToast, dismiss } = useToast();

  // Pre-fill from query params (coming from appointments page)
  const prefilledAppointmentId = searchParams.get("appointmentId") || "";
  const prefilledPatientId = searchParams.get("patientId") || "";
  const prefilledPatientName = searchParams.get("patientName") || "";

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch prescriptions and appointments in parallel so we can resolve patient names
      const [rxRes, apptRes] = await Promise.allSettled([
        doctorApi.getDoctorPrescriptions(doctorId),
        doctorApi.getAppointments(doctorId),
      ]);

      const rawRx: PrescriptionResponse[] =
        rxRes.status === "fulfilled" ? rxRes.value.data ?? [] : [];

      // Build appointmentId → patientName lookup from appointments
      const nameMap = new Map<string, string>();
      if (apptRes.status === "fulfilled") {
        (apptRes.value.data ?? []).forEach((apt: import("@/lib/doctorTypes").Appointment) => {
          if (apt.id && apt.patientName) nameMap.set(apt.id, apt.patientName);
        });
      }

      // Enrich each prescription with the resolved patient name
      const enriched = rawRx.map((rx) => ({
        ...rx,
        patientName: nameMap.get(rx.appointmentId) ?? rx.patientId,
      }));

      setPrescriptions(enriched);
    } catch {
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    fetchPrescriptions();
    // Auto-open modal if coming from appointments with query params
    if (prefilledAppointmentId && prefilledPatientId) {
      setModalOpen(true);
    }
  }, [fetchPrescriptions]);

  const filtered = prescriptions.filter((rx) =>
    rx.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    rx.patientId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <PrescriptionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        doctorId={doctorId}
        appointmentId={prefilledAppointmentId}
        patientId={prefilledPatientId}
        patientName={prefilledPatientName || "Patient"}
        onSuccess={() => {
          addToast("Prescription issued successfully!", "success");
          fetchPrescriptions();
        }}
      />

      <div className="px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Prescriptions
            </h1>
            <p className="text-clinical-gray text-sm mt-1">
              All digital prescriptions you have issued
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPrescriptions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-clinical-gray hover:text-brand-primary hover:border-brand-primary transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              id="issue-prescription-btn"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-accent/30"
            >
              <Plus className="w-4 h-4" /> Issue Prescription
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
          <input
            id="prescription-search"
            type="text"
            placeholder="Search by diagnosis or patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-clinical-dark dark:text-clinical-white placeholder-clinical-gray outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
          />
        </div>

        {/* Content */}
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
            <FileText className="w-14 h-14 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-clinical-gray font-bold text-lg">No prescriptions found</p>
            <p className="text-clinical-gray text-sm mt-1">
              Issue your first prescription using the button above.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-6 px-6 py-2.5 bg-brand-accent text-white rounded-xl text-sm font-bold hover:bg-brand-accent/90 transition-all"
            >
              Issue Prescription
            </button>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-4">
              {filtered.map((rx, idx) => (
                <PrescriptionCard key={rx.prescriptionId} prescription={rx} index={idx} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

function PrescriptionCard({
  prescription: rx,
  index,
}: {
  prescription: PrescriptionResponse;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="p-2.5 bg-brand-accent/10 rounded-xl shrink-0">
          <FileText className="w-5 h-5 text-brand-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-bold text-clinical-dark dark:text-clinical-white">
              {rx.diagnosis}
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent">
              {rx.medications.length} med{rx.medications.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-clinical-gray">
              <User className="w-3 h-3" /> {rx.patientName || rx.patientId}
            </span>
            <span className="flex items-center gap-1 text-xs text-clinical-gray">
              <Calendar className="w-3 h-3" />
              {rx.issuedAt
                ? new Date(rx.issuedAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-clinical-gray"
        >
          ▾
        </motion.div>
      </button>

      {/* Expanded: medications table */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 space-y-4">
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-clinical-gray uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5" /> Medications
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs font-bold text-clinical-gray uppercase tracking-wider">
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Dosage</th>
                        <th className="pb-2 pr-4">Frequency</th>
                        <th className="pb-2 pr-4">Duration</th>
                        <th className="pb-2">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {rx.medications.map((m, i) => (
                        <tr key={i} className="text-clinical-dark dark:text-clinical-white">
                          <td className="py-2 pr-4 font-semibold">{m.name}</td>
                          <td className="py-2 pr-4">{m.dosage}</td>
                          <td className="py-2 pr-4">{m.frequency}</td>
                          <td className="py-2 pr-4">{m.duration}</td>
                          <td className="py-2 text-clinical-gray">{m.instructions || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {rx.notes && (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-clinical-dark dark:text-white">Notes: </span>
                  {rx.notes}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function DoctorPrescriptionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}>
      <PrescriptionsContent />
    </Suspense>
  );
}
