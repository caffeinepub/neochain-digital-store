import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Gift,
  Link2,
  Share2,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TransactionType } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllTransactions, useUserProfile } from "../hooks/useQueries";

const MAX_REFERRALS = 10;

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Share2,
    title: "Share your link",
    desc: "Copy your unique referral link and send it to friends in India or Nepal via WhatsApp, Telegram, or any other channel.",
    color: "rgba(38,214,255,0.8)",
    glow: "rgba(38,214,255,0.2)",
  },
  {
    step: "2",
    icon: Users,
    title: "Friend signs up & verifies",
    desc: "Your friend registers using your link and completes account verification. You immediately earn ₹3.",
    color: "rgba(123,77,255,0.9)",
    glow: "rgba(123,77,255,0.2)",
  },
  {
    step: "3",
    icon: Gift,
    title: "Earn ₹3 more after 3 tasks",
    desc: "Once your friend completes 3 earning tasks on the platform, you receive your remaining ₹3 bonus — total ₹6 per referral.",
    color: "rgba(0,230,118,0.9)",
    glow: "rgba(0,230,118,0.2)",
  },
];

function formatDate(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    pending: "badge-status-pending",
    completed: "badge-status-completed",
    approved: "badge-status-approved",
    rejected: "badge-status-rejected",
  };
  return (
    <span className={classes[status] ?? "badge-status-pending"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ReferralPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const { data: allTransactions = [] } = useAllTransactions();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isInitializing && !identity) navigate({ to: "/" });
  }, [identity, isInitializing, navigate]);

  if (isInitializing || !identity) return null;

  const referralCode = userProfile?.referralCode ?? "";
  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : "";
  const referralEarnings = Number(userProfile?.referralEarnings ?? 0n);

  // Referral transactions filter
  const referralTxs = allTransactions.filter(
    (tx) => tx.txType === TransactionType.referral_bonus,
  );

  // Stat computations
  const totalReferrals = referralTxs.length;
  const activeReferrals = referralTxs.filter(
    (tx) => tx.status === "completed" || tx.status === "approved",
  ).length;
  const pendingRewards = referralTxs
    .filter((tx) => tx.status === "pending")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const remainingSlots = Math.max(0, MAX_REFERRALS - totalReferrals);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const shareWhatsApp = () => {
    const msg = encodeURIComponent(
      `🚀 Join NeoChain Digital Store and start earning daily income!\nUse my referral link: ${referralLink}\n\n✅ Earn through tasks, plans & rewards\n✅ Instant payouts\n✅ India & Nepal platform`,
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener");
  };

  const shareTelegram = () => {
    const msg = encodeURIComponent(
      "🚀 Join NeoChain Digital Store — earn daily income in India & Nepal!\n✅ Tasks, plans, referral rewards\nSign up here:",
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`,
      "_blank",
      "noopener",
    );
  };

  return (
    <div className="pt-16 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ── Page Header ── */}
        <div className="neon-card-referral p-5">
          <div className="flex items-center gap-3 mb-1">
            <Link2
              className="w-5 h-5 shrink-0"
              style={{ color: "oklch(0.72 0.22 280)" }}
            />
            <h1
              className="font-display font-black text-2xl gradient-text"
              data-ocid="referral.page_heading"
            >
              Referral Program
            </h1>
          </div>
          <p className="text-muted-foreground text-sm pl-8">
            Invite friends from India & Nepal — earn ₹3 on signup + ₹3 after
            they complete 3 tasks. Max 10 referrals.
          </p>
        </div>

        {/* ── Section 1: Referral Link ── */}
        <div
          className="neon-card-referral p-5 space-y-4"
          data-ocid="referral.link_section"
        >
          <h2
            className="font-display font-bold text-sm uppercase tracking-widest"
            style={{ color: "oklch(0.72 0.22 280)" }}
          >
            Your Referral Link
          </h2>

          {referralLink ? (
            <>
              {/* Link display + copy */}
              <div
                className="flex items-center gap-2 p-3 rounded-xl"
                style={{
                  background: "rgba(123,77,255,0.08)",
                  border: "1px solid rgba(123,77,255,0.3)",
                }}
              >
                <span className="flex-1 text-xs text-muted-foreground truncate font-mono min-w-0">
                  {referralLink}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="neon-btn px-4 py-2 text-xs shrink-0 flex items-center gap-1.5 font-bold"
                  data-ocid="referral.copy_link_btn"
                >
                  {copied ? (
                    <CheckCircle className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="neon-btn py-3 text-sm font-bold flex items-center justify-center gap-2"
                  style={{
                    borderColor: "rgba(37,211,102,0.5)",
                    color: "oklch(0.75 0.22 160)",
                    boxShadow: "0 0 18px rgba(37,211,102,0.2)",
                  }}
                  data-ocid="referral.share_whatsapp_btn"
                >
                  <ExternalLink className="w-4 h-4" />
                  Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={shareTelegram}
                  className="neon-btn py-3 text-sm font-bold flex items-center justify-center gap-2"
                  style={{
                    borderColor: "rgba(38,161,255,0.5)",
                    color: "oklch(0.72 0.18 220)",
                    boxShadow: "0 0 18px rgba(38,161,255,0.2)",
                  }}
                  data-ocid="referral.share_telegram_btn"
                >
                  <ExternalLink className="w-4 h-4" />
                  Share on Telegram
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete your profile to generate your unique referral link.
            </p>
          )}
        </div>

        {/* ── Section 2: How It Works ── */}
        <div>
          <h2 className="font-display font-bold text-base mb-3 text-foreground">
            How It Works
          </h2>
          <div className="space-y-3">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="neon-card flex items-start gap-4 p-4"
                  style={{ borderColor: `${item.glow}`.replace("0.2", "0.35") }}
                  data-ocid={`referral.step_${item.step}`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `radial-gradient(circle, ${item.glow} 0%, transparent 70%)`,
                      border: `1px solid ${item.color}`,
                      boxShadow: `0 0 16px ${item.glow}`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="font-display font-black text-xs"
                        style={{ color: item.color }}
                      >
                        STEP {item.step}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-foreground">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section 3: Stats Grid ── */}
        <div>
          <h2 className="font-display font-bold text-base mb-3 text-foreground">
            Your Stats
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="stat-card text-center"
              data-ocid="referral.stat_total"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Total Referrals
              </div>
              <div
                className="font-display font-black text-2xl"
                style={{ color: "oklch(0.72 0.22 280)" }}
              >
                {totalReferrals}
                <span className="text-sm text-muted-foreground font-normal">
                  /{MAX_REFERRALS}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {remainingSlots} slot{remainingSlots !== 1 ? "s" : ""} left
              </div>
            </div>

            <div
              className="stat-card text-center"
              data-ocid="referral.stat_earnings"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Referral Earnings
              </div>
              <div className="font-display font-black text-2xl neon-text-cyan">
                ₹{referralEarnings}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                total earned
              </div>
            </div>

            <div
              className="stat-card text-center"
              data-ocid="referral.stat_pending"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Pending Rewards
              </div>
              <div className="font-display font-black text-2xl neon-text-magenta">
                ₹{pendingRewards / 100}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                awaiting confirmation
              </div>
            </div>

            <div
              className="stat-card text-center"
              data-ocid="referral.stat_active"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Active Referrals
              </div>
              <div
                className="font-display font-black text-2xl"
                style={{ color: "oklch(0.75 0.22 160)" }}
              >
                {activeReferrals}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                completed tasks
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 4: Referral Transactions ── */}
        <div>
          <h2 className="font-display font-bold text-base mb-3 text-foreground">
            Referral Transactions
          </h2>

          {referralTxs.length === 0 ? (
            <div
              className="neon-card-referral p-8 text-center"
              data-ocid="referral.tx_empty_state"
            >
              <Gift
                className="w-8 h-8 mx-auto mb-3 opacity-40"
                style={{ color: "oklch(0.72 0.22 280)" }}
              />
              <p className="text-sm text-muted-foreground">
                No referral earnings yet. Share your link to start earning!
              </p>
            </div>
          ) : (
            <div
              className="neon-card-referral overflow-hidden"
              data-ocid="referral.tx_list"
            >
              <div className="divide-y divide-border/50">
                {referralTxs.map((tx) => (
                  <div
                    key={tx.id.toString()}
                    className="flex items-center justify-between px-4 py-3"
                    data-ocid={`referral.tx_row_${tx.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(123,77,255,0.12)",
                          border: "1px solid rgba(123,77,255,0.3)",
                        }}
                      >
                        <Gift
                          className="w-3.5 h-3.5"
                          style={{ color: "oklch(0.72 0.22 280)" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">
                          Referral Bonus
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(tx.createdAt)}
                          {tx.notes ? ` · ${tx.notes}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span
                        className="font-display font-bold text-sm"
                        style={{ color: "oklch(0.75 0.22 160)" }}
                      >
                        +₹{Number(tx.amount) / 100}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Section 5: Fraud Notice ── */}
        <div
          className="neon-card flex items-start gap-3 p-4"
          style={{
            borderColor: "rgba(255,200,0,0.3)",
            boxShadow: "0 0 20px rgba(255,200,0,0.06)",
          }}
          data-ocid="referral.fraud_notice"
        >
          <ShieldAlert
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: "oklch(0.82 0.18 85)" }}
          />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">
              Anti-Fraud Protection Active
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fake referrals from the same device or IP address are
              auto-detected and removed. Suspicious accounts are frozen
              immediately. Only genuine referrals from unique users in India &
              Nepal qualify for rewards.
            </p>
          </div>
        </div>

        {/* Remaining slots warning */}
        {remainingSlots === 0 && (
          <div
            className="neon-card flex items-center gap-3 p-4"
            style={{ borderColor: "rgba(220,50,50,0.35)" }}
            data-ocid="referral.slots_full_notice"
          >
            <AlertTriangle
              className="w-5 h-5 shrink-0"
              style={{ color: "oklch(0.7 0.2 27)" }}
            />
            <p className="text-xs text-muted-foreground">
              You've reached the maximum of{" "}
              <span className="text-foreground font-semibold">
                {MAX_REFERRALS} referrals
              </span>
              . No further referral rewards can be earned.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
