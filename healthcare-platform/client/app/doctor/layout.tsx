"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DoctorSidebar from "@/app/components/doctor/DoctorSidebar";
import { doctorApi } from "@/lib/api";
import type { DoctorProfile } from "@/lib/doctorTypes";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("id");

    if (role !== "DOCTOR" || !userId) {
      router.push("/login");
      return;
    }

    // Try to fetch the doctor profile by userId to resolve doctorId
    doctorApi.getProfileByUserId(userId)
      .then((res) => {
        setProfile(res.data);
        // Cache doctorId separately for easy access in child pages
        if (res.data?.doctorId) {
          localStorage.setItem("doctorId", res.data.doctorId);
        }
      })
      .catch(() => {
        // Profile not registered yet — still allow layout to render
      })
      .finally(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-primary mx-auto mb-3" />
          <p className="text-clinical-gray font-medium">Loading Doctor Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080f1e]">
      <DoctorSidebar
        doctorName={profile?.fullName ?? localStorage.getItem("name") ?? undefined}
        specialization={profile?.specialization}
        verified={profile?.verified}
        verificationStatus={profile?.verificationStatus}
      />
      <main className="ml-[240px] flex-1 min-h-screen pt-16">
        {children}
      </main>
    </div>
  );
}
