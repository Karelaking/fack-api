import React from "react";
import { ArrowRight, Braces, Layers, Terminal } from "lucide-react";
import { RiGithubFill } from "@remixicon/react";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { CollaborateButton } from "@/components/landing/CollaborateButton";
import { HeroMotion } from "@/components/landing/HeroMotion";
import { QuickStartBar } from "@/components/landing/QuickStartBar";
import { cn } from "@/lib/utils";

/** Field → mock-data provider mapping as it is configured on the canvas. */
const CANVAS_FIELDS: Array<{
  field: string;
  provider: string;
  accent: string;
}> = [
  { field: "name", provider: "faker.person.fullName()", accent: "text-info" },
  {
    field: "email",
    provider: "faker.internet.email()",
    accent: "text-success",
  },
  {
    field: "role",
    provider: "faker.person.jobTitle()",
    accent: "text-warning",
  },
];

/**
 * What the canvas synthesizes: standard JSON Schema carrying x-faker, shown as
 * one fully expanded property. The card stays at eight lines so the band keeps
 * its original height, and the longest line (34 chars) clears the narrowest
 * panel at 360px — a wider two-property sample either clips behind the runtime's
 * hidden scrollbars or stretches the band and leaves voids in its siblings.
 */
const SCHEMA_SNIPPET = `{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "x-faker": "person.fullName"
    }
  }
}`;

/** What the deterministic runtime answers with, path parameters included. */
const RESPONSE_SNIPPET = `{
  "id": "usr_99a8b1",
  "name": "Alexander Vance",
  "email": "alex.vance@fackapi.dev",
  "role": "Principal Systems Architect"
}`;

/** Verifiable facts only; the metrics matrix keeps its original content. */
const HERO_FACTS: Array<{
  value: number;
  suffix: string;
  delay: number;
  label: string;
  body: string;
}> = [
  {
    value: 100,
    suffix: "%",
    delay: 0,
    label: "LOCAL & PRIVATE",
    body: "Self-hosted storage. Schema ASTs and provider keys stay on your own server, not in the browser.",
  },
  {
    value: 5,
    suffix: " Methods",
    delay: 200,
    label: "NATIVE MOCK ENGINES",
    body: "Full syntax & type support for GET, POST, PUT, PATCH, and DELETE with custom JSON Schema and Faker.js logic.",
  },
  {
    value: 10,
    suffix: "x Faster",
    delay: 400,
    label: "VISUAL PROTOTYPING",
    body: "Instant visual ERD creation with 1-click Drizzle ORM & TypeScript code export.",
  },
  {
    value: 100,
    suffix: "% Automated",
    delay: 600,
    label: "REAL-TIME AST VALIDATION",
    body: "Automatic background checks scan for missing indexes, foreign key constraints, and relation issues.",
  },
];

/**
 * Cell borders for the facts matrix: the grid supplies no dividers of its own
 * so the seams stay correct at one, two, and four columns.
 */
const HERO_FACT_BORDERS: string[] = [
  "",
  "border-t sm:border-t-0 sm:border-l",
  "border-t lg:border-t-0 lg:border-l",
  "border-t sm:border-l",
];

/** Chip that sits on a divider to read the three stages as one pipeline. */
const FlowConnector = (): React.JSX.Element => (
  <span
    aria-hidden="true"
    className="border-border/60 bg-background text-muted-foreground absolute top-1/2 -right-3 z-10 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border lg:flex"
  >
    <ArrowRight className="size-3" />
  </span>
);

/**
 * Centered hero: one column of copy, the command that starts a local instance,
 * and the canvas → schema → runtime pipeline shown with real values.
 *
 * The stage markup stays a Server Component. `HeroMotion` is the only client
 * island, and all it does is gate the ambient drift and the pipeline pulse once
 * the hero is on screen. The three stages each carry one stop of the hero's
 * gradient — canvas (primary) → schema (info) → runtime (chart-5) — so the band
 * reads as one continuous ramp rather than three equal panels.
 */
