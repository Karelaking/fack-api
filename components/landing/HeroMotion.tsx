"use client";

import React, { useEffect, useState } from "react";

/**
 * Gates the hero's ambient and pipeline animations on visibility.
 *
 * The loops are decorative, so they must not burn frames while the hero is
 * scrolled away, and the page has to render complete and static when scripts
 * fail — so the default state is "off" and the markup ships fully visible. The
 * wrapper is `display: contents`, which keeps it out of the layout, and the
 * observer watches `#hero` because a `display: contents` element has no box to
 * intersect with.
 */
export const HeroMotion = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect((): (() => void) => {
    const hero = document.getElementById("hero");
    if (hero === null) {
      return (): void => {};
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return (): void => {};
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        setIsVisible(entries[0]?.isIntersecting ?? false);
      },
      { threshold: 0.15 },
    );

    observer.observe(hero);
    return (): void => observer.disconnect();
  }, []);

  return (
    <div className="contents" data-hero-motion={isVisible ? "on" : "off"}>
      {children}
    </div>
  );
};
