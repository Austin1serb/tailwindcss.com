"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDisposables } from "../../../node_modules/@headlessui/react/dist/hooks/use-disposables";

export function ColorTooltip({ color, tooltip, shadeIdx }: { color: string; tooltip: string; shadeIdx: number }) {
  const swatchRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const disposables = useDisposables();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    const swatch = swatchRef.current;
    const tooltip = tooltipRef.current;
    if (!swatch || !tooltip) return;

    // Show tooltip
    tooltip.dataset.show = "true";

    // Find the clamping container
    const clampContainer = swatch.closest("[data-tooltip-clamp]");
    if (!clampContainer) return;

    const swatchRect = swatch.getBoundingClientRect();
    // const containerRect = clampContainer.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;

    // Convert to document coordinates (not viewport)
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const swatchCenter = swatchRect.left + scrollLeft + swatchRect.width / 2;
    const tooltipLeft = swatchCenter - tooltipWidth / 2;
    const tooltipRight = tooltipLeft + tooltipWidth;
    const tooltipTop = swatchRect.top + scrollTop - 32; // 32px above

    tooltip.style.left = `${tooltipLeft}px`;
    tooltip.style.top = `${tooltipTop}px`;

    // Check if it would overflow on the right (using document coordinates)
    // const containerRight = containerRect.right + scrollLeft;
    const containerRight = window.innerWidth + scrollLeft;
    if (tooltipRight > containerRight) {
      const overflow = tooltipRight - containerRight;
      tooltip.style.left = `${tooltipLeft - overflow - 6}px`;
    }
  };

  const handleMouseLeave = () => {
    console.log("handleMouseLeave");
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.dataset.show = "false";
    }
  };

  return (
    <div ref={swatchRef} className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
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

      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            data-show="false"
            className="pointer-events-none absolute z-[9999] translate-y-2 rounded-full border border-gray-950 bg-gray-950/90 pt-0.5 pr-2 pb-1 pl-3 text-center font-mono text-xs/6 font-medium whitespace-nowrap text-white opacity-0 inset-ring inset-ring-white/10 data-[show=true]:opacity-100 data-[show=true]:transition-[opacity] data-[show=true]:delay-100 data-[show=true]:duration-200"
          >
            {tooltip}
          </div>,
          document.body,
        )}
    </div>
  );
}
