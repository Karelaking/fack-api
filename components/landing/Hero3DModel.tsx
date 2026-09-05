"use client";

import React, { useState, useRef, useCallback } from "react";
import { Database, Key, Link2, Code2, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Hero3DModelProps = {
  className?: string;
};

/**
 * Interactive 3D Isometric Mock Schema & API Visualizer for Hero section.
 * Renders multi-level 3D node layout with relation connecting beams,
 * handles, and cardinality badges (1:N) between PK/FK ports with mouse-tracking perspective.
 */
export const Hero3DModel = ({
  className = "",
}: Hero3DModelProps): React.JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState<number>(18);
  const [rotateY, setRotateY] = useState<number>(-22);
  const [activeHoverTable, setActiveHoverTable] = useState<string | undefined>(
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
    setActiveHoverTable(undefined);
  }, []);

  const isUsersHovered = activeHoverTable === "users";
  const isOrdersHovered = activeHoverTable === "orders";
  const isItemsHovered = activeHoverTable === "order_items";

  const isRel1Active = isUsersHovered || isOrdersHovered;
  const isRel2Active = isOrdersHovered || isItemsHovered;

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
        <div className="size-96 animate-pulse rounded-full bg-linear-to-tr from-blue-600/20 via-indigo-500/15 to-cyan-400/20 blur-3xl" />
        <div className="absolute size-72 translate-x-12 -translate-y-12 rounded-full bg-purple-600/10 blur-2xl" />
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

        {/* SVG Real ERD Relation Connecting Beams */}
        <svg
          className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
          style={{ transform: "translateZ(60px)" }}
        >
          <defs>
            <linearGradient
              id="rel-gradient-1"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
              <stop offset="50%" stopColor="#818cf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#c084fc" stopOpacity={1} />
            </linearGradient>
            <linearGradient
              id="rel-gradient-2"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
            </linearGradient>
            <filter
              id="glow-beam-erd"
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

          {/* Relation 1: users.id -> orders.user_id */}
          <g
            className="transition-opacity duration-300"
            opacity={isRel1Active || activeHoverTable === undefined ? 1 : 0.45}
          >
            <path
              d="M 232 65 C 290 65, 220 168, 275 168"
              fill="none"
              stroke="url(#rel-gradient-1)"
              strokeWidth={isRel1Active ? 4 : 2.8}
              filter="url(#glow-beam-erd)"
            />
            <path
              d="M 232 65 C 290 65, 220 168, 275 168"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="animate-[dash_6s_linear_infinite]"
            />

            {/* Connection Pin Beacons */}
            <circle
              cx="232"
              cy="65"
              r="4"
              fill="#38bdf8"
              className="animate-ping"
            />
            <circle
              cx="232"
              cy="65"
              r="3"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <circle
              cx="275"
              cy="168"
              r="3"
              fill="#818cf8"
              stroke="#ffffff"
              strokeWidth="1"
            />

            {/* Cardinality 1:N Labels */}
            <g transform="translate(236, 50)">
              <rect
                x="0"
                y="0"
                width="13"
                height="13"
                rx="3"
                fill="#0f172a"
                stroke="#38bdf8"
                strokeWidth="1"
              />
              <text
                x="6.5"
                y="9.5"
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                1
              </text>
            </g>
            <g transform="translate(256, 154)">
              <rect
                x="0"
                y="0"
                width="13"
                height="13"
                rx="3"
                fill="#0f172a"
                stroke="#818cf8"
                strokeWidth="1"
              />
              <text
                x="6.5"
                y="9.5"
                textAnchor="middle"
                fill="#818cf8"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                N
              </text>
            </g>
          </g>

          {/* Relation 2: orders.id -> order_items.order_id */}
          <g
            className="transition-opacity duration-300"
            opacity={isRel2Active || activeHoverTable === undefined ? 1 : 0.45}
          >
            <path
              d="M 370 240 C 370 305, 290 292, 240 292"
              fill="none"
              stroke="url(#rel-gradient-2)"
              strokeWidth={isRel2Active ? 4 : 2.8}
              filter="url(#glow-beam-erd)"
            />
            <path
              d="M 370 240 C 370 305, 290 292, 240 292"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              className="animate-[dash_8s_linear_infinite]"
            />

            {/* Connection Pin Beacons */}
            <circle
              cx="370"
              cy="240"
              r="3"
              fill="#818cf8"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <circle
              cx="240"
              cy="292"
              r="4"
              fill="#34d399"
              className="animate-ping"
            />
            <circle
              cx="240"
              cy="292"
              r="3"
              fill="#34d399"
              stroke="#ffffff"
              strokeWidth="1"
            />

            {/* Cardinality 1:N Labels */}
            <g transform="translate(376, 238)">
              <rect
                x="0"
                y="0"
                width="13"
                height="13"
                rx="3"
                fill="#0f172a"
                stroke="#818cf8"
                strokeWidth="1"
              />
              <text
                x="6.5"
                y="9.5"
                textAnchor="middle"
                fill="#818cf8"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                1
              </text>
            </g>
            <g transform="translate(244, 276)">
              <rect
                x="0"
                y="0"
                width="13"
                height="13"
                rx="3"
                fill="#0f172a"
                stroke="#34d399"
                strokeWidth="1"
              />
              <text
                x="6.5"
                y="9.5"
                textAnchor="middle"
                fill="#34d399"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                N
              </text>
            </g>
          </g>
        </svg>

        {/* Layer 1: Floating Schema Table Cards */}

        {/* Table 1: users (Top-Left) */}
        <div
          onMouseEnter={(): void => setActiveHoverTable("users")}
          onMouseLeave={(): void => setActiveHoverTable(undefined)}
          className={cn(
            "bg-card/85 absolute top-2 left-4 w-52 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 sm:w-56",
            isUsersHovered
              ? "z-30 scale-105 border-sky-400 shadow-sky-500/30"
              : "border-border/70 shadow-black/20",
          )}
          style={{
            transform: "translateZ(60px)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="border-border/50 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/15">
                <Database className="size-3.5 text-sky-400" />
              </div>
              <span className="text-foreground font-mono text-xs font-bold">
                users
              </span>
            </div>
            <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-sky-400">
              PK: id
            </span>
          </div>

          <div className="mt-2 space-y-1 font-mono text-[10px]">
            <div className="relative flex items-center justify-between rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-300">
              <div className="flex items-center gap-1.5">
                <Key className="size-2.5 shrink-0 text-amber-400" />
                <span>id</span>
              </div>
              <span className="text-muted-foreground text-[9px]">uuid</span>
              <div className="absolute top-1/2 -right-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-sky-400 shadow-xs" />
            </div>
            <div className="text-muted-foreground flex items-center justify-between px-1.5 py-0.5">
              <span>email</span>
              <span className="text-[9px]">varchar</span>
            </div>
            <div className="text-muted-foreground flex items-center justify-between px-1.5 py-0.5">
              <span>role</span>
              <span className="text-[9px]">faker.jobTitle</span>
            </div>
          </div>
        </div>

        {/* Table 2: orders (Center-Right) */}
        <div
          onMouseEnter={(): void => setActiveHoverTable("orders")}
          onMouseLeave={(): void => setActiveHoverTable(undefined)}
          className={cn(
            "bg-card/85 absolute top-28 right-4 w-56 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 sm:w-60",
            isOrdersHovered
              ? "z-30 scale-105 border-indigo-400 shadow-indigo-500/30"
              : "border-border/70 shadow-black/20",
          )}
          style={{
            transform: "translateZ(90px)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="border-border/50 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg border border-indigo-500/30 bg-indigo-500/15">
                <Database className="size-3.5 text-indigo-400" />
              </div>
              <span className="text-foreground font-mono text-xs font-bold">
                orders
              </span>
            </div>
            <span className="rounded-full bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-indigo-400">
              FK: 1
            </span>
          </div>

          <div className="mt-2 space-y-1 font-mono text-[10px]">
            <div className="relative flex items-center justify-between rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 font-semibold text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Key className="size-2.5 shrink-0 text-amber-400" />
                <span>id</span>
              </div>
              <span className="text-muted-foreground text-[9px]">uuid</span>
              <div className="absolute -bottom-1.5 left-6 size-2 rounded-full border border-white bg-indigo-400 shadow-xs" />
            </div>
            <div className="relative flex items-center justify-between rounded border border-sky-500/20 bg-blue-500/10 px-1.5 py-0.5 font-medium text-sky-300">
              <div className="flex items-center gap-1.5">
                <Link2 className="size-2.5 shrink-0 text-sky-400" />
                <span>user_id</span>
              </div>
              <span className="text-muted-foreground text-[9px]">uuid</span>
              <div className="absolute top-1/2 -left-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-indigo-400 shadow-xs" />
            </div>
            <div className="text-muted-foreground flex items-center justify-between px-1.5 py-0.5">
              <span>total_amount</span>
              <span className="text-[9px]">numeric</span>
            </div>
          </div>
        </div>

        {/* Table 3: order_items (Bottom-Center) */}
        <div
          onMouseEnter={(): void => setActiveHoverTable("order_items")}
          onMouseLeave={(): void => setActiveHoverTable(undefined)}
          className={cn(
            "bg-card/85 absolute bottom-2 left-16 w-52 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 sm:w-56",
            isItemsHovered
              ? "z-30 scale-105 border-emerald-400 shadow-emerald-500/30"
              : "border-border/70 shadow-black/20",
          )}
          style={{
            transform: "translateZ(45px)",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="border-border/50 flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
                <Database className="size-3.5 text-emerald-400" />
              </div>
              <span className="text-foreground font-mono text-xs font-bold">
                order_items
              </span>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-400">
              FK: 1
            </span>
          </div>

          <div className="mt-2 space-y-1 font-mono text-[10px]">
            <div className="flex items-center justify-between rounded bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-300">
              <div className="flex items-center gap-1.5">
                <Key className="size-2.5 shrink-0 text-amber-400" />
                <span>id</span>
              </div>
              <span className="text-muted-foreground text-[9px]">uuid</span>
            </div>
            <div className="relative flex items-center justify-between rounded border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 font-medium text-indigo-300">
              <div className="flex items-center gap-1.5">
                <Link2 className="size-2.5 shrink-0 text-indigo-400" />
                <span>order_id</span>
              </div>
              <span className="text-muted-foreground text-[9px]">uuid</span>
              <div className="absolute top-1/2 -right-1.5 size-2 -translate-y-1/2 rounded-full border border-white bg-emerald-400 shadow-xs" />
            </div>
          </div>
        </div>

        {/* Floating Tech Badges in 3D Perspective */}
        <div
          className="bg-background/90 absolute -top-4 right-12 flex items-center gap-2 rounded-xl border border-sky-500/30 px-3 py-1.5 font-mono text-xs font-semibold text-sky-400 shadow-lg backdrop-blur-md"
          style={{
            transform: "translateZ(110px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Code2 className="size-3.5 text-sky-400" />
          <span>&lt;/ auto generated JSON &amp; OpenAPI &gt;</span>
        </div>

        <div
          className="bg-background/90 absolute -right-4 bottom-6 flex items-center gap-2 rounded-xl border border-purple-500/30 px-3 py-1.5 font-mono text-xs font-semibold text-purple-400 shadow-lg backdrop-blur-md"
          style={{
            transform: "translateZ(80px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Zap className="size-3.5 text-purple-400" />
          <span>type-safe</span>
        </div>

        <div
          className="bg-background/90 absolute top-1/2 -left-6 flex items-center gap-1.5 rounded-xl border border-emerald-500/30 px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 shadow-lg backdrop-blur-md"
          style={{
            transform: "translateZ(75px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Check className="size-3 text-emerald-400" />
          <span>auto-sync</span>
        </div>
      </div>
    </div>
  );
};
