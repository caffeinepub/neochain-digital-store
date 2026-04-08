import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import { setPageMeta } from "../utils/seo";

const PLANS = [
  {
    id: 1,
    name: "Starter Pack",
    price: 1500,
    commission: 20,
    color: "cyan",
    badge: "Most Popular",
    benefits: [
      "₹1500 one-time investment",
      "20% referral commission per referral",
      "Daily earning potential from referrals",
      "Fast approval within 24 hours",
      "Access to NeoChain earning dashboard",
    ],
    description:
      "Start your NeoChain Digital Store earning journey. Perfect for beginners who want to earn referral commissions with a low initial investment.",
  },
  {
    id: 2,
    name: "Growth Pack",
    price: 3000,
    commission: 20,
    color: "violet",
    badge: "Best Value",
    benefits: [
      "₹3000 one-time investment",
      "20% referral commission per referral",
      "Higher earning potential vs Starter",
      "Priority plan activation",
      "Referral link with tracking",
    ],
    description:
      "Accelerate your income on the NeoChain earning platform. Higher investment means more credibility and more referral earnings per recruit.",
  },
  {
    id: 3,
    name: "Pro Pack",
    price: 5000,
    commission: 17,
    color: "magenta",
    badge: "High Earner",
    benefits: [
      "₹5000 one-time investment",
      "17% referral commission per referral",
      "Premium earning benefits",
      "Dedicated support access",
      "Trusted by thousands of earners",
    ],
    description:
      "Maximize your earning potential on NeoChain Digital Store. Ideal for serious earners who want to build a strong referral network.",
  },
  {
    id: 4,
    name: "Elite Pack",
    price: 8000,
    commission: 15,
    color: "cyan",
    badge: "Top Tier",
    benefits: [
      "₹8000 one-time investment",
      "15% referral commission per referral",
      "Maximum plan credibility",
      "Priority approval process",
      "Long-term earning sustainability",
    ],
    description:
      "The top-tier NeoChain Digital Store plan for serious digital entrepreneurs building long-term passive income through referrals.",
  },
];

const GLOW: Record<string, string> = {
  cyan: "rgba(38,214,255,0.3)",
  violet: "rgba(123,77,255,0.3)",
  magenta: "rgba(201,60,255,0.3)",
};

const BORDER: Record<string, string> = {
  cyan: "rgba(38,214,255,0.25)",
  violet: "rgba(123,77,255,0.25)",
  magenta: "rgba(201,60,255,0.25)",
};

const TEXT_CLASS: Record<string, string> = {
  cyan: "neon-text-cyan",
  violet: "neon-text-violet",
  magenta: "neon-text-magenta",
};

const BADGE_STYLE: Record<string, React.CSSProperties> = {
  cyan: {
    background: "rgba(38,214,255,0.15)",
    color: "oklch(0.82 0.18 210)",
    border: "1px solid rgba(38,214,255,0.3)",
  },
  violet: {
    background: "rgba(123,77,255,0.15)",
    color: "oklch(0.68 0.22 280)",
    border: "1px solid rgba(123,77,255,0.3)",
  },
  magenta: {
    background: "rgba(201,60,255,0.15)",
    color: "oklch(0.72 0.22 305)",
    border: "1px solid rgba(201,60,255,0.3)",
  },
};

export default function ProductsPage() {
  useEffect(() => {
    setPageMeta({
      title: "Products - NeoChain Digital Store",
      description:
        "Browse NeoChain Digital Store earning plans. Choose from Starter, Growth, Pro, and Elite packs and earn 15-20% referral commissions.",
      canonical: "https://neochain-digital-store-x9x.caffeine.xyz/products",
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ paddingTop: "60px" }}>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Products - NeoChain Digital Store",
            url: "https://neochain-digital-store-x9x.caffeine.xyz/products",
            description:
              "Browse NeoChain Digital Store plans. Earn referral commissions with plans starting at ₹1500.",
          }),
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-8"
          data-ocid="products.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{
              background: "rgba(38,214,255,0.1)",
              border: "1px solid rgba(38,214,255,0.25)",
              color: "oklch(0.82 0.18 210)",
            }}
          >
            <Star className="w-3 h-3" />
            NeoChain Digital Store Plans
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text mb-4">
            Our Digital Earning Plans
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the right NeoChain Digital Store plan for your earning goals.
            Every plan comes with referral commission earnings and access to our
            neochain earning platform. Start earning online with NeoChain today.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PLANS.map((plan) => (
            <article
              key={plan.id}
              className="neon-card p-6 flex flex-col"
              style={{
                border: `1px solid ${BORDER[plan.color]}`,
                boxShadow: `0 0 30px ${GLOW[plan.color]}`,
              }}
              data-ocid="products.card"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={BADGE_STYLE[plan.color]}
                >
                  {plan.badge}
                </span>
                <TrendingUp className={`w-5 h-5 ${TEXT_CLASS[plan.color]}`} />
              </div>

              <h2
                className={`font-display font-black text-xl mb-1 ${TEXT_CLASS[plan.color]}`}
              >
                {plan.name}
              </h2>

              <div className="mb-3">
                <span className="font-display font-black text-3xl text-foreground">
                  ₹{plan.price.toLocaleString("en-IN")}
                </span>
                <span className="text-muted-foreground text-xs ml-2">
                  one-time
                </span>
              </div>

              <div
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-4 self-start"
                style={{
                  background: "rgba(72,200,90,0.12)",
                  border: "1px solid rgba(72,200,90,0.3)",
                  color: "oklch(0.72 0.17 145)",
                }}
              >
                {plan.commission}% Referral Commission
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed mb-4 flex-1">
                {plan.description}
              </p>

              <ul className="space-y-2 mb-6">
                {plan.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-xs">
                    <CheckCircle
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${TEXT_CLASS[plan.color]}`}
                    />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="neon-btn-primary w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                data-ocid="products.primary_button"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </article>
          ))}
        </div>

        {/* SEO Text Section */}
        <section
          className="neon-card p-8 mb-12"
          style={{ border: "1px solid rgba(123,77,255,0.2)" }}
        >
          <h2 className="font-display font-bold text-xl neon-text-cyan mb-4">
            Why Choose NeoChain Digital Store?
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            NeoChain Digital Store is a trusted digital earning platform where
            you can invest in digital plans and earn money online through our
            referral system. Our neochain earning platform offers four carefully
            designed plans to match your investment capacity and earning goals.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            With plans starting at just ₹1500, even beginners can start earning
            referral commissions on the NeoChain Digital Store. Each time you
            successfully refer a new member who purchases a plan, you earn a
            commission directly to your NeoChain wallet.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <Link
              to="/register"
              className="neon-btn-primary px-6 py-2.5 text-sm font-semibold flex items-center gap-2"
              data-ocid="products.primary_button"
            >
              Register Now
            </Link>
            <Link
              to="/contact"
              className="neon-btn px-6 py-2.5 text-sm font-semibold"
              data-ocid="products.link"
            >
              Contact Support
            </Link>
          </div>
        </section>

        {/* Internal navigation */}
        <nav
          className="flex flex-wrap gap-4 text-sm text-muted-foreground"
          aria-label="Related pages"
        >
          <Link
            to="/"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="products.link"
          >
            Home
          </Link>
          <Link
            to="/login"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="products.link"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="products.link"
          >
            Register
          </Link>
          <Link
            to="/mobile-apps"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="products.link"
          >
            Mobile Apps
          </Link>
          <Link
            to="/contact"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="products.link"
          >
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
