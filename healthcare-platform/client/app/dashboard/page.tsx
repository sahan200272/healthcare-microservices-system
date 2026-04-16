"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PatientDashboard from "./patient-dashboard";
import DoctorDashboard from "./doctor-dashboard";
import AdminDashboard from "./admin-dashboard";

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("role");
      
      if (!userRole) {
        router.push("/login");
        return;
      }

      setRole(userRole);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-clinical-gray">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (role === "PATIENT") {
    return <PatientDashboard />;
  } else if (role === "DOCTOR") {
    return <DoctorDashboard />;
  } else if (role === "ADMIN") {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-clinical-gray">Invalid role. Please contact support.</p>
    </div>
  );
}
