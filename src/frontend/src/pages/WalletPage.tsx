import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  ImageIcon,
  ShieldAlert,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TransactionStatus, TransactionType } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllTransactions,
  useIsWithdrawalAllowed,
  useUserProfile,
  useWithdraw,
} from "../hooks/useQueries";
import { getCurrencySymbol, getRegionCurrency } from "../utils/regionDetect";

// ─── Method Config ────────────────────────────────────────────────────────────

interface MethodConfig {
  id: string;
  name: string;
  icon: string;
  borderColor: string;
  glowColor: string;
  labelColor: string;
  placeholder: string;
}

const INDIA_METHODS: MethodConfig[] = [
  {
    id: "upi_gpay",
    name: "Google Pay",
    icon: "💳",
    borderColor: "rgba(38,214,255,0.45)",
    glowColor: "rgba(38,214,255,0.15)",
    labelColor: "oklch(0.82 0.18 210)",
    placeholder: "yourname@okicici",
  },
  {
    id: "upi_phonepe",
    name: "PhonePe",
    icon: "📲",
    borderColor: "rgba(123,77,255,0.5)",
    glowColor: "rgba(123,77,255,0.15)",
    labelColor: "oklch(0.72 0.22 280)",
    placeholder: "91XXXXXXXXXX@ybl",
  },
  {
    id: "upi_paytm",
    name: "Paytm",
    icon: "🔵",
    borderColor: "rgba(38,150,255,0.5)",
    glowColor: "rgba(38,150,255,0.15)",
    labelColor: "oklch(0.72 0.18 230)",
    placeholder: "91XXXXXXXXXX@paytm",
  },
  {
    id: "upi_generic",
    name: "UPI / BHIM",
    icon: "💸",
    borderColor: "rgba(0,230,118,0.45)",
    glowColor: "rgba(0,230,118,0.12)",
    labelColor: "oklch(0.75 0.22 160)",
    placeholder: "yourname@upi",
  },
];

const NEPAL_METHODS: MethodConfig[] = [
  {
    id: "esewa",
    name: "eSewa",
    icon: "🟢",
    borderColor: "rgba(0,230,118,0.5)",
    glowColor: "rgba(0,230,118,0.15)",
    labelColor: "oklch(0.75 0.22 160)",
    placeholder: "98XXXXXXXX",
  },
  {
    id: "khalti",
    name: "Khalti",
    icon: "🟣",
    borderColor: "rgba(123,77,255,0.55)",
    glowColor: "rgba(123,77,255,0.18)",
    labelColor: "oklch(0.72 0.22 280)",
    placeholder: "98XXXXXXXX",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TransactionStatus }) {
  if (
    status === TransactionStatus.approved ||
    status === TransactionStatus.completed
  )
    return <span className="badge-status-approved">✓ Approved</span>;
  if (status === TransactionStatus.rejected)
    return <span className="badge-status-rejected">✗ Rejected</span>;
  return <span className="badge-status-pending">⏳ Pending</span>;
}

function formatDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function expectedByDate(ns: bigint) {
  const ms = Number(ns / 1_000_000n) + 7 * 24 * 60 * 60 * 1000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

type WalletTab = "overview" | "withdraw" | "history";

export default function WalletPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  const { data: userProfile } = useUserProfile();
  const { data: isWithdrawalAllowed } = useIsWithdrawalAllowed();
  const { data: allTransactions } = useAllTransactions();
  const withdraw = useWithdraw();

  const currency = getRegionCurrency();
  const symbol = getCurrencySymbol(currency);
  const minAmount = currency === "NPR" ? 200 : 100;
  const methods = currency === "NPR" ? NEPAL_METHODS : INDIA_METHODS;

  const [activeTab, setActiveTab] = useState<WalletTab>("overview");
  const [selectedMethod, setSelectedMethod] = useState<MethodConfig | null>(
    null,
  );
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [screenshotB64, setScreenshotB64] = useState<string>("");
  const [screenshotName, setScreenshotName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isInitializing && !identity) navigate({ to: "/" });
  }, [identity, isInitializing, navigate]);

  if (isInitializing || !identity) return null;

  const balance = Number(userProfile?.balance ?? 0n);
  const referralEarnings = Number(userProfile?.referralEarnings ?? 0n);
  const vipTier = userProfile?.vipTier;

  const withdrawalHistory = (allTransactions ?? []).filter(
    (tx) => tx.txType === TransactionType.withdrawal,
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setFormError("Screenshot must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotB64((ev.target?.result as string) ?? "");
      setScreenshotName(file.name);
      setFormError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    setFormError("");
    const parsed = Number.parseFloat(amount);
    if (!selectedMethod) {
      setFormError("Please select a payment method.");
      return;
    }
    if (!accountId.trim()) {
      setFormError("Please enter your UPI ID / wallet number.");
      return;
    }
    if (Number.isNaN(parsed) || parsed < minAmount) {
      setFormError(`Minimum withdrawal is ${symbol}${minAmount}.`);
      return;
    }
    if (parsed > balance) {
      setFormError(`You only have ${symbol}${balance} available.`);
      return;
    }
    const notes = JSON.stringify({
      method: selectedMethod.id,
      accountId: accountId.trim(),
      screenshot: screenshotB64,
    });
    try {
      await withdraw.mutateAsync({
        amount: BigInt(Math.round(parsed * 100)),
        paymentMethod: selectedMethod.id,
        extraNotes: notes,
      });
      setSubmitted(true);
    } catch {
      setFormError("Submission failed. Please try again.");
    }
  }

  function resetForm() {
    setSelectedMethod(null);
    setAccountId("");
    setAmount("");
    setScreenshotB64("");
    setScreenshotName("");
    setFormError("");
    setSubmitted(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="pt-16 pb-16 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* ── Balance Summary ──────────────────────────────────────────── */}
        <div
          className="neon-card-wallet p-5"
          data-ocid="wallet.balance_summary"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 neon-text-cyan" />
            <h1 className="font-display font-black text-xl gradient-text">
              My Wallet
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="stat-card text-center"
              data-ocid="wallet.total_balance"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Available Balance
              </div>
              <div className="font-display font-black text-2xl neon-text-cyan">
                {symbol}
                {balance.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Unlocked
              </div>
            </div>
            <div
              className="stat-card text-center"
              data-ocid="wallet.referral_earnings"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Referral Bonus
              </div>
              <div
                className="font-display font-black text-2xl"
                style={{ color: "oklch(0.72 0.22 280)" }}
              >
                {symbol}
                {referralEarnings.toLocaleString("en-IN")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Lifetime
              </div>
            </div>
          </div>

          {/* VIP + withdrawal status row */}
          <div className="flex gap-2 mt-3">
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(123,77,255,0.08)",
                border: "1px solid rgba(123,77,255,0.25)",
              }}
            >
              <CreditCard
                className="w-4 h-4 shrink-0"
                style={{ color: "oklch(0.72 0.22 280)" }}
              />
              <div>
                <div className="text-xs text-muted-foreground leading-none">
                  VIP
                </div>
                <div className="text-xs font-bold text-foreground leading-tight">
                  {vipTier
                    ? `${vipTier.charAt(0).toUpperCase()}${vipTier.slice(1)}`
                    : "None"}
                </div>
              </div>
            </div>
            <div
              className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: isWithdrawalAllowed
                  ? "rgba(0,230,118,0.07)"
                  : "rgba(255,60,60,0.07)",
                border: isWithdrawalAllowed
                  ? "1px solid rgba(0,230,118,0.25)"
                  : "1px solid rgba(255,60,60,0.25)",
              }}
            >
              {isWithdrawalAllowed ? (
                <CheckCircle
                  className="w-4 h-4 shrink-0"
                  style={{ color: "oklch(0.75 0.22 160)" }}
                />
              ) : (
                <ShieldAlert
                  className="w-4 h-4 shrink-0"
                  style={{ color: "oklch(0.65 0.24 27)" }}
                />
              )}
              <div>
                <div className="text-xs text-muted-foreground leading-none">
                  Withdrawals
                </div>
                <div
                  className="text-xs font-bold leading-tight"
                  style={{
                    color: isWithdrawalAllowed
                      ? "oklch(0.75 0.22 160)"
                      : "oklch(0.65 0.24 27)",
                  }}
                >
                  {isWithdrawalAllowed ? "Open" : "Paused"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Revenue Safety Gate (prominent when paused) ─────────────── */}
        {isWithdrawalAllowed === false && (
          <div
            className="p-4 rounded-xl flex items-start gap-3"
            style={{
              background: "rgba(255,40,40,0.06)",
              border: "1px solid rgba(255,60,60,0.35)",
              boxShadow:
                "0 0 24px rgba(255,60,60,0.18), inset 0 1px 0 rgba(255,60,60,0.1)",
            }}
            data-ocid="wallet.withdrawal_paused_banner"
          >
            <AlertTriangle
              className="w-6 h-6 shrink-0 mt-0.5"
              style={{ color: "oklch(0.65 0.24 27)" }}
            />
            <div>
              <div
                className="font-display font-bold text-sm mb-1"
                style={{ color: "oklch(0.75 0.22 27)" }}
              >
                Withdrawals Temporarily Paused
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Platform revenue is being processed. Withdrawals are only
                released when total revenue exceeds total payouts. Try again
                later.
              </p>
            </div>
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          {(["overview", "withdraw", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-display uppercase transition-all ${
                activeTab === tab ? "neon-btn-primary" : "neon-btn"
              }`}
              data-ocid={`wallet.tab_${tab}`}
            >
              {tab === "overview"
                ? "📊 Overview"
                : tab === "withdraw"
                  ? "💸 Withdraw"
                  : "📜 History"}
            </button>
          ))}
        </div>

        {/* ══════════════════ TAB: OVERVIEW ══════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="neon-card p-4 space-y-2">
              <h3 className="font-display font-bold text-sm mb-3 text-foreground">
                Withdrawal Rules
              </h3>
              {[
                ["Minimum Amount", currency === "NPR" ? "NPR 200" : "₹100"],
                [
                  "Payment Methods",
                  currency === "NPR"
                    ? "eSewa / Khalti"
                    : "UPI / Paytm / GPay / PhonePe",
                ],
                ["Processing Time", "3–7 Business Days"],
                ["Approval", "Manual admin review required"],
                ["Safety Gate", "Revenue must exceed total payouts"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-medium text-foreground text-xs text-right max-w-[55%] truncate">
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("withdraw")}
              disabled={isWithdrawalAllowed === false}
              className="w-full neon-btn-primary py-3 text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              data-ocid="wallet.go_withdraw_cta"
            >
              💸 Request Withdrawal
            </button>

            {withdrawalHistory.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className="w-full neon-btn py-2.5 text-xs font-bold"
                data-ocid="wallet.go_history_cta"
              >
                📜 View Withdrawal History ({withdrawalHistory.length})
              </button>
            )}
          </div>
        )}

        {/* ══════════════════ TAB: WITHDRAW ══════════════════ */}
        {activeTab === "withdraw" && (
          <div className="space-y-4">
            {/* Hard block */}
            {isWithdrawalAllowed === false ? (
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  background: "rgba(255,40,40,0.05)",
                  border: "1px solid rgba(255,60,60,0.3)",
                  boxShadow: "0 0 30px rgba(255,60,60,0.15)",
                }}
                data-ocid="withdraw.blocked_state"
              >
                <ShieldAlert
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.65 0.24 27)" }}
                />
                <h3
                  className="font-display font-bold text-base mb-2"
                  style={{ color: "oklch(0.75 0.22 27)" }}
                >
                  Withdrawals Are Paused
                </h3>
                <p className="text-sm text-muted-foreground">
                  Withdrawals are temporarily disabled — platform revenue is
                  being processed. All actions are blocked until the revenue
                  gate is cleared. Please try again later.
                </p>
              </div>
            ) : submitted ? (
              /* ── Success State ── */
              <div
                className="p-6 rounded-xl text-center"
                style={{
                  background: "rgba(0,230,118,0.06)",
                  border: "1px solid rgba(0,230,118,0.3)",
                  boxShadow: "0 0 30px rgba(0,230,118,0.12)",
                }}
                data-ocid="withdraw.success_state"
              >
                <CheckCircle
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.75 0.22 160)" }}
                />
                <h3
                  className="font-display font-bold text-base mb-2"
                  style={{ color: "oklch(0.75 0.22 160)" }}
                >
                  Request Submitted!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your withdrawal is queued for admin approval. Processing time:
                  3–7 business days.
                </p>
                <button
                  type="button"
                  onClick={resetForm}
                  className="neon-btn px-6 py-2 text-sm font-bold"
                >
                  New Request
                </button>
              </div>
            ) : (
              /* ── Form Flow ── */
              <>
                {/* Method grid */}
                {!selectedMethod && (
                  <div className="neon-card-wallet p-5">
                    <h3 className="font-display font-bold text-sm mb-4 text-foreground">
                      Select Withdrawal Method
                    </h3>
                    <div
                      className="grid grid-cols-2 gap-3"
                      data-ocid="withdraw.method_grid"
                    >
                      {methods.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedMethod(m);
                            setFormError("");
                          }}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: "rgba(10,8,30,0.6)",
                            border: `1px solid ${m.borderColor}`,
                            boxShadow: `0 0 18px ${m.glowColor}`,
                          }}
                          data-ocid={`withdraw.method_${m.id}`}
                        >
                          <span className="text-2xl">{m.icon}</span>
                          <span
                            className="font-display font-bold text-xs text-center"
                            style={{ color: m.labelColor }}
                          >
                            {m.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Withdrawal form */}
                {selectedMethod && (
                  <div className="neon-card-wallet p-5 space-y-4">
                    {/* Selected method header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{selectedMethod.icon}</span>
                        <span
                          className="font-display font-bold text-sm"
                          style={{ color: selectedMethod.labelColor }}
                        >
                          {selectedMethod.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod(null);
                          setFormError("");
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        data-ocid="withdraw.change_method_btn"
                      >
                        ← Change
                      </button>
                    </div>

                    <div
                      className="w-full h-px"
                      style={{ background: `${selectedMethod.borderColor}` }}
                    />

                    {/* Account ID */}
                    <div>
                      <label
                        htmlFor="wd-account"
                        className="block text-xs text-muted-foreground mb-1.5"
                      >
                        {currency === "NPR" ? "Wallet Number" : "UPI ID"} *
                      </label>
                      <input
                        id="wd-account"
                        type="text"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder={selectedMethod.placeholder}
                        className="neon-input w-full px-3 py-2.5 text-sm"
                        data-ocid="withdraw.account_input"
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label
                        htmlFor="wd-amount"
                        className="block text-xs text-muted-foreground mb-1.5"
                      >
                        Amount ({symbol}) — Min {symbol}
                        {minAmount} *
                      </label>
                      <input
                        id="wd-amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`${minAmount}`}
                        min={minAmount}
                        max={balance}
                        className="neon-input w-full px-3 py-2.5 text-sm"
                        data-ocid="withdraw.amount_input"
                      />
                      {amount && Number.parseFloat(amount) < minAmount && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "oklch(0.65 0.24 27)" }}
                        >
                          Minimum is {symbol}
                          {minAmount}
                        </p>
                      )}
                      {amount && Number.parseFloat(amount) > balance && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "oklch(0.65 0.24 27)" }}
                        >
                          Exceeds your balance ({symbol}
                          {balance})
                        </p>
                      )}
                    </div>

                    {/* Screenshot upload */}
                    <div>
                      <label
                        htmlFor="wd-screenshot"
                        className="block text-xs text-muted-foreground mb-1.5"
                      >
                        Account Screenshot (optional, max 2 MB)
                      </label>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-full neon-btn py-3 text-xs font-medium flex items-center justify-center gap-2"
                        data-ocid="withdraw.screenshot_btn"
                      >
                        <ImageIcon className="w-4 h-4" />
                        {screenshotName || "Upload Screenshot"}
                      </button>
                      <input
                        id="wd-screenshot"
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                      {screenshotB64 && (
                        <img
                          src={screenshotB64}
                          alt="preview"
                          className="mt-2 rounded-xl w-full object-cover max-h-36"
                          style={{ border: "1px solid rgba(38,214,255,0.25)" }}
                        />
                      )}
                    </div>

                    {/* Error */}
                    {formError && (
                      <div
                        className="flex items-center gap-2 p-3 rounded-xl text-xs"
                        style={{
                          background: "rgba(255,60,60,0.08)",
                          border: "1px solid rgba(255,60,60,0.3)",
                          color: "oklch(0.75 0.22 27)",
                        }}
                        data-ocid="withdraw.form_error"
                      >
                        <XCircle className="w-4 h-4 shrink-0" />
                        {formError}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={withdraw.isPending}
                      className="w-full neon-btn-primary py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                      data-ocid="withdraw.submit_btn"
                    >
                      {withdraw.isPending
                        ? "Submitting…"
                        : "Submit Withdrawal Request"}
                    </button>

                    <p className="text-xs text-muted-foreground text-center">
                      Processed in 3–7 business days after admin approval.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════════════════ TAB: HISTORY ══════════════════ */}
        {activeTab === "history" && (
          <div className="space-y-3" data-ocid="wallet.history_list">
            {withdrawalHistory.length === 0 ? (
              <div className="neon-card p-8 text-center">
                <ArrowDownLeft
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "oklch(0.68 0.05 280)" }}
                />
                <p className="font-display font-bold text-sm text-muted-foreground mb-1">
                  No Withdrawals Yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Your withdrawal history will appear here after you submit a
                  request.
                </p>
              </div>
            ) : (
              withdrawalHistory.map((tx) => (
                <div
                  key={tx.id.toString()}
                  className="neon-card p-4"
                  data-ocid={`wallet.history_row_${tx.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: "oklch(0.65 0.24 27)" }}
                      />
                      <div>
                        <div className="font-display font-bold text-sm text-foreground">
                          {symbol}
                          {(Number(tx.amount) / 100).toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {tx.paymentMethod.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Submitted: {formatDate(tx.createdAt)}
                    </div>
                    {tx.status === TransactionStatus.pending && (
                      <div
                        className="text-xs"
                        style={{ color: "oklch(0.72 0.25 305)" }}
                      >
                        By: {expectedByDate(tx.createdAt)}
                      </div>
                    )}
                    {tx.status === TransactionStatus.approved && (
                      <div
                        className="flex items-center gap-1"
                        style={{ color: "oklch(0.75 0.22 160)" }}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Approved
                      </div>
                    )}
                    {tx.status === TransactionStatus.rejected && (
                      <div
                        className="flex items-center gap-1"
                        style={{ color: "oklch(0.65 0.24 27)" }}
                      >
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
