"use client";

import React, { useState } from "react";
import { Database, Copy, Check, Sparkles, Key, Link2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DialectTab = "drizzle" | "typescript" | "mock";

/**
 * Renders syntax-highlighted code segments for Drizzle ORM, TypeScript Interfaces, and Mock Payloads.
 */
const renderSyntaxHighlightedCode = (code: string): React.ReactNode => {
  const lines = code.split("\n");

  return lines.map((line: string, lineIdx: number): React.JSX.Element => {
    // Comment lines
    if (line.trim().startsWith("//") || line.trim().startsWith("--")) {
      return (
        <div
          key={lineIdx}
          className="text-muted-foreground/60 font-mono italic"
        >
          {line}
        </div>
      );
    }

    // Tokenizer regex for strings, keywords, numbers, types
    const tokenRegex =
      /(".*?"|`.*?`|'.*?'|\b(?:import|export|const|type|interface|from|return|await|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|NOT|NULL|CASCADE)\b|\b(?:sqliteTable|pgTable|text|integer|real|relations|eq|findFirst|faker|string|number|boolean|Date)\b|\b\d+\b)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.substring(lastIndex, match.index));
      }

      const token = match[0];
      if (
        token.startsWith('"') ||
        token.startsWith("`") ||
        token.startsWith("'")
      ) {
        // Strings in emerald
        parts.push(
          <span key={match.index} className="font-medium text-emerald-400">
            {token}
          </span>,
        );
      } else if (
        /^(import|export|const|type|interface|from|return|await|CREATE|TABLE|PRIMARY|KEY|FOREIGN|REFERENCES|DEFAULT|NOT|NULL|CASCADE)$/i.test(
          token,
        )
      ) {
        // Control keywords in indigo/purple
        parts.push(
          <span key={match.index} className="font-bold text-indigo-400">
            {token}
          </span>,
        );
      } else if (
        /^(sqliteTable|pgTable|text|integer|real|relations|eq|findFirst|faker|string|number|boolean|Date)$/.test(
          token,
        )
      ) {
        // Functions / Types in sky blue
        parts.push(
          <span key={match.index} className="font-semibold text-sky-400">
            {token}
          </span>,
        );
      } else {
        // Numbers / other tokens
        parts.push(
          <span key={match.index} className="text-purple-300">
            {token}
          </span>,
        );
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.substring(lastIndex));
    }

    return (
      <div key={lineIdx} className="leading-relaxed">
        {parts.length > 0 ? parts : "\u00A0"}
      </div>
    );
  });
};

/**
 * Interactive Live Schema & API Workbench matching the reference design layout.
 */
