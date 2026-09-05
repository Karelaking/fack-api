"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

/**
 * Landing page Footer matching the reference design layout:
 * - Top newsletter input ("Unlock what's hidden ✨") + 2 navigation link columns
 * - Middle copyright bar & legal links
 */
export const Footer = (): React.JSX.Element => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent): void => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout((): void => setSubscribed(false), 4000);
    }
  };

  return (
    <footer
      id="site-footer"
      className="border-border/40 bg-background text-foreground relative z-20 block w-full overflow-hidden border-t"
      aria-label="Site Footer"
    >
      <div className="border-border/40 relative z-10 mx-auto max-w-7xl border-x">
        {/* Top Half: Newsletter & Link Columns Partition */}
        <div className="grid grid-cols-1 items-start gap-16 px-8 py-20 sm:px-14 sm:py-28 lg:grid-cols-12 lg:gap-12 lg:px-20 lg:py-36">
          {/* Left Side: Newsletter Form & Headline (lg:col-span-7) */}
          <div className="max-w-xl space-y-6 lg:col-span-7">
            <h2 className="text-foreground flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              <span>Unlock what&apos;s hidden</span>
              <Sparkles className="inline size-7 shrink-0 text-amber-400" />
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Get updates on mock schema templates, Faker.js generators, and new
              releases. Stay updated with modern API design patterns and
              developer tooling.
            </p>

            {/* Newsletter Subscription Form */}
            <form
              onSubmit={handleSubscribe}
              className="flex max-w-lg flex-col items-stretch gap-3 pt-4 sm:flex-row sm:items-center"
            >
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  aria-label="Email address for newsletter"
                  autoComplete="email"
                  className="border-border/80 bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring/40 h-12 w-full rounded-full border px-5 text-sm shadow-xs transition-all focus:ring-2 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="bg-foreground text-background inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-8 text-sm font-bold shadow-md transition-all hover:opacity-90"
              >
                {subscribed ? (
                  <>
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Subscribed!</span>
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Side: 2 Navigation Columns (lg:col-span-5) */}
          <div className="grid grid-cols-2 gap-10 text-sm font-medium lg:col-span-5">
            <div className="space-y-4">
              <h3 className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
                Platform
              </h3>
              <ul className="text-muted-foreground space-y-3">
                <li>
                  <a
                    href="#showcase"
                    className="hover:text-foreground transition-colors"
                  >
                    Visual Flow Canvas
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Faker.js Engine
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    DTO &amp; Schema Export
                  </a>
                </li>
                <li>
                  <a
                    href="#features"
                    className="hover:text-foreground transition-colors"
                  >
                    Chaos Injector
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Storage &amp; Privacy
                  </a>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="hover:text-foreground transition-colors"
                  >
                    Workspace
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-muted-foreground font-mono text-xs font-bold tracking-widest uppercase">
                Ecosystem
              </h3>
              <ul className="text-muted-foreground space-y-3">
                <li>
                  <a
                    href="https://github.com/Karelaking/fack-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Karelaking/fack-api/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Release Notes
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Karelaking"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    Author GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Karelaking/fack-api/blob/main/LICENSE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    MIT License
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Middle Divider */}
        <div className="border-border/40 border-t" />

        {/* Bottom Bar: Copyright & Legal Nav */}
        <div className="text-muted-foreground flex flex-col items-center justify-between gap-6 px-4 py-10 text-xs font-medium sm:flex-row sm:text-sm">
          <p>
            ©{new Date().getFullYear()} Fack API Studio. All Rights Reserved.
            Crafted by{" "}
            <a
              href="https://github.com/Karelaking"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-bold uppercase hover:underline"
            >
              Karelaking
            </a>
            .
          </p>

          <nav
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
            aria-label="Footer Legal Links"
          >
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <span>•</span>
            <a
              href="https://github.com/Karelaking/fack-api"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <span>•</span>
            <a
              href="https://github.com/Karelaking/fack-api/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              License
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
