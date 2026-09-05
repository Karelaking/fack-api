import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/skeleton";

const LogoCloudSection = dynamic(() =>
  import("@/components/landing/LogoCloudSection").then(
    (mod) => mod.LogoCloudSection,
  ),
);

const FeaturesSection = dynamic(() =>
  import("@/components/landing/FeaturesSection").then(
    (mod) => mod.FeaturesSection,
  ),
);

const InteractiveCanvasDemo = dynamic(
  () =>
    import("@/components/landing/InteractiveCanvasDemo").then(
      (mod) => mod.InteractiveCanvasDemo,
    ),
  {
    loading: (): React.JSX.Element => (
      <div className="bg-background border-border/40 w-full border-b py-16 md:py-24">
        <div className="border-border/40 mx-auto max-w-7xl border-x px-4 sm:px-6 lg:px-8">
          <Skeleton className="border-border/40 h-112.5 w-full rounded-xl border" />
        </div>
      </div>
    ),
  },
);

export const metadata: Metadata = {
  title: "Fack API Studio - Visual Mock API Platform & Schema Builder",
  description:
    "Visually design mock backend architectures, auto-generate type-safe Faker.js models & OpenAPI routes, simulate network chaos, and export instant TypeScript DTOs.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Fack API Studio - Visual Mock API Platform & Schema Builder",
    description:
      "Visually design mock backend architectures, auto-generate type-safe Faker.js models & OpenAPI routes, simulate network chaos, and export instant TypeScript DTOs.",
    url: "https://fackapi.studio",
    siteName: "Fack API Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fack API Studio - Visual Mock API Platform & Schema Builder",
    description:
      "Visually design mock backend architectures, auto-generate type-safe Faker.js models, and export instant TypeScript DTOs.",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Fack API Studio",
    operatingSystem: "Web",
    applicationCategory: "DeveloperApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "Visually design mock backend architectures, auto-generate type-safe Faker.js models, and export instant TypeScript DTOs.",
    url: "https://fackapi.studio",
    featureList: [
      "Visual Flow Mock API Canvas",
      "Faker.js Payload Synthesis Engine",
      "Chaos & Latency Injector",
      "Client-Side SQLite Engine",
      "1-Click DTO & OpenAPI Export",
      "Real-Time AST Schema Validator",
      "Instant In-Memory Route Handlers",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Fack API Studio",
    url: "https://fackapi.studio",
    description: "Visual Mock API Platform & Schema Builder",
  },
];

/**
 * Root Landing Page for Fack API's.
 * Styled after schemaflow.studio with multi-component architecture.
 */
export default function HomePage(): React.JSX.Element {
  return (
    <div className="bg-background text-foreground selection:bg-primary/20 selection:text-primary flex min-h-screen flex-col font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingHeader />
      <main className="w-full flex-1" id="main-content">
        <HeroSection />
        <LogoCloudSection />
        <InteractiveCanvasDemo />
        <FeaturesSection />
        <PricingSection />
        <Footer />
      </main>
    </div>
  );
}
