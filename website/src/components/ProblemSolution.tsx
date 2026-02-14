"use client";

import { motion } from "framer-motion";

const problems = [
  { title: "Scattered data", desc: "Contracts in folders, contacts in spreadsheets, activations in emails, budgets in Excel files." },
  { title: "Zero transparency", desc: "Sponsors never know the real status of their activations. Clubs can't prove ROI." },
  { title: "Wasted potential", desc: "Manual processes kill partnerships. Missed deadlines, forgotten renewals, lost revenue." },
];

const solutions = [
  { title: "Unified workspace", desc: "Every sponsor, contract, activation, and document in one intelligent platform." },
  { title: "Real-time transparency", desc: "Sponsors see everything. Clubs prove everything. Trust is built-in, not bolted on." },
  { title: "AI-powered growth", desc: "Automations, smart insights, and Pitchy AI help you close more deals and renew faster." },
];

export default function ProblemSolution() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 lg:gap-20 relative">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-red/10 border border-red/20 text-red text-xs font-impact tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-red" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              The Problem
            </div>
            <h2 className="font-impact text-3xl md:text-4xl text-white mb-8 leading-tight">
              Sponsorship management is still stuck in the dark ages
            </h2>
            <div className="flex flex-col gap-5 sm:gap-6">
              {problems.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="flex gap-4 border-l-2 border-red/30 pl-4 hover:border-red/60 transition-colors duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-red/10 flex items-center justify-center mt-0.5"
                    style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-impact tracking-wider mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Diagonal divider between columns (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2" aria-hidden="true">
            <div className="w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent transform rotate-[2deg]" />
          </div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-pitch/10 border border-pitch/20 text-pitch text-xs font-impact tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-pitch" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              The Solution
            </div>
            <h2 className="font-impact text-3xl md:text-4xl text-white mb-8 leading-tight">
              One platform. Every partnership. Perfect control.
            </h2>
            <div className="flex flex-col gap-5 sm:gap-6">
              {solutions.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="flex gap-4 border-l-2 border-pitch/30 pl-4 hover:border-pitch/60 transition-colors duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                >
                  <div
                    className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-pitch/10 flex items-center justify-center mt-0.5"
                    style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-impact tracking-wider mb-1">{item.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
