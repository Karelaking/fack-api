# Dashboard UI/UX Improvement Plan

## Executive Summary

The Fack API dashboard has a solid functional foundation with modern styling using Tailwind CSS v4 and OKLCH color space. However, there are several opportunities to elevate the UI/UX to meet modern dashboard standards: improving visual hierarchy, enhancing accessibility, refining typography, and ensuring a cohesive, minimalist design that feels premium and intuitive.

This plan addresses issues across typography, spacing, visual polish, accessibility, responsiveness, and SEO to create a world-class dashboard experience.

---

## 1. Typography & Visual Hierarchy

### Current Issues
- Inconsistent use of custom type scale (micro, mini, caption, xs, sm)
- Some text elements lack proper line-height and letter-spacing
- Heading hierarchy could be clearer in the dashboard
- Some UI elements use very small font sizes that may be hard to read

### Improvements

#### 1.1 Standardize Type Scale Usage
**File:** `app/globals.css`

Ensure consistent application of the custom type scale:
- Use `text-micro` (0.5625rem) only for decorative labels or badges
- Use `text-mini` (0.625rem) for timestamps, metadata, or very small labels
- Use `text-caption` (0.6875rem) for secondary information
- Use `text-xs` (0.75rem) for body text in dense interfaces
- Use `text-sm` (0.8125rem) for standard body text
- Use `text-base` (0.875rem) for primary content
- Use `text-md` (1rem) for emphasis

#### 1.2 Improve Heading Hierarchy
**File:** `components/dashboard/ProjectGrid.tsx`

- Change section headers from `text-sm` to `text-base` for better prominence
- Add `tracking-tight` to headings for better readability
- Ensure consistent font-weight hierarchy across sections

**Proposed Changes:**
```tsx
// Line 245, 297, 319, 354
- <h3 className="text-foreground text-sm font-semibold tracking-tight">
+ <h3 className="text-foreground text-base font-semibold tracking-tight">
```

#### 1.3 Enhance Readability with Proper Line Heights
**File:** `components/dashboard/ProjectGrid.tsx`

Add proper line-height to description text:
```tsx
// Line 365
- <p className="text-muted-foreground mt-2 max-w-sm text-sm">
+ <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
```

#### 1.4 Font Weight Consistency
Ensure all UI text uses appropriate font weights:
- Labels: `font-medium` or `font-semibold`
- Body text: `font-normal` or `font-medium`
- Headings: `font-semibold` or `font-bold`

---

## 2. Spacing & Layout

### Current Issues
- Inconsistent spacing patterns across components
- Some areas use ad-hoc spacing values
- Card internal spacing could be more consistent
- Grid gaps could be optimized for better visual rhythm

### Improvements

#### 2.1 Standardize Card Spacing
**File:** `components/dashboard/ProjectGrid.tsx`

- Ensure all cards use consistent padding (p-6 or p-5)
- Standardize gap between card elements
- Use the documented spacing conventions from globals.css

**Proposed Changes:**
```tsx
// Line 387 - Project cards
- className="bg-card/30 border-border/40 hover:border-border group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-colors"
+ className="bg-card/30 border-border/40 hover:border-border group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 gap-4 transition-colors"

// Line 326 - Recent preview cards
- className="bg-card/30 border-border/40 flex flex-col gap-2 rounded-xl border p-4"
+ className="bg-card/30 border-border/40 flex flex-col gap-3 rounded-xl border p-5"
```

#### 2.2 Improve Widget Spacing
**File:** `components/dashboard/ProjectGrid.tsx`

Standardize spacing in the left sidebar widgets:
```tsx
// Line 248 - Usage widget
- <div className="bg-card/30 border-border/40 rounded-xl border p-0">
+ <div className="bg-card/30 border-border/40 rounded-xl border overflow-hidden">

// Line 260 - Content inside usage widget
- <div className="flex flex-col space-y-3 px-4 py-4 text-xs">
+ <div className="flex flex-col gap-3 px-5 py-4 text-xs">
```

#### 2.3 Optimize Grid Layout
**File:** `components/dashboard/ProjectGrid.tsx`

- Improve responsive grid breakpoints
- Add proper gap that scales with screen size

**Proposed Changes:**
```tsx
// Line 380
- className="grid grid-cols-1 gap-4 xl:grid-cols-2"
+ className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
```

#### 2.4 Header Alignment
**File:** `components/dashboard/ProjectGrid.tsx`

