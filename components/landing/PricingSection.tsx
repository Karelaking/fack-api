"use client";

import React from "react";
import Link from "next/link";
import { Check, HardDrive, Server, ArrowRight } from "lucide-react";
import { RiGithubFill } from "@remixicon/react";

/**
 * Open Source Storage Options & Licensing section styled in Hero grid theme.
 */
export const PricingSection = (): React.JSX.Element => {
  return (
    <section
      id="pricing"
      aria-label="Storage Options and Licensing"
      className="bg-background relative w-full overflow-hidden"
    >
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-125 rounded-full bg-linear-to-tr from-blue-600/10 via-indigo-500/10 to-cyan-400/10 blur-3xl" />
      </div>

      <div className="border-border/40 relative z-10 mx-auto max-w-7xl border-x">
        {/* Section Header */}
        <header className="mx-auto max-w-full space-y-4 px-4 pt-16 pb-14 text-center md:pt-24">
          <h2 className="text-foreground mx-auto w-full px-2 text-3xl leading-[1.02] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[8rem]">
            100% Free & Open Source. Zero Vendor Lock-in.
          </h2>
          <p className="text-muted-foreground mx-auto max-w-3xl text-sm leading-relaxed sm:text-base md:text-lg">
            Run Fack API on your own machine or infrastructure and store mock
            routes in your own database. You retain 100% ownership of your mock
            schema data.
          </p>
        </header>

        {/* 2-Column Framed Grid */}
        <div className="border-border/40 divide-border/40 grid grid-cols-1 divide-y border-t md:grid-cols-2 md:divide-x md:divide-y-0">
          {/* Option 1: Local Disk Storage */}
          <article className="bg-card/30 hover:bg-card/60 flex flex-col justify-between space-y-8 p-8 transition-colors sm:p-12">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 text-xl font-extrabold">
                  <HardDrive className="text-info size-5" aria-hidden="true" />
                  Local-First Self-Hosted
                </h3>
                <span className="text-muted-foreground bg-muted/60 border-border/60 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                  100% Private
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Store route schemas and mock definitions in a local SQLite
                database on your own machine. Runs fully offline with no
                third-party dependencies.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-foreground font-mono text-4xl font-extrabold">
                  $0
                </span>
                <span className="text-muted-foreground text-xs">
                  / Free & Open Source
                </span>
              </div>

              <ul className="text-foreground mt-8 space-y-3 text-xs font-medium">
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>SQLite persistence on your own machine</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Instant local auto-save & workspace sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Portable single-file OpenAPI & JSON schema export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>No paywalls, no usage limits, no vendor lock-in</span>
                </li>
              </ul>
            </div>

            <Link
              href="/dashboard"
              aria-label="Launch Local Workspace"
              className="border-border/80 bg-background text-foreground hover:bg-muted inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border px-6 py-3 text-center text-xs font-bold shadow-xs transition-all sm:text-sm"
            >
              <span>Launch Local Workspace</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </article>

          {/* Option 2: Self-Hosted Container */}
          <article className="bg-card/30 hover:bg-card/60 flex flex-col justify-between space-y-8 p-8 transition-colors sm:p-12">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-foreground flex items-center gap-2 text-xl font-extrabold">
                  <Server
                    className="size-5 text-indigo-400"
                    aria-hidden="true"
                  />
                  Self-Hosted & Docker
                </h3>
                <span className="text-muted-foreground bg-muted/60 border-border/60 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase">
                  Self-Hosted
                </span>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Deploy Fack API on your own infrastructure with Docker, Vercel,
                or local Node.js. Run mock endpoints in your internal networks.
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-foreground font-mono text-4xl font-extrabold">
                  MIT License
                </span>
              </div>

              <ul className="text-foreground mt-8 space-y-3 text-xs font-medium">
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Multi-endpoint simulated HTTP routes & latency delays
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Complete offline control with custom Faker.js seeds
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Docker container & docker-compose ready to run</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check
                    className="text-success size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>100% Free for commercial & open-source projects</span>
                </li>
              </ul>
            </div>

            <a
              href="https://github.com/Karelaking/fack-api"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
              className="bg-foreground text-background inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-md transition-all hover:opacity-90 sm:text-sm"
            >
              <RiGithubFill className="size-4" aria-hidden="true" />
              <span>View on GitHub</span>
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </a>
          </article>
        </div>
      </div>
    </section>
  );
};
