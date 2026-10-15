"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { SignIn, SignUp } from "@clerk/nextjs";
import { ArrowLeft, Check } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";

export type AuthMode = "sign-in" | "sign-up";

/** Words cycled through the showcase headline, mirroring the landing hero. */
const ROTATING_WORDS = ["Design", "Prototype", "Mock", "Ship"] as const;

/** Product capabilities surfaced on the marketing panel. */
const CAPABILITIES = [
  "Visual node canvas that compiles to standard JSON Schema",
  "Faker-powered payloads with latency and failure injection",
  "One-click OpenAPI, TypeScript and Express export",
] as const;

/** Trust chips shown beneath the response preview. */
const STATUS_CHIPS = [
  "100% self-hosted",
  "Deterministic seeds",
  "MIT licensed",
] as const;

/**
 * Fields rendered inside the mock response preview.
 * Tuple shape: [json key, rendered value, value colour class].
 */
const RESPONSE_FIELDS: ReadonlyArray<readonly [string, string, string]> = [
  ["id", '"5f3c…9a21"', "text-amber-200/90"],
  ["name", '"Ada Lovelace"', "text-amber-200/90"],
  ["email", '"ada@fack.dev"', "text-amber-200/90"],
  ["active", "true", "text-violet-300"],
];

/**
 * Decorative preview of a synthesised mock HTTP response, rendered inside the
 * showcase panel to hint at the product's core value proposition.
 */
const ResponsePreview = (): React.JSX.Element => (
  <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
    <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-red-400/70"
      />
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-amber-400/70"
      />
      <span
        aria-hidden="true"
        className="size-2.5 rounded-full bg-emerald-400/70"
      />
      <span className="ml-2 truncate font-mono text-[11px] text-white/45">
        GET /api/v1/users
      </span>
      <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
        <span aria-hidden="true" className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        200 OK
      </span>
    </div>

    <pre className="overflow-x-auto px-4 py-3 font-mono text-[11px] leading-relaxed text-white/70">
      <code>
        <span className="block text-white/40">{"{"}</span>
        {RESPONSE_FIELDS.map(([key, value, valueClass], index) => (
          <span key={key} className="block pl-4">
            <span className="text-sky-300">{`"${key}"`}</span>
            <span className="text-white/40">{": "}</span>
            <span className={valueClass}>{value}</span>
            {index < RESPONSE_FIELDS.length - 1 ? (
              <span className="text-white/40">,</span>
            ) : null}
          </span>
        ))}
        <span className="block text-white/40">{"}"}</span>
      </code>
    </pre>

    <div className="flex items-center justify-between border-t border-white/10 px-4 py-2 font-mono text-[10px] text-white/35">
      <span>42ms · cached</span>
      <span>faker.js · seed 1337</span>
    </div>
  </div>
);

/**
 * Immersive brand panel shown on the left half of the auth screen (lg+).
 * Fixed dark surface to match the brand logo, with a blueprint grid and
 * ambient product glows echoing the landing page.
 */
const AuthShowcase = ({ word }: { word: string }): React.JSX.Element => (
  <aside className="relative hidden overflow-hidden bg-[#05060a] lg:flex lg:flex-col lg:justify-between">
    {/* Blueprint grid */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[34px_34px]"
    />
    {/* Ambient product glows */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-32 -left-24 size-120 rounded-full bg-linear-to-br from-blue-600/30 via-indigo-500/15 to-transparent blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-32 -bottom-24 size-104 rounded-full bg-linear-to-tr from-cyan-400/20 via-sky-500/10 to-transparent blur-3xl"
    />

    {/* Brand bar */}
    <div className="relative z-10 flex items-center gap-2.5 px-10 py-8 xl:px-14">
      <BrandLogo size={34} />
      <span className="text-base font-extrabold tracking-tight text-white">
        fackapi<span className="text-blue-400">.</span>studio
      </span>
      <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.18em] text-white/50 uppercase">
        Mock API
      </span>
    </div>

    {/* Value proposition */}
    <div className="relative z-10 flex flex-col gap-7 px-10 py-6 xl:px-14">
      <p className="font-mono text-[11px] font-semibold tracking-[0.22em] text-blue-300/80 uppercase">
        {"// Self-hosted mock API platform"}
      </p>
      <p className="max-w-xl text-4xl leading-[1.08] font-extrabold tracking-tight text-white xl:text-[2.75rem]">
        <span className="my-0.5 block h-[1.25em] overflow-hidden bg-linear-to-r from-blue-400 via-indigo-400 to-cyan-300 bg-clip-text text-transparent">
          <span
            key={word}
            className="animate-in slide-in-from-bottom-4 fade-in block duration-500"
          >
            {word}
          </span>
        </span>
        <span className="block">your API before it exists.</span>
      </p>
      <p className="max-w-md text-sm leading-relaxed text-white/55">
        Build deeply nested JSON schemas on a visual canvas, synthesise
        realistic payloads with Faker.js, and serve a live mock backend without
        waiting on anyone.
      </p>

      <ul className="flex flex-col gap-3">
        {CAPABILITIES.map((capability) => (
          <li
            key={capability}
            className="flex items-start gap-3 text-sm text-white/75"
          >
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
              <Check className="size-3" strokeWidth={3} aria-hidden="true" />
            </span>
            {capability}
          </li>
        ))}
      </ul>
    </div>

    {/* Preview + trust chips */}
    <div className="relative z-10 flex flex-col gap-5 px-10 py-8 xl:px-14">
      <ResponsePreview />
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-wide text-white/50"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  </aside>
);

export type AuthScreenProps = {
  mode: AuthMode;
};

/**
 * Split-screen authentication shell shared by the sign-in and sign-up routes.
 * The Clerk component inherits the shadcn theme configured on ClerkProvider,
 * so it stays in sync with the app's design system in both light and dark mode.
 */
export const AuthScreen = ({ mode }: AuthScreenProps): React.JSX.Element => {
  const [rotatingIndex, setRotatingIndex] = useState<number>(0);

  useEffect((): (() => void) => {
    const intervalId = setInterval((): void => {
      setRotatingIndex(
        (prev: number): number => (prev + 1) % ROTATING_WORDS.length,
      );
    }, 2800);
    return (): void => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-background flex min-h-svh flex-col lg:grid lg:grid-cols-[1.05fr_1fr]">
      <AuthShowcase word={ROTATING_WORDS[rotatingIndex]} />

      <div className="relative flex min-h-svh flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 lg:hidden"
            aria-label="Fack API's — home"
          >
            <BrandLogo size={26} />
            <span className="text-sm font-extrabold tracking-tight">
              fackapi<span className="text-primary">.</span>studio
            </span>
          </Link>

          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground hidden items-center gap-1.5 text-sm transition-colors lg:inline-flex"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to home
          </Link>

          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          {mode === "sign-in" ? <SignIn /> : <SignUp />}
        </main>

        <footer className="px-5 pb-8 sm:px-8">
          <p className="text-muted-foreground mx-auto max-w-sm text-center text-[11px] leading-relaxed">
            Self-hosted, open source and MIT licensed.
          </p>
        </footer>
      </div>
    </div>
  );
};
