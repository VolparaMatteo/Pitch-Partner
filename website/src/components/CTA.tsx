"use client";

import { motion } from "framer-motion";

export default function CTA() {
  return (
    <section id="cta" className="py-24 md:py-32 relative">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          className="relative overflow-hidden p-10 sm:p-12 md:p-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Background — Stadium atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-light" />
          <div className="absolute inset-0">
            {/* Floodlight cones */}
            <div className="floodlight-cone w-[300px] h-[500px] -top-10 left-[10%] rotate-[10deg] opacity-40" />
            <div className="floodlight-cone-warm w-[250px] h-[450px] -top-10 right-[10%] -rotate-[10deg] opacity-30" />
          </div>

          {/* Centrocampo circle decoration */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]" aria-hidden="true">
            <svg width="300" height="300" viewBox="0 0 300 300" fill="none">
              <circle cx="150" cy="150" r="120" stroke="white" strokeWidth="1" />
              <circle cx="150" cy="150" r="4" fill="white" />
            </svg>
          </div>

          <div className="absolute inset-0 border border-white/10" />
          <div className="noise-overlay" />

          {/* Content */}
          <div className="relative z-10">
            <h2 className="font-impact text-3xl sm:text-4xl lg:text-5xl text-white mb-4 leading-tight">
              Ready to transform your
              <br />
              sponsorship management?
            </h2>
            <p className="text-white/45 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join 500+ clubs already using Pitch Partner to manage partnerships,
              boost revenue, and delight sponsors.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="#"
                className="group relative px-8 py-4 clip-parallelogram bg-gradient-to-r from-primary to-pitch text-white font-impact tracking-wider text-base flex items-center gap-2 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">Start Your Free Trial</span>
                <svg
                  className="w-5 h-5 relative transition-transform group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 10h12m0 0l-4-4m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="px-8 py-4 clip-parallelogram border border-white/10 text-white/70 font-impact tracking-wider text-base hover:bg-white/5 hover:text-white hover:border-white/20 transition-all duration-300"
              >
                Book a Demo
              </a>
            </div>
            <p className="text-white/30 text-sm">
              Free 14-day trial. No credit card required.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
