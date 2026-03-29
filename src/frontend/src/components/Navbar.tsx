import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, Wallet } from "lucide-react";
import { useState } from "react";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import WalletModal from "./WalletModal";

interface NavbarProps {
  userProfile: UserProfile | null;
}

export default function Navbar({ userProfile }: NavbarProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const navLinks = [
    { label: "Store", to: "/" },
    { label: "Dashboard", to: "/dashboard" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const balance = userProfile?.balance ?? 0n;

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(7, 8, 26, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(123, 77, 255, 0.2)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group"
              data-ocid="nav.link"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.18 210), oklch(0.52 0.22 280))",
                  boxShadow: "0 0 20px rgba(38, 214, 255, 0.5)",
                }}
              >
                N
              </div>
              <span
                className="font-display font-black text-xl tracking-widest uppercase"
                style={{ letterSpacing: "0.2em" }}
              >
                <span className="neon-text-cyan">NEO</span>
                <span className="text-foreground">CHAIN</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to as "/" | "/dashboard"}
                  className={`nav-link ${isActive(link.to) ? "active" : ""}`}
                  data-ocid="nav.link"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              {identity && userProfile && (
                <>
                  {/* Balance Badge */}
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-bold"
                    style={{
                      background: "rgba(38, 214, 255, 0.08)",
                      border: "1px solid rgba(38, 214, 255, 0.25)",
                      boxShadow: "0 0 10px rgba(38, 214, 255, 0.1)",
                    }}
                    data-ocid="nav.panel"
                  >
                    <span className="text-muted-foreground text-xs">₹</span>
                    <span className="neon-text-cyan">
                      {Number(balance).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Wallet Button */}
                  <button
                    type="button"
                    onClick={() => setWalletOpen(true)}
                    className="neon-btn flex items-center gap-1.5 px-3 py-2 text-sm"
                    style={{
                      borderColor: "rgba(38, 214, 255, 0.4)",
                      boxShadow: "0 0 12px rgba(38, 214, 255, 0.15)",
                    }}
                    data-ocid="wallet.open_modal_button"
                  >
                    <Wallet className="w-4 h-4 neon-text-cyan" />
                    <span className="hidden md:inline text-xs">Wallet</span>
                  </button>
                </>
              )}

              {identity && userProfile && (
                <div className="hidden md:flex items-center text-sm text-muted-foreground">
                  <span className="neon-text-cyan font-display font-semibold text-xs">
                    {userProfile.username}
                  </span>
                </div>
              )}

              {identity ? (
                <button
                  type="button"
                  onClick={clear}
                  className="neon-btn flex items-center gap-2 px-3 py-2 text-sm"
                  data-ocid="nav.button"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={login}
                  disabled={isLoggingIn}
                  className="neon-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                  data-ocid="nav.button"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isLoggingIn ? "Connecting..." : "Login"}
                </button>
              )}

              {/* Mobile hamburger */}
              <button
                type="button"
                className="md:hidden neon-btn p-2"
                onClick={() => setMenuOpen(!menuOpen)}
                data-ocid="nav.toggle"
              >
                <div className="w-5 h-5 flex flex-col justify-center gap-1">
                  <span
                    className={`block h-0.5 bg-current transition-transform ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`}
                  />
                  <span
                    className={`block h-0.5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`}
                  />
                  <span
                    className={`block h-0.5 bg-current transition-transform ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <nav className="md:hidden py-4 flex flex-col gap-3 border-t border-border/30">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to as "/" | "/dashboard"}
                  className={`nav-link text-base ${isActive(link.to) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                  data-ocid="nav.link"
                >
                  {link.label}
                </Link>
              ))}
              {identity && userProfile && (
                <>
                  {/* Mobile Balance */}
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(38, 214, 255, 0.08)",
                      border: "1px solid rgba(38, 214, 255, 0.2)",
                    }}
                  >
                    <span className="text-muted-foreground text-xs">
                      Balance:
                    </span>
                    <span className="neon-text-cyan font-display font-bold">
                      ₹{Number(balance).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletOpen(true);
                      setMenuOpen(false);
                    }}
                    className="neon-btn flex items-center gap-2 px-4 py-2 text-sm w-full"
                    style={{ borderColor: "rgba(38, 214, 255, 0.4)" }}
                    data-ocid="wallet.open_modal_button"
                  >
                    <Wallet className="w-4 h-4 neon-text-cyan" />
                    Wallet
                  </button>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        userProfile={userProfile}
      />
    </>
  );
}
