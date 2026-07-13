"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  DollarSign, 
  Clock, 
  Activity, 
  Lock, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  FileVideo, 
  User, 
  CreditCard,
  Key,
  ShieldCheck,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

interface TelemetryLog {
  id?: string | number;
  filename: string;
  filepath: string;
  durationHours: number;
  earnings?: number;
  status: string;
  timestamp: string;
  userMessage?: string;
  adminFeedback?: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    uploadCount: 0,
  });
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Upload States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [hoursInput, setHoursInput] = useState("");
  const [userMessageInput, setUserMessageInput] = useState("");
  const [termsConsent, setTermsConsent] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Custom parsing simulation states
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsePhase, setParsePhase] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication check on mount
  useEffect(() => {
    const session = localStorage.getItem("contractorUser");
    if (session) {
      try {
        const profile = JSON.parse(session);
        setUser(profile);
        fetchStats(profile.email);
      } catch (e) {
        console.error("Error decoding contractor session", e);
        redirectToLogin();
      }
    } else {
      redirectToLogin();
    }
  }, []);

  const redirectToLogin = () => {
    window.location.href = "/login";
  };

  const handleLogout = () => {
    localStorage.removeItem("contractorUser");
    redirectToLogin();
  };

  // Fetch telemetry logs and statistics
  const fetchStats = async (email: string) => {
    setIsLoadingStats(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      const response = await fetch(`${apiUrl}/get_user_stats.php?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setStats(data.stats);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load contractor statistics:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Uploader Handlers
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 500 * 1024 * 1024) {
        setUploadError("File exceeds the maximum limit of 500MB. Please upload a file under 500MB.");
        setVideoFile(null);
      } else {
        setVideoFile(file);
        setUploadError(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 500 * 1024 * 1024) {
        setUploadError("File exceeds the maximum limit of 500MB. Please upload a file under 500MB.");
        setVideoFile(null);
        return;
      }
      const nameCmps = file.name.split(".");
      const extension = nameCmps[nameCmps.length - 1].toLowerCase();
      const allowed = ["mp4", "avi", "mov", "webm", "mkv", "json"];
      
      if (allowed.includes(extension)) {
        setVideoFile(file);
        setUploadError(null);
      } else {
        setUploadError("Invalid format. Allowed formats: " + allowed.join(", "));
      }
    }
  };

  // Trigger telemetry parsing simulation + API upload
  const handleTelemetryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !user) return;

    if (!hoursInput || parseFloat(hoursInput) <= 0) {
      setUploadError("Please provide a valid number of hours worked.");
      return;
    }
    if (!termsConsent) {
      setUploadError("You must agree to the telemetry upload guidelines terms to submit.");
      return;
    }

    setUploadError(null);
    setIsParsing(true);
    setParseProgress(0);
    setParsePhase("Initializing link with Nexus-Core Co-Processor...");

    // 1. Run UI parsing simulation progress (feels extremely dynamic and futuristic)
    const runSimulation = () => {
      return new Promise<void>((resolve) => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 1;
          setParseProgress(currentProgress);

          if (currentProgress < 25) {
            setParsePhase("Connecting with local AI accelerator frame...");
          } else if (currentProgress < 50) {
            setParsePhase("Scanning video spatial dimensions & coordinate metrics...");
          } else if (currentProgress < 75) {
            setParsePhase("Calculating joint torque vectors & motor voltage spikes...");
          } else if (currentProgress < 100) {
            setParsePhase("Syncing analyzed joint coordinates to central registry...");
          } else {
            clearInterval(interval);
            resolve();
          }
        }, 20); // Sync fast
      });
    };

    await runSimulation();

    // 2. Perform actual file upload to Backend PHP API
    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("video", videoFile);
    formData.append("hours", hoursInput);
    formData.append("userMessage", userMessageInput);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      const response = await fetch(`${apiUrl}/upload_video.php`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Clear file input and form states
        setVideoFile(null);
        setHoursInput("");
        setUserMessageInput("");
        setTermsConsent(false);
        
        // Prepend new telemetry to current logs list
        const newLog: TelemetryLog = {
          id: data.telemetry.id,
          filename: data.telemetry.filename,
          filepath: data.telemetry.filepath,
          durationHours: data.telemetry.durationHours,
          userMessage: data.telemetry.userMessage,
          adminFeedback: data.telemetry.adminFeedback,
          status: data.telemetry.status,
          timestamp: data.telemetry.timestamp
        };
        
        setLogs((prev) => [newLog, ...prev]);
        
        // Dynamically increment total statistics instantly in front of user
        setStats((prev) => ({
          ...prev,
          pendingHours: prev.pendingHours + newLog.durationHours,
          uploadCount: prev.uploadCount + 1
        }));

      } else {
        setUploadError(data.message || "Failed to log telemetry dataset.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError("Server connection error during upload. Verify that XAMPP Apache is running.");
    } finally {
      setIsParsing(false);
      setParseProgress(0);
      setParsePhase("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f] text-white font-mono text-xs">
        Decrypting access profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-200">
      
      {/* GLOW DECORATIONS */}
      <div className="absolute top-0 right-0 w-[40vw] h-[40vh] bg-gradient-to-br from-brand-cyan/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] bg-gradient-to-tr from-brand-purple/5 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* DASHBOARD CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TOP PANEL NAVIGATION HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-card-border pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-mono font-bold text-brand-cyan uppercase bg-brand-cyan/10 px-2 py-0.5 rounded border border-brand-cyan/20">
                Authorized Node
              </span>
              <span className="text-3xs text-gray-500 font-mono">
                SECURE FRAME: SSL-Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-brand-cyan animate-pulse" />
              Contractor Telemetry Terminal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                window.location.href = `/change-password?email=${encodeURIComponent(user.email)}`;
              }}
              className="px-3.5 py-2 bg-brand-dark/50 border border-brand-card-border rounded-xl text-2xs font-bold text-gray-300 hover:text-white hover:border-brand-cyan/40 transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <Key className="h-3.5 w-3.5" />
              Change Passkey
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-red-950/15 border border-red-500/20 rounded-xl text-2xs font-bold text-red-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect Session
            </button>
          </div>
        </header>

        {/* MAIN SPLIT VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: PROFILE INFO & METRICS CARD */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* profile widget */}
            <div className="glow-card rounded-2xl p-5 border border-brand-card-border bg-brand-card/30 backdrop-blur-md">
              <h3 className="text-2xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-brand-card-border/50 pb-2 mb-4 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-brand-cyan" />
                Contractor Identity Profile
              </h3>
              
              <div className="flex flex-col gap-3.5">
                <div>
                  <span className="text-[10px] text-gray-500 font-mono block">FULL LEGAL NAME</span>
                  <span className="text-sm font-bold text-white block mt-0.5">{user.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-mono block">COMMUNICATION TARGET (EMAIL)</span>
                  <span className="text-xs font-mono text-brand-cyan block mt-0.5">{user.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-mono block">SECURE TELEPHONE COORDINATES</span>
                  <span className="text-xs font-mono text-white block mt-0.5">{user.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-mono block">DELIVERY ADDRESS</span>
                  <span className="text-xs text-gray-400 block mt-0.5 leading-relaxed">{user.address}</span>
                </div>
                
                <div className="pt-3.5 border-t border-brand-card-border/50">
                  <span className="text-[10px] text-gray-500 font-mono block mb-1">DISBURSEMENT BANKING ROUTE</span>
                  <div className="flex items-center justify-between text-xs font-mono bg-brand-dark/50 border border-brand-card-border/40 p-2.5 rounded-xl">
                    <span className="text-white font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-brand-cyan" />
                      {user.bankName}
                    </span>
                    <span className="text-brand-cyan font-bold">
                      ••••{user.accountNumber.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics Widget */}
            <div className="glow-card rounded-2xl p-5 border border-brand-card-border bg-brand-card/30 backdrop-blur-md">
              <h3 className="text-2xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-brand-card-border/50 pb-2 mb-4">
                Telemetry Metrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="bg-brand-dark/40 border border-brand-card-border/40 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-[10px] font-mono font-bold">APPROVED HOURS</span>
                    <Clock className="h-3.5 w-3.5 text-brand-cyan" />
                  </div>
                  <span className="text-xl font-mono font-black text-white">
                    {isLoadingStats ? "..." : stats.totalHours.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">Verified Logs</span>
                </div>

                <div className="bg-brand-dark/40 border border-brand-card-border/40 p-3.5 rounded-xl">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-[10px] font-mono font-bold">PENDING HOURS</span>
                    <Activity className="h-3.5 w-3.5 text-brand-purple" />
                  </div>
                  <span className="text-xl font-mono font-black text-brand-cyan">
                    {isLoadingStats ? "..." : stats.pendingHours.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">Pending Validation</span>
                </div>

                <div className="bg-brand-dark/40 border border-brand-card-border/40 p-3.5 rounded-xl col-span-2">
                  <div className="flex justify-between items-center text-gray-500 mb-1">
                    <span className="text-[10px] font-mono font-bold">TOTAL DATASETS LOGGED</span>
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-cyan" />
                  </div>
                  <div className="flex justify-between items-baseline mt-1.5">
                    <span className="text-base font-mono font-bold text-white">
                      {isLoadingStats ? "..." : stats.uploadCount} Video Logs
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: VIDEO UPLOADER & LOGS LIST */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* TELEMETRY UPLOADER FORM */}
            <div className="glow-card rounded-2xl p-5 border border-brand-card-border bg-brand-card/30 backdrop-blur-md">
              <h3 className="text-2xs font-mono font-bold text-gray-400 uppercase tracking-widest border-b border-brand-card-border/50 pb-2 mb-4">
                Telemetry Log Pipeline Upload
              </h3>

              <AnimatePresence mode="wait">
                {isParsing ? (
                  // Custom Parsing Simulation UI
                  <motion.div
                    key="parsing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center flex flex-col items-center justify-center"
                  >
                    <div className="relative h-20 w-20 flex items-center justify-center mb-6">
                      {/* Spinning core */}
                      <div className="absolute inset-0 border-4 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin" />
                      <div className="absolute inset-2 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                      <FileVideo className="h-6 w-6 text-brand-cyan animate-pulse" />
                    </div>

                    <span className="text-xs font-mono font-bold text-white block mb-1">
                      ANALYZING SPATIAL RESOLUTION: {parseProgress}%
                    </span>
                    <span className="text-3xs font-mono text-brand-cyan block max-w-sm mb-4 leading-normal h-8">
                      {parsePhase}
                    </span>

                    {/* Progress Bar container */}
                    <div className="w-full max-w-md bg-brand-dark/60 h-2 rounded-full border border-brand-card-border overflow-hidden relative shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple"
                        style={{ width: `${parseProgress}%` }}
                        transition={{ ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                ) : (
                  // Standard Drag & Drop Uploader Form
                  <motion.div
                    key="uploader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <form onSubmit={handleTelemetryUpload} className="flex flex-col gap-4">
                      
                      <div
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className="border-2 border-dashed border-brand-card-border/70 hover:border-brand-cyan/60 rounded-xl p-8 text-center bg-brand-dark/20 hover:bg-brand-dark/40 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".mp4,.avi,.mov,.webm,.mkv,.json"
                          className="hidden"
                        />

                        <div className="h-11 w-11 rounded-full bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 group-hover:scale-105 transition-transform text-brand-cyan">
                          <Upload className="h-5 w-5" />
                        </div>

                        {videoFile ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-white font-mono line-clamp-1">
                              {videoFile.name}
                            </span>
                            <span className="text-3xs text-gray-500 font-mono mt-0.5">
                              {(videoFile.size / (1024 * 1024)).toFixed(2)} MB | Click to Change
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs font-bold text-white block">
                              Select Telemetry Data File to Upload
                            </span>
                            <span className="text-3xs text-gray-400 block mt-1 font-mono">
                              Supports MP4, WebM, AVI video logs or JSON tracking files (up to 500MB)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User inputs for hours and message */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-3xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                            Hours Worked in this Video Log *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="e.g. 3.5"
                            value={hoursInput}
                            onChange={(e) => setHoursInput(e.target.value)}
                            className="bg-brand-dark/50 border border-brand-card-border/85 focus:border-brand-cyan/60 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none transition-all"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-3xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                            Additional Message / Notes for Verification
                          </label>
                          <textarea
                            placeholder="Describe any specific tasks, coordinates or issues..."
                            value={userMessageInput}
                            onChange={(e) => setUserMessageInput(e.target.value)}
                            rows={1}
                            className="bg-brand-dark/50 border border-brand-card-border/85 focus:border-brand-cyan/60 rounded-xl px-4 py-3.5 text-xs font-sans text-white placeholder-gray-600 focus:outline-none transition-all resize-none"
                          />
                        </div>
                      </div>

                      {/* Guidelines Consent */}
                      <div className="flex items-start gap-2.5 bg-brand-dark/20 p-3 rounded-xl border border-brand-card-border/50">
                        <input
                          type="checkbox"
                          id="termsConsent"
                          checked={termsConsent}
                          onChange={(e) => setTermsConsent(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-brand-card-border bg-brand-dark text-brand-cyan focus:ring-brand-cyan focus:ring-opacity-25 cursor-pointer"
                        />
                        <label htmlFor="termsConsent" className="text-3xs text-gray-400 leading-normal select-none cursor-pointer">
                          <strong className="text-gray-300">Upload Terms:</strong> I certify that I am uploading the correct telemetry video log. I agree that if the video is found to be incorrect, duplicated, or invalid, the submission may get rejected.
                        </label>
                      </div>

                      {uploadError && (
                        <div className="bg-red-500/10 border border-red-500/25 p-3.5 rounded-xl flex gap-2 text-red-200 text-xs items-start font-mono">
                          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                          <span>{uploadError}</span>
                        </div>
                      )}

                      <motion.button
                        disabled={!videoFile || !hoursInput || !termsConsent}
                        whileHover={videoFile && hoursInput && termsConsent ? { scale: 1.01 } : {}}
                        whileTap={videoFile && hoursInput && termsConsent ? { scale: 0.99 } : {}}
                        type="submit"
                        className="w-full relative inline-flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white text-xs shadow-md bg-gradient-to-r from-brand-cyan to-brand-purple hover:shadow-brand-cyan/20 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase font-mono tracking-wider"
                      >
                        Upload and Parse Telemetry Data
                        <ArrowRight className="h-4 w-4" />
                      </motion.button>

                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* LOGGED VIDEOS DATA TABLE */}
            <div className="glow-card rounded-2xl border border-brand-card-border bg-brand-card/30 backdrop-blur-md overflow-hidden">
              <div className="p-5 border-b border-brand-card-border/50 flex justify-between items-center">
                <h3 className="text-2xs font-mono font-bold text-gray-400 uppercase tracking-widest">
                  Logged Telemetry Datasets
                </h3>
                <button
                  onClick={() => fetchStats(user.email)}
                  disabled={isLoadingStats}
                  className="p-1.5 bg-brand-dark/50 border border-brand-card-border/80 hover:border-brand-cyan/40 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-gray-400 ${isLoadingStats ? "animate-spin text-brand-cyan" : ""}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                {isLoadingStats && logs.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono text-gray-500">
                    Decrypting log database...
                  </div>
                ) : logs.length > 0 ? (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-brand-dark/60 border-b border-brand-card-border/50 text-[10px] uppercase font-mono text-gray-500">
                        <th className="py-3.5 px-5">LOG FILENAME & FEEDBACK</th>
                        <th className="py-3.5 px-4">HOURS WORKED</th>
                        <th className="py-3.5 px-4">STATUS</th>
                        <th className="py-3.5 px-5">DATE RECORDED</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-card-border/20 text-gray-300">
                      {logs.map((log, index) => (
                        <tr key={index} className="hover:bg-brand-cyan/5 transition-colors">
                          <td className="py-3 px-5 font-mono max-w-xs">
                            <span className="font-semibold text-white block truncate">{log.filename}</span>
                            {log.userMessage && (
                              <span className="text-[10px] text-gray-400 block mt-1 leading-normal italic font-sans">
                                Note: {log.userMessage}
                              </span>
                            )}
                            {log.adminFeedback && (
                              <span className="text-[10px] text-brand-cyan block mt-1.5 leading-normal font-sans border-l-2 border-brand-cyan/40 pl-2 bg-brand-cyan/5 py-1 rounded">
                                Admin Message: {log.adminFeedback}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {log.durationHours.toFixed(1)} hrs
                          </td>
                          <td className="py-3 px-4">
                            {log.status === "Approved" || log.status === "Verified" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-green-500/25 bg-green-500/10 text-green-400 text-3xs font-bold font-mono">
                                <CheckCircle className="h-3 w-3" />
                                {log.status}
                              </span>
                            ) : log.status === "Rejected" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-red-500/25 bg-red-500/10 text-red-400 text-3xs font-bold font-mono">
                                <AlertCircle className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-brand-purple/25 bg-brand-purple/10 text-brand-purple text-3xs font-bold font-mono animate-pulse">
                                <Clock className="h-3 w-3" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-5 text-3xs font-mono text-gray-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-xs font-mono text-gray-500">
                    No logs recorded. Upload a telemetry video to log your first coordinates.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
