# BrandForge
## IAS Build 022 — BrandDeck Generator

A light-mode, multi-step form for people who own a logo but have never written a
brand guide. It extracts a palette from the uploaded logo, walks the user through
clearspace, type, iconography, and button style in plain language, then
**deterministically** generates two files:

- **CLAUDE.md** — brand rules a Claude Code project reads automatically as constraints.
- **brand-guide.html** — a self-contained Tailwind brand guide (light mode).

Both are emailed on submit (Resend), the email is upserted to HubSpot by email, and
the submission can be forwarded to n8n. No design knowledge assumed on the user's side.

### Architecture

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Presentation | Next.js 14 (App Router) on Vercel | Multi-step form, shared header/footer, security pages |
| Logic | `lib/brand-logic.ts` (deterministic) | Palette roles, clearspace, type scale, contrast — NO LLM |
| Orchestration | n8n (optional) + `lib/integrations.ts` | Delivery seam, demo-mode fallback |
| Data | HubSpot Free | Contact upsert-by-email (`idProperty: email`) |
| Email | Resend | Two-file delivery with install instructions |

The deterministic engine is why the teaching is honest: every rule the form claims to
handle for the user is encoded logic, and where a rule can't be satisfied (e.g. an
accent color failing WCAG AA), the output surfaces a visible TODO chip rather than
silently "fixing" the brand.

### Shared header/footer

`components/SiteHeader.tsx` and `components/SiteFooter.tsx` wrap every route via
`app/layout.tsx`. The header carries the IAS logo mark; the footer carries the wordmark
plus the **security links** (Privacy, Terms, Security), which resolve to real routes in
`app/privacy`, `app/terms`, and `app/security`.

### Local development

```bash
npm install
cp .env.example .env.local   # optional — leave blank for demo mode
npm run dev
```

### Deploy to Vercel

1. Push to `github.com/elwoodberry3/ias-build-022-branddeck`.
2. Import the repo in Vercel (framework auto-detected as Next.js).
3. Add env vars from `.env.example` in Project Settings (optional; blank = demo mode).
4. Assign the domain `branddeck.elwoodberry.com`.

> This build intentionally does **not** set `output: 'export'` — that would disable the
> live `/api/generate` route. It ships as a server-rendered app.

### Open items (tracked, not hidden)

- `TODO_CONTRAST_AUDIT` — extracted palettes aren't guaranteed AA; flagged in-guide.
- `TODO_SVG_LOGO_RENDER` — SVG/PDF color extraction has a manual fallback.
- `TODO_RATE_LIMIT` — no rate limiting on the generate route yet.
- `TODO_EMAIL_VERIFY` — email is format-checked, not verified.
- `TODO_PERSISTENCE` — HubSpot upsert wired at code level; confirm live in tenant.

### Note on fonts

This package uses `next/font/google` (self-hosted Space Grotesk + Space Mono, no runtime
request, no layout shift) — the correct production choice on Vercel. Building in a sandbox
that blocks `fonts.googleapis.com` will fail at the font-fetch step; that is a network
allowlist limitation, not a code issue. If you must build offline, swap `app/layout.tsx`
to a `<link>`-based font load (Google Fonts stylesheet in `<head>`).
