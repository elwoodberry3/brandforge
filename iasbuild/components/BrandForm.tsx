"use client";

import { useState } from "react";
import {
  buildBrandModel,
  suggestColorChoices,
  SHAPE_TAXONOMY,
  type ExtractedColor,
  type FormAnswers,
  type ColorChoices,
  type ShapeCategory,
} from "@/lib/brand-logic";
import { generateClaudeMd } from "@/lib/generate-claude-md";
import { generateHtmlGuide } from "@/lib/generate-html-guide";

// Steps: 0 logo+name · 1 shape · 2 colors · 3 type · 4 icons · 5 buttons · 6 email · 7 result
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
const LAST_INPUT: Step = 6; // email is the final input before generation
const RESULT: Step = 7;

interface State {
  brandName: string;
  logoName: string;
  logoDataUri: string;
  extracted: ExtractedColor[];
  shapeCategory: ShapeCategory | "";
  colors: ColorChoices;
  colorsTouched: boolean; // has the user seen/confirmed the picker step
  typeMood: string;
  iconChoice: "sharp" | "rounded" | "outlined" | "";
  buttonShape: "square" | "rounded" | "pill" | "";
  email: string;
}

const initial: State = {
  brandName: "",
  logoName: "",
  logoDataUri: "",
  extracted: [],
  shapeCategory: "",
  colors: { primary: "#0A2E36", secondary: "#3F7266", accent: "#00E5A3" },
  colorsTouched: false,
  typeMood: "",
  iconChoice: "",
  buttonShape: "",
  email: "",
};

