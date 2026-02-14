"use client";

import { motion } from "framer-motion";

const features = [
  { num: "01", title: "Real-Time Dashboard", desc: "Activation rates, ROI metrics, event attendance, and partnership analytics at a glance." },
  { num: "02", title: "Marketplace Discovery", desc: "Browse and apply for sponsorship opportunities from clubs across Europe. Find the perfect fit." },
  { num: "03", title: "Contract & Budget Control", desc: "View contracts, track budgets, confirm payments, and access all documentation in one place." },
  { num: "04", title: "Event & Box Access", desc: "RSVP to events, receive QR tickets for business boxes, and manage your guest lists." },
  { num: "05", title: "Sponsor Network", desc: "Connect with other sponsors, share profiles, and explore networking opportunities." },
  { num: "06", title: "Direct Communication", desc: "Message clubs directly, participate in projects, and stay updated via the press feed." },
];

const metrics = [
  { value: "92%", label: "Activation Rate", pct: 92, gradId: "grad-activation", c1: "#1A56DB", c2: "#16A34A" },
  { value: "78%", label: "ROI Score", pct: 78, gradId: "grad-roi", c1: "#06B6D4", c2: "#16A34A" },
  { value: "3/3", label: "Events Attended", pct: 100, gradId: "grad-events", c1: "#D4A017", c2: "#EF4444" },
];

export default function ForSponsors() {
  return (
    <section id="sponsors" className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual — Sponsor Dashboard */}
          <motion.div
            className="relative order-2 lg:order-1"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              <div className="border border-white/10 bg-surface p-5 sm:p-6 shadow-2xl shadow-primary/10">
                {/* Triple accent bar */}
                <div className="flex h-[3px] mb-5">
                  <div className="flex-1 bg-primary" />
                  <div className="flex-1 bg-pitch" />
                  <div className="flex-1 bg-gold" />
                </div>

                {/* Dashboard header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-10 h-10 bg-gradient-to-br from-pitch to-primary flex items-center justify-center text-white font-impact text-sm clip-shield"
                  >
                    S
                  </div>
                  <div>
                    <div className="text-white font-impact text-sm tracking-wider">SportBrand Co.</div>
                    <div className="text-white/35 text-xs">Premium Partner &mdash; AC Milan</div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                  {metrics.map((m) => (
                    <div key={m.gradId} className="text-center">
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="3"
                          />
                          <motion.path
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke={`url(#${m.gradId})`}
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ strokeDasharray: "0, 100" }}
                            whileInView={{ strokeDasharray: `${m.pct}, 100` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                          />
                          <defs>
                            <linearGradient id={m.gradId}>
                              <stop stopColor={m.c1} />
                              <stop offset="1" stopColor={m.c2} />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[11px] sm:text-xs font-impact tabular-nums">
                          {m.value}
                        </span>
                      </div>
                      <span className="text-white/35 text-[10px] sm:text-[11px] font-impact tracking-wider">{m.label}</span>
                    </div>
                  ))}
                </div>

                {/* Upcoming activations */}
                <div>
                  <div className="text-white/45 text-xs font-impact tracking-wider mb-3">
                    Upcoming Activations
                  </div>
                  {[
                    { day: "15", month: "FEB", name: "LED Board \u2014 Milan vs Inter", status: "Confirmed", statusClass: "text-green" },
                    { day: "22", month: "FEB", name: "VIP Box \u2014 Milan vs Juventus", status: "Planning", statusClass: "text-amber" },
                  ].map((a) => (
                    <div key={a.name} className="flex items-center gap-4 py-3 border-t border-white/5">
                      <div className="text-center w-10 flex-shrink-0">
                        <div className="text-white font-impact text-sm leading-tight tabular-nums">{a.day}</div>
                        <div className="text-white/30 text-[10px] font-impact tracking-wider">{a.month}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/60 text-xs truncate">{a.name}</div>
                      </div>
                      <div className={`text-[10px] font-impact tracking-wider ${a.statusClass} flex-shrink-0`}>
                        {a.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-pitch/10 border border-pitch/20 text-pitch text-xs font-impact tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-pitch" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              For Sponsors
            </div>
            <h2 className="font-impact text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4">
              Full visibility into
              <br />
              <span className="text-gradient-alt">every partnership.</span>
            </h2>
            <p className="text-white/45 text-base sm:text-lg mb-10 leading-relaxed">
              No more guessing. See exactly what you&apos;re getting, when, and
              how it performs.
            </p>

            <div className="flex flex-col gap-5 sm:gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={f.num}
                  className="flex gap-4 group"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <span className="font-impact text-xl sm:text-2xl text-gradient flex-shrink-0 w-8 tabular-nums">
                    {f.num}
                  </span>
                  <div>
                    <h3 className="text-white font-impact tracking-wider mb-1 group-hover:text-primary transition-colors duration-300">
                      {f.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
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
