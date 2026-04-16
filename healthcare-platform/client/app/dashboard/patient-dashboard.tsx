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
  Search,
  Plus,
  Mail,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi, telemedicineApi } from "@/lib/api";

interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  speciality: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  meetingUrl?: string;
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
  const [joinableAppointmentIds, setJoinableAppointmentIds] = useState<Set<string>>(new Set());

  // Fetch appointments
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const patientId = localStorage.getItem("id");
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        setUserDetails({
          name: name || "Patient",
          email: email || "patient@example.com",
          id: patientId,
        });

        if (!patientId) {
          setError("Patient ID not found");
          setIsLoading(false);
          return;
        }

        // Fetch appointments from API
        const response = await appointmentApi.getAppointments(patientId, "patient");
        if (response.data) {
          const upcomingAppointments = response.data
            .filter((apt: any) => apt.status === "CONFIRMED" || apt.status === "ACTIVE")
            .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

          setAppointments(upcomingAppointments);
        }
      } catch (err: any) {
        console.error("Error loading appointments:", err);
        setError("Failed to load appointments");
        
        // Load mock data for demonstration
        setAppointments([
          {
            id: "1",
            doctorId: "doc1",
            doctorName: "Dr. Sarah Johnson",
            speciality: "General Practitioner",
            appointmentDate: new Date().toISOString().split("T")[0],
            appointmentTime: new Date(Date.now() + 10 * 60000).toISOString().split("T")[1].substring(0, 5),
            status: "CONFIRMED",
          },
          {
            id: "2",
            doctorId: "doc2",
            doctorName: "Dr. Michael Chen",
            speciality: "Cardiologist",
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
      const joinable = new Set<string>();

      appointments.forEach((apt) => {
        const appointmentDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
        const minutesUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

        // Enable join button from 15 min before to any time after appointment
        if (minutesUntilAppointment >= -15 && apt.status === "CONFIRMED") {
          joinable.add(apt.id);
        }
      });

      setJoinableAppointmentIds(joinable);
    };

    checkAppointmentTiming();
    const interval = setInterval(checkAppointmentTiming, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [appointments]);

  const handleJoinConsultation = async (appointment: Appointment) => {
    try {
      // Get the meeting URL from telemedicine service
      const sessionResponse = await telemedicineApi.getSessionInfo(appointment.id);
      const meetingUrl = sessionResponse.data.meetingUrl || `jitsi://conference-${appointment.id}`;

      // Open Jitsi in a new tab
      window.open(meetingUrl, "_blank");

      // Update appointment status to ACTIVE
      await appointmentApi.updateAppointmentStatus(appointment.id, "ACTIVE");
    } catch (err: any) {
      console.error("Error joining consultation:", err);
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
        text: "Ready to join",
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
          <p className="text-clinical-gray">Loading your appointments...</p>
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
            <p className="text-clinical-gray mt-2">Manage your upcoming consultations</p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/browse-doctors"
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center space-x-2 font-bold"
            >
              <Plus className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 mb-10 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-1">
                  {userDetails.name}
                </h2>
                <div className="flex flex-col space-y-2">
                  <p className="text-clinical-gray flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userDetails.email}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30">
                      <User className="w-4 h-4" />
                      PATIENT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:min-w-max">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Appointments</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">{appointments.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Status</p>
                <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white mt-2">Active</p>
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

        {/* Upcoming Appointments */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">
              Upcoming Appointments
            </h2>
            {appointments.length > 0 && (
              <span className="text-sm text-clinical-gray font-medium">
                {appointments.length} confirmed
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
                No Appointments Yet
              </h3>
              <p className="text-clinical-gray mb-6">
                Book your first consultation with our healthcare professionals
              </p>
              <Link
                href="/browse-doctors"
                className="inline-block bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-2xl shadow-lg shadow-brand-primary/20 transition-all font-bold"
              >
                Browse Doctors
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment, index) => {
                const isJoinable = joinableAppointmentIds.has(appointment.id);
                const timeStatus = getTimeStatus(appointment.appointmentDate, appointment.appointmentTime);

                return (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`glass p-6 rounded-3xl border-l-[6px] group transition-all ${
                      isJoinable ? "border-green-500" : "border-brand-primary"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Doctor Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                          <Stethoscope className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white group-hover:text-brand-primary transition-colors">
                            {appointment.doctorName}
                          </h4>
                          <p className="text-clinical-gray text-sm">{appointment.speciality}</p>
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
                            {isJoinable ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                            {timeStatus.text}
                          </span>
                        )}

                        <button
                          onClick={() => handleJoinConsultation(appointment)}
                          disabled={!isJoinable}
                          className={`px-6 py-3 rounded-2xl shadow-lg font-bold flex items-center space-x-2 transition-all ${
                            isJoinable
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                              : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          <span>{isJoinable ? "Join Now" : "Join Unavailable"}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-6 rounded-3xl"
          >
            <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-primary" />
              Quick Actions
            </h3>
            <Link
              href="/patient-profile"
              className="w-full flex items-center p-4 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 text-clinical-dark dark:text-clinical-white transition-all text-left mb-3"
            >
              <User className="w-5 h-5 text-brand-primary mr-3" />
              <div>
                <div className="font-bold text-sm">View Profile</div>
                <div className="text-xs text-clinical-gray">Manage your information</div>
              </div>
            </Link>
            <Link
              href="/symptom-checker"
              className="w-full flex items-center p-4 rounded-2xl bg-brand-secondary/5 hover:bg-brand-secondary/10 text-clinical-dark dark:text-clinical-white transition-all text-left"
            >
              <AlertCircle className="w-5 h-5 text-brand-secondary mr-3" />
              <div>
                <div className="font-bold text-sm">Symptom Checker</div>
                <div className="text-xs text-clinical-gray">Check your symptoms</div>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass p-6 rounded-3xl"
          >
            <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-primary" />
              Health Tips
            </h3>
            <div className="space-y-3 text-sm">
              <p className="text-clinical-gray">
                💡 Stay hydrated and maintain regular sleep patterns for better health.
              </p>
              <p className="text-clinical-gray">
                🏃 Exercise for at least 30 minutes daily to maintain fitness.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
