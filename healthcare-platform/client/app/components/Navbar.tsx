"use client";

import Link from "next/link";
import { Activity, User, LogOut, LayoutDashboard, Stethoscope, FileText, Settings, ShieldAlert, Brain, Calendar, Bell } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { notificationApi } from "@/lib/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // True when on any /doctor/* route — navbar must always be solid here
  const isDoctorRoute = pathname.startsWith("/doctor");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"));
      setUserName(localStorage.getItem("name"));
      setUserEmail(localStorage.getItem("email"));
    }
  }, []);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const authUserId = typeof window !== "undefined" ? localStorage.getItem("id") : null;
      if (authUserId && role && (role === "PATIENT" || role === "DOCTOR")) {
        try {
          const response = await notificationApi.getNotifications(
            authUserId,
            role.toLowerCase() as "patient" | "doctor"
          );
          const unread = response.data.filter((n: any) => !n.isRead).length;
          setUnreadCount(unread);
        } catch (error) {
          console.error("Failed to fetch notifications count:", error);
        }
      }
    };

    if (role) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    router.push("/login");
  };

  const getNavLinks = () => {
    const baseLinks = [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ];

    if (role === "PATIENT") {
      return [
        ...baseLinks,
        { href: "/book-appointment", label: "Book Appointment", icon: Calendar },
        { href: "/browse-doctors", label: "Find Doctors", icon: Stethoscope },
        { href: "/symptom-checker", label: "Symptom Checker", icon: Brain },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/patient-profile", label: "My Profile", icon: User },
      ];
    }

    if (role === "DOCTOR") {
      return [
        ...baseLinks,
        { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
        { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: "/doctor/management", label: "My Profile", icon: Settings },
      ];
    }

    if (role === "ADMIN") {
      return [
        ...baseLinks,
        { href: "/admin/dashboard", label: "Admin Panel", icon: ShieldAlert },
      ];
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isDoctorRoute
          ? "bg-white dark:bg-[#080f1e] border-b border-slate-200 dark:border-slate-800 py-2 shadow-sm"
          : isScrolled
          ? "bg-white/90 dark:bg-[#080f1e]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 py-2 shadow-lg"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="bg-brand-primary p-2 rounded-xl">
            <Activity className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-clinical-dark dark:text-clinical-white">
            Health<span className="text-brand-primary">Sync</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-brand-primary ${
                  pathname.startsWith(link.href) ? "text-brand-primary" : "text-clinical-gray"
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {link.label === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
                  )}
                </div>
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 text-sm font-medium text-clinical-gray hover:text-brand-primary transition-colors bg-brand-primary/5 hover:bg-brand-primary/10 px-4 py-2 rounded-lg"
            >
              <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="hidden md:inline max-w-[100px] truncate">{userName || "User"}</span>
              <User className="w-4 h-4" />
            </button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-64 glass rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {/* User Info Header */}
                <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold">
                      {userName ? userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-clinical-dark dark:text-clinical-white truncate">
                        {userName || "User"}
                      </p>
                      <p className="text-xs text-clinical-gray truncate">
                        {userEmail || "user@example.com"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-bold text-center text-brand-primary uppercase tracking-widest">
                    {role || "USER"}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <button
            onClick={handleLogout}
            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
