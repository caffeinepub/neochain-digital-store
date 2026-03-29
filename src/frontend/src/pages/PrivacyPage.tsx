import { Link } from "@tanstack/react-router";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors mb-8"
          data-ocid="privacy.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.18 210), oklch(0.52 0.22 280))",
                boxShadow: "0 0 20px rgba(38, 214, 255, 0.4)",
              }}
            >
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1
              className="text-3xl md:text-4xl font-display font-black tracking-tight"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.95 0.02 210), oklch(0.82 0.18 210))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Privacy Policy
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: March 2026
          </p>
          <div
            className="mt-4 h-px w-24"
            style={{
              background:
                "linear-gradient(90deg, oklch(0.82 0.18 210), transparent)",
            }}
          />
        </div>

        {/* Content */}
        <div className="space-y-10">
          <Section title="1. Information We Collect">
            <p>
              We collect information you provide directly to us, such as when
              you create an account, make a purchase, or contact us for support.
              This includes:
            </p>
            <ul>
              <li>
                <strong>Account Information:</strong> Username, email address,
                and password when you register.
              </li>
              <li>
                <strong>Transaction Data:</strong> Payment method details,
                transaction IDs, and purchase history for processing your orders
                and referral commissions.
              </li>
              <li>
                <strong>Uploaded Files:</strong> Payment screenshots you submit
                as proof of transaction.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you access
                and use our platform, including device type, browser, and pages
                visited.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Process and verify your purchases and payments.</li>
              <li>Manage your account, balance, and referral commissions.</li>
              <li>
                Communicate with you about your orders, account status, and
                updates.
              </li>
              <li>Detect fraud and prevent unauthorized transactions.</li>
              <li>
                Improve and optimize our platform's performance and user
                experience.
              </li>
              <li>Comply with legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. Data Security">
            <p>
              We take the security of your data seriously. All data is stored on
              the Internet Computer blockchain, which provides decentralized,
              tamper-resistant storage. We implement industry-standard security
              measures including:
            </p>
            <ul>
              <li>End-to-end encryption for all communications.</li>
              <li>
                Secure Internet Identity authentication — no passwords stored on
                our servers.
              </li>
              <li>Regular security audits and vulnerability assessments.</li>
              <li>
                Access controls limiting data visibility to authorized personnel
                only.
              </li>
            </ul>
          </Section>

          <Section title="4. Cookies">
            <p>
              NeoChain uses minimal cookies and local storage to maintain your
              session and preferences. We do not use tracking cookies for
              advertising purposes. The data stored locally includes:
            </p>
            <ul>
              <li>Session authentication tokens (Internet Identity).</li>
              <li>UI preferences such as language and display settings.</li>
            </ul>
            <p>
              You may clear your browser's cookies and local storage at any time
              without affecting your account data.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>
              We integrate with certain third-party payment processors (eSewa,
              Khalti, Paytm, PhonePe, Google Pay, and others) to facilitate
              payments. These services have their own privacy policies, and we
              encourage you to review them. We do not sell or share your
              personal data with third parties for marketing purposes.
            </p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>Access and review the personal data we hold about you.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information
              below.
            </p>
          </Section>

          <Section title="7. Contact Us">
            <p>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong> support@neochain.store
              </li>
              <li>
                <strong>Platform:</strong> Use the support section on our
                website.
              </li>
            </ul>
          </Section>
        </div>

        {/* Footer nav */}
        <div
          className="mt-16 pt-8 border-t flex flex-wrap gap-4 text-sm text-muted-foreground"
          style={{ borderColor: "rgba(123, 77, 255, 0.2)" }}
        >
          <Link
            to="/terms"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="privacy.link"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/refund"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="privacy.link"
          >
            Refund Policy
          </Link>
          <Link
            to="/"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="privacy.link"
          >
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-display font-bold mb-4 neon-text-cyan">
        {title}
      </h2>
      <div
        className="text-muted-foreground leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_strong]:text-foreground"
        style={{
          background: "rgba(123, 77, 255, 0.04)",
          border: "1px solid rgba(123, 77, 255, 0.12)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        {children}
      </div>
    </section>
  );
}
