"use client";

import React from "react";
import {
  Zap,
  Layers,
  Cpu,
  Code2,
  Sparkles,
  Network,
  FileCode,
} from "lucide-react";

/**
 * Prominent, high-impact Logo Cloud section with an infinitely running marquee animation.
 * Features tech stack logos (Faker.js, Next.js, SQLite, TypeScript, Drizzle ORM, React Flow, Zustand, OpenAPI).
 */
export const LogoCloudSection = (): React.JSX.Element => {
  const logos = [
    {
      id: "faker",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/15 text-purple-400 sm:size-9">
            <Sparkles className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-mono font-black tracking-tighter">
            faker.js
          </span>
        </div>
      ),
    },
    {
      id: "nextjs",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="bg-foreground text-background flex size-8 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black shadow-xs sm:size-9 sm:text-base">
            N
          </div>
          <span className="text-foreground font-sans font-black tracking-tight">
            Next.js
          </span>
        </div>
      ),
    },
    {
      id: "sqlite",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/15 text-sky-400 sm:size-9">
            <Layers className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-mono font-black tracking-tight">
            SQLite
          </span>
        </div>
      ),
    },
    {
      id: "typescript",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400 sm:size-9">
            <Code2 className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-sans font-black tracking-tight">
            TypeScript
          </span>
        </div>
      ),
    },
    {
      id: "drizzle",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-500 sm:size-9">
            <Zap className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-mono font-black tracking-tighter">
            drizzle.orm
          </span>
        </div>
      ),
    },
    {
      id: "reactflow",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400 sm:size-9">
            <Network className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-sans font-black tracking-tight">
            React Flow
          </span>
        </div>
      ),
    },
    {
      id: "zustand",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 sm:size-9">
            <Cpu className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-sans font-black tracking-tight">
            Zustand
          </span>
        </div>
      ),
    },
    {
      id: "openapi",
      content: (
        <div className="text-foreground flex items-center gap-3 text-base font-extrabold tracking-tight transition-opacity hover:opacity-100 sm:text-lg md:text-xl">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/15 text-teal-400 sm:size-9">
            <FileCode className="size-5 sm:size-6" />
          </div>
          <span className="text-foreground font-mono font-black tracking-tight">
            OpenAPI 3.0
          </span>
        </div>
      ),
    },
  ];

  return (
    <section className="border-border/40 bg-background relative w-full overflow-hidden border-b">
      <div className="border-border/40 mx-auto flex max-w-7xl flex-col items-center justify-center border-x px-6 py-8 sm:px-10 sm:py-10">
        {/* Infinite Scrolling Marquee Container */}
        <div className="relative w-full flex-1 overflow-hidden py-2">
          {/* Gradient Masks on Edges */}
          <div className="from-background via-background/80 pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r to-transparent" />
          <div className="from-background via-background/80 pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l to-transparent" />

          {/* Marquee Track */}
          <div className="hover:paused flex w-max animate-[marquee_35s_linear_infinite] items-center gap-16 sm:gap-24">
            {/* Set 1 */}
            {logos.map((logo, idx) => (
              <React.Fragment key={`logo-1-${idx}`}>
                {logo.content}
              </React.Fragment>
            ))}

            {/* Set 2 (Duplicate for Seamless Loop) */}
            {logos.map((logo, idx) => (
              <React.Fragment key={`logo-2-${idx}`}>
                {logo.content}
              </React.Fragment>
            ))}

            {/* Set 3 (Triple for Ultra-Wide Screens) */}
            {logos.map((logo, idx) => (
              <React.Fragment key={`logo-3-${idx}`}>
                {logo.content}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </section>
  );
};
