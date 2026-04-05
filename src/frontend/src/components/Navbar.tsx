import { Link, useLocation } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  MoreVertical,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import ForgotAccessModal from "./ForgotAccessModal";
import PaymentModal from "./PaymentModal";
import ReferralModal from "./ReferralModal";
import WalletModal from "./WalletModal";

interface NavbarProps {
  onSignUpClick?: () => void;
  /** Called when user clicks "Buy Plan" in 3-dot menu — should open wallet with buy plan tab */
  onBuyPlan?: () => void;
  /** Controlled wallet open state (lifted from App.tsx) */
  walletOpen?: boolean;
  onWalletClose?: () => void;
}

export default function Navbar({
  onSignUpClick: _onSignUpClick,
  onBuyPlan,
  walletOpen: externalWalletOpen,
  onWalletClose,
}: NavbarProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useUserProfile();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [internalWalletOpen, setInternalWalletOpen] = useState(false);
  const [referralOpen, setReferralOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<{
    id: bigint;
    name: string;
    price: bigint;
    commission: number;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Merge external and internal wallet open state
  const walletOpen = externalWalletOpen ?? internalWalletOpen;
  const openWallet = () => setInternalWalletOpen(true);
  const closeWallet = () => {
    setInternalWalletOpen(false);
    onWalletClose?.();
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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // "Buy Plan" in 3-dot menu: open WalletModal with plans tab active
  const handleBuyPlanClick = () => {
    setDropdownOpen(false);
    if (onBuyPlan) {
      onBuyPlan();
    } else {
      openWallet();
    }
  };

  const dropdownItems = (
    <>
      <Link
        to="/"
        className="block px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        onClick={() => setDropdownOpen(false)}
        data-ocid="nav.link"
      >
        🏠 Home
      </Link>
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
      <Link
        to="/products"
        className="block px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        onClick={() => setDropdownOpen(false)}
        data-ocid="nav.link"
      >
        📋 Products
      </Link>
      <Link
        to="/mobile-apps"
        className="block px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        onClick={() => setDropdownOpen(false)}
        data-ocid="nav.link"
      >
        📱 Mobile Apps
      </Link>
      <Link
        to="/contact"
        className="block px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        onClick={() => setDropdownOpen(false)}
        data-ocid="nav.link"
      >
        📧 Contact
      </Link>
      <div style={{ borderTop: "1px solid rgba(123,77,255,0.15)" }} />
      <button
        type="button"
        onClick={() => {
          openWallet();
          setDropdownOpen(false);
        }}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        data-ocid="nav.button"
      >
        <Wallet className="w-4 h-4 neon-text-cyan" /> Wallet
      </button>
      <button
        type="button"
        onClick={() => {
          window.location.href = "/#plans";
          setDropdownOpen(false);
        }}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        data-ocid="nav.link"
      >
        <span style={{ fontSize: 14 }}>📋</span> View Plans
      </button>
      {/* Buy Plan opens WalletModal with Buy Plan tab, not navigate to /#plans */}
      <button
        type="button"
        onClick={handleBuyPlanClick}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        data-ocid="nav.button"
      >
        <span style={{ fontSize: 14 }}>🛒</span> Buy Plan
      </button>
      <button
        type="button"
        onClick={() => {
          setReferralOpen(true);
          setDropdownOpen(false);
        }}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors"
        data-ocid="referral.open_modal_button"
      >
        <TrendingUp
          className="w-4 h-4"
          style={{ color: "oklch(0.75 0.22 280)" }}
        />{" "}
        Referral to Earn
      </button>
      <div style={{ borderTop: "1px solid rgba(123,77,255,0.15)" }} />
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
        <LogOut className="w-4 h-4" /> Logout
      </button>
    </>
  );

  return (
    <>
      <header
        className="fixed top-0 z-50 w-full h-12"
        style={{
          background: "#0b0b0b",
          borderBottom: "1px solid rgba(0,150,255,0.3)",
          boxShadow:
            "0 2px 20px rgba(0,150,255,0.15), 0 1px 8px rgba(0,200,100,0.1)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 group shrink-0"
              data-ocid="nav.link"
            >
              <img
                src="/assets/generated/neochain-logo-transparent.dim_200x200.png"
                alt="NeoChain Logo"
                className="w-6 h-6 rounded-md object-cover"
                style={{ boxShadow: "0 0 12px rgba(38, 214, 255, 0.5)" }}
              />
              <span
                className="font-display font-black text-base tracking-widest uppercase"
                style={{ letterSpacing: "0.15em" }}
              >
                <span className="neon-text-cyan">NEO</span>
                <span className="text-foreground">CHAIN</span>
              </span>
            </Link>

            {/* Desktop Quick Nav Links — between logo and right-side buttons */}
            <nav
              className="hidden lg:flex items-center gap-5 mx-4"
              aria-label="Main navigation"
            >
              <Link
                to="/"
                className={`text-xs font-medium transition-colors ${
                  isActive("/")
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                data-ocid="nav.link"
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`text-xs font-medium transition-colors ${
                  isActive("/products")
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                data-ocid="nav.link"
              >
                Products
              </Link>
              <Link
                to="/mobile-apps"
                className={`text-xs font-medium transition-colors ${
                  isActive("/mobile-apps")
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                data-ocid="nav.link"
              >
                Mobile Apps
              </Link>
              <Link
                to="/contact"
                className={`text-xs font-medium transition-colors ${
                  isActive("/contact")
                    ? "text-cyan-400"
                    : "text-gray-400 hover:text-cyan-400"
                }`}
                data-ocid="nav.link"
              >
                Contact
              </Link>
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className={`text-xs font-medium transition-colors ${
                    isActive("/dashboard")
                      ? "text-cyan-400"
                      : "text-gray-400 hover:text-cyan-400"
                  }`}
                  data-ocid="nav.link"
                >
                  Account
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={`text-xs font-medium transition-colors ${
                    isActive("/login")
                      ? "text-cyan-400"
                      : "text-gray-400 hover:text-cyan-400"
                  }`}
                  data-ocid="nav.link"
                >
                  Account
                </Link>
              )}
            </nav>

            {/* Tablet Nav (md-only) */}
            <nav className="hidden md:flex lg:hidden items-center gap-4">
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
            <div className="flex items-center gap-1.5">
              {isLoggedIn && (
                <>
                  {/* Balance Badge */}
                  <div
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-display font-bold"
                    style={{
                      background: "rgba(38, 214, 255, 0.1)",
                      border: "1px solid rgba(38, 214, 255, 0.3)",
                      boxShadow: "0 0 8px rgba(38, 214, 255, 0.12)",
                    }}
                    data-ocid="nav.panel"
                  >
                    <span
                      className="text-muted-foreground"
                      style={{ fontSize: 10 }}
                    >
                      ₹
                    </span>
                    <span className="neon-text-cyan">
                      {Number(balance).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Withdraw Button desktop */}
                  <button
                    type="button"
                    onClick={() => openWallet()}
                    className="hidden sm:flex neon-btn items-center gap-1.5 px-3 py-1.5 text-xs"
                    style={{
                      borderColor: "rgba(201, 60, 255, 0.4)",
                      boxShadow: "0 0 12px rgba(201, 60, 255, 0.15)",
                      color: "oklch(0.78 0.22 310)",
                    }}
                    data-ocid="withdraw.open_modal_button"
                  >
                    <span className="text-xs font-semibold">Withdraw</span>
                  </button>

                  {/* 3-dot dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setDropdownOpen((v) => !v)}
                      className="neon-btn p-1.5"
                      aria-label="Menu"
                      data-ocid="nav.button"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {dropdownOpen && (
                      <div
                        className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden z-50"
                        style={{
                          background: "rgba(7, 8, 26, 0.97)",
                          border: "1px solid rgba(123, 77, 255, 0.35)",
                          boxShadow:
                            "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(123,77,255,0.15)",
                        }}
                      >
                        <div
                          className="sm:hidden flex items-center gap-2 px-4 py-3 border-b"
                          style={{ borderColor: "rgba(123,77,255,0.15)" }}
                        >
                          <span className="text-muted-foreground text-xs">
                            Balance:
                          </span>
                          <span className="neon-text-cyan font-display font-bold text-sm">
                            ₹{Number(balance).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            openWallet();
                            setDropdownOpen(false);
                          }}
                          className="sm:hidden flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-white/5 transition-colors"
                          style={{ color: "oklch(0.78 0.22 310)" }}
                          data-ocid="withdraw.open_modal_button"
                        >
                          <span>💸</span> Withdraw
                        </button>
                        {dropdownItems}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Login + Sign Up + Forgot Access — shown when not logged in */}
              {!isLoggedIn && (
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      to="/login"
                      className="neon-btn flex items-center gap-1.5 px-3 py-1.5"
                      style={{
                        borderColor: "rgba(38, 214, 255, 0.5)",
                        color: "oklch(0.82 0.18 200)",
                        boxShadow: "0 0 10px rgba(38, 214, 255, 0.12)",
                      }}
                      data-ocid="nav.login_button"
                    >
                      <LogIn className="w-3 h-3" />
                      <span className="text-xs font-semibold">Login</span>
                    </Link>
                    <Link
                      to="/register"
                      className="neon-btn-primary flex items-center gap-1.5 px-3 py-1.5"
                      data-ocid="nav.signup_button"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span className="text-xs font-semibold">Sign Up</span>
                    </Link>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs text-muted-foreground hover:text-cyan-400 cursor-pointer transition-colors leading-none pr-0.5"
                    data-ocid="forgot.open_modal_button"
                  >
                    Forgot Access?
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <WalletModal
        open={walletOpen}
        onClose={closeWallet}
        userProfile={userProfile ?? null}
        onBuyPlan={(plan) => {
          closeWallet();
          setPaymentProduct(plan);
        }}
      />
      {paymentProduct && (
        <PaymentModal
          product={{
            id: paymentProduct.id,
            name: paymentProduct.name,
            price: paymentProduct.price,
            features: [],
            description: "",
          }}
          onClose={() => setPaymentProduct(null)}
        />
      )}
      <ReferralModal
        open={referralOpen}
        onClose={() => setReferralOpen(false)}
        userProfile={userProfile ?? null}
      />
      {forgotOpen && <ForgotAccessModal onClose={() => setForgotOpen(false)} />}
    </>
  );
}
