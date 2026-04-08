import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Gift, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { setPageMeta } from "../utils/seo";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function RegisterPage() {
  const { login, isLoggingIn, identity, isInitializing } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [step, setStep] = useState<"connect" | "profile">("connect");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "Register - NeoChain Digital Store",
      description:
        "Create a free NeoChain Digital Store account and start earning through referral commissions and daily rewards.",
      canonical: "https://neochain-digital-store-x9x.caffeine.xyz/register",
    });
    // Pre-fill referral from URL param
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  // When identity arrives and actor is ready, show profile step
  useEffect(() => {
    if (!isInitializing && identity && !isFetching && actor) {
      // Check if already registered
      actor
        .getCallerUserProfile()
        .then((profile) => {
          if (profile !== null) {
            // Already registered — redirect to dashboard
            navigate({ to: "/dashboard" });
          } else {
            setStep("profile");
          }
        })
        .catch(() => setStep("profile"));
    } else if (!isInitializing && !identity) {
      setStep("connect");
    }
  }, [identity, isInitializing, actor, isFetching, navigate]);

  const validateUsername = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "Username is required";
    if (trimmed.length < 3) return "Minimum 3 characters required";
    if (trimmed.length > 30) return "Maximum 30 characters allowed";
    if (!USERNAME_REGEX.test(trimmed))
      return "Only letters, numbers and underscore allowed";
    return "";
  };

  const validateReferral = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    if (!/^[a-zA-Z0-9]+$/.test(trimmed))
      return "Only letters and numbers allowed";
    if (trimmed.length !== 8)
      return "Referral code must be exactly 8 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;

    const uErr = validateUsername(username);
    const rErr = validateReferral(referralCode);
    setUsernameError(uErr);
    setReferralError(rErr);
    if (uErr || rErr) return;

    setIsLoading(true);
    try {
      const profile = await actor.registerUser(
        username.trim(),
        referralCode.trim() || null,
      );
      toast.success(`Welcome to NeoChain, ${profile.username}!`);
      setRegistered(true);
      setTimeout(() => navigate({ to: "/dashboard" }), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.toLowerCase().includes("already registered") ||
        msg.toLowerCase().includes("already exists")
      ) {
        toast.error("Account already registered. Please login instead.");
      } else if (msg.toLowerCase().includes("username")) {
        toast.error("Username already taken. Please choose another.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ paddingTop: "80px" }}
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Register - NeoChain Digital Store",
            url: "https://neochain-digital-store-x9x.caffeine.xyz/register",
            description: "Create a new account on NeoChain Digital Store",
          }),
        }}
      />

      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-cyan-400 transition-colors mb-8"
          data-ocid="register.link"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div
          className="neon-card p-8"
          style={{
            boxShadow:
              "0 0 60px rgba(123, 77, 255, 0.18), 0 0 120px rgba(38, 214, 255, 0.08)",
          }}
        >
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(123, 77, 255, 0.2), rgba(201, 60, 255, 0.2))",
                border: "1px solid rgba(123, 77, 255, 0.4)",
                boxShadow: "0 0 30px rgba(123, 77, 255, 0.25)",
              }}
            >
              <UserPlus className="w-7 h-7 neon-text-violet" />
            </div>
            <h1 className="font-display font-black text-2xl gradient-text">
              Create Account
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Join NeoChain Digital Store and start earning
            </p>
          </div>

          {registered ? (
            <div
              className="text-center py-6"
              data-ocid="register.success_state"
            >
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-green-400 font-semibold">Account Created!</p>
              <p className="text-muted-foreground text-sm mt-1">
                Redirecting to your dashboard...
              </p>
            </div>
          ) : step === "connect" ? (
            <div className="space-y-4">
              <div
                className="rounded-xl p-4 text-sm text-muted-foreground"
                style={{
                  background: "rgba(123, 77, 255, 0.06)",
                  border: "1px solid rgba(123, 77, 255, 0.15)",
                }}
              >
                <p className="font-medium text-purple-400 mb-1">
                  Step 1 of 2 — Connect Your Identity
                </p>
                <p>
                  NeoChain uses Internet Identity for secure, password-free
                  accounts. Click below to connect.
                </p>
              </div>

              <button
                type="button"
                onClick={login}
                disabled={isLoggingIn}
                className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
                data-ocid="register.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Connect &amp; Register
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div
                className="rounded-xl p-3 text-xs text-muted-foreground"
                style={{
                  background: "rgba(38, 214, 255, 0.05)",
                  border: "1px solid rgba(38, 214, 255, 0.15)",
                }}
              >
                Step 2 of 2 — Set your profile
              </div>

              <div>
                <label
                  htmlFor="reg-username"
                  className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
                >
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  className={`neon-input w-full px-4 py-3 ${
                    usernameError ? "border-red-500/50" : ""
                  }`}
                  placeholder="Enter your username (3–30 chars)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError)
                      setUsernameError(validateUsername(e.target.value));
                  }}
                  autoComplete="username"
                  data-ocid="register.input"
                />
                {usernameError && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.65 0.2 27)" }}
                    data-ocid="register.error_state"
                  >
                    {usernameError}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-referral"
                  className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
                >
                  <span className="flex items-center gap-2">
                    <Gift className="w-3 h-3 text-neon-magenta" />
                    Referral Code
                    <span className="text-xs font-normal">(optional)</span>
                  </span>
                </label>
                <input
                  id="reg-referral"
                  type="text"
                  className={`neon-input w-full px-4 py-3 ${
                    referralError ? "border-red-500/50" : ""
                  }`}
                  placeholder="Enter referral code (8 chars)"
                  value={referralCode}
                  onChange={(e) => {
                    setReferralCode(e.target.value);
                    if (referralError)
                      setReferralError(validateReferral(e.target.value));
                  }}
                  data-ocid="register.input"
                />
                {referralError && (
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "oklch(0.65 0.2 27)" }}
                    data-ocid="register.error_state"
                  >
                    {referralError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
                data-ocid="register.submit_button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          )}

          <div
            className="mt-6 pt-6 text-center text-sm text-muted-foreground"
            style={{ borderTop: "1px solid rgba(123,77,255,0.15)" }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              data-ocid="register.link"
            >
              Sign in here
            </Link>
          </div>
        </div>

        <nav
          className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground"
          aria-label="Quick navigation"
        >
          <Link
            to="/"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="register.link"
          >
            Home
          </Link>
          <Link
            to="/products"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="register.link"
          >
            Products
          </Link>
          <Link
            to="/mobile-apps"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="register.link"
          >
            Mobile Apps
          </Link>
          <Link
            to="/contact"
            className="hover:text-cyan-400 transition-colors"
            data-ocid="register.link"
          >
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}
