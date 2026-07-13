"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Award, 
  GraduationCap, 
  PlayCircle, 
  CheckCircle2,
  Clock,
  BookOpen
} from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function Training() {
  const steps = [
    {
      step: "01",
      title: "Initial Screening",
      desc: "Contractors undergo basic spatial intelligence, language fluency, and logical reasoning evaluations to ensure foundational alignment."
    },
    {
      step: "02",
      title: "Sensor Onboarding",
      desc: "Learning to operate depth sensors, spatial trackers, and wearable haptic arrays. Practical calibration checks are administered."
    },
    {
      step: "03",
      title: "Guided Sandbox Runs",
      desc: "Simulating robotics tasks in verified sandboxes. Every move is graded for compliance, velocity control, and instruction matching."
    },
    {
      step: "04",
      title: "Final Certification",
      desc: "The contractor is certified as a RoboNexus Telemetry Specialist, unlocking high-tier paid trials across various AI client pipelines."
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
      {/* Intro */}
      <section className="text-center max-w-3xl mx-auto mb-10">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
          Onboarding Program
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight">
          RoboNexus <span className="text-gradient">AI Training Program</span>
        </h1>
        <p className="text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
          Becoming a RoboNexus contractor requires precision. Our program transforms human actions into clean, semantic dataset arrays utilized by top-tier AGI labs.
        </p>
      </section>

      {/* Main Feature Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
        <div className="lg:col-span-6 relative aspect-video lg:aspect-[4/3] w-full rounded-3xl overflow-hidden border border-brand-card-border shadow-2xl bg-brand-dark/30">
          <Image
            src="/training_ai.png"
            alt="Robotics operator training interface"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          {/* Subtle play button overlay */}
          <div className="absolute inset-0 bg-[#0b0b0f]/40 flex items-center justify-center group cursor-pointer hover:bg-[#0b0b0f]/30 transition-all">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              className="p-4 sm:p-5 bg-gradient-to-r from-brand-purple to-brand-indigo rounded-full text-white shadow-xl shadow-brand-purple/20"
            >
              <PlayCircle className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col gap-5">
          <ScrollReveal direction="right">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              A Structured Path to Spatial Telemetry
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base mt-2">
              Our training program ensures every contractor produces clean data. Telemetry is more than clicking buttons; it is about transferring mechanical intuition. Contractors learn how to coordinate velocity curves, manage collision safety envelopes, and structure clean logic chains that robots can replicate.
            </p>
            
            <div className="flex flex-col gap-3.5 mt-4">
              {[
                { icon: <Clock className="h-5 w-5 text-brand-purple" />, text: "Flexible online modules, roughly 4-6 hours total completion time." },
                { icon: <BookOpen className="h-5 w-5 text-brand-violet" />, text: "Detailed spatial training manuals covering robotics kinematics and logic flow." },
                { icon: <Award className="h-5 w-5 text-brand-purple" />, text: "Industry-standard certification valid across major neural research facilities." }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="p-1.5 bg-brand-dark rounded-lg border border-brand-card-border shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs sm:text-sm text-gray-300">{item.text}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Curriculum Steps */}
      <section className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <ScrollReveal>
            <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
              Academic Excellence
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-2">
              AI & Robotics Training for Students
            </h2>
            <p className="text-gray-400 mt-2 text-sm leading-relaxed">
              We provide specialized training programs for students looking to enter the world of AI and Robotics. Our curriculum bridges theoretical knowledge with practical, industry-standard experience.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <ScrollReveal direction="left">
            <div className="bg-brand-card/40 border border-brand-card-border p-8 rounded-3xl h-full flex flex-col gap-4">
              <div className="p-3 bg-brand-cyan/10 rounded-2xl w-fit border border-brand-cyan/20">
                <BookOpen className="h-6 w-6 text-brand-cyan" />
              </div>
              <h3 className="text-xl font-bold text-white">Student Internship Program</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Join RoboNexus as an intern and work alongside world-class engineers. You&apos;ll get hands-on experience with humanoid manufacturing, sensor calibration, and neural network data alignment.
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {[
                  "Access to proprietary robotics hardware",
                  "Mentorship from industry experts",
                  "Certificate of completion for university credits",
                  "Potential for full-time career placement"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-cyan shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="bg-brand-card/40 border border-brand-card-border p-8 rounded-3xl h-full flex flex-col gap-4">
              <div className="p-3 bg-brand-violet/10 rounded-2xl w-fit border border-brand-violet/20">
                <GraduationCap className="h-6 w-6 text-brand-violet" />
              </div>
              <h3 className="text-xl font-bold text-white">University Partnerships</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                We partner with academic institutions to provide research-grade datasets and hardware simulators. Our goal is to accelerate robotics research by providing the tools students need to succeed.
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {[
                  "Bulk licensing for student research groups",
                  "Customized curriculum for engineering courses",
                  "Live workshops and guest lectures",
                  "Collaborative R&D on edge-case scenarios"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-violet shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Curriculum Steps */}
      <section className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <ScrollReveal>
            <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
              The Path
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-2">
              Program Curriculum Steps
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              Our step-by-step pipeline guarantees verified telemetry output for enterprise deployment.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((s, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.08}>
              <div className="glow-card p-5 rounded-2xl h-full flex flex-col justify-between relative overflow-hidden group">
                <span className="absolute -right-4 -top-6 text-7xl font-extrabold text-brand-purple/5 font-mono select-none group-hover:text-brand-purple/10 transition-colors">
                  {s.step}
                </span>
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-bold font-mono text-brand-violet">
                    Step {s.step}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Trust & Benefits Grid */}
      <section className="py-12 relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-card-border/60 to-transparent" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Rigorous Standards",
              desc: "RoboNexus certificates are recognized as gold-standards by top AGI consortia, verifying physical control competency."
            },
            {
              title: "Verified Compensation",
              desc: "Certified contractors earn competitive rates, with clear tiered bonuses based on spatial precision and speed KPIs."
            },
            {
              title: "Absolute Safety",
              desc: "All physical telemetry tasks are performed inside sandboxed hardware simulators, protecting contractors from danger."
            }
          ].map((benefit, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <div className="glow-card p-6 rounded-3xl h-full flex flex-col gap-2.5">
                <CheckCircle2 className="h-6 w-6 text-brand-purple" />
                <h3 className="text-lg font-bold text-white mt-1">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{benefit.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-12 text-center">
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-indigo px-8 py-3 font-bold text-white shadow-lg cursor-pointer"
            >
              Start Onboarding Form
              <GraduationCap className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
}

