"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
const framerMotion = motion;
const FramerAnimatePresence = AnimatePresence;
import {
  CheckCircle,
  ArrowRight,
  Lock,
  X,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Hash,
  ShieldCheck,
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

// Razorpay gateway is hosted + verified on the aimstorm.in domain. RoboNexus
// hands the user off to it, then the user is redirected back here on success.
const PAYMENT_URL =
  process.env.NEXT_PUBLIC_PAYMENT_URL || "https://aimstorm.in/payment.php";
const ONBOARDING_AMOUNT = 800; // ₹300 onboarding + ₹500 hardware
const PENDING_KEY = "robonexus_pending_registration";

interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  consent: boolean;
}

export default function Register() {
  // Step tracker: 1 = Registration details, 2 = Pay, 3 = Success Credentials
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<RegistrationForm>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    consent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Successful response details
  const [registerId, setRegisterId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [tempCredentials, setTempCredentials] = useState({ username: "", password: "" });

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPaidPopup, setShowPaidPopup] = useState(false);

  const validateStep1 = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) tempErrors.fullName = "Full Legal Name is required";

    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email is invalid";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    }

    if (!formData.address.trim()) tempErrors.address = "Complete Delivery Address is required";
    if (!formData.bankName.trim()) tempErrors.bankName = "Bank Name is required";
    if (!formData.accountNumber.trim()) tempErrors.accountNumber = "Account Number is required";
    if (!formData.ifscCode.trim()) tempErrors.ifscCode = "IFSC Code is required";

    if (!formData.consent) {
      tempErrors.consent = "You must agree to the contractor terms and conditions to proceed";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Redirect to the Razorpay gateway hosted on aimstorm.in.
  const handlePayNow = () => {
    setSubmitError(null);
    // Persist the entered details so we can finalize registration when the
    // gateway redirects the user back to /register.
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(formData));

    const returnUrl = `${window.location.origin}/register`;
    const params = new URLSearchParams({
      amount: String(ONBOARDING_AMOUNT),
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      return_url: returnUrl,
    });
    window.location.href = `${PAYMENT_URL}?${params.toString()}`;
  };

  // Finalize onboarding after a verified payment (create account + record payment).
  const finalizeRegistration = useCallback(
    async (
      stored: RegistrationForm,
      rpPaymentId: string,
      rpOrderId: string,
      amount: string
    ) => {
      setIsSubmitting(true);
      setSubmitError(null);

      const body = new FormData();
      body.append("fullName", stored.fullName);
      body.append("email", stored.email);
      body.append("phone", stored.phone);
      body.append("address", stored.address);
      body.append("bankName", stored.bankName);
      body.append("accountNumber", stored.accountNumber);
      body.append("ifscCode", stored.ifscCode);
      body.append("razorpayPaymentId", rpPaymentId);
      body.append("razorpayOrderId", rpOrderId);
      body.append("paymentAmount", amount || String(ONBOARDING_AMOUNT));

      try {
        const apiBaseUrl = (
          process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend"
        ).replace(/\/$/, "");
        const response = await fetch(`${apiBaseUrl}/register.php`, {
          method: "POST",
          body,
        });
        const data = await response.json();

        if (response.ok && data.status === "success") {
          setFormData(stored);
          setRegisterId(data.registerId);
          setPaymentId(data.paymentId || rpPaymentId);
          setTempCredentials({
            username: data.credentials.username,
            password: data.credentials.password,
          });
          setStep(3);
          setShowPaidPopup(true);
        } else {
          setSubmitError(
            data.message || "Payment succeeded but onboarding could not be completed."
          );
          setStep(2);
        }
      } catch {
        setSubmitError(
          "Payment succeeded but we could not reach the onboarding server. Please contact support with your payment ID."
        );
        setStep(2);
      } finally {
        setIsSubmitting(false);
        sessionStorage.removeItem(PENDING_KEY);
      }
    },
    []
  );

  // Detect the redirect back from the aimstorm.in Razorpay gateway.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment_status");
    if (!status) return;

    // Clean the query string so a refresh doesn't re-trigger this.
    window.history.replaceState({}, document.title, window.location.pathname);

    if (status === "success") {
      const rpPaymentId = params.get("razorpay_payment_id") || "";
      const rpOrderId = params.get("razorpay_order_id") || "";
      const amount = params.get("amount") || String(ONBOARDING_AMOUNT);
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (raw && rpPaymentId) {
        try {
          const stored = JSON.parse(raw) as RegistrationForm;
          finalizeRegistration(stored, rpPaymentId, rpOrderId, amount);
        } catch {
          setSubmitError("Could not read your registration details. Please try again.");
          setStep(2);
        }
      } else {
        setSubmitError("Your session expired. Please re-enter your details and pay again.");
        setStep(1);
      }
    } else if (status === "cancelled") {
      setSubmitError("Payment was cancelled. You can retry whenever you're ready.");
      setStep(2);
    } else {
      setSubmitError("Payment could not be completed. Please try again.");
      setStep(2);
    }
  }, [finalizeRegistration]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* HEADER SECTION */}
      <section className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-cyan uppercase bg-brand-cyan/10 px-3.5 py-1.5 rounded-full border border-brand-cyan/20">
          Telemetry Onboarding
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mt-4 leading-tight">
          Contractor Registration & Device Setup
        </h1>
        <p className="text-gray-400 mt-3 text-xs sm:text-sm leading-relaxed">
          Log spatial datasets and earn pay. Complete onboarding registration and secure your Nexus-Core co-processor hardware setup.
        </p>
      </section>

      {/* STEP PROGRESS TRACKER */}
      <div className="flex items-center justify-center gap-2 mb-10 max-w-md mx-auto font-mono text-2xs">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${step >= 1 ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" : "bg-brand-dark/40 text-gray-600 border-brand-card-border"}`}>
          <span className="font-bold">1</span> Details
        </div>
        <div className="h-[1px] w-8 bg-brand-card-border" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${step >= 2 ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" : "bg-brand-dark/40 text-gray-600 border-brand-card-border"}`}>
          <span className="font-bold">2</span> Payment
        </div>
        <div className="h-[1px] w-8 bg-brand-card-border" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${step >= 3 ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40" : "bg-brand-dark/40 text-gray-600 border-brand-card-border"}`}>
          <span className="font-bold">3</span> Credentials
        </div>
      </div>

      <ScrollReveal>
        <div className="glow-card rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden bg-[#15171c]/80 backdrop-blur-md border border-brand-card-border">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Lock className="h-32 w-32 text-brand-purple" />
          </div>

          <FramerAnimatePresence mode="wait">
            {/* STEP 1: Registration Form */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleNextToPayment} className="flex flex-col gap-6 relative z-10">

                  {/* Section 1.1: Contact Details */}
                  <div>
                    <h3 className="text-xs font-bold font-mono text-brand-cyan uppercase tracking-wider mb-4 border-b border-brand-card-border/60 pb-1.5 flex items-center gap-2">
                      <User className="h-4 w-4 text-brand-cyan" />
                      01. Personal Information & Location
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Full Legal Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <User className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="text"
                            required
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.fullName ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.fullName && <p className="text-2xs text-red-400 mt-1">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Email Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="email"
                            required
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.email ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="john@example.com"
                          />
                        </div>
                        {errors.email && <p className="text-2xs text-red-400 mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Phone Number (Access Code Passkey)
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <Phone className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="tel"
                            required
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.phone ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="+1 555 123 4567"
                          />
                        </div>
                        {errors.phone && <p className="text-2xs text-red-400 mt-1">{errors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Complete Delivery Address
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 pt-3 flex items-start text-gray-500">
                            <MapPin className="h-3.5 w-3.5" />
                          </span>
                          <textarea
                            required
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={1}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors resize-none ${
                              errors.address ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="Street Name, Apt, City, State, Country"
                          />
                        </div>
                        {errors.address && <p className="text-2xs text-red-400 mt-1">{errors.address}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section 1.2: Bank Details */}
                  <div>
                    <h3 className="text-xs font-bold font-mono text-brand-cyan uppercase tracking-wider mb-4 border-b border-brand-card-border/60 pb-1.5 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-cyan" />
                      02. Compensation Disbursement Bank Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Bank Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <Building className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="text"
                            required
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.bankName ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="Silicon Valley Bank"
                          />
                        </div>
                        {errors.bankName && <p className="text-2xs text-red-400 mt-1">{errors.bankName}</p>}
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          Account Number
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <CreditCard className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="text"
                            required
                            name="accountNumber"
                            value={formData.accountNumber}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.accountNumber ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="01234567890"
                          />
                        </div>
                        {errors.accountNumber && <p className="text-2xs text-red-400 mt-1">{errors.accountNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                          IFSC / Routing Code
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                            <Hash className="h-3.5 w-3.5" />
                          </span>
                          <input
                            type="text"
                            required
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleChange}
                            className={`w-full bg-brand-dark/50 border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan transition-colors ${
                              errors.ifscCode ? "border-red-500/85" : "border-brand-card-border"
                            }`}
                            placeholder="IFSC0001234"
                          />
                        </div>
                        {errors.ifscCode && <p className="text-2xs text-red-400 mt-1">{errors.ifscCode}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Section 1.3: Terms and Consent */}
                  <div className="pt-4 border-t border-brand-card-border/50 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent"
                        name="consent"
                        checked={formData.consent}
                        onChange={handleChange}
                        className="mt-0.5 h-4.5 w-4.5 bg-brand-dark/50 border-brand-card-border rounded border-brand-cyan text-brand-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <label htmlFor="consent" className="text-xs text-gray-300 leading-normal cursor-pointer select-none">
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="underline hover:text-white font-medium cursor-pointer bg-transparent border-none p-0 inline text-gray-300 font-mono"
                        >
                          Contractor Service Agreement
                        </button>{" "}
                        and acknowledge the telemetry guidelines.
                      </label>
                    </div>
                    {errors.consent && (
                      <p className="text-2xs text-red-400 font-semibold">{errors.consent}</p>
                    )}

                    {/* Pricing notice in small light letters */}
                    <p className="text-3xs text-gray-500 leading-relaxed font-mono mt-1">
                      Onboarding and activation requires a combined hardware co-processor setup and administrative license fee: Onboarding Activation Fee (₹300.00) + Nexus-Core Model-X Hardware Device (₹500.00) = Total payable amount is ₹800.00. Account credentials will be issued upon successful Razorpay payment in Step 2.
                    </p>
                  </div>

                  {/* Proceed Button */}
                  <div className="mt-2">
                    <framerMotion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      className="w-full relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo py-3.5 font-bold text-white shadow-lg cursor-pointer transition-all"
                    >
                      Proceed to Onboarding Payment
                      <ArrowRight className="h-4.5 w-4.5" />
                    </framerMotion.button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* STEP 2: Razorpay Payment Hand-off */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col gap-6 relative z-10 max-w-2xl mx-auto">
                  <div className="text-center">
                    <h3 className="text-sm font-bold font-mono text-brand-cyan uppercase tracking-wider mb-2">
                      Secure Billing Checkout
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      You&apos;ll be redirected to our secure Razorpay gateway on
                      <span className="text-white font-semibold"> aimstorm.in </span>
                      to pay ₹800.00. After payment you&apos;ll return here automatically.
                    </p>
                  </div>

                  {/* Price breakdown details */}
                  <div className="bg-[#15171c] border border-brand-card-border p-5 rounded-2xl">
                    <h4 className="text-2xs font-mono font-bold text-white uppercase border-b border-brand-card-border/50 pb-2 mb-3">
                      Order Summary details
                    </h4>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-400">Onboarding &amp; Telemetry Activation Fee</span>
                      <span className="text-white font-mono">₹300.00</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-400">Nexus-Core Model-X Hardware Device</span>
                      <span className="text-white font-mono">₹500.00</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-brand-card-border/50 mt-2 font-bold">
                      <span className="text-brand-cyan">Total Amount Payable</span>
                      <span className="text-brand-cyan font-mono">₹800.00</span>
                    </div>
                  </div>

                  {/* Razorpay trust panel */}
                  <div className="flex items-center gap-3 bg-brand-dark/40 border border-brand-card-border/50 rounded-2xl p-4">
                    <div className="h-10 w-10 rounded-full bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/25 text-brand-cyan shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-2xs text-gray-400 leading-relaxed">
                      Payments are processed by <span className="text-white font-semibold">Razorpay</span> on
                      the verified aimstorm.in domain. RoboNexus never sees your card or UPI details.
                    </p>
                  </div>

                  {/* Submission Status Alerts */}
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex gap-3 text-red-200 text-xs items-start">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {isSubmitting && (
                    <div className="bg-brand-cyan/10 border border-brand-cyan/25 p-4 rounded-xl flex gap-3 text-brand-cyan text-xs items-center">
                      <span className="h-4 w-4 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin shrink-0" />
                      Verifying payment and provisioning your account...
                    </div>
                  )}

                  {/* Navigation and Pay Buttons */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setStep(1)}
                      className="w-1/3 rounded-xl border border-brand-card-border bg-brand-dark/40 py-3 text-xs font-bold text-white hover:bg-brand-dark/60 transition-all cursor-pointer disabled:opacity-40"
                    >
                      Back
                    </button>
                    <framerMotion.button
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handlePayNow}
                      className="w-2/3 relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3.5 font-bold text-white shadow-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Pay ₹800.00 with Razorpay
                      <ArrowRight className="h-4.5 w-4.5" />
                    </framerMotion.button>
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 3: Onboarding Success and Credentials Issued */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center max-w-xl mx-auto p-4"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-cyan/20 border border-brand-cyan/45 mb-6 text-brand-cyan">
                  <CheckCircle className="h-8 w-8" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Onboarding Credentials Issued
                </h2>

                <p className="text-gray-300 mt-3 text-xs sm:text-sm leading-relaxed">
                  Thank you! Your Razorpay payment was successful. Your profile credentials have been successfully provisioned. We have also sent a confirmation credentials copy to your registered email address.
                </p>

                {/* Secure Credential Display Box */}
                <div className="bg-[#15171c] rounded-2xl border border-brand-cyan/25 p-6 my-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-brand-cyan/10 rounded-bl-xl border-l border-b border-brand-cyan/20 text-3xs font-bold font-mono text-brand-cyan uppercase tracking-widest">
                    Telemetry Credentials
                  </div>

                  <div className="flex justify-between items-center border-b border-brand-card-border pb-3 mb-4 mt-2">
                    <span className="text-3xs font-mono text-gray-500 font-semibold uppercase">Profile Queue Ref</span>
                    <span className="text-xs font-mono font-bold text-brand-cyan">{registerId}</span>
                  </div>

                  {paymentId && (
                    <div className="flex justify-between items-center border-b border-brand-card-border pb-3 mb-4">
                      <span className="text-3xs font-mono text-gray-500 font-semibold uppercase">Payment ID</span>
                      <span className="text-xs font-mono font-bold text-brand-cyan">{paymentId}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 font-mono text-xs">
                    <div className="flex justify-between items-center bg-[#15171c] p-2.5 rounded-xl border border-brand-card-border/50">
                      <span className="text-gray-500 text-2xs">USERNAME:</span>
                      <span className="text-white font-bold">{tempCredentials.username}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#15171c] p-2.5 rounded-xl border border-brand-card-border/50">
                      <span className="text-gray-500 text-2xs">PASSWORD:</span>
                      <span className="text-white font-bold">{tempCredentials.password}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-card-border/60 text-center">
                    <p className="text-3xs text-gray-500 italic">
                      Note: Your initial password is set to your registered phone number. You can change this anytime from your dashboard.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      window.location.href = "/login";
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-indigo py-4 font-bold text-white shadow-lg hover:shadow-brand-cyan/20 transition-all text-sm font-sans cursor-pointer"
                  >
                    Go to Login Portal
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </FramerAnimatePresence>
        </div>
      </ScrollReveal>

      {/* PAYMENT SUCCESS POPUP */}
      <FramerAnimatePresence>
        {showPaidPopup && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="rounded-2xl w-full max-w-sm p-7 relative shadow-2xl bg-[#15171c] border border-brand-cyan/30 text-center"
            >
              <button
                onClick={() => setShowPaidPopup(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-brand-card-border/60 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-cyan/20 border border-brand-cyan/45 mb-4 text-brand-cyan">
                <CheckCircle className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-extrabold text-white">Payment Successful</h3>
              <p className="text-gray-400 text-xs mt-2 leading-relaxed">
                Your onboarding payment of ₹800.00 has been received and verified.
              </p>

              <div className="bg-brand-dark/50 border border-brand-card-border/60 rounded-xl p-3 mt-5 text-left">
                <span className="text-3xs font-mono text-gray-500 uppercase tracking-widest">Payment ID</span>
                <p className="text-sm font-mono font-bold text-brand-cyan break-all mt-0.5">{paymentId}</p>
              </div>

              <button
                onClick={() => setShowPaidPopup(false)}
                className="w-full mt-6 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple py-3 text-sm font-bold text-white cursor-pointer transition-all"
              >
                View My Credentials
              </button>
            </motion.div>
          </div>
        )}
      </FramerAnimatePresence>

      {/* Terms and Conditions Overlay Modal */}
      <FramerAnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#15171c] backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="glow-card rounded-2xl w-full max-w-xl p-6 relative shadow-2xl bg-[#15171c] border border-brand-card-border"
            >
              <button
                onClick={() => setShowTermsModal(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-brand-card-border/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-base font-bold text-white mb-3">
                Contractor Terms & Conditions
              </h3>

              <div className="max-h-64 overflow-y-auto text-xs text-gray-400 leading-relaxed space-y-3 pr-2 scrollbar-thin scrollbar-thumb-brand-purple">
                <p className="font-bold text-white font-mono">ROBONEXUS CONTRACTOR SERVICE AGREEMENT</p>
                <p className="text-3xs text-gray-500">Last Updated: June 30, 2026</p>

                <p>
                  This Service Agreement (&quot;Agreement&quot;) is made effective upon registration between the contracting agent (&quot;Contractor&quot;) and RoboNexus Inc. (&quot;Company&quot;).
                </p>

                <h4 className="font-semibold text-white mt-2">Terms & Conditions</h4>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>The ₹800 paid is a combined Registration & Product Fee and is non-refundable under any circumstances.</li>
                  <li>Your product will be delivered within 7 working days.</li>
                  <li>Your Worker ID is unique and must not be shared with anyone.</li>
                  <li>All information, videos, and documents submitted must be accurate and original.</li>
                  <li>Any fake information, duplicate accounts, fraudulent activity, or policy violations may result in immediate account termination without any refund.</li>
                  <li>Project availability depends on client requirements and business needs. The company does not guarantee continuous or permanent work.</li>
                  <li>The company reserves the right to suspend, modify, replace, or discontinue any project at any time without prior notice.</li>
                  <li>If a project is cancelled, discontinued, suspended, or terminated before its scheduled completion for any reason, the project will be considered closed. In such cases, no project payment will be payable for that project, regardless of the amount of work completed or its approval status.</li>
                  <li>The company shall not be liable for any loss of expected earnings or future opportunities resulting from the cancellation, suspension, or discontinuation of any project.</li>
                  <li>By registering and participating in our projects, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.</li>
                </ol>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-5 py-2 text-xs font-semibold bg-brand-cyan hover:bg-brand-cyan/85 text-white rounded-xl cursor-pointer transition-colors"
                >
                  Close Agreement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </FramerAnimatePresence>
    </div>
  );
}
