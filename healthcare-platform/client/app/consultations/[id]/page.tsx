"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageCircle,
  Share2,
  Settings,
  Clock,
} from "lucide-react";
import { telemedicineApi } from "@/lib/api";

declare global {
  var JitsiMeetExternalAPI: any;
}

interface SessionInfo {
  id: string;
  doctorName: string;
  patientName: string;
  startTime: string;
  endTime: string;
  consultationFee: number;
  status: string;
}

export default function VideoConsultationPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ user: string; msg: string }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  const userRole = typeof window !== "undefined" ? localStorage.getItem("role") : "";

  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await telemedicineApi.getSessionInfo(sessionId);
        setSessionInfo(response.data);

        // Mark session as started
        await telemedicineApi.startSession(sessionId);
        setIsSessionActive(true);

        // Initialize Jitsi Meet
        initializeJitsi(response.data);
      } catch (error) {
        console.error("Failed to load session:", error);
        alert("Failed to load consultation room");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSession();
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
    };
  }, [sessionId, router]);

  const initializeJitsi = async (session: SessionInfo) => {
    // Load Jitsi Meet API script
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = "https://meet.jitsi.isip.dev/external_api.js";
      script.async = true;
      script.onload = () => {
        startJitsiMeeting(session);
      };
      document.body.appendChild(script);
    } else {
      startJitsiMeeting(session);
    }
  };

  const startJitsiMeeting = (session: SessionInfo) => {
    if (!containerRef.current) return;

    const userName = typeof window !== "undefined" ? localStorage.getItem("name") : "User";
    const roomName = `healthsync-${sessionId}`.replaceAll(/[^a-zA-Z0-9-]/g, "");

    const options = {
      roomName: roomName,
      width: "100%",
      height: "100%",
      parentNode: containerRef.current,
      configOverwrite: {
        startAudioOnly: false,
        disableSimulcast: false,
        enableWelcomePage: false,
      },
      interfaceConfigOverwrite: {
        DEFAULT_BACKGROUND: "#1a1a1a",
        SHOW_JITSI_WATERMARK: false,
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "closedcaptions",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "chat",
          "recording",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "invite",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
          "Download",
          "help",
          "mute-everyone",
        ],
      },
      userInfo: {
        displayName: userName,
      },
    };

    apiRef.current = new window.JitsiMeetExternalAPI("meet.jitsi.isip.dev", options);

    // Event listeners
    apiRef.current.on("videoConferenceJoined", () => {
      console.log("Video conference joined");
    });

    apiRef.current.on("readyToClose", () => {
      handleEndConsultation();
    });
  };

  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleVideo");
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleMic = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand("toggleAudio");
      setIsMicOn(!isMicOn);
    }
  };

  const handleEndConsultation = async () => {
    try {
      await telemedicineApi.endSession(sessionId);
      setIsSessionActive(false);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-clinical-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-bold">Loading consultation room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-clinical-dark text-white">
      {/* Session Info Bar */}
      <div className="bg-black/50 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Video className="w-6 h-6 text-green-500" />
          <div>
            <h1 className="font-bold text-lg">
              {userRole === "DOCTOR" ? sessionInfo?.patientName : sessionInfo?.doctorName}
            </h1>
            <p className="text-sm text-clinical-gray flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Consultation Fee: Rs. {sessionInfo?.consultationFee}
            </p>
          </div>
        </div>

        <div className="text-sm text-clinical-gray">Session ID: {sessionId}</div>
      </div>

      {/* Main Video Container */}
      <div className="relative h-[calc(100vh-180px)]" ref={containerRef} />

      {/* Controls Bar */}
      <div className="bg-black/80 border-t border-slate-800 px-6 py-4 flex items-center justify-center gap-4">
        {/* Mic Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMic}
          className={`p-4 rounded-full transition-all ${
            isMicOn ? "bg-brand-primary hover:bg-brand-primary/90" : "bg-red-500 hover:bg-red-600"
          }`}
          title={isMicOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </motion.button>

        {/* Video Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all ${
            isVideoOn ? "bg-brand-primary hover:bg-brand-primary/90" : "bg-red-500 hover:bg-red-600"
          }`}
          title={isVideoOn ? "Stop video" : "Start video"}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </motion.button>

        {/* Chat Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(!chatOpen)}
          className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 transition-all"
          title="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-4 rounded-full bg-slate-700 hover:bg-slate-600 transition-all"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </motion.button>

        {/* End Call */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEndConsultation}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all"
          title="End call"
        >
          <PhoneOff className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className="fixed right-0 top-0 h-screen w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold">Chat</h3>
            <button onClick={() => setChatOpen(false)} className="text-clinical-gray hover:text-white">
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <p className="text-clinical-gray text-sm text-center">No messages yet</p>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <p className="text-brand-primary font-bold">{msg.user}</p>
                  <p className="text-clinical-gray">{msg.msg}</p>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-800">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-primary/20"
            />
          </div>
        </div>
      )}
    </div>
  );
}
