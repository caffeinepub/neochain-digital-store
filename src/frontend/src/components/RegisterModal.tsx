import { Gift, Loader2, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";

interface Props {
  actor: backendInterface;
  onRegistered: (profile: UserProfile) => void;
  onClose: () => void;
}

export default function RegisterModal({ actor, onRegistered, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }
    setIsLoading(true);
    try {
      const profile = await actor.registerUser(
        username.trim(),
        referralCode.trim() || null,
      );
      toast.success(`Welcome to NeoChain, ${profile.username}!`);
      onRegistered(profile);
    } catch {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.8)", backdropFilter: "blur(8px)" }}
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
              className="neon-input w-full px-4 py-3"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              data-ocid="register.input"
            />
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
              className="neon-input w-full px-4 py-3"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              data-ocid="register.input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2"
            data-ocid="register.submit_button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
