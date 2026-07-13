"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, AlertCircle, CheckCircle, ArrowRight, ShieldAlert } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

function PasswordResetForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Autofill email from URL search params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("newPassword", newPassword);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      const response = await fetch(`${apiUrl}/change_password.php`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setSuccess("Your password has been successfully updated. You can now login using your new password.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Failed to update security passkey.");
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to connect to password server. Please verify that XAMPP Apache is running at http://localhost.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glow-card rounded-3xl p-6 sm:p-8 bg-[#15171c]/80 backdrop-blur-md border border-brand-card-border shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShieldAlert className="h-20 w-20 text-brand-purple" />
      </div>

      <div className="text-center mb-8">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 px-3.5 py-1.5 rounded-full border border-brand-cyan/20">
          Security Key Configuration
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
          Reset Security Passkey
        </h1>
        <p className="text-gray-400 text-xs mt-2">
          Update the initial onboarding credentials assigned to your profile
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex gap-3 text-red-200 text-xs items-start mb-6">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/25 p-4 rounded-xl flex flex-col gap-3 text-green-200 text-xs items-center mb-6 text-center">
          <CheckCircle className="h-6 w-6 text-green-400 shrink-0" />
          <span>{success}</span>
          <button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="mt-2 text-brand-cyan hover:underline font-bold font-mono text-2xs flex items-center gap-1 cursor-pointer"
          >
            Go to Login Portal <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {!success && (
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-gray-300 uppercase tracking-wider">
              Username (Email ID)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-gray-300 uppercase tracking-wider">
              New Security Passkey
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password (min 4 characters)"
                className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-2xs font-semibold text-gray-300 uppercase tracking-wider">
              Confirm Security Passkey
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all font-mono"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            type="submit"
            className="w-full rounded-xl py-3.5 font-bold text-white text-xs shadow-md bg-gradient-to-r from-brand-cyan to-brand-purple hover:shadow-brand-cyan/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 font-mono uppercase tracking-wider"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                Updating Security Key...
              </>
            ) : (
              <>
                Confirm Reset Passkey
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>
      )}

      <div className="text-center mt-6 pt-4 border-t border-brand-card-border/50">
        <p className="text-3xs text-gray-500 font-mono">
          Remember key? <a href="/login" className="text-brand-cyan hover:underline">Go to Login</a>
        </p>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <ScrollReveal>
        <Suspense fallback={
          <div className="text-center text-white py-12 font-mono text-xs">
            Loading security modules...
          </div>
        }>
          <PasswordResetForm />
        </Suspense>
      </ScrollReveal>
    </div>
  );
}
