"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  variant?: "badge" | "glyph";
  className?: string;
}

/**
 * Fack API Official Brand Logo — "The Route Nexus"
 *
 * Represents an API route branch tree and network canvas nodes forming the letter "F".
 * Supports both standalone glyph and framed sharp badge variants with high-precision vector paths.
 */
export function BrandLogo({
  size = 28,
  variant = "badge",
  className,
  ...props
}: BrandLogoProps): React.JSX.Element {
  const id = React.useId();
  const bgGradId = `fack-bg-${id}`;
  const borderGradId = `fack-border-${id}`;
  const trunkGradId = `fack-trunk-${id}`;
  const midGradId = `fack-mid-${id}`;
  const glowId = `fack-glow-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={cn("shrink-0 select-none", className)}
      aria-label="Fack API Logo"
      role="img"
      {...props}
    >
      <defs>
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0b0f19" />
          <stop offset="100%" stopColor="#06080d" />
        </linearGradient>

        <linearGradient id={borderGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>

        <linearGradient
          id={trunkGradId}
          x1="166"
          y1="380"
          x2="350"
          y2="136"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <linearGradient
          id={midGradId}
          x1="166"
          y1="260"
          x2="290"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>

        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {variant === "badge" && (
        <>
          {/* Dark Glassmorphic Badge with Sharp Corners */}
          <rect
            width="512"
            height="512"
            fill={`url(#${bgGradId})`}
            stroke={`url(#${borderGradId})`}
            strokeWidth="4"
          />

          {/* Canvas Blueprint Grid */}
          <g stroke="rgba(255,255,255,0.04)" strokeWidth="1.5">
            <line x1="64" y1="0" x2="64" y2="512" />
            <line x1="128" y1="0" x2="128" y2="512" />
            <line x1="192" y1="0" x2="192" y2="512" />
            <line x1="256" y1="0" x2="256" y2="512" />
            <line x1="320" y1="0" x2="320" y2="512" />
            <line x1="384" y1="0" x2="384" y2="512" />
            <line x1="448" y1="0" x2="448" y2="512" />

            <line x1="0" y1="64" x2="512" y2="64" />
            <line x1="0" y1="128" x2="512" y2="128" />
            <line x1="0" y1="192" x2="512" y2="192" />
            <line x1="0" y1="256" x2="512" y2="256" />
            <line x1="0" y1="320" x2="512" y2="320" />
            <line x1="0" y1="384" x2="512" y2="384" />
            <line x1="0" y1="448" x2="512" y2="448" />
          </g>
        </>
      )}

      {/* Glowing Pipeline Aura */}
      <g opacity="0.35" filter={`url(#${glowId})`}>
        <path
          d="M166 380 V176 L206 136 H350"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="44"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M166 260 L196 230 H290"
          fill="none"
          stroke="#d946ef"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Main Conduit Trunk */}
      <path
        d="M166 380 V176 L206 136 H350"
        fill="none"
        stroke={`url(#${trunkGradId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Mid Route Branch */}
      <path
        d="M166 260 L196 230 H290"
        fill="none"
        stroke={`url(#${midGradId})`}
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Core Data Light Beam (Inner Fiber) */}
      <path
        d="M166 380 V176 L206 136 H350"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M166 260 L196 230 H290"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 1. Root Gateway Node (Bottom) */}
      <circle
        cx="166"
        cy="380"
        r="30"
        fill="#0b0f19"
        stroke="#8b5cf6"
        strokeWidth="8"
      />
      <circle cx="166" cy="380" r="14" fill="#c4b5fd" />

      {/* 2. Top Route Endpoint Node (Cyan [GET]) */}
      <circle
        cx="350"
        cy="136"
        r="30"
        fill="#0b0f19"
        stroke="#06b6d4"
        strokeWidth="8"
      />
      <circle cx="350" cy="136" r="14" fill="#38bdf8" />

      {/* 3. Middle Route Endpoint Node (Fuchsia [POST/SCHEMA]) */}
      <circle
        cx="290"
        cy="230"
        r="28"
        fill="#0b0f19"
        stroke="#d946ef"
        strokeWidth="8"
      />
      <circle cx="290" cy="230" r="13" fill="#f472b6" />
    </svg>
  );
}
