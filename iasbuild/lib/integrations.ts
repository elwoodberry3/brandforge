// lib/integrations.ts
// Demo-mode integration seam. Runs with NO credentials in demo mode and returns
// deterministic mock results. Each integration goes live independently the moment
// its env vars are present. This mirrors the IAS pattern across builds 020/021.
//
// Env vars (all optional — absence = demo mode for that integration):
//   RESEND_API_KEY, RESEND_FROM           → live email delivery
//   HUBSPOT_TOKEN                          → live upsert-by-email
//   N8N_WEBHOOK_URL                        → forward submission to n8n orchestration
//
// Governance: no fabricated success. In demo mode we say so in the response.

import { renderBrandDeliveryEmail, slugifyBrand } from "./deliveryEmail";

export interface DeliveryResult {
  emailSent: boolean;
  hubspotUpserted: boolean;
  n8nForwarded: boolean;
  mode: "live" | "demo" | "partial";
  notes: string[];
}

interface DeliveryInput {
  email: string;
  brandName: string;
  claudeMd: string;
  htmlGuide: string;
  logoFilename: string;
}

// ── Resend ────────────────────────────────────────────────
async function sendEmail(input: DeliveryInput): Promise<{ ok: boolean; note: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    return { ok: false, note: "Resend not configured — email skipped (demo mode)." };
  }
  try {
    const firstName =
      (input.email.split("@")[0] || "there").split(/[._-]/)[0].replace(/^\w/, (c) => c.toUpperCase());
    const origin = process.env.PUBLIC_ORIGIN || "https://brandforge.iasbootcamp.com";
    const unsubscribeUrl = `${origin}/unsubscribe?e=${encodeURIComponent(input.email)}`;
    const html = renderBrandDeliveryEmail({
      brand_name: input.brandName,
      brand_slug: slugifyBrand(input.brandName),
      first_name: firstName,
      unsubscribe_url: unsubscribeUrl,
    });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.email,
        subject: `Your ${input.brandName} brand guide is ready`,
        html,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@i-automate-shit.com>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        attachments: [
          {
            filename: "CLAUDE.md",
            content: Buffer.from(input.claudeMd).toString("base64"),
          },
          {
            filename: "brand-guide.html",
            content: Buffer.from(input.htmlGuide).toString("base64"),
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, note: `Resend error ${res.status}: ${text.slice(0, 120)}` };
    }
    return { ok: true, note: "Email sent via Resend with both files attached." };
  } catch (e) {
    return { ok: false, note: `Resend request failed: ${(e as Error).message}` };
  }
}

// ── HubSpot upsert-by-email ───────────────────────────────
// Persona resolution (tool_brandforge, additive via resolveRetag) is owned by
// n8n in forwardN8n(). This direct path is a FALLBACK for when n8n isn't wired:
// it upserts by email WITHOUT writing ias_source, so it can never clobber a
// higher-value persona set elsewhere. It only records the last brand + a funnel
// tag in ias_last_asset. When N8N_WEBHOOK_URL is set, prefer letting n8n own the
// write and leave HUBSPOT_TOKEN unset to avoid a double-write.
async function upsertHubspot(
  email: string,
  brandName: string
): Promise<{ ok: boolean; note: string }> {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return { ok: false, note: "HubSpot not configured — n8n owns the upsert (or demo mode)." };
  }
  try {
    // Batch upsert with idProperty: email — same dedup strategy as builds 020/021.
    // Deliberately does NOT set ias_source: only n8n's resolveRetag may decide
    // persona, so a direct fallback write can't overwrite a student/exec tag.
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: [
            {
              idProperty: "email",
              id: email,
              properties: {
                email,
                ias_last_asset: `brand-guide:${brandName}`,
              },
            },
          ],
        }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, note: `HubSpot error ${res.status}: ${text.slice(0, 120)}` };
    }
    return { ok: true, note: "Contact upserted (fallback, no persona clobber)." };
  } catch (e) {
    return { ok: false, note: `HubSpot request failed: ${(e as Error).message}` };
  }
}

// ── n8n forward (persona capture + orchestration) ─────────
// Captures this person as a DEVELOPER (tool_brandforge) through n8n, which
// upserts by email and runs resolveRetag(): a live paid relationship
// (bootcamp_subscriber) or higher-value persona outranks a free tool tag, so a
// developer who is ALSO a student or an exec keeps that standing and simply
// gains the BrandForge usage. Additive by design — never clobbers.
async function forwardN8n(input: DeliveryInput): Promise<{ ok: boolean; note: string }> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return { ok: false, note: "n8n webhook not configured — not forwarded (demo mode)." };
  }
  try {
    const firstName =
      (input.email.split("@")[0] || "").split(/[._-]/)[0].replace(/^\w/, (c) => c.toUpperCase());
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_SECRET ? { "x-ias-secret": process.env.N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        stage: "tool_use",
        tool: "brandforge-brand-guide",
        event: "brandforge.form.submitted",
        email: input.email,
        first_name: firstName,
        brand_name: input.brandName,
        logo_filename: input.logoFilename,
        // Ecosystem taxonomy: explicit developer persona + funnel + last asset.
        // n8n maps `source` to a valid ias_source enum and resolveRetag keeps the
        // higher-value persona if one already exists.
        source: "brandforge-tool",
        ias_source: "tool_brandforge",
        ias_last_asset: `brand-guide:${input.brandName}`,
      }),
    });
    return res.ok
      ? { ok: true, note: "Developer captured + forwarded to n8n (tool_brandforge)." }
      : { ok: false, note: `n8n returned ${res.status}.` };
  } catch (e) {
    return { ok: false, note: `n8n request failed: ${(e as Error).message}` };
  }
}

// ── Orchestrator ──────────────────────────────────────────
export async function deliver(input: DeliveryInput): Promise<DeliveryResult> {
  const [email, hubspot, n8n] = await Promise.all([
    sendEmail(input),
    upsertHubspot(input.email, input.brandName),
    forwardN8n(input),
  ]);

  const results = [email.ok, hubspot.ok, n8n.ok];
  const anyLive = results.some(Boolean);
  const allLive = results.every(Boolean);
  const mode: DeliveryResult["mode"] = allLive
    ? "live"
    : anyLive
    ? "partial"
    : "demo";

  return {
    emailSent: email.ok,
    hubspotUpserted: hubspot.ok,
    n8nForwarded: n8n.ok,
    mode,
    notes: [email.note, hubspot.note, n8n.note],
  };
}
