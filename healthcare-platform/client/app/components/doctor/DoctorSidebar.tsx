"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  Settings,
  Stethoscope,
  ShieldCheck,
  Clock,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/doctor/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
  { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
  { href: "/doctor/patients",    label: "Patients",    icon: Users },
  { href: "/doctor/management",  label: "My Profile",  icon: Settings },
];

interface DoctorSidebarProps {
  doctorName?: string;
  specialization?: string;
  verified?: boolean;
  verificationStatus?: string;
}

export default function DoctorSidebar({
  doctorName,
  specialization,
  verified,
  verificationStatus,
}: DoctorSidebarProps) {
  const pathname = usePathname();

  const statusBadge = () => {
    if (verified || verificationStatus === "APPROVED") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-2.5 h-2.5" /> Verified
        </span>
      );
    }
    if (verificationStatus === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <Clock className="w-2.5 h-2.5" /> Pending
        </span>
      );
    }
    return null;
  };

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[240px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-40 shadow-sm overflow-hidden">
      {/* Doctor identity */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-brand-primary/30">
            {doctorName ? doctorName.charAt(0).toUpperCase() : "D"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-clinical-dark dark:text-clinical-white truncate">
              Dr. {doctorName || "Doctor"}
            </p>
            {specialization && (
              <p className="text-xs text-clinical-gray truncate">{specialization}</p>
            )}
            <div className="mt-1">{statusBadge()}</div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-clinical-gray/60 px-2 mb-2">
          Menu
        </p>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? "bg-brand-primary text-white shadow-md shadow-brand-primary/30"
                      : "text-clinical-gray hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-clinical-dark dark:hover:text-clinical-white"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-brand-primary rounded-xl z-[-1]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-clinical-gray group-hover:text-brand-primary"}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-clinical-gray">
          <Stethoscope className="w-3.5 h-3.5 text-brand-primary" />
          <span className="font-semibold">Doctor Service</span>
          <span className="ml-auto text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
            v2.0
          </span>
        </div>
      </div>
    </aside>
  );
}
