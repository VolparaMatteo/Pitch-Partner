"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type TabFeature = { title: string; desc: string };
type Tab = { id: string; label: string; features: TabFeature[] };

const tabs: Tab[] = [
  {
    id: "manage",
    label: "Manage",
    features: [
      { title: "Sponsor CRM & Pipeline", desc: "Track every sponsor from first contact to signed deal. Activity timeline, notes, tags, and scoring." },
      { title: "Calendar & Events", desc: "Unified CRM calendar. Match management, events, business boxes with QR check-in, and invitations." },
      { title: "Contract Repository", desc: "Digital contracts with e-signatures, templates, asset assignments, and compliance checklists." },
    ],
  },
  {
    id: "sell",
    label: "Sell",
    features: [
      { title: "Proposal Builder", desc: "Drag-and-drop proposals with your brand. Share via link, track opens, and get comments." },
      { title: "Catalog Builder", desc: "Create beautiful sponsorship catalogs. Public links, multi-asset showcase, easy duplication." },
      { title: "Inventory & Rights", desc: "Full asset catalog with categories, tiers, pricing, availability calendar, and sector exclusivity rules." },
    ],
  },
  {
    id: "deliver",
    label: "Deliver",
    features: [
      { title: "Activation Tracking", desc: "Match-by-match activation planning. Photo uploads, per-contract reports, and fulfillment scoring." },
      { title: "Budget Management", desc: "Create budgets per sponsor, track expenses, manage payments, and compare budget vs actual." },
      { title: "Project Management", desc: "Milestones, task assignments, comments, and timeline tracking for every activation project." },
    ],
  },
  {
    id: "grow",
    label: "Grow",
    features: [
      { title: "Pitchy AI", desc: "Your AI assistant that understands your sponsors, contracts, and data. Ask anything." },
      { title: "Automations", desc: "Visual workflow builder. Auto-reminders, renewal alerts, email sequences, and smart triggers." },
      { title: "Press Area & Feed", desc: "Internal social network for sponsors. Publish news, share media, drive engagement." },
    ],
  },
];

export default function ForClubs() {
  const [activeTab, setActiveTab] = useState("manage");
  const currentTab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <section id="clubs" className="py-24 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 clip-parallelogram bg-primary/10 border border-primary/20 text-primary text-xs font-impact tracking-wider mb-6">
              <span className="w-1.5 h-1.5 bg-primary" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              For Sports Clubs
            </div>
            <h2 className="font-impact text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4">
              Your entire sponsorship operation.
              <br />
              <span className="text-gradient">In one command center.</span>
            </h2>
            <p className="text-white/45 text-base sm:text-lg mb-8 leading-relaxed">
              From lead generation to contract renewal, Pitch Partner gives your
              commercial team superpowers.
            </p>

            {/* Tabs — Angular clip-path */}
            <div className="flex gap-2 mb-8" role="tablist">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  className={`px-5 py-2 text-sm font-impact tracking-wider transition-all duration-300 clip-parallelogram ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-primary to-pitch text-white shadow-lg shadow-primary/20"
                      : "text-white/40 hover:text-white/60 bg-white/5 hover:bg-white/8"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[220px]" id={`tabpanel-${activeTab}`} role="tabpanel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-5"
                >
                  {currentTab.features.map((f, i) => (
                    <motion.div
                      key={f.title}
                      className="flex gap-4 border-l-2 border-primary/20 pl-4 hover:border-primary/50 transition-colors duration-300"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div>
                        <h3 className="text-white font-impact tracking-wider mb-1">{f.title}</h3>
                        <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Visual — Phone mockup */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              {/* Phone */}
              <div className="w-[260px] sm:w-[300px] border-2 border-white/10 bg-surface p-3 shadow-2xl shadow-primary/10">
                {/* Accent bar */}
                <div className="accent-bar mb-2" />
                <div className="overflow-hidden bg-midnight">
                  {/* Phone header */}
                  <div className="px-5 pt-5 pb-3 bg-gradient-to-b from-primary/10 to-transparent">
                    <h4 className="text-white font-impact text-sm tracking-wider">Sponsor Pipeline</h4>
                  </div>
                  {/* Pipeline stages */}
                  <div className="px-4 pb-5 flex flex-col gap-3">
                    {[
                      { color: "bg-primary", stage: "Lead", count: 8, items: [
                        { letter: "N", name: "Nike", amount: "\u20AC450K" },
                        { letter: "A", name: "Adidas", amount: "\u20AC320K" },
                      ]},
                      { color: "bg-pitch", stage: "Proposal", count: 5, items: [
                        { letter: "E", name: "Emirates", amount: "\u20AC1.2M" },
                        { letter: "R", name: "Red Bull", amount: "\u20AC280K" },
                      ]},
                      { color: "bg-green", stage: "Closed", count: 12, items: [
                        { letter: "P", name: "Puma", amount: "\u20AC680K" },
                      ]},
                    ].map((stage) => (
                      <div key={stage.stage}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-1.5 h-1.5 ${stage.color}`}
                               style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                          <span className="text-white/50 text-xs font-impact tracking-wider">{stage.stage}</span>
                          <span className="text-white/20 text-[10px] ml-auto tabular-nums">{stage.count}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {stage.items.map((item) => (
                            <div key={item.name} className="flex items-center gap-3 px-3 py-2 bg-white/[0.04] border border-white/5">
                              <div
                                className="w-7 h-7 bg-gradient-to-br from-primary/30 to-pitch/30 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                                style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                              >
                                {item.letter}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-xs font-medium">{item.name}</div>
                                <div className="text-white/25 text-[10px] tabular-nums">{item.amount}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
