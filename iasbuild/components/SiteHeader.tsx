import Link from "next/link";
import { build } from "@/build.config";

// Shared header. Carries the IAS logo mark (inherited SVG) + wordmark.
// Sticky, light-mode, matching the portfolio nav across builds.
export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-mid bg-white px-5 md:px-8">
      <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="I Automate Shit — home">
        <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-lg bg-primary">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="3" y="5" width="14" height="11" rx="2" stroke="#00E5A3" strokeWidth="1.5" fill="none" />
            <rect x="6.5" y="8" width="3" height="2.5" rx="0.75" fill="#00E5A3" />
            <rect x="10.5" y="8" width="3" height="2.5" rx="0.75" fill="#00E5A3" />
            <rect x="6.5" y="12" width="7" height="1.5" rx="0.5" fill="#3F7266" />
            <line x1="10" y1="3" x2="10" y2="5" stroke="#00E5A3" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-[15px] font-bold leading-none tracking-[-0.01em] text-primary">
          I Automate <span className="text-accent">Shit</span>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:inline">
          Build {String(build.buildNumber).padStart(3, "0")}
        </span>
        <a
          href={build.links.booking}
          className="rounded-btn bg-accent px-5 py-2.5 text-[13px] font-bold text-primary no-underline transition-opacity hover:opacity-85"
        >
          Book a Call
        </a>
      </div>
    </nav>
  );
}
