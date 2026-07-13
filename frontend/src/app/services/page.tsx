"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Gamepad2, 
  BrainCircuit, 
  Eye, 
  Activity, 
  Wrench, 
  FileCheck2, 
  Cpu
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";
import TextReveal from "@/components/animations/TextReveal";
import StaggerReveal from "@/components/animations/StaggerReveal";
import RevealMask from "@/components/animations/RevealMask";

export default function Services() {
  const coreServices = [
    {
      icon: <BrainCircuit className="h-6 w-6 text-brand-purple" />,
      title: "Humanoid Kinematics Telemetry",
      desc: "Detailed physical movement recording. We track high-density spatial coordinate feeds (joints, velocity, force, and contact sensors) captured during real human workflow exercises to map precise mechanical instructions.",
      features: ["500Hz joint-angle recording", "Tactile force feedback loops", "Multi-modal vision alignment", "Direct compatibility with ROS / PyBullet"]
    },
    {
      icon: <Eye className="h-6 w-6 text-brand-violet" />,
      title: "Active Computer Vision Alignment",
      desc: "Providing high-fidelity bounding box annotations, spatial depth mapping, dynamic object segmentation, and keyframe tracking sequences designed specifically for autonomous navigation algorithms.",
      features: ["3D lidar point-cloud mapping", "Sub-pixel semantic segmentation", "Dynamic spatial vectoring", "Synthesized noise filters"]
    },
    {
      icon: <Gamepad2 className="h-6 w-6 text-brand-purple" />,
      title: "RLHF Context Evaluation",
      desc: "Robust human feedback datasets designed to align large-scale reasoning models. We simulate logic puzzles, dialogue flows, safety guardrails, and coding evaluation tasks with verified human experts.",
      features: ["Verified expert reviewer network", "PII sanitization protocols", "Custom comparative preference trees", "Prompt-response drift control"]
    },
    {
      icon: <Wrench className="h-6 w-6 text-brand-violet" />,
      title: "Tactile Task Simulation",
      desc: "Edge-case physics simulation and recording. Our specialists run tasks involving delicate items, compliance modeling, collision recovery procedures, and general mechanical repair instructions.",
      features: ["Deformable object manipulation", "Tool usage telemetry", "Failure-recovery recordings", "High-frequency vibration maps"]
    },
    {
      icon: <Activity className="h-6 w-6 text-brand-purple" />,
      title: "Interactive Cognitive Mapping",
      desc: "Logging decisions under pressure. We analyze gaze coordinates, decision latency, and reasoning pathways during high-stress telemetry, teaching AI critical prioritization.",
      features: ["Gaze tracking heatmaps", "Decision-tree latency logs", "Speech-to-intent sync", "Confidence scoring curves"]
    },
    {
      icon: <FileCheck2 className="h-6 w-6 text-brand-violet" />,
      title: "Dataset Sanitization & Audit",
      desc: "Cleaning and refining existing datasets. We check for demographic bias, repetitive noise, corruption issues, and physical inconsistencies that skew model convergence.",
      features: ["Outlier detection algorithms", "Data-distribution matching", "PII scrub verification", "JSON / Parquet formats supported"]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
      {/* Intro */}
      <section className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
          Capabilities
        </span>
        <TextReveal 
          text="High-Fidelity AI Training Services" 
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight justify-center"
        />
        <p className="text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
          We construct and scale custom telemetry arrays, giving your AI models the exact physical and logical grounding they require to perform flawlessly.
        </p>
      </section>

      {/* Main Services Grid */}
      <StaggerReveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {coreServices.map((service, idx) => (
          <div key={idx} className="glow-card p-6 rounded-3xl h-full flex flex-col justify-between group">
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-brand-dark rounded-xl w-fit border border-brand-card-border group-hover:border-brand-purple/40 transition-colors">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {service.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {service.desc}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-brand-card-border/60">
              <h4 className="text-2xs font-bold font-mono uppercase text-brand-violet tracking-wider mb-2">
                Technical Scope:
              </h4>
              <ul className="flex flex-col gap-1.5">
                {service.features.map((f, i) => (
                  <li key={i} className="text-2xs text-gray-300 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-purple shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </StaggerReveal>

      {/* Large Featured Callout */}
      <section className="relative rounded-3xl overflow-hidden border border-brand-card-border bg-gradient-to-br from-brand-card to-brand-dark p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-brand-purple/5 blur-[100px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
              Custom Requirements
            </span>
            <TextReveal 
              text="Need Custom Sensors or Private Infrastructure?" 
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
            />
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              We design specialized client packages that deploy proprietary hardware to our verified contractor centers worldwide. This enables custom tactile, thermal, auditory, and stereoscopic telemetry capture under absolute confidentiality.
            </p>
            <div className="flex flex-wrap gap-3 mt-1">
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo px-6 py-2.5 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-brand-purple/20"
                >
                  Consult an Architect
                  </motion.button>
              </Link>
              <Link href="/register" className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors px-3 py-2.5">
                Register as Contractor <Cpu className="h-4 w-4 text-brand-purple" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative h-56 w-full rounded-2xl overflow-hidden border border-brand-card-border">
            <RevealMask className="h-full w-full">
              <Image
                src="/hero_ai.png"
                alt="Advanced robotic spatial mesh modeling"
                fill
                className="object-cover"
              />
            </RevealMask>
          </div>
        </div>
      </section>
    </div>
  );
}
