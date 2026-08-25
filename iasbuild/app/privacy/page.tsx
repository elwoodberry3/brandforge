import { LegalPage, H2 } from "@/components/LegalPage";

export const metadata = { title: "Privacy — BrandDeck Generator" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="August 2026">
      <p>
        This page describes what the BrandDeck Generator does with the information you
        provide. It is written to be accurate, not comprehensive-sounding. Where something
        is not yet formalized, it says so.
      </p>

      <H2>What we collect</H2>
      <p>
        Two things: the email address you enter to receive your files, and the answers you
        give in the form (brand name, logo, and your style choices). Your logo is used to
        extract colors and to render the brand guide.
      </p>

      <H2>What we do with it</H2>
      <p>
        Your email is used to send you the generated files and may be stored in our contact
        system (HubSpot) so we can follow up about IAS builds and the bootcamp. Your form
        answers are used to generate your CLAUDE.md and brand guide. We do not sell your
        information.
      </p>

      <H2>Where color extraction happens</H2>
      <p>
        In the interactive demo, color extraction runs in your browser — the logo is read
        locally to find its colors. When you submit to receive files by email, the logo and
        answers are processed server-side to build the files and deliver them.
      </p>

      <H2>Unsubscribing</H2>
      <p>
        Every email includes an unsubscribe link. You can opt out of follow-up messages at
        any time, and that choice is honored across IAS communications.
      </p>

      <H2>Contact</H2>
      <p>
        Questions about this policy can go to the booking page linked in the header, or to
        the email address on any message you receive from us.
      </p>
    </LegalPage>
  );
}
