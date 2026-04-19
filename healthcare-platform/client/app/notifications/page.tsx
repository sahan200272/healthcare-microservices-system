"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CheckCircle2,
  Trash2,
  Loader2,
  Calendar,
  CreditCard,
  Video,
  Info,
  Clock
} from "lucide-react";
import { notificationApi } from "@/lib/api";

interface Notification {
  id: string;
  patientId: string | null;
  doctorId: string | null;
  appointmentId: string | null;
  type: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const authUserId = localStorage.getItem("id");
      let role = localStorage.getItem("role");

      if (!authUserId || !role) {
        router.push("/login");
        return;
      }

      // Format role for API call ("patient" | "doctor")
      const formattedRole = role.toLowerCase() as "patient" | "doctor";

      const response = await notificationApi.getNotifications(authUserId, formattedRole);
      
      // Sort notifications locally if needed, assuming backend drops them ordered or not
      const data = response.data || [];
      const sortedData = data.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedData);
    } catch (err: any) {
      console.error("Failed to load notifications:", err);
      setError("Failed to load your notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      await markAsRead(notif.id);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
      alert("Failed to delete notification.");
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "APPOINTMENT_PENDING":
      case "APPOINTMENT_CONFIRMED":
        return <Calendar className="w-6 h-6" />;
      case "PAYMENT_SUCCESS":
      case "PAYMENT_FAILED":
        return <CreditCard className="w-6 h-6" />;
      case "VIDEO_CONSULTATION_LINK":
        return <Video className="w-6 h-6" />;
      default:
        return <Bell className="w-6 h-6" />;
    }
  };

  const getIconColorClass = (type: string) => {
    switch (type) {
      case "APPOINTMENT_PENDING":
      case "APPOINTMENT_CONFIRMED":
        return "text-brand-primary bg-brand-primary/10";
      case "PAYMENT_SUCCESS":
        return "text-emerald-500 bg-emerald-500/10";
      case "PAYMENT_FAILED":
        return "text-red-500 bg-red-500/10";
      case "VIDEO_CONSULTATION_LINK":
        return "text-purple-500 bg-purple-500/10";
      default:
        return "text-blue-500 bg-blue-500/10";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-clinical-white dark:bg-clinical-dark pt-24">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto mb-4" />
          <p className="text-clinical-gray">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight flex items-center gap-3">
              <Bell className="w-8 h-8 text-brand-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="bg-brand-primary text-white text-sm px-3 py-1 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-clinical-gray mt-2">Stay updated with your latest alerts and messages</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-brand-primary font-bold bg-brand-primary/10 hover:bg-brand-primary/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 self-start md:self-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 glass rounded-3xl"
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-xl font-bold text-clinical-dark dark:text-clinical-white mb-2">
                  All caught up!
                </h3>
                <p className="text-clinical-gray">You have no new notifications.</p>
              </motion.div>
            ) : (
              notifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={`glass p-6 rounded-3xl flex flex-col sm:flex-row sm:items-start gap-4 transition-all group cursor-pointer ${
                    !notif.isRead 
                      ? "border-l-4 border-l-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10" 
                      : "border-l-4 border-l-transparent hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconColorClass(notif.type)}`}>
                    {getIconForType(notif.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className={`text-lg font-bold ${!notif.isRead ? "text-clinical-dark dark:text-clinical-white" : "text-slate-600 dark:text-slate-300"}`}>
                          {notif.type.replace(/_/g, " ")}
                        </h4>
                        <p className={`mt-1 text-sm ${!notif.isRead ? "text-slate-700 dark:text-slate-300" : "text-clinical-gray"}`}>
                          {notif.message}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-clinical-gray whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
