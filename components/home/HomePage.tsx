import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  CloudCog,
  Code2,
  Database,
  Gauge,
  GitBranch,
  Network,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const featureCards = [
  {
    icon: Network,
    title: "Visual Node Canvas",
    description:
      "Model endpoint groups, methods, statuses, and flows with a drag-and-drop graph editor.",
  },
  {
    icon: Boxes,
    title: "Deep Schema Builder",
    description:
      "Generate nested JSON payloads with visual schema design and type-aware controls.",
  },
  {
    icon: Sparkles,
    title: "Synthetic Data Engine",
    description:
      "Create realistic payloads with json-schema-faker and Faker.js for robust frontend testing.",
  },
  {
    icon: Gauge,
    title: "Chaos Simulation",
    description:
      "Stress test clients with configurable latency and probabilistic HTTP failures.",
  },
  {
    icon: Code2,
    title: "TypeScript Output",
    description: "Compile runtime schemas into downloadable .d.ts contracts for client consumers.",
  },
  {
    icon: Database,
    title: "Portable SQLite Core",
    description: "Run locally or self-host with a lightweight single-file storage model.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(0.96_0_0),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.26_0_0),transparent_60%)]" />

      <header className="border-b border-border/70 bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Fack API's Logo" width={34} height={34} className="rounded-lg" />
            <div>
              <p className="text-base font-semibold leading-tight">Fack API&apos;s</p>
              <p className="text-xs text-muted-foreground">Open-source mock API platform</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button className="gap-1.5">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-12">
        <section className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-5">
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary">
              <CloudCog className="h-3.5 w-3.5" />
              Next.js 16 + App Router + SQLite
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Design, mock, and ship APIs faster without waiting on backend readiness.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Fack API&apos;s helps product teams build realistic mock APIs using a visual canvas, schema-driven payloads,
              and chaos controls so frontend and backend can move independently.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Start Building
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://github.com/Karelaking/fack-api" target="_blank" rel="noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  <GitBranch className="h-4 w-4" />
                  View Source
                </Button>
              </a>
            </div>
          </div>
          <Card className="overflow-hidden border-primary/20 shadow-lg shadow-primary/10">
            <Image
              src="/screenshots/dashboard.png"
              alt="Dashboard screenshot"
              width={1200}
              height={800}
              className="h-auto w-full"
              priority
            />
          </Card>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Platform capabilities</h2>
            <p className="text-muted-foreground">Everything needed to model, test, and iterate on API behavior quickly.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="h-full border-border/60 transition-colors hover:border-primary/40">
                <CardHeader>
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>How to use Fack API&apos;s</CardTitle>
              <CardDescription>Follow this workflow from setup to live mock requests.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">1. Create workspace</p>
                <p className="mt-2 text-sm">Create a project namespace and define your base mock URL scope.</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">2. Design endpoints</p>
                <p className="mt-2 text-sm">Use the canvas to wire methods, statuses, and response schema behaviors.</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3. Consume instantly</p>
                <p className="mt-2 text-sm">Call /mock/{`{slug}`}/... routes from apps, tests, SDKs, or Postman.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Core stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Framework:</span> Next.js 16
              </p>
              <p>
                <span className="font-semibold text-foreground">Editor:</span> React Flow
              </p>
              <p>
                <span className="font-semibold text-foreground">State:</span> Zustand + Immer
              </p>
              <p>
                <span className="font-semibold text-foreground">Database:</span> SQLite + Drizzle
              </p>
              <p>
                <span className="font-semibold text-foreground">Data:</span> json-schema-faker + Faker.js
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Quick start</h2>
            <p className="text-muted-foreground">Switch between local setup, Docker deployment, and API usage examples.</p>
          </div>
          <Tabs defaultValue="local" className="w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="local">Local</TabsTrigger>
              <TabsTrigger value="docker">Docker</TabsTrigger>
              <TabsTrigger value="usage">Mock API Call</TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="mt-3">
              <Card>
                <CardContent className="space-y-2 p-5 font-mono text-xs sm:text-sm">
                  <p className="rounded-md bg-muted px-3 py-2">pnpm install</p>
                  <p className="rounded-md bg-muted px-3 py-2">mkdir data</p>
                  <p className="rounded-md bg-muted px-3 py-2">pnpm drizzle-kit push</p>
                  <p className="rounded-md bg-muted px-3 py-2">pnpm dev</p>
                  <p className="text-muted-foreground">Then open http://localhost:3000 and launch the dashboard.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="docker" className="mt-3">
              <Card>
                <CardContent className="space-y-2 p-5 font-mono text-xs sm:text-sm">
                  <p className="rounded-md bg-muted px-3 py-2">docker compose up -d</p>
                  <p className="text-muted-foreground">
                    Dashboard runs on http://localhost:3000 with persistent SQLite data in Docker volume.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="usage" className="mt-3">
              <Card>
                <CardContent className="space-y-2 p-5 font-mono text-xs sm:text-sm">
                  <p className="rounded-md bg-muted px-3 py-2">
                    curl -X GET http://localhost:3000/mock/my-project/api/v1/users/42
                  </p>
                  <p className="text-muted-foreground">
                    Replace namespace and route with your workspace slug and endpoint path.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <section className="space-y-4 pb-4">
          <h2 className="text-2xl font-semibold tracking-tight">Preview</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { src: "/screenshots/dashboard.png", title: "Workspace Dashboard" },
              { src: "/screenshots/canvas.png", title: "Node Canvas Designer" },
              { src: "/screenshots/settings.png", title: "Workspace Settings" },
            ].map((shot) => (
              <Card key={shot.title} className="overflow-hidden">
                <Image src={shot.src} alt={shot.title} width={1200} height={800} className="h-auto w-full" />
                <CardContent className="p-3">
                  <p className="text-sm font-medium">{shot.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <p>Fack API&apos;s · Mock APIs for fast product iteration</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-foreground hover:text-primary">
            <Terminal className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
