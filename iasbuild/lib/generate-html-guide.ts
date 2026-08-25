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

  const icons = m.iconStyle.sampleIcons
    .map(
      (name) =>
        `<span class="material-symbols text-3xl" style="color:${primary}">${name}</span>`
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

    <!-- Header -->
    <header class="flex items-end justify-between border-b border-gray-200 pb-6 mb-12">
      <div>
        <div class="eyebrow text-xs uppercase text-gray-400 mb-2">Brand Guidelines</div>
        <h1 class="text-4xl md:text-5xl font-bold" style="color:${primary}">${m.brandName}</h1>
      </div>
      <img src="${logoDataUri}" alt="${m.brandName} logo" class="h-14 object-contain"/>
    </header>

    <div class="grid md:grid-cols-2 gap-12">

      <!-- Logo + variations -->
      <section>
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Company Logo</h2>
        <div class="rounded-lg border border-gray-200 p-8 flex items-center justify-center mb-4" style="background:${light}">
          <img src="${logoDataUri}" alt="${m.brandName} logo" class="h-20 object-contain"/>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-lg border border-gray-200 p-4 flex items-center justify-center bg-white"><img src="${logoDataUri}" class="h-8 object-contain"/></div>
          <div class="rounded-lg p-4 flex items-center justify-center" style="background:${primary}"><img src="${logoDataUri}" class="h-8 object-contain"/></div>
          <div class="rounded-lg p-4 flex items-center justify-center" style="background:${accent}"><img src="${logoDataUri}" class="h-8 object-contain"/></div>
        </div>
        <p class="text-xs text-gray-400 mt-2">On light, on primary, on accent.</p>
      </section>

      <!-- Clearspace -->
      <section>
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Logo Clear Space</h2>
        <div class="rounded-lg border border-gray-200 p-8 mb-3" style="background:${light}">
          <div class="relative border-2 border-dashed" style="border-color:${accent};padding:2rem">
            <img src="${logoDataUri}" alt="clearspace demo" class="h-14 object-contain mx-auto"/>
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
            <div class="text-xs text-gray-500">Display — ${m.typography.display}</div>
            <div class="text-xs text-gray-500 mt-1">Body — ${m.typography.body}</div>
          </div>
          ${scaleRows}
          <p class="text-xs text-gray-400 mt-3">${m.typography.rationale}</p>
        </div>
      </section>

      <!-- Iconography + Buttons -->
      <section>
        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Iconography Style</h2>
        <div class="rounded-lg border border-gray-200 p-6 flex gap-4 flex-wrap mb-6">${icons}</div>
        <p class="text-xs text-gray-500 mb-8">${m.iconStyle.explainer} Style: <strong>${m.iconStyle.rounding}</strong>.</p>

        <h2 class="eyebrow text-xs uppercase text-gray-400 mb-4">Button Style</h2>
        <div class="rounded-lg border border-gray-200 p-6 flex gap-3 flex-wrap">
          <button style="background:${accent};color:${primary};border-radius:${buttonRadius}" class="px-5 py-2.5 text-sm font-semibold">Primary action</button>
          <button style="background:transparent;color:${primary};border:1px solid ${primary};border-radius:${buttonRadius}" class="px-5 py-2.5 text-sm font-semibold">Secondary</button>
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
