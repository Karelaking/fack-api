"use client";

import React, { useEffect } from "react";

/**
 * Writes the pointer's position into the hero as CSS custom properties.
 *
 * The hero's only ambient drawing — the blueprint grid and the node graph —
 * tracks the cursor through `--hero-mx` / `--hero-my` (percent inside the
 * hero) and `--hero-x` / `--hero-y` (unitless, -1..1 from the centre). The
 * properties are set on `#hero` itself so they beat the resting values the
 * `.hero-atmosphere` class declares; the wrapper is `display: contents` and
 * adds no box.
 *
 * Nothing loops: the layer only moves while the pointer moves, and it eases
 * back to its composed resting position when the pointer leaves. Reduced
 * motion is served the static composition and no listener is attached.
 */
export const HeroMotion = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  useEffect((): (() => void) => {
    const hero = document.getElementById("hero");
    if (hero === null) {
      return (): void => {};
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return (): void => {};
    }

    let frame = 0;
    let clientX = 0;
    let clientY = 0;

    const write = (): void => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const x = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((clientY - rect.top) / rect.height, 0), 1);

      hero.style.setProperty("--hero-mx", `${(x * 100).toFixed(2)}%`);
      hero.style.setProperty("--hero-my", `${(y * 100).toFixed(2)}%`);
      hero.style.setProperty("--hero-x", (x * 2 - 1).toFixed(4));
      hero.style.setProperty("--hero-y", (y * 2 - 1).toFixed(4));
    };

    const handleMove = (event: PointerEvent): void => {
      clientX = event.clientX;
      clientY = event.clientY;
      if (frame === 0) {
        frame = requestAnimationFrame(write);
      }
    };

    const handleLeave = (): void => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      hero.style.removeProperty("--hero-mx");
      hero.style.removeProperty("--hero-my");
      hero.style.removeProperty("--hero-x");
      hero.style.removeProperty("--hero-y");
    };

    hero.addEventListener("pointermove", handleMove, { passive: true });
    hero.addEventListener("pointerleave", handleLeave);

    return (): void => {
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
      hero.removeEventListener("pointermove", handleMove);
      hero.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return <div className="contents">{children}</div>;
};
