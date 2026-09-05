/**
 * site.config.ts — the slice of shared-site data the header/footer need.
 * Shape matches AgentForge / iasInitiative exactly so the ported SiteHeader and
 * SiteFooter work unchanged. Keep social + legal in sync with those properties
 * so all IAS builds present one brand.
 */
export const site = {
  brand: {
    name: "I Automate Shit",
    short: "IAS",
  },

  // Header nav links OUT to the bootcamp site (this tool lives on its own domain).
  nav: [
    { label: "Tools", href: "https://iasinitiative.vercel.app/tools" },
    { label: "About", href: "https://iasinitiative.vercel.app/about" },
  ],

  social: [
    { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/ias-bootcamp" },
    { key: "youtube", label: "YouTube", href: "https://www.youtube.com/@iautomatesht" },
    { key: "tiktok", label: "TikTok", href: "https://www.tiktok.com/@iautomateshit" },
    { key: "instagram", label: "Instagram", href: "https://www.instagram.com/iautomatesht" },
    { key: "facebook", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61593049247788" },
    { key: "x", label: "X", href: "https://x.com/iautomaterobots" },
    { key: "threads", label: "Threads", href: "https://www.threads.com/@iautomatesht" },
  ],

  legal: {
    privacyHref: "/privacy",
    termsHref: "/terms",
    securityHref: "/security",
  },
} as const;

export type Site = typeof site;
