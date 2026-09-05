import Link from "next/link";
import { site } from "@/lib/site.config";
import { BrandLogo } from "@/components/BrandLogo";

/**
 * SiteHeader — shared top bar, matching AgentForge and IASBOOTCAMP exactly.
 *
 * IAS wordmark (onLight SVG) links home; nav is "Tools" + "About" driven from
 * site.nav (config, not markup). No Book-a-Call CTA, no build-number chip —
 * those belonged to the old portfolio header and are gone for parity.
 *
 * The logo link carries the aria-label, so BrandLogo is decorative to avoid a
 * double announce.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-hair">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-4">
        <Link
          href="/"
          aria-label={`${site.brand.name} home`}
          className="inline-flex items-center"
        >
          <BrandLogo variant="onLight" decorative className="h-7 w-auto" />
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-6">
          {site.nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-mono text-xs uppercase tracking-[0.14em] text-muted transition hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