export const HeroSection = (): React.JSX.Element => {
  return (
    <HeroMotion>
      <section
        id="hero"
        aria-label="Hero Introduction"
        className="border-border/40 bg-background relative w-full overflow-hidden border-b"
      >
        {/* The page's own multi-colour gradient, as a field the hero sits in. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-128"
        >
          <div className="hero-field-a from-primary/30 via-info/20 absolute -top-40 left-1/2 h-80 w-168 -translate-x-[70%] rounded-full bg-linear-to-br to-transparent blur-3xl" />
          <div className="hero-field-b from-info/25 via-chart-5/20 absolute -top-28 left-1/2 h-72 w-152 -translate-x-[25%] rounded-full bg-linear-to-tr to-transparent blur-3xl" />
          <div className="hero-field-c from-chart-5/20 via-primary/10 absolute top-6 left-1/2 h-64 w-136 -translate-x-1/2 rounded-full bg-linear-to-b to-transparent blur-3xl" />
        </div>

        <div className="border-border/40 relative z-10 mx-auto max-w-7xl border-x">
          {/*
            Copy: four steps of one hierarchy — what you design, why it exists,
            how it works, and what it costs to run — closing on the actions.
            They enter in a single waterfall (the hero copy sequence in
            globals.css), and each phrase that names a pipeline stage carries
            that stage's colour as its underline, so the copy reads against the
            stages below it.
          */}
          <div className="px-4 pt-14 pb-9 text-center sm:px-6 md:pt-16 md:pb-10 lg:px-8">
            {/*
              One sentence per line: at 60px neither sentence fits beside the
              other, so a single unsplit headline breaks mid-sentence into three
              ragged lines. Each line is its own box, revealed on its own.
            */}
            <h1 className="text-foreground mx-auto max-w-5xl text-3xl leading-[1.12] font-extrabold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              <span className="hero-line block text-balance">
                Design the mock API on a canvas.
              </span>
              <span className="hero-line hero-line--2 block text-balance">
                Serve it from{" "}
                <span className="hero-mark group/mark relative inline-block">
                  your own machine
                  <span
                    aria-hidden="true"
                    className="hero-mark-rule from-primary via-info to-chart-5 absolute inset-x-0 -bottom-[0.1em] h-0.5 rounded-full bg-linear-to-r opacity-65 transition-[opacity,height] duration-300 ease-out group-hover/mark:h-[3px] group-hover/mark:opacity-100"
                  />
                </span>
                .
              </span>
            </h1>

            {/* Why it exists, in the product's own words. */}
            <p className="hero-tier hero-tier--lead text-foreground mx-auto mt-6 max-w-2xl text-base leading-snug font-medium text-balance sm:text-lg">
              Build and test independently of a backend that is not ready.
            </p>

            {/* How it works. Each stage of the pipeline is named in its own
                hue; hovering lifts the phrase to full foreground and thickens
                that underline. */}
            <p className="hero-tier hero-tier--detail text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-pretty sm:text-base">
              Fack API synthesizes{" "}
              <span className="decoration-primary hover:text-foreground underline decoration-2 underline-offset-4 transition-colors duration-300 hover:decoration-[3px]">
                that canvas
              </span>{" "}
              into{" "}
              <span className="decoration-info hover:text-foreground underline decoration-2 underline-offset-4 transition-colors duration-300 hover:decoration-[3px]">
                standard JSON Schema
              </span>{" "}
              — with Faker.js providers, latency, and failure rules attached —
              and serves it as{" "}
              <span className="decoration-chart-5 hover:text-foreground underline decoration-2 underline-offset-4 transition-colors duration-300 hover:decoration-[3px]">
                a live mock backend
              </span>
              .
            </p>

            {/* What it costs to run: the last step, set as one line of facts. */}
            <p className="hero-tier hero-tier--spec text-muted-foreground mx-auto mt-4 flex max-w-2xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs sm:text-sm">
              <span className="hover:text-foreground transition-colors duration-300">
                One container
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
                No hosted service
              </span>
            </p>

            <div className="hero-tier hero-tier--actions mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
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
                className="border-border/40 text-foreground hover:bg-muted/60 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold transition-colors sm:w-auto"
              >
                <RiGithubFill className="size-4" aria-hidden="true" />
                <span>View the source</span>
              </a>
            </div>
          </div>

          {/* Quick start command */}
          <div className="px-4 pb-10 sm:px-6 md:pb-12 lg:px-8">
            <QuickStartBar className="mx-auto max-w-3xl" />
          </div>

          {/*
            Mechanism: canvas → schema → runtime, in the product's own language.
            The rail carries the gradient; the pulse crosses it and blooms each
            stage on arrival — the one authored moment of this surface. On mobile
            the pipeline stacks, so the pulse is desktop-only and the staggered
            stage blooms carry the sequence on their own.
          */}
          <div className="border-border/40 divide-border/40 relative grid grid-cols-1 divide-y border-t lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div
              aria-hidden="true"
              className="from-primary/50 via-info/50 to-chart-5/50 pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r"
            />
            <div
              aria-hidden="true"
              className="hero-pulse pointer-events-none absolute inset-x-0 -top-px hidden h-px lg:block"
            />
            <div
              aria-hidden="true"
              className="hero-pulse-glow pointer-events-none absolute inset-x-0 -top-1 hidden h-2 blur-sm lg:block"
            />

            <article
              aria-labelledby="hero-stage-canvas"
              className="relative flex flex-col gap-4 p-5 sm:p-6 lg:p-7"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="hero-stage-light hero-stage-light--canvas from-primary/35 via-info/15 absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-linear-to-b to-transparent blur-3xl" />
              </div>

              <header className="relative z-10 flex items-center gap-2.5">
                <span className="border-primary/40 bg-primary/15 flex size-7 shrink-0 items-center justify-center rounded-lg border">
                  <Layers
                    className="text-primary size-3.5"
                    aria-hidden="true"
                  />
                </span>
                <h2
                  id="hero-stage-canvas"
                  className="text-foreground text-sm font-bold tracking-tight"
                >
                  Canvas
                </h2>
              </header>

              <div className="border-border/60 bg-muted/20 relative z-10 overflow-hidden rounded-xl border">
                <div className="border-border/40 flex items-center gap-2 border-b px-3 py-2">
                  <span className="border-method-get/30 bg-method-get/15 text-method-get text-caption shrink-0 rounded border px-1.5 py-0.5 font-mono font-bold">
                    GET
                  </span>
                  <code className="text-foreground truncate font-mono text-xs font-semibold">
                    /:projectSlug/users
                  </code>
                </div>
                <ul className="divide-border/40 divide-y">
                  {CANVAS_FIELDS.map(
                    (canvasField: {
                      field: string;
                      provider: string;
                      accent: string;
                    }) => (
                      <li
                        key={canvasField.field}
                        className="flex items-center justify-between gap-3 px-3 py-1.5"
                      >
                        <span className="text-foreground font-mono text-xs">
                          {canvasField.field}
                        </span>
                        <span
                          className={cn(
                            "truncate font-mono text-xs",
                            canvasField.accent,
                          )}
                        >
                          {canvasField.provider}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <p className="text-muted-foreground relative z-10 mt-auto text-xs leading-relaxed">
                Objects, arrays, and nullable fields are nested spatially. No
                JSON Schema is written by hand.
              </p>

              <FlowConnector />
            </article>

            <article
              aria-labelledby="hero-stage-schema"
              className="relative flex flex-col gap-4 p-5 sm:p-6 lg:p-7"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="hero-stage-light hero-stage-light--schema from-info/35 via-chart-5/15 absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-linear-to-b to-transparent blur-3xl" />
              </div>

              <header className="relative z-10 flex items-center gap-2.5">
                <span className="border-info/40 bg-info/15 flex size-7 shrink-0 items-center justify-center rounded-lg border">
                  <Braces className="text-info size-3.5" aria-hidden="true" />
                </span>
                <h2
                  id="hero-stage-schema"
                  className="text-foreground text-sm font-bold tracking-tight"
                >
                  Synthesized schema
                </h2>
              </header>

              <div className="border-border/60 bg-muted/20 scrollbar-subtle relative z-10 overflow-x-auto rounded-xl border px-3 py-2.5">
                <pre className="text-foreground font-mono text-xs leading-relaxed">
                  {SCHEMA_SNIPPET}
                </pre>
              </div>

              <p className="text-muted-foreground relative z-10 mt-auto text-xs leading-relaxed">
                Synthesized into standard JSON Schema carrying{" "}
                <span className="text-info font-mono">x-faker</span> extensions
                — nothing proprietary to unlearn.
              </p>

              <FlowConnector />
            </article>

            <article
              aria-labelledby="hero-stage-runtime"
              className="relative flex flex-col gap-4 p-5 sm:p-6 lg:p-7"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-hidden"
              >
                <div className="hero-stage-light hero-stage-light--runtime from-chart-5/35 via-primary/15 absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-linear-to-b to-transparent blur-3xl" />
              </div>

              <header className="relative z-10 flex items-center gap-2.5">
                <span className="border-chart-5/40 bg-chart-5/15 flex size-7 shrink-0 items-center justify-center rounded-lg border">
                  <Terminal
                    className="text-chart-5 size-3.5"
                    aria-hidden="true"
                  />
                </span>
                <h2
                  id="hero-stage-runtime"
                  className="text-foreground text-sm font-bold tracking-tight"
                >
                  Runtime
                </h2>
              </header>

              <div className="border-border/60 bg-muted/20 relative z-10 overflow-hidden rounded-xl border">
                <div className="border-border/40 flex items-center justify-between gap-2 border-b px-3 py-2">
                  <code className="text-foreground truncate font-mono text-xs font-semibold">
                    /acme/users
                  </code>
                  <span className="border-success/30 bg-success/10 text-success text-caption shrink-0 rounded border px-1.5 py-0.5 font-mono font-bold">
                    200 OK · 41 ms
                  </span>
                </div>
                <pre className="text-muted-foreground scrollbar-subtle overflow-x-auto px-3 py-2 font-mono text-xs leading-relaxed">
                  {RESPONSE_SNIPPET}
                </pre>
              </div>

              <p className="text-muted-foreground relative z-10 mt-auto text-xs leading-relaxed">
                Matched by path and served by the deterministic runtime. No
                model-generated code ever runs in the request path.
              </p>
            </article>
          </div>

          {/* Facts matrix */}
          <div className="border-border/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_FACTS.map((fact, index: number) => (
              <article
                key={fact.label}
                className={cn(
                  "border-border/40 flex flex-col justify-between space-y-1.5 p-6 sm:p-7",
                  HERO_FACT_BORDERS[index] ?? "",
                )}
              >
                <div>
                  <div className="text-foreground font-mono text-2xl font-extrabold tracking-tight sm:text-3xl">
                    <AnimatedCounter
                      targetValue={fact.value}
                      suffix={fact.suffix}
                      duration={1600}
                      delay={fact.delay}
                    />
                  </div>
                  <h2 className="text-foreground text-caption mt-1 font-bold tracking-wider uppercase">
                    {fact.label}
                  </h2>
                </div>
                <p className="text-muted-foreground pt-1 text-xs leading-relaxed">
                  {fact.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </HeroMotion>
  );
};
