"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Activity,
  Plus,
  Mail,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCcw,
  History,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi, patientApi } from "@/lib/api";

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  speciality: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
}

export default function PatientDashboard() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>({
    name: "Patient",
    email: "patient@example.com",
    id: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "history">("confirmed");

  // Fetch appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const userId = localStorage.getItem("id"); // Align with login page
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        if (!userId) {
          setError("Patient ID not found. Please log in again.");
          setIsLoading(false);
          return;
        }

        // Fetch actual patient ID
        let realPatientId = userId;
        try {
          const profileRes = await patientApi.getProfileByUserId(userId);
          if (profileRes.data?.patientId) {
            realPatientId = profileRes.data.patientId;
          }
        } catch (err) {
          console.warn("Could not fetch real patient ID, falling back to userId");
        }

        setUserDetails({
          name: name || "Patient",
          email: email || "patient@example.com",
          id: realPatientId,
        });

        // Fetch appointments from API
        const response = await appointmentApi.getAppointments(realPatientId, "patient");
        if (response.data) {
          setAppointments(response.data);
        }
      } catch (err: any) {
        console.error("Error loading appointments:", err);
        setError("Failed to load your real-time appointments. Showing demo data.");
        
        // Mock data fallback
        setAppointments([
          {
            id: "1",
            doctorId: "doc1",
            doctorName: "Dr. Sarah Johnson",
            speciality: "General Practitioner",
            appointmentDate: "2026-04-20",
            timeSlot: "09:00 AM",
            status: "CONFIRMED",
          },
          {
            id: "2",
            doctorId: "doc2",
            doctorName: "Dr. Michael Chen",
            speciality: "Cardiologist",
            appointmentDate: "2026-04-22",
            timeSlot: "02:00 PM",
            status: "PENDING",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
    try {
      await appointmentApi.cancelAppointment(appointmentId);
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
      alert("Appointment cancelled successfully.");
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === "pending") return apt.status === "PENDING";
    if (activeTab === "confirmed") return apt.status === "CONFIRMED" || apt.status === "ACTIVE" || apt.status === "ACCEPTED";
    if (activeTab === "history") return apt.status === "COMPLETED" || apt.status === "CANCELLED" || apt.status === "REJECTED";
    return false;
  });

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

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6 rounded-3xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary/5 to-transparent">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white">Confirmed</h3>
            </div>
            <p className="text-3xl font-bold text-brand-primary">{appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'ACTIVE' || a.status === 'ACCEPTED').length}</p>
            <p className="text-sm text-clinical-gray">Ready for visitation</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6 rounded-3xl border border-yellow-500/10 bg-gradient-to-br from-yellow-500/5 to-transparent">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white">Awaiting Approval</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-500">{appointments.filter(a => a.status === 'PENDING').length}</p>
            <p className="text-sm text-clinical-gray">Pending doctor's review</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6 rounded-3xl border border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent">
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
          <button 
            onClick={() => setActiveTab("confirmed")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "confirmed" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary" : "text-clinical-gray"}`}
          >
            Confirmed
          </button>
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "pending" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary" : "text-clinical-gray"}`}
          >
            Requested
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "history" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary" : "text-clinical-gray"}`}
          >
            History
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {filteredAppointments.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 glass rounded-3xl">
                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-clinical-gray">No appointments found in this category.</p>
              </motion.div>
            ) : (
              filteredAppointments.map((apt, idx) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-l-brand-primary group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">{apt.doctorName}</h4>
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

                  <div className="flex items-center gap-3 self-end md:self-auto">
                    {!(apt.status === 'COMPLETED' || apt.status === 'CANCELLED' || apt.status === 'REJECTED') && (
                      <>
                        <button 
                          onClick={() => router.push(`/doctors/${apt.doctorId}/book?reschedule=${apt.id}`)}
                          className="p-3 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                          title="Reschedule"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">Reschedule</span>
                        </button>
                        <button 
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all flex items-center gap-2 text-sm font-bold"
                          title="Cancel"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Cancel</span>
                        </button>
                      </>
                    )}
                    {(apt.status === 'CONFIRMED' || apt.status === 'ACCEPTED' || apt.status === 'ACTIVE') && (
                       <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ml-2">
                        <CheckCircle2 className="w-4 h-4" /> Confirmed
                       </span>
                    )}
                    {apt.status === 'PENDING' && (
                       <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ml-2">
                        <Clock className="w-4 h-4" /> Pending
                       </span>
                    )}
                    {apt.status === 'COMPLETED' && (
                       <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ml-2">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                       </span>
                    )}
                    {(apt.status === 'CANCELLED' || apt.status === 'REJECTED') && (
                       <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ml-2">
                        <XCircle className="w-4 h-4" /> {apt.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                       </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
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
