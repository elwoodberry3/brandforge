/* eslint-disable @next/next/no-img-element */

/**
 * BrandLogo — the IAS wordmark as an SVG, one component with a variant prop.
 * Ported verbatim from AgentForge so BrandForge's header/footer match exactly.
 *
 *   variant="onLight"  → dark-ink logo for white/light backgrounds (header)
 *   variant="onDark"   → white/emerald logo for dark backgrounds (footer)
 *
 * File names describe the ARTWORK colour, so the mapping is intentionally
 * crossed: "light mode" artwork is dark ink (for light surfaces), "dark mode"
 * artwork is white (for dark surfaces). Choosing by surface here keeps call
 * sites from having to remember that.
 *
 * When decorative (a wrapping <Link> already carries an aria-label), pass
 * decorative so alt="" and the img is hidden from the a11y tree.
 */
export function BrandLogo({
  variant = "onLight",
  className = "",
  decorative = false,
  alt = "I Automate Shit",
}: {
  variant?: "onLight" | "onDark";
  className?: string;
  decorative?: boolean;
  alt?: string;
}) {
  const src =
    variant === "onDark"
      ? "/svgs/dark.mode__stacked.svg"
      : "/svgs/light.mode__stacked.svg";

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
