"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#clubs", label: "For Clubs" },
  { href: "#sponsors", label: "For Sponsors" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map((l) => l.href.replace("#", ""));
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(`#${id}`);
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", mobileOpen);
    return () => document.body.classList.remove("menu-open");
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-[background,border-color,box-shadow] duration-500 ${
        scrolled
          ? "bg-midnight/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-transparent"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Accent bar on scroll */}
      <div
        className={`h-[2px] bg-gradient-to-r from-primary via-pitch to-gold transition-opacity duration-500 ${
          scrolled ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo — Shield shape */}
        <a
          href="#"
          className="flex items-center gap-3 group"
          aria-label="Pitch Partner — Home"
        >
          <div
            className="w-10 h-10 bg-gradient-to-br from-primary to-pitch flex items-center justify-center transition-transform duration-300 group-hover:scale-110 clip-shield"
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                d="M8 16L13 11L18 16L23 11"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 21L13 16L18 21L23 16"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
              />
            </svg>
          </div>
          <span className="text-white font-impact text-lg tracking-wider">
            Pitch Partner
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative text-sm px-4 py-2 transition-all duration-300 font-medium ${
                activeSection === link.href
                  ? "text-white"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {link.label}
              {/* Active indicator — gradient bar underneath */}
              {activeSection === link.href && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-primary to-pitch"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="#"
            className="text-sm text-white/50 hover:text-white transition-colors duration-300 px-4 py-2"
          >
            Sign In
          </a>
          <a
            href="#cta"
            className="text-sm px-5 py-2.5 clip-parallelogram bg-gradient-to-r from-primary to-pitch text-white font-impact tracking-wider hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-px active:translate-y-0"
          >
            Get Started
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <motion.span
            animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-px bg-white block origin-center"
          />
          <motion.span
            animate={mobileOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.15 }}
            className="w-5 h-px bg-white block"
          />
          <motion.span
            animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-5 h-px bg-white block origin-center"
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden bg-midnight/98 backdrop-blur-2xl border-t border-white/5 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className={`text-base py-3 px-4 transition-colors font-medium border-l-2 ${
                    activeSection === link.href
                      ? "text-white border-primary bg-white/[0.04]"
                      : "text-white/60 border-transparent hover:text-white hover:border-white/20"
                  }`}
                >
                  {link.label}
                </motion.a>
              ))}
              <div className="pt-6 mt-4 border-t border-white/5 flex flex-col gap-3">
                <a
                  href="#"
                  className="text-sm text-white/50 py-3 px-4 hover:text-white transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="#cta"
                  onClick={closeMobile}
                  className="text-sm px-5 py-3.5 clip-parallelogram bg-gradient-to-r from-primary to-pitch text-white font-impact tracking-wider text-center"
                >
                  Get Started
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
