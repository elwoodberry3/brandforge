import Link from "next/link";
import { build } from "@/build.config";

// Shared footer. Carries the IAS wordmark + accent dot (inherited) and the
// security/legal links requested for this build: Privacy, Terms, Security.
// Links resolve to real routes shipped in this package (app/privacy, /terms, /security).
const SECURITY_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/security", label: "Security" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-20 flex max-w-4xl flex-col gap-4 border-t border-mid px-5 py-6 md:flex-row md:items-center md:justify-between md:px-8">
      <div className="flex items-center gap-3">
        <p className="font-mono text-[11px] text-muted">
          <strong className="font-bold text-primary">
            I Automate <span className="text-accent">Shit</span>
          </strong>{" "}
          · BrandDeck Generator · Aubrey / Frisco, TX
        </p>
        <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      </div>

      <nav aria-label="Legal and security" className="flex items-center gap-5">
        {SECURITY_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-mono text-[11px] text-muted no-underline transition-colors hover:text-primary"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
