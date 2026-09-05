"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Zap,
  Code2,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";

export const FeaturesSection = (): React.JSX.Element => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsGridRef = useRef<HTMLDivElement>(null);

  useEffect((): (() => void) => {
    const node = cardsGridRef.current;
    if (!node) {
      return (): void => {};
    }

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]): void => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          const cards = Array.from(node.children) as HTMLElement[];
          cards.forEach((card: HTMLElement, index: number): void => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0) scale(1)";
            card.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80}ms`;
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    return (): void => {
      observer.disconnect();
    };
  }, []);

  const features = [
    {
      icon: Zap,
      badge: "Flow Canvas",
      title: "Visual Flow Canvas",
      description:
        "Construct API schema nodes, define route parameters, and draw relation edges using a responsive React Flow interactive canvas.",
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/15 border-sky-500/30",
    },
    {
      icon: Sparkles,
      badge: "Faker.js",
      title: "20+ Faker.js Generators",
      description:
        "Synthesize realistic users, transactions, UUIDs, dates, and addresses automatically powered by @faker-js/faker.",
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/15 border-purple-500/30",
    },
    {
      icon: Activity,
      badge: "Chaos Engine",
      title: "Chaos & Latency Injector",
      description:
        "Simulate real-world network edge cases: status code errors (404, 500), response delays (100ms - 5000ms), and custom HTTP headers.",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/15 border-amber-500/30",
    },
    {
      icon: ShieldCheck,
      badge: "Local First",
      title: "Client-Side SQLite Engine",
      description:
        "100% offline & private. All schema definitions, route configs, and execution logs remain strictly within local SQLite storage.",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/15 border-emerald-500/30",
    },
    {
      icon: Code2,
      badge: "DTO & OpenAPI",
      title: "1-Click DTO Export",
      description:
        "Instantly generate TypeScript interfaces, Drizzle ORM schemas, or OpenAPI 3.0 spec files ready to paste into your codebase.",
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/15 border-cyan-500/30",
    },
    {
      icon: Terminal,
      badge: "Zero Latency",
      title: "Zero-Latency Mocks",
      description:
        "Lightning-fast mock response generation with built-in memory caching and dynamic route path pattern matching.",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/15 border-rose-500/30",
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="features"
      aria-label="Key Features"
      className="border-border/40 bg-background relative w-full overflow-hidden border-b"
    >
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-125 rounded-full bg-linear-to-tr from-blue-600/10 via-indigo-500/10 to-cyan-400/10 blur-3xl" />
      </div>

      <div className="border-border/40 relative z-10 mx-auto max-w-7xl border-x">
        {/* Section Header */}
        <header className="mx-auto max-w-3xl space-y-4 px-4 pt-16 pb-14 text-center md:pt-24">
          <h2 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Everything You Need for Modern Mock APIs & Schema Architecture
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm leading-relaxed sm:text-base">
            Built from the ground up to empower developers, QA engineers, and
            frontend teams with visual, type-safe API simulation tools.
          </p>
        </header>

        {/* 6-Grid Framed Card Matrix with Perfect Grid Borders & Micro-Animations */}
        <div
          ref={cardsGridRef}
          className="border-border/40 grid grid-cols-1 border-t md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <article
                key={idx}
                className="border-border/40 bg-card/30 hover:bg-card/75 group relative flex flex-col justify-between space-y-4 overflow-hidden border-r border-b px-6 py-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/5 sm:px-8 sm:py-6 md:max-lg:nth-[2n]:border-r-0 lg:nth-[3n]:border-r-0 lg:nth-[n+4]:border-b-0"
              >
                {/* Micro-Animation: Ambient Card Hover Glow */}
                <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-linear-to-br from-blue-500/10 via-indigo-500/10 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative z-10">
                  <div className="mb-3.5 flex items-center justify-between">
                    {/* Micro-Animation: Icon Container Scale & Rotate */}
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-md ${feat.iconBg}`}
                    >
                      <Icon
                        className={`size-4.5 transition-transform duration-300 group-hover:scale-110 ${feat.iconColor}`}
                        aria-hidden="true"
                      />
                    </div>

                    {/* Micro-Animation: Badge Hover Transition */}
                    <span className="text-muted-foreground border-border/60 bg-muted/40 group-hover:border-border group-hover:text-foreground rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-300">
                      {feat.badge}
                    </span>
                  </div>

                  {/* Micro-Animation: Title Slide & Accent */}
                  <h3 className="text-foreground mb-1.5 text-base font-bold tracking-tight transition-all duration-300 group-hover:translate-x-0.5 sm:text-lg">
                    {feat.title}
                  </h3>

                  <p className="text-muted-foreground group-hover:text-foreground/80 text-xs leading-relaxed transition-colors duration-300">
                    {feat.description}
                  </p>
                </div>

                {/* Micro-Animation: Full-Width High-Contrast Action CTA Bar */}
                <div className="border-border/40 relative z-10 border-t pt-3">
                  <Link
                    href="/dashboard"
                    className="bg-muted/40 group-hover:bg-foreground group-hover:text-background border-border/60 group-hover:border-foreground flex w-full cursor-pointer items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-bold shadow-xs transition-all duration-300"
                    aria-label={`Explore ${feat.title}`}
                  >
                    <span>Explore Feature</span>
                    <div className="bg-background group-hover:bg-background/20 border-border/60 group-hover:border-background/30 flex size-5 shrink-0 items-center justify-center rounded border transition-colors">
                      <ArrowRight
                        className="text-foreground group-hover:text-background size-3 transition-all duration-300 group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </div>

                {/* Micro-Animation: Expandable Bottom Laser Line Beam */}
                <div className="absolute right-0 bottom-0 left-0 h-0.5 origin-left scale-x-0 bg-linear-to-r from-sky-400 via-indigo-400 to-cyan-300 transition-transform duration-500 group-hover:scale-x-100" />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
