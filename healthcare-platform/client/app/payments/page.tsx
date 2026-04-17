"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Stethoscope,
  DollarSign
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { paymentApi, patientApi, doctorApi } from "@/lib/api";

export default function PaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const doctorId = searchParams.get("doctorId");
  const statusParam = searchParams.get("status");

  const [patientId, setPatientId] = useState("");
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPatientId(localStorage.getItem("id") || "");
    }
  }, []);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      const sessionId = searchParams.get("session_id");
      if (statusParam === "success" && sessionId) {
        try {
          // Verify payment on the backend
          await paymentApi.verifyStripePayment(sessionId);
          setSuccess(true);
          
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } catch (error) {
          console.error("Verification failed:", error);
          setErrorStatus("Payment was successful but we couldn't verify it in our system. Please contact support.");
        }
      } else if (statusParam === "cancelled") {
        setErrorStatus("Payment was cancelled. You can try again whenever you're ready.");
        setTimeout(() => setErrorStatus(null), 5000);
      }
    };

    if (statusParam) {
      verifyAndRedirect();
    }
  }, [statusParam, searchParams, router]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!patientId || !doctorId) return;
      
      // Handle mock data for testing
      if (doctorId === "doc1" || doctorId === "doc2") {
        setDoctorProfile({
          doctorId: doctorId,
          fullName: doctorId === "doc1" ? "Sarah Johnson" : "Michael Chen",
          specialization: doctorId === "doc1" ? "General Practitioner" : "Cardiologist",
          consultationFee: 2000
        });
        setLoading(false);
        return;
      }

      try {
        try {
          const patientRes = await patientApi.getProfileByUserId(patientId);
          if (patientRes.data) setPatientProfile(patientRes.data);
        } catch (err) {
          console.warn("Could not fetch patient profile (might not exist yet)", err);
        }

        try {
          const doctorRes = await doctorApi.getProfile(doctorId);
          if (doctorRes.data) setDoctorProfile(doctorRes.data);
        } catch (err) {
          console.error("Could not fetch doctor profile", err);
        }

      } finally {
        setLoading(false);
      }
    };
    
    if (patientId && doctorId) {
       fetchProfiles();
    } else if (!doctorId) {
       setLoading(false);
       setErrorStatus("Missing appointment details. Please initiate payment from the dashboard.");
    }
  }, [patientId, doctorId]);

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      const amount = doctorProfile?.consultationFee || 1500;
      const patientEmail = localStorage.getItem("email") || "patient@example.com";
      
      const payload = {
        appointmentId,
        doctorId,
        patientId,
        patientEmail,
        amount
      };
      
      // Hit our backend to create a Stripe Session and PENDING payment record
      const response = await paymentApi.createPayment(payload);
      
      const checkoutUrl = response.data?.checkoutUrl;

      if (checkoutUrl) {
          // Stripe backend session API generated the exact hosted URL for us!
          window.location.href = checkoutUrl;
      } else {
        throw new Error("Failed to secure Stripe Checkout Session from server");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment processing failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark flex justify-center items-center">
      <div className="max-w-xl w-full">
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold mb-6"
          >
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            Your payment was completed successfully! The hospital has been notified.
          </motion.div>
        )}
        
        {errorStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl flex items-center gap-3 font-bold mb-6"
          >
            <XCircle className="w-6 h-6 shrink-0" />
            {errorStatus}
          </motion.div>
        )}

        <div className="glass rounded-[2.5rem] p-8 md:p-12 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-brand-primary/10 rounded-2xl">
              <CreditCard className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
                Secure Checkout
              </h1>
              <p className="text-clinical-gray font-medium mt-1">Complete your consultation payment</p>
            </div>
          </div>

          {loading ? (
             <div className="flex flex-col items-center justify-center py-10">
               <div className="animate-spin w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full mb-4"></div>
               <p className="text-clinical-gray">Fetching diagnostic totals...</p>
             </div>
          ) : doctorProfile ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 md:space-y-8">
              
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div className="bg-brand-primary/10 p-3 rounded-full">
                    <Stethoscope className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">Dr. {doctorProfile.fullName}</h3>
                    <p className="text-sm text-clinical-gray">{doctorProfile.specialization}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-clinical-gray font-bold">Consultation Fee</span>
                  <div className="flex items-center text-xl font-bold text-clinical-dark dark:text-clinical-white">
                    <DollarSign className="w-5 h-5 text-brand-primary mr-1" />
                    <span>LKR {(doctorProfile.consultationFee || 1500).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePayment}
                  disabled={submitting || success}
                  className={`w-full py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                    success 
                    ? "bg-green-500 text-white shadow-green-500/20" 
                    : "bg-brand-primary text-white hover:bg-brand-primary/90 shadow-brand-primary/20 active:scale-95"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full"></div>
                      Processing...
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-6 h-6" />
                      Paid Securely
                    </>
                  ) : (
                    <>
                      Pay with Stripe <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-clinical-gray/80 flex items-center justify-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  Secured by AES-256 Encryption & Stripe Checkout
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-10">
               <p className="text-clinical-gray">Unable to fetch consultation details. Please try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
