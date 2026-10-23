/**
 * Verifies the semantic + HTTP-method colour tokens clear WCAG AA in the ways
 * they are actually used on the landing page:
 *
 *   1. as body text on the page background,
 *   2. as chip text on a 10% / 15% / 20% tint of itself over a card,
 *   3. as a chip background carrying its matching `-foreground`.
 *
 * Both themes are checked: `:root` (light) and `.dark`.
 *
 * Usage:
 *   node scripts/contrast.mjs            # report
 *   node scripts/contrast.mjs --suggest  # also print lightness to use
 *
 * Exits non-zero when a token misses its target ratio.
 */

import { readFileSync } from "node:fs";

const CSS_PATH = "app/globals.css";
/** Target with headroom: axe measures the real composited background, which
 *  is a hair different from the mix computed here. */
const TEXT_RATIO = 4.8;
const TINT_WEIGHTS = [0.1, 0.15, 0.2];
const SUGGEST = process.argv.includes("--suggest");

const source = readFileSync(CSS_PATH, "utf8");

/** Extracts the custom properties declared inside a top-level block. */
function readBlock(selector) {
  const header = source.indexOf(`${selector} {`);
  if (header === -1) {
    throw new Error(`${selector} not found in ${CSS_PATH}`);
  }
  const start = source.indexOf("{", header);
  let depth = 0;
  let end = start;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const tokens = new Map();
  for (const match of source
    .slice(start + 1, end)
    .matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const gamma = (value) =>
  value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

/** Converts an `oklch(L C H)` declaration to 0-255 sRGB. */
function oklchToRgb(declaration) {
  const match = declaration.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/,
  );
  if (!match) {
    return null;
  }
  const lightness = match[1].endsWith("%")
    ? Number.parseFloat(match[1]) / 100
    : Number.parseFloat(match[1]);
  const chroma = Number.parseFloat(match[2]);
  const hue = (Number.parseFloat(match[3]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    clamp(gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)) * 255,
    clamp(gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)) * 255,
    clamp(gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)) * 255,
  ];
}

const relativeLuminance = ([r, g, b]) => {
  const channel = (value) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = (foreground, background) => {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

/** Mixes `tint` into `base` at `weight` (0-1) — how Tailwind's `/10` works. */
const mix = (tint, base, weight) =>
  tint.map((channel, index) => channel * weight + base[index] * (1 - weight));

const THEME_TOKENS = [
  "success",
  "warning",
  "info",
  "danger",
  "method-get",
  "method-post",
  "method-put",
  "method-patch",
  "method-delete",
];

/**
 * Finds the lightness that clears every target, moving away from the current
 * value: darker in the light theme, brighter in the dark one.
 */
function suggestLightness({
  current,
  chroma,
  hue,
  page,
  card,
  foreground,
  direction,
}) {
  for (let step = 0.002; step <= 0.12; step += 0.002) {
    const lightness = Number((current + direction * step).toFixed(3));
    if (lightness <= 0.05 || lightness >= 1) continue;
    const color = oklchToRgb(`oklch(${lightness} ${chroma} ${hue})`);
    if (!color) continue;
    const onPage = contrastRatio(color, page) >= TEXT_RATIO;
    const onTints = TINT_WEIGHTS.every(
      (weight) => contrastRatio(color, mix(color, card, weight)) >= TEXT_RATIO,
    );
    const onChip =
      !foreground || contrastRatio(foreground, color) >= TEXT_RATIO;
    if (onPage && onTints && onChip) {
      return lightness;
    }
  }
  return null;
}

let failures = 0;

for (const [theme, selector, direction] of [
  ["light", ":root", -1],
  ["dark", ".dark", 1],
]) {
  const tokens = readBlock(selector);
  const page = oklchToRgb(tokens.get("background"));
  const card = oklchToRgb(tokens.get("card")) ?? page;
  if (!page) {
    throw new Error(`--background in ${selector} is not an oklch() value`);
  }

  console.log(`\n${theme} theme`);
  for (const name of THEME_TOKENS) {
    const declaration = tokens.get(name);
    if (!declaration) {
      console.log(`  ${name.padEnd(13)} — not defined`);
      failures += 1;
      continue;
    }
    const color = oklchToRgb(declaration);
    if (!color) {
      console.log(`  ${name.padEnd(13)} — unsupported value ${declaration}`);
      failures += 1;
      continue;
    }

    const checks = [
      ["on page", contrastRatio(color, page)],
      ...TINT_WEIGHTS.map((weight) => [
        `on ${weight * 100}% tint`,
        contrastRatio(color, mix(color, card, weight)),
      ]),
    ];

    const foregroundDeclaration = tokens.get(`${name}-foreground`);
    const foreground = foregroundDeclaration
      ? oklchToRgb(foregroundDeclaration)
      : null;
    if (foreground) {
      checks.push(["chip", contrastRatio(foreground, color)]);
    }

    const line = checks
      .map(([label, ratio]) => {
        const ok = ratio >= TEXT_RATIO;
        if (!ok) failures += 1;
        return `${label} ${ratio.toFixed(2)}${ok ? "" : " ✗"}`;
      })
      .join("  ");

    console.log(`  ${name.padEnd(13)} ${line}`);

    if (SUGGEST) {
      const [, lightness, chroma, hue] =
        declaration.match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/) ??
        [];
      const suggestion = suggestLightness({
        current: Number.parseFloat(lightness ?? "0.5"),
        chroma: Number.parseFloat(chroma ?? "0"),
        hue: Number.parseFloat(hue ?? "0"),
        page,
        card,
        foreground,
        direction,
      });
      if (suggestion !== null && suggestion !== Number.parseFloat(lightness)) {
        console.log(
          `  ${" ".repeat(13)} → use oklch(${suggestion} ${chroma} ${hue})`,
        );
      }
    }
  }
}

console.log(
  failures === 0
    ? "\nAll tokens clear WCAG AA (4.5:1) with headroom."
    : `\n${failures} check(s) below the target ratio.`,
);
process.exit(failures === 0 ? 0 : 1);
