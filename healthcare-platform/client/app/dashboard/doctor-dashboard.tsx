"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Video,
  User,
  Activity,
  ChevronRight,
  Bell,
  Users,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi, telemedicineApi } from "@/lib/api";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  meetingUrl?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>({
    name: "Doctor",
    email: "doctor@example.com",
    id: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeAppointments, setActiveAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [startableAppointmentIds, setStartableAppointmentIds] = useState<Set<string>>(new Set());

  // Fetch appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const doctorId = localStorage.getItem("id");
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        setUserDetails({
          name: name || "Doctor",
          email: email || "doctor@example.com",
          id: doctorId,
        });

        if (!doctorId) {
          setError("Doctor ID not found");
          setIsLoading(false);
          return;
        }

        // Fetch appointments from API
        const response = await appointmentApi.getAppointments(doctorId, "doctor");
        if (response.data) {
          const confirmednAppointments = response.data
            .filter((apt: any) => apt.status === "CONFIRMED" || apt.status === "ACTIVE")
            .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

          const active = confirmednAppointments.filter((apt: any) => apt.status === "ACTIVE");
          setAppointments(confirmednAppointments);
          setActiveAppointments(active);
        }
      } catch (err: any) {
        console.error("Error loading appointments:", err);
        setError("Failed to load appointments");

        // Load mock data for demonstration
        setAppointments([
          {
            id: "1",
            patientId: "pat1",
            patientName: "John Doe",
            appointmentDate: new Date().toISOString().split("T")[0],
            appointmentTime: new Date(Date.now() + 10 * 60000).toISOString().split("T")[1].substring(0, 5),
            status: "CONFIRMED",
          },
          {
            id: "2",
            patientId: "pat2",
            patientName: "Jane Smith",
            appointmentDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
            appointmentTime: "14:00",
            status: "CONFIRMED",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointments();
  }, []);

  // Check appointment timing every minute
  useEffect(() => {
    const checkAppointmentTiming = () => {
      const now = new Date();
      const startable = new Set<string>();

      appointments.forEach((apt) => {
        const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
        const minutesUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

        // Enable start button from 15 min before to any time after appointment
        if (minutesUntilAppointment >= -15 && apt.status === "CONFIRMED") {
          startable.add(apt.id);
        }
      });

      setStartableAppointmentIds(startable);
    };

    checkAppointmentTiming();
    const interval = setInterval(checkAppointmentTiming, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [appointments]);

  const handleStartConsultation = async (appointment: Appointment) => {
    try {
      // Get the meeting URL from telemedicine service
      const sessionResponse = await telemedicineApi.getSessionInfo(appointment.id);
      const meetingUrl = sessionResponse.data.meetingUrl || `jitsi://conference-${appointment.id}`;

      // Update appointment status to ACTIVE (doctor starts first)
      await appointmentApi.updateAppointmentStatus(appointment.id, "ACTIVE");

      // Open Jitsi in a new tab
      window.open(meetingUrl, "_blank");

      // Update local state
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointment.id ? { ...apt, status: "ACTIVE" } : apt
        )
      );
      setActiveAppointments((prev) => [...prev, appointment]);
    } catch (err: any) {
      console.error("Error starting consultation:", err);
      // Fallback: Open generic Jitsi URL
      const fallbackUrl = `https://meet.jitsi.nsf.gov/healthcare-${appointment.id}`;
      window.open(fallbackUrl, "_blank");
    }
  };

  const getTimeStatus = (appointmentDate: string, appointmentTime: string) => {
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    const minutesUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

    if (minutesUntilAppointment > 15) {
      const hoursUntil = Math.floor(minutesUntilAppointment / 60);
      const minsUntil = Math.floor(minutesUntilAppointment % 60);
      return {
        text: `in ${hoursUntil}h ${minsUntil}m`,
        color: "text-blue-600 dark:text-blue-400",
        badge: "bg-blue-100 dark:bg-blue-900/30",
      };
    } else if (minutesUntilAppointment >= -15) {
      return {
        text: "Ready to start",
        color: "text-green-600 dark:text-green-400",
        badge: "bg-green-100 dark:bg-green-900/30",
      };
    } else if (minutesUntilAppointment >= -120) {
      return {
        text: "Recently ended",
        color: "text-gray-600 dark:text-gray-400",
        badge: "bg-gray-100 dark:bg-gray-900/30",
      };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading your schedule...</p>
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
              Welcome, <span className="text-brand-primary">{userDetails.name}</span>
            </h1>
            <p className="text-clinical-gray mt-2">Manage your patient consultations</p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/doctor/management"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center space-x-2 font-bold"
            >
              <Stethoscope className="w-5 h-5" />
              <span>Profile Settings</span>
            </Link>
          </div>
        </div>

        {/* Doctor Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 mb-10 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                <Stethoscope className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-1">
                  {userDetails.name}
                </h2>
                <div className="flex flex-col space-y-2">
                  <p className="text-clinical-gray flex items-center gap-2">
                    {userDetails.email}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30">
                      <Stethoscope className="w-4 h-4" />
                      DOCTOR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:min-w-max">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Today's Patients</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {appointments.filter((a) => a.appointmentDate === new Date().toISOString().split("T")[0]).length}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Active Sessions</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">{activeAppointments.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              {error} - Showing demo appointments
            </p>
          </motion.div>
        )}

        {/* Active Sessions Alert */}
        {activeAppointments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 dark:text-green-300 text-sm">
              You have {activeAppointments.length} active consultation session(s) right now
            </p>
          </motion.div>
        )}

        {/* Confirmed Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
          {/* Main Content: Appointments List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">
                Confirmed Appointments
              </h2>
              {appointments.length > 0 && (
                <span className="text-sm text-clinical-gray font-medium">
                  {appointments.length} scheduled
                </span>
              )}
            </div>

            {appointments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-12 rounded-3xl text-center"
              >
                <Calendar className="w-16 h-16 text-brand-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-2">
                  No Appointments Scheduled
                </h3>
                <p className="text-clinical-gray mb-6">
                  Your confirmed appointments will appear here
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment, index) => {
                  const isStartable = startableAppointmentIds.has(appointment.id);
                  const timeStatus = getTimeStatus(appointment.appointmentDate, appointment.appointmentTime);
                  const isActive = appointment.status === "ACTIVE";

                  return (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`glass p-6 rounded-3xl border-l-[6px] group transition-all ${
                        isActive
                          ? "border-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-900/20"
                          : "border-brand-primary"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left: Patient Info */}
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                            <Users className="w-8 h-8" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white group-hover:text-brand-primary transition-colors">
                              {appointment.patientName}
                            </h4>
                            <p className="text-clinical-gray text-sm">Patient ID: {appointment.patientId}</p>
                          </div>
                        </div>

                        {/* Center: Date & Time */}
                        <div className="text-center md:text-right hidden sm:block">
                          <div className="flex items-center text-sm font-bold text-clinical-dark dark:text-clinical-white justify-center md:justify-end gap-2">
                            <Calendar className="w-4 h-4 text-brand-primary" />
                            {appointment.appointmentDate}
                          </div>
                          <div className="flex items-center text-sm font-bold text-clinical-dark dark:text-clinical-white justify-center md:justify-end gap-2 mt-1">
                            <Clock className="w-4 h-4 text-brand-primary" />
                            {appointment.appointmentTime}
                          </div>
                        </div>

                        {/* Right: Status & Action */}
                        <div className="flex flex-col items-end gap-3">
                          {timeStatus && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${timeStatus.badge} ${timeStatus.color}`}
                            >
                              {isActive ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : isStartable ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                              {isActive ? "Active" : timeStatus.text}
                            </span>
                          )}

                          <button
                            onClick={() => handleStartConsultation(appointment)}
                            disabled={!isStartable && !isActive}
                            className={`px-6 py-3 rounded-2xl shadow-lg font-bold flex items-center space-x-2 transition-all ${
                              isStartable || isActive
                                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20"
                                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            <span>{isActive ? "Continue" : "Start"} Consultation</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar: Stats & Quick Actions */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-primary" />
                Today's Stats
              </h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-900/30">
                  <p className="text-xs text-clinical-gray font-bold uppercase mb-1">Total Consultations</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {appointments.filter((a) => a.appointmentDate === new Date().toISOString().split("T")[0]).length}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-900/30">
                  <p className="text-xs text-clinical-gray font-bold uppercase mb-1">Active Sessions</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeAppointments.length}</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-900/30">
                  <p className="text-xs text-clinical-gray font-bold uppercase mb-1">Upcoming</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {appointments.filter(
                      (a) =>
                        new Date(`${a.appointmentDate}T${a.appointmentTime}`) > new Date() &&
                        a.status === "CONFIRMED"
                    ).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-brand-primary" />
                Notes
              </h3>
              <ul className="space-y-3 text-sm text-clinical-gray">
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>You can start consultations 15 min before scheduled time</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>Patient needs to join after you start</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>Session expires 2 hours after appointment time</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
