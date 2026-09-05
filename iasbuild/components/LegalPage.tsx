// Shared shell for the three security/legal pages so they stay visually consistent.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:px-8">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-secondary">
        BrandForge
      </p>
      <h1 className="text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 font-mono text-[11px] text-muted">Last updated: {updated}</p>
      <div className="prose-legal mt-8 space-y-5 text-[15px] leading-relaxed text-dark/90">
        {children}
      </div>
    </div>
  );
}

// Small helpers for consistent heading/paragraph styling without a prose plugin.
export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-4 text-lg font-bold text-primary">{children}</h2>
  );
}
