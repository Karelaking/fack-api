"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

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

export type CollaborateButtonProps = {
  className?: string;
};

/**
 * Interactive call-to-action button for collaboration and workspace navigation.
 */
const CollaborateButton = ({
  className = "",
}: CollaborateButtonProps): React.JSX.Element => (
  <a
    href="https://github.com/Karelaking/fack-api"
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      "group bg-foreground text-background hover:bg-foreground/90 relative inline-flex h-10 w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full border border-transparent p-1 ps-4 pe-12 text-xs font-semibold shadow-xs transition-all duration-500 select-none hover:ps-12 hover:pe-4",
      className,
    )}
  >
    <span className="relative z-10 whitespace-nowrap transition-all duration-500">
      Let&apos;s Contribute
    </span>
    <div className="bg-background text-foreground absolute right-1 flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
      <ArrowUpRight size={16} />
    </div>
  </a>
);

/**
 * Main Navbar component adhering to the block-based grid theme and border container structure.
 */
export const LandingHeader = (): React.JSX.Element => {
  const [sticky, setSticky] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect((): (() => void) => {
    let ticking = false;

    const onScroll = (): void => {
      if (!ticking) {
        requestAnimationFrame((): void => {
          setSticky(window.scrollY >= 20);
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
        sticky
          ? "bg-background/95 shadow-xs backdrop-blur-md"
          : "bg-background/60 backdrop-blur-xs",
      )}
    >
      <div className="border-border/40 mx-auto flex h-20 max-w-7xl items-center justify-between border-x px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
        >
          <div className="bg-foreground text-background flex size-8 items-center justify-center rounded-full font-bold shadow-xs transition-transform group-hover:scale-105">
            <span className="font-mono text-xs font-black tracking-tighter">
              f.
            </span>
          </div>
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
          <CollaborateButton />
        </div>

        {/* Mobile Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              aria-label="Toggle Navigation Menu"
              className="bg-background border-border focus-visible:ring-ring hover:bg-muted flex cursor-pointer items-center justify-center rounded-full border p-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <AlignJustify size={18} />
              <span className="sr-only">Toggle Navigation Menu</span>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="bg-card border-border w-80 border-l p-6 shadow-xl"
            >
              <SheetHeader className="border-border/40 mb-4 border-b pb-4 text-left">
                <SheetTitle className="text-base font-bold">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav
                aria-label="Mobile Navigation Menu"
                className="flex flex-col gap-2"
              >
                {navigationData.map((item: NavigationSection) => (
                  <a
                    key={item.title}
                    href={item.href}
                    onClick={(): void => setIsOpen(false)}
                    className="hover:bg-muted text-foreground block w-full cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {item.title}
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
                <CollaborateButton className="h-11 w-full" />
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
