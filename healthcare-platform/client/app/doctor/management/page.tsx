"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  Clock,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { doctorApi } from "@/lib/api";

interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  specialization: string;
  phone: string;
  bio: string;
  experience: number;
  consultationFee: number;
  clinic: string;
  location: string;
  verified: boolean;
}

interface Availability {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

export default function DoctorManagementPage() {
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [editMode, setEditMode] = useState(false);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "17:00",
  });
  const [successMessage, setSuccessMessage] = useState("");

  const doctorId = typeof window !== "undefined" ? localStorage.getItem("id") : "";
  const userRole = typeof window !== "undefined" ? localStorage.getItem("role") : "";

  // Check if user is doctor
  useEffect(() => {
    if (userRole !== "DOCTOR") {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }

    const loadData = async () => {
      if (!doctorId) return;
      try {
        const [profileRes, availabilityRes] = await Promise.all([
          doctorApi.getProfile(doctorId),
          doctorApi.getAvailability(doctorId),
        ]);

        setDoctorProfile(profileRes.data);
        setAvailability(availabilityRes.data || []);
      } catch (error) {
        console.error("Failed to load doctor data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [doctorId, userRole]);

  const handleProfileUpdate = async () => {
    if (!doctorProfile) return;

    setSaving(true);
    try {
      await doctorApi.updateProfile(doctorProfile.id, doctorProfile);
      setSuccessMessage("Profile updated successfully!");
      setEditMode(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAvailability = async () => {
    setSaving(true);
    try {
      await doctorApi.setAvailability(doctorId || "", newSlot);
      setAvailability([...availability, { id: Date.now().toString(), ...newSlot }]);
      setNewSlot({
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "17:00",
      });
      setSuccessMessage("Availability slot added!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to add availability:", error);
      alert("Failed to add availability");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSlot = (id: string) => {
    setAvailability(availability.filter((slot) => slot.id !== id));
    setSuccessMessage("Slot removed!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 bg-clinical-white dark:bg-clinical-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctorProfile) {
    return (
      <div className="min-h-screen pt-24 px-6 bg-clinical-white dark:bg-clinical-dark flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-clinical-dark dark:text-clinical-white">Failed to load doctor profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white mb-2">Doctor Management</h1>
          <p className="text-clinical-gray">Manage your profile and availability</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          </motion.div>
        )}

        {/* Verification Status */}
        <div
          className={`glass rounded-3xl p-6 mb-8 border-2 ${
            doctorProfile.verified
              ? "border-green-400 dark:border-green-600"
              : "border-yellow-400 dark:border-yellow-600"
          }`}
        >
          <div className="flex items-center gap-3">
            {doctorProfile.verified ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            )}
            <div>
              <p className="font-bold text-clinical-dark dark:text-clinical-white">
                {doctorProfile.verified ? "Verified Doctor" : "Pending Verification"}
              </p>
              <p className="text-sm text-clinical-gray">
                {doctorProfile.verified
                  ? "Your credentials have been approved"
                  : "Your profile is pending admin verification"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "profile", label: "Profile" },
            { id: "availability", label: "Availability" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-brand-primary text-white"
                  : "bg-white dark:bg-slate-900 text-clinical-dark dark:text-clinical-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">Profile Information</h2>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg font-bold transition-all"
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={doctorProfile.name}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, name: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white font-bold text-lg">
                      Dr. {doctorProfile.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      value={doctorProfile.email}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, email: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={doctorProfile.phone}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, phone: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.phone}</p>
                  )}
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Specialization</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={doctorProfile.specialization}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, specialization: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.specialization}</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Experience (Years)</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={doctorProfile.experience}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          experience: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.experience} years</p>
                  )}
                </div>

                {/* Consultation Fee */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Consultation Fee (Rs.)</label>
                  {editMode ? (
                    <input
                      type="number"
                      value={doctorProfile.consultationFee}
                      onChange={(e) =>
                        setDoctorProfile({
                          ...doctorProfile,
                          consultationFee: parseInt(e.target.value),
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">Rs. {doctorProfile.consultationFee}</p>
                  )}
                </div>

                {/* Clinic */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Clinic Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={doctorProfile.clinic}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, clinic: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.clinic}</p>
                  )}
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Location</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={doctorProfile.location}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, location: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.location}</p>
                  )}
                </div>

                {/* Bio */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Bio</label>
                  {editMode ? (
                    <textarea
                      value={doctorProfile.bio}
                      onChange={(e) =>
                        setDoctorProfile({ ...doctorProfile, bio: e.target.value })
                      }
                      rows={4}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{doctorProfile.bio}</p>
                  )}
                </div>
              </div>

              {editMode && (
                <button
                  onClick={handleProfileUpdate}
                  disabled={saving}
                  className="mt-8 w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Availability Tab */}
        {activeTab === "availability" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-8">Set Availability</h2>

              {/* Add New Slot */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-bold text-clinical-dark dark:text-clinical-white mb-6">Add New Slot</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Day of Week</label>
                    <select
                      value={newSlot.dayOfWeek}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, dayOfWeek: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, startTime: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">End Time</label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) =>
                        setNewSlot({ ...newSlot, endTime: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddAvailability}
                  disabled={saving}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white px-8 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {saving ? "Adding..." : "Add Slot"}
                </button>
              </div>

              {/* Current Slots */}
              <h3 className="text-lg font-bold text-clinical-dark dark:text-clinical-white mb-6">Your Availability Slots</h3>
              {availability.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-clinical-gray/50 mx-auto mb-4" />
                  <p className="text-clinical-gray">No availability slots set yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availability.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-4"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-clinical-dark dark:text-clinical-white">
                          {slot.dayOfWeek}
                        </p>
                        <p className="text-sm text-clinical-gray">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
