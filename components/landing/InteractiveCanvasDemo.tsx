"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  Sparkles,
  Activity,
  ArrowRight,
  Terminal,
  RefreshCw,
  Plus,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type ResponseTab = "json" | "curl" | "typescript";
export type LatencyPreset = "instant" | "normal" | "slow" | "error";

interface FieldItem {
  id: string;
  key: string;
  fakerProvider: string;
  enabled: boolean;
  sampleValue: string | number | boolean;
}

const DEFAULT_FIELDS: FieldItem[] = [
  {
    id: "f1",
    key: "id",
    fakerProvider: "faker.string.uuid()",
    enabled: true,
    sampleValue: "usr_99a8b1",
  },
  {
    id: "f2",
    key: "name",
    fakerProvider: "faker.person.fullName()",
    enabled: true,
    sampleValue: "Alexander Vance",
  },
  {
    id: "f3",
    key: "email",
    fakerProvider: "faker.internet.email()",
    enabled: true,
    sampleValue: "alex.vance@fackapi.dev",
  },
  {
    id: "f4",
    key: "role",
    fakerProvider: "faker.person.jobTitle()",
    enabled: true,
    sampleValue: "Principal Systems Architect",
  },
  {
    id: "f5",
    key: "avatar",
    fakerProvider: "faker.image.avatar()",
    enabled: false,
    sampleValue: "https://avatars.fackapi.dev/usr_99.png",
  },
  {
    id: "f6",
    key: "status",
    fakerProvider: 'faker.helpers.arrayElement(["active", "offline"])',
    enabled: true,
    sampleValue: "active",
  },
  {
    id: "f7",
    key: "createdAt",
    fakerProvider: "faker.date.recent()",
    enabled: false,
    sampleValue: "2026-08-01T12:00:00Z",
  },
];

/**
 * Interactive Live Dashboard Endpoint Creator & Simulator.
 * Demonstrates how a developer creates, customizes, and tests an endpoint in Fack API's dashboard.
 */
