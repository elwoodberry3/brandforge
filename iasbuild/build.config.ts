// build.config.ts — IAS Build 022: BrandDeck Generator
// Config-as-data: one file drives all page content for this build.
// Inherits locked IAS token names; per-build re-skin is a one-file change.

export const build = {
  buildNumber: 22,
  name: "BrandDeck Generator",
  sector: "Creator Tools & Agency Enablement",
  tagline:
    "Upload a logo. Answer a few plain-English questions. Get a brand guide your AI can actually read.",
  status: "preview" as const, // preview | live

  whatItDoes:
    "A light-mode multi-step form for people who own a logo but have never written a brand guide. " +
    "It extracts a palette from the uploaded logo, walks the user through clearspace, type, iconography, " +
    "and button style in plain language, then deterministically generates two files: a CLAUDE.md " +
    "reference for Claude Code projects and a self-contained Tailwind HTML brand guide. Both are emailed " +
    "on submit. No design knowledge assumed on the user's side.",

  stack: "Next.js 14 (App Router), TypeScript, TailwindCSS, Vercel, n8n Cloud, HubSpot, Resend",

  // The two artifacts this build produces
  outputs: {
    claudeMd: {
      label: "CLAUDE.md",
      framing: "Claude Code project reference",
      note: "Deterministic template. Encodes the brand rules as machine-referenceable constraints.",
    },
    htmlGuide: {
      label: "brand-guide.html",
      framing: "Self-contained Tailwind brand guide (light mode)",
      note: "Single file, CDN Tailwind, no build step. Mirrors the reference poster layout.",
    },
  },

  // Honest governance — visible, never hidden
  todos: [
    {
      id: "TODO_CONTRAST_AUDIT",
      title: "WCAG contrast pass on extracted palette",
      detail:
        "Extracted logo colors are not guaranteed to meet AA against white/dark. " +
        "Generator flags failing pairs as a visible chip in the guide rather than silently 'fixing' them.",
    },
    {
      id: "TODO_SVG_LOGO_RENDER",
      title: "SVG/PDF logo preview parity",
      detail:
        "PNG previews render directly. SVG color extraction is parsed from fills; PDF requires rasterize step " +
        "before extraction — currently a documented manual fallback, not automated.",
    },
    {
      id: "TODO_PERSISTENCE",
      title: "HubSpot upsert-by-email",
      detail:
        "RESOLVED at architecture level: idProperty: email on batch endpoint, matching Build 020/021 dedup pattern. " +
        "Chip stays visible until the n8n node is confirmed live in the tenant.",
    },
  ],

  // Payload — mock, labeled as mock (fabrication prohibition)
  payload: {
    caption: "// mock data — representative of production schema, not a real submission",
    input: {
      event: "branddeck.form.submitted",
      submitted_at: "2026-08-25T15:00:00Z",
      source: "branddeck.elwoodberry.com",
      fields: {
        email: "mock@example.com",
        brand_name: "Northwind Coffee",
        logo_filename: "northwind-logo.svg",
        extracted_palette: ["#1B3A2F", "#E4B363", "#F5F0E6"],
        type_pairing: "Fraunces / Inter",
        icon_style: "rounded",
        button_shape: "pill",
      },
    },
    output: {
      status: "generated",
      files: ["CLAUDE.md", "brand-guide.html"],
      delivery: "resend",
      audit_id: "ias-demo-022-0001",
    },
  },

  links: {
    github: "https://github.com/elwoodberry3/ias-build-022-branddeck",
    portfolio: "https://branddeck.elwoodberry.com",
    booking: "https://elwoodberry.com/contact",
  },
} as const;

export type BuildConfig = typeof build;
