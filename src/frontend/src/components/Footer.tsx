import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  const supportEmail = (() => {
    try {
      const saved = localStorage.getItem("siteSettings");
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.email) return settings.email;
      }
    } catch {}
    return "sandeepkarna71@gmail.com";
  })();

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
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/assets/generated/neochain-logo-transparent.dim_200x200.png"
                alt="NeoChain Logo"
                className="w-7 h-7 rounded-lg object-cover"
                style={{ boxShadow: "0 0 15px rgba(38, 214, 255, 0.4)" }}
              />
              <span className="font-display font-black text-lg tracking-widest">
                <span className="neon-text-cyan">NEO</span>
                <span>CHAIN</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              NeoChain Digital Store — your trusted platform for digital earning
              through referral commissions and daily rewards.
            </p>
          </div>

          {/* Quick Links — SEO critical for sitelinks */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/"
                  className="hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-foreground transition-colors"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-foreground transition-colors"
                >
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-foreground transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  to="/mobile-apps"
                  className="hover:text-foreground transition-colors"
                >
                  Mobile Apps
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/sitemap"
                  className="hover:text-foreground transition-colors"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Products
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/products"
                  className="hover:text-foreground transition-colors"
                >
                  Starter Pack (₹1500)
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-foreground transition-colors"
                >
                  Growth Pack (₹3000)
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-foreground transition-colors"
                >
                  Pro Pack (₹5000)
                </Link>
              </li>
              <li>
                <Link
                  to="/products"
                  className="hover:text-foreground transition-colors"
                >
                  Elite Pack (₹8000)
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/contact"
                  className="hover:text-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${supportEmail}`}
                  className="hover:text-foreground transition-colors"
                >
                  Email Support
                </a>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/mobile-apps"
                  className="hover:text-foreground transition-colors"
                >
                  Mobile Apps
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-widest text-neon-cyan mb-4">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="hover:text-foreground transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-foreground transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground"
          style={{ borderTop: "1px solid rgba(123, 77, 255, 0.15)" }}
        >
          <span>
            &copy; {year} NeoChain Digital Store. All rights reserved.
          </span>
          <nav className="flex flex-wrap gap-4" aria-label="Site navigation">
            <Link to="/" className="hover:text-cyan-400 transition-colors">
              Home
            </Link>
            <Link to="/login" className="hover:text-cyan-400 transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="hover:text-cyan-400 transition-colors"
            >
              Register
            </Link>
            <Link
              to="/products"
              className="hover:text-cyan-400 transition-colors"
            >
              Products
            </Link>
            <Link
              to="/mobile-apps"
              className="hover:text-cyan-400 transition-colors"
            >
              Mobile Apps
            </Link>
            <Link
              to="/contact"
              className="hover:text-cyan-400 transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/sitemap"
              className="hover:text-cyan-400 transition-colors"
            >
              Sitemap
            </Link>
          </nav>
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
