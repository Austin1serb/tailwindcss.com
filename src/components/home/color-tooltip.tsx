"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function ColorTooltip({ tooltip, children }: { tooltip: string; children: React.ReactNode }) {
  const swatchRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = () => {
    const swatch = swatchRef.current;
    const tooltip = tooltipRef.current;
    if (!swatch || !tooltip) return;

    // Show tooltip on mouse enter
    tooltip.dataset.show = "true";
    console.log("handleMouseEnter");

    const swatchRect = swatch.getBoundingClientRect();
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

    // Check if it would overflow on the right (using document or clampContainer coordinates)
    const containerRight = window.innerWidth + scrollLeft;
    if (tooltipRight > containerRight) {
      const overflow = tooltipRight - containerRight;
      tooltip.style.left = `${tooltipLeft - overflow - 6}px`;
    }
  };

  const handleMouseLeave = () => {
    // Hide tooltip on mouse leave
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.dataset.show = "false";
    }
  };

  return (
    <div
      ref={swatchRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-tooltip-swatch
    >
      {children}

      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            data-show="false"
            data-tooltip
            className="pointer-events-none absolute z-10 translate-y-2 rounded-full border border-gray-950 bg-gray-950/90 pt-0.5 pr-2 pb-1 pl-3 text-center font-mono text-xs/6 font-medium whitespace-nowrap text-white opacity-0 inset-ring inset-ring-white/10 data-[show=true]:opacity-100 data-[show=true]:transition-[opacity] data-[show=true]:delay-100 data-[show=true]:duration-200"
          >
            {tooltip}
          </div>,
          document.body,
        )}
    </div>
  );
}
