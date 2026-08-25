import { LegalPage, H2 } from "@/components/LegalPage";

export const metadata = { title: "Terms — BrandDeck Generator" };

export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="August 2026">
      <p>
        By using the BrandDeck Generator you agree to the following. These terms are plain
        on purpose.
      </p>

      <H2>What the tool does</H2>
      <p>
        It generates a brand guide and a CLAUDE.md reference file from the logo and answers
        you provide. The output is produced deterministically from your inputs. It is a
        starting point, not a substitute for a professional brand designer.
      </p>

      <H2>Your logo and content</H2>
      <p>
        You confirm you have the right to use any logo you upload. You keep all ownership of
        your logo and of the generated files. We claim no rights over your brand assets.
      </p>

      <H2>No warranty</H2>
      <p>
        The generated files are provided as-is. Color extraction and style suggestions are
        automated and may need review — the guide flags known limitations openly rather than
        hiding them. You are responsible for checking the output before using it publicly.
      </p>

      <H2>Availability</H2>
      <p>
        This is a demonstration build in the IAS portfolio. It may change or be taken offline
        without notice.
      </p>
    </LegalPage>
  );
}
