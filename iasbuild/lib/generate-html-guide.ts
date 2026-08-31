// lib/generate-html-guide.ts
// Deterministic. Emits a single self-contained brand-guide.html (CDN Tailwind, no build step).
// Layout mirrors the reference poster: header, logo, logo variations, clearspace, palette,
// typography, iconography, button style — rendered in LIGHT MODE.

import type { BrandModel } from "./brand-logic";
import { contrastRatio } from "./brand-logic";

export function generateHtmlGuide(m: BrandModel, logoDataUri: string): string {
  const primary = m.palette.find((p) => p.role === "primary")!.hex;
  const secondary = m.palette.find((p) => p.role === "secondary")!.hex;
  const accent = m.palette.find((p) => p.role === "accent")!.hex;
  const dark = m.palette.find((p) => p.role === "dark")!.hex;
  const light = m.palette.find((p) => p.role === "light")!.hex;

  const swatches = m.palette
    .map((p) => {
      const onWhite = contrastRatio(p.hex, "#FFFFFF").toFixed(1);
      return `
      <div class="rounded-lg overflow-hidden border border-gray-200">
        <div class="h-20" style="background:${p.hex}"></div>
        <div class="p-3">
          <div class="text-xs uppercase tracking-wide text-gray-500">${p.role}</div>
          <div class="font-mono text-sm text-gray-900">${p.hex}</div>
          <div class="text-xs text-gray-500 mt-1">${p.usage}</div>
          <div class="text-[10px] text-gray-400 mt-1">${onWhite}:1 on white</div>
        </div>
      </div>`;
    })
    .join("");

  const scaleRows = m.typography.scale
    .map(
      (s) => `
      <div class="flex items-baseline gap-4 py-2 border-b border-gray-100">
        <span class="w-20 text-xs uppercase tracking-wide text-gray-500">${s.label}</span>
        <span style="font-size:${s.rem}rem;font-family:'${m.typography.display}',sans-serif;color:${dark}">Ag</span>
        <span class="ml-auto font-mono text-xs text-gray-400">${s.rem}rem</span>
      </div>`
    )
    .join("");

  // Each icon links to its own Google Icons page; evenly spaced (draft-003).
  const icons = m.iconStyle.sampleIconLinks
    .map(
      (l) =>
        `<a href="${l.url}" target="_blank" rel="noopener" title="${l.name} on Google Icons" class="material-symbols text-3xl no-underline transition-opacity hover:opacity-60" style="color:${primary}">${l.name}</a>`
    )
    .join("");

  const chips = m.chips.length
    ? m.chips
        .map(
          (c) => `
        <div class="rounded-md border border-amber-300 bg-amber-50 p-3">
          <div class="font-mono text-xs font-semibold text-amber-700">${c.id}</div>
          <div class="text-sm text-amber-900 mt-1">${c.title}</div>
          <div class="text-xs text-amber-800 mt-1">${c.detail}</div>
        </div>`
        )
        .join("")
    : `<div class="text-sm text-gray-500">No open items — all rules resolved.</div>`;

  const buttonRadius =
    m.buttonStyle.radiusPx === 999 ? "9999px" : m.buttonStyle.radiusPx + "px";

  const iconFontMap: Record<string, string> = {
    "Material Symbols Rounded": "Material+Symbols+Rounded",
    "Material Symbols Sharp": "Material+Symbols+Sharp",
    "Material Symbols Outlined": "Material+Symbols+Outlined",
  };
  const iconFontParam = iconFontMap[m.iconStyle.family];

  // Shape-aware logo frame. The aspect ratio and the on-color tile shape follow
  // the taxonomy category the user picked. Circle/oval get a rounded frame;
  // landscape/vertical get the matching aspect ratio; pill gets full radius.
  const r = m.shape.previewRatio; // width / height
  const frameStyle =
    m.shape.category === "circle"
      ? "aspect-ratio:1/1;border-radius:9999px;max-width:220px"
      : m.shape.category === "pill"
      ? `aspect-ratio:${r}/1;border-radius:9999px`
      : `aspect-ratio:${r}/1`;
  const tileStyle =
    m.shape.category === "circle"
      ? "aspect-ratio:1/1;border-radius:9999px"
      : m.shape.category === "pill"
      ? `aspect-ratio:${r}/1;border-radius:9999px`
      : `aspect-ratio:${r}/1;border-radius:8px`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${m.brandName} — Brand Guidelines</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    m.typography.display
  )}:wght@400;600;700&family=${encodeURIComponent(
    m.typography.body
  )}:wght@400;500&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=${iconFontParam}:opsz,wght,FILL,GRAD@24,400,${m.iconStyle.fill},0" rel="stylesheet">
<style>
  body { font-family: '${m.typography.body}', sans-serif; }
  h1,h2,h3,.display { font-family: '${m.typography.display}', sans-serif; }
  .material-symbols { font-family: '${m.iconStyle.family}'; font-variation-settings: 'FILL' ${m.iconStyle.fill}; }
  .eyebrow { letter-spacing: .12em; }
