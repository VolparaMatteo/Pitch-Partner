import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import ProblemSolution from "@/components/ProblemSolution";
import FeaturesOverview from "@/components/FeaturesOverview";
import ForClubs from "@/components/ForClubs";
import ForSponsors from "@/components/ForSponsors";
import HowItWorks from "@/components/HowItWorks";
import Stats from "@/components/Stats";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import CursorGlow from "@/components/CursorGlow";
import ScrollToTop from "@/components/ScrollToTop";

function DiagonalDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className="relative h-16 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 1440 64"
        fill="none"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        <line
          x1={flip ? "0" : "1440"}
          y1="20"
          x2={flip ? "1440" : "0"}
          y2="44"
          stroke="url(#divGrad1)"
          strokeWidth="1"
        />
        <line
          x1={flip ? "0" : "1440"}
          y1="28"
          x2={flip ? "1440" : "0"}
          y2="52"
          stroke="url(#divGrad2)"
          strokeWidth="0.5"
        />
        <defs>
          <linearGradient id="divGrad1" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="transparent" />
            <stop offset="0.5" stopColor="rgba(26, 86, 219, 0.4)" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
          <linearGradient id="divGrad2" x1="0" y1="0" x2="1440" y2="0">
            <stop stopColor="transparent" />
            <stop offset="0.5" stopColor="rgba(22, 163, 74, 0.3)" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <CursorGlow />
      <Navbar />
      <main id="main">
        <Hero />
        <TrustBar />
        <DiagonalDivider />
        <ProblemSolution />
        <DiagonalDivider flip />
        <FeaturesOverview />
        <DiagonalDivider />
        <ForClubs />
        <DiagonalDivider flip />
        <ForSponsors />
        <DiagonalDivider />
        <HowItWorks />
        <Stats />
        <DiagonalDivider flip />
        <Testimonials />
        <DiagonalDivider />
        <Pricing />
        <CTA />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
