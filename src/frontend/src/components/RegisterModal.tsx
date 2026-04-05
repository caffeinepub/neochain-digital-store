import { Gift, Loader2, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";
import ForgotAccessModal from "./ForgotAccessModal";

interface Props {
  actor: backendInterface;
  onRegistered: (profile: UserProfile) => void;
  onClose: () => void;
  onForgotAccess?: () => void;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const RATE_LIMIT_KEY = "neochain_reg_attempts";
const RATE_LIMIT_TIME_KEY = "neochain_reg_lockout";
const MAX_REG_ATTEMPTS = 3;
const REG_LOCKOUT_MS = 2 * 60 * 1000;

function getRegLockoutRemaining(): number {
  const lockout = localStorage.getItem(RATE_LIMIT_TIME_KEY);
  if (!lockout) return 0;
  const remaining = Number(lockout) + REG_LOCKOUT_MS - Date.now();
  return remaining > 0 ? remaining : 0;
}

export default function RegisterModal({
  actor,
  onRegistered,
  onClose,
  onForgotAccess,
}: Props) {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [referralError, setReferralError] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(
    getRegLockoutRemaining,
  );

  const isLocked = lockoutRemaining > 0;

  // Countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      const remaining = getRegLockoutRemaining();
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        localStorage.removeItem(RATE_LIMIT_TIME_KEY);
        localStorage.removeItem(RATE_LIMIT_KEY);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

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
    if (!trimmed) return ""; // optional
    if (!/^[a-zA-Z0-9]+$/.test(trimmed))
      return "Only letters and numbers allowed";
    if (trimmed.length !== 8)
      return "Referral code must be exactly 8 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

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
      localStorage.removeItem(RATE_LIMIT_KEY);
      localStorage.removeItem(RATE_LIMIT_TIME_KEY);
      toast.success(`Welcome to NeoChain, ${profile.username}!`);
      onRegistered(profile);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Only apply rate limiting for specific "already registered" or username errors
      // Not for network or server errors
      const isRateLimitableError =
        errMsg.toLowerCase().includes("already registered") ||
        errMsg.toLowerCase().includes("username") ||
        errMsg.toLowerCase().includes("already exists") ||
        errMsg.toLowerCase().includes("user already");
      if (isRateLimitableError) {
        const attempts =
          Number(localStorage.getItem(RATE_LIMIT_KEY) ?? "0") + 1;
        localStorage.setItem(RATE_LIMIT_KEY, String(attempts));
        if (attempts >= MAX_REG_ATTEMPTS) {
          localStorage.setItem(RATE_LIMIT_TIME_KEY, String(Date.now()));
          setLockoutRemaining(REG_LOCKOUT_MS);
          toast.error("Too many attempts. Please wait 2 minutes.");
          return;
        }
      }
      if (
        errMsg.toLowerCase().includes("already registered") ||
        errMsg.toLowerCase().includes("already exists")
      ) {
        toast.error(
          "This account is already registered. Please login instead.",
        );
      } else if (errMsg.toLowerCase().includes("username")) {
        toast.error("Username already taken. Please choose another.");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotAccess = () => {
    if (onForgotAccess) {
      onForgotAccess();
    } else {
      setForgotOpen(true);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(8px)",
        }}
        data-ocid="register.modal"
      >
        <div
          className="neon-card w-full max-w-md p-8 relative"
          style={{ boxShadow: "0 0 80px rgba(123, 77, 255, 0.3)" }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(123,77,255,0.2)",
            }}
            data-ocid="register.close_button"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(38, 214, 255, 0.2), rgba(123, 77, 255, 0.2))",
                border: "1px solid rgba(38, 214, 255, 0.4)",
                boxShadow: "0 0 30px rgba(38, 214, 255, 0.3)",
              }}
            >
              <User className="w-8 h-8 neon-text-cyan" />
            </div>
            <h2 className="font-display font-black text-2xl gradient-text">
              Create Your Account
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Set up your NeoChain profile to get started
            </p>
          </div>

          {isLocked && (
            <div
              className="mb-5 px-4 py-3 rounded-xl text-sm text-center"
              style={{
                background: "rgba(220,50,50,0.12)",
                border: "1px solid rgba(220,50,50,0.35)",
                color: "oklch(0.7 0.2 27)",
              }}
              data-ocid="register.error_state"
            >
              Too many attempts. Please wait{" "}
              <span className="font-bold font-mono">
                {Math.ceil(lockoutRemaining / 1000)}s
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="reg-username"
                className="block text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
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
                disabled={isLocked}
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
                className="block text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider"
              >
                <span className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-neon-magenta" />
                  Referral Code{" "}
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
                disabled={isLocked}
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
              disabled={isLoading || isLocked}
              className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2"
              data-ocid="register.submit_button"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Creating
                  Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Forgot Access help */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Having trouble?{" "}
            <button
              type="button"
              onClick={handleForgotAccess}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer transition-colors"
              data-ocid="forgot.open_modal_button"
            >
              Forgot Access?
            </button>
          </p>
        </div>
      </div>

      {forgotOpen && <ForgotAccessModal onClose={() => setForgotOpen(false)} />}
    </>
  );
}
