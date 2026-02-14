"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";

const stats = [
  { target: 73, decimals: 0, suffix: "%", desc: "Less Admin Time" },
  { target: 34, decimals: 0, suffix: "%", desc: "Sponsor Retention" },
  { target: 2.5, decimals: 1, suffix: "x", desc: "Faster Proposals" },
  { target: 4.9, decimals: 1, suffix: "/5", desc: "Customer Rating" },
];

export default function Stats() {
  return (
    <section className="py-20 md:py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-white/10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.desc}
              className={`text-center p-6 sm:p-8 group transition-all duration-500 hover:bg-white/[0.03] relative ${
                i < 3 ? "border-r border-white/10" : ""
              }`}
              initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
              whileInView={{ opacity: 1, clipPath: "inset(0 0 0 0)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
            >
              {/* Accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-pitch to-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />

              <div className="font-impact text-4xl sm:text-5xl md:text-6xl text-white mb-2 tabular-nums">
                <AnimatedCounter
                  target={stat.target}
                  decimals={stat.decimals}
                  suffix={stat.suffix}
                />
              </div>
              <p className="text-white/40 text-xs sm:text-sm font-impact tracking-wider">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
