"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  RiArrowRightUpLine,
  RiStackLine,
  RiDatabase2Line,
  RiCodeSSlashLine,
  RiCheckLine,
  RiSparklingLine,
  RiMoonLine,
  RiSunLine,
  RiCloseLine,
  RiGithubFill,
  RiSpeedUpLine,
  RiPulseLine,
  RiLockLine,
  RiFileCodeLine,
  RiPlayFill,
  RiTimeLine,
  RiSearchLine,
  RiSettings3Line,
} from "@remixicon/react";
import { Button } from "@/components/ui/button";

const emptySubscribe = (): (() => void) => (): void => {};

// Preset mock responses for live playground demo
const mockDemos: Record<
  string,
  { status: number; duration: number; body: object }
> = {
  "/api/v1/users": {
    status: 200,
    duration: 24,
    body: {
      page: 1,
      limit: 2,
      total: 150,
      data: [
        {
          id: "usr_99a8b1",
          name: "Alexander Vance",
          email: "alex.vance@fackapi.dev",
          role: "Principal Systems Architect",
          status: "active",
          created_at: "2026-08-01T12:00:00Z",
        },
        {
          id: "usr_88c4d2",
          name: "Sophia Martinez",
          email: "sophia.m@fackapi.dev",
          role: "Senior Staff Engineer",
          status: "active",
          created_at: "2026-08-05T14:30:00Z",
        },
      ],
    },
  },
  "/api/v1/orders": {
    status: 200,
    duration: 18,
    body: {
      object: "list",
      data: [
        {
          id: "ord_10293",
          user_id: "usr_99a8b1",
          amount: 299.99,
          currency: "USD",
          items_count: 3,
          status: "completed",
          payment_method: "card_visa",
        },
        {
          id: "ord_10294",
          user_id: "usr_88c4d2",
          amount: 149.5,
          currency: "USD",
          items_count: 1,
          status: "processing",
          payment_method: "apple_pay",
        },
      ],
    },
  },
  "/api/v1/analytics/metrics": {
    status: 200,
    duration: 32,
    body: {
      timestamp: "2026-08-09T22:00:00Z",
      metrics: {
        requests_per_sec: 1420,
        avg_latency_ms: 12.4,
        active_connections: 8430,
        p99_latency_ms: 45.1,
        error_rate_pct: 0.01,
      },
    },
  },
};

/**
 * Pixel-perfect Landing Page for Fack API's.
 * Styled to exactly match the schemaflow.studio reference:
 * - Top notice announcement bar
 * - Outer boxed layout with vertical grid lines
 * - Header with middle pill navigation & contribution avatar button
 * - Split hero with indigo glow left column & full-bleed grid pattern 3D slab right column
 * - Headline formatted: "Deploy" (gradient) + "Databases at the" + "Speed of Thought."
 * - 4-column metric stats bar separated by vertical grid borders
 * - Live interactive payload simulator playground
 * - Floating side control drawer & bottom-right dark/light theme toggle
 */
