import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Lock,
  RefreshCw,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { TransactionStatus, TransactionType } from "../backend.d";
import type { Transaction } from "../backend.d";
import EarningsSection from "../components/EarningsSection";
import PaymentModal from "../components/PaymentModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllTransactions, useUserProfile } from "../hooks/useQueries";

const PRODUCTS = [
  {
    id: 1n,
    name: "Starter Pack",
    price: 1500n,
    commission: 20,
    description:
      "Start your earning journey with a simple, beginner-friendly digital product. One-time purchase with fast approval.",
    color: "cyan",
  },
  {
    id: 2n,
    name: "Growth Pack",
    price: 3000n,
    commission: 20,
    description:
      "Accelerate your income with higher referral returns. Secure system, instant activation after approval.",
    color: "violet",
  },
  {
    id: 3n,
    name: "Pro Pack",
    price: 5000n,
    commission: 17,
    description:
      "Maximize your earning potential with premium referral benefits. Trusted by thousands of active earners.",
    color: "magenta",
  },
  {
    id: 4n,
    name: "Elite Pack",
    price: 8000n,
    commission: 15,
    description:
      "Top-tier plan for serious earners. Maximum commissions, priority approval, long-term earning potential.",
    color: "cyan",
  },
];

const GLOW_COLORS: Record<string, string> = {
  cyan: "rgba(38,214,255,0.35)",
  violet: "rgba(123,77,255,0.35)",
  magenta: "rgba(201,60,255,0.35)",
};

const BORDER_COLORS: Record<string, string> = {
  cyan: "rgba(38,214,255,0.25)",
  violet: "rgba(123,77,255,0.25)",
  magenta: "rgba(201,60,255,0.25)",
};

const TEXT_CLASSES: Record<string, string> = {
  cyan: "neon-text-cyan",
  violet: "neon-text-violet",
  magenta: "neon-text-magenta",
};

type Product = (typeof PRODUCTS)[0];

