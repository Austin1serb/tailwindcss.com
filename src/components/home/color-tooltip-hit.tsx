"use client";

import { useEffect, useRef } from "react";

interface TooltipOptions {
  offset?: number;
  padding?: number;
  marginTop?: number;
  className?: string;
  disableOnTouchDevice?: boolean;
  offsetY?: number;
}

type State = {
  mouseX: number;
  mouseY: number;
  active: HTMLElement | null;
  tooltip: HTMLDivElement | null;
  rafId: number;
};

/**
 * Minimal listeners: pointermove + scroll (+ pointerleave fail-safe).
 * Coalesces work via rAF and positions with transforms.
 ** Address Chrome/Safari delay mouseEvents on scroll using elementFromPoint.
 * ISSUE:
 * @see https://codereview.chromium.org/1157303006/
 * // proposed usage by Chrome team:
 * @see https://groups.google.com/a/chromium.org/g/blink-dev/c/KIoVljZw5fc/#:~:text=In%20the%20interim,an%20API%20natively.

 */
export function InitTooltip({
  padding = 6,
  marginTop = 86, // header height + trigger height
  offsetY = -22, // negative = move up, positive = move down
  className = "pointer-events-none absolute z-10 top-0 left-0 rounded-full border border-gray-950 bg-gray-950/90 py-0.5 pr-2 pb-1 pl-3 text-center font-mono text-xs/6 font-medium whitespace-nowrap text-white opacity-0 inset-ring inset-ring-white/10 data-[show]:opacity-100 data-[show]:transition-opacity data-[show]:duration-200 data-[show]:delay-100 will-change-[transform,opacity]",
  disableOnTouchDevice = false,
}: TooltipOptions = {}) {
  const stateRef = useRef<State>({
    mouseX: 0,
    mouseY: 0,
    active: null,
    tooltip: null,
    rafId: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const state = stateRef.current;

    // Exit early on coarse pointers if requested
    if (disableOnTouchDevice && window.matchMedia("(pointer: coarse)").matches) return;

    // Create tooltip element once
    const tooltip = document.createElement("div");
    tooltip.id = "v-tooltip";
    tooltip.className = className;
    tooltip.style.cssText = "position:absolute;pointer-events:none;";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    // set in DOM
    document.body.appendChild(tooltip);
    // set in state
    state.tooltip = tooltip;
    // fallback to body

    const position = (trigger: HTMLElement) => {
      const el = state.tooltip;
      if (!el) return;

      const content = trigger.getAttribute("data-tooltip-content");
      if (!content) return;

      // Set text first to measure intrinsic width
      el.textContent = content;

      const triggerRect = trigger.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY; // header height

      // width is not stable: min and max x calculations necessary
      const tipWidth = el.offsetWidth;
      const minLeft = scrollX + padding;
      const maxLeft = scrollX + window.innerWidth - padding - tipWidth;

      // Center above trigger
      let xPosition = triggerRect.left + scrollX + triggerRect.width / 2 - tipWidth / 2;
      xPosition = Math.max(minLeft, Math.min(xPosition, maxLeft));

      // Prefer above; flip below if clipped (account for topbar w/ marginTop)
      let yPosition = triggerRect.top + scrollY + offsetY;
      if (yPosition < scrollY + marginTop) {
        // offset height is stable after the first render
        yPosition = triggerRect.bottom + scrollY + padding + offsetY;
      }

      el.style.transform = `translate3d(${xPosition}px, ${yPosition}px, 0)`;
    };

    const hide = () => {
      if (state.active) {
        delete state.active.dataset.tooltipHover;
        state.active = null;
      }
      state.tooltip?.removeAttribute("data-show");
    };

    const show = (trigger: HTMLElement) => {
      // Swap active
      hide();
      trigger.dataset.tooltipHover = "true";
      state.active = trigger;

      if (state.tooltip) {
        state.tooltip.removeAttribute("data-show");
        position(trigger);
        state.tooltip.setAttribute("data-show", "");
      }
    };
    const scheduleUpdate = () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(() => {
        state.rafId = 0;

        const el = document.elementFromPoint(state.mouseX, state.mouseY) as HTMLElement | null;
        let trigger = el?.closest("[data-tooltip-trigger]") as HTMLElement | null;

        if (trigger !== state.active) {
          trigger ? show(trigger) : hide();
        }
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
      scheduleUpdate();
    };

    const handleScroll = () => scheduleUpdate();

    const handlePointerLeave = () => hide();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    return () => {
      if (state.rafId) cancelAnimationFrame(state.rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
      state.tooltip?.remove();
    };
  }, [className, padding, marginTop, disableOnTouchDevice, offsetY]);

  return null;
}

/**
 * Usage:
 * <InitTooltip />
 * <div
 * data-tooltip-trigger
 * data-tooltip-content="Hello!">
 * <div className="data-[tooltip-hover=true]:bg-red-500"> // hover effects (use group-hover if element is nested)
    {children}
  </div>
 * </div>
 */