</style>
</head>
<body class="bg-white text-gray-800">
  <div class="max-w-5xl mx-auto px-6 py-12">

    <!-- Header (logo intentionally omitted — see build spec) -->
    <header class="border-b border-gray-200 pb-6 mb-12">
      <div class="eyebrow text-xs uppercase text-gray-400 mb-2">Brand Guidelines</div>
      <h1 class="text-4xl md:text-5xl font-bold" style="color:${primary}">${m.brandName}</h1>
    </header>

    <div class="grid md:grid-cols-2 gap-12">

      <!-- Logo + variations (shape-aware) -->
      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="eyebrow text-xs uppercase text-gray-400">Company Logo</h2>
          <span class="font-mono text-[10px] text-gray-400">${m.shape.label} · ${m.shape.aspectRatios}</span>
        </div>
        <div class="border border-gray-200 flex items-center justify-center mb-4 mx-auto w-full" style="background:${light};${frameStyle};border-radius:${m.shape.category === "circle" || m.shape.category === "pill" ? "9999px" : "8px"};padding:1.5rem">
          <img src="${logoDataUri}" alt="${m.brandName} logo" class="object-contain max-h-full max-w-full"/>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="border border-gray-200 bg-white flex items-center justify-center p-3" style="${tileStyle}"><img src="${logoDataUri}" class="object-contain max-h-full max-w-full"/></div>
          <div class="flex items-center justify-center p-3" style="background:${primary};${tileStyle}"><img src="${logoDataUri}" class="object-contain max-h-full max-w-full"/></div>
          <div class="flex items-center justify-center p-3" style="background:${accent};${tileStyle}"><img src="${logoDataUri}" class="object-contain max-h-full max-w-full"/></div>
        </div>
        <p class="text-xs text-gray-400 mt-2">On light, on primary, on accent.</p>
      </section>

      <!-- Clearspace (shape-aware) -->
      <section>
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="eyebrow text-xs uppercase text-gray-400">Logo Clear Space</h2>
          <span class="font-mono text-[10px] text-gray-400">min ${m.shape.clearspaceLabel}</span>
        </div>
        <div class="rounded-lg border border-gray-200 p-8 mb-3 flex items-center justify-center" style="background:${light}">
          <div class="border-2 border-dashed flex items-center justify-center" style="border-color:${accent};padding:2rem;${m.shape.category === "circle" ? "border-radius:9999px" : ""}">
            <img src="${logoDataUri}" alt="clearspace demo" class="object-contain" style="max-height:56px;max-width:180px"/>
          </div>
        </div>
        <p class="text-sm text-gray-700 font-medium">${m.clearspace.rule}</p>
        <p class="text-xs text-gray-500 mt-2">${m.clearspace.explainer}</p>
      </section>

      <!-- Palette -->
      <section class="md:col-span-2">
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Brand Palette</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">${swatches}</div>
      </section>

      <!-- Typography -->
      <section>
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Typography</h2>
        <div class="rounded-lg border border-gray-200 p-6">
          <div class="mb-4">
            <div class="text-xs text-gray-500">Display — <a href="${m.typography.displayUrl}" target="_blank" rel="noopener" class="font-medium underline decoration-gray-300 hover:decoration-gray-600" style="color:${primary}">${m.typography.display}</a></div>
            <div class="text-xs text-gray-500 mt-1">Body — <a href="${m.typography.bodyUrl}" target="_blank" rel="noopener" class="font-medium underline decoration-gray-300 hover:decoration-gray-600" style="color:${primary}">${m.typography.body}</a></div>
          </div>
          ${scaleRows}
          <p class="text-xs text-gray-400 mt-3">${m.typography.rationale}</p>
        </div>
      </section>

      <!-- Iconography + Buttons -->
      <section>
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Iconography Style</h2>
        <div class="rounded-lg border border-gray-200 px-6 py-5 flex items-center justify-between mb-6">${icons}</div>
        <p class="text-xs text-gray-500 mb-8">${m.iconStyle.explainer} Style: <strong>${m.iconStyle.rounding}</strong>. Each icon links to its Google Icons page.</p>

        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Button Style</h2>
        <div class="rounded-lg border border-gray-200 p-6 flex items-center gap-4">
          <button style="background:${accent};color:${primary};border-radius:${buttonRadius}" class="px-6 py-3 text-sm font-semibold">Primary action</button>
          <button style="background:transparent;color:${primary};border:1px solid ${primary};border-radius:${buttonRadius}" class="px-6 py-3 text-sm font-semibold">Secondary</button>
        </div>
        <p class="text-xs text-gray-500 mt-2">${m.buttonStyle.explainer} Radius: <strong>${buttonRadius}</strong>.</p>
      </section>

      <!-- Honest gaps -->
      <section class="md:col-span-2">
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Open Items</h2>
        <div class="grid md:grid-cols-2 gap-3">${chips}</div>
      </section>

    </div>

    <footer class="mt-16 pt-6 border-t border-gray-200 text-xs text-gray-400">
      Generated by IAS BrandDeck Generator · Fonts: Google Fonts · Icons: Google Material Symbols ·
      Every rule traces to your inputs — nothing was invented.
    </footer>
  </div>
</body>
</html>`;
}
