"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    desc: "For small clubs getting started with sponsorship management",
    monthly: 99,
    annual: 79,
    features: [
      "Up to 10 sponsors",
      "Sponsor CRM",
      "Contract management",
      "Basic proposal builder",
      "Calendar & events",
      "Email support",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Professional",
    desc: "For established clubs that need the full power of the platform",
    monthly: 299,
    annual: 239,
    features: [
      "Unlimited sponsors",
      "Everything in Starter",
      "Inventory & rights management",
      "Advanced proposal & catalog builder",
      "Activation tracking",
      "Budget management",
      "Marketplace access",
      "Workflow automations",
      "Pitchy AI assistant",
      "Priority support",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    desc: "For major organizations with custom needs and multiple teams",
    monthly: null,
    annual: null,
    features: [
      "Everything in Professional",
      "Multi-team management",
      "Custom integrations",
      "Advanced analytics & reporting",
      "White-label options",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-white/[0.05] border border-white/10 text-xs font-impact tracking-wider text-white/50 mb-6">
            Pricing
          </div>
          <h2 className="font-impact text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Simple, transparent
            <br />
            <span className="text-gradient">pricing.</span>
          </h2>
          <p className="text-white/45 text-base sm:text-lg leading-relaxed">
            No hidden fees. No long-term contracts. Start free, scale when
            you&apos;re ready.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span
            className={`text-sm font-impact tracking-wider transition-colors duration-300 ${
              !annual ? "text-white" : "text-white/35"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            aria-label="Toggle annual pricing"
            className="relative w-14 h-7 bg-white/10 border border-white/10 transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-midnight"
          >
            <motion.span
              className="absolute top-0.5 w-6 h-6 bg-gradient-to-r from-primary to-pitch shadow-md"
              animate={{ left: annual ? "calc(100% - 1.625rem)" : "0.125rem" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span
            className={`text-sm font-impact tracking-wider transition-colors duration-300 flex items-center gap-2 ${
              annual ? "text-white" : "text-white/35"
            }`}
          >
            Annual
            <span className="text-[10px] px-2 py-0.5 clip-parallelogram bg-pitch/15 text-pitch font-impact tracking-wider border border-pitch/20">
              Save 20%
            </span>
          </span>
        </motion.div>

        {/* Cards — Ticket/VIP pass style */}
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 items-start max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative flex flex-col overflow-hidden ${
                plan.featured
                  ? "border border-primary/30 shadow-xl shadow-primary/10 md:scale-[1.03] bg-white/[0.04]"
                  : "border border-white/8 bg-white/[0.03]"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
            >
              {/* Accent bar top */}
              <div className={`h-[3px] ${
                plan.featured
                  ? "bg-gradient-to-r from-primary via-pitch to-gold"
                  : "bg-gradient-to-r from-white/10 to-white/5"
              }`} />

              <div className="p-6 sm:p-8">
                {plan.featured && (
                  <div className="inline-block px-3 py-1 clip-parallelogram bg-gradient-to-r from-primary to-pitch text-white text-[11px] font-impact tracking-wider shadow-lg shadow-primary/20 mb-4">
                    Most Popular
                  </div>
                )}

                <h3 className="text-white font-impact text-xl tracking-wider mb-1">
                  {plan.name}
                </h3>
                <p className="text-white/40 text-sm mb-6 leading-relaxed">{plan.desc}</p>

                <div className="mb-6">
                  {plan.monthly !== null ? (
                    <div className="flex items-baseline gap-1">
                      <motion.span
                        key={annual ? "annual" : "monthly"}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-impact text-4xl text-white tabular-nums"
                      >
                        &euro;{annual ? plan.annual : plan.monthly}
                      </motion.span>
                      <span className="text-white/30 text-sm">/month</span>
                    </div>
                  ) : (
                    <span className="font-impact text-4xl text-white">
                      Custom
                    </span>
                  )}
                </div>

                {/* Dashed tear line */}
                <div className="border-t border-dashed border-white/10 my-6" />

                <ul className="flex flex-col gap-2.5 sm:gap-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white/55">
                      <svg
                        className="w-4 h-4 text-pitch flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta"
                  className={`w-full py-3.5 text-sm font-impact tracking-wider text-center transition-all duration-300 block clip-parallelogram ${
                    plan.featured
                      ? "bg-gradient-to-r from-primary to-pitch text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-px active:translate-y-0"
                      : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
