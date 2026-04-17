"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Calendar, AlertCircle } from "lucide-react";
import type { MedicalReport } from "@/lib/doctorTypes";

const REPORT_TYPE_COLORS: Record<string, string> = {
  LAB:      "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  IMAGING:  "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  PRESCRIPTION: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  GENERAL:  "bg-slate-100 dark:bg-slate-800 text-clinical-gray",
};

interface PatientReportCardProps {
  report: MedicalReport;
  index?: number;
}

export default function PatientReportCard({ report, index = 0 }: PatientReportCardProps) {
  const typeColor = REPORT_TYPE_COLORS[report.reportType] ?? REPORT_TYPE_COLORS.GENERAL;

  const formattedDate = report.uploadedAt
    ? new Date(report.uploadedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown date";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-5 flex items-start gap-4 hover:shadow-md transition-all group"
    >
      <div className="p-3 bg-brand-primary/10 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
        <FileText className="w-5 h-5 text-brand-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-bold text-clinical-dark dark:text-clinical-white text-sm truncate">
            {report.title}
          </h4>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${typeColor}`}>
            {report.reportType}
          </span>
        </div>

        {report.description && (
          <p className="text-xs text-clinical-gray line-clamp-2 mb-2">{report.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-clinical-gray">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>

          {report.fileUrl && (
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function NoReportsState() {
  return (
    <div className="glass rounded-2xl py-14 text-center">
      <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
      <p className="text-clinical-gray font-semibold">No medical reports found</p>
      <p className="text-xs text-clinical-gray mt-1">The patient has not uploaded any reports yet.</p>
    </div>
  );
}