export const InteractiveCanvasDemo = (): React.JSX.Element => {
  const [activeTab, setActiveTab] = useState<DialectTab>("drizzle");
  const [copied, setCopied] = useState(false);
  const [autoTimestamps, setAutoTimestamps] = useState(true);
  const [selectedTable, setSelectedTable] = useState<"users" | "orders">(
    "users",
  );

  const getDrizzleCode = (): string => {
    return `import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").default("member").notNull(),${
    autoTimestamps
      ? `
  createdAt: text("created_at").notNull(),`
      : ""
  }
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalAmount: real("total_amount").notNull(),${
    autoTimestamps
      ? `
  createdAt: text("created_at").notNull(),`
      : ""
  }
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));`;
  };

  const getTypeScriptCode = (): string => {
    return `// Type-Safe API Contracts & DTOs
export interface User {
  id: string;
  email: string;
  role: "admin" | "member" | "developer";${
    autoTimestamps
      ? `
  createdAt: string;`
      : ""
  }
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;${
    autoTimestamps
      ? `
  createdAt: string;`
      : ""
  }
}

export interface UserWithOrders extends User {
  orders: Order[];
}`;
  };

  const getMockCode = (): string => {
    return `// Real-Time Generated Faker.js Mock Response (GET /api/v1/users)
{
  "status": 200,
  "data": [
    {
      "id": "usr_99a8b1",
      "email": "alex.vance@fackapi.dev",
      "role": "Principal Systems Architect",${
        autoTimestamps
          ? `
      "created_at": "2026-08-01T12:00:00Z"`
          : ""
      }
    },
    {
      "id": "usr_88c4d2",
      "email": "sophia.m@fackapi.dev",
      "role": "Senior Staff Engineer",${
        autoTimestamps
          ? `
      "created_at": "2026-08-05T14:30:00Z"`
          : ""
      }
    }
  ]
}`;
  };

  const getCurrentCode = (): string => {
    switch (activeTab) {
      case "drizzle":
        return getDrizzleCode();
      case "typescript":
        return getTypeScriptCode();
      case "mock":
        return getMockCode();
    }
  };

  const handleCopy = (): void => {
    navigator.clipboard.writeText(getCurrentCode());
    setCopied(true);
    setTimeout((): void => setCopied(false), 2000);
  };

  return (
    <section
      id="showcase"
      className="border-border/40 bg-background relative w-full overflow-hidden border-b"
    >
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-125 rounded-full bg-linear-to-tr from-blue-600/10 via-indigo-500/10 to-purple-500/10 blur-3xl" />
      </div>

      <div className="border-border/40 relative z-10 mx-auto max-w-7xl border-x">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl space-y-4 px-4 pt-16 pb-14 text-center md:pt-24">
          <h2 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Design in Visual Flow. <br className="hidden sm:inline" />
            Output in Instant Code.
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm leading-relaxed sm:text-base">
            Interact with live mock schema nodes below, watch relationship
            handles connect seamlessly, and inspect side-by-side Drizzle ORM
            models and Faker payloads in real-time.
          </p>
        </div>

        {/* 2-Column Framed Grid Showcase */}
        <div className="divide-border/40 border-border/40 grid grid-cols-1 divide-y border-t lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left Visual ERD Canvas Panel */}
          <div className="bg-card/30 flex flex-col justify-between space-y-4 p-6 sm:p-8 lg:col-span-6">
            {/* Control Bar */}
            <div className="border-border/40 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-foreground ml-2 flex items-center gap-1.5 font-mono text-xs font-bold">
                  <Database className="size-3.5 text-sky-400" />
                  <span>Canvas: Mock Schema Flow</span>
                </span>
              </div>
              <button
                type="button"
                onClick={(): void => setAutoTimestamps(!autoTimestamps)}
                className={`w-44 shrink-0 cursor-pointer rounded-full border px-3 py-1 text-center text-xs font-semibold transition-all ${
                  autoTimestamps
                    ? "border-sky-500/30 bg-sky-500/15 font-bold text-sky-400"
                    : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
              >
                {autoTimestamps
                  ? "✓ Timestamps Enabled"
                  : "+ Enable Timestamps"}
              </button>
            </div>

            {/* Simulated ERD Interactive Canvas Area */}
            <div className="bg-card/90 border-border/80 relative flex min-h-77.5 flex-1 flex-col justify-center overflow-hidden rounded-2xl border p-4 font-sans shadow-xl backdrop-blur-md">
              {/* Background Grid Pattern */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[20px_20px] opacity-60" />

              {/* Connecting Line SVG */}
              <svg className="pointer-events-none absolute inset-0 z-10 hidden size-full overflow-visible sm:block">
                <defs>
                  <linearGradient
                    id="demo-rel-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 175 90 C 215 90, 215 160, 250 160"
                  fill="none"
                  stroke="url(#demo-rel-gradient)"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="animate-pulse"
                />
                <circle
                  cx="175"
                  cy="90"
                  r="3.5"
                  fill="#38bdf8"
                  className="animate-ping"
                />
                <circle
                  cx="175"
                  cy="90"
                  r="2.5"
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <circle
                  cx="250"
                  cy="160"
                  r="2.5"
                  fill="#818cf8"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              </svg>

              <div className="relative z-20 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Table Node 1: users */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(): void => setSelectedTable("users")}
                  onKeyDown={(e: React.KeyboardEvent): void => {
                    if (e.key === "Enter") {
                      setSelectedTable("users");
                    }
                  }}
                  className={cn(
                    "bg-background/95 flex min-h-44 cursor-pointer flex-col justify-between rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all select-none",
                    selectedTable === "users"
                      ? "border-sky-400/90 bg-sky-500/5 ring-2 shadow-sky-500/10 ring-sky-400/25"
                      : "border-border/80 hover:border-border/90 opacity-90 hover:opacity-100",
                  )}
                >
                  {/* Table Header Bar */}
                  <div className="border-border/60 mb-1.5 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-4.5 items-center justify-center rounded border border-sky-500/30 bg-sky-500/15">
                        <Database className="size-2.5 text-sky-400" />
                      </div>
                      <span className="text-foreground font-mono text-xs font-bold">
                        users
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-4 border-sky-500/30 bg-sky-500/10 px-1 py-0 font-mono text-[8px] text-sky-400"
                    >
                      PK: id
                    </Badge>
                  </div>

                  {/* Column Rows */}
                  <div className="flex flex-1 flex-col justify-between space-y-1 font-mono text-[10.5px]">
                    <div className="bg-muted/60 text-foreground border-border/60 relative flex items-center justify-between rounded border px-1.5 py-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Key className="text-muted-foreground size-2.5 shrink-0" />
                        <span className="text-foreground font-bold">id</span>
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        UUID
                      </span>
                      <div className="absolute top-1/2 -right-1 size-2 -translate-y-1/2 rounded-full border border-white bg-sky-400 shadow-xs" />
                    </div>

                    <div className="flex items-center justify-between px-1.5 py-0.5">
                      <span className="flex items-center gap-1">
                        <span className="text-foreground/90 font-medium">
                          email
                        </span>
                        <span className="text-muted-foreground font-mono text-[8px]">
                          [UNIQ]
                        </span>
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        faker.email
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-1.5 py-0.5">
                      <span className="text-foreground/90 font-medium">
                        role
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        faker.jobTitle
                      </span>
                    </div>

                    {autoTimestamps && (
                      <div className="border-border/40 flex items-center justify-between border-t px-1.5 pt-1 text-[9.5px]">
                        <span className="text-muted-foreground font-medium">
                          createdAt
                        </span>
                        <span className="text-muted-foreground font-mono text-[8.5px]">
                          faker.date
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table Node 2: orders */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(): void => setSelectedTable("orders")}
                  onKeyDown={(e: React.KeyboardEvent): void => {
                    if (e.key === "Enter") {
                      setSelectedTable("orders");
                    }
                  }}
                  className={cn(
                    "bg-background/95 flex min-h-44 cursor-pointer flex-col justify-between rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all select-none",
                    selectedTable === "orders"
                      ? "border-indigo-400/90 bg-indigo-500/5 ring-2 shadow-indigo-500/10 ring-indigo-400/25"
                      : "border-border/80 hover:border-border/90 opacity-90 hover:opacity-100",
                  )}
                >
                  <div className="border-border/60 mb-1.5 flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex size-4.5 items-center justify-center rounded border border-indigo-500/30 bg-indigo-500/15">
                        <Database className="size-2.5 text-indigo-400" />
                      </div>
                      <span className="text-foreground font-mono text-xs font-bold">
                        orders
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="h-4 border-indigo-500/30 bg-indigo-500/10 px-1 py-0 font-mono text-[8px] text-indigo-400"
                    >
                      FK: 1
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-1 font-mono text-[10.5px]">
                    <div className="bg-muted/60 text-foreground border-border/60 flex items-center justify-between rounded border px-1.5 py-1 font-semibold">
                      <span className="flex items-center gap-1">
                        <Key className="text-muted-foreground size-2.5 shrink-0" />
                        <span className="text-foreground font-bold">id</span>
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        UUID
                      </span>
                    </div>

                    <div className="relative flex items-center justify-between rounded border border-sky-500/20 bg-blue-500/10 px-1.5 py-0.5 font-medium text-sky-300">
                      <span className="flex items-center gap-1">
                        <Link2 className="size-2.5 shrink-0 text-sky-400" />
                        <span className="font-bold text-sky-300">userId</span>
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        UUID
                      </span>
                      <div className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full border border-white bg-indigo-400 shadow-xs" />
                    </div>

                    <div className="flex items-center justify-between px-1.5 py-0.5">
                      <span className="text-foreground/90 font-medium">
                        totalAmount
                      </span>
                      <span className="text-muted-foreground font-mono text-[8.5px]">
                        faker.amount
                      </span>
                    </div>

                    {autoTimestamps && (
                      <div className="border-border/40 flex items-center justify-between border-t px-1.5 pt-1 text-[9.5px]">
                        <span className="text-muted-foreground font-medium">
                          createdAt
                        </span>
                        <span className="text-muted-foreground font-mono text-[8.5px]">
                          faker.date
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Status Hint */}
            <div className="text-muted-foreground flex items-center justify-between pt-1 font-mono text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                <span>Selected: &lt;{selectedTable}&gt; table</span>
              </span>
              <span className="text-muted-foreground/80 text-[11px]">
                Click node to inspect schema
              </span>
            </div>
          </div>

          {/* Right Code Output Panel */}
          <div className="bg-background flex flex-col justify-between space-y-4 p-6 sm:p-8 lg:col-span-6">
            {/* Dialect Tabs & Action Bar */}
            <div className="border-border/40 flex items-center justify-between border-b pb-4">
              <div className="bg-muted/50 border-border/40 flex items-center gap-1.5 rounded-xl border p-1">
                <button
                  type="button"
                  onClick={(): void => setActiveTab("drizzle")}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "drizzle"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Drizzle ORM
                </button>
                <button
                  type="button"
                  onClick={(): void => setActiveTab("typescript")}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "typescript"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  TypeScript
                </button>
                <button
                  type="button"
                  onClick={(): void => setActiveTab("mock")}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeTab === "mock"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mock JSON
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy generated code"
                className="border-border/60 bg-muted/40 hover:bg-muted text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5 text-emerald-400" />
                    <span className="font-bold text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Display Console */}
            <div className="relative min-h-77.5 flex-1 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-5 font-mono text-xs text-neutral-100 shadow-2xl">
              <div className="space-y-1">
                {renderSyntaxHighlightedCode(getCurrentCode())}
              </div>
            </div>

            {/* Footer Badges */}
            <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[11px] text-sky-400">
                  <Zap className="size-3" />
                  <span>Type-safe export</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <Sparkles className="size-3" />
                  <span>Instant synthesis</span>
                </span>
              </div>
              <span className="text-muted-foreground/80 font-mono text-[11px]">
                schemaflow.studio v1.4
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
