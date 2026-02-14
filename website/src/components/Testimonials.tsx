"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote: "Pitch Partner has completely transformed how we manage our 30+ sponsors. The proposal builder alone saved us hundreds of hours last season.",
    author: "Marco Rossi",
    role: "Commercial Director, Serie A Club",
    initials: "MR",
    gradient: "from-primary to-pitch",
  },
  {
    quote: "Finally, a platform that gives us real transparency. We can see our activations, track ROI, and communicate with the club \u2014 all in one place.",
    author: "Sarah Klein",
    role: "Brand Partnerships, Global Sportswear Brand",
    initials: "SK",
    gradient: "from-pitch to-gold",
  },
  {
    quote: "The marketplace feature helped us discover 3 new club partnerships we never would have found otherwise. The ROI has been incredible.",
    author: "Jean Martin",
    role: "VP Sponsorships, Automotive Brand",
    initials: "JM",
    gradient: "from-gold to-primary",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-white/[0.05] border border-white/10 text-xs font-impact tracking-wider text-white/50 mb-6">
            Testimonials
          </div>
          <h2 className="font-impact text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Loved by sports
            <br />
            <span className="text-gradient">professionals.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.author}
              className="relative p-6 sm:p-8 bg-white/[0.03] border border-white/8 flex flex-col group hover:bg-white/[0.05] transition-all duration-500 overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
            >
              {/* Accent bar left on hover */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary via-pitch to-gold transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top" />

              {/* Big decorative quote mark */}
              <div className="absolute top-4 right-4 opacity-[0.04] pointer-events-none" aria-hidden="true">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="white">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
              </div>

              {/* Verified badge */}
              <div className="flex items-center gap-1.5 mb-4">
                <svg className="w-3.5 h-3.5 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-gold text-[10px] font-impact tracking-wider">Verified</span>
              </div>

              {/* Quote */}
              <p className="text-white/55 text-sm leading-relaxed flex-1 mb-6 italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-xs font-impact flex-shrink-0 clip-hexagon`}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-white text-sm font-impact tracking-wider">{t.author}</div>
                  <div className="text-white/35 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
