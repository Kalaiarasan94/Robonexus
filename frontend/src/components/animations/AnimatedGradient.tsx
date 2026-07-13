"use client";

import { motion } from "framer-motion";

export default function AnimatedGradient() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-brand-dark">
      {/* Dark mesh gradient background */}
      <div className="absolute inset-0 bg-[#0b0b0f]" />
      
      {/* Animated blob 1: Muted Blue glow */}
      <motion.div
        animate={{
          x: ["-10%", "15%", "-5%"],
          y: ["-5%", "15%", "5%"],
          scale: [1, 1.15, 0.95],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute -top-[15%] -left-[5%] h-[60vw] w-[60vw] rounded-full bg-brand-purple/5 blur-[120px] mix-blend-screen"
      />

      {/* Animated blob 2: Muted Tesla Gray glow */}
      <motion.div
        animate={{
          x: ["15%", "-15%", "5%"],
          y: ["15%", "-5%", "-15%"],
          scale: [0.95, 1.1, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute -bottom-[15%] -right-[5%] h-[70vw] w-[70vw] rounded-full bg-brand-violet/5 blur-[130px] mix-blend-screen"
      />

      {/* Animated blob 3: Very faint deep blue glow */}
      <motion.div
        animate={{
          x: ["-10%", "10%", "0%"],
          y: ["10%", "-10%", "0%"],
          scale: [0.9, 1.05, 0.95],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/3 h-[50vw] w-[50vw] rounded-full bg-brand-indigo/3 blur-[140px] mix-blend-screen"
      />

      {/* Subtle White highlight accent */}
      <div className="absolute top-[10%] right-[15%] h-[25vw] w-[25vw] rounded-full bg-brand-cyan/2 blur-[90px]" />
    </div>
  );
}

