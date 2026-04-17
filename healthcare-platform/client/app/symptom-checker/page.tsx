"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import Link from "next/link";
import { aiSymptomApi } from "@/lib/api";

// Matches the backend SymptomAnalysisResponse DTO exactly
interface AnalysisResult {
  possibleConditions: string[];
  severity: "Low" | "Moderate" | "High";
  recommendedSpecialty: string;
}

const commonSymptoms = [
  "Fever",
  "Cough",
  "Sore Throat",
  "Headache",
  "Fatigue",
  "Body Aches",
  "Shortness of Breath",
  "Chest Pain",
  "Nausea",
  "Vomiting",
  "Diarrhea",
  "Constipation",
  "Abdominal Pain",
  "Dizziness",
  "Rash",
  "Joint Pain",
];

export default function SymptomCheckerPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSymptom = (symptom: string) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleRemoveSymptom = (symptom: string) => {
    setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
  };

  const handleAddCustom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom)) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom("");
    }
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      setErrorMsg("Please select at least one symptom before analyzing.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await aiSymptomApi.analyzeSymptoms(selectedSymptoms);
      setResults(response.data);
      setShowResults(true);
    } catch (error: any) {
      console.error("AI symptom analysis failed:", error);
      const status = error?.response?.status;
      // Provide helpful per-status messages
      if (status === 502 || status === 503) {
        setErrorMsg(
          "The AI service is temporarily unavailable. Please wait a moment and try again."
        );
      } else if (status === 401 || status === 403) {
        setErrorMsg("Session expired. Please log in again to use the symptom checker.");
      } else {
        const detail =
          error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to analyze symptoms. Please try again.";
        setErrorMsg(detail);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
            className="inline-block"
          >
            <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-4 rounded-2xl mb-4 w-fit mx-auto">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white mb-3">AI Symptom Checker</h1>
          <p className="text-clinical-gray text-lg max-w-2xl mx-auto">
            Describe your symptoms and get personalized recommendations for appropriate medical specialists
          </p>
          <p className="text-sm text-red-500 mt-2 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            This is not a substitute for professional medical advice
          </p>
        </div>

        {/* ── Inline error banner ── */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-red-700 dark:text-red-300 text-sm font-medium">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {!showResults ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Common Symptoms */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-6">
                Select Common Symptoms
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commonSymptoms.map((symptom) => (
                  <motion.button
                    key={symptom}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAddSymptom(symptom)}
                    className={`p-4 rounded-xl font-bold transition-all text-center ${
                      selectedSymptoms.includes(symptom)
                        ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30"
                        : "bg-slate-100 dark:bg-slate-800 text-clinical-dark dark:text-clinical-white hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {symptom}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Custom Symptom Input */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-4">
                Add Custom Symptoms
              </h2>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-gray" />
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
                    placeholder="Enter symptom name..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                  />
                </div>
                <button
                  onClick={handleAddCustom}
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div className="glass rounded-3xl p-8">
                <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-4">
                  Selected Symptoms ({selectedSymptoms.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms.map((symptom) => (
                    <motion.div
                      key={symptom}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="bg-brand-primary/10 border border-brand-primary text-brand-primary px-4 py-2 rounded-full font-bold flex items-center gap-2"
                    >
                      {symptom}
                      <button
                        onClick={() => handleRemoveSymptom(symptom)}
                        className="ml-2 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={loading || selectedSymptoms.length === 0}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 disabled:bg-clinical-gray text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing&hellip; this may take a moment
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze My Symptoms
                </>
              )}
            </motion.button>
          </motion.div>
        ) : results ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {/* Severity Badge */}
            <div
              className={`rounded-3xl p-8 border-2 ${
                results.severity === "High"
                  ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50"
                  : results.severity === "Moderate"
                  ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50"
                  : "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50"
              }`}
            >
              <h2 className="text-xl font-bold mb-2">Severity: {results.severity}</h2>
              <p className="text-sm">
                {results.severity === "High"
                  ? "Seek medical attention promptly."
                  : results.severity === "Moderate"
                  ? "Consider scheduling a doctor's visit soon."
                  : "Monitor your symptoms and rest."}
              </p>
            </div>

            {/* Possible Conditions */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-4">
                Possible Conditions
              </h2>
              <ul className="space-y-2">
                {results.possibleConditions.map((condition, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-clinical-gray">
                    <span className="w-2 h-2 rounded-full bg-brand-primary flex-shrink-0" />
                    {condition}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Specialty */}
            <div className="glass rounded-3xl p-8">
              <h2 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-4">
                Recommended Specialist
              </h2>
              <div className="flex items-center gap-4">
                <div className="bg-brand-primary/10 p-4 rounded-2xl">
                  <Stethoscope className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
                    {results.recommendedSpecialty}
                  </p>
                  <p className="text-clinical-gray text-sm">Based on your reported symptoms</p>
                </div>
              </div>
              <Link
                href={`/browse-doctors?specialty=${encodeURIComponent(results.recommendedSpecialty)}`}
                className="mt-6 inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary/80 font-bold transition-colors"
              >
                Browse {results.recommendedSpecialty} Doctors <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* New Analysis Button */}
            <button
              onClick={() => {
                setShowResults(false);
                setSelectedSymptoms([]);
                setResults(null);
                setErrorMsg(null);
              }}
              className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Start New Analysis
            </button>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
