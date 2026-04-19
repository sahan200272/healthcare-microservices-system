"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Stethoscope,
  User,
  ChevronRight,
  Search,
  Loader2,
  ArrowLeft,
  MapPin,
  Star,
} from "lucide-react";
import { appointmentApi } from "@/lib/api";
import Link from "next/link";

interface Doctor {
  doctorId: string;
  fullName: string;
  specialization: string;
  consultationFee: number;
  experienceYears: number;
  rating?: number;
  verified: boolean;
}

export default function GeneralBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Specialty, 2: Doctor, 3: (Redirect to specific booking)
  
  const [specialties] = useState([
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic",
    "Psychiatrist",
    "Neurologist",
    "ENT Specialist",
  ]);
  
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch doctors when specialty is selected
  useEffect(() => {
    if (selectedSpecialty) {
      const fetchDoctors = async () => {
        setLoading(true);
        try {
          const response = await appointmentApi.searchDoctors({ specialty: selectedSpecialty });
          setDoctors(response.data || []);
        } catch (error) {
          console.error("Failed to fetch doctors:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDoctors();
    }
  }, [selectedSpecialty]);

  const filteredDoctors = doctors.filter(doc => 
    doc.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            <span className={`text-sm font-bold ${step >= 1 ? "text-brand-primary" : "text-clinical-gray"}`}>Select Specialty</span>
            <span className={`text-sm font-bold ${step >= 2 ? "text-brand-primary" : "text-clinical-gray"}`}>Choose Doctor</span>
            <span className={`text-sm font-bold ${step >= 3 ? "text-brand-primary" : "text-clinical-gray"}`}>Schedule</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-brand-primary"
              initial={{ width: "33.33%" }}
              animate={{ width: step === 1 ? "33.33%" : step === 2 ? "66.66%" : "100%" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white mb-3">
                  What type of care do you need?
                </h1>
                <p className="text-clinical-gray">Select a specialty to see available specialists</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {specialties.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => {
                      setSelectedSpecialty(spec);
                      setStep(2);
                    }}
                    className="glass p-8 rounded-3xl text-left hover:border-brand-primary/50 group transition-all"
                  >
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg text-clinical-dark dark:text-clinical-white mb-1">{spec}</h3>
                    <p className="text-sm text-clinical-gray">Find specialists in {spec}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-brand-primary font-bold hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Specialty
                </button>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
                  <input 
                    type="text"
                    placeholder="Search doctor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20"
                  />
                </div>
              </div>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white mb-3">
                  Available Specialists
                </h2>
                <p className="text-clinical-gray">Top-rated {selectedSpecialty}s near you</p>
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-20 glass rounded-3xl">
                  <User className="w-12 h-12 text-clinical-gray/30 mx-auto mb-4" />
                  <p className="text-clinical-gray">No doctors found in this specialty yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredDoctors.map((doc) => (
                    <Link
                      key={doc.doctorId}
                      href={`/doctors/${doc.doctorId}/book`}
                      className="glass p-6 rounded-3xl flex items-center justify-between group hover:border-brand-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shrink-0">
                          <User className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-clinical-dark dark:text-clinical-white group-hover:text-brand-primary transition-colors">
                            Dr. {doc.fullName}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-clinical-gray">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> 4.9
                            </span>
                            <span>{doc.experienceYears} years experience</span>
                            <span className="font-bold text-brand-secondary">Rs. {doc.consultationFee}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
