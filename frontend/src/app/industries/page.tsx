"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Building2, 
  Activity, 
  Truck, 
  ShoppingBag, 
  Server, 
  Cpu, 
  ArrowRight 
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function Industries() {
  const industries = [
    {
      title: "Humanoid Robotics & Kinematics",
      icon: <Cpu className="h-5 w-5 text-brand-purple" />,
      desc: "Providing high-fidelity joint torque, micro-manipulation telemetry, tactile touch profiles, and hand-eye coordination datasets that enable humanoid machines to carry out physical tasks in dynamic settings.",
      image: "/robotics_arm.png",
      tag: "Robotics"
    },
    {
      title: "Healthcare Automation & Surgery",
      icon: <Activity className="h-5 w-5 text-brand-violet" />,
      desc: "Delivering precise telemetry for surgical arm manipulation, micro-surgical instrument alignment, human-in-the-loop diagnostic review logs, and high-frequency tactile medical feedback loops.",
      image: "/training_ai.png",
      tag: "Medical Tech"
    },
    {
      title: "Autonomous Vehicles & Logistical Nodes",
      icon: <Truck className="h-5 w-5 text-brand-purple" />,
      desc: "Verifying collision avoidance, spatial mapping, and decision pathways in unstructured warehouse environments. We simulate complex failure recovery workflows to train robust spatial navigation systems.",
      image: "/hero_ai.png",
      tag: "Logistics & AV"
    },
    {
      title: "Advanced Manufacturing & Fab Plants",
      icon: <Building2 className="h-5 w-5 text-brand-violet" />,
      desc: "Optimizing automated assembly loops, visual QA inspections, precision soldering telemetry, and complex item handling under strict timing restrictions.",
      image: "/robotics_arm.png",
      tag: "Industrial Fab"
    },
    {
      title: "E-Commerce Fulfillment & Sorting",
      icon: <ShoppingBag className="h-5 w-5 text-brand-purple" />,
      desc: "Recording item picking, packaging dynamics, multi-modal sensor arrays for variable weight items, and continuous sorting operations to streamline robotic warehousing systems.",
      image: "/training_ai.png",
      tag: "Warehousing"
    },
    {
      title: "Infrastructure Telemetry & Edge Nodes",
      icon: <Server className="h-5 w-5 text-brand-violet" />,
      desc: "Supporting remote equipment manipulation, sensory arrays for deep-sea or high-altitude operations, predictive system logic maintenance logs, and spatial mapping.",
      image: "/hero_ai.png",
      tag: "Edge Telemetry"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
      {/* Intro */}
      <section className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
          Market Sectors
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight">
          Industries Empowered by <span className="text-gradient">RoboNexus Data</span>
        </h1>
        <p className="text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
          From micro-manipulation to industrial-scale automation, we build custom dataset pipelines that unlock real-world capability across diverse markets.
        </p>
      </section>

      {/* Grid of Industrial Tiles */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {industries.map((ind, idx) => (
          <ScrollReveal key={idx} delay={idx * 0.05}>
            <div className="glow-card rounded-2xl overflow-hidden h-full flex flex-col group">
              <div className="relative aspect-video w-full bg-brand-dark/30">
                <Image
                  src={ind.image}
                  alt={ind.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-103"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent" />
                <span className="absolute top-3 right-3 bg-brand-dark/85 backdrop-blur-sm border border-brand-purple/20 px-2.5 py-0.5 rounded-full text-2xs font-mono text-brand-violet">
                  {ind.tag}
                </span>
              </div>

              <div className="p-5 flex flex-col justify-between flex-grow">
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-brand-dark rounded-lg border border-brand-card-border shrink-0">
                      {ind.icon}
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">
                      {ind.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2.5">
                    {ind.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-brand-card-border/60">
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet hover:text-white transition-colors"
                  >
                    Request custom telemetry specs
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </section>

      {/* Custom Implementation Callout */}
      <section className="relative rounded-3xl overflow-hidden border border-brand-card-border bg-gradient-to-br from-brand-card to-brand-dark px-6 py-10 text-center shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.06)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col gap-4 items-center">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Deploy Telemetry for Your Specific Domain
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Don&apos;t see your industry listed? We build customized dataset logging pipelines and deploy specialized capture procedures matching unique spatial and cognitive requirements.
          </p>
          <Link href="/contact" className="mt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo px-6 py-2.5 text-sm font-semibold text-white cursor-pointer shadow-lg hover:shadow-brand-purple/20"
            >
              Partner with RoboNexus
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}

