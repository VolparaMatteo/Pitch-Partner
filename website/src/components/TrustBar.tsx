"use client";

import { motion } from "framer-motion";

const leagues = [
  "Serie A",
  "La Liga",
  "Bundesliga",
  "Ligue 1",
  "Premier League",
  "Eredivisie",
  "Liga Portugal",
  "Super Lig",
  "Scottish Premiership",
  "Allsvenskan",
];

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="20"
      viewBox="0 0 18 20"
      fill="none"
      className="flex-shrink-0 opacity-40"
      aria-hidden="true"
    >
      <path
        d="M9 0L18 3V10C18 15.5 14 18.5 9 20C4 18.5 0 15.5 0 10V3L9 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function TrustBar() {
  return (
    <section className="py-16 border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.p
          className="text-center text-sm text-white/30 mb-8 font-impact tracking-[0.2em]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Trusted by Leading Sports Organizations Across Europe
        </motion.p>
        <div className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-midnight to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-midnight to-transparent z-10" />
          <div className="trust-track flex gap-12 items-center whitespace-nowrap">
            {[...leagues, ...leagues].map((league, i) => (
              <div
                key={`${league}-${i}`}
                className="flex items-center gap-2.5 text-white/20 hover:text-white/40 transition-colors select-none"
              >
                <ShieldIcon />
                <span className="font-impact text-xl md:text-2xl tracking-wider">
                  {league}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
