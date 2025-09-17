"use client";

import { useRef } from "react";

export function ColorTooltip({ color, tooltip, shadeIdx }: { color: string; tooltip: string; shadeIdx: number }) {
  const swatchRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    const swatch = swatchRef.current;
    const tooltip = tooltipRef.current;
    if (!swatch || !tooltip) return;

    // Find the clamping container
    const clampContainer = tooltip.closest("[data-tooltip-clamp]");
    if (!clampContainer) return;

    const swatchRect = swatch.getBoundingClientRect();
    const containerRect = clampContainer.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth; // Use offsetWidth to get the actual width

    // Calculate where the tooltip will be when centered
    const swatchCenter = swatchRect.left + swatchRect.width / 2;
    const tooltipLeft = swatchCenter - tooltipWidth / 2;
    const tooltipRight = tooltipLeft + tooltipWidth;

    // Check if it would overflow on the right
    if (tooltipRight > containerRect.right) {
      const overflow = tooltipRight - containerRect.right;

      tooltip.style.transform = `translateX(-${overflow}px)`;
    } else {
      // Reset to default center alignment
      return;
    }
  };

  return (
    <div ref={swatchRef} className="group/swatch relative" onMouseEnter={handleMouseEnter}>
      {shadeIdx === 0 && (
        <>
          <div className="pointer-events-none absolute -top-1 -left-1 h-screen border-l border-gray-950/5 dark:border-white/10" />
          <div className="pointer-events-none absolute -top-1 -left-1 h-16 origin-top-left translate-px rotate-225 border-l border-gray-950/5 sm:h-24 dark:border-white/10" />
        </>
      )}

      <div
        className="h-(--height) w-(--width) bg-(--color) inset-ring inset-ring-gray-950/10 transition-opacity group-hover:opacity-75 hover:opacity-100 dark:inset-ring-white/10"
        style={{ "--color": `var(--color-${color})` } as React.CSSProperties}
      />

      <div
        ref={tooltipRef}
        className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-full border border-gray-950 bg-gray-950/90 pt-0.5 pr-2 pb-1 pl-3 text-center font-mono text-xs/6 font-medium whitespace-nowrap text-white opacity-0 inset-ring inset-ring-white/10 transition-[opacity] duration-300 group-hover/swatch:opacity-100 group-hover/swatch:delay-100"
      >
        {tooltip}
      </div>
    </div>
  );
}
