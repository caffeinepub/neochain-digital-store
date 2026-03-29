import { Link, useLocation } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import WalletModal from "./WalletModal";

export default function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: userProfile } = useUserProfile();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletDefaultTab, setWalletDefaultTab] = useState<
    "deposit" | "withdraw"
  >("deposit");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openWallet = (tab: "deposit" | "withdraw" = "deposit") => {
    setWalletDefaultTab(tab);
    setWalletOpen(true);
  };

  const navLinks = [
    { label: "Store", to: "/" },
    { label: "Dashboard", to: "/dashboard" },
  ];

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const balance = userProfile?.balance ?? 0n;
  const isLoggedIn = !!identity;
  const hasProfile = !!userProfile;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      window.addEventListener("mousedown", handleClick);
    }
    return () => window.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full"
        style={{
          background: "rgba(7, 8, 26, 0.92)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(123, 77, 255, 0.25)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)",
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
              <img
                src="/assets/generated/neochain-logo-transparent.dim_200x200.png"
                alt="NeoChain Logo"
                className="w-8 h-8 rounded-lg object-cover"
                style={{ boxShadow: "0 0 20px rgba(38, 214, 255, 0.5)" }}
              />
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
              {isLoggedIn && hasProfile && (
                <>
                  {/* Balance Badge */}
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-display font-bold"
                    style={{
                      background: "rgba(38, 214, 255, 0.1)",
                      border: "1px solid rgba(38, 214, 255, 0.3)",
                      boxShadow: "0 0 12px rgba(38, 214, 255, 0.15)",
                    }}
                    data-ocid="nav.panel"
                  >
                    <span className="text-muted-foreground text-xs">
                      Balance:
                    </span>
                    <span className="neon-text-cyan">
                      ₹{Number(balance).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Withdraw Button */}
                  <button
                    type="button"
                    onClick={() => openWallet("withdraw")}
                    className="hidden sm:flex neon-btn items-center gap-1.5 px-3 py-2 text-sm"
                    style={{
                      borderColor: "rgba(201, 60, 255, 0.4)",
                      boxShadow: "0 0 12px rgba(201, 60, 255, 0.15)",
                      color: "oklch(0.78 0.22 310)",
                    }}
                    data-ocid="withdraw.open_modal_button"
                  >
                    <span className="text-xs font-semibold">Withdraw</span>
                  </button>

                  {/* 3-dot dropdown menu (desktop) */}
                  <div className="hidden md:block relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="neon-btn p-2"
                      aria-label="Menu"
                      data-ocid="nav.button"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {dropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50"
                        style={{
                          background: "rgba(7, 8, 26, 0.95)",
                          border: "1px solid rgba(123, 77, 255, 0.35)",
                          boxShadow:
                            "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(123,77,255,0.15)",
                        }}
                      >
                        {navLinks.map((link) => (
                          <Link
                            key={link.label}
                            to={link.to as "/" | "/dashboard"}
                            className="block px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                            data-ocid="nav.link"
                          >
                            {link.label}
                          </Link>
                        ))}
                        <div
                          style={{
                            borderTop: "1px solid rgba(123,77,255,0.2)",
                          }}
                        />
                        {userProfile?.username && (
                          <div className="px-4 py-2 text-xs text-muted-foreground">
                            <span className="neon-text-cyan font-display font-semibold">
                              {userProfile.username}
                            </span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            clear();
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
                          data-ocid="nav.button"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isLoggedIn && (
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

              {/* Mobile 3-dot / hamburger */}
              <button
                type="button"
                className="md:hidden neon-btn p-2"
                onClick={() => setMenuOpen(!menuOpen)}
                data-ocid="nav.toggle"
              >
                <MoreVertical className="w-5 h-5" />
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
              {isLoggedIn && hasProfile && (
                <>
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
                      openWallet("withdraw");
                      setMenuOpen(false);
                    }}
                    className="neon-btn flex items-center gap-2 px-4 py-2 text-sm w-full"
                    style={{
                      borderColor: "rgba(201, 60, 255, 0.4)",
                      color: "oklch(0.78 0.22 310)",
                    }}
                    data-ocid="withdraw.open_modal_button"
                  >
                    Withdraw
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clear();
                      setMenuOpen(false);
                    }}
                    className="neon-btn flex items-center gap-2 px-4 py-2 text-sm w-full text-red-400"
                    data-ocid="nav.button"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    login();
                    setMenuOpen(false);
                  }}
                  disabled={isLoggingIn}
                  className="neon-btn-primary flex items-center gap-2 px-4 py-2 text-sm w-full"
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
            </nav>
          )}
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletModal
        open={walletOpen}
        onClose={() => setWalletOpen(false)}
        userProfile={userProfile ?? null}
        defaultTab={walletDefaultTab}
      />
    </>
  );
}
