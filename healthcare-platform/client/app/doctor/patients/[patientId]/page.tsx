"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  MapPin,
  FileText,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { doctorApi } from "@/lib/api";
import PatientReportCard, { NoReportsState } from "@/app/components/doctor/PatientReportCard";
import Toast, { useToast } from "@/app/components/doctor/Toast";
import type { PatientDetails, MedicalReport } from "@/lib/doctorTypes";

const MOCK_PATIENT: PatientDetails = {
  patientId: "p1",
  userId: "u1",
  fullName: "John Doe",
  email: "john.doe@example.com",
  phone: "+1 (555) 000-1234",
  dateOfBirth: "1985-06-15",
  gender: "Male",
  bloodType: "A+",
  address: "123 Main Street, Colombo, Sri Lanka",
  emergencyContact: "+1 (555) 000-9999",
};

const MOCK_REPORTS: MedicalReport[] = [
  { reportId: "r1", patientId: "p1", title: "CBC Blood Test — April 2026", reportType: "LAB",     description: "Full blood count including hemoglobin and platelets.", uploadedAt: "2026-04-10T09:00:00Z" },
  { reportId: "r2", patientId: "p1", title: "Chest X-Ray",                 reportType: "IMAGING", description: "PA view of the chest, no abnormalities detected.",      uploadedAt: "2026-04-05T14:30:00Z" },
];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "reports">("overview");
  const { toasts, addToast, dismiss } = useToast();

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [patRes, repRes] = await Promise.allSettled([
          doctorApi.getPatientDetails(doctorId, patientId),
          doctorApi.getPatientReports(doctorId, patientId),
        ]);
        setPatient(patRes.status === "fulfilled" ? patRes.value.data : MOCK_PATIENT);
        setReports(repRes.status === "fulfilled" ? repRes.value.data ?? [] : MOCK_REPORTS);
      } catch {
        setPatient(MOCK_PATIENT);
        setReports(MOCK_REPORTS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId, patientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-3" />
          <p className="text-clinical-gray">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-clinical-dark dark:text-clinical-white font-bold">Patient not found</p>
          <Link href="/doctor/appointments" className="text-brand-primary text-sm hover:underline mt-2 block">
            ← Back to appointments
          </Link>
        </div>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
    : null;

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="px-8 py-8 space-y-6">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold text-clinical-gray hover:text-brand-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Patient Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8"
        >
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-brand-primary/30 shrink-0">
              {patient.fullName.charAt(0)}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">
                  {patient.fullName}
                </h1>
                {patient.bloodType && (
                  <span className="flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <Heart className="w-3 h-3" /> {patient.bloodType}
                  </span>
                )}
                {patient.gender && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {patient.gender}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Mail,     value: patient.email },
                  { icon: Phone,    value: patient.phone },
                  ...(age ? [{ icon: Calendar, value: `${age} years old` }] : []),
                  ...(patient.address ? [{ icon: MapPin, value: patient.address }] : []),
                  ...(patient.emergencyContact ? [{ icon: ShieldCheck, value: `Emergency: ${patient.emergencyContact}` }] : []),
                ].map(({ icon: Icon, value }, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-clinical-gray">
                    <Icon className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="truncate">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick action */}
            <Link
              href={`/doctor/prescriptions?patientId=${patient.patientId}&patientName=${encodeURIComponent(patient.fullName || "Unknown")}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-accent/30 shrink-0"
            >
              <FileText className="w-4 h-4" /> Issue Prescription
            </Link>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["overview", "reports"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30"
                  : "bg-white dark:bg-slate-800 text-clinical-gray hover:text-brand-primary border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab === "reports" ? `Medical Reports (${reports.length})` : "Overview"}
            </button>
          ))}
        </div>

        {/* Tab: Overview */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8"
          >
            <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-brand-primary" /> Patient Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: "Full Name",          value: patient.fullName },
                { label: "Email",              value: patient.email },
                { label: "Phone",              value: patient.phone },
                { label: "Date of Birth",      value: patient.dateOfBirth ?? "—" },
                { label: "Gender",             value: patient.gender ?? "—" },
                { label: "Blood Type",         value: patient.bloodType ?? "—" },
                { label: "Address",            value: patient.address ?? "—" },
                { label: "Emergency Contact",  value: patient.emergencyContact ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <p className="text-xs font-bold text-clinical-gray uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-clinical-dark dark:text-clinical-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tab: Reports */}
        {activeTab === "reports" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                Medical Reports
              </h2>
              <span className="text-xs font-bold text-clinical-gray">
                {reports.length} record{reports.length !== 1 ? "s" : ""}
              </span>
            </div>
            {reports.length === 0 ? (
              <NoReportsState />
            ) : (
              reports.map((r, i) => (
                <PatientReportCard key={r.reportId} report={r} index={i} />
              ))
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}
