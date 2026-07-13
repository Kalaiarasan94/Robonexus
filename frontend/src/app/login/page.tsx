"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      const response = await fetch(`${apiUrl}/login.php`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        // Save contractor session to localStorage
        localStorage.setItem("contractorUser", JSON.stringify(data.user));
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "Invalid authentication credentials.");
      }
    } catch (err) {
      console.error("Login connection error:", err);
      setError("Failed to connect to authentication server. Please verify that XAMPP Apache is running at http://localhost.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      <ScrollReveal>
        <div className="glow-card rounded-3xl p-6 sm:p-8 bg-[#15171c]/80 backdrop-blur-md border border-brand-card-border shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldCheck className="h-20 w-20 text-brand-cyan" />
          </div>

          <div className="text-center mb-8">
            <span className="text-xs font-bold font-mono tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 px-3.5 py-1.5 rounded-full border border-brand-cyan/20">
              Contractor Login
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-4">
              Access Control Portal
            </h1>
            <p className="text-gray-400 text-xs mt-2">
              Decrypt contractor security key to enter dashboard telemetry
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex gap-3 text-red-200 text-xs items-start mb-6">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
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
              <div className="flex justify-between items-center">
                <label className="text-2xs font-semibold text-gray-300 uppercase tracking-wider">
                  Security Passkey (Password)
                </label>
                <a
                  href="/change-password"
                  className="text-3xs text-brand-cyan hover:underline font-mono"
                >
                  Reset Key?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark/50 border border-brand-card-border rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all font-mono"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              type="submit"
              className="w-full rounded-xl py-3.5 font-bold text-white text-xs shadow-md bg-gradient-to-r from-brand-purple to-brand-indigo hover:shadow-brand-purple/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2 font-mono uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  Authenticating...
                </>
              ) : (
                <>
                  Decrypt Access
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-brand-card-border/50">
            <p className="text-3xs text-gray-500 font-mono">
              Not onboarding yet? <a href="/register" className="text-brand-cyan hover:underline">Register & Pay Onboard Fee</a>
            </p>
          </div>

        </div>
      </ScrollReveal>
    </div>
  );
}
