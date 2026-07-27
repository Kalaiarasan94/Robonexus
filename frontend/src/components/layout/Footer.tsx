"use client";

import Link from "next/link";
import Image from "next/image";
import { Send, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0b0b0f] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-card-border/60 to-transparent" />
      {/* Decorative radial gradients for footer */}
      <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-brand-cyan/5 blur-[80px]" />
      <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-brand-violet/5 blur-[80px]" />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-12 w-12 relative overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="RoboNexus Logo" 
                  fill 
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Robo<span className="text-[#2d7eff]">Nexus</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mt-2">
              Real Humans. Real Actions. Real Impact on AI. Bridging the gap between human intelligence and machine learning through high-fidelity data operations.
            </p>
            <span className="text-xs text-gray-500 font-mono">
              RoboNexus Inc. • Founded in 2025
            </span>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">
              Navigation
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { name: "Home", href: "/" },
                { name: "About Us", href: "/about" },
                { name: "Services", href: "/services" },
                { name: "AI Training", href: "/training" },
                { name: "Industries", href: "/industries" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-block py-2 sm:py-0.5 text-sm text-gray-400 hover:text-brand-cyan transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">
              Contact Info
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="h-5 w-5 text-brand-cyan shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-300">Head Office:</span>
                  <a 
                    href="https://maps.google.com/?q=Gurgaon,+Haryana,+India" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block py-1.5 sm:py-0 hover:text-brand-cyan transition-colors"
                  >
                    Gurgaon, Haryana, India
                  </a>
                  <span className="font-semibold text-gray-300 mt-1">Branch:</span>
                  <a 
                    href="https://maps.google.com/?q=Tamil+Nadu,+India" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block py-1.5 sm:py-0 hover:text-brand-cyan transition-colors"
                  >
                    Tamil Nadu, India
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="h-5 w-5 text-brand-cyan shrink-0" />
                <a href="mailto:info@robonexus.com" className="inline-block py-1.5 sm:py-0 hover:text-brand-cyan transition-colors">
                  info@robonexus.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="h-5 w-5 text-brand-cyan shrink-0" />
                <a href="tel:+918248106308" className="inline-block py-1.5 sm:py-0 hover:text-brand-cyan transition-colors">
                  +91 8248106308
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / CTA */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">
              Stay Updated
            </h4>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Subscribe to receive insights on AI scaling, dataset training, and robotics.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email address"
                required
                className="w-full bg-[#15171c] border border-brand-card-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-cyan transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                className="flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo text-white hover:shadow-lg hover:shadow-brand-purple/20 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-brand-card-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            &copy; {currentYear} RoboNexus. All rights reserved. Built for Next-Gen Artificial Intelligence.
          </p>
          <div className="flex gap-6">
            <Link href="/register" className="inline-block py-2 sm:py-0 text-xs text-gray-500 hover:text-brand-cyan transition-colors">
              Contractor Onboarding
            </Link>
            <Link href="/contact" className="inline-block py-2 sm:py-0 text-xs text-gray-500 hover:text-brand-cyan transition-colors">
              Support Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
