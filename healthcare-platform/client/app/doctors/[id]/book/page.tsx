"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi, paymentApi, notificationApi } from "@/lib/api";

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params.id as string;

  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");

  const patientId = typeof window !== "undefined" ? localStorage.getItem("id") : "";

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const response = await appointmentApi.getDoctor(doctorId);
        setDoctor(response.data);
      } catch (error) {
        console.error("Failed to fetch doctor:", error);
      }
    };

    if (doctorId) {
      fetchDoctor();
    }
  }, [doctorId]);

  // Generate time slots
  useEffect(() => {
    if (selectedDate) {
      const slots: TimeSlot[] = [];
      for (let hour = 8; hour < 18; hour++) {
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          available: Math.random() > 0.3, // Simulate availability
        });
        slots.push({
          time: `${hour.toString().padStart(2, "0")}:30`,
          available: Math.random() > 0.3,
        });
      }
      setTimeSlots(slots);
    }
  }, [selectedDate]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select date and time");
      return;
    }

    setLoading(true);
    try {
      // Create appointment
      const appointmentResponse = await appointmentApi.bookAppointment({
        patientId,
        doctorId,
        date: selectedDate,
        time: selectedTime,
        notes,
        status: "PENDING",
        consultationFee: doctor?.consultationFee,
      });

      const newAppointmentId = appointmentResponse.data.id;
      setAppointmentId(newAppointmentId);

      // Initiate payment
      await paymentApi.initiatePayment({
        appointmentId: newAppointmentId,
        patientId,
        doctorId,
        amount: doctor?.consultationFee,
        currency: "LKR",
      });

      // Send notifications
      await notificationApi.sendAppointmentConfirmation({
        appointmentId: newAppointmentId,
        patientId,
        doctorId,
        email: localStorage.getItem("email"),
        phone: localStorage.getItem("phone"),
      });

      setBookingSuccess(true);
    } catch (error) {
      console.error("Booking failed:", error);
      alert("Failed to book appointment");
    } finally {
      setLoading(false);
    }
  };

  // Get next 7 days
  const getAvailableDates = () => {
    const dates = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
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
            Appointment Booked!
          </h1>
          <p className="text-clinical-gray mb-6">
            Your appointment has been confirmed. You'll receive SMS and email confirmation shortly.
          </p>
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-sm text-clinical-gray mb-2">
              <span className="font-bold text-clinical-dark dark:text-clinical-white">Doctor:</span> {doctor.name}
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
              Book Appointment
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
                className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-clinical-gray text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proceed to Payment
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Doctor Summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-3xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6">
                Summary
              </h2>

              {/* Doctor Info */}
              <div className="bg-brand-primary/10 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-2">Dr. {doctor.name}</h3>
                <p className="text-sm text-clinical-gray mb-3">{doctor.specialty}</p>
                <div className="flex items-center gap-1 text-sm mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400">
                      ★
                    </span>
                  ))}
                  <span className="text-clinical-gray ml-2">({doctor.reviews} reviews)</span>
                </div>
                <p className="text-xs text-clinical-gray">{doctor.experience} years experience</p>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-clinical-gray">Date</span>
                  <span className="font-bold text-clinical-dark dark:text-clinical-white">{selectedDate || "--"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-clinical-gray">Time</span>
                  <span className="font-bold text-clinical-dark dark:text-clinical-white">{selectedTime || "--"}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between text-lg">
                  <span className="font-bold text-clinical-dark dark:text-clinical-white">Consultation Fee</span>
                  <span className="font-bold text-brand-primary">Rs. {doctor.consultationFee}</span>
                </div>
              </div>

              <p className="text-xs text-clinical-gray text-center">
                Secure payment via multiple payment methods
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
