import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors mb-8"
          data-ocid="terms.link"
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
                  "linear-gradient(135deg, oklch(0.52 0.22 280), oklch(0.42 0.18 300))",
                boxShadow: "0 0 20px rgba(123, 77, 255, 0.5)",
              }}
            >
              <FileText className="w-5 h-5 text-white" />
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
              Terms & Conditions
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
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using the NeoChain Digital Store platform, you
              agree to be bound by these Terms & Conditions. If you do not agree
              to all terms, you may not use our services. These terms apply to
              all users, including registered members and visitors.
            </p>
          </Section>

          <Section title="2. Use of Service">
            <p>
              You agree to use NeoChain only for lawful purposes and in
              accordance with these Terms. You must not:
            </p>
            <ul>
              <li>
                Use the service in any way that violates applicable local,
                national, or international law.
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the platform.
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                service.
              </li>
              <li>
                Submit false, misleading, or fraudulent transaction information.
              </li>
            </ul>
          </Section>

          <Section title="3. User Accounts">
            <p>
              To access certain features, you must register for an account using
              Internet Identity. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your credentials.</li>
              <li>All activities that occur under your account.</li>
              <li>
                Notifying us immediately of any unauthorized use of your
                account.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these terms or engage in fraudulent activity.
            </p>
          </Section>

          <Section title="4. Products & Payments">
            <p>
              NeoChain offers digital product plans at fixed prices (₹1,500 /
              ₹3,000 / ₹5,000 / ₹8,000). All purchases are subject to admin
              verification and approval. By purchasing a plan, you acknowledge:
            </p>
            <ul>
              <li>
                Payment must be made through one of our supported methods
                (eSewa, Khalti, Paytm, PhonePe, Google Pay, USD Payment, Bybit
                Pay).
              </li>
              <li>
                A valid Transaction ID and payment screenshot are required for
                verification.
              </li>
              <li>
                Purchases are final upon admin approval — see our{" "}
                <Link to="/refund" className="text-neon-cyan hover:underline">
                  Refund Policy
                </Link>{" "}
                for details.
              </li>
              <li>
                We reserve the right to reject payments that cannot be verified
                or appear fraudulent.
              </li>
            </ul>
          </Section>

          <Section title="5. Referral Program">
            <p>
              The NeoChain referral program allows eligible users to earn
              commissions by referring new customers. Program rules:
            </p>
            <ul>
              <li>
                Referral eligibility activates only after your first purchase is
                approved by admin.
              </li>
              <li>
                You earn a <strong>20% commission</strong> when a referred user
                signs up using your unique referral link and their purchase is
                approved.
              </li>
              <li>
                Commissions are credited to your wallet balance upon the
                referred user's purchase approval.
              </li>
              <li>
                Self-referrals or fraudulent referrals will result in commission
                reversal and account suspension.
              </li>
              <li>
                NeoChain reserves the right to modify or discontinue the
                referral program at any time.
              </li>
            </ul>
          </Section>

          <Section title="6. Deposits & Withdrawals">
            <p>
              Users may deposit funds into their NeoChain wallet and request
              withdrawals subject to the following:
            </p>
            <ul>
              <li>
                All deposits require a valid transaction ID and payment
                screenshot for admin verification.
              </li>
              <li>
                Withdrawal requests are processed manually and subject to admin
                approval.
              </li>
              <li>
                Withdrawal methods available: eSewa, Khalti, Paytm, PhonePe,
                Google Pay, SBI Bank, HDFC Bank.
              </li>
              <li>
                Processing times may vary; we aim to process requests within 2–5
                business days.
              </li>
              <li>
                Minimum withdrawal amounts may apply and are subject to change.
              </li>
            </ul>
          </Section>

          <Section title="7. Prohibited Activities">
            <p>The following activities are strictly prohibited on NeoChain:</p>
            <ul>
              <li>Submitting fake or edited payment screenshots.</li>
              <li>
                Creating multiple accounts to exploit referral commissions.
              </li>
              <li>
                Using automated bots or scripts to interact with the platform.
              </li>
              <li>
                Attempting to reverse-engineer or exploit the platform's
                codebase.
              </li>
              <li>
                Engaging in any form of money laundering or financial fraud.
              </li>
            </ul>
            <p>
              Violations will result in immediate account suspension and
              potential legal action.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              NeoChain and its operators are not liable for any indirect,
              incidental, special, consequential, or punitive damages arising
              from your use of the service. We do not guarantee uninterrupted
              access, and may perform maintenance or updates that temporarily
              affect availability. Our total liability to you for any claim
              shall not exceed the total amount you paid to NeoChain in the 30
              days preceding the claim.
            </p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>
              We reserve the right to modify these Terms & Conditions at any
              time. Changes will be indicated by updating the "Last updated"
              date at the top of this page. Continued use of the platform after
              changes are posted constitutes your acceptance of the revised
              terms. We encourage you to review these terms periodically.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              If you have questions about these Terms & Conditions, please
              contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong> support@neochain.store
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
            to="/privacy"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="terms.link"
          >
            Privacy Policy
          </Link>
          <Link
            to="/refund"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="terms.link"
          >
            Refund Policy
          </Link>
          <Link
            to="/"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="terms.link"
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
