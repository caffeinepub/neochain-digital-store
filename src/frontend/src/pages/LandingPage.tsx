import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
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
import AdSenseUnit from "../components/AdSenseUnit";
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
// SEO: PLATFORM INTRODUCTION SECTION
// ============================================================
function AboutSection() {
  return (
    <section id="about" className="px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="neon-card p-8 sm:p-12 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
            style={{
              background: "rgba(38,214,255,0.1)",
              border: "1px solid rgba(38,214,255,0.3)",
              color: "oklch(0.82 0.18 210)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Trusted Earning Platform
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-6 gradient-text">
            Welcome to NeoChain Digital Store
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4 max-w-2xl mx-auto">
            <strong className="text-foreground">NeoChain Digital Store</strong>{" "}
            is India&apos;s fastest-growing digital earning platform where you
            can earn money online through plans, referral commissions, and daily
            rewards. Whether you are new to online earning or an experienced
            user, the{" "}
            <strong className="text-foreground">
              NeoChain earning platform
            </strong>{" "}
            is designed to be simple, transparent, and highly rewarding.
          </p>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mx-auto">
            With a quick{" "}
            <strong className="text-foreground">NeoChain login</strong>, you get
            instant access to your personal dashboard, referral link, and
            Earnings Hub. Join thousands of users who{" "}
            <strong className="text-foreground">
              earn money online with NeoChain
            </strong>{" "}
            every single day through our proven, secure system.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// SEO: HOW TO EARN SECTION
// ============================================================
function HowToEarnSection() {
  const steps = [
    {
      num: "1",
      title: "Create Account",
      desc: "Register on NeoChain Digital Store with your email. NeoChain login is simple and takes under a minute to set up your profile.",
      color: "cyan",
      icon: "👤",
    },
    {
      num: "2",
      title: "Choose a Plan",
      desc: "Pick from our affordable earning plans starting at ₹1500. Each plan on this NeoChain earning platform gives daily income potential with referral bonuses.",
      color: "violet",
      icon: "📋",
    },
    {
      num: "3",
      title: "Start Earning Daily Income",
      desc: "Earn money online with NeoChain through referral commissions up to 20%, daily spin wheel rewards, and automatic login bonuses.",
      color: "magenta",
      icon: "💰",
    },
  ];

  return (
    <section id="how-to-earn" className="px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-4 gradient-text">
            How to Earn with NeoChain Digital Store
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Follow these 3 simple steps to start earning daily income on the
            NeoChain earning platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="neon-card p-6 text-center relative overflow-hidden"
            >
              {/* Big step number watermark */}
              <div
                className={`absolute -top-2 -right-2 font-display font-black text-8xl pointer-events-none select-none ${TEXT_CLASSES[step.color]}`}
                style={{ opacity: 0.06 }}
              >
                {step.num}
              </div>
              <div className="text-4xl mb-4">{step.icon}</div>
              <div
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black mb-3 ${TEXT_CLASSES[step.color]}`}
                style={{
                  background:
                    step.color === "cyan"
                      ? "rgba(38,214,255,0.1)"
                      : step.color === "violet"
                        ? "rgba(123,77,255,0.1)"
                        : "rgba(201,60,255,0.1)",
                  border:
                    step.color === "cyan"
                      ? "1px solid rgba(38,214,255,0.3)"
                      : step.color === "violet"
                        ? "1px solid rgba(123,77,255,0.3)"
                        : "1px solid rgba(201,60,255,0.3)",
                }}
              >
                {step.num}
              </div>
              <h3
                className={`font-display font-bold text-lg mb-3 ${TEXT_CLASSES[step.color]}`}
              >
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SEO: FAQ SECTION
// ============================================================
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Is NeoChain Digital Store free to join?",
      a: "Joining NeoChain Digital Store requires purchasing a plan starting from ₹1500. This one-time investment unlocks your referral link and daily earning features including the spin wheel and login bonus.",
    },
    {
      q: "How do I earn on this platform?",
      a: "You can earn money online with NeoChain in three ways: (1) Referral commission up to 20% when friends join using your unique referral link, (2) Daily spin wheel rewards — get 1 free spin every 24 hours, and (3) Daily login bonus credited automatically to your balance every time you log in.",
    },
    {
      q: "How do I withdraw my earnings?",
      a: "Go to Wallet → Withdraw from the navigation menu. Enter your bank or UPI details and the amount you wish to withdraw. A 12% processing fee is deducted. Payments are processed within 24–48 hours after admin approval. Minimum withdrawal limits apply.",
    },
  ];

  return (
    <section id="faq" className="px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-4 gradient-text">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about the NeoChain earning platform.
          </p>
        </motion.div>

        <div className="space-y-4" data-ocid="faq.list">
          {faqs.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="neon-card overflow-hidden"
              data-ocid={`faq.item.${i + 1}`}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-white/[0.02] transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                data-ocid={`faq.toggle.${i + 1}`}
                aria-expanded={openIndex === i}
              >
                <span className="font-display font-semibold text-sm sm:text-base text-foreground">
                  {faq.q}
                </span>
                <span className="shrink-0 neon-text-cyan">
                  {openIndex === i ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-5 sm:px-6 pb-5 text-muted-foreground text-sm leading-relaxed"
                      style={{
                        borderTop: "1px solid rgba(123,77,255,0.15)",
                        paddingTop: "1rem",
                      }}
                    >
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SEO: CTA SECTION
// ============================================================
function CTASection({ onSignUp }: { onSignUp: () => void }) {
  return (
    <section className="px-4 pb-32">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-10 sm:p-16 text-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.06 280), oklch(0.09 0.03 260))",
            border: "1px solid rgba(38,214,255,0.25)",
            boxShadow:
              "0 0 60px rgba(123,77,255,0.2), 0 4px 40px rgba(0,0,0,0.5)",
          }}
        >
          {/* Glow orbs */}
          <div
            className="absolute top-0 left-1/4 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none"
            style={{ background: "oklch(0.52 0.22 280)" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full blur-[60px] opacity-15 pointer-events-none"
            style={{ background: "oklch(0.82 0.18 210)" }}
          />

          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
              style={{
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.35)",
                color: "rgb(52,211,153)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              2,400+ Active Members
            </div>

            <h2 className="font-display font-black text-3xl sm:text-5xl mb-4 gradient-text">
              Join NeoChain Digital Store Today
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Start earning daily income on India&apos;s fast-growing{" "}
              <strong className="text-foreground">
                NeoChain earning platform
              </strong>
              . Referral commissions, spin rewards, and login bonuses — all in
              one place.
            </p>

            <button
              type="button"
              onClick={onSignUp}
              className="neon-btn-primary inline-flex items-center gap-2 px-10 py-4 text-base font-bold"
              data-ocid="cta.primary_button"
            >
              Sign Up Now
            </button>

            <p className="text-muted-foreground text-xs mt-4">
              Plans start at ₹1500 · No hidden fees · Fast approval
            </p>
          </div>
        </motion.div>
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
          {/* Made by Sandeep Kumar branding */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
              paddingTop: 8,
            }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {/* Left glow ray */}
              <div
                style={{
                  position: "absolute",
                  left: -38,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 30,
                  height: 4,
                  background: "rgba(38,214,255,0.7)",
                  borderRadius: 2,
                  filter: "blur(3px)",
                }}
              />
              <img
                src="/assets/generated/sandeep-logo-transparent.dim_80x80.png"
                alt="Sandeep Kumar"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  filter:
                    "drop-shadow(0 0 8px rgba(38,214,255,0.8)) drop-shadow(0 0 16px rgba(123,77,255,0.5))",
                }}
              />
              {/* Right glow ray */}
              <div
                style={{
                  position: "absolute",
                  right: -38,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 30,
                  height: 4,
                  background: "rgba(38,214,255,0.7)",
                  borderRadius: 2,
                  filter: "blur(3px)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.05em",
                background:
                  "linear-gradient(90deg, rgba(38,214,255,1), #fff, rgba(38,214,255,1))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 6px rgba(38,214,255,0.6))",
              }}
            >
              Made by Sandeep Kumar
            </span>
          </div>

          {/* 1. My Dashboard (top) */}
          <section className="pt-8">
            <MyDashboardSection />
          </section>

          {/* 2. Plans Section */}
          <PlansSection onBuyNow={handleBuyNow} />

          {/* 3. Earnings Hub */}
          <EarningsSection />
          {/* AdSense Ad Unit */}
          <AdSenseUnit />
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="#plans"
                  className="neon-btn-primary inline-flex items-center gap-2 px-8 py-4 text-base font-semibold"
                  data-ocid="hero.primary_button"
                >
                  View Plans
                </a>
                <button
                  type="button"
                  onClick={login}
                  className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all"
                  style={{
                    background: "rgba(52,211,153,0.1)",
                    border: "1px solid rgba(52,211,153,0.4)",
                    color: "rgb(52,211,153)",
                  }}
                  data-ocid="hero.secondary_button"
                >
                  Join Now — Sign Up Free
                </button>
              </div>
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
          {/* AdSense Ad Unit */}
          <AdSenseUnit />

          {/* How It Works */}
          <HowItWorksSection />

          {/* SEO: About / Platform Introduction */}
          <AboutSection />

          {/* SEO: How to Earn Steps */}
          <HowToEarnSection />

          {/* SEO: FAQ */}
          <FAQSection />

          {/* SEO: CTA */}
          <CTASection onSignUp={login} />
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
