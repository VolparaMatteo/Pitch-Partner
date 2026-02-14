"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

function formatNumber(n: number, decimals: number): string {
  if (decimals > 0) return n.toFixed(decimals);
  const rounded = Math.floor(n);
  return rounded >= 1000 ? rounded.toLocaleString("en-US") : String(rounded);
}

export default function AnimatedCounter({
  target,
  suffix = "",
  decimals = 0,
}: {
  target: number;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (!isInView) return;
    setFlipping(true);
    const duration = 2000;
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      const value = progress * target;

      if (frame >= totalFrames) {
        setCount(target);
        setFlipping(false);
        clearInterval(timer);
      } else {
        setCount(value);
      }
    }, 1000 / fps);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span
      ref={ref}
      className="inline-block tabular-nums"
      style={{
        perspective: "400px",
        transform: flipping ? `rotateX(${Math.sin(count * 0.3) * 3}deg)` : "rotateX(0deg)",
        transition: "transform 0.05s ease-out",
      }}
    >
      {formatNumber(count, decimals)}
      {suffix}
    </span>
  );
}
