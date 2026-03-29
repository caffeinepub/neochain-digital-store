import { Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer
      className="mt-20 border-t"
      style={{
        borderColor: "rgba(123, 77, 255, 0.2)",
        background: "rgba(7, 8, 26, 0.8)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-black text-xs"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 210), oklch(0.52 0.22 280))",
                  boxShadow: "0 0 15px rgba(38, 214, 255, 0.4)",
                }}
              >
                N
              </div>
              <span className="font-display font-black text-lg tracking-widest">
                <span className="neon-text-cyan">NEO</span>
                <span>CHAIN</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The future of digital commerce. Secure, fast, and decentralized.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Products
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/#products"
                  className="hover:text-foreground transition-colors"
                >
                  Basic Plan
                </a>
              </li>
              <li>
                <a
                  href="/#products"
                  className="hover:text-foreground transition-colors"
                >
                  Standard Plan
                </a>
              </li>
              <li>
                <a
                  href="/#products"
                  className="hover:text-foreground transition-colors"
                >
                  Premium Plan
                </a>
              </li>
              <li>
                <a
                  href="/#products"
                  className="hover:text-foreground transition-colors"
                >
                  Enterprise Plan
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/dashboard"
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/#support"
                  className="hover:text-foreground transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/#support"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/#support"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="/#support"
                  className="hover:text-foreground transition-colors"
                >
                  Status
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"
          style={{ borderTop: "1px solid rgba(123, 77, 255, 0.15)" }}
        >
          <span>© {year} NeoChain Digital Store. All rights reserved.</span>
          <a
            href={caffeineLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-neon-cyan transition-colors"
          >
            Built with <Zap className="w-3 h-3 text-neon-cyan" /> using
            caffeine.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