// ============================================================
// MY DASHBOARD SECTION (stats, income, referral, transactions)
// ============================================================
function MyDashboardSection() {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: transactions } = useAllTransactions();
  const [copied, setCopied] = useState(false);

  const myTxs: Transaction[] = transactions ?? [];

  const hasApprovedPurchase = myTxs.some(
    (tx) =>
      String(tx.status) === TransactionStatus.approved &&
      (String(tx.txType) === TransactionType.purchase ||
        String(tx.txType) === TransactionType.deposit),
  );
  const referralActive = !!userProfile?.referralCode && hasApprovedPurchase;
  const referralLink = referralActive
    ? `${window.location.origin}/?ref=${userProfile?.referralCode}`
    : null;

  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const approvedTxs = myTxs.filter(
    (tx) => String(tx.status) === TransactionStatus.approved,
  );

  function sumIncome(from: Date): number {
    return approvedTxs
      .filter((tx) => {
        const ts = Number(tx.createdAt) / 1_000_000;
        return (
          ts >= from.getTime() &&
          (String(tx.txType) === TransactionType.deposit ||
            String(tx.txType) === "referral_bonus" ||
            String(tx.txType) === "spin_reward" ||
            String(tx.txType) === "login_bonus" ||
            String(tx.txType) === "ad_reward")
        );
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  }

  const todayIncome = sumIncome(startOfToday);
  const weeklyIncome = sumIncome(startOfWeek);
  const monthlyIncome = sumIncome(startOfMonth);
  const totalReferralEarnings = Number(userProfile?.referralEarnings ?? 0n);

  const handleCopyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      {/* Section Divider */}
      <div className="flex items-center gap-4 mb-12">
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(123,77,255,0.2)" }}
        />
        <h2 className="font-display font-black text-3xl sm:text-4xl gradient-text whitespace-nowrap">
          My Dashboard
        </h2>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(123,77,255,0.2)" }}
        />
      </div>

      {/* Welcome */}
      {userProfile && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-muted-foreground mb-8 text-center"
        >
          Welcome back,{" "}
          <span className="neon-text-cyan font-semibold">
            {userProfile.username}
          </span>
        </motion.p>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Balance
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(38,214,255,0.1)" }}
            >
              <Wallet className="w-4 h-4 neon-text-cyan" />
            </div>
          </div>
          {profileLoading ? (
            <div
              className="h-8 w-24 animate-pulse rounded"
              style={{ background: "rgba(123,77,255,0.15)" }}
              data-ocid="home.balance.loading_state"
            />
          ) : (
            <div className="font-display font-black text-2xl sm:text-3xl neon-text-cyan">
              ₹{Number(userProfile?.balance ?? 0n).toLocaleString("en-IN")}
            </div>
          )}
          <div className="text-muted-foreground text-xs mt-1">
            Available balance
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Referral Earnings
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(201,60,255,0.1)" }}
            >
              <Star className="w-4 h-4 neon-text-magenta" />
            </div>
          </div>
          {profileLoading ? (
            <div
              className="h-8 w-24 animate-pulse rounded"
              style={{ background: "rgba(123,77,255,0.15)" }}
            />
          ) : (
            <div className="font-display font-black text-2xl sm:text-3xl neon-text-magenta">
              ₹{totalReferralEarnings.toLocaleString("en-IN")}
            </div>
          )}
          <div className="text-muted-foreground text-xs mt-1">
            From referrals (20%)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Total Transactions
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(38,214,255,0.1)" }}
            >
              <RefreshCw className="w-4 h-4 neon-text-cyan" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl neon-text-cyan">
            {myTxs.length}
          </div>
          <div className="text-muted-foreground text-xs mt-1">All time</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="stat-card"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Referral Status
            </span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: referralActive
                  ? "rgba(52,211,153,0.1)"
                  : "rgba(123,77,255,0.1)",
              }}
            >
              <TrendingUp
                className={`w-4 h-4 ${referralActive ? "text-emerald-400" : "neon-text-violet"}`}
              />
            </div>
          </div>
          <div
            className={`font-display font-bold text-lg ${referralActive ? "text-emerald-400" : "text-muted-foreground"}`}
          >
            {referralActive ? "Active" : "Locked"}
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            {referralActive ? "You can invite friends" : "Buy to unlock"}
          </div>
        </motion.div>
      </div>

      {/* Income Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(38,214,255,0.1)",
              border: "1px solid rgba(38,214,255,0.25)",
            }}
          >
            <CalendarDays className="w-5 h-5 neon-text-cyan" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl">Income Overview</h3>
            <p className="text-muted-foreground text-xs">
              Your earnings breakdown by time period
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="relative rounded-2xl p-5 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
              border: "1px solid rgba(38,214,255,0.25)",
              boxShadow: "0 4px 20px rgba(38,214,255,0.08)",
            }}
            data-ocid="income.today_card"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10"
              style={{ background: "oklch(0.82 0.18 210)" }}
            />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              📅 Today
            </div>
            <div className="font-display font-black text-3xl neon-text-cyan mb-1">
              ₹{todayIncome.toLocaleString("en-IN")}
            </div>
            <div className="text-muted-foreground text-xs">Earnings today</div>
          </div>
          <div
            className="relative rounded-2xl p-5 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
              border: "1px solid rgba(123,77,255,0.25)",
              boxShadow: "0 4px 20px rgba(123,77,255,0.08)",
            }}
            data-ocid="income.weekly_card"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10"
              style={{ background: "oklch(0.52 0.22 280)" }}
            />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              📆 This Week
            </div>
            <div className="font-display font-black text-3xl neon-text-violet mb-1">
              ₹{weeklyIncome.toLocaleString("en-IN")}
            </div>
            <div className="text-muted-foreground text-xs">Last 7 days</div>
          </div>
          <div
            className="relative rounded-2xl p-5 overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
              border: "1px solid rgba(201,60,255,0.25)",
              boxShadow: "0 4px 20px rgba(201,60,255,0.08)",
            }}
            data-ocid="income.monthly_card"
          >
            <div
              className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10"
              style={{ background: "oklch(0.7 0.25 310)" }}
            />
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              📊 This Month
            </div>
            <div className="font-display font-black text-3xl neon-text-magenta mb-1">
              ₹{monthlyIncome.toLocaleString("en-IN")}
            </div>
            <div className="text-muted-foreground text-xs">Last 30 days</div>
          </div>
        </div>
      </motion.div>

      {/* Referral Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="neon-card p-6 mb-8"
        data-ocid="referral.section"
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: referralActive
                ? "rgba(52,211,153,0.1)"
                : "rgba(123,77,255,0.1)",
              border: `1px solid ${
                referralActive ? "rgba(52,211,153,0.2)" : "rgba(123,77,255,0.2)"
              }`,
            }}
          >
            {referralActive ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 neon-text-violet" />
            )}
          </div>
          <div>
            <h3 className="font-display font-bold text-xl">Referral System</h3>
            <p className="text-muted-foreground text-xs">
              {referralActive
                ? "Share your link and earn 20% commission"
                : "Buy a plan and get approved to unlock referrals"}
            </p>
          </div>
        </div>

        {referralActive && referralLink ? (
          <div className="space-y-4">
            <div
              className="flex items-center gap-2 p-3 rounded-xl"
              style={{
                background: "rgba(52,211,153,0.05)",
                border: "1px solid rgba(52,211,153,0.2)",
              }}
            >
              <input
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent text-sm font-mono text-emerald-400 outline-none"
                data-ocid="referral.input"
              />
              <button
                type="button"
                onClick={handleCopyReferral}
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                data-ocid="referral.toggle"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <a
                href={referralLink}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg transition-colors hover:bg-white/5"
                data-ocid="referral.link"
              >
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Referral Code",
                  value: userProfile?.referralCode ?? "--",
                },
                { label: "Commission Rate", value: "20%" },
                { label: "Paid On", value: "Approval" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="text-center p-3 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(123,77,255,0.15)",
                  }}
                >
                  <div className="font-display font-bold text-sm neon-text-cyan">
                    {item.value}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="text-center py-6 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(123,77,255,0.2)",
            }}
            data-ocid="referral.empty_state"
          >
            <Lock className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">
              Purchase any plan and get admin approval to unlock your referral
              link.
            </p>
            <a
              href="#plans"
              className="neon-btn-primary inline-flex items-center gap-2 mt-4 px-6 py-2 text-sm"
              data-ocid="referral.primary_button"
            >
              View Plans
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ============================================================
// PLANS SECTION (shared between logged-in and guest)
// ============================================================
function PlansSection({
  onBuyNow,
}: {
  onBuyNow: (product: Product) => void;
}) {
  return (
    <section id="plans" className="px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-14"
      >
        <h2 className="font-display font-black text-4xl sm:text-5xl mb-4">
          <span className="gradient-text">Choose Your Plan</span>
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          One-time purchase. Activate your referral link after approval and
          start earning 20% commission instantly.
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {PRODUCTS.map((product, i) => (
            <motion.div
              key={product.id.toString()}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="relative w-full rounded-2xl p-6 flex flex-col transition-shadow duration-300"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
                border: `1px solid ${BORDER_COLORS[product.color]}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  `0 8px 30px ${GLOW_COLORS[product.color]}, 0 4px 20px rgba(0,0,0,0.5)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 4px 20px rgba(0,0,0,0.4)";
              }}
              data-ocid={`products.card.${i + 1}`}
            >
              <div
                className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(52,211,153,0.15)",
                  border: "1px solid rgba(52,211,153,0.4)",
                  color: "rgb(52,211,153)",
                  boxShadow: "0 0 10px rgba(52,211,153,0.3)",
                }}
              >
                10% Cashback
              </div>
              <h3
                className={`font-display font-bold text-lg mb-3 ${TEXT_CLASSES[product.color]}`}
              >
                {product.name}
              </h3>
              <div className="mb-4">
                <span className="font-display font-black text-4xl bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  ₹{Number(product.price).toLocaleString("en-IN")}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {product.description}
              </p>
              <div
                className="rounded-xl px-3 py-2.5 mb-5 text-xs leading-relaxed"
                style={{
                  background: "rgba(52,211,153,0.06)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  boxShadow: "0 0 12px rgba(52,211,153,0.08)",
                  color: "rgba(52,211,153,0.9)",
                }}
              >
                🤝 Buy this product and share with your friends. When your
                friend signs up and purchases any product, you will earn{" "}
                <strong>{product.commission}% commission</strong>.
              </div>
              <ul className="space-y-1.5 mb-6 flex-1">
                {[
                  "One-time purchase",
                  "Beginner-friendly",
                  "Referral earnings",
                  "Secure & fast",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onBuyNow(product)}
                className="neon-btn-primary w-full py-3 text-sm font-semibold"
                data-ocid={`products.primary_button.${i + 1}`}
              >
                Buy Now
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS SECTION
// ============================================================
function HowItWorksSection() {
  return (
    <section className="px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display font-black text-3xl sm:text-4xl text-center mb-14 gradient-text"
        >
          How It Works
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "01",
              title: "Buy a Plan",
              desc: "Select any plan and complete payment via QR code. Submit your transaction ID and screenshot.",
              color: "cyan",
            },
            {
              step: "02",
              title: "Get Approved",
              desc: "Admin verifies and approves your payment within 24 hours. Your referral link activates instantly.",
              color: "violet",
            },
            {
              step: "03",
              title: "Earn 20%",
              desc: "Share your referral link. Earn 20% commission on every friend who purchases and gets approved.",
              color: "magenta",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="neon-card p-6 text-center"
            >
              <div
                className={`font-display font-black text-5xl mb-4 ${TEXT_CLASSES[item.color]}`}
                style={{ opacity: 0.3 }}
              >
                {item.step}
              </div>
              <h3
                className={`font-display font-bold text-lg mb-2 ${TEXT_CLASSES[item.color]}`}
              >
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// MAIN LANDING PAGE
// ============================================================
export default function LandingPage() {
  const { identity, login } = useInternetIdentity();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleBuyNow = (product: Product) => {
    if (!identity) {
      login();
      return;
    }
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen">
      {identity ? (
        // ===== LOGGED-IN LAYOUT =====
        <>
          {/* 1. My Dashboard (top) */}
          <section className="pt-8">
            <MyDashboardSection />
          </section>

          {/* 2. Plans Section */}
          <PlansSection onBuyNow={handleBuyNow} />

          {/* 3. Earnings Hub */}
          <EarningsSection />
        </>
      ) : (
        // ===== GUEST LAYOUT =====
        <>
          {/* Hero */}
          <section className="relative flex flex-col items-center justify-center text-center px-4 py-24 sm:py-36 overflow-hidden">
            <div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20 pointer-events-none"
              style={{ background: "oklch(0.52 0.22 280)" }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-[100px] opacity-15 pointer-events-none"
              style={{ background: "oklch(0.82 0.18 210)" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative z-10 max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                style={{
                  background: "rgba(38,214,255,0.1)",
                  border: "1px solid rgba(38,214,255,0.3)",
                  color: "oklch(0.82 0.18 210)",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Referral System Active — Earn 20% Per Sale
              </motion.div>

              <h1 className="font-display font-black text-5xl sm:text-7xl leading-tight mb-6">
                <span className="gradient-text">Earn 20% On</span>
                <br />
                <span className="text-foreground">Every Referral</span>
              </h1>

              <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
                Buy once. Refer friends. Earn real money — 20% commission for
                every friend who joins and purchases a plan.
              </p>

              <a
                href="#plans"
                className="neon-btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-semibold"
                data-ocid="hero.primary_button"
              >
                View Plans
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="relative z-10 mt-16 flex flex-wrap justify-center gap-8 sm:gap-16"
            >
              {[
                { label: "Active Users", value: "2,400+" },
                { label: "Commission Rate", value: "20%" },
                { label: "Cashback", value: "10%" },
                { label: "Approval Time", value: "< 24h" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="font-display font-black text-2xl neon-text-cyan">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-xs uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </section>

          {/* Plans */}
          <PlansSection onBuyNow={handleBuyNow} />

          {/* How It Works */}
          <HowItWorksSection />
        </>
      )}

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <PaymentModal
            product={{
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              description: selectedProduct.description,
              features: [],
            }}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
