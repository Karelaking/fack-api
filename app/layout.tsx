import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { CommandMenu } from "@/components/command-menu";

const inter = Inter({
  variable: "--font-sans",
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
    <ClerkProvider
      appearance={{ theme: shadcn }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html
        lang="en"
        className={`${inter.variable} ${GeistMono.variable} h-full antialiased`}
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
                <Analytics />
                {children}
                <CommandMenu />
                <Toaster position="top-right" richColors />
              </TooltipProvider>
            </ThemeProvider>
          </NuqsAdapter>
        </body>
      </html>
    </ClerkProvider>
  );
}
