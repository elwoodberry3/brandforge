import { NextResponse } from "next/server";
import { deliver } from "@/lib/integrations";

// Server route. Receives the pre-generated files from the client (which built them
// with the shared deterministic engine) and runs the delivery seam: Resend email,
// HubSpot upsert-by-email, optional n8n forward. In demo mode (no env vars) it
// reports honestly rather than faking a send.
//
// TODO_RATE_LIMIT — no rate limiting yet; tracked openly, not hidden.
// TODO_EMAIL_VERIFY — email is format-checked only, not verified.

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: {
    email?: string;
    brandName?: string;
    logoFilename?: string;
    claudeMd?: string;
    htmlGuide?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, brandName, logoFilename, claudeMd, htmlGuide } = body;

  if (!email || !/.+@.+\..+/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!brandName || !claudeMd || !htmlGuide) {
    return NextResponse.json(
      { error: "Missing brand name or generated files" },
      { status: 400 }
    );
  }

  const result = await deliver({
    email,
    brandName,
    logoFilename: logoFilename ?? "logo",
    claudeMd,
    htmlGuide,
  });

  return NextResponse.json(result);
}
