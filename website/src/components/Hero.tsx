"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import AnimatedCounter from "./AnimatedCounter";

const wordReveal = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const wordChild = {
  hidden: { opacity: 0, rotateX: 90, y: 40 },
  visible: {
    opacity: 1,
    rotateX: 0,
    y: 0,
    transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
  },
};

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const yBg = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20"
    >
      {/* Background — Stadium Floodlights */}
      <motion.div className="absolute inset-0" style={{ y: yBg }}>
        {/* 4 floodlight cones */}
        <div className="floodlight-cone -top-20 left-[5%] rotate-[8deg]" />
        <div className="floodlight-cone-warm -top-10 left-[30%] -rotate-[4deg]" style={{ animationDelay: "1s" }} />
        <div className="floodlight-cone -top-20 right-[25%] rotate-[5deg]" style={{ animationDelay: "3s" }} />
        <div className="floodlight-cone-warm -top-10 right-[5%] -rotate-[8deg]" style={{ animationDelay: "4s" }} />

        {/* Centrocampo circle SVG */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]" aria-hidden="true">
          <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="180" stroke="white" strokeWidth="1" />
            <circle cx="250" cy="250" r="6" fill="white" />
            <line x1="0" y1="250" x2="500" y2="250" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Stadium silhouette */}
        <div className="absolute bottom-0 left-0 right-0 opacity-[0.03]" aria-hidden="true">
          <svg viewBox="0 0 1440 120" fill="none" className="w-full" preserveAspectRatio="none">
            <path
              d="M0 120V80C120 45 240 20 360 15C480 10 600 25 720 20C840 15 960 10 1080 15C1200 20 1320 40 1440 60V120H0Z"
              fill="white"
            />
          </svg>
        </div>

        <div className="pitch-lines" />
        <div className="noise-overlay" />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        style={{ opacity }}
      >
        {/* Badge — Angular parallelogram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2.5 px-5 py-2 clip-parallelogram bg-white/[0.06] border border-white/10 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pitch opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-pitch" />
          </span>
          <span className="text-sm text-white/60 font-impact tracking-wider">
            The European Standard for Sports Sponsorship
          </span>
        </motion.div>

        {/* Title — Word by word reveal */}
        <motion.h1
          className="font-impact text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl leading-[0.95] tracking-tight mb-6"
          style={{ perspective: "800px" }}
          variants={wordReveal}
          initial="hidden"
          animate="visible"
        >
          <span className="block overflow-hidden">
            <motion.span className="text-white inline-block" variants={wordChild}>
              Where Sports Clubs
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span className="text-gradient inline-block" variants={wordChild}>
              Meet Their Sponsors
            </motion.span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-base sm:text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          The all-in-one platform to manage partnerships, contracts, activations,
          and ROI. Perfect transparency. Total control. One unified workspace.
        </motion.p>

        {/* CTAs — Angular */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <a
            href="#cta"
            className="group relative px-8 py-4 clip-parallelogram bg-gradient-to-r from-primary to-pitch text-white font-impact text-base tracking-wider flex items-center gap-2 hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative">Start Free Trial</span>
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
            href="#features"
            className="px-8 py-4 clip-parallelogram border border-white/10 text-white/70 font-impact text-base tracking-wider flex items-center gap-2.5 hover:bg-white/5 hover:border-white/20 hover:text-white transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.5 7l4 3-4 3V7z" fill="currentColor" />
            </svg>
            <span>Watch Demo</span>
          </a>
        </motion.div>

        {/* Stats — Scoreboard style */}
        <motion.div
          className="inline-flex items-center border border-white/10 bg-white/[0.03]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {[
            { target: 500, suffix: "+", label: "Clubs Onboard" },
            { target: 12000, suffix: "+", label: "Partnerships" },
            { target: 25, suffix: "+", label: "Countries" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center px-5 sm:px-8 py-4 ${
                i < 2 ? "border-r border-white/10" : ""
              }`}
            >
              <div className="font-impact text-2xl sm:text-3xl md:text-4xl text-white tabular-nums">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
              </div>
              <div className="text-[10px] sm:text-xs text-white/35 mt-1 uppercase tracking-wider font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Dashboard Preview */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 mt-16 mb-8"
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative">
          {/* Dashboard mock */}
          <div className="relative overflow-hidden border border-white/10 bg-surface shadow-2xl shadow-primary/5">
            {/* Accent bar gradient on top */}
            <div className="accent-bar" />

            {/* Browser bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-3 bg-surface-light border-b border-white/5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red/60" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber/60" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-[10px] sm:text-xs text-white/25 bg-white/5 px-3 sm:px-4 py-1 font-mono">
                  app.pitchpartner.com/dashboard
                </span>
              </div>
            </div>
            {/* Dashboard content */}
            <div className="flex min-h-[280px] sm:min-h-[340px]">
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-48 lg:w-52 border-r border-white/5 p-3 lg:p-4 gap-0.5">
                {[
                  { label: "Dashboard", active: true },
                  { label: "Sponsors", active: false },
                  { label: "Contracts", active: false },
                  { label: "Inventory", active: false },
                  { label: "Proposals", active: false },
                  { label: "Activations", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      item.active
                        ? "bg-primary/15 text-white font-medium border-l-2 border-primary"
                        : "text-white/30"
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 ${
                        item.active ? "bg-primary" : "bg-white/15"
                      }`}
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                    />
                    {item.label}
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="flex-1 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-5 sm:mb-6 gap-3">
                  <div>
                    <h3 className="text-white font-impact text-sm sm:text-base tracking-wider">
                      Good morning, AC Milan
                    </h3>
                    <p className="text-white/35 text-xs sm:text-sm mt-0.5">
                      Here&apos;s your partnership overview
                    </p>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    {[
                      { v: "\u20AC2.4M", l: "Revenue" },
                      { v: "24", l: "Sponsors" },
                      { v: "98%", l: "Fulfillment" },
                    ].map((s) => (
                      <div
                        key={s.l}
                        className="text-right px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white/[0.03] border border-white/5"
                      >
                        <div className="text-white font-impact text-xs sm:text-sm tabular-nums">
                          {s.v}
                        </div>
                        <div className="text-white/25 text-[10px] sm:text-xs">{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Chart */}
                  <div className="bg-white/[0.02] border border-white/5 p-3 sm:p-4">
                    <div className="text-white/40 text-[11px] sm:text-xs font-impact tracking-wider mb-3 sm:mb-4">
                      Revenue by Quarter
                    </div>
                    <div className="flex items-end gap-2 sm:gap-3 h-24 sm:h-28">
                      {[
                        { h: "45%", l: "Q1" },
                        { h: "65%", l: "Q2" },
                        { h: "55%", l: "Q3" },
                        { h: "85%", l: "Q4", active: true },
                      ].map((bar) => (
                        <div
                          key={bar.l}
                          className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2"
                        >
                          <div
                            className={`w-full transition-all ${
                              bar.active
                                ? "bg-gradient-to-t from-primary to-pitch shadow-sm shadow-primary/20"
                                : "bg-white/8"
                            }`}
                            style={{ height: bar.h }}
                          />
                          <span className="text-[9px] sm:text-[10px] text-white/25 font-mono tabular-nums">
                            {bar.l}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Recent contracts */}
                  <div className="bg-white/[0.02] border border-white/5 p-3 sm:p-4">
                    <div className="text-white/40 text-[11px] sm:text-xs font-impact tracking-wider mb-3 sm:mb-4">
                      Recent Contracts
                    </div>
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {[
                        { color: "bg-primary", name: "Nike \u2014 Main Kit Sponsor", status: "Active", sc: "text-green" },
                        { color: "bg-pitch", name: "Emirates \u2014 Stadium", status: "Active", sc: "text-green" },
                        { color: "bg-gold", name: "Puma \u2014 Training Kit", status: "Pending", sc: "text-amber" },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-2.5 sm:gap-3">
                          <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${item.color} flex-shrink-0`}
                               style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                          <span className="text-white/50 text-[11px] sm:text-xs flex-1 truncate">
                            {item.name}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-impact tracking-wider ${item.sc} flex-shrink-0`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards — desktop only */}
          <motion.div
            className="absolute -left-6 top-1/4 glass-strong px-4 py-3 flex items-center gap-3 shadow-xl hidden xl:flex border-l-2 border-primary"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-8 h-8 bg-primary/20 flex items-center justify-center clip-hexagon">
              <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10M18 20V4M6 20v-4" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-impact tracking-wider">+34% ROI</div>
              <div className="text-white/35 text-xs">Sponsor satisfaction up</div>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-6 top-1/3 glass-strong px-4 py-3 flex items-center gap-3 shadow-xl hidden xl:flex border-l-2 border-pitch"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <div className="w-8 h-8 bg-pitch/20 flex items-center justify-center clip-hexagon">
              <svg className="w-4 h-4 text-pitch" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-impact tracking-wider">Contract Signed</div>
              <div className="text-white/35 text-xs">Emirates &mdash; just now</div>
            </div>
          </motion.div>

          <motion.div
            className="absolute -right-4 bottom-10 glass-strong px-4 py-3 flex items-center gap-3 shadow-xl hidden xl:flex border-l-2 border-gold"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <div className="w-8 h-8 bg-gold/20 flex items-center justify-center clip-hexagon">
              <svg className="w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-impact tracking-wider">Pitchy AI</div>
              <div className="text-white/35 text-xs">&ldquo;Your renewal rate is 92%&rdquo;</div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10"
        style={{ opacity: scrollIndicatorOpacity }}
      >
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-white/20 animate-[scroll-bounce_2s_ease-in-out_infinite]" />
        <span className="text-[10px] text-white/25 font-impact tracking-[0.3em]">
          Scroll to explore
        </span>
      </motion.div>
    </section>
  );
}
