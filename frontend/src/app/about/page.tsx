"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Compass, Users, Target, Shield, Lightbulb, Factory, GraduationCap } from "lucide-react";
import ScrollReveal from "@/components/animations/ScrollReveal";

export default function About() {
  const values = [
    {
      icon: <Users className="h-5 w-5 text-brand-purple" />,
      title: "Human Agency First",
      desc: "We prioritize human ingenuity. In an AI-driven future, human actions are the ground truth that guides machine intelligence safely.",
    },
    {
      icon: <Target className="h-5 w-5 text-brand-violet" />,
      title: "Unyielding Precision",
      desc: "AI training datasets require high-fidelity telemetry. We maintain rigorous standards to ensure every kinematic angle and data point is exact.",
    },
    {
      icon: <Shield className="h-5 w-5 text-brand-purple" />,
      title: "Security & Trust",
      desc: "We implement state-of-the-art encryption and anonymization protocols to protect proprietary client models and contractor identity.",
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-brand-violet" />,
      title: "Continuous Innovation",
      desc: "Founded in 2025, we actively adapt to the fast-evolving AI environment, engineering new capture methods for next-gen humanoid robotics.",
    },
    {
      icon: <Factory className="h-5 w-5 text-brand-purple" />,
      title: "Advanced Manufacturing",
      desc: "Beyond data, we are a leading robotic manufacturer, designing and building the precision hardware that brings AI to life in the physical world.",
    },
    {
      icon: <GraduationCap className="h-5 w-5 text-brand-violet" />,
      title: "Educational Empowerment",
      desc: "We provide comprehensive AI training for students, preparing the next generation of engineers for a future where humans and robots work in harmony.",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 sm:py-12">
      {/* Title / Intro */}
      <section className="text-center max-w-3xl mx-auto mb-12">
        <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
          Our Origin Story
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mt-2 leading-tight">
          Pioneering Human-Centered <br />
          <span className="text-gradient">AI Training Data</span>
        </h1>
        <p className="text-gray-300 mt-4 text-base sm:text-lg leading-relaxed">
          Founded in 2025, RoboNexus emerged to solve the data starvation crisis in artificial intelligence, providing a secure bridge for human knowledge transfer.
        </p>
      </section>

      {/* Narrative & Visual Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center mb-16">
        <div className="lg:col-span-6 flex flex-col gap-4">
          <ScrollReveal direction="left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Why We Believe in Real Humans, Real Actions
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              As AI architectures transitioned from text prediction to physical world manipulation and robotic autonomy, synthetic data alone became insufficient. Systems trained in simulations often fail when exposed to the visual noise and physical unpredictability of the real world.
            </p>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              RoboNexus was built to capture high-fidelity spatial data from human contractors. Whether performing micro-assembly tasks, navigating chaotic environments, or making critical judgment calls in complex scenarios, our contractors register real physical inputs.
            </p>
            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              These actual recordings form the foundational grounding for robots, training neural nets on the subtleties of weight distribution, torque correction, and cognitive reasoning.
            </p>
          </ScrollReveal>
        </div>

        <div className="lg:col-span-6">
          <ScrollReveal direction="right">
            <div className="relative h-[300px] sm:h-[400px] w-full rounded-3xl overflow-hidden border border-brand-card-border shadow-2xl">
              <Image
                src="/training_ai.png"
                alt="AI training and data annotation visualization"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 to-transparent" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <ScrollReveal direction="up" delay={0.05}>
          <div className="glow-card p-6 sm:p-8 rounded-3xl flex flex-col gap-3 h-full">
            <div className="p-2.5 bg-brand-dark rounded-xl w-fit border border-brand-card-border">
              <Target className="h-6 w-6 text-brand-purple" />
            </div>
            <h3 className="text-xl font-bold text-white">Our Mission</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              To empower machine learning researchers and humanoid builders with clean, validated, human-driven data. We seek to elevate AI capability while securing fair compensation and active career tracks for human contractors global-wide.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <div className="glow-card p-6 sm:p-8 rounded-3xl flex flex-col gap-3 h-full">
            <div className="p-2.5 bg-brand-dark rounded-xl w-fit border border-brand-card-border">
              <Compass className="h-6 w-6 text-brand-violet" />
            </div>
            <h3 className="text-xl font-bold text-white">Our Vision</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              To build a collaborative future where artificial general intelligence (AGI) works safely alongside humanity, aligned through natural human behaviors, high-fidelity physical training, and moral alignment frameworks.
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* Core Values Section */}
      <section className="py-12 border-t border-brand-card-border/60">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <ScrollReveal>
            <span className="text-xs font-bold font-mono tracking-widest text-brand-violet uppercase">
              Our Compass
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-2">
              Core Principles We Live By
            </h2>
            <p className="text-gray-400 mt-2 text-sm">
              Our principles define how we build datasets, treat our global contractor network, and protect client IP.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, idx) => (
            <ScrollReveal key={idx} delay={idx * 0.08}>
              <div className="glow-card p-5 rounded-2xl flex flex-col gap-2.5 h-full">
                <div className="p-2.5 bg-brand-dark rounded-xl w-fit border border-brand-card-border">
                  {v.icon}
                </div>
                <h3 className="text-base font-bold text-white mt-1">{v.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{v.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}

