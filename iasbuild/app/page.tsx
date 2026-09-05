/* eslint-disable @next/next/no-img-element */
import { BrandForm } from "@/components/BrandForm";
import { build } from "@/build.config";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
      {/* Form header — official BrandForge branding (change #2, #4). */}
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-secondary">
          IAS · Build {String(build.buildNumber).padStart(3, "0")}
        </p>
        <span className="rounded-btn bg-accent/15 px-2.5 py-1 font-mono text-[11px] text-primary">
          {build.status}
        </span>
      </div>

      <img
        src="/brand/brandforge.png"
        alt="BrandForge"
        className="h-9 w-auto md:h-11"
        width={435}
        height={50}
      />
      <p className="mt-3 text-[15px] text-muted">{build.tagline}</p>

      <div className="mt-8">
        <BrandForm />
      </div>

      <p className="mt-8 text-center font-mono text-[11px] leading-relaxed text-muted">
        Demonstrate, never claim · Fonts from Google Fonts · Icons from Google Material
        Symbols · No design knowledge required
      </p>
    </div>
  );
}
