"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Loader2,
  FileText,
  Pill,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { Medication, PrescriptionRequest } from "@/lib/doctorTypes";
import { doctorApi, patientApi } from "@/lib/api";

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorId: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

const EMPTY_MED: Medication = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "At bedtime",
];

const DURATION_OPTIONS = [
  "3 days",
  "5 days",
  "7 days",
  "10 days",
  "14 days",
  "1 month",
  "2 months",
  "3 months",
  "Ongoing",
];

export default function PrescriptionModal({
  isOpen,
  onClose,
  doctorId,
  appointmentId,
  patientId,
  patientName,
  onSuccess,
}: PrescriptionModalProps) {
  const [diagnosis, setDiagnosis] = useState("");
  const [medications, setMedications] = useState<Medication[]>([{ ...EMPTY_MED }]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * The appointment document stores patientId = auth-service userId (a string UUID).
   * The patient-service backend expects the MongoDB _id (ObjectId as string).
   * We resolve the real _id once when the modal opens via GET /api/patients/by-user/{userId}.
   */
  const [resolvedPatientId, setResolvedPatientId] = useState<string | null>(null);
  const [resolvingPatient, setResolvingPatient] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !patientId) return;

    // Reset resolution state each time the modal opens
    setResolvedPatientId(null);
    setResolveError(null);
    setResolvingPatient(true);

    patientApi
      .getProfileByUserId(patientId)
      .then((res) => {
        // The patient document's MongoDB _id is returned as `id` or `_id`
        const mongoId: string =
          res.data?.id ?? res.data?._id ?? res.data?.patientId ?? null;
        if (!mongoId) {
          setResolveError("Could not determine patient record ID.");
        } else {
          setResolvedPatientId(mongoId);
        }
      })
      .catch(() => {
        setResolveError("Failed to load patient record. Please close and try again.");
      })
      .finally(() => setResolvingPatient(false));
  }, [isOpen, patientId]);

  const addMedication = () => {
    setMedications((prev) => [...prev, { ...EMPTY_MED }]);
  };

  const removeMedication = (idx: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMedication = (idx: number, field: keyof Medication, value: string) => {
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const validate = (): boolean => {
    if (!diagnosis.trim()) { setError("Diagnosis is required."); return false; }
    if (medications.length === 0) { setError("At least one medication is required."); return false; }
    for (const m of medications) {
      if (!m.name.trim() || !m.dosage.trim() || !m.frequency.trim() || !m.duration.trim()) {
        setError("Please fill in all required medication fields (name, dosage, frequency, duration).");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!validate()) return;

    // Guard: ensure we have resolved the correct MongoDB _id before submitting
    if (!resolvedPatientId) {
      setError(
        resolveError ??
        "Patient record is still loading. Please wait a moment and try again."
      );
      return;
    }

    const request: PrescriptionRequest = {
      patientId: resolvedPatientId,   // ← MongoDB _id, NOT the auth userId
      appointmentId,
      diagnosis,
      medications,
      notes: notes || undefined,
    };

    setSaving(true);
    try {
      await doctorApi.issuePrescription(doctorId, request);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
        handleClose();
      }, 1800);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to issue prescription. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setDiagnosis("");
    setMedications([{ ...EMPTY_MED }]);
    setNotes("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">

              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-accent/10 rounded-xl">
                    <FileText className="w-5 h-5 text-brand-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
                      Issue Prescription
                    </h2>
                    <p className="text-xs text-clinical-gray">
                    Patient:{" "}
                    <span className="font-semibold text-brand-primary">{patientName}</span>
                    {resolvingPatient && (
                      <span className="ml-2 text-clinical-gray animate-pulse">(resolving…)</span>
                    )}
                    {resolveError && !resolvingPatient && (
                      <span className="ml-2 text-red-500 text-xs">{resolveError}</span>
                    )}
                  </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-clinical-gray transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">

                {/* Success state */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 py-10"
                  >
                    <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
                      Prescription Issued!
                    </p>
                    <p className="text-clinical-gray text-sm">The prescription has been saved successfully.</p>
                  </motion.div>
                )}

                {!success && (
                  <>
                    {/* Error */}
                    {error && (
                      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    {/* Diagnosis */}
                    <div>
                      <label className="block text-sm font-bold text-clinical-gray mb-2 uppercase tracking-wider">
                        Diagnosis <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="prescription-diagnosis"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        rows={2}
                        placeholder="Enter clinical diagnosis..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white placeholder-clinical-gray outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none"
                      />
                    </div>

                    {/* Medications */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-clinical-gray uppercase tracking-wider">
                          Medications <span className="text-red-500">*</span>
                        </label>
                        <button
                          onClick={addMedication}
                          className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Medication
                        </button>
                      </div>

                      <div className="space-y-4">
                        {medications.map((med, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Pill className="w-4 h-4 text-brand-accent" />
                                <span className="text-xs font-bold text-clinical-gray uppercase tracking-wider">
                                  Medication {idx + 1}
                                </span>
                              </div>
                              {medications.length > 1 && (
                                <button
                                  onClick={() => removeMedication(idx)}
                                  className="text-red-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Name */}
                              <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-clinical-gray mb-1 block">
                                  Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={(e) => updateMedication(idx, "name", e.target.value)}
                                  placeholder="e.g. Amoxicillin 500mg"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-clinical-dark dark:text-clinical-white"
                                />
                              </div>

                              {/* Dosage */}
                              <div>
                                <label className="text-xs font-semibold text-clinical-gray mb-1 block">
                                  Dosage <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                                  placeholder="e.g. 500mg"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-clinical-dark dark:text-clinical-white"
                                />
                              </div>

                              {/* Frequency */}
                              <div>
                                <label className="text-xs font-semibold text-clinical-gray mb-1 block">
                                  Frequency <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={med.frequency}
                                  onChange={(e) => updateMedication(idx, "frequency", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-clinical-dark dark:text-clinical-white"
                                >
                                  <option value="">Select frequency</option>
                                  {FREQUENCY_OPTIONS.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Duration */}
                              <div>
                                <label className="text-xs font-semibold text-clinical-gray mb-1 block">
                                  Duration <span className="text-red-500">*</span>
                                </label>
                                <select
                                  value={med.duration}
                                  onChange={(e) => updateMedication(idx, "duration", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-clinical-dark dark:text-clinical-white"
                                >
                                  <option value="">Select duration</option>
                                  {DURATION_OPTIONS.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Instructions */}
                              <div className="sm:col-span-2">
                                <label className="text-xs font-semibold text-clinical-gray mb-1 block">
                                  Instructions
                                </label>
                                <input
                                  type="text"
                                  value={med.instructions || ""}
                                  onChange={(e) => updateMedication(idx, "instructions", e.target.value)}
                                  placeholder="e.g. Take with food"
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all text-clinical-dark dark:text-clinical-white"
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-bold text-clinical-gray mb-2 uppercase tracking-wider">
                        Doctor Notes
                      </label>
                      <textarea
                        id="prescription-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Additional clinical notes or follow-up instructions..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-clinical-dark dark:text-clinical-white placeholder-clinical-gray outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="px-7 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    onClick={handleClose}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-clinical-gray bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    id="prescription-submit"
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-60 shadow-lg shadow-brand-accent/30"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Issuing...</>
                    ) : (
                      <><FileText className="w-4 h-4" /> Issue Prescription</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