// Browser-side color extraction via canvas sampling (PNG/JPG/most raster).
async function extractColors(dataUri: string): Promise<ExtractedColor[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const S = 48;
      const c = document.createElement("canvas");
      c.width = S;
      c.height = S;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve([]);
      ctx.drawImage(img, 0, 0, S, S);
      let d: Uint8ClampedArray;
      try {
        d = ctx.getImageData(0, 0, S, S).data;
      } catch {
        return resolve([]);
      }
      const buckets: Record<string, number> = {};
      let total = 0;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 128) continue;
        const r = Math.round(d[i] / 24) * 24;
        const g = Math.round(d[i + 1] / 24) * 24;
        const b = Math.round(d[i + 2] / 24) * 24;
        const key = `${r},${g},${b}`;
        buckets[key] = (buckets[key] || 0) + 1;
        total++;
      }
      const arr = Object.entries(buckets)
        .map(([k, v]) => {
          const [r, g, b] = k.split(",").map(Number);
          const hex =
            "#" +
            [r, g, b]
              .map((x) => Math.min(255, x).toString(16).padStart(2, "0"))
              .join("");
          return { hex, coverage: v / total };
        })
        .sort((a, b) => b.coverage - a.coverage)
        .slice(0, 6);
      resolve(arr);
    };
    img.onerror = () => resolve([]);
    img.src = dataUri;
  });
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function BrandForm() {
  const [step, setStep] = useState<Step>(0);
  const [s, setS] = useState<State>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [delivery, setDelivery] = useState<null | { mode: string; notes: string[] }>(
    null
  );

  const set = (patch: Partial<State>) => setS((prev) => ({ ...prev, ...patch }));

  const answers = (): FormAnswers => ({
    brandName: s.brandName,
    extracted: s.extracted,
    colors: s.colors,
    shapeCategory: (s.shapeCategory || "square") as ShapeCategory,
    typeMood: s.typeMood || "modern",
    iconChoice: (s.iconChoice || "rounded") as FormAnswers["iconChoice"],
    buttonShape: (s.buttonShape || "rounded") as FormAnswers["buttonShape"],
  });

  const valid: Record<Step, boolean> = {
    0: !!(s.brandName.trim() && s.logoDataUri),
    1: !!s.shapeCategory,
    2: s.colorsTouched,
    3: !!s.typeMood,
    4: !!s.iconChoice,
    5: !!s.buttonShape,
    6: /.+@.+\..+/.test(s.email),
    7: true,
  };

  async function handleFile(f: File) {
    set({ logoName: f.name });
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const uri = ev.target?.result as string;
      const colors = await extractColors(uri);
      // Pre-fill the three pickers from extraction; user confirms/overrides at step 2.
      const suggested = suggestColorChoices(colors);
      set({ logoDataUri: uri, extracted: colors, colors: suggested });
    };
    reader.readAsDataURL(f);
  }

  async function submit() {
    setSubmitting(true);
    const model = buildBrandModel(answers());
    const claudeMd = generateClaudeMd(model);
    const htmlGuide = generateHtmlGuide(model, s.logoDataUri);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: s.email,
          brandName: s.brandName,
          logoFilename: s.logoName,
          claudeMd,
          htmlGuide,
        }),
      });
      const data = await res.json();
      setDelivery({ mode: data.mode ?? "demo", notes: data.notes ?? [] });
    } catch {
      setDelivery({ mode: "demo", notes: ["Request failed — files still available below."] });
    }
    setSubmitting(false);
    setStep(RESULT);
  }

  const model = valid[0] ? buildBrandModel(answers()) : null;

  return (
    <div>
      {/* Progress dots — centered above the form card (change #3). */}
      <div className="mb-6 flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <span
            key={i}
            className={`h-[9px] w-[9px] rounded-full ${
              i < step ? "bg-secondary" : i === step ? "bg-accent" : "bg-mid"
            }`}
          />
        ))}
      </div>

      <div className="rounded-btn border border-mid bg-white p-7">
        {step === 0 && (
          <Step title="Your brand & logo">
            <Label>Brand name</Label>
            <input
              type="text"
              value={s.brandName}
              onChange={(e) => set({ brandName: e.target.value })}
              placeholder="e.g. KzooParking"
              className="mb-6 w-full rounded-btn border border-mid px-3 py-2.5 text-sm"
            />
            <Label>
              Your logo{" "}
              <span className="font-normal text-muted">
                (PNG recommended · SVG / PDF also fine)
              </span>
            </Label>
            <Dropzone
              logoDataUri={s.logoDataUri}
              logoName={s.logoName}
              onFile={handleFile}
            />
            {s.extracted.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold">Colors we found:</p>
                <div className="flex gap-2">
                  {s.extracted.map((c) => (
                    <span
                      key={c.hex}
                      title={c.hex}
                      className="h-8 w-8 rounded-btn border border-mid"
                      style={{ background: c.hex }}
                    />
                  ))}
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted">
                  If your logo is black-and-white, that&rsquo;s fine — you&rsquo;ll set your
                  real brand colors next.
                </p>
              </div>
            )}
          </Step>
        )}

        {step === 1 && (
          <Step
            title="What shape is your logo?"
            help="This sets your logo's layout rules — aspect ratio and the clear space around it — using a standard shape taxonomy. Pick the closest match."
          >
            <OptionGrid
              options={(Object.keys(SHAPE_TAXONOMY) as ShapeCategory[]).map((k) => ({
                v: k,
                label: SHAPE_TAXONOMY[k].label,
                sub: `${SHAPE_TAXONOMY[k].aspectRatios} · clear space ${SHAPE_TAXONOMY[k].clearspaceLabel}`,
              }))}
              selected={s.shapeCategory}
              onSelect={(v) => set({ shapeCategory: v as ShapeCategory })}
            />
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Confirm your brand colors"
            help="We pre-filled these from your logo. Extraction can't invent colors a logo doesn't contain — so if your logo is black-and-white, set your real brand colors here. These three drive the whole guide."
          >
            <ColorPickers
              colors={s.colors}
              extracted={s.extracted}
              onChange={(colors) => set({ colors, colorsTouched: true })}
            />
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Which feels most like your brand?"
            help="This picks your fonts — a heading and body face, both free from Google Fonts. You pick a feeling; we handle the pairing and sizes."
          >
            <OptionGrid
              options={[
                { v: "modern", label: "Modern & technical", sub: "Space Grotesk / Inter" },
                { v: "editorial", label: "Premium & editorial", sub: "Fraunces / Inter" },
                { v: "friendly", label: "Warm & friendly", sub: "Poppins / Work Sans" },
                { v: "classic", label: "Classic & established", sub: "Playfair / Source Sans" },
              ]}
              selected={s.typeMood}
              onSelect={(v) => set({ typeMood: v as string })}
            />
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Pick an icon style"
            help="Iconography style is the shape language of your icons. All icons come from Google's free Material Symbols set. Pick one; it's used everywhere."
          >
            <OptionGrid
              options={[
                { v: "rounded", label: "Rounded", sub: "soft corners — friendly" },
                { v: "sharp", label: "Sharp", sub: "hard corners — technical" },
                { v: "outlined", label: "Outlined", sub: "outline only — light" },
              ]}
              selected={s.iconChoice}
              onSelect={(v) => set({ iconChoice: v as State["iconChoice"] })}
            />
          </Step>
        )}

        {step === 5 && (
          <Step
            title="Pick a button style"
            help="Button style is the corner radius on your buttons. Consistency matters more than the choice — one shape, used everywhere."
          >
            <OptionGrid
              options={[
                { v: "square", label: "Square", sub: "0px — technical" },
                { v: "rounded", label: "Rounded", sub: "5px — modern" },
                { v: "pill", label: "Pill", sub: "fully round — friendly" },
              ]}
              selected={s.buttonShape}
              onSelect={(v) => set({ buttonShape: v as State["buttonShape"] })}
            />
          </Step>
        )}

        {step === 6 && (
          <Step
            title="Where should we send your brand guide?"
            help="We email two files: a CLAUDE.md your AI reads as brand rules, and a ready-to-open HTML brand guide — plus install instructions."
          >
            <Label>Email address</Label>
            <input
              type="email"
              value={s.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="you@company.com"
              className="mb-4 w-full rounded-btn border border-mid px-3 py-2.5 text-sm"
            />
            <div className="rounded-btn bg-light p-4 font-mono text-[11px] text-muted">
              You&rsquo;ll receive:
              <br />• CLAUDE.md — brand rules your AI can reference
              <br />• brand-guide.html — open in any browser
              <br />• install + reference instructions
            </div>
          </Step>
        )}

        {step === RESULT && model && (
          <Step title="Your brand guide is ready">
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold">
                Palette · {model.shape.label} · clear space {model.shape.clearspaceLabel}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {model.palette.map((p) => (
                  <div key={p.role} className="text-center">
                    <div
                      className="mb-1 h-12 w-full rounded-btn border border-mid"
                      style={{ background: p.hex }}
                    />
                    <p className="font-mono text-[10px] text-muted">{p.hex}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mb-5 text-sm">
              <b>Fonts:</b> {model.typography.display} / {model.typography.body} ·{" "}
              <b>Icons:</b> {model.iconStyle.rounding} · <b>Buttons:</b>{" "}
              {model.buttonStyle.shape}
            </p>

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold">Honest open items</p>
              {model.chips.length ? (
                model.chips.map((c) => (
                  <div
                    key={c.id}
                    className="mb-2 rounded-btn border border-amber-300 bg-amber-50 p-3"
                  >
                    <p className="font-mono text-[11px] font-bold text-amber-700">
                      {c.id}
                    </p>
                    <p className="mt-1 text-sm text-amber-900">{c.title}</p>
                    <p className="mt-1 text-xs text-amber-800">{c.detail}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">No open items — all rules resolved.</p>
              )}
            </div>

            {delivery && (
              <div className="mb-5 rounded-btn bg-light p-3 font-mono text-[11px] text-muted">
                Delivery mode: <b className="text-primary">{delivery.mode}</b>
                {delivery.notes.map((n, i) => (
                  <div key={i}>• {n}</div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  download("CLAUDE.md", generateClaudeMd(model), "text/markdown")
                }
                className="rounded-btn border border-mid bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-secondary"
              >
                Download CLAUDE.md
              </button>
              <button
                onClick={() =>
                  download(
                    "brand-guide.html",
                    generateHtmlGuide(model, s.logoDataUri),
                    "text/html"
                  )
                }
                className="rounded-btn border border-mid bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-secondary"
              >
                Download brand-guide.html
              </button>
            </div>
          </Step>
        )}
      </div>

      {/* Nav */}
      {step < RESULT && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setStep((step - 1) as Step)}
            className={`rounded-btn border border-mid bg-white px-5 py-2.5 text-sm font-semibold ${
              step === 0 ? "invisible" : ""
            }`}
          >
            Back
          </button>
          {step === LAST_INPUT ? (
            <button
              onClick={submit}
              disabled={!valid[LAST_INPUT] || submitting}
              className="rounded-btn bg-accent px-6 py-2.5 text-sm font-semibold text-primary disabled:opacity-40"
            >
              {submitting ? "Generating…" : "Generate"}
            </button>
          ) : (
            <button
              onClick={() => valid[step] && setStep((step + 1) as Step)}
              disabled={!valid[step]}
              className="rounded-btn bg-accent px-6 py-2.5 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Small presentational helpers ──
function Step({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-1 text-lg font-bold text-primary">{title}</h2>
      {help ? (
        <p className="mb-5 text-sm text-muted">{help}</p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-semibold">{children}</label>;
}

function OptionGrid<T>({
  options,
  selected,
  onSelect,
}: {
  options: { v: T; label: string; sub: string }[];
  selected: T | null | "";
  onSelect: (v: T) => void;
}) {
  return (
    <div className="grid gap-3">
      {options.map((o, i) => {
        const sel = o.v === selected;
        return (
          <button
            key={i}
            onClick={() => onSelect(o.v)}
            className={`rounded-btn border bg-white p-4 text-left transition-all ${
              sel
                ? "border-accent shadow-[0_0_0_1px_#00E5A3]"
                : "border-mid hover:border-secondary"
            }`}
            style={sel ? { background: "rgba(0,229,163,0.05)" } : undefined}
          >
            <p className="text-sm font-semibold">{o.label}</p>
            <p className="mt-0.5 text-xs text-muted">{o.sub}</p>
          </button>
        );
      })}
    </div>
  );
}

// Three labeled color pickers (primary/secondary/accent) with hex text inputs,
// plus quick-apply swatches from what extraction found. This is the step that
// makes monochrome logos work — the user supplies colors the pixels don't have.
function ColorPickers({
  colors,
  extracted,
  onChange,
}: {
  colors: ColorChoices;
  extracted: ExtractedColor[];
  onChange: (c: ColorChoices) => void;
}) {
  const roles: { key: keyof ColorChoices; label: string; usage: string }[] = [
    { key: "primary", label: "Primary", usage: "Headers, nav, dark sections" },
    { key: "secondary", label: "Secondary", usage: "Icons, dividers, supporting labels" },
    { key: "accent", label: "Accent", usage: "Buttons, links, active states" },
  ];
  return (
    <div className="grid gap-4">
      {roles.map((r) => (
        <div key={r.key} className="flex items-center gap-3">
          <input
            type="color"
            value={colors[r.key]}
            onChange={(e) => onChange({ ...colors, [r.key]: e.target.value })}
            aria-label={`${r.label} color`}
            className="h-11 w-11 shrink-0 cursor-pointer rounded-btn border border-mid bg-white p-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{r.label}</span>
              <input
                type="text"
                value={colors[r.key]}
                onChange={(e) => onChange({ ...colors, [r.key]: e.target.value })}
                className="w-24 rounded-btn border border-mid px-2 py-1 font-mono text-xs"
              />
            </div>
            <p className="mt-0.5 text-xs text-muted">{r.usage}</p>
          </div>
        </div>
      ))}

      {extracted.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold">Quick-apply from your logo:</p>
          <div className="flex flex-wrap gap-2">
            {extracted.map((c) => (
              <button
                key={c.hex}
                title={`Use ${c.hex} as accent`}
                onClick={() => onChange({ ...colors, accent: c.hex })}
                className="h-7 w-7 rounded-btn border border-mid"
                style={{ background: c.hex }}
              />
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted">
            Tap a swatch to set it as your accent, or use the pickers above.
          </p>
        </div>
      )}
    </div>
  );
}

function Dropzone({
  logoDataUri,
  logoName,
  onFile,
}: {
  logoDataUri: string;
  logoName: string;
  onFile: (f: File) => void;
}) {
  const [hot, setHot] = useState(false);
  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setHot(true);
      }}
      onDragLeave={() => setHot(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHot(false);
        if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      className={`block cursor-pointer rounded-btn border-2 border-dashed p-8 text-center transition-colors ${
        hot ? "border-accent" : "border-mid"
      }`}
      style={hot ? { background: "rgba(0,229,163,0.05)" } : undefined}
    >
      {logoDataUri ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUri}
            alt="Uploaded logo"
            className="mx-auto mb-2 h-16 object-contain"
          />
          <p className="text-xs text-muted">{logoName}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Click to upload or drag a file here</p>
          <p className="mt-1 font-mono text-[11px] text-muted">
            We read your colors from this file — nothing leaves your browser here.
          </p>
        </>
      )}
      <input
        type="file"
        accept="image/*,.svg,.pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </label>
  );
}
