"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  CreditCard,
  TrendingUp,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface Admin {
  role: string;
}

interface PendingDoctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience: number;
  documents: string[];
  appliedDate: string;
}

interface Transaction {
  id: string;
  doctorName: string;
  patientName: string;
  amount: number;
  date: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
}

export default function AdminDashboardPage() {
  const [userRole] = useState<Admin | null>(null);
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");

  const userRoleFromStorage = typeof window !== "undefined" ? localStorage.getItem("role") : "";

  // Check if user is admin
  useEffect(() => {
    if (userRoleFromStorage !== "ADMIN") {
      // Redirect to dashboard if not admin
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
      }
    }

    const loadData = async () => {
      try {
        const [doctorsRes, transactionsRes] = await Promise.all([
          adminApi.getPendingDoctors(),
          adminApi.getTransactions(),
        ]);

        setPendingDoctors(doctorsRes.data || []);
        setTransactions(transactionsRes.data || []);
      } catch (error) {
        console.error("Failed to load admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userRoleFromStorage]);

  const handleVerifyDoctor = async (doctorId: string) => {
    try {
      await adminApi.verifyDoctor(doctorId, {});
      setPendingDoctors(pendingDoctors.filter((d) => d.id !== doctorId));
      alert("Doctor verified successfully!");
    } catch (error) {
      console.error("Verification failed:", error);
      alert("Failed to verify doctor");
    }
  };

  const handleRejectDoctor = async (doctorId: string) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await adminApi.rejectDoctor(doctorId, reason);
      setPendingDoctors(pendingDoctors.filter((d) => d.id !== doctorId));
      alert("Doctor rejected successfully!");
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Failed to reject doctor");
    }
  };

  const stats = [
    {
      label: "Pending Doctors",
      value: pendingDoctors.length,
      icon: ShieldAlert,
      color: "from-orange-500 to-orange-600",
    },
    {
      label: "Total Transactions",
      value: transactions.length,
      icon: CreditCard,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Revenue (This Month)",
      value: `Rs. ${transactions.reduce((sum, t) => (t.status === "COMPLETED" ? sum + t.amount : sum), 0)}`,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pt-24 px-6 bg-clinical-white dark:bg-clinical-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white mb-2">Admin Dashboard</h1>
          <p className="text-clinical-gray">Manage platform users, doctor verifications, and transactions</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`glass rounded-3xl p-6 bg-gradient-to-br ${stat.color}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 font-bold text-sm">{stat.label}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <Icon className="w-12 h-12 text-white/30" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "pending-doctors", label: "Pending Doctors" },
            { id: "transactions", label: "Transactions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-brand-primary text-white"
                  : "bg-white dark:bg-slate-900 text-clinical-dark dark:text-clinical-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass rounded-3xl p-8">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mb-6">Platform Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Users", value: "--" },
                  { label: "Total Doctors", value: "--" },
                  { label: "Total Patients", value: "--" },
                  { label: "Total Appointments", value: "--" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                    <p className="text-clinical-gray text-sm">{item.label}</p>
                    <p className="text-2xl font-bold text-clinical-dark dark:text-clinical-white mt-2">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Doctors Tab */}
        {activeTab === "pending-doctors" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {pendingDoctors.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-clinical-gray">No pending doctor verifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDoctors.map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass rounded-3xl p-6 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white">Dr. {doctor.name}</h3>
                      <p className="text-clinical-gray">{doctor.specialization}</p>
                      <p className="text-sm text-clinical-gray mt-2">
                        {doctor.experience} Years Experience • Applied: {new Date(doctor.appliedDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleVerifyDoctor(doctor.id)}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-bold transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Verify
                      </button>
                      <button
                        onClick={() => handleRejectDoctor(doctor.id)}
                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold transition-all"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass rounded-3xl p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center">
                <CreditCard className="w-12 h-12 text-clinical-gray/50 mx-auto mb-4" />
                <p className="text-clinical-gray">No transactions found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800">
                      <th className="text-left p-4 font-bold text-clinical-dark dark:text-clinical-white">Date</th>
                      <th className="text-left p-4 font-bold text-clinical-dark dark:text-clinical-white">Doctor</th>
                      <th className="text-left p-4 font-bold text-clinical-dark dark:text-clinical-white">Patient</th>
                      <th className="text-left p-4 font-bold text-clinical-dark dark:text-clinical-white">Amount</th>
                      <th className="text-left p-4 font-bold text-clinical-dark dark:text-clinical-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-200 dark:border-slate-800">
                        <td className="p-4 text-clinical-gray">{new Date(transaction.date).toLocaleDateString()}</td>
                        <td className="p-4 text-clinical-dark dark:text-clinical-white font-bold">
                          {transaction.doctorName}
                        </td>
                        <td className="p-4 text-clinical-dark dark:text-clinical-white">{transaction.patientName}</td>
                        <td className="p-4 font-bold text-clinical-dark dark:text-clinical-white">
                          Rs. {transaction.amount}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-bold ${
                              transaction.status === "COMPLETED"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : transaction.status === "PENDING"
                                ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                                : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
