"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle,
  X,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "telemetry",
    message: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (formData.name && formData.email && formData.message) {
      setIsSubmitting(true);
      const formDataObj = new FormData();
      formDataObj.append("name", formData.name);
      formDataObj.append("email", formData.email);
      formDataObj.append("subject", formData.subject);
      formDataObj.append("message", formData.message);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/robonexus/backend";
        const response = await fetch(`${apiUrl}/submit_contact.php`, {
          method: "POST",
          body: formDataObj,
        });

        const data = await response.json();

        if (response.ok && data.status === "success") {
          setIsSubmitted(true);
          setShowPopup(true);
        } else {
          setSubmitError(data.message || "Failed to transmit message. Please try again.");
        }
      } catch (err) {
        console.error("Connection error to PHP API:", err);
        setSubmitError("Failed to connect to backend server. Please verify that XAMPP Apache is running at http://localhost.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
      {/* Intro */}
      <section className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
          Get in Touch
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight">
          Connect with <span className="text-gradient">RoboNexus</span>
        </h1>
        <p className="text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
          Have questions about our data pipeline, enterprise integrations, or contractor training? Send a request to our operations center.
        </p>
      </section>

      {/* Grid: Form & Info */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Info Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ScrollReveal direction="left">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Contact Specifications
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm sm:text-base mt-2">
              For client partnerships or dataset integrations, contact our systems architects directly. General inquiries are processed within one business day.
            </p>
          </ScrollReveal>

          <div className="flex flex-col gap-4">
            {[
              {
                icon: <Mail className="h-5 w-5 text-brand-purple" />,
                title: "Electronic Mail",
                value: "info@robonexus.com",
                href: "mailto:info@robonexus.com"
              },
              {
                icon: <Phone className="h-5 w-5 text-brand-violet" />,
                title: "Voice Direct",
                value: "+91 8248106308",
                href: "tel:+918248106308"
              },
              {
                icon: <MapPin className="h-5 w-5 text-brand-purple" />,
                title: "Headquarters (Gurgaon)",
                value: "Gurgaon, Haryana, India",
                href: "https://maps.google.com/?q=Gurgaon,+Haryana,+India"
              },
              {
                icon: <MapPin className="h-5 w-5 text-brand-violet" />,
                title: "Branch (Tamil Nadu)",
                value: "Tamil Nadu, India",
                href: "https://maps.google.com/?q=Tamil+Nadu,+India"
              }
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.08}>
                <a
                  href={item.href}
                  className="glow-card p-4.5 rounded-2xl flex items-start gap-4 hover:-translate-y-0.5 transition-all"
                >
                  <div className="p-2.5 bg-brand-dark rounded-xl border border-brand-card-border">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-2xs font-bold font-mono text-gray-500 uppercase tracking-wider">
                      {item.title}
                    </h4>
                    <p className="text-sm font-semibold text-white mt-1 font-mono">
                      {item.value}
                    </p>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Form Column */}
        <div className="lg:col-span-7">
          <ScrollReveal direction="right">
            <div className="glow-card p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <CheckCircle className="h-10 w-10 text-brand-violet mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-white">Inquiry Transmitted</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{formData.name}</strong>. Your ticket regarding <strong>{formData.subject}</strong> has been logged in our secure CRM. Our operators will respond shortly.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-brand-dark border border-brand-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Your Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-brand-dark border border-brand-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-colors"
                      placeholder="jane@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Inquiry Category
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full bg-brand-dark border border-brand-card-border rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-colors"
                    >
                      <option value="telemetry">Robotics Telemetry Integration</option>
                      <option value="rlhf">RLHF Custom Models</option>
                      <option value="contractor">Contractor System Support</option>
                      <option value="billing">Enterprise Accounts & Billing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-2xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                      Message details
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full bg-brand-dark border border-brand-card-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-purple focus:border-brand-purple transition-colors resize-none font-sans"
                      placeholder="Write your request specifications..."
                    />
                  </div>

                  {submitError && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-950/40 border border-red-900/50 p-3.5 rounded-xl text-xs font-mono">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo py-3 font-bold text-white shadow-lg cursor-pointer hover:shadow-brand-purple/20 transition-all text-sm ${isSubmitting ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isSubmitting ? "Transmitting..." : "Transmit Message"}
                    <Send className="h-4 w-4" />
                  </motion.button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Success Popup Modal */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-brand-dark/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glow-card rounded-3xl w-full max-w-md p-8 relative shadow-2xl bg-[#15171c] text-center border border-brand-card-border"
            >
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-brand-card-border/60 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-purple/20 border border-brand-purple/40 mb-5 text-brand-violet">
                <CheckCircle className="h-8 w-8" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                Message Sent Successfully
              </h3>
              
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Thanks for registering, order the product to grab the opportunity.
              </p>

              <a href="/products" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo py-3.5 font-bold text-white shadow-lg hover:shadow-brand-purple/20 transition-all text-sm">
                View Product
                <ArrowRight className="h-4.5 w-4.5" />
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

