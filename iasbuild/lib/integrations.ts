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
        html: emailBody(input.brandName),
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
async function upsertHubspot(
  email: string,
  brandName: string
): Promise<{ ok: boolean; note: string }> {
  const token = process.env.HUBSPOT_TOKEN;
  if (!token) {
    return { ok: false, note: "HubSpot not configured — contact not stored (demo mode)." };
  }
  try {
    // Batch upsert with idProperty: email — same dedup strategy as builds 020/021.
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
                branddeck_last_brand: brandName,
                branddeck_source: "build-022",
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
    return { ok: true, note: "Contact upserted to HubSpot by email." };
  } catch (e) {
    return { ok: false, note: `HubSpot request failed: ${(e as Error).message}` };
  }
}

// ── n8n forward (optional orchestration hop) ──────────────
async function forwardN8n(input: DeliveryInput): Promise<{ ok: boolean; note: string }> {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    return { ok: false, note: "n8n webhook not configured — not forwarded (demo mode)." };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "branddeck.form.submitted",
        email: input.email,
        brand_name: input.brandName,
        logo_filename: input.logoFilename,
      }),
    });
    return res.ok
      ? { ok: true, note: "Submission forwarded to n8n." }
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

function emailBody(brandName: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111827">
    <h2 style="color:#0A2E36">Your ${brandName} brand guide is attached</h2>
    <p>Two files are attached to this email:</p>
    <ul>
      <li><strong>CLAUDE.md</strong> — brand rules your AI reads automatically. Drop it at your project root.</li>
      <li><strong>brand-guide.html</strong> — open in any browser to view your full guide.</li>
    </ul>
    <p style="font-size:13px;color:#6B7280">Generated deterministically by the IAS BrandForge.
    Every rule traces to your inputs — nothing was invented.</p>
  </div>`;
}
