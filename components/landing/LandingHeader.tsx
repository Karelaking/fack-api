"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollaborateButton } from "@/components/landing/CollaborateButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandLogo } from "@/components/ui/brand-logo";

export type NavigationSection = {
  title: string;
  href: string;
};

const navigationData: NavigationSection[] = [
  {
    title: "Features",
    href: "#features",
  },
  {
    title: "Interactive Flow",
    href: "#showcase",
  },
  {
    title: "Faker Engine",
    href: "#features",
  },
  {
    title: "Storage & Pricing",
    href: "#pricing",
  },
];

/**
 * Main Navbar component adhering to the block-based grid theme and border container structure.
 */
export const LandingHeader = (): React.JSX.Element => {
  const [isSticky, setIsSticky] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect((): (() => void) => {
    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame((): void => {
          setIsSticky(window.scrollY >= 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    const onResize = (): void => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return (): void => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <header
      className={cn(
        "border-border/40 sticky top-0 z-50 w-full border-b transition-all duration-300",
        isSticky
          ? "bg-background/95 shadow-xs backdrop-blur-md"
          : "bg-background/60 backdrop-blur-xs",
      )}
    >
      <div className="border-border/40 mx-auto flex h-20 max-w-7xl items-center justify-between border-x px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <span className="flex size-8 shrink-0 items-center justify-center transition-transform group-hover:scale-105">
            <BrandLogo size={32} />
          </span>
          <span className="text-foreground text-lg font-extrabold tracking-tight">
            fackapi<span className="text-primary font-black">.</span>studio
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden items-center md:flex"
          aria-label="Main Navigation"
        >
          <div className="bg-muted/50 border-border/40 flex gap-1 rounded-full border p-1 shadow-2xs">
            {navigationData.map((navItem: NavigationSection) => (
              <a
                key={navItem.title}
                href={navItem.href}
                className="text-muted-foreground hover:text-foreground hover:bg-background rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all"
              >
                {navItem.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Right Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/dashboard"
            className="border-border/40 text-foreground hover:bg-muted inline-flex h-10 cursor-pointer items-center justify-center rounded-full border bg-transparent px-4 text-xs font-semibold transition-all"
          >
            Workspace
          </Link>
          <CollaborateButton
            href="https://github.com/Karelaking/fack-api"
            label="Let's Contribute"
            external
          />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Toggle Navigation Menu"
                />
              }
            >
              <AlignJustify size={18} />
              <span className="sr-only">Toggle Navigation Menu</span>
            </SheetTrigger>

            <SheetContent side="right" className="w-80">
              <SheetHeader variant="bordered" className="mb-4 text-left">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile Navigation Menu"
                className="flex flex-col gap-2"
              >
                {navigationData.map((navItem: NavigationSection) => (
                  <a
                    key={navItem.title}
                    href={navItem.href}
                    onClick={(): void => setIsOpen(false)}
                    className="hover:bg-muted text-foreground block w-full cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {navItem.title}
                  </a>
                ))}
              </nav>
              <div className="border-border/50 mt-6 flex flex-col gap-2 border-t pt-6">
                <Link
                  href="/dashboard"
                  onClick={(): void => setIsOpen(false)}
                  className="border-border/40 text-foreground hover:bg-muted inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-full border bg-transparent px-4 text-sm font-semibold transition-all"
                >
                  Workspace
                </Link>
                <CollaborateButton
                  href="https://github.com/Karelaking/fack-api"
                  label="Let's Contribute"
                  external
                  className="h-11 w-full"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export { LandingHeader as Navbar };
export default LandingHeader;
