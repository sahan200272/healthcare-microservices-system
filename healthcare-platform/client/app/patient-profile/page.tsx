"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Upload,
  FileText,
  Download,
  Trash2,
  Heart,
  Pill,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { patientApi } from "@/lib/api";

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  url: string;
}

interface Prescription {
  id: string;
  doctorName: string;
  date: string;
  medicines: string[];
  instructions: string;
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    bloodType: "",
    allergies: "",
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const patientId = typeof window !== "undefined" ? localStorage.getItem("id") : "";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (patientId) {
          const profileResponse = await patientApi.getProfile(patientId);
          setProfile(profileResponse.data);

          const docsResponse = await patientApi.getDocuments(patientId);
          setDocuments(docsResponse.data || []);

          const prescsResponse = await patientApi.getPrescriptions(patientId);
          setPrescriptions(prescsResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfile();
  }, [patientId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      formData.append("documentType", e.target.files[0].name.split(".").pop() || "image");

      const response = await patientApi.uploadDocument(patientId, formData);
      setDocuments([...documents, response.data]);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        // Call delete API
        setDocuments(documents.filter((d) => d.id !== docId));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      await patientApi.updateProfile(patientId, profile);
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white">My Profile</h1>
          {activeTab === "profile" && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-2xl font-bold transition-all"
            >
              <Edit2 className="w-4 h-4" />
              {editMode ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-brand-primary text-white"
                    : "bg-white dark:bg-slate-900 text-clinical-dark dark:text-clinical-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Profile Card */}
            <div className="glass rounded-3xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white">{profile.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.phone || "--"}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.address || "--"}</p>
                  )}
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Blood Type
                  </label>
                  {editMode ? (
                    <select
                      value={profile.bloodType}
                      onChange={(e) => setProfile({ ...profile, bloodType: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      <option value="">Select Blood Type</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.bloodType || "--"}</p>
                  )}
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Allergies
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={profile.allergies}
                      onChange={(e) => setProfile({ ...profile, allergies: e.target.value })}
                      placeholder="e.g., Penicillin, Nuts..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.allergies || "--"}</p>
                  )}
                </div>
              </div>

              {editMode && (
                <button
                  onClick={handleSaveProfile}
                  className="w-full mt-8 bg-brand-primary hover:bg-brand-primary/90 text-white py-3 rounded-2xl font-bold transition-all"
                >
                  Save Changes
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Documents Tab */}
        {activeTab === "documents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Upload Area */}
            <div className="glass rounded-3xl p-8 border-2 border-dashed border-brand-primary/30 hover:border-brand-primary/60 transition-all">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center py-8">
                  <Upload className="w-12 h-12 text-brand-primary mb-3" />
                  <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white">Upload Medical Documents</p>
                  <p className="text-sm text-clinical-gray mt-1">Click to upload reports, prescriptions, lab results</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            </div>

            {/* Documents List */}
            {documents.length === 0 ? (
              <div className="text-center py-12 text-clinical-gray">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <FileText className="w-6 h-6 text-brand-primary" />
                      <div>
                        <p className="font-bold text-clinical-dark dark:text-clinical-white">{doc.name}</p>
                        <p className="text-sm text-clinical-gray">{new Date(doc.uploadedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <Download className="w-5 h-5 text-brand-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === "prescriptions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {prescriptions.length === 0 ? (
              <div className="text-center py-12 text-clinical-gray">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No prescriptions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map((presc) => (
                  <div key={presc.id} className="glass rounded-3xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-clinical-dark dark:text-clinical-white text-lg">
                          Dr. {presc.doctorName}
                        </p>
                        <p className="text-sm text-clinical-gray flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(presc.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                        <Download className="w-5 h-5 text-brand-primary" />
                      </button>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-clinical-gray mb-2">Medicines:</p>
                      <ul className="text-sm text-clinical-dark dark:text-clinical-white space-y-1 mb-4">
                        {presc.medicines.map((med, idx) => (
                          <li key={idx}>• {med}</li>
                        ))}
                      </ul>
                      <p className="text-sm text-clinical-gray">
                        <span className="font-bold">Instructions:</span> {presc.instructions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
