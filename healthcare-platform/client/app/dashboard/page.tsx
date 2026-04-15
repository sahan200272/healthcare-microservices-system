"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  Video, 
  User, 
  Activity, 
  ChevronRight, 
  Bell, 
  Search,
  Plus,
  Mail,
  Shield,
  Stethoscope
} from "lucide-react";
import Link from "next/link";

interface UserDetails {
  name: string | null;
  email: string | null;
  role: string | null;
  id: string | null;
}

export default function Dashboard() {
  const [userDetails, setUserDetails] = useState<UserDetails>({
    name: null,
    email: null,
    role: null,
    id: null,
  });

  const [sessions, setSessions] = useState([
    { id: "1", doctor: "Dr. Smith", patient: "John Doe", time: "10:30 AM", date: "Today", status: "Upcoming", type: "General Consultation" },
    { id: "2", doctor: "Dr. Wilson", patient: "John Doe", time: "02:00 PM", date: "Tomorrow", status: "Scheduled", type: "Pediatric Follow-up" },
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("name");
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");
      const id = localStorage.getItem("id");

      setUserDetails({
        name: name || "User",
        email: email || "user@example.com",
        role: role || "PATIENT",
        id: id || "N/A",
      });
    }
  }, []);

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case "DOCTOR":
        return <Stethoscope className="w-4 h-4" />;
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case "DOCTOR":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "ADMIN":
        return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30";
      default:
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
    }
  };

  const stats = [
    { label: "Active Sessions", value: "12", icon: Activity, color: "bg-blue-500" },
    { label: "Total Patients", value: "1,240", icon: User, color: "bg-purple-500" },
    { label: "Pending Requests", value: "5", icon: Bell, color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 bg-clinical-white dark:bg-clinical-dark">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-clinical-dark dark:text-clinical-white tracking-tight">
              Welcome, <span className="text-brand-primary">{userDetails.name}</span>
            </h1>
            <p className="text-clinical-gray mt-2">Here's what's happening today in your healthcare network.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-clinical-gray" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20 w-64 transition-all"
              />
            </div>
            <button className="bg-brand-primary hover:bg-brand-primary/90 text-white p-3 rounded-xl shadow-lg shadow-brand-primary/20 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-6 md:p-8 mb-10 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 border border-brand-primary/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            {/* Left: User Info */}
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary">
                <User className="w-10 h-10" />
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${getRoleColor(userDetails.role)}`}>
                      {getRoleIcon(userDetails.role)}
                      {userDetails.role}
                    </span>
                    <span className="text-xs text-clinical-gray">ID: {userDetails.id}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Profile Summary */}
            <div className="grid grid-cols-2 gap-4 md:min-w-max">
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Account Status</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-2">Active</p>
              </div>
              <div className="bg-white dark:bg-slate-900/50 rounded-xl p-4 text-center">
                <p className="text-xs text-clinical-gray font-bold uppercase tracking-widest">Member Since</p>
                <p className="text-lg font-bold text-clinical-dark dark:text-clinical-white mt-2">2024</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-2xl`}>
                  <stat.icon className="text-white w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">+12.5%</span>
              </div>
              <h3 className="text-clinical-gray text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold mt-1 text-clinical-dark dark:text-clinical-white">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Sessions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content: Sessions List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white">Telemedicine Sessions</h2>
              <Link href="/sessions" className="text-brand-primary text-sm font-bold hover:underline flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ y: -4 }}
                  className="glass p-6 rounded-3xl border-l-[6px] border-brand-primary group transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary overflow-hidden">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-clinical-dark dark:text-clinical-white group-hover:text-brand-primary transition-colors">{session.doctor}</h4>
                        <p className="text-clinical-gray text-sm">{session.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right hidden sm:block">
                        <div className="flex items-center text-sm font-bold text-clinical-dark dark:text-clinical-white justify-end">
                          <Clock className="w-4 h-4 mr-1.5 text-brand-primary" />
                          {session.time}
                        </div>
                        <div className="flex items-center text-xs text-clinical-gray mt-1 justify-end">
                          <Calendar className="w-3.5 h-3.5 mr-1.5" />
                          {session.date}
                        </div>
                      </div>

                      <Link 
                        href={`/sessions/${session.id}`}
                        className="bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-3 rounded-2xl shadow-lg shadow-brand-primary/20 flex items-center space-x-2 font-bold transition-all"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join</span>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Sidebar: Quick Actions / Activity */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-clinical-dark dark:text-clinical-white px-2">Quick Actions</h2>
            <div className="glass p-6 rounded-3xl space-y-4">
              <button className="w-full flex items-center p-4 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 text-clinical-dark dark:text-clinical-white transition-all text-left">
                <div className="bg-brand-primary p-2 rounded-xl mr-4">
                  <Plus className="text-white w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">New Session</div>
                  <div className="text-xs text-clinical-gray">Invite a patient now</div>
                </div>
              </button>
              
              <button className="w-full flex items-center p-4 rounded-2xl bg-brand-secondary/5 hover:bg-brand-secondary/10 text-clinical-dark dark:text-clinical-white transition-all text-left">
                <div className="bg-brand-secondary p-2 rounded-xl mr-4">
                  <User className="text-white w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">Add Patient</div>
                  <div className="text-xs text-clinical-gray">Register new profile</div>
                </div>
              </button>
            </div>

            <div className="glass p-6 rounded-3xl">
              <h3 className="font-bold text-clinical-dark dark:text-clinical-white mb-4">Health Pulse</h3>
              <div className="h-40 flex items-end justify-center space-x-3 pb-2 pt-4">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="w-4 bg-brand-primary/30 hover:bg-brand-primary rounded-t-lg transition-all"
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-clinical-gray mt-2 px-1 uppercase tracking-widest font-bold">
                <span>Mon</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