Ensure proper alignment in the search/filter row:
```tsx
// Line 186
- <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
+ <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
```

---

## 3. Visual Polish & Elevation

### Current Issues
- Some components lack hover states and transitions
- Shadows could be more subtle and modern
- Border colors could be more consistent
- Some interactive elements lack focus states

### Improvements

#### 3.1 Add Hover Transitions to Cards
**File:** `components/dashboard/ProjectGrid.tsx`

Enhance card hover effects:
```tsx
// Line 387
- className="bg-card/30 border-border/40 hover:border-border group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 transition-colors"
+ className="bg-card/30 border-border/40 hover:border-border/60 hover:shadow-md group relative flex flex-col justify-between overflow-hidden rounded-xl border p-6 gap-4 transition-all duration-200 ease-out"
```

#### 3.2 Improve Button Hover States
**File:** `components/dashboard/ProjectGrid.tsx`

Add smooth transitions to all buttons:
```tsx
// Line 206 - Filter button
- className="border-border/40 bg-card/30 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-md border transition-colors"
+ className="border-border/40 bg-card/30 hover:bg-muted hover:border-border/60 flex h-10 w-10 items-center justify-center rounded-md border transition-all duration-200 ease-out"

// Line 255, 310 - Upgrade buttons
- className="border-border text-foreground hover:bg-muted rounded-md border px-3 py-1 text-xs font-medium shadow-sm transition-colors"
+ className="border-border text-foreground hover:bg-muted hover:border-border/60 active:scale-95 rounded-md border px-3 py-1 text-xs font-medium shadow-sm transition-all duration-200 ease-out"
```

#### 3.3 Add Focus States to Interactive Elements
**File:** `components/dashboard/ProjectGrid.tsx`

Ensure all buttons and inputs have proper focus states:
```tsx
// Line 194 - Search input
- className="border-border/40 bg-card/30 focus-visible:ring-primary/20 h-10 w-full rounded-md border pr-12 pl-9 transition-colors outline-none"
+ className="border-border/40 bg-card/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background h-10 w-full rounded-md border pr-12 pl-9 transition-all duration-200 outline-none"

// Line 415, 427 - Action buttons
- className="border-border text-muted-foreground hover:text-foreground hover:bg-muted bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
+ className="border-border text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-all duration-200 ease-out"
```

#### 3.4 Subtle Shadows for Depth
**File:** `components/dashboard/ProjectGrid.tsx`

Use consistent shadow scale:
```tsx
// Line 248 - Usage widget card
- <div className="bg-card/30 border-border/40 rounded-xl border p-0">
+ <div className="bg-card/30 border-border/40 shadow-sm rounded-xl border overflow-hidden">

// Line 300 - Alerts widget
- <div className="bg-card/30 border-border/40 flex flex-col items-center justify-center space-y-3 rounded-xl border px-4 py-8 text-center">
+ <div className="bg-card/30 border-border/40 shadow-sm flex flex-col items-center justify-center space-y-3 rounded-xl border px-4 py-8 text-center"
```

#### 3.5 Improve Empty State Visuals
**File:** `components/dashboard/ProjectGrid.tsx`

Make the empty state more visually appealing:
```tsx
// Line 359
- <div className="bg-card/30 border-border/40 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
+ <div className="bg-card/30 border-border/40 shadow-sm flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
```

---

## 4. Accessibility (a11y)

### Current Issues
- Need to verify contrast ratios for all text
- Some interactive elements may lack proper ARIA labels
- Focus indicators could be more visible
- Color-only indicators need text alternatives

### Improvements

#### 4.1 Verify and Improve Contrast Ratios
**File:** `app/globals.css`

The current OKLCH colors need verification against WCAG AA standards (4.5:1 for normal text, 3:1 for large text).

**Action:** Run contrast verification script mentioned in globals.css line 184:
```bash
node scripts/contrast.mjs
```

If any colors fail, adjust them to meet AA standards:
```css
/* Example adjustment if needed */
--muted-foreground: oklch(0.45 0 0); /* Ensure minimum contrast */
```

#### 4.2 Improve Focus Visibility
**File:** `app/globals.css`

Ensure focus rings are visible in both light and dark modes:
```css
@layer base {
  *:focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
}
```

#### 4.3 Add ARIA Labels to Icon-Only Buttons
**File:** `components/dashboard/ProjectGrid.tsx`

Ensure all icon-only buttons have descriptive labels:
```tsx
// Line 203 - Filter button
<button
  type="button"
  aria-label="Filter projects by status or type"
  className="..."
>
```

