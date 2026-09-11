# BrandForge — Upstash standup

The code side is done (signedLink.ts, /d/[token] route, integrations.ts now
links instead of attaches). What's left is the account/config side you do
outside the repo. ~10 minutes.

## 1. Create the Upstash Redis database
1. Go to console.upstash.com → sign in (GitHub login is fine).
2. **Create Database** → Redis.
3. Name it `brandforge` (or `ias-brandforge`).
4. Region: pick the one closest to your Vercel deployment region (e.g. us-east-1)
   — same-region keeps download latency low. Global isn't needed.
5. Type: the **free tier** is enough. These payloads are small text/HTML with a
   24h TTL; you will not approach the free-tier limits.
6. Create it.

## 2. Copy the REST credentials (NOT the redis:// URL)
On the database page, find the **REST API** section (not the "Redis" TCP
section). Copy:
- **UPSTASH_REDIS_REST_URL**  → looks like `https://xxxx.upstash.io`
- **UPSTASH_REDIS_REST_TOKEN** → a long token starting with `A...`

The code uses the REST interface over HTTPS (no SDK, no TCP), so the REST URL +
token are the right pair. The `redis://…` connection string will NOT work here.

## 3. Generate the signing secret
`DOWNLOAD_SECRET` is any long random string — it signs the download tokens.
Generate one:
    openssl rand -base64 32
Use different secrets per environment if you want; it only needs to be stable
(rotating it invalidates outstanding links, which is fine).

## 4. Set the vars in Vercel
Vercel → BrandForge project → Settings → Environment Variables. Add, scoped to
**Production** (and Preview if you test there):
    DOWNLOAD_SECRET            = <the openssl output>
    UPSTASH_REDIS_REST_URL     = https://xxxx.upstash.io
    UPSTASH_REDIS_REST_TOKEN   = A...
    PUBLIC_ORIGIN              = https://brandforge.iasbootcamp.com
Confirm RESEND_API_KEY + RESEND_FROM are already set (they gate the email).

## 5. Redeploy
Env vars are read at build/runtime; Vercel only picks up new values on a fresh
deploy. Trigger a redeploy after adding them.

## 6. Verify it went live
Generate a brand guide from the site and check:
- The delivery-mode box should no longer say "demo" for email.
- The email arrives with two BUTTONS (Download CLAUDE.md / View brand-guide.html),
  NO attachments.
- Click a button → the file downloads from brandforge.iasbootcamp.com/d/<token>.
- Wait past 24h (or shorten ttlMs to test) → the link returns
  "This download link has expired." with a 410.

## Fallback behavior (important)
If DOWNLOAD_SECRET or the Upstash pair is missing, `signedLinkConfigured` is
false and the email FALLS BACK TO ATTACHING both files — which is exactly the
behavior that lands in spam. So the whole point of this standup is to set all
three: secret + REST URL + REST token. Half-configured = still attaching.

## Note on AgentForge
AgentForge already has an Upstash database (used for rate limiting). You can
either reuse that same database for BrandForge (share the REST URL/token) or
give BrandForge its own. Sharing is fine — the download keys are prefixed
`dl:` and won't collide with the rate-limit keys. Separate is cleaner for
per-tool isolation. Your call.