export const InteractiveCanvasDemo = (): React.JSX.Element => {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [routePath, setRoutePath] = useState<string>("/api/v1/users");
  const [fields, setFields] = useState<FieldItem[]>(DEFAULT_FIELDS);
  const [latencyPreset, setLatencyPreset] = useState<LatencyPreset>("normal");
  const [activeTab, setActiveTab] = useState<ResponseTab>("json");
  const [copied, setCopied] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Toggle field visibility
  const toggleField = (id: string): void => {
    setFields((prev: FieldItem[]): FieldItem[] =>
      prev.map((f: FieldItem): FieldItem =>
        f.id === id ? { ...f, enabled: !f.enabled } : f,
      ),
    );
  };

  // Calculate latency duration
  const latencyMs = useMemo((): number => {
    switch (latencyPreset) {
      case "instant":
        return 6;
      case "normal":
        return 24;
      case "slow":
        return 280;
      case "error":
        return 45;
    }
  }, [latencyPreset]);

  const statusCode = useMemo((): number => {
    if (latencyPreset === "error") {
      return 500;
    }
    if (method === "POST") {
      return 201;
    }
    return 200;
  }, [latencyPreset, method]);

  // Simulated payload generator
  const generatedJson = useMemo((): string => {
    if (statusCode === 500) {
      return JSON.stringify(
        {
          error: "Internal Server Error",
          status: 500,
          message: "Chaos injection active: simulated backend failure.",
          timestamp: new Date().toISOString(),
        },
        undefined,
        2,
      );
    }

    const activeProps = fields.filter((f: FieldItem): boolean => f.enabled);
    const item: Record<string, string | number | boolean> = {};
    activeProps.forEach((f: FieldItem): void => {
      item[f.key] = f.sampleValue;
    });

    if (method === "POST") {
      return JSON.stringify(
        {
          status: 201,
          message: "Resource created successfully",
          data: item,
        },
        undefined,
        2,
      );
    }

    return JSON.stringify(
      {
        page: 1,
        limit: 10,
        total: 150,
        data: [item],
      },
      undefined,
      2,
    );
  }, [fields, statusCode, method]);

  // Generated cURL Command
  const generatedCurl = useMemo((): string => {
    return `curl -X ${method} "https://fackapi.studio${routePath}" \\
  -H "Accept: application/json"`;
  }, [method, routePath]);

  // Generated TypeScript Interface
  const generatedTs = useMemo((): string => {
    const activeProps = fields.filter((f: FieldItem): boolean => f.enabled);
    const lines = activeProps.map((f: FieldItem): string => {
      const type =
        typeof f.sampleValue === "number"
          ? "number"
          : typeof f.sampleValue === "boolean"
            ? "boolean"
            : "string";
      return `  ${f.key}: ${type};`;
    });

    return `// Generated TypeScript DTO for ${routePath}
export interface UserDto {
${lines.join("\n")}
}

export type ApiResponse = {
  status: ${statusCode};
  data: UserDto[];
};`;
  }, [fields, routePath, statusCode]);

  const currentCode = useMemo((): string => {
    switch (activeTab) {
      case "json":
        return generatedJson;
      case "curl":
        return generatedCurl;
      case "typescript":
        return generatedTs;
    }
  }, [activeTab, generatedJson, generatedCurl, generatedTs]);

  const handleCopy = (): void => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout((): void => setCopied(false), 2000);
  };

  const handleSimulateRequest = (): void => {
    setRefreshing(true);
    setTimeout((): void => setRefreshing(false), 300);
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
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
            <Plus className="size-3" />
            <span>Interactive Dashboard Preview</span>
          </div>

          <h2 className="text-foreground text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Create Mock Endpoints in Seconds.{" "}
            <br className="hidden sm:inline" />
            Deploy Without Writing a Server.
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-sm leading-relaxed sm:text-base">
            Experience how easy it is to create mock routes in the Fack API
            dashboard. Configure methods, assign Faker.js generators, inject
            simulated chaos, and see instant live outputs below.
          </p>
        </div>

        {/* 2-Column Framed Grid Showcase */}
        <div className="divide-border/40 border-border/40 grid grid-cols-1 divide-y border-t lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left Column: Interactive Dashboard Route Creator */}
          <div className="bg-card/30 flex flex-col justify-between space-y-6 p-6 sm:p-8 lg:col-span-6">
            {/* Top Window Bar */}
            <div className="border-border/40 flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-rose-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-foreground ml-2 flex items-center gap-1.5 font-mono text-xs font-bold">
                  <Layers className="size-3.5 text-sky-400" />
                  <span>Dashboard: Endpoint Builder</span>
                </span>
              </div>
              <span className="text-muted-foreground bg-muted/60 border-border/60 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold">
                Step 1: Configure
              </span>
            </div>

            {/* Control 1: HTTP Method & Path */}
            <div className="space-y-2">
              <label className="text-foreground flex items-center justify-between text-xs font-bold">
                <span>1. Select Method &amp; Route Path</span>
                <span className="text-muted-foreground font-mono text-[10px]">
                  HTTP Route
                </span>
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* HTTP Method Pills */}
                <div className="bg-muted/50 border-border/40 flex shrink-0 items-center gap-1 rounded-xl border p-1">
                  {(["GET", "POST", "PUT", "DELETE"] as const).map(
                    (m: HttpMethod) => (
                      <button
                        key={m}
                        type="button"
                        onClick={(): void => setMethod(m)}
                        className={cn(
                          "cursor-pointer rounded-lg px-2.5 py-1 font-mono text-xs font-bold transition-all",
                          method === m
                            ? m === "GET"
                              ? "bg-emerald-500 text-white shadow-xs"
                              : m === "POST"
                                ? "bg-blue-500 text-white shadow-xs"
                                : m === "PUT"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-rose-500 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m}
                      </button>
                    ),
                  )}
                </div>

                {/* Route Path Selector */}
                <select
                  value={routePath}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>): void =>
                    setRoutePath(e.target.value)
                  }
                  className="border-border/60 bg-background text-foreground focus:ring-ring/40 flex-1 cursor-pointer rounded-xl border px-3 py-1.5 font-mono text-xs font-semibold shadow-xs focus:ring-2 focus:outline-hidden"
                  aria-label="Select Route Path"
                >
                  <option value="/api/v1/users">/api/v1/users</option>
                  <option value="/api/v1/products">/api/v1/products</option>
                  <option value="/api/v1/orders">/api/v1/orders</option>
                </select>
              </div>
            </div>

            {/* Control 2: Faker Fields Customizer */}
            <div className="space-y-2">
              <label className="text-foreground flex items-center justify-between text-xs font-bold">
                <span>2. Assign Faker.js Schema Generators</span>
                <span className="font-mono text-[10px] text-emerald-400">
                  Click to Toggle
                </span>
              </label>

              <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {fields.map((f: FieldItem) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={(): void => toggleField(f.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-2 text-left font-mono text-xs transition-all select-none",
                      f.enabled
                        ? "bg-background border-border text-foreground shadow-xs"
                        : "bg-muted/20 border-border/40 text-muted-foreground/50 line-through opacity-60 hover:opacity-80",
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          f.enabled ? "bg-emerald-400" : "bg-neutral-500",
                        )}
                      />
                      <span className="truncate font-bold">{f.key}</span>
                    </div>
                    <span className="max-w-[120px] truncate text-[9.5px] font-normal text-sky-400">
                      {f.fakerProvider.replace("faker.", "")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Control 3: Latency & Chaos Simulator */}
            <div className="space-y-2">
              <label className="text-foreground flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1">
                  <Activity className="size-3.5 text-amber-400" />
                  <span>3. Network Latency &amp; Chaos Simulation</span>
                </span>
                <span className="font-mono text-[10px] text-amber-400">
                  {latencyMs}ms delay
                </span>
              </label>

              <div className="grid grid-cols-4 gap-1.5 font-mono text-xs">
                <button
                  type="button"
                  onClick={(): void => setLatencyPreset("instant")}
                  className={cn(
                    "cursor-pointer rounded-lg border p-2 text-center transition-all",
                    latencyPreset === "instant"
                      ? "border-emerald-500/50 bg-emerald-500/10 font-bold text-emerald-400"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted",
                  )}
                >
                  ⚡ 6ms
                </button>
                <button
                  type="button"
                  onClick={(): void => setLatencyPreset("normal")}
                  className={cn(
                    "cursor-pointer rounded-lg border p-2 text-center transition-all",
                    latencyPreset === "normal"
                      ? "border-sky-500/50 bg-sky-500/10 font-bold text-sky-400"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted",
                  )}
                >
                  🌐 24ms
                </button>
                <button
                  type="button"
                  onClick={(): void => setLatencyPreset("slow")}
                  className={cn(
                    "cursor-pointer rounded-lg border p-2 text-center transition-all",
                    latencyPreset === "slow"
                      ? "border-amber-500/50 bg-amber-500/10 font-bold text-amber-400"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted",
                  )}
                >
                  🐢 280ms
                </button>
                <button
                  type="button"
                  onClick={(): void => setLatencyPreset("error")}
                  className={cn(
                    "cursor-pointer rounded-lg border p-2 text-center transition-all",
                    latencyPreset === "error"
                      ? "border-rose-500/50 bg-rose-500/10 font-bold text-rose-400"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted",
                  )}
                >
                  💥 500 Error
                </button>
              </div>
            </div>

            {/* Bottom CTA to Dashboard */}
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="bg-foreground text-background inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-bold shadow-md transition-all hover:opacity-90 sm:text-sm"
              >
                <span>Launch Dashboard to Create Yours</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Mock Server & Response Console */}
          <div className="bg-background flex flex-col justify-between space-y-4 p-6 sm:p-8 lg:col-span-6">
            {/* Response Action Bar */}
            <div className="border-border/40 flex items-center justify-between border-b pb-4">
              <div className="bg-muted/50 border-border/40 flex items-center gap-1.5 rounded-xl border p-1">
                <button
                  type="button"
                  onClick={(): void => setActiveTab("json")}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    activeTab === "json"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Live Mock JSON
                </button>
                <button
                  type="button"
                  onClick={(): void => setActiveTab("curl")}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    activeTab === "curl"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  cURL Command
                </button>
                <button
                  type="button"
                  onClick={(): void => setActiveTab("typescript")}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                    activeTab === "typescript"
                      ? "bg-background text-foreground border-border/60 border shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  TypeScript DTO
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateRequest}
                  title="Send request & generate new sample"
                  aria-label="Send request"
                  className="border-border/60 bg-muted/40 hover:bg-muted text-foreground cursor-pointer rounded-lg border p-1.5 transition-all"
                >
                  <RefreshCw
                    className={cn(
                      "size-3.5",
                      refreshing && "animate-spin text-sky-400",
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy output"
                  className="border-border/60 bg-muted/40 hover:bg-muted text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="font-bold text-emerald-400">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Endpoint Status Bar */}
            <div className="bg-muted/40 border-border/60 flex items-center justify-between rounded-xl border p-2.5 font-mono text-xs">
              <div className="flex items-center gap-2 truncate">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[9px] font-bold",
                    method === "GET"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : method === "POST"
                        ? "bg-blue-500/20 text-blue-400"
                        : method === "PUT"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400",
                  )}
                >
                  {method}
                </span>
                <span className="text-foreground truncate font-bold">
                  https://fackapi.studio{routePath}
                </span>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 px-2 py-0.5 font-mono text-[9px]",
                  statusCode === 200 || statusCode === 201
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-400",
                )}
              >
                {statusCode}{" "}
                {statusCode === 200
                  ? "OK"
                  : statusCode === 201
                    ? "Created"
                    : "Error"}{" "}
                • {latencyMs}ms
              </Badge>
            </div>

            {/* Code Display Console */}
            <div className="relative min-h-77.5 flex-1 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-950 p-5 font-mono text-xs text-neutral-100 shadow-2xl">
              <pre className="font-mono text-xs leading-relaxed text-neutral-300">
                {currentCode}
              </pre>
            </div>

            {/* Footer Badges */}
            <div className="text-muted-foreground flex items-center justify-between pt-1 text-xs">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <Sparkles className="size-3" />
                  <span>Instant Dynamic Synthesis</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] text-sky-400">
                  <Terminal className="size-3" />
                  <span>Ready for curl &amp; frontend fetch</span>
                </span>
              </div>
              <span className="text-muted-foreground/80 font-mono text-[11px]">
                Step 3: Ready to use
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
