import { LegalPage, H2 } from "@/components/LegalPage";

export const metadata = { title: "Security — BrandForge" };

export default function Security() {
  return (
    <LegalPage title="Security" updated="August 2026">
      <p>
        A short, honest account of how this build handles your data and what protections are
        and are not yet in place.
      </p>

      <H2>Transport</H2>
      <p>
        The app is served over HTTPS on Vercel. Requests to the email and contact systems
        (Resend, HubSpot) are made server-to-server over TLS using credentials that are never
        exposed to the browser.
      </p>

      <H2>Credentials</H2>
      <p>
        API keys live in server-side environment variables only. If a credential is not set,
        the corresponding integration runs in demo mode and reports that plainly rather than
        pretending to have delivered.
      </p>

      <H2>Data retention</H2>
      <p>
        Generated files are delivered by email and are not stored long-term on our servers.
        Your email address may be retained in HubSpot for follow-up, subject to the privacy
        policy and your unsubscribe choice.
      </p>

      <H2>Known limitations</H2>
      <p>
        This is a portfolio demonstration build. It does not yet implement rate limiting or
        email verification. Those gaps are tracked openly in the build&rsquo;s TODO list rather
        than left unstated. Do not upload anything you consider confidential.
      </p>

      <H2>Reporting an issue</H2>
      <p>
        If you find a security problem, use the booking link in the header to reach the
        maintainer directly.
      </p>
    </LegalPage>
  );
}
