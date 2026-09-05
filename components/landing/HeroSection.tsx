"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { cn } from "@/lib/utils";

const Hero3DModel = dynamic(
  () =>
    import("@/components/landing/Hero3DModel").then((mod) => mod.Hero3DModel),
  {
    ssr: false,
    loading: (): React.JSX.Element => (
      <Skeleton className="h-115 w-full rounded-3xl" />
    ),
  },
);

const ROTATING_WORDS = ["Synthesize", "Prototype", "Mock", "Deploy"] as const;

export type CollaborateButtonProps = {
  className?: string;
};

/**
 * Interactive call-to-action button for GitHub collaboration and workspace navigation.
 */
export const CollaborateButton = ({
  className = "",
}: CollaborateButtonProps): React.JSX.Element => (
  <Link
    href="/dashboard"
    className={cn(
      "group bg-foreground text-background hover:bg-foreground/90 relative inline-flex h-10 w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent p-1 ps-4 pe-12 text-xs font-semibold shadow-xs transition-all duration-500 select-none hover:ps-12 hover:pe-4",
      className,
    )}
  >
    <span className="relative z-10 whitespace-nowrap transition-all duration-500">
      Try Now
    </span>
    <div className="bg-background text-foreground absolute right-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
      <ArrowUpRight size={16} />
    </div>
  </Link>
);

/**
 * Modern 2-column split hero section with bottom stats matrix & animated number counting.
 */
export const HeroSection = (): React.JSX.Element => {
  const [rotatingIndex, setRotatingIndex] = useState<number>(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const graphicBlockRef = useRef<HTMLDivElement>(null);
  const statsContainerRef = useRef<HTMLDivElement>(null);

  useEffect((): (() => void) => {
    const intervalId = setInterval((): void => {
      setRotatingIndex(
        (prev: number): number => (prev + 1) % ROTATING_WORDS.length,
      );
    }, 2800);
    return (): void => clearInterval(intervalId);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Hero Introduction"
      className="border-border/40 bg-background relative w-full overflow-hidden border-b"
    >
      {/* Main 2-Column Grid */}
      <div className="border-border/40 mx-auto max-w-7xl border-x">
        <div className="divide-border/40 grid grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {/* Left Column — Content & Copy */}
          <div
            ref={leftColRef}
            className="relative flex flex-col justify-between space-y-6 overflow-hidden p-5 sm:space-y-8 sm:p-10 lg:p-14"
          >
            {/* Background Ambient Radial Glow */}
            <div className="pointer-events-none absolute -top-12 -left-12 size-96 rounded-full bg-linear-to-br from-blue-600/15 via-indigo-500/10 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute right-8 bottom-4 size-72 rounded-full bg-linear-to-tr from-cyan-400/10 via-sky-500/10 to-transparent blur-2xl" />

            <header className="relative z-10 space-y-6">
              {/* Headline with Zero Layout Shift Rotating Words */}
              <div className="gsap-animate">
                <h1 className="text-foreground text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="my-0.5 block h-[1.2em] overflow-hidden bg-linear-to-r from-blue-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-cyan-300">
                    <span
                      key={rotatingIndex}
                      className="animate-in slide-in-from-bottom-4 fade-in block duration-500"
                    >
                      {ROTATING_WORDS[rotatingIndex]}
                    </span>
                  </span>
                  <span className="text-foreground block">
                    Mock APIs at the Speed of Thought.
                  </span>
                </h1>
              </div>

              {/* Subheadline Body */}
              <p className="gsap-animate text-muted-foreground max-w-xl text-sm leading-relaxed sm:text-base lg:text-lg">
                Transform complex backend ideas into interactive visual node
                flows. Auto-generate type-safe Faker.js payload models, export
                instant multi-format HTTP mock responses, and simulate edge
                conditions seamlessly.
              </p>

              {/* CTA Cluster */}
              <div className="gsap-animate flex flex-wrap items-center gap-3.5 pt-2">
                <CollaborateButton />

                <Link
                  href="/dashboard"
                  aria-label="Launch interactive schema workspace"
                  className="border-border/60 bg-background/80 hover:bg-muted/50 text-foreground hover:border-foreground/20 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-xs font-semibold backdrop-blur-xs transition-all hover:scale-[1.02] active:scale-[0.98] sm:text-sm"
                >
                  <Layers
                    className="text-muted-foreground size-4"
                    aria-hidden="true"
                  />
                  <span>Launch Workspace</span>
                </Link>
              </div>
            </header>
          </div>

          {/* Right Column — Interactive 3D Schema & Drizzle Model */}
          <div className="bg-muted/5 relative flex min-h-85 items-center justify-center overflow-hidden p-2 sm:min-h-95 sm:p-8 lg:min-h-130 lg:p-12">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

            {/* Interactive 3D Model Component */}
            <div
              ref={graphicBlockRef}
              className="flex h-full w-full items-center justify-center"
            >
              <Hero3DModel />
            </div>
          </div>
        </div>

        {/* Bottom Feature & Metrics Matrix Bar */}
        <div
          ref={statsContainerRef}
          className="border-border/40 divide-border/40 grid grid-cols-1 divide-y border-t sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
        >
          {/* Metric 1 */}
          <article className="flex flex-col justify-between space-y-1.5 p-6 sm:p-7">
            <div>
              <div className="text-foreground font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                <AnimatedCounter
                  targetValue={100}
                  suffix="%"
                  duration={1600}
                  delay={0}
                />
              </div>
              <h2 className="text-foreground mt-1 text-[11px] font-bold tracking-wider uppercase">
                LOCAL & PRIVATE
              </h2>
            </div>
            <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
              Zero server storage. Schema ASTs and API keys stay strictly in
              your local browser storage.
            </p>
          </article>

          {/* Metric 2 */}
          <article className="flex flex-col justify-between space-y-1.5 p-6 sm:p-7">
            <div>
              <div className="text-foreground font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                <AnimatedCounter
                  targetValue={5}
                  suffix=" Methods"
                  duration={1600}
                  delay={200}
                />
              </div>
              <h2 className="text-foreground mt-1 text-[11px] font-bold tracking-wider uppercase">
                NATIVE MOCK ENGINES
              </h2>
            </div>
            <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
              Full syntax & type support for GET, POST, PUT, PATCH, and DELETE
              with custom JSON Schema and Faker.js logic.
            </p>
          </article>

          {/* Metric 3 */}
          <article className="flex flex-col justify-between space-y-1.5 p-6 sm:p-7">
            <div>
              <div className="text-foreground font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                <AnimatedCounter
                  targetValue={10}
                  suffix="x Faster"
                  duration={1600}
                  delay={400}
                />
              </div>
              <h2 className="text-foreground mt-1 text-[11px] font-bold tracking-wider uppercase">
                VISUAL PROTOTYPING
              </h2>
            </div>
            <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
              Instant visual ERD creation with 1-click Drizzle ORM & TypeScript
              code export.
            </p>
          </article>

          {/* Metric 4 */}
          <article className="flex flex-col justify-between space-y-1.5 p-6 sm:p-7">
            <div>
              <div className="text-foreground font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                <AnimatedCounter
                  targetValue={100}
                  suffix="% Automated"
                  duration={1600}
                  delay={600}
                />
              </div>
              <h2 className="text-foreground mt-1 text-[11px] font-bold tracking-wider uppercase">
                REAL-TIME AST VALIDATION
              </h2>
            </div>
            <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
              Automatic background checks scan for missing indexes, foreign key
              constraints, and relation issues.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
};
