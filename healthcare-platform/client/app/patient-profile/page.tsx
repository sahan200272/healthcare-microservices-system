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
  Stethoscope,
  Activity,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { patientApi, prescriptionApi } from "@/lib/api";

interface MedicalReport {
  reportId: string;
  reportType: string;
  description: string;
  fileUrl: string;
  uploadedAt: string;
}

interface Prescription {
  prescriptionId: string;
  doctorId?: string;
  doctorName?: string;
  diagnosis: string;
  // Rich structure from doctor-service
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;
  // Flat structure from patient-service (fallback)
  medicines?: string[];
  notes?: string;
  // issuedAt from doctor-service, prescribedAt from patient-service
  issuedAt?: string;
  prescribedAt?: string;
}

interface MedicalHistory {
  historyId: string;
  condition: string;
  diagnosedDate: string;
  treatment: string;
  notes: string;
  recordedAt: string;
}

export default function PatientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    age: "",
    gender: "",
    bloodType: "",
  });
  const [isNewProfile, setIsNewProfile] = useState(false);

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [dbPatientId, setDbPatientId] = useState("");

  const [addingHistory, setAddingHistory] = useState(false);
  const [newHistory, setNewHistory] = useState({
    condition: "",
    diagnosedDate: "",
    treatment: "",
    notes: ""
  });
  
  // Upload form state
  const [newReport, setNewReport] = useState({
    type: "",
    description: "",
    file: null as File | null
  });

  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({
    type: "",
    description: "",
    file: null as File | null
  });

  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [editingPrescriptionNotes, setEditingPrescriptionNotes] = useState("");

  const userId = typeof window !== "undefined" ? (localStorage.getItem("id") ?? "") : "";
  const userName = typeof window !== "undefined" ? (localStorage.getItem("name") ?? "") : "";
  const userEmail = typeof window !== "undefined" ? (localStorage.getItem("email") ?? "") : "";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (userId) {
          const profileResponse = await patientApi.getProfileByUserId(userId);
          const data = profileResponse.data || {};
          setProfile({
            name: data.fullName || userName,
            email: userEmail,
            phone: data.phone || "",
            address: data.address || "",
            age: data.age?.toString() || "",
            gender: data.gender || "",
            bloodType: data.bloodGroup || "",
          });
          
          if (data.patientId) {
            setDbPatientId(data.patientId);
          }
          setIsNewProfile(false);

          // Once we have the true patientId, we can load documents and prescriptions safely
          if (data.patientId) {
            const reportsResponse = await patientApi.getReports(data.patientId);
            setReports(reportsResponse.data || []);

            // Fetch prescriptions from the Doctor Service (authoritative source)
            // so that ALL prescriptions — including ones issued before the
            // patient-service mirroring was added — are visible to the patient.
            try {
              const prescsResponse = await prescriptionApi.getByPatientId(data.patientId);
              setPrescriptions(prescsResponse.data || []);
            } catch (prescsErr) {
              // Fallback: try patient-service endpoint
              console.warn("Doctor-service prescription fetch failed, falling back to patient-service:", prescsErr);
              try {
                const prescsResponse = await patientApi.getPrescriptions(data.patientId);
                setPrescriptions(prescsResponse.data || []);
              } catch (fallbackErr) {
                console.error("Both prescription sources failed:", fallbackErr);
                setPrescriptions([]);
              }
            }

            const historyResponse = await patientApi.getMedicalHistory(data.patientId);
            setMedicalHistory(historyResponse.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        setIsNewProfile(true);
        setProfile(prev => ({
          ...prev,
          name: userName,
          email: userEmail
        }));
      }
    };

    loadProfile();
  }, [userId]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.file || !newReport.type || !dbPatientId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", newReport.file);
      formData.append("reportType", newReport.type);
      formData.append("description", newReport.description);

      const response = await patientApi.uploadReport(dbPatientId, formData);
      setReports([...reports, response.data]);
      
      // Reset form
      setNewReport({ type: "", description: "", file: null });
      alert("Report uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload report");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        // Call delete API if available, otherwise just update local state for demo
        setReports(reports.filter((r) => r.reportId !== reportId));
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleEditReport = (report: MedicalReport) => {
    setEditingReportId(report.reportId);
    setEditingData({
      type: report.reportType,
      description: report.description,
      file: null
    });
  };

  const handleSaveReport = async (reportId: string) => {
    try {
      const formData = new FormData();
      formData.append("reportType", editingData.type);
      formData.append("description", editingData.description);
      if (editingData.file) {
        formData.append("file", editingData.file);
      }

      const response = await patientApi.updateReport(dbPatientId, reportId, formData);
      
      setReports(reports.map(r => r.reportId === reportId ? response.data : r));
      setEditingReportId(null);
      alert("Report updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update report");
    }
  };

  const handleEditPrescription = (presc: Prescription) => {
    setEditingPrescriptionId(presc.prescriptionId);
    setEditingPrescriptionNotes(presc.notes || "");
  };

  const handleSavePrescriptionNotes = async (prescId: string) => {
    try {
      const response = await patientApi.updatePrescriptionNotes(dbPatientId, prescId, editingPrescriptionNotes);
      setPrescriptions(prescriptions.map(p => p.prescriptionId === prescId ? response.data : p));
      setEditingPrescriptionId(null);
      alert("Prescription notes updated!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update prescription notes");
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbPatientId || !newHistory.condition || !newHistory.diagnosedDate) return;

    try {
      const response = await patientApi.addMedicalHistory(dbPatientId, newHistory);
      setMedicalHistory([response.data, ...medicalHistory]);
      setAddingHistory(false);
      setNewHistory({ condition: "", diagnosedDate: "", treatment: "", notes: "" });
      alert("Medical history record added!");
    } catch (error) {
      console.error("Failed to add history:", error);
      alert("Failed to add medical history");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        fullName: profile.name,
        age: parseInt(profile.age) || 0,
        gender: profile.gender || "Not Specified",
        phone: profile.phone || "0000000000",
        address: profile.address,
        bloodGroup: profile.bloodType,
        emergencyContact: "",
      };

      // If dbPatientId is known, update the existing record
      if (dbPatientId) {
        await patientApi.updateProfile(dbPatientId, payload);
      } else {
        // Fallback for new patients missing an ID constraint depending on your backend
        await patientApi.createProfile(payload);
        // Force refresh after creation to set IDs
        window.location.reload();
      }
      
      setEditMode(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Update failed:", error);
      alert("Failed to update profile");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "reports", label: "Medical Reports", icon: FileText },
    { id: "prescriptions", label: "Prescriptions", icon: Pill },
    { id: "history", label: "Medical History", icon: Stethoscope },
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

                {/* Age */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Age
                  </label>
                  {editMode ? (
                    <input
                      type="number"
                      value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.age || "--"}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Gender
                  </label>
                  {editMode ? (
                    <select
                      value={profile.gender}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-clinical-dark dark:text-clinical-white">{profile.gender || "--"}</p>
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

        {/* Medical Reports Tab */}
        {activeTab === "reports" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Upload Area Form */}
            <div className="glass rounded-3xl p-8 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-primary" />
                Upload New Medical Report
              </h3>
              
              <form onSubmit={handleFileUpload} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Report Type</label>
                    <select
                      required
                      value={newReport.type}
                      onChange={(e) => setNewReport({ ...newReport, type: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                    >
                      <option value="">Select Type</option>
                      <option value="Blood Test">Blood Test</option>
                      <option value="X-Ray">X-Ray</option>
                      <option value="MRI/CT Scan">MRI/CT Scan</option>
                      <option value="Prescription">Prescription</option>
                      <option value="Lab Result">Lab Result</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">File</label>
                    <div className="relative">
                      <input
                        type="file"
                        required
                        onChange={(e) => setNewReport({ ...newReport, file: e.target.files?.[0] || null })}
                        className="hidden"
                        id="report-file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      />
                      <label 
                        htmlFor="report-file"
                        className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        <span className="text-sm text-clinical-gray truncate max-w-[200px]">
                          {newReport.file ? newReport.file.name : "Choose file..."}
                        </span>
                        <Upload className="w-4 h-4 text-brand-primary" />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-clinical-gray mb-2">Description</label>
                  <textarea
                    rows={3}
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none font-medium"
                    placeholder="Brief description of the report..."
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading || !newReport.file || !newReport.type}
                    className="bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
                  >
                    {uploading ? "Uploading..." : "Upload Report"}
                  </button>
                </div>
              </form>
            </div>

            {/* Reports List */}
            {reports.length === 0 ? (
              <div className="text-center py-12 text-clinical-gray glass rounded-3xl">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No medical reports uploaded yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <div key={report.reportId} className="glass rounded-3xl p-6 border border-slate-100 dark:border-slate-800/50 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-brand-primary/10 rounded-2xl">
                          <FileText className="w-6 h-6 text-brand-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-clinical-dark dark:text-clinical-white">{report.reportType}</p>
                          <p className="text-xs text-clinical-gray">{new Date(report.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                          <Download className="w-5 h-5 text-brand-primary" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.reportId)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                    {editingReportId === report.reportId ? (
                      <div className="space-y-4 mb-4">
                        <select
                          value={editingData.type}
                          onChange={(e) => setEditingData({ ...editingData, type: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm"
                        >
                          <option value="Blood Test">Blood Test</option>
                          <option value="X-Ray">X-Ray</option>
                          <option value="MRI/CT Scan">MRI/CT Scan</option>
                          <option value="Prescription">Prescription</option>
                          <option value="Lab Result">Lab Result</option>
                          <option value="Other">Other</option>
                        </select>
                        <textarea
                          rows={2}
                          value={editingData.description}
                          onChange={(e) => setEditingData({ ...editingData, description: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm resize-none"
                          placeholder="Description..."
                        />
                        <div className="relative">
                          <input
                            type="file"
                            onChange={(e) => setEditingData({ ...editingData, file: e.target.files?.[0] || null })}
                            className="hidden"
                            id={`edit-file-${report.reportId}`}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          <label 
                            htmlFor={`edit-file-${report.reportId}`}
                            className="flex items-center justify-between w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          >
                            <span className="text-xs text-clinical-gray truncate">
                              {editingData.file ? editingData.file.name : "Replace file (optional)..."}
                            </span>
                            <Upload className="w-3 h-3 text-brand-primary" />
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveReport(report.reportId)}
                            className="bg-brand-primary text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-primary/90 transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingReportId(null)}
                            className="bg-slate-200 dark:bg-slate-800 text-clinical-dark dark:text-clinical-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {report.description && (
                          <p className="text-sm text-clinical-dark/70 dark:text-clinical-white/70 mb-4 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                          <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">Verified</span>
                          <button 
                            onClick={() => handleEditReport(report)}
                            className="text-xs font-bold text-clinical-gray hover:text-brand-primary transition-all flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      </>
                    )}
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
                    <div key={presc.prescriptionId} className="glass rounded-3xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-clinical-dark dark:text-clinical-white text-lg">
                            {presc.doctorName ? `Dr. ${presc.doctorName}` : "Doctor"}
                          </p>
                          <p className="text-sm text-clinical-gray flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {new Date(presc.issuedAt || presc.prescribedAt || "").toLocaleDateString()}
                          </p>
                        </div>
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                          <Download className="w-5 h-5 text-brand-primary" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                          <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">Diagnosis</p>
                          <p className="text-sm text-clinical-dark dark:text-clinical-white font-medium">{presc.diagnosis}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-bold text-clinical-gray mb-2">Medicines:</p>
                          <ul className="text-sm text-clinical-dark dark:text-clinical-white space-y-1 mb-4">
                            {/* Render rich medication objects from doctor-service */}
                            {presc.medications && presc.medications.length > 0
                              ? presc.medications.map((med, idx) => (
                                  <li key={idx} className="flex flex-col py-1">
                                    <span className="font-semibold">• {med.name} — {med.dosage}</span>
                                    <span className="text-xs text-clinical-gray ml-4">{med.frequency}, {med.duration}{med.instructions ? ` — ${med.instructions}` : ""}</span>
                                  </li>
                                ))
                              : (presc.medicines || []).map((med, idx) => (
                                  <li key={idx}>• {med}</li>
                                ))
                            }
                          </ul>
                        </div>

                        {editingPrescriptionId === presc.prescriptionId ? (
                          <div className="space-y-4">
                            <label className="block text-xs font-bold text-clinical-gray uppercase tracking-wider mb-1">Your Notes / Instructions</label>
                            <textarea
                              rows={3}
                              value={editingPrescriptionNotes}
                              onChange={(e) => setEditingPrescriptionNotes(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-sm resize-none"
                              placeholder="Add your own notes here..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSavePrescriptionNotes(presc.prescriptionId)}
                                className="bg-brand-primary text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-brand-primary/90 transition-all"
                              >
                                Save Notes
                              </button>
                              <button
                                onClick={() => setEditingPrescriptionId(null)}
                                className="bg-slate-200 dark:bg-slate-800 text-clinical-dark dark:text-clinical-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : presc.notes ? (
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 group relative">
                            <p className="text-xs font-bold text-clinical-gray uppercase tracking-wider mb-1">Instructions / Notes</p>
                            <p className="text-sm text-clinical-dark dark:text-clinical-white italic">"{presc.notes}"</p>
                            <button 
                              onClick={() => handleEditPrescription(presc)}
                              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all text-brand-primary"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditPrescription(presc)}
                            className="flex items-center gap-2 text-sm text-brand-primary font-bold hover:underline"
                          >
                            <Edit2 className="w-4 h-4" />
                            Add Notes
                          </button>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Medical History Tab */}
        {activeTab === "history" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Add History Form Toggle */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">Health Conditions</h2>
              <button
                onClick={() => setAddingHistory(!addingHistory)}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-2 rounded-2xl font-bold transition-all hover:bg-brand-primary/90"
              >
                {addingHistory ? "Cancel" : <><Plus className="w-4 h-4" /> Add Record</>}
              </button>
            </div>

            {addingHistory && (
              <div className="glass rounded-3xl p-8 border border-brand-primary/20 bg-brand-primary/5">
                <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6">Record New Condition</h3>
                <form onSubmit={handleAddHistory} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Condition Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Type 2 Diabetes, Hypertension"
                      required
                      value={newHistory.condition}
                      onChange={(e) => setNewHistory({ ...newHistory, condition: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Diagnosis Date</label>
                    <input
                      type="month"
                      required
                      value={newHistory.diagnosedDate}
                      onChange={(e) => setNewHistory({ ...newHistory, diagnosedDate: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Treatment/Medication</label>
                    <input
                      type="text"
                      placeholder="e.g. Insulin, Lifestyle changes"
                      value={newHistory.treatment}
                      onChange={(e) => setNewHistory({ ...newHistory, treatment: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-clinical-gray mb-2">Additional Notes</label>
                    <textarea
                      rows={3}
                      value={newHistory.notes}
                      onChange={(e) => setNewHistory({ ...newHistory, notes: e.target.value })}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-brand-primary text-white px-10 py-3 rounded-2xl font-bold transition-all hover:bg-brand-primary/90"
                    >
                      Save to History
                    </button>
                  </div>
                </form>
              </div>
            )}

            {medicalHistory.length === 0 ? (
              <div className="text-center py-20 glass rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <Activity className="w-16 h-16 mx-auto mb-4 text-clinical-gray opacity-30" />
                <h3 className="text-xl font-medium text-clinical-gray">No medical history recorded yet</h3>
                <p className="text-sm text-clinical-gray mt-2">Documenting your conditions helps doctors provide better care.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {medicalHistory.map((item) => (
                  <div key={item.historyId} className="glass rounded-3xl p-8 border border-slate-100 dark:border-slate-800/50 hover:shadow-2xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Stethoscope className="w-32 h-32" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-brand-primary/10 rounded-xl">
                            <Activity className="w-5 h-5 text-brand-primary" />
                          </div>
                          <h3 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">{item.condition}</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-6">
                          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-clinical-gray uppercase tracking-widest mb-1">Diagnosed</p>
                            <p className="text-clinical-dark dark:text-clinical-white font-bold">{new Date(item.diagnosedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</p>
                          </div>
                          
                          {item.treatment && (
                            <div className="bg-brand-primary/5 px-4 py-3 rounded-2xl border border-brand-primary/10">
                              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1">Current Treatment</p>
                              <p className="text-brand-primary font-bold">{item.treatment}</p>
                            </div>
                          )}
                        </div>

                        {item.notes && (
                          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                            <p className="text-xs font-bold text-clinical-gray uppercase tracking-widest mb-2">Patient Notes</p>
                            <p className="text-clinical-dark/80 dark:text-clinical-white/80 italic leading-relaxed">
                              "{item.notes}"
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-clinical-gray bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-medium">
                          Recorded on {new Date(item.recordedAt).toLocaleDateString()}
                        </span>
                      </div>
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
