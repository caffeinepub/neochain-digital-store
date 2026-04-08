import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { setPageMeta } from "../utils/seo";

export default function LoginPage() {
  const { login, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Login - NeoChain Digital Store",
      description:
        "Sign in to your NeoChain Digital Store account and access your dashboard, earnings, and referral system.",
      canonical: "https://neochain-digital-store-x9x.caffeine.xyz/login",
    });
  }, []);

  useEffect(() => {
    if (!isInitializing && identity) {
      navigate({ to: "/" });
    }
  }, [identity, isInitializing, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ paddingTop: "80px" }}
    >
      {/* JSON-LD for this page */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Login - NeoChain Digital Store",
            url: "https://neochain-digital-store-x9x.caffeine.xyz/login",
            description: "Login to your NeoChain Digital Store account",
          }),
        }}
      />

      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-8"
          data-ocid="login.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div
          className="neon-card p-8"
          style={{
            boxShadow:
              "0 0 60px rgba(38, 214, 255, 0.15), 0 0 120px rgba(123, 77, 255, 0.08)",
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(38, 214, 255, 0.2), rgba(123, 77, 255, 0.2))",
                border: "1px solid rgba(38, 214, 255, 0.4)",
                boxShadow: "0 0 30px rgba(38, 214, 255, 0.25)",
              }}
            >
              <LogIn className="w-7 h-7 neon-text-cyan" />
            </div>
            <h1 className="font-display font-black text-2xl gradient-text">
              Welcome Back
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sign in to your NeoChain Digital Store account
            </p>
          </div>

          {/* Login via Internet Identity */}
          <div className="space-y-4">
            <div
              className="rounded-xl p-4 text-sm text-muted-foreground"
              style={{
                background: "rgba(38, 214, 255, 0.06)",
                border: "1px solid rgba(38, 214, 255, 0.15)",
              }}
            >
              <p className="font-medium text-cyan-400 mb-1">Secure Login</p>
              <p>
                NeoChain uses Internet Identity — a secure, password-free
                authentication system. No password to remember or lose.
              </p>
            </div>

            <div>
              <label
                htmlFor="login-email-hint"
                className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
              >
                Username / Email
              </label>
              <div className="relative">
                <input
                  id="login-email-hint"
                  type="text"
                  className="neon-input w-full px-4 py-3"
                  placeholder="Enter your username or email"
                  readOnly
                  style={{ cursor: "not-allowed", opacity: 0.6 }}
                  data-ocid="login.input"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password-hint"
                className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password-hint"
                  type={showPass ? "text" : "password"}
                  className="neon-input w-full px-4 py-3 pr-12"
                  placeholder="Secured via Internet Identity"
                  readOnly
                  style={{ cursor: "not-allowed", opacity: 0.6 }}
                  data-ocid="login.input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-cyan-400 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Link
                to="/"
                className="block text-right text-xs text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
                data-ocid="login.link"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="button"
              onClick={login}
              disabled={isLoggingIn}
              className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
              data-ocid="login.primary_button"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In to NeoChain
                </>
              )}
            </button>
          </div>

          <div
            className="mt-6 pt-6 text-center text-sm text-muted-foreground"
            style={{ borderTop: "1px solid rgba(123,77,255,0.15)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              data-ocid="login.link"
            >
              Register here
            </Link>
          </div>
        </div>

        {/* Quick nav links for SEO */}
        <nav
          className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground"
          aria-label="Quick navigation"
        >
          <Link
            to="/"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="login.link"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="login.link"
          >
            Products
          </Link>
          <Link
            to="/mobile-apps"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="login.link"
          >
            Mobile Apps
          </Link>
          <Link
            to="/contact"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="login.link"
          >
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
