"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Code2,
  Sparkles,
  Activity,
  ArrowRight,
  Check,
  Terminal,
  Plus,
  Play,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Hero3DModelProps = {
  className?: string;
};

/**
 * Interactive 3D Isometric Dashboard & Endpoint Creation Visualizer for Hero section.
 * Shows the exact 3-step dashboard workflow:
 * 1. "+ Add Route" Dashboard Modal / Inspector (defining path, method & Faker generators)
 * 2. Visual Canvas Route Node with interactive ports & latency simulator
 * 3. Instant Live Mock Response Console (curl & real-time JSON payload)
 */
export const Hero3DModel = ({
  className = "",
}: Hero3DModelProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(18);
  const [rotateY, setRotateY] = useState<number>(-22);
  const [activeHoverNode, setActiveHoverNode] = useState<string | undefined>(
    undefined,
  );

  const rectRef = useRef<
    { left: number; top: number; width: number; height: number } | undefined
  >(undefined);
  const rafIdRef = useRef<number | undefined>(undefined);

  const updateRect = useCallback((): void => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      rectRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }
  }, []);

  const handleMouseEnter = useCallback((): void => {
    updateRect();
  }, [updateRect]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (!rectRef.current) {
        updateRect();
      }
      const rect = rectRef.current;
      if (!rect || rect.width === 0 || rect.height === 0) {
        return;
      }

      const clientX = e.clientX;
      const clientY = e.clientY;

      if (rafIdRef.current !== undefined) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame((): void => {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const percentX = (clientX - centerX) / (rect.width / 2);
        const percentY = (clientY - centerY) / (rect.height / 2);

        setRotateX(18 - percentY * 16);
        setRotateY(-22 + percentX * 18);
      });
    },
    [updateRect],
  );

  const handleMouseLeave = useCallback((): void => {
    if (rafIdRef.current !== undefined) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rectRef.current = undefined;
    setRotateX(18);
    setRotateY(-22);
    setActiveHoverNode(undefined);
  }, []);

  const isModalHovered = activeHoverNode === "modal";
  const isNodeHovered = activeHoverNode === "canvas_node";
  const isResponseHovered = activeHoverNode === "response";

  const isBeam1Active = isModalHovered || isNodeHovered;
  const isBeam2Active = isNodeHovered || isResponseHovered;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative flex h-full min-h-[130%]! w-full cursor-grab items-center justify-center overflow-hidden p-1 select-none active:cursor-grabbing sm:min-h-115 sm:p-8",
        className,
      )}
      style={{ perspective: "1200px" }}
    >
      {/* Background Ambient Radial Glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-96 animate-pulse rounded-full bg-linear-to-tr from-emerald-500/15 via-blue-500/20 to-purple-500/15 blur-3xl" />
        <div className="absolute size-72 translate-x-12 -translate-y-12 rounded-full bg-cyan-400/15 blur-2xl" />
      </div>

      {/* Background Perspective Grid Floor */}
      <div
        className="pointer-events-none absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotateX * 0.4}deg) rotateY(${rotateY * 0.4}deg) scale(1.1)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[32px_32px] opacity-60" />
      </div>

      {/* Main 3D Perspective Canvas Container */}
      <div
        className="xs:scale-80 relative flex aspect-4/3 w-full max-w-lg scale-[0.68] items-center justify-center transition-transform duration-200 ease-out sm:scale-95 md:scale-100"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(3deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Layer 0: Base Isometric Grid Plane */}
        <div
          className="border-primary/20 bg-background/40 absolute inset-0 rounded-3xl border shadow-2xl backdrop-blur-xs transition-transform duration-300"
          style={{
            transform: "translateZ(-40px)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="h-full w-full rounded-3xl bg-[linear-gradient(to_right,#80808018_1px,transparent_1px),linear-gradient(to_bottom,#80808018_1px,transparent_1px)] bg-size-[20px_20px]" />
        </div>

        {/* SVG Connecting Flow Beams */}
        <svg
          className="pointer-events-none absolute inset-0 z-20 size-full overflow-visible"
          style={{ transform: "translateZ(60px)" }}
        >
          <defs>
            <linearGradient
              id="create-flow-gradient-1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={1} />
            </linearGradient>
            <linearGradient
              id="create-flow-gradient-2"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={1} />
            </linearGradient>
            <filter
              id="glow-beam-endpoint"
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Beam 1: Dashboard Modal (x=245, y=78) -> Canvas Node Input Port (x=280, y=170) */}
          <g
            className="transition-opacity duration-300"
            opacity={isBeam1Active || activeHoverNode === undefined ? 1 : 0.4}
          >
            <path
              d="M 245 78 C 305 78, 230 170, 280 170"
              fill="none"
              stroke="url(#create-flow-gradient-1)"
              strokeWidth={isBeam1Active ? 4 : 2.8}
              filter="url(#glow-beam-endpoint)"
            />
            <path
              d="M 245 78 C 305 78, 230 170, 280 170"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="animate-[dash_6s_linear_infinite]"
            />

            {/* Connection Pin Beacons */}
            <circle
              cx="245"
              cy="78"
              r="4"
              fill="#10b981"
              className="animate-ping"
            />
            <circle
              cx="245"
              cy="78"
              r="3"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <circle
              cx="280"
              cy="170"
              r="3"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="1"
            />

            {/* Step 1 Label */}
            <g transform="translate(242, 60)">
              <rect
                x="0"
                y="0"
                width="46"
                height="14"
                rx="3"
                fill="#090d16"
                stroke="#10b981"
                strokeWidth="1"
              />
              <text
                x="23"
                y="10"
                textAnchor="middle"
                fill="#10b981"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                1. Deploy
              </text>
            </g>
            <g transform="translate(260, 154)">
              <rect
                x="0"
                y="0"
                width="34"
                height="14"
                rx="3"
                fill="#090d16"
                stroke="#3b82f6"
                strokeWidth="1"
              />
              <text
                x="17"
                y="10"
                textAnchor="middle"
                fill="#3b82f6"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                Canvas
              </text>
            </g>
          </g>

          {/* Beam 2: Canvas Node Output (x=375, y=242) -> Live API Response Console (x=242, y=298) */}
          <g
            className="transition-opacity duration-300"
            opacity={isBeam2Active || activeHoverNode === undefined ? 1 : 0.4}
          >
            <path
              d="M 375 242 C 375 310, 295 298, 242 298"
              fill="none"
              stroke="url(#create-flow-gradient-2)"
              strokeWidth={isBeam2Active ? 4 : 2.8}
              filter="url(#glow-beam-endpoint)"
            />
            <path
              d="M 375 242 C 375 310, 295 298, 242 298"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="animate-[dash_8s_linear_infinite]"
            />

            {/* Connection Pin Beacons */}
            <circle
              cx="375"
              cy="242"
              r="3"
              fill="#8b5cf6"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <circle
              cx="242"
              cy="298"
              r="4"
              fill="#06b6d4"
              className="animate-ping"
            />
            <circle
              cx="242"
              cy="298"
              r="3"
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="1"
            />

            {/* Step 2 Label */}
            <g transform="translate(378, 238)">
              <rect
                x="0"
                y="0"
                width="46"
                height="14"
                rx="3"
                fill="#090d16"
                stroke="#8b5cf6"
                strokeWidth="1"
              />
              <text
                x="23"
                y="10"
                textAnchor="middle"
                fill="#8b5cf6"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                2. Synthesize
              </text>
            </g>
            <g transform="translate(244, 280)">
              <rect
                x="0"
                y="0"
                width="46"
                height="14"
                rx="3"
                fill="#090d16"
                stroke="#06b6d4"
                strokeWidth="1"
              />
              <text
                x="23"
                y="10"
                textAnchor="middle"
                fill="#06b6d4"
                fontSize="8"
                fontWeight="bold"
                fontFamily="monospace"
              >
                3. Live URL
              </text>
            </g>
          </g>
        </svg>

        {/* Layer 1: Floating Step Windows */}

        {/* Card 1: Dashboard "+ Add Route" Modal (Top-Left) */}
        <div
          onMouseEnter={(): void => setActiveHoverNode("modal")}
          onMouseLeave={(): void => setActiveHoverNode(undefined)}
          className={cn(
            "bg-card/95 absolute top-1 left-2 w-60 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 sm:w-64",
            isModalHovered
              ? "z-30 scale-105 border-emerald-400 ring-2 shadow-emerald-500/30 ring-emerald-500/20"
              : "border-border/80 hover:border-border shadow-black/30",
          )}
          style={{
            transform: "translateZ(75px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Window Controls Header */}
          <div className="border-border/50 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <div className="size-2 rounded-full bg-rose-500/80" />
              <div className="size-2 rounded-full bg-amber-500/80" />
              <div className="size-2 rounded-full bg-emerald-500/80" />
              <span className="text-foreground ml-1 flex items-center gap-1 font-mono text-[10px] font-bold tracking-tight">
                <Plus className="size-2.5 text-emerald-400" />
                <span>Dashboard: Add Route</span>
              </span>
            </div>
            <span className="rounded bg-emerald-500/15 px-1 py-0.5 font-mono text-[8px] font-bold text-emerald-400">
              STEP 1
            </span>
          </div>

          {/* Route Configuration Form */}
          <div className="mt-2 space-y-1.5 font-mono text-[10px]">
            {/* Method & Path Selector */}
            <div className="border-border/60 bg-muted/40 flex items-center gap-1 rounded border p-1">
              <span className="rounded bg-emerald-500 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                GET
              </span>
              <span className="text-foreground flex-1 text-[9.5px] font-bold">
                /api/v1/users
              </span>
              <span className="text-muted-foreground text-[8px]">200 OK</span>
            </div>

            {/* Faker Fields Generator Mapping */}
            <div className="border-border/40 bg-background/80 space-y-1 rounded border p-1.5 text-[9px]">
              <div className="text-muted-foreground/80 flex items-center justify-between font-semibold">
                <span>Faker Generator:</span>
                <span className="font-bold text-sky-400">+ Add Field</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">name</span>
                <span className="font-semibold text-sky-400">
                  faker.person.fullName()
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">email</span>
                <span className="font-semibold text-purple-400">
                  faker.internet.email()
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">role</span>
                <span className="font-semibold text-amber-400">
                  faker.person.jobTitle()
                </span>
              </div>
            </div>

            {/* Deploy Action Button */}
            <div className="bg-foreground text-background relative flex items-center justify-between rounded-lg px-2.5 py-1 text-[9.5px] font-bold shadow-xs">
              <span className="flex items-center gap-1">
                <Play className="size-2.5 fill-current" />
                <span>Deploy Mock Route</span>
              </span>
              <Check className="size-3 text-emerald-400" />
              <div className="absolute top-1/2 -right-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-emerald-400 shadow-xs" />
            </div>
          </div>
        </div>

        {/* Card 2: Visual Canvas Route Node (Center-Right) */}
        <div
          onMouseEnter={(): void => setActiveHoverNode("canvas_node")}
          onMouseLeave={(): void => setActiveHoverNode(undefined)}
          className={cn(
            "bg-card/95 absolute top-24 right-2 w-62 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 sm:w-68",
            isNodeHovered
              ? "z-30 scale-105 border-blue-400 ring-2 shadow-blue-500/30 ring-blue-500/20"
              : "border-border/80 hover:border-border shadow-black/30",
          )}
          style={{
            transform: "translateZ(95px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Node Header */}
          <div className="border-border/50 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5">
              <span className="rounded-md border border-blue-500/30 bg-blue-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-400">
                GET
              </span>
              <span className="text-foreground font-mono text-xs font-bold tracking-tight">
                /api/v1/users
              </span>
            </div>
            <span className="rounded bg-blue-500/15 px-1 py-0.5 font-mono text-[8px] font-bold text-blue-400">
              STEP 2: CANVAS
            </span>
          </div>

          {/* Node Canvas Details */}
          <div className="mt-2 space-y-1.5 font-mono text-[10px]">
            {/* Input Port */}
            <div className="relative flex items-center justify-between rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-sky-300">
              <span className="font-semibold">Format: Paged List</span>
              <span className="text-[8.5px]">limit: 10</span>
              <div className="absolute top-1/2 -left-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-blue-400 shadow-xs" />
            </div>

            {/* Chaos / Latency Injection Setting */}
            <div className="flex items-center justify-between rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-300">
              <span className="flex items-center gap-1">
                <Activity className="size-2.5 text-amber-400" />
                <span>Simulated Latency</span>
              </span>
              <span className="font-bold">45ms</span>
            </div>

            {/* Live Status Output Port */}
            <div className="border-border/40 relative flex items-center justify-between border-t pt-1 text-[9px]">
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <span className="size-1.5 animate-ping rounded-full bg-emerald-400" />
                <span>Status: 200 OK</span>
              </span>
              <span className="text-muted-foreground text-[8.5px]">
                output port
              </span>
              <div className="absolute -bottom-1.5 left-8 size-2 rounded-full border border-white bg-purple-400 shadow-xs" />
            </div>
          </div>
        </div>

        {/* Card 3: Instant Live Mock API Response & Terminal (Bottom-Left) */}
        <div
          onMouseEnter={(): void => setActiveHoverNode("response")}
          onMouseLeave={(): void => setActiveHoverNode(undefined)}
          className={cn(
            "absolute bottom-1 left-8 w-60 rounded-2xl border border-neutral-800 bg-neutral-950 p-3.5 text-neutral-100 shadow-2xl backdrop-blur-md transition-all duration-300 sm:w-66",
            isResponseHovered
              ? "z-30 scale-105 border-cyan-400 ring-2 shadow-cyan-500/30 ring-cyan-500/20"
              : "hover:border-neutral-700",
          )}
          style={{
            transform: "translateZ(50px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3 text-cyan-400" />
              <span className="font-mono text-[9.5px] font-bold text-neutral-200">
                Live Mock Response
              </span>
            </div>
            <span className="rounded bg-cyan-500/20 px-1 py-0.5 font-mono text-[8px] font-bold text-cyan-300">
              STEP 3: LIVE
            </span>
          </div>

          {/* Real-Time JSON Output */}
          <div className="mt-1.5 space-y-1 font-mono text-[9px] leading-relaxed">
            <div className="text-neutral-400">
              <span className="font-bold text-emerald-400">$ curl</span>{" "}
              /api/mock/v1/users
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-900/90 p-1.5 text-neutral-300">
              <div>&#123;</div>
              <div className="pl-2.5 text-neutral-400">
                &quot;id&quot;:{" "}
                <span className="text-emerald-400">&quot;usr_99a8b1&quot;</span>
                ,
              </div>
              <div className="pl-2.5 text-neutral-400">
                &quot;name&quot;:{" "}
                <span className="text-sky-300">
                  &quot;Alexander Vance&quot;
                </span>
                ,
              </div>
              <div className="pl-2.5 text-neutral-400">
                &quot;email&quot;:{" "}
                <span className="text-purple-300">
                  &quot;alex@fackapi.dev&quot;
                </span>
              </div>
              <div>&#125;</div>
            </div>
            <div className="relative flex items-center justify-between pt-0.5 text-[8px] text-neutral-400">
              <span className="font-semibold text-cyan-400">
                application/json
              </span>
              <span className="font-bold text-emerald-400">200 OK (14ms)</span>
              <div className="absolute top-1/2 -right-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-cyan-400 shadow-xs" />
            </div>
          </div>
        </div>

        {/* Floating Badges in 3D Perspective */}
        {/* Badge 1: Top-Right Workflow Guide */}
        <div
          className="bg-background/95 absolute -top-5 right-6 flex items-center gap-1.5 rounded-xl border border-cyan-500/40 px-3 py-1.5 font-mono text-xs font-semibold text-cyan-400 shadow-xl backdrop-blur-md"
          style={{
            transform: "translateZ(115px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Code2 className="size-3.5 text-cyan-400" />
          <span>&lt;/ Create Endpoint in Dashboard &gt;</span>
        </div>

        {/* Badge 2: Right-Center Faker Engine Badge */}
        <div
          className="bg-background/95 absolute -right-6 bottom-8 flex items-center gap-1.5 rounded-xl border border-purple-500/40 px-3 py-1.5 font-mono text-xs font-semibold text-purple-400 shadow-xl backdrop-blur-md"
          style={{
            transform: "translateZ(85px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Sparkles className="size-3.5 text-purple-400" />
          <span>1-click Faker.js fields</span>
        </div>

        {/* Badge 3: Left-Center 3-Step Banner */}
        <div
          className="bg-background/95 absolute top-1/2 -left-8 flex items-center gap-1.5 rounded-xl border border-emerald-500/40 px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 shadow-xl backdrop-blur-md"
          style={{
            transform: "translateZ(80px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Check className="size-3 text-emerald-400" />
          <span>Instant Live Mock URL</span>
        </div>

        {/* Badge 4: Bottom Offline Storage */}
        <div
          className="bg-background/95 border-border/60 text-muted-foreground absolute -bottom-4 left-1/3 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-[11px] shadow-xl backdrop-blur-md"
          style={{
            transform: "translateZ(70px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Server className="size-3 text-sky-400" />
          <span>100% private local SQLite</span>
        </div>
      </div>
    </div>
  );
};
