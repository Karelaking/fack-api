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
      <div style={{ fontSize: 64, color: "#3b82f6", marginBottom: 16 }}>
        Fack API&apos;s
      </div>
      <div style={{ fontSize: 24, color: "#a1a1aa" }}>
        High-performance, open-source mock API platform
      </div>
    </div>,
    {
      ...size,
    },
  );
}
