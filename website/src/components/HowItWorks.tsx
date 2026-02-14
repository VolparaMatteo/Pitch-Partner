"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    num: 1,
    title: "Create Your Account",
    desc: "Sign up, set up your club profile, customize your branding, and invite your team members.",
  },
  {
    num: 2,
    title: "Import Your Data",
    desc: "Add your sponsors, contracts, and assets. Import from spreadsheets or start fresh.",
  },
  {
    num: 3,
    title: "Invite Your Sponsors",
    desc: "Send one-click invitations. Sponsors get their own portal with full visibility into the partnership.",
  },
  {
    num: 4,
    title: "Scale & Automate",
    desc: "Set up automations, use AI insights, and watch your sponsorship revenue grow.",
  },
];

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ["0%", "100%"]);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-24 md:py-32 relative"
    >
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-white/[0.05] border border-white/10 text-xs font-impact tracking-wider text-white/60 mb-6">
            How It Works
          </div>
          <h2 className="font-impact text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Up and running
            <br />
            <span className="text-gradient">in 24 hours.</span>
          </h2>
          <p className="text-white/40 text-lg leading-relaxed">
            No complex setup. No IT team needed. Just sign up and start managing
            partnerships like a pro.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Line — tricolor gradient */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-white/5 md:-translate-x-px">
            <motion.div
              className="w-full bg-gradient-to-b from-primary via-pitch to-gold"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-16">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                className={`relative flex items-start gap-6 md:gap-12 ${
                  i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                {/* Number — Hexagon (like football substitution icon) */}
                <div
                  className="relative z-10 flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary to-pitch flex items-center justify-center shadow-lg shadow-primary/20 clip-hexagon"
                >
                  <span className="text-white font-impact text-xl">
                    {step.num}
                  </span>
                </div>

                {/* Content */}
                <div
                  className={`flex-1 pt-2 ${
                    i % 2 === 0 ? "md:text-left" : "md:text-right"
                  }`}
                >
                  <h3 className="text-white font-impact text-xl tracking-wider mb-2">
                    {step.title}
                  </h3>
                  <p className="text-white/40 text-base leading-relaxed max-w-sm">
                    {step.desc}
                  </p>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
