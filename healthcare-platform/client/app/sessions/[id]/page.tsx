"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize,
  MoreVertical,
  Monitor,
  Share,
  Smile,
  ShieldCheck,
  Info
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function SessionPage() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    router.push("/dashboard");
  };

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden flex flex-col relative">
      {/* Top Header Overlay */}
      <div className="absolute top-0 w-full z-20 p-6 flex justify-between items-center pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl flex items-center space-x-4 pointer-events-auto"
        >
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-bold tracking-widest uppercase">Live Session</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center space-x-2 font-mono text-brand-secondary">
            <Clock className="w-4 h-4" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </motion.div>

        <div className="flex items-center space-x-3 pointer-events-auto">
          <button className="bg-black/40 backdrop-blur-md p-3 rounded-2xl hover:bg-white/10 transition-colors">
            <ShieldCheck className="w-5 h-5 text-green-400" />
          </button>
          <button className="bg-black/40 backdrop-blur-md p-3 rounded-2xl hover:bg-white/10 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center p-6 gap-6">
        {/* Remote Participant (Main View) */}
        <div className="relative w-full h-full rounded-[40px] overflow-hidden bg-slate-900 shadow-2xl group border border-white/5">
          {/* Placeholder for Remote Feed */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-32 h-32 bg-brand-primary/20 rounded-full flex items-center justify-center border border-brand-primary/30 mb-6">
              <User className="w-16 h-16 text-brand-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Dr. Sarah Wilson</h2>
            <p className="text-slate-400 mt-2">Connecting secure stream...</p>
          </div>
          
          {/* Remote Feed Watermark/Overlay */}
          <div className="absolute bottom-10 left-10 flex items-center space-x-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl">
             <div className="w-2 h-2 bg-green-500 rounded-full" />
             <span className="text-sm font-medium">Sarah Wilson</span>
          </div>
        </div>

        {/* Local Participant (PIP) */}
        <motion.div 
          drag
          dragConstraints={{ left: -500, right: 500, top: -300, bottom: 300 }}
          className="absolute bottom-32 right-12 w-80 aspect-video rounded-3xl overflow-hidden bg-slate-800 shadow-2xl border-2 border-white/10 z-10 cursor-move group"
        >
          {isVideoOn ? (
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
               <User className="w-12 h-12 text-slate-500" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
               <VideoOff className="w-8 h-8 text-slate-600" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium">
            You (Patient)
          </div>
        </motion.div>

        {/* Chat Sidebar Overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="w-96 h-full glass rounded-[40px] overflow-hidden flex flex-col border-white/10 shadow-2xl relative z-20"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold flex items-center">
                  <MessageSquare className="w-5 h-5 mr-3 text-brand-primary" />
                  Live Chat
                </h3>
                <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Close</button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                 <div className="bg-white/5 rounded-2xl p-4 text-sm text-slate-300 border border-white/5 italic">
                    All messages are encrypted end-to-end to protect your privacy.
                 </div>
              </div>
              <div className="p-6 border-t border-white/10">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 outline-none focus:ring-2 focus:ring-brand-primary/50 transition-all text-sm"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-primary rounded-xl text-white">
                       <Smile className="w-5 h-5" />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="p-10 flex justify-center relative">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-slate-900/80 backdrop-blur-3xl px-10 py-5 rounded-[32px] border border-white/10 flex items-center space-x-8 shadow-2xl"
        >
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsMicOn(!isMicOn)}
              className={`p-5 rounded-3xl transition-all ${isMicOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/80 hover:bg-red-500 text-white"}`}
            >
              {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => setIsVideoOn(!isVideoOn)}
              className={`p-5 rounded-3xl transition-all ${isVideoOn ? "bg-white/10 hover:bg-white/20 text-white" : "bg-red-500/80 hover:bg-red-500 text-white"}`}
            >
              {isVideoOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          </div>

          <div className="w-px h-10 bg-white/10" />

          <button className="p-5 rounded-3xl bg-white/10 hover:bg-white/20 text-white transition-all">
            <Monitor className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleEndCall}
            className="p-5 rounded-[28px] bg-red-600 hover:bg-red-700 text-white transition-all shadow-xl shadow-red-600/30 transform hover:scale-110 active:scale-95 px-10"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button className="p-5 rounded-3xl bg-white/10 hover:bg-white/20 text-white transition-all">
            <MoreVertical className="w-6 h-6" />
          </button>

          <div className="w-px h-10 bg-white/10" />

          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-5 rounded-3xl transition-all ${isChatOpen ? "bg-brand-primary text-white" : "bg-white/10 hover:bg-white/20 text-white"}`}
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button className="p-5 rounded-3xl bg-white/10 hover:bg-white/20 text-white transition-all">
              <Users className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function User(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
