"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Stethoscope,
  Award,
  DollarSign,
  FileText,
  Clock,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  Save,
  Edit3,
  Loader2,
  Calendar,
  Plus,
  Trash2,
} from "lucide-react";
import { doctorApi } from "@/lib/api";
import AvailabilityCalendar from "@/app/components/doctor/AvailabilityCalendar";
import Toast, { useToast } from "@/app/components/doctor/Toast";
import type { DoctorProfile, DoctorUpdateRequest, AvailabilityResponse } from "@/lib/doctorTypes";

type Tab = "profile" | "availability";

const SPECIALIZATIONS = [
  "General Practitioner", "Cardiology", "Dermatology", "Endocrinology",
  "Gastroenterology", "Neurology", "Oncology", "Orthopedics",
  "Pediatrics", "Psychiatry", "Radiology", "Surgery", "Urology",
];

const VERIFICATION_CONFIG = {
  APPROVED: { icon: BadgeCheck,   label: "Verified Doctor",       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700" },
  PENDING:  { icon: Clock,        label: "Pending Verification",  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" },
  REJECTED: { icon: AlertCircle,  label: "Registration Rejected", color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700" },
};

export default function DoctorManagementPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [draft, setDraft] = useState<DoctorUpdateRequest>({});
  const { toasts, addToast, dismiss } = useToast();

  const doctorId =
    typeof window !== "undefined"
      ? localStorage.getItem("doctorId") || localStorage.getItem("id") || ""
      : "";

  useEffect(() => {
    const load = async () => {
      if (!doctorId) return;
      setLoading(true);
      try {
        const [profileRes, availRes] = await Promise.allSettled([
          doctorApi.getProfile(doctorId),
          doctorApi.getAvailability(doctorId),
        ]);
        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data);
        }
        if (availRes.status === "fulfilled") {
          setAvailability(availRes.value.data ?? []);
        }
      } catch {
        addToast("Failed to load profile data.", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  const handleEditToggle = () => {
    if (!editMode && profile) {
      // Copy current values into draft
      setDraft({
        fullName:        profile.fullName,
        phone:           profile.phone,
        specialization:  profile.specialization,
        qualification:   profile.qualification,
        bio:             profile.bio,
        consultationFee: profile.consultationFee,
        experienceYears: profile.experienceYears,
      });
    }
    setEditMode((e) => !e);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await doctorApi.updateProfile(doctorId, draft);
      setProfile(res.data);
      setEditMode(false);
      addToast("Profile updated successfully!", "success");
    } catch {
      addToast("Failed to update profile. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAvailability = async (date: string, slots: string[]) => {
    await doctorApi.setAvailability(doctorId, { availableDate: date, timeSlots: slots });
    const res = await doctorApi.getAvailability(doctorId);
    setAvailability(res.data ?? []);
    addToast(`Availability saved for ${date}.`, "success");
  };

  const handleDeleteSlot = async (availabilityId: string) => {
    try {
      setAvailability((prev) => prev.filter((a) => a.availabilityId !== availabilityId));
      addToast("Availability slot removed.", "info");
    } catch {
      addToast("Failed to remove slot.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-3" />
          <p className="text-clinical-gray">Loading profile...</p>
        </div>
      </div>
    );
  }

  const verStatus = profile?.verificationStatus ?? "PENDING";
  const verCfg = VERIFICATION_CONFIG[verStatus] ?? VERIFICATION_CONFIG.PENDING;
  const VerIcon = verCfg.icon;

  return (
    <>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="px-8 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
            My Profile
          </h1>
          <p className="text-clinical-gray text-sm mt-1">
            Manage your professional profile and schedule
          </p>
        </div>

        {/* Verification Banner */}
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${verCfg.bg}`}>
          <VerIcon className={`w-5 h-5 ${verCfg.color} shrink-0`} />
          <div>
            <p className={`font-bold text-sm ${verCfg.color}`}>{verCfg.label}</p>
            <p className="text-xs text-clinical-gray mt-0.5">
              {verStatus === "APPROVED"
                ? "Your credentials have been verified and approved by admin."
                : verStatus === "PENDING"
                ? "Your registration is under review. You'll be notified once approved."
                : "Your registration was rejected. Please contact support."}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["profile", "availability"] as Tab[]).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30"
                  : "bg-white dark:bg-slate-800 text-clinical-gray hover:text-brand-primary border border-slate-200 dark:border-slate-700"
              }`}
            >
              {tab === "availability" ? "Availability" : "Profile"}
            </button>
          ))}
        </div>

        {/* === PROFILE TAB === */}
        {activeTab === "profile" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="glass rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white">
                    Professional Information
                  </h2>
                  <button
                    id="edit-profile-btn"
                    onClick={handleEditToggle}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      editMode
                        ? "bg-slate-100 dark:bg-slate-800 text-clinical-gray"
                        : "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20"
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    {editMode ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {profile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ProfileField
                      label="Full Name" icon={User}
                      value={profile.fullName}
                      editValue={draft.fullName}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, fullName: v })}
                    />
                    <ProfileField
                      label="Email" icon={Mail}
                      value={profile.email}
                      editing={false}   // email is read-only
                    />
                    <ProfileField
                      label="Phone" icon={Phone}
                      value={profile.phone}
                      editValue={draft.phone}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, phone: v })}
                    />
                    <ProfileFieldSelect
                      label="Specialization" icon={Stethoscope}
                      value={profile.specialization}
                      editValue={draft.specialization}
                      options={SPECIALIZATIONS}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, specialization: v })}
                    />
                    <ProfileField
                      label="Qualification" icon={Award}
                      value={profile.qualification}
                      editValue={draft.qualification}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, qualification: v })}
                    />
                    <ProfileField
                      label="License Number" icon={BadgeCheck}
                      value={profile.licenseNumber}
                      editing={false}   // immutable
                    />
                    <ProfileFieldNumber
                      label="Experience (Years)" icon={Clock}
                      value={profile.experienceYears}
                      editValue={draft.experienceYears}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, experienceYears: v })}
                    />
                    <ProfileFieldNumber
                      label="Consultation Fee (Rs.)" icon={DollarSign}
                      value={profile.consultationFee}
                      editValue={draft.consultationFee}
                      editing={editMode}
                      onChange={(v) => setDraft({ ...draft, consultationFee: v })}
                    />
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-clinical-gray uppercase tracking-wider mb-2">
                        <FileText className="w-3.5 h-3.5 inline mr-1" />Bio
                      </label>
                      {editMode ? (
                        <textarea
                          value={draft.bio ?? ""}
                          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none"
                        />
                      ) : (
                        <p className="text-sm text-clinical-dark dark:text-clinical-white leading-relaxed">
                          {profile.bio || <span className="text-clinical-gray italic">No bio provided.</span>}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <p className="text-clinical-gray">
                      Doctor profile not found. Please register your profile first.
                    </p>
                  </div>
                )}

                {editMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 flex justify-end"
                  >
                    <button
                      id="save-profile-btn"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-7 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-60 shadow-lg shadow-brand-primary/30"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-4 h-4" /> Save Changes</>
                      )}
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* === AVAILABILITY TAB === */}
        {activeTab === "availability" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="availability"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Add new availability */}
              <div className="glass rounded-3xl p-8">
                <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-brand-primary" />
                  Add Availability
                </h2>
                <AvailabilityCalendar
                  doctorId={doctorId}
                  existingSlots={availability.map((a) => ({
                    availableDate: a.availableDate,
                    timeSlots: a.timeSlots,
                  }))}
                  onAdd={handleAddAvailability}
                />
              </div>

              {/* Existing slots */}
              <div className="glass rounded-3xl p-8">
                <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-primary" />
                  Scheduled Availability
                  <span className="text-sm font-normal text-clinical-gray">({availability.length} dates)</span>
                </h2>
                {availability.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-clinical-gray">No availability set yet.</p>
                    <p className="text-xs text-clinical-gray mt-1">
                      Use the form above to add your available dates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availability
                      .sort((a, b) => a.availableDate.localeCompare(b.availableDate))
                      .map((slot, idx) => (
                        <motion.div
                          key={slot.availabilityId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-start justify-between bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 group hover:border-brand-primary/30 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-brand-primary" />
                              <p className="font-bold text-clinical-dark dark:text-clinical-white">
                                {new Date(slot.availableDate + "T00:00:00").toLocaleDateString("en-US", {
                                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {slot.timeSlots.map((t) => (
                                <span
                                  key={t}
                                  className="text-xs font-bold px-2.5 py-1 rounded-lg bg-brand-primary/10 text-brand-primary"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteSlot(slot.availabilityId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl text-red-500"
                            title="Remove this availability"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

// ─── Helper sub-components ───────────────────────────────────────────────────

function ProfileField({
  label, icon: Icon, value, editValue, editing, onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: string | number | null | undefined;
  editValue?: string;
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-clinical-gray uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5 inline mr-1.5" />{label}
      </label>
      {editing && onChange ? (
        <input
          type="text"
          value={editValue ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
        />
      ) : (
        <p className="text-sm font-semibold text-clinical-dark dark:text-clinical-white">
          {value ?? <span className="text-clinical-gray italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

function ProfileFieldSelect({
  label, icon: Icon, value, editValue, options, editing, onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: string | null | undefined;
  editValue?: string;
  options: string[];
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-clinical-gray uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5 inline mr-1.5" />{label}
      </label>
      {editing && onChange ? (
        <select
          value={editValue ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
        >
          <option value="">Select specialization</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <p className="text-sm font-semibold text-clinical-dark dark:text-clinical-white">
          {value ?? <span className="text-clinical-gray italic">Not set</span>}
        </p>
      )}
    </div>
  );
}

function ProfileFieldNumber({
  label, icon: Icon, value, editValue, editing, onChange,
}: {
  label: string;
  icon: React.ElementType;
  value: number | null | undefined;
  editValue?: number;
  editing: boolean;
  onChange?: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-clinical-gray uppercase tracking-wider mb-2">
        <Icon className="w-3.5 h-3.5 inline mr-1.5" />{label}
      </label>
      {editing && onChange ? (
        <input
          type="number"
          value={editValue ?? ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all"
        />
      ) : (
        <p className="text-sm font-semibold text-clinical-dark dark:text-clinical-white">
          {value != null ? value : <span className="text-clinical-gray italic">Not set</span>}
        </p>
      )}
    </div>
  );
}
