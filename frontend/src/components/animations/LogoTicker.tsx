"use client";

import { motion } from "framer-motion";

const logos = [
  "SynthKinematics",
  "AutoDrive Systems",
  "NeuralScale AI",
  "RoboLogic",
  "CyberDynamics",
  "OmniFlow AI",
  "SynthKinematics", // Repeat for seamless loop
  "AutoDrive Systems",
  "NeuralScale AI",
  "RoboLogic",
  "CyberDynamics",
  "OmniFlow AI",
];

export default function LogoTicker() {
  return (
    <div className="w-full py-10 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-brand-dark to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-brand-dark to-transparent z-10" />
      
      <motion.div
        className="flex whitespace-nowrap gap-16 items-center"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {logos.map((logo, idx) => (
          <span
            key={idx}
            className="text-lg md:text-xl font-bold text-gray-500/50 uppercase tracking-widest hover:text-brand-purple/50 transition-colors cursor-default select-none"
          >
            {logo}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
