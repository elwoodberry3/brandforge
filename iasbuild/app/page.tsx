import { BrandForm } from "@/components/BrandForm";
import { build } from "@/build.config";

export default function Home() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-secondary">
          IAS · Build {String(build.buildNumber).padStart(3, "0")}
        </p>
        <span className="rounded-btn bg-accent/15 px-2.5 py-1 font-mono text-[11px] text-primary">
          {build.status}
        </span>
      </div>

      <h1 className="text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl">
        {build.name}
      </h1>
      <p className="mt-2 text-[15px] text-muted">{build.tagline}</p>

      <div className="mt-8">
        <BrandForm />
      </div>

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-muted">
        Demonstrate, never claim · Fonts from Google Fonts · Icons from Google Material
        Symbols · No design knowledge required
      </p>
    </div>
  );
}
