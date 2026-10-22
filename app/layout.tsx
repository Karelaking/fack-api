import { Bricolage_Grotesque, Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

/**
 * `viewportFit: "cover"` is what makes `env(safe-area-inset-*)` report real
 * values on notched devices. Without it the insets are always 0, so the mobile
 * bottom nav sits under the home indicator. Next emits `width=device-width` and
 * `initial-scale=1` alongside this automatically.
 */
export const viewport: Viewport = {
  viewportFit: "cover",
};

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

/**
 * The landing hero's display voice. Bricolage Grotesque carries a soft,
 * slightly irregular grotesque skeleton with ink traps that stay visible at
 * poster sizes — a specimen-sheet character the interface otherwise never
 * uses, kept to the hero so the working dashboard keeps its neutral sans.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

/**
 * Runs before first paint to apply the persisted theme class, preventing a
 * flash of the wrong theme (FOUC). Kept in sync with ThemeProvider: same
 * storage key ("theme") and supported values (light | dark | system).
 */
const themeInitScript = `(function(){try{var stored=localStorage.getItem("theme");var prefersDark=window.matchMedia("(prefers-color-scheme: dark)").matches;var isDark=stored==="dark"||((stored===null||stored==="system")&&prefersDark);var root=document.documentElement;root.classList.toggle("dark",isDark);root.style.colorScheme=isDark?"dark":"light";}catch(e){}})();`;

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "Fack API's — Mock API Platform",
  description:
    "High-performance, open-source mock API platform with visual React Flow editor and dynamic payload synthesis.",
  openGraph: {
    title: "Fack API's — Mock API Platform",
    description:
      "High-performance, open-source mock API platform with visual React Flow editor and dynamic payload synthesis.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fack API's — Mock API Platform",
    description:
      "High-performance, open-source mock API platform with visual React Flow editor and dynamic payload synthesis.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Blocking inline script: sets the theme class before the browser
          paints, avoiding a flash of the default (light) theme.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              {/* Only Vercel serves the analytics script; rendering it
                  elsewhere makes the client request /_vercel/insights/script.js
                  and log a 404 in the console. */}
              {process.env.VERCEL ? <Analytics /> : null}
              {children}
              <Toaster position="top-right" richColors />
            </TooltipProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
