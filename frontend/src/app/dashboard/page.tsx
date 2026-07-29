"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Clock,
  Activity,
  LogOut,
  CheckCircle,
  AlertCircle,
  FileVideo,
  User,
  Key,
  Wallet,
  Users,
  Copy,
  Check,
  LayoutGrid,
  Menu,
  X,
  Banknote,
  Gift,
  ArrowRight,
} from "lucide-react";

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

interface Referral {
  name: string;
  email: string;
  joinedAt: string;
}

interface WithdrawalRow {
  id: number;
  amount: number;
  status: string;
  bankName: string;
  accountNumber: string;
  adminNote: string;
  requestedAt: string;
  processedAt: string | null;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend"
).replace(/\/$/, "");

const money = (n: number) =>
  `₹${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Section = "overview" | "telemetry" | "referrals" | "wallet" | "profile";

const NAV: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "telemetry", label: "Upload Telemetry", icon: FileVideo },
  { id: "referrals", label: "Refer & Earn", icon: Users },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "profile", label: "My Profile", icon: User },
];

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [navOpen, setNavOpen] = useState(false);

  const [stats, setStats] = useState({
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    uploadCount: 0,
  });
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Referral + wallet
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [perBonus, setPerBonus] = useState(6);
  const [bonusPerBlock, setBonusPerBlock] = useState(1000);
  const [toNextBonus, setToNextBonus] = useState(6);
  const [wallet, setWallet] = useState({
    available: 0,
    totalEarned: 0,
    referralEarnings: 0,
    uploadEarnings: 0,
    withdrawn: 0,
    pendingWithdrawal: 0,
    minWithdrawal: 100,
  });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [copied, setCopied] = useState(false);

  // Withdraw form
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wAmount, setWAmount] = useState("");
  const [wHolder, setWHolder] = useState("");
  const [wBank, setWBank] = useState("");
  const [wAccount, setWAccount] = useState("");
  const [wIfsc, setWIfsc] = useState("");
  const [wError, setWError] = useState<string | null>(null);
  const [wSuccess, setWSuccess] = useState<string | null>(null);
  const [wSubmitting, setWSubmitting] = useState(false);

  // Upload states
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [hoursInput, setHoursInput] = useState("");
  const [userMessageInput, setUserMessageInput] = useState("");
  const [termsConsent, setTermsConsent] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsePhase, setParsePhase] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const redirectToLogin = () => {
    window.location.href = "/login";
  };

  const fetchStats = useCallback(async (email: string) => {
    setIsLoadingStats(true);
    try {
      const response = await fetch(
        `${API_BASE}/get_user_stats.php?email=${encodeURIComponent(email)}`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (response.ok && data.status === "success") {
        setStats(data.stats);
        setLogs(data.logs);
        if (data.referral) {
          setReferralCode(data.referral.code || "");
          setReferrals(data.referral.list || []);
          setPerBonus(data.referral.perBonus || 6);
          setBonusPerBlock(data.referral.bonusPerBlock || 1000);
          setToNextBonus(data.referral.toNextBonus || 6);
        }
        if (data.wallet) {
          setWallet({
            available: data.wallet.available || 0,
            totalEarned: data.wallet.totalEarned || 0,
            referralEarnings: data.wallet.referralEarnings || 0,
            uploadEarnings: data.wallet.uploadEarnings || 0,
            withdrawn: data.wallet.withdrawn || 0,
            pendingWithdrawal: data.wallet.pendingWithdrawal || 0,
            minWithdrawal: data.wallet.minWithdrawal || 100,
          });
          setWithdrawals(data.wallet.history || []);
        }
      }
    } catch (err) {
      console.error("Failed to load contractor statistics:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    const session = localStorage.getItem("contractorUser");
    if (session) {
      try {
        const profile = JSON.parse(session);
        setUser(profile);
        fetchStats(profile.email);
      } catch {
        redirectToLogin();
      }
    } else {
      redirectToLogin();
    }
  }, [fetchStats]);

  const handleLogout = () => {
    localStorage.removeItem("contractorUser");
    redirectToLogin();
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is on screen to copy manually */
    }
  };

  const go = (s: Section) => {
    setSection(s);
    setNavOpen(false);
  };

  // ---------- Withdrawal ----------
  const openWithdraw = () => {
    setWError(null);
    setWSuccess(null);
    setWAmount(String(wallet.available > 0 ? wallet.available : ""));
    setWHolder(user?.name || "");
    setWBank(user?.bankName || "");
    setWAccount(user?.accountNumber || "");
    setWIfsc(user?.ifscCode || "");
    setShowWithdraw(true);
  };

  const submitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setWError(null);
    setWSubmitting(true);

    const body = new FormData();
    body.append("email", user.email);
    body.append("amount", wAmount);
    body.append("accountHolder", wHolder);
    body.append("bankName", wBank);
    body.append("accountNumber", wAccount);
    body.append("ifscCode", wIfsc);

    try {
      const res = await fetch(`${API_BASE}/request_withdrawal.php`, { method: "POST", body });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setWSuccess(data.message);
        setShowWithdraw(false);
        fetchStats(user.email);
      } else {
        setWError(data.message || "Could not submit the withdrawal request.");
      }
    } catch {
      setWError("Could not reach the server. Please try again.");
    } finally {
      setWSubmitting(false);
    }
  };

  // ---------- Upload ----------
  const triggerFileSelect = () => fileInputRef.current?.click();

  const acceptFile = (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      setUploadError("File exceeds the maximum limit of 500MB.");
      setVideoFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["mp4", "avi", "mov", "webm", "mkv", "json"];
    if (!allowed.includes(ext)) {
      setUploadError("Invalid format. Allowed: " + allowed.join(", "));
      return;
    }
    setVideoFile(file);
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) acceptFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) acceptFile(e.dataTransfer.files[0]);
  };

  const handleTelemetryUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !user) return;
    if (!hoursInput || parseFloat(hoursInput) <= 0) {
      setUploadError("Please provide a valid number of hours worked.");
      return;
    }
    if (!termsConsent) {
      setUploadError("You must agree to the telemetry upload guidelines to submit.");
      return;
    }

    setUploadError(null);
    setIsParsing(true);
    setParseProgress(0);

    await new Promise<void>((resolve) => {
      let p = 0;
      const iv = setInterval(() => {
        p += 1;
        setParseProgress(p);
        if (p < 25) setParsePhase("Connecting with local AI accelerator frame...");
        else if (p < 50) setParsePhase("Scanning video spatial dimensions...");
        else if (p < 75) setParsePhase("Calculating joint torque vectors...");
        else if (p < 100) setParsePhase("Syncing coordinates to central registry...");
        else {
          clearInterval(iv);
          resolve();
        }
      }, 20);
    });

    const formData = new FormData();
    formData.append("email", user.email);
    formData.append("video", videoFile);
    formData.append("hours", hoursInput);
    formData.append("userMessage", userMessageInput);

    try {
      const response = await fetch(`${API_BASE}/upload_video.php`, { method: "POST", body: formData });
      const data = await response.json();

      if (response.ok && data.status === "success") {
        setVideoFile(null);
        setHoursInput("");
        setUserMessageInput("");
        setTermsConsent(false);
        setLogs((prev) => [
          {
            id: data.telemetry.id,
            filename: data.telemetry.filename,
            filepath: data.telemetry.filepath,
            durationHours: data.telemetry.durationHours,
            userMessage: data.telemetry.userMessage,
            adminFeedback: data.telemetry.adminFeedback,
            status: data.telemetry.status,
            timestamp: data.telemetry.timestamp,
          },
          ...prev,
        ]);
        setStats((prev) => ({
          ...prev,
          pendingHours: prev.pendingHours + data.telemetry.durationHours,
          uploadCount: prev.uploadCount + 1,
        }));
      } else {
        setUploadError(data.message || "Failed to log telemetry dataset.");
      }
    } catch {
      setUploadError("Server connection error during upload.");
    } finally {
      setIsParsing(false);
      setParseProgress(0);
      setParsePhase("");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f] text-white font-mono text-xs">
        Loading your account…
      </div>
    );
  }

  const referralProgress = referrals.length % perBonus;
  const progressPct = (referralProgress / perBonus) * 100;
  const statusTone = (s: string) =>
    /approved|verified|paid/i.test(s)
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : /rejected/i.test(s)
      ? "text-red-400 bg-red-500/10 border-red-500/30"
      : "text-amber-400 bg-amber-500/10 border-amber-500/30";

  // ------------------------------------------------------------------ render
  return (
    <div className="min-h-screen bg-[#0b0b0f] text-gray-200 flex flex-col lg:flex-row">
      {/* ---------------- LEFT MENU ---------------- */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-brand-card-border bg-[#0f1117] min-h-screen sticky top-0">
        <div className="p-6 border-b border-brand-card-border flex items-center gap-3">
          <p className="text-sm font-bold font-mono tracking-widest text-brand-cyan uppercase">
            Customer Portal
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                section === id
                  ? "bg-brand-cyan/15 text-brand-cyan font-semibold"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {id === "wallet" && wallet.available > 0 && (
                <span className="ml-auto text-3xs font-mono bg-emerald-500/15 text-emerald-400 rounded-full px-1.5 py-0.5">
                  {money(wallet.available).replace(".00", "")}
                </span>
              )}
              {id === "referrals" && referrals.length > 0 && (
                <span className="ml-auto text-3xs font-mono bg-white/10 text-gray-300 rounded-full px-1.5 py-0.5">
                  {referrals.length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-card-border/60">
          <button
            onClick={() => (window.location.href = `/change-password?email=${encodeURIComponent(user.email)}`)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors mb-1"
          >
            <Key className="h-4 w-4" /> Change Password
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile drawer (NO ANIMATION) */}
      {navOpen && (
        <>
          <div
            onClick={() => setNavOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#0f1117] border-r border-brand-card-border p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-white text-sm font-mono tracking-widest text-brand-cyan uppercase">Customer Portal</span>
              <button onClick={() => setNavOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm mb-1 ${
                  section === id
                    ? "bg-brand-cyan/15 text-brand-cyan font-semibold"
                    : "text-gray-400"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
            <div className="mt-2 pt-2 border-t border-brand-card-border/60">
              <button
                onClick={() => (window.location.href = `/change-password?email=${encodeURIComponent(user.email)}`)}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-400"
              >
                <Key className="h-4 w-4" /> Change Password
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 p-4 sm:p-6 border-b border-brand-card-border bg-[#0b0b0f] sticky top-0 z-20">
          <div className="min-w-0 flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              className="lg:hidden shrink-0 rounded-xl border border-brand-card-border p-2 bg-brand-dark text-gray-300"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
            {wSuccess && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-200">{wSuccess}</p>
              </div>
            )}

            {/* ===================== OVERVIEW ===================== */}
            {section === "overview" && (
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard icon={Wallet} label="Wallet balance" value={money(wallet.available)} tone="emerald" />
                  <StatCard icon={Users} label="Referrals" value={String(referrals.length)} tone="cyan" />
                  <StatCard icon={Clock} label="Approved hours" value={`${stats.approvedHours}`} tone="violet" />
                  <StatCard icon={Activity} label="Uploads" value={String(stats.uploadCount)} tone="slate" />
                </div>

                {/* Referral progress */}
                <Card>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Gift className="h-4 w-4 text-brand-cyan" /> Refer {perBonus} people, earn {money(bonusPerBlock)}
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">
                        {referrals.length === 0
                          ? "Share your referral ID to start earning."
                          : `${referrals.length} joined so far — ${toNextBonus} more for your next ${money(bonusPerBlock)}.`}
                      </p>
                    </div>
                    <button
                      onClick={() => go("referrals")}
                      className="text-xs font-semibold text-brand-cyan inline-flex items-center gap-1.5"
                    >
                      Invite people <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-purple transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-3xs font-mono text-gray-500">
                      <span>{referralProgress} / {perBonus} toward next bonus</span>
                      <span>{money(wallet.referralEarnings)} earned</span>
                    </div>
                  </div>
                </Card>

                <Card>
                  <h2 className="text-sm font-bold text-white mb-3">Recent uploads</h2>
                  {isLoadingStats ? (
                    <p className="text-xs text-gray-500">Loading…</p>
                  ) : logs.length === 0 ? (
                    <p className="text-xs text-gray-500">Nothing uploaded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {logs.slice(0, 4).map((l, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-xs py-2 border-b border-brand-card-border/40 last:border-0">
                          <span className="truncate text-gray-300">{l.filename}</span>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-3xs font-semibold ${statusTone(l.status)}`}>
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===================== REFERRALS ===================== */}
            {section === "referrals" && (
              <div className="flex flex-col gap-5">
                <Card>
                  <h2 className="text-base font-bold text-white">Your referral ID</h2>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Share this ID. When someone enters it while registering, they are
                    counted as your referral. Every <b className="text-white">{perBonus}</b> people
                    who join adds <b className="text-emerald-400">{money(bonusPerBlock)}</b> to your wallet automatically.
                  </p>

                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 p-3">
                    <span className="font-mono text-lg sm:text-xl font-bold text-brand-cyan tracking-wider flex-1 truncate">
                      {referralCode || "—"}
                    </span>
                    <button
                      onClick={copyCode}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-brand-cyan/15 px-3 py-2 text-xs font-semibold text-brand-cyan"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-3xs text-gray-500 mt-2 font-mono">
                    This is your registered phone number.
                  </p>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard icon={Users} label="Total referrals" value={String(referrals.length)} tone="cyan" />
                  <StatCard icon={Gift} label="Referral earnings" value={money(wallet.referralEarnings)} tone="emerald" />
                  <StatCard icon={Activity} label="Until next bonus" value={String(toNextBonus)} tone="violet" />
                </div>

                <Card>
                  <h2 className="text-sm font-bold text-white mb-3">
                    People you referred ({referrals.length})
                  </h2>
                  {referrals.length === 0 ? (
                    <div className="py-8 text-center">
                      <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">
                        No referrals yet. Share your ID above to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {referrals.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 py-2.5 border-b border-brand-card-border/40 last:border-0"
                        >
                          <div className="h-8 w-8 shrink-0 rounded-full bg-brand-cyan/15 text-brand-cyan grid place-items-center text-xs font-bold">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate">{r.name}</p>
                            <p className="text-3xs text-gray-500 font-mono">{r.joinedAt}</p>
                          </div>
                          <span className="shrink-0 text-3xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                            Joined
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===================== WALLET ===================== */}
            {section === "wallet" && (
              <div className="flex flex-col gap-5">
                <Card>
                  <p className="text-xs text-gray-400">Available to withdraw</p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                    {money(wallet.available)}
                  </p>

                  <button
                    onClick={openWithdraw}
                    disabled={wallet.available < wallet.minWithdrawal}
                    className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple px-6 py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Banknote className="h-4 w-4" /> Withdraw money
                  </button>
                  {wallet.available < wallet.minWithdrawal && (
                    <p className="text-3xs text-gray-500 mt-2">
                      Minimum withdrawal is {money(wallet.minWithdrawal)}.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-brand-card-border/50">
                    <Figure label="Referral bonus" value={money(wallet.referralEarnings)} />
                    <Figure label="Telemetry earnings" value={money(wallet.uploadEarnings)} />
                    <Figure label="Awaiting payout" value={money(wallet.pendingWithdrawal)} />
                    <Figure label="Already paid out" value={money(wallet.withdrawn)} />
                  </div>
                </Card>

                <Card>
                  <h2 className="text-sm font-bold text-white mb-3">Withdrawal history</h2>
                  {withdrawals.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">No withdrawals yet.</p>
                  ) : (
                    <div className="flex flex-col">
                      {withdrawals.map((w) => (
                        <div key={w.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-brand-card-border/40 last:border-0">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white">{money(w.amount)}</p>
                            <p className="text-3xs text-gray-500 font-mono">{w.requestedAt}</p>
                            {w.adminNote && (
                              <p className="text-3xs text-gray-400 mt-0.5">{w.adminNote}</p>
                            )}
                          </div>
                          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-3xs font-semibold capitalize ${statusTone(w.status)}`}>
                            {w.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===================== TELEMETRY ===================== */}
            {section === "telemetry" && (
              <div className="flex flex-col gap-5">
                <Card>
                  <h2 className="text-base font-bold text-white">Upload telemetry</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload your recording and the hours you worked. An admin reviews it,
                    and approved hours are paid into your wallet.
                  </p>

                  <form onSubmit={handleTelemetryUpload} className="mt-4 flex flex-col gap-4">
                    <div
                      onClick={triggerFileSelect}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      className="cursor-pointer rounded-xl border-2 border-dashed border-brand-card-border hover:border-brand-cyan/60 p-6 text-center transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept=".mp4,.avi,.mov,.webm,.mkv,.json"
                        className="hidden"
                      />
                      <Upload className="h-7 w-7 text-brand-cyan mx-auto mb-2" />
                      {videoFile ? (
                        <p className="text-xs text-white font-semibold break-all">{videoFile.name}</p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-300">Tap to choose a file, or drop it here</p>
                          <p className="text-3xs text-gray-500 mt-1">MP4, AVI, MOV, WEBM, MKV · max 500MB</p>
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Hours worked
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={hoursInput}
                        onChange={(e) => setHoursInput(e.target.value)}
                        placeholder="e.g. 3.5"
                        className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
                      />
                    </div>

                    <div>
                      <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                        Note for the reviewer (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={userMessageInput}
                        onChange={(e) => setUserMessageInput(e.target.value)}
                        placeholder="Anything the reviewer should know…"
                        className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan resize-none"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsConsent}
                        onChange={(e) => setTermsConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-cyan"
                      />
                      <span className="text-xs text-gray-400">
                        I confirm this recording is my own work and the hours stated are accurate.
                      </span>
                    </label>

                    {uploadError && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{uploadError}</p>
                      </div>
                    )}

                    {isParsing && (
                      <div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-cyan to-brand-purple transition-all"
                            style={{ width: `${parseProgress}%` }}
                          />
                        </div>
                        <p className="text-3xs font-mono text-gray-500 mt-1.5">{parsePhase}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isParsing || !videoFile}
                      className="rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isParsing ? "Uploading…" : "Submit telemetry"}
                    </button>
                  </form>
                </Card>

                <Card>
                  <h2 className="text-sm font-bold text-white mb-3">Your submissions ({logs.length})</h2>
                  {logs.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4 text-center">Nothing uploaded yet.</p>
                  ) : (
                    <div className="flex flex-col">
                      {logs.map((l, i) => (
                        <div key={i} className="py-3 border-b border-brand-card-border/40 last:border-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-white break-all">{l.filename}</p>
                              <p className="text-3xs text-gray-500 font-mono mt-0.5">
                                {l.durationHours} hrs · {l.timestamp}
                              </p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-3xs font-semibold ${statusTone(l.status)}`}>
                              {l.status}
                            </span>
                          </div>
                          {l.adminFeedback && (
                            <p className="text-3xs text-gray-400 mt-1.5">
                              <span className="text-gray-500">Reviewer:</span> {l.adminFeedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ===================== PROFILE ===================== */}
            {section === "profile" && (
              <Card>
                <h2 className="text-base font-bold text-white mb-4">My profile</h2>
                <div className="flex flex-col gap-3.5">
                  <Field label="Name" value={user.name} />
                  <Field label="Email" value={user.email} />
                  <Field label="Phone (your referral ID)" value={user.phone} />
                  <Field label="Address" value={user.address} />
                </div>
                <div className="mt-5 pt-4 border-t border-brand-card-border/50 flex flex-wrap gap-2">
                  <button
                    onClick={() => (window.location.href = `/change-password?email=${encodeURIComponent(user.email)}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-card-border px-4 py-2.5 text-xs font-semibold text-gray-200 hover:border-brand-cyan/50"
                  >
                    <Key className="h-3.5 w-3.5" /> Change password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign out
                  </button>
                </div>
              </Card>
            )}
          </main>
      </div>

      {/* ---------------- WITHDRAW MODAL ---------------- */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setShowWithdraw(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-brand-card-border bg-[#12141a] p-5">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Withdraw money</h3>
              <button onClick={() => setShowWithdraw(false)} aria-label="Close">
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Available: <b className="text-emerald-400">{money(wallet.available)}</b>. Tell us where to send it.
            </p>

            <form onSubmit={submitWithdraw} className="flex flex-col gap-3">
              <ModalField label="Amount (₹)">
                <input
                  type="number" step="0.01" min={wallet.minWithdrawal} max={wallet.available} required
                  value={wAmount} onChange={(e) => setWAmount(e.target.value)}
                  className="w-full bg-brand-dark/60 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan"
                />
              </ModalField>
              <ModalField label="Account holder name">
                <input type="text" required value={wHolder} onChange={(e) => setWHolder(e.target.value)}
                  className="w-full bg-brand-dark/60 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan" />
              </ModalField>
              <ModalField label="Bank name">
                <input type="text" required value={wBank} onChange={(e) => setWBank(e.target.value)}
                  className="w-full bg-brand-dark/60 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-cyan" />
              </ModalField>
              <ModalField label="Account number">
                <input type="text" required value={wAccount} onChange={(e) => setWAccount(e.target.value)}
                  className="w-full bg-brand-dark/60 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-brand-cyan" />
              </ModalField>
              <ModalField label="IFSC code">
                <input type="text" required value={wIfsc} onChange={(e) => setWIfsc(e.target.value)}
                  className="w-full bg-brand-dark/60 border border-brand-card-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-brand-cyan" />
              </ModalField>

              {wError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{wError}</p>
                </div>
              )}

              <button
                type="submit" disabled={wSubmitting}
                className="mt-1 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {wSubmitting ? "Submitting…" : "Request withdrawal"}
              </button>
              <p className="text-3xs text-gray-500 text-center">
                Our team reviews the request and transfers the money to this account.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-brand-card-border bg-brand-card/40 p-4 sm:p-5">
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, tone,
}: { icon: React.ElementType; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    cyan: "bg-brand-cyan/10 text-brand-cyan",
    violet: "bg-brand-purple/10 text-brand-purple",
    slate: "bg-white/5 text-gray-300",
  };
  return (
    <div className="rounded-2xl border border-brand-card-border bg-brand-card/40 p-3.5 sm:p-4">
      <div className={`h-8 w-8 rounded-lg grid place-items-center mb-2.5 ${tones[tone]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-3xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-white mt-0.5 truncate">{value}</p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white mt-0.5 break-words">{value || "—"}</p>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
