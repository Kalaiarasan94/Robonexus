"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Training", href: "/training" },
    { name: "Industries", href: "/industries" },
    { name: "Product", href: "/products" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-brand-dark/80 backdrop-blur-md border-b border-brand-card-border py-1" 
          : "bg-transparent py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex-1 flex justify-start">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="RoboNexus Logo" 
                width={80} 
                height={80} 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white transition-all duration-300">
              Robo<span className="text-[#2d7eff]">Nexus</span>
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`relative text-[14px] font-semibold tracking-wide transition-all duration-200 hover:text-white ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-brand-cyan"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:flex flex-1 justify-end items-center">
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo p-[1.5px] font-semibold text-white shadow-lg transition-all hover:shadow-brand-purple/20"
            >
              <span className="flex items-center gap-2 rounded-[10px] bg-brand-dark px-4 py-1.5 text-sm transition-all hover:bg-transparent">
                Register Now
                <ArrowRight className="h-4 w-4" />
              </span>
            </motion.button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-brand-card-border bg-brand-dark/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-lg font-medium py-1 transition-colors border-l-2 pl-3 ${
                      isActive 
                        ? "text-brand-cyan border-brand-cyan" 
                        : "text-gray-400 border-transparent hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Link 
                href="/register" 
                onClick={() => setIsOpen(false)}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-violet py-3 font-semibold text-white shadow-lg"
              >
                Register Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
