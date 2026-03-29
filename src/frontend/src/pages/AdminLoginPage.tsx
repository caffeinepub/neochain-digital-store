import { Lock, Shield, User } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export default function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      if (username === "admin" && password === "admin2024") {
        onLogin();
      } else {
        setError("Invalid credentials. Access denied.");
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.07 0.03 270) 0%, oklch(0.10 0.06 285) 50%, oklch(0.08 0.04 295) 100%)",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(123, 77, 255, 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle, rgba(38, 214, 255, 0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 pointer-events-none rounded-full blur-3xl opacity-15"
        style={{
          background:
            "radial-gradient(circle, rgba(201, 60, 255, 0.3) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(38, 214, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(38, 214, 255, 0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div
          className="neon-card p-8"
          style={{
            border: "1px solid rgba(123, 77, 255, 0.5)",
            boxShadow:
              "0 0 60px rgba(123, 77, 255, 0.15), 0 0 120px rgba(38, 214, 255, 0.08), inset 0 1px 0 rgba(38, 214, 255, 0.15)",
          }}
          data-ocid="admin.dialog"
        >
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(38, 214, 255, 0.15), rgba(123, 77, 255, 0.2))",
                border: "1px solid rgba(38, 214, 255, 0.3)",
                boxShadow: "0 0 30px rgba(38, 214, 255, 0.2)",
              }}
            >
              <Shield className="w-8 h-8 neon-text-cyan" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1
              className="font-display font-black text-3xl tracking-widest uppercase mb-2 neon-text-cyan"
              style={{ letterSpacing: "0.25em" }}
            >
              ADMIN PANEL
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              ⚠ Restricted Access
            </p>
            <div
              className="mt-3 h-px w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(38, 214, 255, 0.4), transparent)",
              }}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2"
                htmlFor="admin-username"
              >
                Admin ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin ID"
                  className="neon-input w-full pl-10 pr-4 py-3 text-sm"
                  autoComplete="username"
                  data-ocid="admin.input"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2"
                htmlFor="admin-password"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="neon-input w-full pl-10 pr-4 py-3 text-sm"
                  autoComplete="current-password"
                  data-ocid="admin.input"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(220, 50, 50, 0.12)",
                  border: "1px solid rgba(220, 50, 50, 0.35)",
                  color: "oklch(0.7 0.2 27)",
                }}
                data-ocid="admin.error_state"
              >
                <span>⚠</span> {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="neon-btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
              data-ocid="admin.submit_button"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">◌</span> Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Access Admin Panel
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Unauthorized access is strictly prohibited
          </p>
        </div>
      </motion.div>
    </div>
  );
}
