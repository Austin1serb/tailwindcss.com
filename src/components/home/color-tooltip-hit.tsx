"use client";

import { useEffect, useRef } from "react";

interface TooltipOptions {
  offset?: number;
  padding?: number;
  className?: string;
  disableOnTouch?: boolean;
}

/**
 * Tooltip controller using event delegation and RAF-throttled scroll handling.
 * Addresses Chrome/Safari 100ms delay on mouseenter/leave during scroll.
 * @see https://groups.google.com/a/chromium.org/g/blink-dev/c/KIoVljZw5fc/
 */
export function TooltipController({
  offset = 24,
  padding = 6,
  className = "pointer-events-none absolute z-10 top-0 left-0 rounded-full border border-gray-950 bg-gray-950/90 py-0.5 pr-2 pb-1 pl-3 text-center font-mono text-xs/6 font-medium whitespace-nowrap text-white opacity-0 inset-ring inset-ring-white/10 data-[show]:opacity-100 data-[show]:transition-opacity data-[show]:duration-200 data-[show]:delay-100",
  disableOnTouch = true,
}: TooltipOptions = {}) {
  const stateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    active: null as HTMLElement | null,
    tooltip: null as HTMLDivElement | null,
    rafId: 0,
    container: null as HTMLElement | null,
    observer: null as IntersectionObserver | null,
    containerVisible: false,
  });

  useEffect(() => {
    const state = stateRef.current;

    // Check if device has coarse pointer (touch)
    const isTouchDevice = disableOnTouch && window.matchMedia("(pointer: coarse)").matches;
    // Exit early on touch devices
    if (isTouchDevice) {
      return;
    }

    // Create tooltip element once
    const tooltip = document.createElement("div");
    tooltip.id = "v-tooltip";
    tooltip.className = className;
    tooltip.style.cssText = "position:absolute;pointer-events:none;";
    tooltip.setAttribute("role", "tooltip");
    tooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tooltip);
    state.tooltip = tooltip;

    // Position tooltip relative to trigger
    const position = (trigger: HTMLElement) => {
      const el = tooltip;
      if (!el) return;

      const content = trigger.getAttribute("data-tooltip-content");
      if (!content) return;

      // Set text first to measure
      el.textContent = content;

      const r = trigger.getBoundingClientRect();
      const sx = window.pageXOffset;
      const sy = window.pageYOffset;

      const w = el.offsetWidth;
      const minX = sx + padding;
      const maxX = sx + window.innerWidth - padding - w;

      // Center above
      let left = r.left + sx + r.width / 2 - w / 2;
      if (left < minX) left = minX;
      if (left > maxX) left = maxX;

      // Prefer above; flip below if clipped
      let top = r.top + sy - offset;
      if (top < sy + padding) {
        top = r.bottom + sy + 8; // small gap below
      }

      el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    };

    // Show tooltip for trigger
    const show = (trigger: HTMLElement) => {
      if (trigger === state.active || !state.containerVisible) return;

      hide();
      state.active = trigger;
      trigger.dataset.vhover = "true";

      if (state.tooltip) {
        state.tooltip.removeAttribute("data-show");
        position(trigger);
        void state.tooltip.offsetWidth; // Force reflow
        state.tooltip.setAttribute("data-show", "");
      }
    };

    // Hide current tooltip
    const hide = () => {
      if (state.active) {
        delete state.active.dataset.vhover;
        state.active = null;
      }
      state.tooltip?.removeAttribute("data-show");
    };

    // Find container and set up observer
    const setupContainer = () => {
      state.container = document.querySelector("[data-tooltip-container]");

      if (state.container) {
        state.observer = new IntersectionObserver(
          ([entry]) => {
            const wasVisible = state.containerVisible;
            state.containerVisible = entry.isIntersecting;

            if (state.containerVisible && !wasVisible) {
              attachListeners();
            } else if (!state.containerVisible && wasVisible) {
              detachListeners();
              hide();
            }
          },
          { threshold: 0 },
        );
        state.observer.observe(state.container);
      } else {
        // If no container specified, always attach listeners
        state.containerVisible = true;
        attachListeners();
      }
    };

    // Event handlers
    // Universal RAF-throttled update system
    const scheduleUpdate = (updateFn: () => void) => {
      if (state.rafId) return;
      state.rafId = requestAnimationFrame(() => {
        updateFn();
      });
    };

    // Event handlers - all RAF throttled for performance
    const handlePointerMove = (e: PointerEvent) => {
      state.mouseX = e.clientX;
      state.mouseY = e.clientY;
    };

    const handlePointerEnter = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const trigger = e.target?.closest("[data-tooltip-trigger]") as HTMLElement;
      if (trigger) {
        scheduleUpdate(() => show(trigger));
      }
    };

    const handlePointerLeave = (e: Event) => {
      if (!(e.target instanceof Element)) return;
      const trigger = e.target?.closest("[data-tooltip-trigger]") as HTMLElement;
      if (trigger === state.active) {
        scheduleUpdate(() => hide());
      }
    };

    const handleScroll = () => {
      scheduleUpdate(() => {
        // Check what's under the mouse during scroll
        const el = document.elementFromPoint(state.mouseX, state.mouseY) as HTMLElement | null;
        const trigger = el?.closest("[data-tooltip-trigger]") as HTMLElement | null;

        if (trigger !== state.active) {
          trigger ? show(trigger) : hide();
        }
      });
    };

    // Listener management
    const options = { passive: true, capture: true };
    const attachListeners = () => {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerenter", handlePointerEnter, options);
      document.addEventListener("pointerleave", handlePointerLeave, options);
      window.addEventListener("scroll", handleScroll, options);
    };

    const detachListeners = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerenter", handlePointerEnter);
      document.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
    };

    // Setup
    setupContainer();

    // Watch for container changes (in case it's dynamically added)
    // const mutationObserver = new MutationObserver(() => {
    //   if (!state.container) setupContainer();
    // });
    // mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Cleanup
    return () => {
      detachListeners();
      if (state.rafId) cancelAnimationFrame(state.rafId);
      state.observer?.disconnect();
      state.tooltip?.remove();
    };
  }, [className, offset, padding]);

  return null;
}

/**
 * Usage example:
 *
 * // In your layout or page component:
 * <TooltipController />
 *
 * // Add container attribute to your tooltip area:
 * <div data-tooltip-container>
 *   {shades.map((shade, shadeIdx) => (
 *     <div
 *       data-tooltip-trigger
 *       data-tooltip-content="oklch(50.8% 0.118 165.612)"
 *       className="group"
 *     >
 *       <div className="... group-data-[vhover]:opacity-100" />
 *     </div>
 *   ))}
 * </div>
 */
