import React from "react";
import { ArrowDown } from "lucide-react";
import { RiGithubFill } from "@remixicon/react";
import { CollaborateButton } from "@/components/landing/CollaborateButton";
import { HeroMotion } from "@/components/landing/HeroMotion";

/**
 * The landing hero: one viewport of type and air.
 *
 * The previous hero carried the whole mechanism — a copyable quick-start, a
 * three-stage pipeline, and the facts matrix — above the fold. Those now live
 * in `HowToStartSection`, directly below, so the first screen can do the one
 * job a hero has: state what this is, and offer the way in.
 *
 * Composition is deliberately sparse. A display face carries two sentences at
 * poster scale, the second one muted so the product's promise reads as the
 * quieter half of a pair. The only drawing is a blueprint grid revealed under
 * the pointer and a faint node graph behind it; `HeroMotion` writes the
 * pointer position, so nothing here moves on its own.
 */
export const HeroSection = (): React.JSX.Element => {
  return (
    <HeroMotion>
      <section
        id="hero"
        aria-label="Hero Introduction"
        className="hero-atmosphere border-border/40 bg-background relative isolate -mt-20 w-full overflow-hidden border-b pt-20"
      >
        {/* Pointer-tracked atmosphere, clipped to the same max-w-7xl column that
            draws the hero's side borders. Static — no JS, reduced motion, or a
            pointer that never moves — it rests composed around 68% / 34%.
            Spanning the section instead let the grid lines and node graph run
            past those borders into the page margins. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-7xl overflow-hidden"
        >
          <div className="hero-grid absolute inset-0" />
          <div className="hero-spotlight absolute inset-0" />

          <svg
            viewBox="0 0 640 640"
            fill="none"
            className="hero-graph absolute top-[48%] right-[-24%] block h-[min(62svh,440px)] w-auto opacity-30 sm:right-[-8%] sm:h-[min(66vh,540px)] sm:opacity-40 xl:top-1/2 xl:right-0 xl:h-[min(76vh,680px)] xl:-translate-y-1/2 xl:opacity-100"
          >
            <g strokeWidth="1" vectorEffect="non-scaling-stroke">
              <path
                className="hero-graph-edge stroke-primary/40"
                pathLength={1}
                d="M120 500 L300 380"
              />
              <path
                className="hero-graph-edge stroke-foreground/15"
                pathLength={1}
                d="M300 380 L500 250"
              />
              <path
                className="hero-graph-edge stroke-foreground/12"
                pathLength={1}
                d="M300 380 L300 140"
              />
              <path
                className="hero-graph-edge stroke-foreground/12"
                pathLength={1}
                d="M300 380 L520 520"
              />
            </g>

            {/* Loose data points, so the field reads as a canvas and not a
                diagram with three convenient nodes. */}
            <g className="fill-foreground/20">
              <circle cx="90" cy="220" r="1.5" />
              <circle cx="210" cy="120" r="1.5" />
              <circle cx="430" cy="170" r="1.5" />
              <circle cx="560" cy="360" r="1.5" />
              <circle cx="200" cy="580" r="1.5" />
              <circle cx="420" cy="600" r="1.5" />
              <circle cx="90" cy="360" r="1.5" />
              <circle cx="480" cy="420" r="1.5" />
            </g>

            <g vectorEffect="non-scaling-stroke">
              <circle
                className="hero-graph-node hero-graph-node--1 fill-background stroke-foreground/25"
                cx="120"
                cy="500"
                r="14"
                strokeWidth="1"
              />
              <circle
                className="fill-foreground/60"
                cx="120"
                cy="500"
                r="3.5"
              />

              <circle
                className="hero-graph-node hero-graph-node--2 fill-background stroke-primary/50"
                cx="300"
                cy="380"
                r="22"
                strokeWidth="1"
              />
              <circle
                className="hero-graph-node hero-graph-node--2 fill-primary/80"
                cx="300"
                cy="380"
                r="6"
              />

              <circle
                className="hero-graph-node hero-graph-node--3 fill-background stroke-foreground/25"
                cx="500"
                cy="250"
                r="14"
                strokeWidth="1"
              />
              <circle
                className="fill-foreground/60"
                cx="500"
                cy="250"
                r="3.5"
              />

              <circle
                className="hero-graph-node hero-graph-node--3 fill-background stroke-foreground/20"
                cx="300"
                cy="140"
                r="9"
                strokeWidth="1"
              />

              <circle
                className="hero-graph-node hero-graph-node--3 fill-background stroke-foreground/20"
                cx="520"
                cy="520"
                r="9"
                strokeWidth="1"
              />
            </g>
          </svg>
        </div>

        <div className="border-border/40 relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-7xl flex-col border-x px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 flex-col justify-center py-10 sm:py-16 lg:py-20">
            <h1 className="font-display text-foreground text-[clamp(2.25rem,10.5vw,5.75rem)] leading-[0.94] font-medium tracking-[-0.04em] text-balance">
              <span className="hero-line block">Design the mock API</span>
              <span className="hero-line hero-line--2 block">on a canvas.</span>
              <span className="hero-line hero-line--3 text-muted-foreground hover:text-foreground mt-[0.16em] block transition-colors duration-500">
                Serve it from your
              </span>
              <span className="hero-line hero-line--4 text-muted-foreground hover:text-foreground block transition-colors duration-500">
                own machine.
              </span>
            </h1>

            <p className="hero-tier hero-tier--lead text-muted-foreground mt-6 max-w-[38ch] text-base leading-relaxed text-pretty sm:mt-8 sm:text-lg">
              Build and test independently of a backend that is not ready.
            </p>

            <div className="hero-tier hero-tier--actions mt-7 flex flex-col items-start gap-3 sm:mt-9 sm:flex-row sm:items-center sm:gap-4">
              <CollaborateButton
                href="/dashboard"
                label="Open the canvas"
                size="lg"
                className="w-full sm:w-auto"
              />
              <a
                href="https://github.com/Karelaking/fack-api"
                target="_blank"
                rel="noopener noreferrer"
                className="group border-border/40 text-foreground hover:border-border hover:bg-muted/50 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors sm:w-auto"
              >
                <RiGithubFill
                  className="size-4 transition-transform duration-300 group-hover:-rotate-6"
                  aria-hidden="true"
                />
                <span>View the source</span>
              </a>
            </div>
          </div>

          <div className="hero-tier hero-tier--meta border-border/40 flex flex-col gap-4 border-t py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-caption flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono tracking-[0.14em] uppercase">
              <span className="hover:text-foreground transition-colors duration-300">
                Self-hosted
              </span>
              <span
                aria-hidden="true"
                className="bg-border size-1 rounded-full"
              />
              <span className="hover:text-foreground transition-colors duration-300">
                One SQLite file
              </span>
              <span
                aria-hidden="true"
                className="bg-border size-1 rounded-full"
              />
              <span className="hover:text-foreground transition-colors duration-300">
                MIT licensed
              </span>
            </p>

            <a
              href="#how-to-start"
              className="text-muted-foreground hover:text-foreground group text-caption inline-flex min-h-6 w-fit items-center gap-2 py-1.5 font-mono tracking-[0.14em] uppercase transition-colors duration-300"
            >
              <span>How to start</span>
              <ArrowDown
                className="size-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </section>
    </HeroMotion>
  );
};
