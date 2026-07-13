"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RevealMaskProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function RevealMask({
  children,
  className = "",
  delay = 0,
}: RevealMaskProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ y: "100%" }}
        whileInView={{ y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.8,
          delay,
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number], // Professional cubic-bezier
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
