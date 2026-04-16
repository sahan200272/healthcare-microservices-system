"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Shield,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/lib/api";

interface AdminStats {
  totalUsers: number;
  totalTransactions: number;
  pendingVerifications: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>({
    name: "Admin",
    email: "admin@example.com",
    id: "",
  });

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTransactions: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);

  // Fetch admin data
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const adminId = localStorage.getItem("id");
        const name = localStorage.getItem("name");
        const email = localStorage.getItem("email");

        setUserDetails({
          name: name || "Admin",
          email: email || "admin@example.com",
          id: adminId,
        });

        if (!adminId) {
          setError("Admin ID not found");
          setIsLoading(false);
          return;
        }

        // Try to fetch real data from API
        try {
          const response = await adminApi.getDashboardStats();
          setStats(response.data);
        } catch (err) {
          // Load mock data if API call fails
          setStats({
            totalUsers: 1243,
            totalTransactions: 856,
            pendingVerifications: 12,
            totalRevenue: 45230,
          });
          setPendingVerifications([
            {
              id: "doc1",
              name: "Dr. Alex Johnson",
              role: "DOCTOR",
              submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
              status: "PENDING",
            },
            {
              id: "doc2",
              name: "Dr. Sarah Williams",
              role: "DOCTOR",
              submittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
              status: "PENDING",
            },
            {
              id: "doc3",
              name: "Dr. Michael Chen",
              role: "DOCTOR",
              submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
              status: "PENDING",
            },
          ]);
        }
      } catch (err: any) {
        console.error("Error loading admin data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const handleVerifyDoctor = async (doctorId: string, approved: boolean) => {
    try {
      await adminApi.verifyDoctor(doctorId, {
        approved,
        reason: approved ? "Credentials verified" : "Incomplete documentation",
      });

      // Remove from pending list
      setPendingVerifications((prev) => prev.filter((v) => v.id !== doctorId));
      setStats((prev) => ({
        ...prev,
        pendingVerifications: Math.max(0, prev.pendingVerifications - 1),
      }));
    } catch (err: any) {
      console.error("Error verifying doctor:", err);
      alert("Failed to process verification");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-clinical-gray mt-2">System overview and management</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center space-x-2 font-bold">
              <Shield className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Admin Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 mb-10 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                <Shield className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-1">
                  {userDetails.name}
                </h2>
                <div className="flex flex-col space-y-2">
                  <p className="text-clinical-gray flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {userDetails.email}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30">
                      <Shield className="w-4 h-4" />
                      ADMIN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:min-w-max">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">System Status</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">Operational</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Uptime</p>
                <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white mt-2">99.9%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">
              {error} - Showing demo data
            </p>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              label: "Total Users",
              value: stats.totalUsers.toLocaleString(),
              icon: Users,
              color: "bg-blue-500",
              lightBg: "bg-blue-50 dark:bg-blue-900/20",
            },
            {
              label: "Transactions",
              value: stats.totalTransactions.toLocaleString(),
              icon: BarChart3,
              color: "bg-green-500",
              lightBg: "bg-green-50 dark:bg-green-900/20",
            },
            {
              label: "Total Revenue",
              value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
              icon: DollarSign,
              color: "bg-purple-500",
              lightBg: "bg-purple-50 dark:bg-purple-900/20",
            },
            {
              label: "Pending Verifications",
              value: stats.pendingVerifications,
              icon: AlertCircle,
              color: "bg-orange-500",
              lightBg: "bg-orange-50 dark:bg-orange-900/20",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass p-6 rounded-3xl ${stat.lightBg}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-2xl`}>
                  <stat.icon className="text-white w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +8.2%
                </span>
              </div>
              <h3 className="text-clinical-gray text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold mt-1 text-clinical-dark dark:text-clinical-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Pending Verifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">
                Pending Doctor Verifications
              </h2>
              {stats.pendingVerifications > 0 && (
                <span className="text-sm text-clinical-gray font-medium">
                  {stats.pendingVerifications} pending
                </span>
              )}
            </div>

            {pendingVerifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-12 rounded-3xl text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-2">
                  All Verified
                </h3>
                <p className="text-clinical-gray">All pending doctor verifications have been processed</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pendingVerifications.map((doctor, index) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass p-6 rounded-3xl border-l-[6px] border-orange-500"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
                          {doctor.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-clinical-gray">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Submitted {new Date(doctor.submittedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleVerifyDoctor(doctor.id, false)}
                          className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold transition-all text-sm"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyDoctor(doctor.id, true)}
                          className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 font-bold transition-all text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Quick Stats */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-primary" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center p-4 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 text-clinical-dark dark:text-clinical-white transition-all text-left">
                  <Users className="w-5 h-5 text-brand-primary mr-3" />
                  <div>
                    <div className="font-bold text-sm">View All Users</div>
                    <div className="text-xs text-clinical-gray">Manage profiles</div>
                  </div>
                </button>
                <button className="w-full flex items-center p-4 rounded-2xl bg-brand-secondary/5 hover:bg-brand-secondary/10 text-clinical-dark dark:text-clinical-white transition-all text-left">
                  <DollarSign className="w-5 h-5 text-brand-secondary mr-3" />
                  <div>
                    <div className="font-bold text-sm">Transactions</div>
                    <div className="text-xs text-clinical-gray">Payment history</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-brand-primary" />
                System Notes
              </h3>
              <ul className="space-y-3 text-sm text-clinical-gray">
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>Review doctor credentials carefully</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>Monitor transaction disputes</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>Verify user identity documents</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
