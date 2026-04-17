"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  ChevronLeft, 
  ExternalLink, 
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  Clock,
  Search
} from "lucide-react";
import Link from "next/link";
import { paymentApi, doctorApi } from "@/lib/api";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPatientId(localStorage.getItem("id") || "");
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!patientId) return;
      
      try {
        const response = await paymentApi.getPaymentsByPatientId(patientId);
        const fetchedPayments = response.data || [];
        
        // Enhance with doctor names
        const enhancedPayments = await Promise.all(
          fetchedPayments.map(async (payment: any) => {
            try {
              if (payment.doctorId && payment.doctorId !== "doc1" && payment.doctorId !== "doc2") {
                const docRes = await doctorApi.getProfile(payment.doctorId);
                return { ...payment, doctorName: docRes.data?.fullName || "Doctor" };
              } else if (payment.doctorId === "doc1") {
                return { ...payment, doctorName: "Dr. Sarah Johnson" };
              } else if (payment.doctorId === "doc2") {
                return { ...payment, doctorName: "Dr. Michael Chen" };
              }
            } catch (err) {
              console.warn("Could not fetch doctor for payment", payment.doctorId);
            }
            return { ...payment, doctorName: "Health Professional" };
          })
        );

        setPayments(enhancedPayments.sort((a, b) => 
          new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
        ));
      } catch (error) {
        console.error("Failed to fetch payment history", error);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchHistory();
    }
  }, [patientId]);

  const filteredPayments = payments.filter(p => 
    p.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-5xl">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-clinical-gray hover:text-brand-primary transition-colors mb-8 font-bold"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Payment <span className="text-brand-primary">History</span>
            </h1>
            <p className="text-clinical-gray mt-2">Manage your consultation invoices and receipts</p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-clinical-gray" />
            <input 
              type="text"
              placeholder="Search by ID or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-clinical-gray font-medium">Loading your transactions...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-20 glass rounded-[2.5rem]">
            <CreditCard className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <p className="text-clinical-gray text-lg font-medium">No payments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment, idx) => (
              <motion.div
                key={payment.paymentId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="glass p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      payment.paymentStatus === 'COMPLETED' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      <DollarSign className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-clinical-dark dark:text-clinical-white">
                        {payment.doctorName}
                      </h3>
                      <p className="text-xs text-clinical-gray font-mono mt-1">ID: {payment.paymentId}</p>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-clinical-gray">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Date Pending'}
                        </span>
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-lg ${
                          payment.paymentStatus === 'COMPLETED' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {payment.paymentStatus === 'COMPLETED' ? (
                            <><CheckCircle2 className="w-3 h-3" /> COMPLETED</>
                          ) : (
                            <><Clock className="w-3 h-3" /> PENDING</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                    <p className="text-2xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
                      LKR {payment.amount.toLocaleString()}
                    </p>
                    
                    {payment.receiptUrl ? (
                      <a 
                        href={payment.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg group/btn"
                      >
                        <ExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        Download / View Receipt
                      </a>
                    ) : (
                      <span className="text-xs text-clinical-gray italic">Receipt generating...</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
