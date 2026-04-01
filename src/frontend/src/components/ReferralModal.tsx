import { Copy, TrendingUp, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { TransactionStatus, TransactionType } from "../backend.d";
import type { UserProfile } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAllTransactions, useAllUsers } from "../hooks/useQueries";

interface Props {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export default function ReferralModal({ open, onClose, userProfile }: Props) {
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toString() ?? "";
  const { data: allUsers } = useAllUsers();
  const { data: allTransactions } = useAllTransactions();

  const referredUsers = (allUsers ?? []).filter(
    (u) => u.referredBy?.toString() === principalText,
  );

  const referralBonusTxs = (allTransactions ?? []).filter(
    (tx) =>
      String(tx.txType) === TransactionType.referral_bonus &&
      tx.user.toString() === principalText,
  );

  const totalCommission = referralBonusTxs.reduce(
    (sum, tx) => sum + Number(tx.amount),
    0,
  );

  const copyReferralCode = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode).then(() => {
      toast.success("Referral code copied!");
    });
  };

  const formatDate = (ts: bigint) => {
    return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 px-4"
          style={{
            background: "rgba(7, 8, 26, 0.92)",
            backdropFilter: "blur(16px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          data-ocid="referral.modal"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl rounded-2xl overflow-hidden my-auto"
            style={{
              background: "rgba(7, 8, 26, 0.98)",
              border: "1px solid rgba(123, 77, 255, 0.4)",
              boxShadow:
                "0 0 60px rgba(123, 77, 255, 0.2), 0 24px 48px rgba(0,0,0,0.7)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-6 pb-4"
              style={{ borderBottom: "1px solid rgba(123, 77, 255, 0.2)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(123, 77, 255, 0.15)",
                    border: "1px solid rgba(123, 77, 255, 0.4)",
                  }}
                >
                  <TrendingUp
                    className="w-5 h-5"
                    style={{ color: "oklch(0.75 0.22 280)" }}
                  />
                </div>
                <div>
                  <h2 className="font-display font-black text-xl gradient-text">
                    Referral to Earn
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Invite friends, earn 20% commission
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="neon-btn p-2"
                data-ocid="referral.close_button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1: Referral Code */}
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                  Your Referral Code
                </h3>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(123, 77, 255, 0.08)",
                    border: "1px solid rgba(123, 77, 255, 0.3)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 font-mono font-black text-2xl sm:text-3xl tracking-widest text-center py-2 rounded-lg"
                      style={{
                        color: "oklch(0.75 0.22 280)",
                        background: "rgba(123, 77, 255, 0.1)",
                        textShadow: "0 0 20px rgba(123, 77, 255, 0.6)",
                      }}
                    >
                      {userProfile?.referralCode ?? "—"}
                    </div>
                    <button
                      type="button"
                      onClick={copyReferralCode}
                      className="neon-btn p-3 shrink-0"
                      title="Copy referral code"
                      data-ocid="referral.button"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-muted-foreground text-xs text-center mt-3">
                    Share this code. Get{" "}
                    <span className="neon-text-cyan font-semibold">
                      20% commission
                    </span>{" "}
                    when your referral buys a plan.
                  </p>
                </div>

                {/* Total earnings summary */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(38, 214, 255, 0.06)",
                      border: "1px solid rgba(38, 214, 255, 0.2)",
                    }}
                  >
                    <div className="neon-text-cyan font-display font-black text-xl">
                      ₹
                      {Number(
                        userProfile?.referralEarnings ?? 0n,
                      ).toLocaleString("en-IN")}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      Total Earnings
                    </div>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(123, 77, 255, 0.06)",
                      border: "1px solid rgba(123, 77, 255, 0.2)",
                    }}
                  >
                    <div
                      className="font-display font-black text-xl"
                      style={{ color: "oklch(0.75 0.22 280)" }}
                    >
                      ₹{totalCommission.toLocaleString("en-IN")}
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      Commission Received
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Referred People */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    Referred People ({referredUsers.length})
                  </h3>
                </div>
                {referredUsers.length === 0 ? (
                  <div
                    className="rounded-xl p-6 text-center text-muted-foreground text-sm"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(255,255,255,0.08)",
                    }}
                    data-ocid="referral.empty_state"
                  >
                    No referrals yet. Share your code to start earning!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {referredUsers.map((u, idx) => (
                      <div
                        key={u.user.toString()}
                        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: "rgba(38, 214, 255, 0.05)",
                          border: "1px solid rgba(38, 214, 255, 0.15)",
                        }}
                        data-ocid={`referral.item.${idx + 1}`}
                      >
                        <div>
                          <div className="font-semibold text-sm">
                            {u.username}
                          </div>
                          <div className="text-muted-foreground text-xs font-mono">
                            {u.user.toString().slice(0, 10)}...
                          </div>
                        </div>
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "oklch(0.72 0.2 142)",
                            border: "1px solid rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 3: Commission Transactions */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-muted-foreground">
                    Commission History
                  </h3>
                </div>
                {referralBonusTxs.length === 0 ? (
                  <div
                    className="rounded-xl p-6 text-center text-muted-foreground text-sm"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px dashed rgba(255,255,255,0.08)",
                    }}
                    data-ocid="referral.empty_state"
                  >
                    No commission earned yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {referralBonusTxs.map((tx, idx) => {
                      const isPending =
                        String(tx.status) === TransactionStatus.pending;
                      const isApproved =
                        String(tx.status) === TransactionStatus.approved;
                      return (
                        <div
                          key={tx.id.toString()}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                          style={{
                            background: "rgba(255, 193, 7, 0.04)",
                            border: "1px solid rgba(255, 193, 7, 0.15)",
                          }}
                          data-ocid={`referral.item.${idx + 1}`}
                        >
                          <div>
                            <div
                              className="font-display font-bold text-base"
                              style={{ color: "oklch(0.85 0.18 85)" }}
                            >
                              +₹{Number(tx.amount).toLocaleString("en-IN")}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {formatDate(tx.createdAt)}
                            </div>
                          </div>
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: isApproved
                                ? "rgba(34, 197, 94, 0.15)"
                                : isPending
                                  ? "rgba(255, 193, 7, 0.15)"
                                  : "rgba(239, 68, 68, 0.15)",
                              color: isApproved
                                ? "oklch(0.72 0.2 142)"
                                : isPending
                                  ? "oklch(0.85 0.18 85)"
                                  : "oklch(0.65 0.22 25)",
                              border: isApproved
                                ? "1px solid rgba(34, 197, 94, 0.3)"
                                : isPending
                                  ? "1px solid rgba(255, 193, 7, 0.3)"
                                  : "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          >
                            {String(tx.status)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
