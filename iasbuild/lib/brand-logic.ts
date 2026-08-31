// lib/brand-logic.ts
// Deterministic brand rule engine. NO LLM calls. Every rule here is encoded logic,
// so the teaching the form promises ("you don't need to understand this") is correct,
// not improvised. Where a rule cannot be satisfied honestly, we emit a visible TODO chip.

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type Hex = string; // "#RRGGBB"

export interface ExtractedColor {
  hex: Hex;
  coverage: number; // 0..1, share of logo pixels
}

export interface PaletteRole {
  role: "primary" | "secondary" | "accent" | "dark" | "light";
  hex: Hex;
  usage: string; // plain-English usage the guide will print
}

export interface BrandChip {
  id: string;
  title: string;
  detail: string;
}

export type ShapeCategory =
  | "circle"
  | "landscape"
  | "vertical"
  | "square"
  | "pill"
  | "irregular";

// Encodes the Enterprise Brand Shape Taxonomy (aspect ratio + clearspace per shape).
// Drives how the company-logo, clearspace, and on-color tiles render in the guide.
export interface ShapeSpec {
  category: ShapeCategory;
  label: string;
  exampleAssets: string;
  aspectRatios: string; // human-readable, e.g. "1:1 · 4:3 (Oval)"
  previewRatio: number; // width / height, used to render the logo frame
  clearspaceLabel: string; // e.g. "0.5H", "2X Radius"
  clearspaceRule: string; // plain-English rule
  notes: string;
}

export interface BrandModel {
  brandName: string;
  shape: ShapeSpec;
  palette: PaletteRole[];
  clearspace: { rule: string; multiplier: number; explainer: string };
  typography: TypePairing;
  iconStyle: IconStyle;
  buttonStyle: ButtonStyle;
  chips: BrandChip[]; // honest gaps surfaced to the user
}

