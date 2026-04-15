"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  MapPin,
  Stethoscope,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { appointmentApi } from "@/lib/api";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  experience: number;
  location: string;
  consultationFee: number;
  profileImage?: string;
  verified: boolean;
}

export default function BrowseDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  const specialties = [
    "General Practitioner",
    "Cardiologist",
    "Dermatologist",
    "Pediatrician",
    "Orthopedic",
    "Psychiatrist",
    "Neurologist",
    "ENT Specialist",
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await appointmentApi.searchDoctors({
          specialty: selectedSpecialty,
          search: searchTerm,
        });
        let doctorsData = response.data || [];

        // Sort based on selection
        if (sortBy === "rating") {
          doctorsData.sort((a: Doctor, b: Doctor) => b.rating - a.rating);
        } else if (sortBy === "fee") {
          doctorsData.sort((a: Doctor, b: Doctor) => a.consultationFee - b.consultationFee);
        } else if (sortBy === "experience") {
          doctorsData.sort((a: Doctor, b: Doctor) => b.experience - a.experience);
        }

        setDoctors(doctorsData);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchDoctors();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSpecialty, sortBy]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white mb-2">
            Find Your Doctor
          </h1>
          <p className="text-clinical-gray">Browse and book appointments with certified doctors</p>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-gray" />
              <input
                type="text"
                placeholder="Search doctor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          >
            <option value="rating">Sort by Rating</option>
            <option value="fee">Sort by Fee (Low to High)</option>
            <option value="experience">Sort by Experience</option>
          </select>

          {/* Filter by Specialty */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
          >
            <option value="">All Specialties</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope className="w-16 h-16 mx-auto text-clinical-gray/50 mb-4" />
            <p className="text-clinical-gray text-lg">No doctors found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor, idx) => (
              <motion.div
                key={doctor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass rounded-3xl overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Doctor Header */}
                <div className="bg-gradient-to-r from-brand-primary to-brand-secondary p-6 text-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    {doctor.verified && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{doctor.name}</h3>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <Stethoscope className="w-4 h-4" />
                    {doctor.specialty}
                  </p>
                </div>

                {/* Doctor Details */}
                <div className="p-6 space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(doctor.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-clinical-gray/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-clinical-dark dark:text-clinical-white">
                      {doctor.rating} ({doctor.reviews} reviews)
                    </span>
                  </div>

                  {/* Experience and Location */}
                  <div className="space-y-2 text-sm text-clinical-gray">
                    <p>
                      <span className="font-bold text-clinical-dark dark:text-clinical-white">
                        Experience:
                      </span>{" "}
                      {doctor.experience} years
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {doctor.location}
                    </p>
                  </div>

                  {/* Fee */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-clinical-gray mb-2">Consultation Fee</p>
                    <p className="text-2xl font-bold text-brand-primary">
                      Rs. {doctor.consultationFee}
                    </p>
                  </div>

                  {/* Book Button */}
                  <Link
                    href={`/doctors/${doctor.id}/book`}
                    className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
