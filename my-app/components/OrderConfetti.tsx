"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function OrderConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => {
      void confetti({
        particleCount: 110,
        spread: 72,
        startVelocity: 32,
        scalar: 0.9,
        origin: { x: 0.5, y: 0.62 },
        colors: ["#111111", "#525252", "#a3a3a3", "#e5e5e5"],
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
