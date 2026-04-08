import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  HelpCircle,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";
import { setPageMeta } from "../utils/seo";

const FAQS = [
  {
    q: "How do I join NeoChain Digital Store?",
    a: "Simply register a free account on our platform, choose a plan that suits your budget, and start earning referral commissions immediately.",
  },
  {
    q: "How do I earn on NeoChain?",
    a: "You earn by referring new users to NeoChain Digital Store. When your referred user purchases a plan, you receive a commission (15–20% depending on your plan).",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Go to Wallet → Withdraw in the navigation. Select your payment method (UPI, Paytm, PhonePe, etc.), enter your details, and submit. Withdrawals are processed within 24–48 hours.",
  },
  {
    q: "Is NeoChain Digital Store safe?",
    a: "Yes. NeoChain uses secure Internet Identity authentication and device fingerprinting to protect all accounts. Your data and earnings are fully secured.",
  },
  {
    q: "What is the minimum withdrawal amount?",
    a: "The minimum withdrawal amount varies by payment method. A 12% processing fee applies to all withdrawals.",
  },
];

function getSiteEmail() {
  try {
    const saved = localStorage.getItem("siteSettings");
    if (saved) {
      const s = JSON.parse(saved);
      if (s.email) return s.email;
    }
  } catch {}
  return "sandeepkarna71@gmail.com";
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({ name: "", email: "", message: "" });
  const siteEmail = getSiteEmail();

  useEffect(() => {
    setPageMeta({
      title: "Contact - NeoChain Digital Store",
      description:
        "Contact NeoChain Digital Store support. Get help with your account, payments, withdrawals, and earning plans.",
      canonical: "https://neochain-digital-store-x9x.caffeine.xyz/contact",
    });
  }, []);

  const validate = () => {
    const errs = { name: "", email: "", message: "" };
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      errs.email = "Enter a valid email";
    if (!form.message.trim()) errs.message = "Message is required";
    else if (form.message.trim().length < 10)
      errs.message = "Message must be at least 10 characters";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ paddingTop: "60px" }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "Contact - NeoChain Digital Store",
            url: "https://neochain-digital-store-x9x.caffeine.xyz/contact",
            description: "Contact NeoChain Digital Store support team.",
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-8"
          data-ocid="contact.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text mb-4">
            Contact NeoChain Digital Store
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Need help? Our support team is ready to assist you. Reach out via
            the form below or use the AI support chat on this page.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Contact Info */}
          <div className="space-y-4">
            <div
              className="neon-card p-6"
              style={{ border: "1px solid rgba(38,214,255,0.2)" }}
            >
              <h2 className="font-display font-bold text-lg neon-text-cyan mb-4">
                Get In Touch
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 neon-text-cyan mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Email Support
                    </p>
                    <a
                      href={`mailto:${siteEmail}`}
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      data-ocid="contact.link"
                    >
                      {siteEmail}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 neon-text-violet mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Support Hours
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Monday – Saturday, 10:00 AM – 8:00 PM IST
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 neon-text-magenta mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Live Chat Support
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Use the <span className="text-cyan-400">💬 Support</span>{" "}
                      button at the bottom-right of this page for instant
                      AI-powered help.
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* FAQ Quick Links */}
            <div
              className="neon-card p-6"
              style={{ border: "1px solid rgba(123,77,255,0.2)" }}
            >
              <h2 className="font-display font-bold text-lg neon-text-violet mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </h2>
              <ul className="space-y-3">
                {FAQS.map((faq) => (
                  <li key={faq.q}>
                    <details className="group">
                      <summary className="text-sm font-medium text-foreground cursor-pointer list-none flex items-center justify-between gap-2 hover:text-cyan-400 transition-colors">
                        {faq.q}
                        <span className="text-muted-foreground group-open:rotate-180 transition-transform shrink-0">
                          ▾
                        </span>
                      </summary>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed pl-1">
                        {faq.a}
                      </p>
                    </details>
                    <div
                      className="mt-2"
                      style={{ borderBottom: "1px solid rgba(123,77,255,0.1)" }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <div
              className="neon-card p-6"
              style={{ border: "1px solid rgba(201,60,255,0.2)" }}
            >
              <h2 className="font-display font-bold text-lg neon-text-magenta mb-6">
                Send a Message
              </h2>

              {submitted ? (
                <div
                  className="text-center py-8"
                  data-ocid="contact.success_state"
                >
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="font-semibold text-green-400 text-lg">
                    Message Sent!
                  </p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Your message has been sent. We&apos;ll respond within 24
                    hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: "", email: "", message: "" });
                    }}
                    className="mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                    data-ocid="contact.secondary_button"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  data-ocid="contact.panel"
                >
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      className={`neon-input w-full px-4 py-3 ${
                        errors.name ? "border-red-500/50" : ""
                      }`}
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      data-ocid="contact.input"
                    />
                    {errors.name && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "oklch(0.65 0.2 27)" }}
                        data-ocid="contact.error_state"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      className={`neon-input w-full px-4 py-3 ${
                        errors.email ? "border-red-500/50" : ""
                      }`}
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      data-ocid="contact.input"
                    />
                    {errors.email && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "oklch(0.65 0.2 27)" }}
                        data-ocid="contact.error_state"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      className={`neon-input w-full px-4 py-3 resize-none ${
                        errors.message ? "border-red-500/50" : ""
                      }`}
                      placeholder="Describe your issue or question in detail..."
                      value={form.message}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, message: e.target.value }))
                      }
                      data-ocid="contact.textarea"
                    />
                    {errors.message && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "oklch(0.65 0.2 27)" }}
                        data-ocid="contact.error_state"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
                    data-ocid="contact.submit_button"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Internal navigation */}
        <nav
          className="flex flex-wrap gap-4 text-sm text-muted-foreground"
          aria-label="Related pages"
        >
          <Link
            to="/"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="contact.link"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="contact.link"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="contact.link"
          >
            Register
          </Link>
          <Link
            to="/products"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="contact.link"
          >
            Products
          </Link>
          <Link
            to="/mobile-apps"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="contact.link"
          >
            Mobile Apps
          </Link>
        </nav>
      </div>
    </div>
  );
}
