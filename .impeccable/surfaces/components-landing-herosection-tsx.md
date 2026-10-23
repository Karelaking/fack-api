---
version: 1
slug: "components-landing-herosection-tsx"
primary_target: "components/landing/HeroSection.tsx"
related_targets: ["components/landing/HowToStartSection.tsx","components/landing/HeroMotion.tsx","components/landing/CollaborateButton.tsx","components/landing/LandingHeader.tsx"]
---

# Hero — components/landing/HeroSection.tsx

Scope: the landing hero of Fack API's (`app/page.tsx`) and the how-to-start
section that now follows it. Mode: Persuade. Related targets:
`components/landing/HowToStartSection.tsx` (the four-step procedure directly
below), `components/landing/HeroMotion.tsx` (pointer layer),
`components/landing/CollaborateButton.tsx`, `components/landing/LandingHeader.tsx`
(the nav entry that points at the section below).

## Audience and job

Primary: frontend and full-stack developers whose real backend is missing,
unstable, or rate-limited. Secondary: QA engineers, and people who self-host.

The hero must make two things clear in one viewport: what Fack API's is (a node
canvas synthesized into standard JSON Schema and served as a live mock backend
by a deterministic runtime), and that it runs on the visitor's own machine. The
exact start command is no longer part of the first screen; it opens the section
directly below. Action: open the dashboard canvas, or scroll one section to the
command. Proof: the section below shows the real run command, the real
`/:projectSlug/...` URL composition, the synthesized schema with `x-faker`, and
a real response envelope. No testimonials, customer logos, or benchmarks exist;
none are shown.

Constraints (pinned by the user): the hero is at least one device viewport tall;
it is minimal, with generous whitespace and strong tonal contrast; the headline
uses a display face with character; micro-interactions and motion graphics are
wanted. `Hero3DModel.tsx` stays in the repo, unmounted. Craft floor: no eyebrow
above the heading, no gradient text, no infinite motion, no emoji as icons,
functional text no smaller than 11px.

## Direction contract

THESIS: The first viewport is a specimen sheet — two sentences at poster scale on
a nearly empty field. It refuses the full-briefing hero that stacked headline,
subhead, three paragraphs, a command, a diagram, and four metrics above the fold.

OWN-WORLD: The incumbent dark developer-tool world, held quietly: near-black
ground, hairline `border-border/40` rails around a `max-w-7xl` frame, mono only
for code and measurement, `primary`/`info`/`chart-5` reserved for the section
below. The one new voice is Bricolage Grotesque, used only for the hero headline.

STORY: The visitor reads what the product is, sees that it runs locally, and
opens the canvas — or scrolls one section to copy the command. The four steps
that used to be scattered across the hero and the mechanism block now read as
one procedure directly below.

FIRST VIEWPORT: A four-line headline on the left at `clamp(2.25rem, 6.6vw, 5.75rem)`;
the first sentence in full foreground, the second muted and brightening on hover.
One 38ch subhead, one primary pill and one quiet source pill. A hairline footer
strip carries self-hosted facts and a "How to start" anchor. Behind the type, at
desktop width only: a faint blueprint grid revealed through a cursor-tracked
mask, a three-node graph that drifts a few pixels against the pointer, and a soft
primary spotlight. The graph strokes draw in once on load.

FORM: Code-led; a local replacement inside an established surface. Position on
the ordered list: not applicable (no direction roll). SEED REFERENCE: seed: none
(unavailable).

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Signals and interaction

- Entrance: each headline line rises out of its line box in a staggered
  waterfall; the subhead, actions, and footer strip follow. Runs once.
- Pointer: `HeroMotion` writes `--hero-mx/my` and `--hero-x/y` on `#hero`; the
  grid mask and spotlight follow, the graph drifts 12–16px against them. No
  loops, so nothing burns frames when the pointer is still or the hero is off
  screen. Reduced motion gets the static composition.
- Hover: the muted second sentence returns to full foreground; the footer facts
  brighten; the arrow badge slides and rotates; the GitHub glyph tilts; the
  "How to start" arrow drops 2px.
- Focus: the existing focus rings and link/button semantics are unchanged.

## Verification

- Hero meets or exceeds the first screen: it pulls under the 81px sticky header
  (`-mt-20 pt-20`) and the inner frame carries `min-h-[calc(100svh-5rem)]`.
  Measured: 1440x900 → section 1–902 (901px); 1280x800 → 1–817 (816px);
  390x844 → 1–846 (845px); 320x568 → 761px, where content exceeds the viewport
  and scrolls, as allowed by the "at least" constraint.
- No horizontal overflow at 1440, 1280, 390, or 320
  (`scrollWidth === innerWidth` in each case).
- Display face resolves as `Bricolage Grotesque` at 92px on desktop, 36px on
  mobile; the headline renders as four lines at every width tested.
- Pointer layer verified: `pointermove` writes `--hero-mx/my` and `--hero-x/y`,
  the grid mask/spotlight reposition, and the graph drifts (identity at rest →
  ~10.7px / -8.8px when moved). The atmosphere defaults are unitless
  (`--hero-x: 0`) so `calc(var(--hero-x) * 16px)` stays valid; the graph's
  vertical centering uses Tailwind's separate `translate` property.
- Entrance settles to opacity 1 / transform none, and both entrance and pointer
  effects honour `prefers-reduced-motion`.
- `vp lint` on the changed TSX files passes. `vp fmt --write` is clean.
  `tsc --noEmit` exits 0 (the previous `lib/storage/backup.ts` error is no
  longer present in this tree).
- The mechanical detector reports two advisories: the pre-existing
  `--ease-bounce` token, and the blueprint grid. The grid is kept deliberately:
  the product's primary artifact is a node canvas, and the hero draws that
  canvas's own measurement field, so the overlay is a demonstration surface
  rather than generic decoration.
- Disclosed: `text-caption` is inert in this project (the theme declares
  `--font-size-*`, which Tailwind v4 does not read as a size namespace), so the
  hero's footer facts and its "How to start" anchor render at the inherited
  16px rather than the intended 11px caption. This drift is pre-existing and
  was left alone; the section below uses `text-xs` for its own micro-labels.

## Unresolved decisions

- Whether the micro-label scale should be repaired globally by moving the
  theme's `--font-size-*` keys to the `--text-*` namespace; that would change
  the type scale of every surface at once and is its own piece of work.
- Whether the quick-start should also appear near pricing for visitors who
  arrive deep in the page.
- Whether a docs app will be deployed under this domain (the hero links GitHub
  instead of a docs route).
