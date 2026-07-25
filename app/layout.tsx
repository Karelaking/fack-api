import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

import { getProjects } from "@/lib/actions/projects";
import { Separator } from "@/components/ui/separator";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { HeaderNewProjectButton } from "@/components/dashboard/HeaderNewProjectButton";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fack API's — Mock API Platform",
  description:
    "High-performance, open-source mock API platform with visual React Flow editor and dynamic payload synthesis.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = await getProjects();

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <Analytics />
            <SidebarProvider>
              <div className="bg-background flex h-screen w-screen overflow-hidden">
                {/* Sidebar component */}
                <DashboardSidebar initialProjects={projects} />

                {/* Main Content Area */}
                <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                  <header className="border-border bg-card flex h-14 shrink-0 items-center justify-between border-b px-4">
                    <div className="flex items-center gap-2">
                      <SidebarTrigger className="h-9 w-9" />
                      <Separator orientation="vertical" className="h-4" />
                      <DashboardBreadcrumbs projects={projects} />
                    </div>
                    <HeaderNewProjectButton />
                  </header>
                  <div className="bg-background flex-1 overflow-auto pb-14 md:pb-0">
                    {children}
                  </div>
                  <MobileBottomNav />
                </main>
              </div>
            </SidebarProvider>
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