#### 4.4 Keyboard Navigation Improvements
**File:** `components/dashboard/ProjectGrid.tsx`

Ensure the search input has proper keyboard shortcuts documented:
```tsx
// Line 189
<input
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  placeholder="Search Projects..."
  aria-label="Search workspaces"
  className="..."
/>
<!-- Add keyboard shortcut hint -->
<div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center">
  <kbd className="bg-muted text-muted-foreground hidden h-5 items-center justify-center rounded-lg border px-1.5 font-mono text-[10px] font-medium sm:flex">
    ⌘K
  </kbd>
</div>
```

#### 4.5 Screen Reader Improvements
**File:** `components/dashboard/ProjectGrid.tsx`

Add proper heading hierarchy and landmarks:
```tsx
// Add proper landmark roles
<main className="min-w-0 flex-1 space-y-4" role="main">
  <h2 className="sr-only">Projects</h2>
  <h3 className="text-foreground text-base font-semibold tracking-tight">
    Projects
  </h3>
  {/* ... */}
</main>
```

---

## 5. Color & Contrast

### Current Issues
- Some color combinations may have low contrast
- Status colors need verification for accessibility
- Dark mode contrast should be validated

### Improvements

#### 5.1 Verify Semantic Color Contrast
**File:** `app/globals.css`

Ensure all semantic colors (success, warning, info, danger) have sufficient contrast:

```css
/* Light mode - verify these meet AA standards */
--success: oklch(0.448 0.17 152);
--warning: oklch(0.482 0.18 85);
--info: oklch(0.47 0.15 245);
--danger: oklch(0.442 0.245 27.325);

/* Dark mode - verify these meet AA standards */
--success: oklch(0.676 0.17 152);
--warning: oklch(0.752 0.15 85);
--info: oklch(0.694 0.15 245);
--danger: oklch(0.732 0.191 22.216);
```

#### 5.2 Improve Muted Text Contrast
**File:** `app/globals.css`

Ensure muted-foreground has adequate contrast:
```css
/* Light mode */
--muted-foreground: oklch(0.45 0 0); /* Increase from 0.45 if needed */

/* Dark mode */
--muted-foreground: oklch(0.708 0 0); /* Increase from 0.708 if needed */
```

#### 5.3 Consistent Border Opacity
**File:** `components/dashboard/ProjectGrid.tsx`

Standardize border opacity values:
```tsx
// Replace inconsistent values with consistent ones
- border-border/40
+ border-border/50  /* Standardize on 50% opacity */

- border-border/60
+ border-border/50
```

---

## 6. Responsive Design

### Current Issues
- Mobile navigation could be optimized
- Some layouts may not scale well on tablets
- Touch targets need verification
- No optimization for ultra-wide screens
- Limited tablet breakpoint coverage
- Content may not utilize wide screen space efficiently

### Breakpoint Strategy

Use the following Tailwind CSS breakpoints for comprehensive responsive coverage:

| Breakpoint | Screen Width | Target Device | Use Case |
|------------|---------------|---------------|----------|
| `sm` | 640px+ | Small tablets landscape | Side-by-side layouts |
| `md` | 768px+ | Tablets | Multi-column grids |
| `lg` | 1024px+ | Small laptops | 3-column layouts |
| `xl` | 1280px+ | Laptops/desktops | 4-column layouts |
| `2xl` | 1536px+ | Large desktops | Wide layouts |
| Custom | 1920px+ | Ultra-wide monitors | Maximized content |

### Improvements

#### 6.1 Mobile Optimization (320px - 640px)

**File:** `components/dashboard/MobileBottomNav.tsx`

Enhance touch targets and visual feedback for mobile:
```tsx
// Line 71 - Increase height for better touch targets
- className="bg-card/85 border-border fixed right-0 bottom-0 left-0 z-40 flex min-h-14 items-center justify-around border-t pt-0 pr-[max(1rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md select-none md:hidden"
+ className="bg-card/85 border-border fixed right-0 bottom-0 left-0 z-40 flex h-16 items-center justify-around border-t pt-0 pr-[max(1rem,env(safe-area-inset-right))] pb-[env(safe-area-inset-bottom)] pl-[max(1rem,env(safe-area-inset-left))] backdrop-blur-md select-none md:hidden"

// Line 82 - Add active feedback
- className="flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-mini font-bold transition-colors"
+ className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-mini font-bold transition-colors active:scale-95"

// Line 89 - Larger icons for touch
- <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
+ <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
```

