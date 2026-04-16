"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Stethoscope,
  Video,
} from "lucide-react";
import { appointmentApi, doctorApi, telemedicineApi, paymentApi, notificationApi } from "@/lib/api";
import Link from "next/link";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Availability {
  availableDate: string;
  timeSlots: string[];
  bookedSlots: string[];
  active: boolean;
}

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;
  const searchParams = useSearchParams();
  const rescheduleId = searchParams.get("reschedule");

  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [consultationType, setConsultationType] = useState<string>("IN_PERSON");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");

  const patientId = typeof window !== "undefined" ? localStorage.getItem("id") : "";

  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const [doctorRes, availabilityRes] = await Promise.all([
          appointmentApi.getDoctor(doctorId),
          doctorApi.getAvailability(doctorId)
        ]);
        setDoctor(doctorRes.data);
        setAvailability(availabilityRes.data || []);
      } catch (error) {
        console.error("Failed to fetch doctor data:", error);
      }
    };

    if (doctorId) {
      fetchDoctorData();
    }
  }, [doctorId]);

  // Generate time slots when date selection changes
  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      const dayAvailability = availability.find(a => a.availableDate === selectedDate);
      if (dayAvailability) {
        const slots: TimeSlot[] = dayAvailability.timeSlots.map(time => ({
          time,
          available: !dayAvailability.bookedSlots.includes(time)
        }));
        setTimeSlots(slots);
      } else {
        setTimeSlots([]);
      }
    }
  }, [selectedDate, availability]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }

    setLoading(true);
    try {
      let appointmentResponse;
      
      const formattedTimeSlot = selectedTime.includes('-') 
        ? selectedTime 
        : (() => {
            const [h, m] = selectedTime.split(':').map(Number);
            const em = m + 30;
            const eh = h + Math.floor(em / 60);
            const fm = em % 60;
            return `${selectedTime}-${eh.toString().padStart(2, '0')}:${fm.toString().padStart(2, '0')}`;
          })();
      
      if (rescheduleId) {
        // Reschedule existing appointment
        appointmentResponse = await appointmentApi.rescheduleAppointment(rescheduleId, {
          appointmentDate: selectedDate,
          timeSlot: formattedTimeSlot,
        });
      } else {
        // Create new appointment
        appointmentResponse = await appointmentApi.bookAppointment({
          patientId,
          doctorId,
          appointmentDate: selectedDate,
          timeSlot: formattedTimeSlot,
          consultationType: consultationType,
          reason: notes || "Regular checkup",
        });
      }

      const newAppointmentId = appointmentResponse.data.id;
      setAppointmentId(newAppointmentId);

      // Initiate payment (simulated or actual if service exists)
      try {
        await paymentApi.initiatePayment({
          appointmentId: newAppointmentId,
          patientId,
          doctorId,
          amount: doctor?.consultationFee || 2000,
          currency: "LKR",
        });
      } catch (err) {
        console.warn("Payment initiation failed, but appointment created:", err);
      }

      // Send notifications
      try {
        await notificationApi.sendAppointmentConfirmation({
          appointmentId: newAppointmentId,
          patientId,
          doctorId,
          email: localStorage.getItem("email"),
          phone: localStorage.getItem("phone"),
        });
      } catch (err) {
        console.warn("Notification failed, but appointment created:", err);
      }

      setBookingSuccess(true);
    } catch (error: any) {
      console.error("Booking failed:", error);
      alert(error.response?.data?.message || "Failed to book appointment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get available dates from backend data
  const getAvailableDates = () => {
    return availability
      .filter(a => a.active)
      .map(a => a.availableDate)
      .sort();
  };

  if (!doctor) {
    return (
      <div className="min-h-screen pt-24 px-6 bg-clinical-white dark:bg-clinical-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="mb-6"
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
          </motion.div>
          <h1 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-3">
            {rescheduleId ? "Appointment Rescheduled!" : "Appointment Booked!"}
          </h1>
          <p className="text-clinical-gray mb-6">
            {rescheduleId 
              ? "Your appointment has been successfully updated."
              : "Your appointment has been booked and is awaiting doctor approval."}
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-clinical-gray mb-2">
              <span className="font-bold text-clinical-dark dark:text-clinical-white">Doctor:</span> Dr. {doctor.fullName}
            </p>
            <p className="text-sm text-clinical-gray mb-2">
              <span className="font-bold text-clinical-dark dark:text-clinical-white">Date:</span> {selectedDate}
            </p>
            <p className="text-sm text-clinical-gray">
              <span className="font-bold text-clinical-dark dark:text-clinical-white">Time:</span> {selectedTime}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-3 rounded-2xl font-bold transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <Link
          href="/browse-doctors"
          className="flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 mb-8 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Doctors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white mb-8">
              {rescheduleId ? "Reschedule Appointment" : "Book Appointment"}
            </h1>

            <div className="space-y-8">
              {/* Select Date */}
              <div>
                <label className="block text-lg font-bold text-clinical-dark dark:text-clinical-white mb-4">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Select Date
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {getAvailableDates().map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg font-bold transition-all text-center ${
                        selectedDate === date
                          ? "bg-brand-primary text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-clinical-dark dark:text-clinical-white hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Time */}
              {selectedDate && (
                <div>
                  <label className="block text-lg font-bold text-clinical-dark dark:text-clinical-white mb-4">
                    <Clock className="w-5 h-5 inline mr-2" />
                    Select Time Slot
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 rounded-lg font-bold transition-all ${
                          !slot.available
                            ? "bg-slate-200 dark:bg-slate-700 text-clinical-gray cursor-not-allowed"
                            : selectedTime === slot.time
                            ? "bg-brand-primary text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-clinical-dark dark:text-clinical-white hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Consultation Type */}
              <div>
                <label className="block text-lg font-bold text-clinical-dark dark:text-clinical-white mb-4">
                  Consultation Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConsultationType("IN_PERSON")}
                    className={`p-4 rounded-2xl font-bold transition-all border-2 ${
                      consultationType === "IN_PERSON"
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-clinical-dark dark:text-clinical-white hover:border-brand-primary"
                    }`}
                  >
                    <MapPin className="w-5 h-5 inline mr-2" />
                    In-Person
                  </button>
                  <button
                    onClick={() => setConsultationType("VIDEO_CONSULTATION")}
                    className={`p-4 rounded-2xl font-bold transition-all border-2 ${
                      consultationType === "VIDEO_CONSULTATION"
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-clinical-dark dark:text-clinical-white hover:border-brand-primary"
                    }`}
                  >
                    <Video className="w-5 h-5 inline mr-2" />
                    Video Call
                  </button>
                </div>
              </div>

              {/* 
              {/* Notes */}
              <div>
                <label className="block text-lg font-bold text-clinical-dark dark:text-clinical-white mb-4">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe your symptoms or concerns..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all h-32 resize-none"
                />
              </div>


              {/* Book Button */}
              <button
                onClick={handleBookAppointment}
                disabled={loading || !selectedDate || !selectedTime}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-clinical-gray text-white py-4 rounded-3xl font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    {rescheduleId ? "Confirm Reschedule" : "Confirm & Book Appointment"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Doctor Summary */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-[2rem] p-8 sticky top-24 border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-8">
                Booking Summary
              </h2>{consultationType === "VIDEO_CONSULTATION" ? "Video Consultation" : "In-Person"}
 
              {/* Doctor Info */}
              <div className="flex items-center gap-4 mb-8 bg-brand-primary/5 dark:bg-brand-primary/10 p-4 rounded-[1.5rem]">
                <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-clinical-dark dark:text-clinical-white">Dr. {doctor.fullName}</h3>
                  <p className="text-sm text-clinical-gray">{doctor.specialization}</p>
                </div>
              </div>
 
              {/* Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-clinical-gray flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span className="font-bold text-clinical-dark dark:text-clinical-white">{selectedDate || "Not selected"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-clinical-gray flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time
                  </span>
                  <span className="font-bold text-clinical-dark dark:text-clinical-white">{selectedTime || "Not selected"}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-clinical-gray flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Type
                  </span>
                  <span className="font-bold text-brand-primary">
                    In-Person
                  </span>
                </div>
                
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
                
                <div className="flex justify-between items-center">
                  <span className="font-bold text-clinical-dark dark:text-clinical-white text-lg">Total</span>
                  <span className="text-3xl font-bold text-brand-primary font-mono">
                    Rs. {doctor.consultationFee}
                  </span>
                </div>
              </div>
 
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[10px] text-clinical-gray leading-tight">
                  Your booking is secured by SSL encryption and HealthSync's data protection policy.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