export const LandingPage = (): React.JSX.Element => {
  const { theme, setTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [bannerOpen, setBannerOpen] = React.useState(true);

  // Playground state for live interactive demo
  const [selectedMethod, setSelectedMethod] = React.useState<
    "GET" | "POST" | "PUT" | "DELETE"
  >("GET");
  const [selectedEndpoint, setSelectedEndpoint] =
    React.useState("/api/v1/users");
  const [playgroundLatency, setPlaygroundLatency] = React.useState<
    number | null
  >(mockDemos["/api/v1/users"].duration);
  const [playgroundResponse, setPlaygroundResponse] = React.useState<string>(
    () => JSON.stringify(mockDemos["/api/v1/users"].body, null, 2),
  );
  const [isExecuting, setIsExecuting] = React.useState(false);

  const handleRunPlayground = (endpoint = selectedEndpoint): void => {
    setIsExecuting(true);
    setPlaygroundLatency(null);
    const demo = mockDemos[endpoint] || mockDemos["/api/v1/users"];

    setTimeout(() => {
      setPlaygroundLatency(demo.duration);
      setPlaygroundResponse(JSON.stringify(demo.body, null, 2));
      setIsExecuting(false);
    }, 300);
  };

  return (
    <div className="bg-background text-foreground min-h-screen font-sans antialiased selection:bg-blue-500/20">
      {/* Top Notice Banner */}
      {bannerOpen && (
        <div className="border-b border-neutral-200 bg-white/90 px-4 py-2 text-xs text-neutral-700 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-300">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="mx-auto flex items-center justify-center gap-2 text-center">
              <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                ⚠️ Under Development
              </span>
              <span className="font-medium">
                Schema Flow Studio is under active development. Saved schemas
                and local project data may be corrupted or lost in future
                updates.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBannerOpen(false)}
              aria-label="Dismiss notice"
              className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <RiCloseLine className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container Frame with Outer Border */}
      <div className="mx-auto max-w-7xl border-x border-neutral-200 bg-white shadow-xs dark:border-neutral-800 dark:bg-neutral-950">
        {/* Header Navigation Bar */}
        <header className="border-b border-neutral-200 px-4 py-3 sm:px-8 dark:border-neutral-800">
          <div className="flex items-center justify-between">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 text-lg font-bold tracking-tight select-none"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 font-mono text-xs font-black text-white dark:bg-white dark:text-neutral-900">
                f.
              </span>
              <span className="font-extrabold tracking-tight">
                fackapi.studio
              </span>
            </Link>

            {/* Middle Floating Pill Navigation */}
            <nav className="hidden items-center md:flex">
              <div className="flex items-center gap-6 rounded-full border border-neutral-200 bg-neutral-100/90 px-6 py-1.5 text-xs font-medium shadow-2xs dark:border-neutral-700/80 dark:bg-neutral-800/90">
                <a
                  href="#features"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#erd"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  Interactive Flow
                </a>
                <a
                  href="#faker"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  Faker Engine
                </a>
                <a
                  href="#pricing"
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
                >
                  Storage & Pricing
                </a>
              </div>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Karelaking/fack-api"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex"
              >
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  <span className="inline-block h-6 w-6 rounded-full bg-indigo-500 text-center text-[10px] leading-6 font-bold text-white ring-2 ring-white dark:ring-neutral-900">
                    FA
                  </span>
                </div>
              </a>

              <a
                href="https://github.com/Karelaking/fack-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-90 dark:bg-white dark:text-neutral-900"
              >
                <span>Let&apos;s Contribute</span>
                <RiArrowRightUpLine className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section (2-Column Grid with Vertical Border) */}
        <section
          id="erd"
          className="border-b border-neutral-200 dark:border-neutral-800"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Hero Column: Light Blue/Indigo Glow */}
            <div className="flex flex-col justify-center border-neutral-200 bg-gradient-to-tr from-blue-100/70 via-indigo-50/40 to-transparent p-8 lg:border-r lg:p-14 dark:border-neutral-800 dark:from-blue-950/30 dark:via-indigo-950/20">
              <div className="space-y-6">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl/none">
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-5xl font-extrabold text-transparent lg:text-7xl">
                    Synthesize
                  </span>
                  <span className="mt-2 block text-5xl leading-none font-extrabold tracking-tight text-neutral-900 lg:text-7xl dark:text-neutral-50">
                    Mock APIs at the
                  </span>
                  <span className="mt-1 block text-5xl leading-none font-extrabold tracking-tight text-neutral-900 lg:text-7xl dark:text-neutral-50">
                    Speed of Thought.
                  </span>
                </h1>

                <p className="max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg dark:text-neutral-400">
                  Transform complex backend ideas into interactive visual node
                  flows. Auto-generate type-safe Faker.js payload models, export
                  instant multi-format HTTP mock responses, and simulate edge
                  conditions seamlessly.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href="/dashboard"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-bold text-white shadow-md transition-all hover:scale-[1.02] hover:opacity-90 dark:bg-white dark:text-neutral-900"
                  >
                    <span>Try Now</span>
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 dark:bg-neutral-900/20">
                      <RiArrowRightUpLine className="h-3.5 w-3.5" />
                    </div>
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-6 text-sm font-bold text-neutral-800 shadow-xs transition-all hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <RiStackLine className="h-4 w-4" />
                    <span>Launch Workspace</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Cyan/Teal Grid Pattern + 3D Card Model */}
            <div className="relative flex min-h-[500px] items-center justify-center bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px] p-8 lg:p-12 dark:bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)]">
              {/* Soft radial glow behind 3D slab */}
              <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/20 via-blue-400/10 to-transparent blur-3xl" />

              {/* Tilted 3D Slab Container */}
              <div className="relative w-full max-w-md [transform:perspective(1000px)_rotateX(8deg)_rotateY(-12deg)_rotateZ(2deg)] transition-transform duration-700 ease-out [transform-style:preserve-3d] hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-4deg)_rotateZ(0deg)]">
                {/* Floating Cyan Code Tag */}
                <div className="absolute -top-4 right-4 z-30">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 font-mono text-[11px] font-bold text-cyan-600 shadow-md backdrop-blur-md dark:border-cyan-800 dark:bg-cyan-950/90 dark:text-cyan-300">
                    <RiCodeSSlashLine className="h-3.5 w-3.5" />
                    <span>&lt;/ auto generated JSON &amp; OpenAPI &gt;</span>
                  </span>
                </div>

                {/* Main White 3D Slab Card Canvas */}
                <div className="relative space-y-4 rounded-3xl border border-neutral-200/90 bg-white/95 p-6 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.14)] backdrop-blur-xl dark:border-neutral-800/90 dark:bg-neutral-900/95">
                  {/* Card 1: GET users */}
                  <div className="max-w-[270px] rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 shadow-xs transition-transform hover:-translate-y-0.5 dark:border-neutral-800/80 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5 dark:border-neutral-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-600 uppercase dark:text-emerald-400">
                          GET
                        </span>
                        <span className="font-mono text-xs font-bold">
                          users
                        </span>
                      </div>
                      <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-cyan-600 dark:text-cyan-400">
                        PK: id
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          🔑 id
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          uuid
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>email</span>
                        <span className="text-[10px] text-neutral-400">
                          varchar
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>role</span>
                        <span className="text-[10px] text-neutral-400">
                          faker.jobTitle
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bezier Wire Line 1 */}
                  <div className="relative -my-2 h-10 w-full overflow-visible">
                    <svg className="h-full w-full" fill="none">
                      <path
                        d="M 120 0 C 120 20, 190 20, 190 40"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>

                  {/* Card 2: POST orders */}
                  <div className="ml-auto max-w-[270px] rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 shadow-xs transition-transform hover:-translate-y-0.5 dark:border-neutral-800/80 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5 dark:border-neutral-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-600 uppercase dark:text-blue-400">
                          POST
                        </span>
                        <span className="font-mono text-xs font-bold">
                          orders
                        </span>
                      </div>
                      <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-purple-600 dark:text-purple-400">
                        FK: 1
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          🔑 id
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          uuid
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-neutral-700 dark:text-neutral-200">
                        <span className="text-purple-600 dark:text-purple-400">
                          🔗 user_id
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          uuid
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>total_amount</span>
                        <span className="text-[10px] text-neutral-400">
                          numeric
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: order_items */}
                  <div className="max-w-[250px] rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 shadow-xs transition-transform hover:-translate-y-0.5 dark:border-neutral-800/80 dark:bg-neutral-800/50">
                    <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5 dark:border-neutral-700/60">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-amber-600 uppercase dark:text-amber-400">
                          PATCH
                        </span>
                        <span className="font-mono text-xs font-bold">
                          order_items
                        </span>
                      </div>
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        FK: 1
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-300">
                        <span>🔑 id</span>
                        <span className="text-[10px] text-neutral-400">
                          uuid
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>🔗 order_id</span>
                        <span className="text-[10px] text-neutral-400">
                          uuid
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Badge Pill (Left): auto-sync */}
                <div className="absolute top-1/2 -left-6 z-30 -translate-y-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600 shadow-md backdrop-blur-md dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300">
                    <RiCheckLine className="h-3.5 w-3.5" />
                    <span>auto-sync</span>
                  </span>
                </div>

                {/* Floating Badge Pill (Bottom Right): type-safe */}
                <div className="absolute right-6 -bottom-3 z-30">
                  <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-[11px] font-bold text-purple-600 shadow-md backdrop-blur-md dark:border-purple-800 dark:bg-purple-950/90 dark:text-purple-300">
                    <RiSparklingLine className="h-3.5 w-3.5" />
                    <span>type-safe</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Column Metric Stats Section with Crisp Vertical Grid Borders */}
        <section className="border-b border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/50">
          <div className="grid grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-neutral-800">
            {/* Col 1 */}
            <div className="p-8 text-left">
              <div className="font-mono text-3xl font-extrabold tracking-tight">
                100%
              </div>
              <div className="mt-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                LOCAL & PRIVATE
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                Zero server storage. Schema ASTs and API keys stay strictly in
                your local browser storage.
              </p>
            </div>

            {/* Col 2 */}
            <div className="p-8 text-left">
              <div className="font-mono text-3xl font-extrabold tracking-tight">
                5 Methods
              </div>
              <div className="mt-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                NATIVE MOCK ENGINES
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                Full syntax & type support for GET, POST, PUT, PATCH, and DELETE
                with custom JSON Schema and Faker.js logic.
              </p>
            </div>

            {/* Col 3 */}
            <div className="p-8 text-left">
              <div className="font-mono text-3xl font-extrabold tracking-tight">
                10x Faster
              </div>
              <div className="mt-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                VISUAL PROTOTYPING
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                Instant visual ERD creation with 1-click Drizzle ORM &
                TypeScript code export.
              </p>
            </div>

            {/* Col 4 */}
            <div className="p-8 text-left">
              <div className="font-mono text-3xl font-extrabold tracking-tight">
                100% Automated
              </div>
              <div className="mt-1.5 text-[10px] font-bold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                REAL-TIME AST VALIDATION
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                Automatic background checks scan for missing indexes, foreign
                key constraints, and relation issues.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Live Playground Section */}
        <section
          id="playground"
          className="border-b border-neutral-200 py-20 dark:border-neutral-800"
        >
          <div className="px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Try Interactive Payload Synthesis Live
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Test dynamic HTTP mock endpoints right in your browser. Choose
                an endpoint and execute real-time payload generation.
              </p>
            </div>

            {/* Interactive Request Bar */}
            <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl md:p-6 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {/* Method Selector */}
                <div className="flex items-center gap-1">
                  {(["GET", "POST", "PUT", "DELETE"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(method);
                        handleRunPlayground(selectedEndpoint);
                      }}
                      className={`rounded-lg px-3 py-1.5 font-mono text-xs font-bold transition-colors ${
                        selectedMethod === method
                          ? method === "GET"
                            ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : method === "POST"
                              ? "border border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400"
                              : method === "PUT"
                                ? "border border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "border border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                          : "text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Endpoint Dropdown / Input */}
                <div className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 font-mono text-xs font-semibold dark:border-neutral-700 dark:bg-neutral-800">
                  <RiSearchLine className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => {
                      const nextEndpoint = e.target.value;
                      setSelectedEndpoint(nextEndpoint);
                      handleRunPlayground(nextEndpoint);
                    }}
                    className="flex-1 bg-transparent text-neutral-800 focus:outline-none dark:text-neutral-100"
                    aria-label="Select mock endpoint"
                  >
                    <option value="/api/v1/users">/api/v1/users</option>
                    <option value="/api/v1/orders">/api/v1/orders</option>
                    <option value="/api/v1/analytics/metrics">
                      /api/v1/analytics/metrics
                    </option>
                  </select>
                </div>

                {/* Execute Button */}
                <Button
                  type="button"
                  onClick={() => handleRunPlayground(selectedEndpoint)}
                  disabled={isExecuting}
                  className="h-9 shrink-0 gap-1.5 rounded-lg px-5 font-bold"
                >
                  <RiPlayFill className="h-4 w-4" />
                  <span>Send Request</span>
                </Button>
              </div>

              {/* Response Console Box */}
              <div className="mt-4 rounded-xl bg-neutral-950 p-4 font-mono text-xs text-neutral-100 shadow-inner">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-emerald-400">
                      STATUS 200 OK
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-neutral-400">
                    {playgroundLatency !== null && (
                      <span className="flex items-center gap-1">
                        <RiTimeLine className="h-3 w-3 text-cyan-400" />
                        <span>{playgroundLatency}ms</span>
                      </span>
                    )}
                    <span>application/json</span>
                  </div>
                </div>

                <pre className="mt-3 max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed text-neutral-300">
                  {playgroundResponse}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Deep Feature Highlights Section */}
        <section
          id="features"
          className="border-b border-neutral-200 bg-neutral-50/50 py-20 dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <div className="px-4 sm:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-purple-600 uppercase dark:text-purple-400">
                Comprehensive Toolkit
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Built for Modern Developers & API Designers
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Everything you need to mock, test, and document backend
                endpoints without writing boilerplate servers.
              </p>
            </div>

            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-blue-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                  <RiDatabase2Line className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">Visual Flow Canvas</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Construct API schema nodes, define path parameters, and draw
                  relation edges using a responsive React Flow interactive
                  canvas.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-purple-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 text-purple-500">
                  <RiSparklingLine className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">
                  20+ Faker.js Generators
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Synthesize realistic users, transactions, UUIDs, dates, and
                  addresses automatically powered by `@faker-js/faker`.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-amber-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                  <RiPulseLine className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">
                  Chaos & Latency Injector
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Simulate real-world network edge cases: status code errors
                  (404, 500), response delays (100ms - 5000ms), and custom HTTP
                  headers.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-emerald-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  <RiLockLine className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">
                  Client-Side SQLite Engine
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  100% offline & private. All schema definitions, route configs,
                  and execution logs remain strictly within local SQLite
                  storage.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-cyan-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-500">
                  <RiFileCodeLine className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">1-Click DTO Export</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Instantly generate TypeScript interfaces, Drizzle ORM schemas,
                  or OpenAPI 3.0 spec files ready to paste into your codebase.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="relative rounded-2xl border border-neutral-200 bg-white p-6 transition-all hover:border-rose-500/40 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                  <RiSpeedUpLine className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold">Zero-Latency Mocks</h3>
                <p className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Lightning fast response generation with built-in memory
                  caching and dynamic route path pattern matching.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Banner */}
        <section className="relative overflow-hidden px-4 py-16 sm:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-xl md:p-12 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to Visualise Your APIs?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Start building mock endpoints and visual ERD models in seconds. No
              account registration or credit card required.
            </p>

            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-bold text-white shadow-md transition-transform hover:scale-[1.02] hover:opacity-90 dark:bg-white dark:text-neutral-900"
              >
                <span>Launch Workspace Now</span>
                <RiArrowRightUpLine className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-white px-4 py-10 text-xs sm:px-8 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5 font-bold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-900 font-mono text-[10px] font-black text-white dark:bg-white dark:text-neutral-900">
                sf.
              </span>
              <span>schemaflow.studio</span>
              <span className="font-normal text-neutral-400">
                — Open Source Mock API Platform
              </span>
            </div>

            <div className="flex items-center gap-6 text-neutral-500">
              <a
                href="https://github.com/Karelaking/fack-api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-neutral-900 dark:hover:text-white"
              >
                <RiGithubFill className="h-4 w-4" />
                <span>GitHub</span>
              </a>
              <Link
                href="/dashboard"
                className="transition-colors hover:text-neutral-900 dark:hover:text-white"
              >
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-200/60 pt-6 text-center text-[11px] text-neutral-400 dark:border-neutral-800/60">
            © {new Date().getFullYear()} Schema Flow Studio. Released under the
            MIT License.
          </div>
        </footer>
      </div>

      {/* Right Edge Sliders Floating Control Button */}
      <button
        type="button"
        title="Settings & View Options"
        aria-label="Settings & View Options"
        className="fixed top-1/2 right-4 z-40 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition-transform hover:scale-110 dark:bg-neutral-100 dark:text-neutral-900"
      >
        <RiSettings3Line className="h-4 w-4" />
      </button>

      {/* Floating Bottom-Right Dark/Light Theme Switcher Button */}
      {mounted && (
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle dark mode"
          className="fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-800 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          {theme === "dark" ? (
            <RiSunLine className="h-5 w-5 text-amber-400" />
          ) : (
            <RiMoonLine className="h-5 w-5 text-slate-700" />
          )}
        </button>
      )}
    </div>
  );
};