**File:** `components/dashboard/ProjectGrid.tsx`

Optimize mobile layout:
```tsx
// Line 184 - Container max-width for mobile
- <div className="mx-auto max-w-350 space-y-8 p-8">
+ <div className="mx-auto max-w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8"

// Line 186 - Stack search row on mobile
- <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
+ <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"

// Line 240 - Stack sidebar and content on mobile
- <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
+ <div className="flex flex-col gap-6 md:flex-row md:gap-6 lg:gap-8"
```

#### 6.2 Tablet Optimization (640px - 1024px)

**File:** `components/dashboard/ProjectGrid.tsx`

Add proper tablet breakpoints:
```tsx
// Line 242 - Responsive sidebar width
- <div className="flex w-full shrink-0 flex-col gap-8 lg:w-[320px]">
+ <div className="flex w-full shrink-0 flex-col gap-6 md:w-[280px] lg:w-[320px] xl:w-[340px]"

// Line 380 - Responsive grid columns
- className="grid grid-cols-1 gap-4 xl:grid-cols-2"
+ className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"

// Line 354 - Optimize content area
- <div className="min-w-0 flex-1 space-y-4">
+ <div className="min-w-0 flex-1 space-y-4 md:space-y-6"
```

**File:** `components/dashboard/RootSidebar.tsx`

Improve sidebar behavior on tablets:
```tsx
// Line 79 - Add icon-only mode for smaller screens
- <Sidebar variant="sidebar" collapsible="icon">
+ <Sidebar variant="sidebar" collapsible="icon" className="hidden md:flex"
```

#### 6.3 Laptop/Desktop Optimization (1024px - 1536px)

**File:** `components/dashboard/ProjectGrid.tsx`

Optimize for standard laptop/desktop screens:
```tsx
// Line 184 - Max-width constraint for readability
- <div className="mx-auto max-w-350 space-y-8 p-8">
+ <div className="mx-auto max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8"

// Line 318 - Recent previews responsive columns
- <div className="flex flex-col gap-3">
+ <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1"

// Line 248 - Usage widget responsive layout
- <div className="bg-card/30 border-border/40 rounded-xl border p-0">
+ <div className="bg-card/30 border-border/40 rounded-xl border overflow-hidden"
```

#### 6.4 Ultra-Wide Screen Optimization (1920px+)

**File:** `components/dashboard/ProjectGrid.tsx`

Maximize content utilization on ultra-wide screens:
```tsx
// Line 184 - Remove max-width constraint on ultra-wide
- <div className="mx-auto max-w-350 space-y-8 p-8">
+ <div className="mx-auto max-w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8 xl:px-12 xl:py-8 2xl:px-16 2xl:py-10"

// Line 380 - Add 4-column grid for ultra-wide
- className="grid grid-cols-1 gap-4 xl:grid-cols-2"
+ className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"

// Line 242 - Wider sidebar on ultra-wide
- <div className="flex w-full shrink-0 flex-col gap-8 lg:w-[320px]">
+ <div className="flex w-full shrink-0 flex-col gap-6 md:w-[280px] lg:w-[320px] xl:w-[360px] 2xl:w-[400px]"
```

**File:** `app/(dashboard)/layout.tsx`

Optimize header for ultra-wide screens:
```tsx
// Line 36 - Responsive header padding
- <header className="border-border/10 bg-background/60 absolute inset-x-0 top-0 z-10 flex h-14 items-center border-b px-6 backdrop-blur-md">
+ <header className="border-border/10 bg-background/60 absolute inset-x-0 top-0 z-10 flex h-14 items-center border-b px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 backdrop-blur-md"
```

#### 6.5 Ensure Minimum Touch Targets

All interactive elements should have minimum 44x44px touch targets on mobile:

**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
// Line 415, 427 - Action buttons
- className="border-border text-muted-foreground hover:text-foreground hover:bg-muted bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
+ className="border-border text-muted-foreground hover:text-foreground hover:bg-muted bg-card flex h-9 w-9 sm:h-7 sm:w-7 items-center justify-center rounded-md border shadow-sm transition-colors"

