import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Gift,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { setPageMeta } from "../utils/seo";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Earn on the Go",
    desc: "Track your balance, commissions, and earnings from anywhere on your mobile browser.",
    color: "cyan",
  },
  {
    icon: RefreshCw,
    title: "Daily Spin Wheel",
    desc: "Spin the NeoChain reward wheel daily to earn ₹30–₹100 bonuses from your mobile.",
    color: "violet",
  },
  {
    icon: Gift,
    title: "Referral Sharing",
    desc: "Share your referral link via WhatsApp, Telegram, and other apps directly from mobile.",
    color: "magenta",
  },
  {
    icon: Zap,
    title: "Fast Withdrawals",
    desc: "Submit withdrawal requests and track payment status instantly from your phone.",
    color: "cyan",
  },
  {
    icon: Wifi,
    title: "Always Connected",
    desc: "Real-time balance updates and transaction notifications on mobile browser.",
    color: "violet",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized UI",
    desc: "NeoChain Digital Store is fully responsive — every feature works perfectly on mobile.",
    color: "magenta",
  },
];

const GLOW: Record<string, string> = {
  cyan: "rgba(38,214,255,0.25)",
  violet: "rgba(123,77,255,0.25)",
  magenta: "rgba(201,60,255,0.25)",
};

const TEXT_CLASS: Record<string, string> = {
  cyan: "neon-text-cyan",
  violet: "neon-text-violet",
  magenta: "neon-text-magenta",
};

export default function MobileAppsPage() {
  useEffect(() => {
    setPageMeta({
      title: "Mobile Applications - NeoChain Digital Store",
      description:
        "Access NeoChain Digital Store on mobile. Earn daily income, spin the reward wheel, and manage referrals from any device.",
      canonical: "https://neochain-digital-store-x9x.caffeine.xyz/mobile-apps",
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
            name: "Mobile Applications - NeoChain Digital Store",
            url: "https://neochain-digital-store-x9x.caffeine.xyz/mobile-apps",
            description:
              "Access NeoChain Digital Store on your mobile browser. Earn, spin, and withdraw on Android and iOS.",
          }),
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-8"
          data-ocid="mobile.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <section className="text-center mb-16">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(38,214,255,0.2), rgba(123,77,255,0.2))",
              border: "1px solid rgba(38,214,255,0.3)",
              boxShadow: "0 0 50px rgba(38,214,255,0.2)",
            }}
          >
            <Smartphone className="w-12 h-12 neon-text-cyan" />
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl gradient-text mb-4">
            NeoChain on Mobile
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Access the full NeoChain Digital Store experience from your Android
            or iOS device. No app download needed — open in your mobile browser
            and start earning instantly.
          </p>
        </section>

        {/* Available On */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-center neon-text-cyan mb-8">
            Available On
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: "Android",
                icon: "🤖",
                desc: "Open NeoChain in Chrome, Firefox, or any Android browser for the full experience.",
                badge: "Mobile Browser",
              },
              {
                title: "iOS (iPhone/iPad)",
                icon: "🍎",
                desc: "Access NeoChain Digital Store on Safari or Chrome on your iPhone or iPad.",
                badge: "Mobile Browser",
              },
              {
                title: "PWA Install",
                icon: "📲",
                desc: 'Add NeoChain to your home screen: tap the browser menu → "Add to Home Screen" for app-like access.',
                badge: "Install to Home",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="neon-card p-6 text-center"
                style={{
                  border: "1px solid rgba(38,214,255,0.2)",
                  boxShadow: "0 0 20px rgba(38,214,255,0.08)",
                }}
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-display font-bold text-lg neon-text-cyan mb-2">
                  {item.title}
                </h3>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3"
                  style={{
                    background: "rgba(38,214,255,0.1)",
                    border: "1px solid rgba(38,214,255,0.25)",
                    color: "oklch(0.82 0.18 210)",
                  }}
                >
                  {item.badge}
                </span>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="font-display font-bold text-2xl text-center gradient-text mb-8">
            Mobile Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="neon-card p-5"
                  style={{
                    border: `1px solid ${GLOW[feature.color]}`,
                    boxShadow: `0 0 16px ${GLOW[feature.color]}`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: GLOW[feature.color] }}
                    >
                      <Icon
                        className={`w-4 h-4 ${TEXT_CLASS[feature.color]}`}
                      />
                    </div>
                    <h3
                      className={`font-display font-bold text-sm ${TEXT_CLASS[feature.color]}`}
                    >
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section
          className="neon-card p-8 text-center mb-12"
          style={{
            border: "1px solid rgba(38,214,255,0.25)",
            boxShadow: "0 0 40px rgba(38,214,255,0.12)",
          }}
        >
          <h2 className="font-display font-black text-2xl gradient-text mb-3">
            Start Earning on Mobile Now
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            NeoChain Digital Store works perfectly on all mobile devices. Open
            it in your browser and start earning today — no app download
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/"
              className="neon-btn-primary px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              data-ocid="mobile.primary_button"
            >
              <ExternalLink className="w-4 h-4" />
              Open NeoChain Store
            </a>
            <Link
              to="/register"
              className="neon-btn px-6 py-3 text-sm font-semibold flex items-center justify-center gap-2"
              data-ocid="mobile.link"
            >
              <Download className="w-4 h-4" />
              Create Free Account
            </Link>
          </div>
        </section>

        {/* PWA Instructions */}
        <section className="mb-12">
          <h2 className="font-display font-bold text-xl neon-text-violet mb-4">
            How to Install as App (PWA)
          </h2>
          <div className="space-y-3">
            {[
              {
                step: 1,
                text: "Open NeoChain Digital Store in your mobile browser (Chrome or Safari)",
                os: "Android & iOS",
              },
              {
                step: 2,
                text: "Tap the browser menu (three dots or share icon)",
                os: "Android & iOS",
              },
              {
                step: 3,
                text: 'Select "Add to Home Screen" or "Install App"',
                os: "Android & iOS",
              },
              {
                step: 4,
                text: "Confirm installation — NeoChain will appear on your home screen like a native app",
                os: "Android & iOS",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-4 neon-card p-4"
                style={{ border: "1px solid rgba(123,77,255,0.15)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-black text-sm neon-text-violet"
                  style={{
                    background: "rgba(123,77,255,0.15)",
                    border: "1px solid rgba(123,77,255,0.3)",
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.os}
                  </p>
                </div>
              </div>
            ))}
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
            data-ocid="mobile.link"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="mobile.link"
          >
            Products
          </Link>
          <Link
            to="/register"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="mobile.link"
          >
            Register
          </Link>
          <Link
            to="/contact"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="mobile.link"
          >
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
