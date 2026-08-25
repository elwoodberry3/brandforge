/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTE: intentionally NO `output: 'export'`.
  // This build ships live API routes (/api/generate) for the Resend + HubSpot seam.
  // Static export would silently disable them — the exact architectural blocker
  // flagged across the IAS portfolio. Keep this build server-rendered on Vercel.
  reactStrictMode: true,
};

export default nextConfig;
