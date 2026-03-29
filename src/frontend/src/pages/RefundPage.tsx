import { Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-neon-cyan transition-colors mb-8"
          data-ocid="refund.link"
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
                  "linear-gradient(135deg, oklch(0.65 0.22 30), oklch(0.52 0.22 280))",
                boxShadow: "0 0 20px rgba(255, 120, 50, 0.4)",
              }}
            >
              <RefreshCw className="w-5 h-5 text-white" />
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
              Refund Policy
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

        {/* Important notice banner */}
        <div
          className="mb-10 p-5 rounded-xl"
          style={{
            background: "rgba(255, 90, 50, 0.08)",
            border: "1px solid rgba(255, 90, 50, 0.3)",
            boxShadow: "0 0 20px rgba(255, 90, 50, 0.1)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "oklch(0.75 0.18 30)" }}
          >
            ⚠️ Important: All sales of digital products on NeoChain are final.
            Please read this policy carefully before making a purchase.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10">
          <Section title="1. No Refund Policy (Digital Goods)">
            <p>
              NeoChain sells digital products and plans. Due to the nature of
              digital goods — which are delivered and activated immediately upon
              admin approval —{" "}
              <strong>all purchases are final and non-refundable</strong> once
              the payment has been submitted and approved by our admin team.
            </p>
            <p>This policy applies to all plan purchases, including:</p>
            <ul>
              <li>Basic Plan (₹1,500)</li>
              <li>Standard Plan (₹3,000)</li>
              <li>Premium Plan (₹5,000)</li>
              <li>Enterprise Plan (₹8,000)</li>
            </ul>
            <p>
              Once your transaction is approved and your account is credited,
              the purchase cannot be reversed or refunded.
            </p>
          </Section>

          <Section title="2. Exceptions">
            <p>
              We may consider refund requests only under the following
              exceptional circumstances:
            </p>
            <ul>
              <li>
                <strong>Duplicate Payment:</strong> You were charged twice for
                the same order due to a technical error. Proof of double
                deduction from your payment provider is required.
              </li>
              <li>
                <strong>Payment Not Credited:</strong> Your payment was deducted
                from your account but was never approved or credited within 7
                business days, despite providing a valid transaction ID and
                screenshot.
              </li>
              <li>
                <strong>Fraud / Unauthorized Transaction:</strong> You can
                demonstrate that the transaction was made without your
                authorization, supported by a report to your payment provider.
              </li>
            </ul>
            <p>
              Exception requests must be submitted within{" "}
              <strong>48 hours</strong> of the transaction date. Requests made
              after this window will not be considered.
            </p>
          </Section>

          <Section title="3. Pending Payments">
            <p>
              Payments submitted but not yet approved by our admin remain in a
              pending state. You may contact support to cancel a{" "}
              <strong>pending (unapproved)</strong> transaction before it is
              reviewed. Once approved, it cannot be reversed.
            </p>
          </Section>

          <Section title="4. Deposit & Withdrawal Policy">
            <p>For wallet deposits and withdrawals:</p>
            <ul>
              <li>
                Deposits are credited to your NeoChain wallet balance upon admin
                approval.
              </li>
              <li>
                Withdrawal requests that have been approved and processed cannot
                be reversed.
              </li>
              <li>
                If a withdrawal is rejected, the amount is returned to your
                wallet balance automatically.
              </li>
            </ul>
          </Section>

          <Section title="5. Contact for Disputes">
            <p>
              If you believe you qualify for a refund under the exceptions
              above, or wish to dispute a transaction, please contact us with
              the following information:
            </p>
            <ul>
              <li>Your registered username or User ID.</li>
              <li>Transaction ID and date.</li>
              <li>Payment method used.</li>
              <li>
                Description of the issue with supporting evidence (screenshots,
                bank statements).
              </li>
            </ul>
            <p>
              <strong>Email:</strong> support@neochain.store
            </p>
            <p>
              We will review your case and respond within 3–5 business days.
            </p>
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
            data-ocid="refund.link"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="refund.link"
          >
            Terms & Conditions
          </Link>
          <Link
            to="/"
            className="hover:text-neon-cyan transition-colors"
            data-ocid="refund.link"
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
