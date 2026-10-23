---
version: 1
slug: "components-landing-howtostartsection-tsx"
primary_target: "components/landing/HowToStartSection.tsx"
related_targets: ["components/landing/HeroSection.tsx","components/landing/LandingHeader.tsx"]
---

# How to start — components/landing/HowToStartSection.tsx

Scope: the landing section that sits directly under the hero. Mode: Persuade.
Related targets: `components/landing/HeroSection.tsx` (the anchor that points
here), `components/landing/LandingHeader.tsx` (the nav entry that points here).

## Audience and job

Primary: developers who have decided to try Fack API's and need the shortest
honest path from nothing to a live mock route. Secondary: people who self-host
and need to know what the setup requires and where the data stays.

The section's job: make the first action unambiguous. It states the run
command (Docker or from source), then walks the four actions that produce a
live endpoint — run it, name a project, attach a schema, call the route.
Every artifact is real: the commands come from the repository's README and
Docker sections, the URL composition from the documented `/:projectSlug/...`
routing, the schema and the response envelope from the docs walkthrough. No
invented terminal output, no benchmark, no metric matrix.

Constraints (pinned by the user): this section replaces the former "how it
works" block, which is removed from the page. Craft floor: no eyebrow above
the heading, no gradient text, no emoji as icons, functional text no smaller
than 11px, no nested cards, and no claim the shipped architecture does not
support.

## Direction contract

THESIS: A manual page, not a pitch. The section refuses the abstract
mechanism diagram and the metric tiles; it answers "what do I run, and what
happens next" in four numbered steps, each paired with the real artifact that
step produces.

OWN-WORLD: The incumbent dark developer-tool world, held quietly: near-black
ground, hairline `border-border/40` rails around a `max-w-7xl` frame, mono
only for code, URLs, and measurement, `info` for the `x-faker` keyword and
`success` for the provider it names. No new color and no new face: the
section is set in the product's own sans, with the display face reserved for
the hero.

STORY: The visitor scrolls one section and leaves with a command they can
paste, a URL they can open, a schema they can read, and a response they can
believe.

FIRST VIEWPORT: A two-column header on the same rail as the steps — the
`22ch` heading in the left column, the lead paragraph in the artifact column.
Then step 01, "Run it locally", with the run console on the right: a mode
switcher (Docker / From source), that mode's requirement, the command with a
copy affordance, and the dashboard URL it ends on. Steps 02 to 04 continue
the same rhythm — instruction left, artifact right — each behind a hairline.

FORM: Code-led; a local replacement inside an established surface. Position on
the ordered list: not applicable (no direction roll). SEED REFERENCE: seed:
none (unavailable).

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.

## Signals and interaction

- Switcher: choosing Docker or From source swaps the command lines and the
  requirement text in place, with no reflow of the panel.
- Copy: the button reports the real clipboard outcome ("Copied" / "Copy
  manually") and a live region announces it. Nothing is shown on a write that
  did not happen.
- No entrance animation and no looping motion. The section is still; the
  copy state is its only motion, so it does not repeat the hero's authored
  entrance or the features grid's scroll reveal.
- Hover: the copy button and the walkthrough link carry the section's only
  hover states.

## Verification

- Rendered and inspected in a headless session at 1440x900 and 390x844. No
  horizontal overflow at 390 (`scrollWidth === innerWidth`). The schema block
  scrolls inside its own `overflow-x-auto` frame on a phone, with the
  `scrollbar-subtle` affordance; the page itself never scrolls sideways.
- The mode switcher swaps both the requirement line and the command lines
  (exercised by clicking "From source" in the headless session).
- `tsc --noEmit` exits 0. `vp lint` and `vp fmt --write` are clean on the
  changed files. `impeccable detect --json` returns `[]` for the changed
  targets.
- Disclosed: the clipboard write could not be completed in the headless
  session (the permission prompt stalls), so the success state was not
  exercised here; the failure state and the live region carry over unchanged
  from the previous implementation.
- Disclosed: `text-caption` is inert in this project — `app/globals.css`
  declares the custom type scale under `--font-size-*`, which Tailwind v4
  does not read as a size namespace, so every `text-caption` class renders at
  the inherited 16px. This section therefore uses `text-xs` (12px) for its
  micro-labels instead of the intended 11px caption. The micro-labels
  elsewhere on the page still render at 16px; that drift is pre-existing and
  was left alone.

## Unresolved decisions

- Whether the walkthrough link should point at a deployed docs route once one
  exists under this domain; it points at the docs source on GitHub for now.
- Whether the run console should also appear near pricing for visitors who
  arrive deep in the page.
