"use client";

import { motion } from "framer-motion";
import { Cpu, Database, ShieldCheck, Sparkles } from "lucide-react";

export default function FloatingElements() {
  const elements = [
    { Icon: Cpu, color: "text-brand-purple/20", top: "15%", left: "10%", size: 40, duration: 25 },
    { Icon: Database, color: "text-brand-violet/20", top: "65%", left: "5%", size: 30, duration: 30 },
    { Icon: ShieldCheck, color: "text-brand-purple/20", top: "25%", left: "85%", size: 35, duration: 28 },
    { Icon: Sparkles, color: "text-brand-cyan/20", top: "75%", left: "90%", size: 25, duration: 22 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {elements.map((el, idx) => (
        <motion.div
          key={idx}
          className={`absolute ${el.color}`}
          initial={{ x: 0, y: 0, rotate: 0 }}
          animate={{
            x: [0, 20, -20, 0],
            y: [0, -30, 20, 0],
            rotate: [0, 90, 180, 360],
          }}
          transition={{
            duration: el.duration,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            top: el.top,
            left: el.left,
          }}
        >
          <el.Icon size={el.size} />
        </motion.div>
      ))}
    </div>
  );
}
