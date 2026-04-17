"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  User,
  Activity,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi } from "@/lib/api";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  reason?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>({
    name: "Doctor",
    email: "doctor@example.com",
    id: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("pending");

  // Fetch appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const doctorId = localStorage.getItem("id"); // Align with login page
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        setUserDetails({
          name: name || "Doctor",
          email: email || "doctor@example.com",
          id: doctorId,
        });

        if (!doctorId) {
          setError("Doctor ID not found. Please log in again.");
          setIsLoading(false);
          return;
        }

        // Fetch appointments from API
        const response = await appointmentApi.getAppointments(doctorId, "doctor");
        if (response.data) {
          setAppointments(response.data);
          // Auto-switch tab if no pending items
          const pendingCount = response.data.filter((a: any) => a.status === 'PENDING').length;
          if (pendingCount === 0) setActiveTab("confirmed");
        }
      } catch (err: any) {
        console.error("Error loading appointments:", err);
        setError("Failed to load real-time appointments. Showing demo data.");
        
        // Mock data fallback
        setAppointments([
          {
            id: "1",
            patientId: "pat1",
            patientName: "John Doe",
            appointmentDate: "2026-04-20",
            timeSlot: "09:00 AM",
            status: "PENDING",
            reason: "Persistent cough",
          },
          {
            id: "2",
            patientId: "pat2",
            patientName: "Alice Smith",
            appointmentDate: "2026-04-21",
            timeSlot: "11:00 AM",
            status: "CONFIRMED",
            reason: "Follow-up",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      await appointmentApi.confirmAppointment(appointmentId);
      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: "CONFIRMED" } : apt
      ));
      alert("Appointment approved successfully!");
    } catch (err) {
      console.error("Approval failed:", err);
      alert("Failed to approve appointment.");
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === "pending") return apt.status === "PENDING";
    if (activeTab === "confirmed") return apt.status === "CONFIRMED" || apt.status === "ACCEPTED" || apt.status === "ACTIVE";
    return false;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading your medical schedule...</p>
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
              Welcome Back, <span className="text-brand-primary">Dr. {userDetails.name}</span>
            </h1>
            <p className="text-clinical-gray mt-2">Manage your patient appointments and requests</p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/doctor/management"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center space-x-2 font-bold"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Schedule Settings</span>
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="glass p-6 rounded-3xl border border-brand-primary/10">
             <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-brand-primary" />
                <span className="text-xs font-bold text-clinical-gray uppercase tracking-widest">Total Patients</span>
             </div>
             <p className="text-3xl font-bold text-clinical-dark dark:text-clinical-white">{appointments.length}</p>
          </div>
          <div className="glass p-6 rounded-3xl border border-yellow-500/10">
             <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-xs font-bold text-clinical-gray uppercase tracking-widest">Pending Requests</span>
             </div>
             <p className="text-3xl font-bold text-yellow-500">{appointments.filter(a => a.status === 'PENDING').length}</p>
          </div>
          <div className="glass p-6 rounded-3xl border border-green-500/10">
             <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-clinical-gray uppercase tracking-widest">Confirmed Today</span>
             </div>
             <p className="text-3xl font-bold text-green-500">
                {appointments.filter(a => (a.status === 'CONFIRMED' || a.status === 'ACCEPTED') && a.appointmentDate === new Date().toISOString().split('T')[0]).length}
             </p>
          </div>
          <div className="glass p-6 rounded-3xl border border-blue-500/10">
             <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-bold text-clinical-gray uppercase tracking-widest">Completed</span>
             </div>
             <p className="text-3xl font-bold text-blue-500">{appointments.filter(a => a.status === 'COMPLETED').length}</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8 w-max">
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "pending" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary" : "text-clinical-gray"}`}
          >
            Pending Requests 
            {appointments.filter(a => a.status === 'PENDING').length > 0 && (
              <span className="bg-brand-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {appointments.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("confirmed")}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "confirmed" ? "bg-white dark:bg-slate-700 shadow-sm text-brand-primary" : "text-clinical-gray"}`}
          >
            Confirmed Schedule
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {filteredAppointments.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 glass rounded-3xl">
                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-clinical-gray">No appointments found in this section.</p>
              </motion.div>
            ) : (
              filteredAppointments.map((apt, idx) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl transition-all border-l-[6px] border-l-brand-primary group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0 group-hover:scale-110 transition-transform">
                      <User className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-clinical-dark dark:text-clinical-white transition-colors group-hover:text-brand-primary">{apt.patientName}</h4>
                      <p className="text-sm text-clinical-gray mt-1 flex items-center gap-2">
                         <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">ID: {apt.patientId.substring(0, 8)}...</span>
                         {apt.reason && <span className="truncate max-w-[200px]">• {apt.reason}</span>}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-clinical-dark dark:text-clinical-white">
                          <Calendar className="w-3.5 h-3.5 text-brand-primary" /> {apt.appointmentDate}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-clinical-dark dark:text-clinical-white">
                          <Clock className="w-3.5 h-3.5 text-brand-primary" /> {apt.timeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeTab === "pending" ? (
                      <>
                        <button 
                          onClick={() => handleApproveAppointment(apt.id)}
                          className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-brand-primary/20"
                        >
                          <Check className="w-5 h-5" /> Approve
                        </button>
                        <button 
                           className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20"
                           title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                         <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Confirmed
                         </span>
                         <button className="p-3 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all">
                            <ChevronRight className="w-5 h-5" />
                         </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
