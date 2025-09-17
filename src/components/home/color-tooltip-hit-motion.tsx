"use client";
import { motion } from "motion/react";
export function ColorTooltipHit() {
  return (
    <motion.div
      id="color-tooltip-hit"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      whileInView={{ x: [0, 0.0001] }}
      transition={{ repeat: Infinity, repeatDelay: 0.1, duration: 0, repeatType: "mirror" }}
    />
  );
}