// Line 203 - Filter button
- className="border-border/40 bg-card/30 hover:bg-muted flex h-10 w-10 items-center justify-center rounded-md border transition-colors"
+ className="border-border/40 bg-card/30 hover:bg-muted flex h-12 w-12 sm:h-10 sm:w-10 items-center justify-center rounded-md border transition-colors"
```

**File:** `components/dashboard/DashboardSidebar.tsx`

```tsx
// Line 276, 332 - Copy buttons
- className="shrink-0"
+ className="h-8 w-8 sm:h-7 sm:w-7 shrink-0"
```

#### 6.6 Responsive Typography

Ensure typography scales appropriately across devices:

**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
// Line 245, 297, 319, 354 - Section headers
- <h3 className="text-foreground text-sm font-semibold tracking-tight">
+ <h3 className="text-foreground text-sm sm:text-base font-semibold tracking-tight">

// Line 365 - Empty state description
- <p className="text-muted-foreground mt-2 max-w-sm text-sm">
+ <p className="text-muted-foreground mt-2 max-w-sm text-sm sm:text-sm">
```

**File:** `components/dashboard/RootSidebar.tsx`

```tsx
// Line 89 - Workspace name
- <span className="truncate font-semibold">
+ <span className="truncate text-sm sm:text-base font-semibold">

// Line 92 - Plan name
- <span className="text-muted-foreground truncate text-xs">
+ <span className="text-muted-foreground truncate text-xs sm:text-xs"
```

#### 6.7 Responsive Spacing

Scale spacing based on screen size:

**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
// Line 240 - Responsive gap
- <div className="flex flex-col gap-8 lg:flex-row lg:gap-6">
+ <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:gap-6 lg:gap-8"

// Line 324 - Card gap
- <div className="bg-card/30 border-border/40 flex flex-col gap-2 rounded-xl border p-4">
+ <div className="bg-card/30 border-border/40 flex flex-col gap-2 sm:gap-3 rounded-xl border p-4 sm:p-5"

// Line 248 - Usage widget padding
- <div className="flex flex-col space-y-3 px-4 py-4 text-xs">
+ <div className="flex flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5 text-xs"
```

#### 6.8 Horizontal Scroll Prevention

Ensure content doesn't overflow horizontally on mobile:

**File:** `app/globals.css`

Add to ensure proper text wrapping:
```css
/* Prevent horizontal scroll on mobile */
* {
  max-width: 100%;
  overflow-x: hidden;
}

/* Ensure long text wraps */
.break-words {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
}
```

**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
// Line 397 - Project name
- <span className="text-foreground group-hover:text-primary truncate font-bold transition-colors">
+ <span className="text-foreground group-hover:text-primary truncate font-bold transition-colors break-words">

// Line 405 - Slug
- <span className="text-muted-foreground truncate text-xs">
+ <span className="text-muted-foreground truncate text-xs break-all"
```

#### 6.9 Responsive Sidebar Behavior

**File:** `components/dashboard/RootSidebar.tsx`

Improve sidebar collapsibility:
```tsx
// Line 79 - Add responsive collapsible behavior
- <Sidebar variant="sidebar" collapsible="icon">
+ <Sidebar variant="sidebar" collapsible="icon" className="hidden md:flex"

// Add mobile drawer trigger
<div className="md:hidden fixed top-4 left-4 z-50">
  <button
    onClick={() => /* toggle mobile drawer */}
    className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-md"
  >
    <RiMenuLine className="h-5 w-5" />
  </button>
</div>
```

#### 6.10 Custom Tailwind Config for Ultra-Wide

**File:** `app/globals.css`

Add custom breakpoint for ultra-wide screens in the theme:
```css
@theme inline {
  /* ... existing theme ... */

  /* Custom breakpoint for ultra-wide screens */
  --breakpoint-ultra-wide: 1920px;
}
```

Or use inline styles in components:
```tsx
<div className="max-w-[1920px] mx-auto">
  {/* Content */}
</div>
```

#### 6.11 Responsive Images

**File:** `components/dashboard/RootSidebar.tsx`

```tsx
// Line 192 - Responsive avatar
- <Image
  src={user.imageUrl}
  alt="Profile"
  width={28}
  height={28}
  className="h-7 w-7 shrink-0 rounded-full object-cover"
/>
+ <Image
  src={user.imageUrl}
  alt="Profile"
  width={32}
  height={32}
  className="h-8 w-8 sm:h-7 sm:w-7 shrink-0 rounded-full object-cover"
/>
```

#### 6.12 Responsive Dialogs

**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
// Line 374 - Dialog max-width
- <DialogContent className="sm:max-w-106.25">
+ <DialogContent className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]"

