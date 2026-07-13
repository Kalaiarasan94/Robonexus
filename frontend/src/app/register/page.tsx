"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
const framerMotion = motion;
const FramerAnimatePresence = AnimatePresence;
import Image from "next/image";
import { 
  ShieldCheck, 
  CheckCircle,
  ArrowRight,
  Lock,
  X,
  AlertCircle,
  Upload,
  User,
  Phone,
  MapPin,
  DollarSign,
  Building,
  CreditCard,
  Hash
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function Register() {
  // Step tracker: 1 = Registration details, 2 = Payment receipt upload, 3 = Success Credentials
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
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
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Successful response details
  const [registerId, setRegisterId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [tempCredentials, setTempCredentials] = useState({ username: "", password: "" });
  
  const [showTermsModal, setShowTermsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    // Clear error
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

  // Drag & drop payment screenshot handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setSubmitError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/") || file.type === "application/pdf") {
        setScreenshot(file);
        setScreenshotPreview(URL.createObjectURL(file));
        setSubmitError(null);
      } else {
        setSubmitError("Please upload an image file (PNG, JPG, WEBP) or a PDF.");
      }
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Submit complete registration and order details together
  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!screenshot) {
      setSubmitError("Please upload your payment receipt screenshot to complete onboarding.");
      return;
    }

    setIsSubmitting(true);

    const formDataObj = new FormData();
    formDataObj.append("fullName", formData.fullName);
    formDataObj.append("email", formData.email);
    formDataObj.append("phone", formData.phone);
    formDataObj.append("address", formData.address);
    formDataObj.append("bankName", formData.bankName);
    formDataObj.append("accountNumber", formData.accountNumber);
    formDataObj.append("ifscCode", formData.ifscCode);
    formDataObj.append("payment_screenshot", screenshot);

    try {
      const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend").replace(/\/$/, "");
      const fullUrl = `${apiBaseUrl}/register.php`;
      console.log("Attempting to fetch from:", fullUrl);
      
      const response = await fetch(fullUrl, {
        method: "POST",
        body: formDataObj,
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setRegisterId(data.registerId);
        setOrderId(data.orderId);
        setTempCredentials({
          username: data.credentials.username,
          password: data.credentials.password
        });
        setStep(3);
      } else {
        setSubmitError(data.message || "Failed to submit onboarding payment. Please verify details.");
      }
    } catch (err) {
      console.error("Connection error to PHP API:", err);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
      setSubmitError(`Failed to connect to registration server at ${apiBaseUrl}. Please verify that XAMPP Apache is running and the backend folder exists.`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                      Onboarding and activation requires a combined hardware co-processor setup and administrative license fee: Onboarding Activation Fee (₹300.00) + Nexus-Core Model-X Hardware Device (₹500.00) = Total payable amount is ₹800.00. Account credentials will be issued upon verifying receipt screenshot submission in Step 2.
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

            {/* STEP 2: Payment Receipt Uploader */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleOnboardingSubmit} className="flex flex-col gap-6 relative z-10 max-w-2xl mx-auto">
                  <div className="text-center">
                    <h3 className="text-sm font-bold font-mono text-brand-cyan uppercase tracking-wider mb-2">
                      Secure Billing checkout & Setup
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Scan the QR code to transfer ₹800.00 for onboarding setup, then upload the receipt screenshot.
                    </p>
                  </div>

                  {/* Price breakdown details */}
                  <div className="bg-[#15171c] border border-brand-card-border p-5 rounded-2xl">
                    <h4 className="text-2xs font-mono font-bold text-white uppercase border-b border-brand-card-border/50 pb-2 mb-3">
                      Order Summary details
                    </h4>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-400">Onboarding & Telemetry Activation Fee</span>
                      <span className="text-white font-mono">₹299.00</span>
                    </div>
                    <div className="flex justify-between text-xs py-1">
                      <span className="text-gray-400">ABS+ Head Mount Unit</span>
                      <span className="text-white font-mono">₹400.00</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-t border-brand-card-border/50 mt-2 font-bold">
                      <span className="text-brand-cyan">Total Amount Payable</span>
                      <span className="text-brand-cyan font-mono">₹699.00</span>
                    </div>
                  </div>

                  {/* QR Code Scan */}
                  <div className="flex justify-center items-center py-4 bg-brand-dark/60 rounded-2xl border border-brand-card-border">
                    <div className="relative w-44 h-44 rounded-xl overflow-hidden bg-white p-2">
                      <Image
                        src="/qr_code_payment.png"
                        alt="RoboNexus Payment QR"
                        width={176}
                        height={176}
                        className="object-contain"
                      />
                    </div>
                  </div>

                  {/* File Uploader */}
                  <div className="flex flex-col gap-2">
                    <label className="text-2xs font-bold font-mono text-gray-400 uppercase tracking-wider">
                      Upload Payment screenshot / PDF
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={triggerSelectFile}
                      className="border-2 border-dashed border-brand-card-border hover:border-brand-cyan/60 rounded-2xl p-8 text-center bg-brand-dark/30 hover:bg-brand-dark/50 cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 group"
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                      />
                      
                      <div className="h-11 w-11 rounded-full bg-brand-cyan/10 flex items-center justify-center border border-brand-cyan/20 group-hover:scale-105 transition-transform text-brand-cyan">
                        <Upload className="h-5 w-5" />
                      </div>

                      {screenshot ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-xs font-semibold text-white font-mono line-clamp-1">
                            {screenshot.name}
                          </span>
                          <span className="text-3xs text-gray-500 font-mono">
                            {round(screenshot.size / 1024, 1)} KB | Click to Replace
                          </span>
                          {screenshotPreview && screenshot.type.startsWith("image/") && (
                            <div className="relative h-20 w-32 rounded-lg overflow-hidden border border-brand-card-border mt-2 bg-brand-dark">
                              <Image src={screenshotPreview} alt="Preview" fill className="object-contain" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-white block">
                            Drag and Drop screenshot here
                          </span>
                          <span className="text-2xs text-gray-400 block mt-1 font-mono">
                            or click to browse local storage (PNG, JPG, PDF up to 10MB)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Status Alerts */}
                  {submitError && (
                    <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-xl flex gap-3 text-red-200 text-xs items-start">
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Navigation and Submit Buttons */}
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
                      type="submit"
                      className="w-2/3 relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo py-3.5 font-bold text-white shadow-lg cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                          Logging Onboarding Payment...
                        </>
                      ) : (
                        <>
                          Submit & Complete Onboarding
                          <CheckCircle className="h-4.5 w-4.5" />
                        </>
                      )}
                    </framerMotion.button>
                  </div>

                </form>
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
                  Thank you! Your payment screenshot has been uploaded. Your profile credentials have been successfully provisioned. We have also sent a confirmation credentials copy to your registered email address.
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

// Inline round helper
function round(value: number, precision: number) {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}
