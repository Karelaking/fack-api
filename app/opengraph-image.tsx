import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Fack API's — Mock API Platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 48,
        background: "#09090b",
        color: "#ffffff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        fontWeight: 700,
      }}
    >
      {/* Route Nexus Brand Logo Emblem */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 512 512"
        style={{ marginBottom: 28 }}
      >
        <rect
          width="512"
          height="512"
          fill="#0b0f19"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="4"
        />
        <path
          d="M166 380 V176 L206 136 H350"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="32"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M166 260 L196 230 H290"
          fill="none"
          stroke="#d946ef"
          strokeWidth="32"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="166"
          cy="380"
          r="30"
          fill="#0b0f19"
          stroke="#8b5cf6"
          strokeWidth="8"
        />
        <circle cx="166" cy="380" r="14" fill="#c4b5fd" />
        <circle
          cx="350"
          cy="136"
          r="30"
          fill="#0b0f19"
          stroke="#06b6d4"
          strokeWidth="8"
        />
        <circle cx="350" cy="136" r="14" fill="#38bdf8" />
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
      <div
        style={{
          fontSize: 60,
          color: "#ffffff",
          marginBottom: 12,
          letterSpacing: "-0.03em",
        }}
      >
        fackapi<span style={{ color: "#06b6d4" }}>.</span>studio
      </div>
      <div style={{ fontSize: 24, color: "#94a3b8", fontWeight: 500 }}>
        Visual Node-Based Mock API &amp; Schema Synthesis Platform
      </div>
    </div>,
    {
      ...size,
    },
  );
}