// Line 472 - Edit dialog
- <DialogContent className="sm:max-w-106.25">
+ <DialogContent className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[600px]"
```

---

## 7. SEO & Meta Tags

### Current Issues
- Dashboard pages lack specific metadata
- No structured data for rich snippets
- Missing canonical URLs
- No robots meta tags

### Improvements

#### 7.1 Add Dashboard-Specific Metadata
**File:** `app/(dashboard)/dashboard/page.tsx`

Add metadata export:
```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Fack API's",
  description: "Manage your mock API projects, view usage analytics, and configure endpoints.",
  robots: {
    index: false, // Dashboard pages should not be indexed
    follow: false,
  },
};
```

#### 7.2 Add Metadata to Other Dashboard Pages
Apply similar metadata to:
- `app/(dashboard)/activity/page.tsx`
- `app/(dashboard)/analytics/page.tsx`
- `app/(dashboard)/domains/page.tsx`
- `app/(dashboard)/keys/page.tsx`
- `app/(dashboard)/settings/page.tsx`

#### 7.3 Add Canonical URLs
**File:** `app/layout.tsx`

Update the metadata to include canonical URLs:
```tsx
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  alternates: {
    canonical: '/',
  },
  // ... existing metadata
};
```

#### 7.4 Add Open Graph Images
Ensure Open Graph images exist and are properly sized (1200x630px recommended):
```tsx
openGraph: {
  title: "Fack API's — Mock API Platform",
  description: "High-performance, open-source mock API platform with visual React Flow editor and dynamic payload synthesis.",
  images: [
    {
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "Fack API's Mock API Platform",
    },
  ],
},
```

---

## 8. Performance & Loading States

### Current Issues
- No skeleton loading states for data fetching
- No loading indicators for async operations
- Potential Cumulative Layout Shift (CLS) issues

### Improvements

#### 8.1 Add Skeleton Loading States
**File:** `components/dashboard/ProjectGrid.tsx`

Create a skeleton loader component:
```tsx
function ProjectCardSkeleton() {
  return (
    <div className="bg-card/30 border-border/40 rounded-xl border p-6 gap-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted rounded" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}

// Use while loading
{isPending && (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
    {[1, 2, 3, 4].map((i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
)}
```

#### 8.2 Add Loading Indicators
**File:** `components/dashboard/ProjectGrid.tsx`

Add loading state to delete/edit operations:
```tsx
const [isDeleting, setIsDeleting] = React.useState(false);

// Show loading spinner on button
<Button
  disabled={isDeleting}
  className="relative"
>
  {isDeleting && (
    <RiLoader2Line className="h-4 w-4 animate-spin absolute left-2" />
  )}
  <span className={isDeleting ? "pl-6" : ""}>Delete</span>
</Button>
```

---

## 9. Micro-Interactions & Animations

### Current Issues
- Limited hover feedback
- No transition animations
- Could use more delightful micro-interactions

### Improvements

#### 9.1 Add Subtle Scale on Click
**File:** `components/dashboard/ProjectGrid.tsx`

Add active scale to buttons:
```tsx
// Line 415, 427
- className="border-border text-muted-foreground hover:text-foreground hover:bg-muted bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-colors"
+ className="border-border text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 bg-card flex h-7 w-7 items-center justify-center rounded-md border shadow-sm transition-all duration-200 ease-out"
```

#### 9.2 Add Fade-in Animation for Cards
**File:** `components/dashboard/ProjectGrid.tsx`

Add staggered fade-in animation:
```tsx
{filteredProjects.map((proj, index) => (
  <div
    key={proj.id}
    className="..."
    style={{
      animation: `fadeIn 0.3s ease-out ${index * 50}ms backwards`,
    }}
  >
    {/* ... */}
  </div>
))}

// Add to globals.css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 9.3 Add Smooth Icon Transitions
**File:** `components/dashboard/ProjectGrid.tsx`

Add transitions to icons:
```tsx
<Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
```

---

## 10. Design System Consistency

### Current Issues
- Some components use custom spacing not following the documented scale
- Border radius usage could be more consistent
- Shadow usage could follow the documented scale

### Improvements

#### 10.1 Follow Documented Spacing Scale
**File:** `app/globals.css` (lines 124-135)

Ensure all spacing follows the documented conventions:
- Page padding: `p-6` (24px) desktop, `p-4` (16px) mobile
- Section gap: `space-y-6` (24px) or `gap-6`
- Card internal: `p-5` or `p-6`
- Form field gap: `gap-4` (16px)
- Input-to-label gap: `gap-2` (8px)
- Inline element gap: `gap-1.5` (6px) or `gap-2` (8px)
- Grid gap: `gap-5` (20px) for cards, `gap-4` (16px) for dense

#### 10.2 Follow Border Radius Scale
**File:** `app/globals.css` (lines 138-147)

Ensure border radii follow the documented scale:
- `--radius-sm: 0.3rem` — small inputs, badges, micro tags
- `--radius-md: 0.4rem` — standard inputs, buttons
- `--radius-lg: 0.5rem` — cards, dialogs, dropdowns
- `--radius-xl: 0.7rem` — feature cards, hero elements
- `--radius-2xl: 0.9rem` — large containers

**Apply to components:**
```tsx
// Project cards should use radius-xl
className="rounded-xl"

// Small buttons should use radius-md
className="rounded-md"

// Badges should use radius-sm
className="rounded-sm"
```

#### 10.3 Follow Shadow Scale
**File:** `app/globals.css` (lines 60-68)

Use the documented shadow scale:
- `--shadow-xs` — very subtle elevation
- `--shadow-sm` — standard elevation for cards
- `--shadow-md` — higher elevation for dropdowns
- `--shadow-lg` — prominent elevation for modals
- `--shadow-xl` — maximum elevation for toasts

---

## 11. Sidebar Navigation Improvements

### Current Issues
- Sidebar could have better visual hierarchy
- Active state could be more prominent
- Search input in sidebar could be improved

### Improvements

#### 11.1 Improve Active State
**File:** `components/dashboard/RootSidebar.tsx`

Make active navigation items more prominent:
```tsx
// Line 141
<SidebarMenuButton
  isActive={isActive}
  render={<Link href={item.href} aria-label={item.title} />}
  className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
>
  <item.icon className="h-4 w-4" />
  <span>{item.title}</span>
</SidebarMenuButton>
```

#### 11.2 Add Subtle Hover to Nav Items
**File:** `components/dashboard/RootSidebar.tsx`

```tsx
<SidebarMenuButton
  isActive={isActive}
  render={<Link href={item.href} aria-label={item.title} />}
  className="hover:bg-muted/50 transition-colors duration-200"
>
```

#### 11.3 Improve Search Input Styling
**File:** `components/dashboard/RootSidebar.tsx`

```tsx
// Line 116
- className="border-border/40 bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary pointer-events-none h-9 w-full cursor-pointer rounded-md border py-1 pr-8 pl-9 text-sm focus:ring-1 focus:outline-none"
+ className="border-border/40 bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background pointer-events-none h-9 w-full cursor-pointer rounded-md border py-1 pr-8 pl-9 text-sm focus:ring-1 focus:outline-none transition-all duration-200"
```

---

## 12. Empty States & Onboarding

### Current Issues
- Empty state could be more engaging
- Could add guidance for new users
- No progressive disclosure of features

### Improvements

#### 12.1 Enhance Empty State
**File:** `components/dashboard/ProjectGrid.tsx`

```tsx
{filteredProjects.length === 0 ? (
  <div className="bg-card/30 border-border/40 shadow-sm flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
    <div className="bg-primary/10 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full">
      <RiTerminalBoxLine className="h-8 w-8" />
    </div>
    <h4 className="text-foreground text-lg font-semibold">
      No workspaces found
    </h4>
    <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
      {search
        ? "No workspaces match your search keyword. Try adjusting your query."
        : "Get started by creating your first workspace to mock API endpoints."}
    </p>
    {!search && (
      <div className="mt-6 flex flex-col gap-2">
        <Button onClick={triggerCreateProject} className="gap-2">
          <RiAddLine className="h-4 w-4" />
          Create Workspace
        </Button>
        <p className="text-muted-foreground text-xs">
          Or import an existing OpenAPI specification
        </p>
      </div>
    )}
  </div>
) : (
  // ...
)}
```

---

## Implementation Priority

### Phase 1: Critical (Week 1)
1. **Typography & Visual Hierarchy** - Standardize type scale usage
2. **Spacing & Layout** - Fix spacing inconsistencies
3. **Accessibility (a11y)** - Verify contrast ratios and add focus states
4. **Focus States** - Add proper focus indicators to all interactive elements

### Phase 2: High Impact (Week 2)
1. **Visual Polish** - Add hover states, transitions, and subtle shadows
2. **Responsive Design** - Comprehensive responsive optimization (mobile, tablet, laptop, desktop, ultra-wide)
3. **Color & Contrast** - Verify and improve color contrast ratios
4. **Micro-interactions** - Add scale on click and fade-in animations

### Phase 3: Polish (Week 3)
1. **SEO & Meta Tags** - Add metadata to dashboard pages
2. **Performance** - Add skeleton loading states
3. **Design System Consistency** - Ensure all components follow documented scales
4. **Sidebar Improvements** - Enhance navigation hierarchy

### Phase 4: Enhancement (Week 4)
1. **Empty States** - Improve empty state design
2. **Loading States** - Add loading indicators
3. **Additional Animations** - Add delightful micro-interactions
4. **Final Polish** - Review and refine all changes

---

## Testing Checklist

After implementing each phase, verify:

- [ ] All text meets WCAG AA contrast standards (4.5:1 for normal text)
- [ ] All interactive elements have visible focus states
- [ ] All buttons have hover and active states
- [ ] **Mobile (320px - 640px)**: Layout works correctly, no horizontal scroll, touch targets are 44x44px minimum
- [ ] **Tablet (640px - 1024px)**: Side-by-side layouts work, grid columns adjust properly
- [ ] **Laptop (1024px - 1536px)**: 3-4 column layouts work, content area is optimized
- [ ] **Desktop (1280px - 1920px)**: Wide layouts work, content utilizes screen space efficiently
- [ ] **Ultra-Wide (1920px+)**: Maximum content width is utilized, 4-column grids work, no excessive whitespace
- [ ] Touch targets are at least 44x44px on mobile
- [ ] No console errors or warnings
- [ ] Keyboard navigation works properly
- [ ] Screen reader announces all important information
- [ ] No Cumulative Layout Shift (CLS) issues
- [ ] Loading states prevent layout shifts
- [ ] Dark mode works correctly with proper contrast
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Responsive typography scales appropriately across all breakpoints
- [ ] Responsive spacing scales appropriately across all breakpoints
- [ ] No horizontal scroll on any device size
- [ ] Long text wraps properly (using break-words/break-all)
- [ ] Dialogs/Modals are responsive and accessible on all screen sizes

---

## Success Metrics

After implementation, the dashboard should:

1. **Visual Quality**
   - Consistent spacing and typography throughout
   - Smooth, professional animations and transitions
   - Clear visual hierarchy and information architecture
   - Modern, premium aesthetic

2. **Accessibility**
   - WCAG AA compliant contrast ratios
   - Full keyboard navigation support
   - Screen reader friendly
   - Focus indicators visible on all interactive elements

3. **Performance**
   - Lighthouse score > 90 for accessibility
   - Lighthouse score > 90 for performance
   - No layout shift issues (CLS < 0.1)
   - Fast initial page load

4. **User Experience**
   - Intuitive navigation and information architecture
   - Clear feedback for all user actions
   - **Comprehensive responsive design** across mobile (320px+), tablet (640px+), laptop (1024px+), desktop (1280px+), and ultra-wide screens (1920px+)
   - Loading states prevent confusion
   - Touch-optimized interface on mobile devices
   - Content efficiently utilizes screen space on all devices

---

## Notes for Implementation

- Use the existing Tailwind CSS v4 custom theme and OKLCH color space
- Follow the documented spacing, radius, and shadow scales in globals.css
- Maintain consistency with the existing shadcn/ui components
- Test changes in both light and dark modes
- **Test responsive design across all breakpoints** using browser DevTools device emulation and real devices when possible
- **Test on actual devices**: Mobile phones (iPhone SE, iPhone 14 Pro, Android), Tablets (iPad, Android tablets), Laptops (13", 15"), Desktop monitors (24", 27"), Ultra-wide monitors (34", 49")
- Run `vp check` and `vp test` after each phase
- Commit changes following the Conventional Commits specification documented in AGENTS.md
- Use the impeccable skill for design guidance when needed
- Use the ui-auditing skill to verify changes

---

## Additional Resources

- **Design Guidelines:** Refer to existing comments in `app/globals.css` for spacing, radius, and shadow conventions
- **Accessibility:** Use the ui-auditing skill checklist for comprehensive a11y verification
- **SEO:** Use the seo-audit skill for comprehensive SEO analysis
- **Design Patterns:** Use the impeccable skill for design guidance and best practices
- **Components:** Follow shadcn/ui component patterns for consistency
