"use client";

import { motion } from "framer-motion";
import { Activity, Shield, Zap, Video, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const features = [
    { icon: Video, title: "Telemedicine", desc: "HD video consultations with top-tier specialists from the comfort of your home." },
    { icon: Shield, title: "Secure Data", desc: "End-to-end encryption for all your medical records and private conversations." },
    { icon: Zap, title: "Instant Access", desc: "Connect with available doctors in minutes, not days. Fast and reliable." },
  ];

  return (
    <div className="min-h-screen bg-clinical-white dark:bg-clinical-dark relative overflow-hidden">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2 space-y-8"
            >
              <div className="inline-flex items-center space-x-2 bg-brand-primary/10 px-4 py-2 rounded-full border border-brand-primary/20">
                <Heart className="w-4 h-4 text-brand-primary fill-brand-primary" />
                <span className="text-brand-primary text-sm font-bold tracking-wide uppercase">The Future of Care</span>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-clinical-dark dark:text-clinical-white leading-[1.1]">
                Your Health, <span className="text-brand-primary">Simplified</span>.
              </h1>
              
              <p className="text-xl text-clinical-gray max-w-xl leading-relaxed">
                Connect with world-class healthcare providers through our secure, AI-powered microservices platform. Experience telemedicine like never before.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/register" 
                  className="bg-brand-primary hover:bg-brand-primary/90 text-white px-10 py-5 rounded-2xl shadow-xl shadow-brand-primary/25 font-bold transition-all flex items-center group"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/login" 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-clinical-dark dark:text-clinical-white px-10 py-5 rounded-2xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
              </div>

              <div className="flex items-center space-x-6 pt-4 border-t border-slate-100 dark:border-slate-800 w-fit">
                 <div className="flex -space-x-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-900 bg-slate-200" />
                    ))}
                 </div>
                 <div className="text-sm">
                    <div className="font-bold text-clinical-dark dark:text-clinical-white">10k+ Patients</div>
                    <div className="text-clinical-gray">Trust HealthSync today</div>
                 </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="lg:w-1/2 relative"
            >
              {/* Abstract Glass Geometric Shape */}
              <div className="relative z-10 w-full aspect-square bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-[80px] overflow-hidden backdrop-blur-3xl shadow-3xl border border-white/20 p-12">
                 <div className="w-full h-full glass rounded-[60px] flex items-center justify-center">
                    <Activity className="w-40 h-40 text-brand-primary animate-pulse" />
                 </div>
              </div>
              
              {/* Orbs */}
              <div className="absolute top-0 -right-20 w-80 h-80 bg-brand-primary/30 rounded-full blur-[120px] -z-10" />
              <div className="absolute bottom-0 -left-20 w-80 h-80 bg-brand-secondary/30 rounded-full blur-[120px] -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white dark:bg-slate-900 p-10 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all"
              >
                <div className="bg-brand-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                  <f.icon className="w-8 h-8 text-brand-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-clinical-dark dark:text-clinical-white">{f.title}</h3>
                <p className="text-clinical-gray leading-relaxed text-lg">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer / Stats */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
         <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center opacity-50">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
               <Activity className="w-5 h-5 text-brand-primary" />
               <span className="font-bold">HealthSync &copy; 2026</span>
            </div>
            <div className="flex space-x-8 text-sm font-medium">
               <span>Privacy Policy</span>
               <span>Terms of Service</span>
               <span>Contact Us</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