// ─────────────────────────────────────────────────────────────
// Color math (WCAG relative luminance + contrast ratio)
// ─────────────────────────────────────────────────────────────
function hexToRgb(hex: Hex): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance(hex: Hex): number {
  const srgb = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

export function contrastRatio(a: Hex, b: Hex): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Perceived lightness, used to sort extracted colors into roles.
function lightness(hex: Hex): number {
  return relLuminance(hex);
}

// ─────────────────────────────────────────────────────────────
// RULE 1 — Palette roles from extracted logo colors
// The user picked nothing. We assign roles deterministically:
//   darkest significant color  → primary
//   most saturated / distinct  → accent
//   a mid supporting color     → secondary
//   near-black                 → dark (body text)
//   near-white / lightest      → light (canvas)
// ─────────────────────────────────────────────────────────────
function saturation(hex: Hex): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

export function assignPaletteRoles(extracted: ExtractedColor[]): {
  palette: PaletteRole[];
  chips: BrandChip[];
} {
  const chips: BrandChip[] = [];
  // Keep meaningful colors (>=3% coverage), sorted by coverage.
  const significant = extracted
    .filter((c) => c.coverage >= 0.03)
    .sort((a, b) => b.coverage - a.coverage)
    .map((c) => c.hex);

  if (significant.length === 0) {
    chips.push({
      id: "TODO_NO_COLORS",
      title: "No dominant colors detected",
      detail:
        "The logo appears monochrome or extraction returned no significant colors. " +
        "Guide falls back to a neutral grayscale palette — replace with real brand colors when known.",
    });
  }

  const byDark = [...significant].sort((a, b) => lightness(a) - lightness(b));
  const primary = byDark[0] ?? "#111827";
  const light = byDark[byDark.length - 1] ?? "#F9FAFB";

  // Accent = most saturated color that isn't the primary.
  const accent =
    [...significant]
      .filter((h) => h !== primary)
      .sort((a, b) => saturation(b) - saturation(a))[0] ?? primary;

  // Secondary = a remaining mid-tone, else derived from primary.
  const secondary =
    significant.find((h) => h !== primary && h !== accent && h !== light) ??
    primary;

  const palette: PaletteRole[] = [
    { role: "primary", hex: primary, usage: "Headers, nav bars, dark sections" },
    { role: "secondary", hex: secondary, usage: "Icons, dividers, supporting labels" },
    { role: "accent", hex: accent, usage: "Buttons, links, active states — used sparingly" },
    { role: "dark", hex: lightness(primary) < 0.15 ? primary : "#111827", usage: "Body text and strong borders" },
    { role: "light", hex: lightness(light) > 0.9 ? light : "#F9FAFB", usage: "Page background and card fills" },
  ];

  // Contrast honesty check: accent on light, primary on light.
  const accentOnLight = contrastRatio(accent, palette[4].hex);
  if (accentOnLight < 4.5) {
    chips.push({
      id: "TODO_CONTRAST_AUDIT",
      title: "Accent color fails AA on light background",
      detail:
        `Accent ${accent} scores ${accentOnLight.toFixed(2)}:1 against the light canvas ` +
        "(AA needs 4.5:1 for text). Use it for large elements or fills, not small text — " +
        "the guide prints this warning rather than silently darkening your brand color.",
    });
  }

  return { palette, chips };
}

// ─────────────────────────────────────────────────────────────
// RULE 2 — Shape taxonomy + clearspace
// The user names their logo's shape category; we apply the encoded taxonomy
// (aspect ratio guidance + minimum clear-space) from the Enterprise Brand
// Shape Taxonomy. Clearspace is derived from the shape, not guessed.
// ─────────────────────────────────────────────────────────────
export const SHAPE_TAXONOMY: Record<ShapeCategory, ShapeSpec> = {
  circle: {
    category: "circle",
    label: "Circle / Oval",
    exampleAssets: "Standalone monograms, profile avatars, secondary badges",
    aspectRatios: "1:1 · 4:3 (Oval)",
    previewRatio: 1,
    clearspaceLabel: "2× radius",
    clearspaceRule:
      "Keep clear space equal to the logo's radius on all sides (a full logo-width of empty space around it).",
    notes: "Main app icons, profile pics",
  },
  landscape: {
    category: "landscape",
    label: "Landscape Rectangle",
    exampleAssets: "Global navigation headers, lower-third graphics, wide print banners",
    aspectRatios: "21:9 · 16:9 · 3:1",
    previewRatio: 16 / 9,
    clearspaceLabel: "0.5H",
    clearspaceRule:
      "Keep clear space equal to half the logo's height on all four sides.",
    notes: "Web headers, video lower-thirds",
  },
  vertical: {
    category: "vertical",
    label: "Vertical Rectangle",
    exampleAssets: "Marketing posters, mobile app screens, side navigation menus",
    aspectRatios: "9:16 · 4:5 · 1:2",
    previewRatio: 4 / 5,
    clearspaceLabel: "0.5W",
    clearspaceRule:
      "Keep clear space equal to half the logo's width on all four sides.",
    notes: "Physical print, mobile layouts",
  },
  square: {
    category: "square",
    label: "Square",
    exampleAssets: "Social media tiles, product feature icons, square app icons",
    aspectRatios: "1:1",
    previewRatio: 1,
    clearspaceLabel: "1× side length",
    clearspaceRule:
      "Keep clear space equal to one side length of the logo on all four sides.",
    notes: "Instagram posts, grid icons",
  },
  pill: {
    category: "pill",
    label: "Pill / Capsule",
    exampleAssets: "CTA buttons, status indicators, tag labels",
    aspectRatios: "Adjustable, typically 4:1",
    previewRatio: 4,
    clearspaceLabel: "0.5H",
    clearspaceRule:
      "Keep clear space equal to half the logo's height on all four sides.",
    notes: "Primary buttons, tags, labels",
  },
  irregular: {
    category: "irregular",
    label: "Irregular / Dynamic",
    exampleAssets: "Fluid marketing shapes, custom illustrations, hero backgrounds",
    aspectRatios: "Variable / N/A",
    previewRatio: 1.6,
    clearspaceLabel: "X ÷ 2 (X = shortest dimension)",
    clearspaceRule:
      "Keep clear space equal to half the shortest dimension of the logo on all sides.",
    notes: "Expressive brand visuals, backgrounds",
  },
};

export function resolveShape(category: ShapeCategory): ShapeSpec {
  return SHAPE_TAXONOMY[category] ?? SHAPE_TAXONOMY.square;
}

function clearspaceFromShape(spec: ShapeSpec): BrandModel["clearspace"] {
  // multiplier retained for downstream consumers; derived from the shape label.
  const multiplier =
    spec.category === "circle"
      ? 2
      : spec.category === "square"
      ? 1
      : 0.5;
  return {
    multiplier,
    rule: spec.clearspaceRule,
    explainer:
      "Clear space is the empty margin that must surround your logo so nothing crowds it — " +
      "no text, no other logos, no photo edges. It keeps the mark legible and premium. " +
      "You don't measure it by eye: you measure it against the logo itself, so it scales.",
  };
}

// ─────────────────────────────────────────────────────────────
// RULE 3 — Typography pairing (Google Fonts only)
// User answers a mood question; we map to a vetted pairing. No free text.
// ─────────────────────────────────────────────────────────────
export interface TypePairing {
  display: string;
  body: string;
  displayUrl: string;
  bodyUrl: string;
  scale: { label: string; rem: number }[];
  rationale: string;
}

const GF = (family: string) =>
  `https://fonts.google.com/specimen/${family.replace(/ /g, "+")}`;

const TYPE_MAP: Record<string, TypePairing> = {
  modern: {
    display: "Space Grotesk",
    body: "Inter",
    displayUrl: GF("Space Grotesk"),
    bodyUrl: GF("Inter"),
    rationale: "Geometric display with a neutral, highly legible body. Reads current and technical.",
    scale: buildScale(),
  },
  editorial: {
    display: "Fraunces",
    body: "Inter",
    displayUrl: GF("Fraunces"),
    bodyUrl: GF("Inter"),
    rationale: "High-contrast serif for character, clean sans for body. Reads premium and considered.",
    scale: buildScale(),
  },
  friendly: {
    display: "Poppins",
    body: "Work Sans",
    displayUrl: GF("Poppins"),
    bodyUrl: GF("Work Sans"),
    rationale: "Rounded, approachable display with an even-toned body. Reads warm and accessible.",
    scale: buildScale(),
  },
  classic: {
    display: "Playfair Display",
    body: "Source Sans 3",
    displayUrl: GF("Playfair Display"),
    bodyUrl: GF("Source Sans 3"),
    rationale: "Traditional serif elegance paired with a workhorse sans. Reads established and trustworthy.",
    scale: buildScale(),
  },
};

// Modular type scale (1.25 ratio) — deterministic, so the user never guesses sizes.
function buildScale() {
  const base = 1; // rem
  const r = 1.25;
  return [
    { label: "Display", rem: +(base * r ** 4).toFixed(3) },
    { label: "H1", rem: +(base * r ** 3).toFixed(3) },
    { label: "H2", rem: +(base * r ** 2).toFixed(3) },
    { label: "H3", rem: +(base * r).toFixed(3) },
    { label: "Body", rem: base },
    { label: "Caption", rem: +(base / r).toFixed(3) },
  ];
}

export function resolveTypography(mood: string): TypePairing {
  return TYPE_MAP[mood] ?? TYPE_MAP.modern;
}

// ─────────────────────────────────────────────────────────────
// RULE 4 — Iconography style (Google Material Symbols only)
// Maps the user's one choice to a concrete Material Symbols config.
// ─────────────────────────────────────────────────────────────
export interface IconLink {
  name: string; // icon short name, e.g. "home"
  url: string; // deep link to that icon on fonts.google.com/icons
}

export interface IconStyle {
  family: string;
  fill: 0 | 1;
  weight: number;
  rounding: "sharp" | "rounded" | "outlined";
  sourceUrl: string;
  explainer: string;
  sampleIcons: string[];
  sampleIconLinks: IconLink[]; // each sample icon links to its own Google Icons page
}

// Builds a deep link to a specific icon on fonts.google.com/icons, styled to match.
function iconUrl(name: string, choice: "sharp" | "rounded" | "outlined"): string {
  const styleParam =
    choice === "rounded" ? "Rounded" : choice === "sharp" ? "Sharp" : "Outlined";
  const params = new URLSearchParams({
    "icon.query": name,
    "selected": `Material Symbols ${styleParam}:${name}`,
    "icon.style": styleParam,
    "icon.size": "24",
    "icon.color": "#1f1f1f",
  });
  return `https://fonts.google.com/icons?${params.toString()}`;
}

export function resolveIconStyle(
  choice: "sharp" | "rounded" | "outlined"
): IconStyle {
  const family =
    choice === "rounded"
      ? "Material Symbols Rounded"
      : choice === "sharp"
      ? "Material Symbols Sharp"
      : "Material Symbols Outlined";
  const sampleIcons = ["home", "mail", "search", "settings", "check_circle", "bolt"];
  return {
    family,
    fill: choice === "outlined" ? 0 : 1,
    weight: 400,
    rounding: choice,
    sourceUrl: "https://fonts.google.com/icons",
    explainer:
      "Iconography style is just the shape language of your icons — sharp corners, rounded corners, " +
      "or outline-only. Pick one and use it everywhere so the interface feels like one product. " +
      "All icons come from Google's free Material Symbols set.",
    sampleIcons,
    sampleIconLinks: sampleIcons.map((name) => ({ name, url: iconUrl(name, choice) })),
  };
}

// ─────────────────────────────────────────────────────────────
// RULE 5 — Button style
// ─────────────────────────────────────────────────────────────
export interface ButtonStyle {
  shape: "square" | "rounded" | "pill";
  radiusPx: number;
  explainer: string;
}

export function resolveButtonStyle(
  shape: "square" | "rounded" | "pill"
): ButtonStyle {
  const radiusPx = shape === "square" ? 0 : shape === "rounded" ? 5 : 999;
  return {
    shape,
    radiusPx,
    explainer:
      "Button style is the corner radius on your buttons. Square reads technical, rounded reads modern, " +
      "pill reads friendly. Consistency matters more than the choice — one shape, used for every button.",
  };
}

// ─────────────────────────────────────────────────────────────
// Compose the full brand model
// ─────────────────────────────────────────────────────────────
// User-confirmed brand colors. The form always shows these three pickers,
// pre-filled from extraction — the user confirms or overrides every time.
// This is what makes monochrome logos (black-on-white wordmarks like
// KzooParking) work: extraction can't invent a secondary/accent that isn't
// in the pixels, so the human supplies them.
export interface ColorChoices {
  primary: Hex;
  secondary: Hex;
  accent: Hex;
}

export interface FormAnswers {
  brandName: string;
  extracted: ExtractedColor[];
  colors: ColorChoices; // confirmed/overridden by the user
  shapeCategory: ShapeCategory;
  typeMood: string;
  iconChoice: "sharp" | "rounded" | "outlined";
  buttonShape: "square" | "rounded" | "pill";
}

// Suggests pre-fill values for the three pickers from extraction.
// Falls back to sensible neutrals so a monochrome logo still yields a
// usable starting point the user then edits.
export function suggestColorChoices(extracted: ExtractedColor[]): ColorChoices {
  const { palette } = assignPaletteRoles(extracted);
  const get = (role: PaletteRole["role"], fallback: Hex) =>
    palette.find((p) => p.role === role)?.hex ?? fallback;
  return {
    primary: get("primary", "#0A2E36"),
    secondary: get("secondary", "#3F7266"),
    accent: get("accent", "#00E5A3"),
  };
}

// Builds the final 5-role palette from the user's three confirmed colors,
// deriving dark/light deterministically and running the honesty contrast check.
function paletteFromChoices(c: ColorChoices): {
  palette: PaletteRole[];
  chips: BrandChip[];
} {
  const chips: BrandChip[] = [];
  const dark = lightness(c.primary) < 0.15 ? c.primary : "#111827";
  const light = "#FFFFFF";
  const palette: PaletteRole[] = [
    { role: "primary", hex: c.primary, usage: "Headers, nav bars, dark sections" },
    { role: "secondary", hex: c.secondary, usage: "Icons, dividers, supporting labels" },
    { role: "accent", hex: c.accent, usage: "Buttons, links, active states — used sparingly" },
    { role: "dark", hex: dark, usage: "Body text and strong borders" },
    { role: "light", hex: light, usage: "Page background and card fills" },
  ];
  const accentOnWhite = contrastRatio(c.accent, "#FFFFFF");
  if (accentOnWhite < 4.5) {
    chips.push({
      id: "TODO_CONTRAST_AUDIT",
      title: "Accent color fails AA on white",
      detail:
        `Accent ${c.accent} scores ${accentOnWhite.toFixed(2)}:1 against white ` +
        "(AA needs 4.5:1 for text). Use it for large elements or fills, not small text.",
    });
  }
  return { palette, chips };
}

export function buildBrandModel(a: FormAnswers): BrandModel {
  const { palette, chips } = paletteFromChoices(a.colors);
  const shape = resolveShape(a.shapeCategory);
  return {
    brandName: a.brandName,
    shape,
    palette,
    clearspace: clearspaceFromShape(shape),
    typography: resolveTypography(a.typeMood),
    iconStyle: resolveIconStyle(a.iconChoice),
    buttonStyle: resolveButtonStyle(a.buttonShape),
    chips,
  };
}
