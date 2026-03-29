import {
  ArrowDownLeft,
  ArrowUpRight,
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
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Transaction } from "../backend.d";
import { TransactionStatus, TransactionType } from "../backend.d";
import {
  useAllTransactions,
  useDeposit,
  usePaymentMethods,
  useUserProfile,
  useWithdraw,
} from "../hooks/useQueries";

const PAYMENT_METHODS_DEFAULT = [
  "eSewa",
  "Khalti",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "USD Payment",
  "Bybit Pay",
];

const WITHDRAW_METHODS = [
  "eSewa",
  "Khalti",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "SBI Bank",
  "HDFC Bank",
];

function isBankMethod(method: string) {
  return method === "SBI Bank" || method === "HDFC Bank";
}

function getIdLabel(method: string): string {
  switch (method) {
    case "eSewa":
      return "eSewa ID";
    case "Khalti":
      return "Khalti ID";
    case "Paytm":
      return "Paytm Number or UPI ID";
    case "PhonePe":
      return "PhonePe Number or UPI ID";
    case "Google Pay":
      return "Google Pay Number or UPI ID";
    case "SBI Bank":
    case "HDFC Bank":
      return "Account Number";
    default:
      return "Account / ID";
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    rejected: "text-red-400 bg-red-400/10 border-red-400/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${styles[status] ?? "text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ txType }: { txType: string }) {
  const icons: Record<string, string> = {
    deposit: "↑",
    withdrawal: "↓",
    referral_bonus: "★",
    purchase: "◈",
  };
  const label = txType.replace("_", " ");
  return (
    <span className="inline-flex items-center gap-1 text-sm font-mono text-muted-foreground">
      <span className="neon-text-cyan">{icons[txType] ?? "•"}</span> {label}
    </span>
  );
}

type WithdrawFields = {
  method: string;
  name: string;
  id: string;
  ifsc: string;
  branch: string;
  amount: string;
};

const EMPTY_WITHDRAW: WithdrawFields = {
  method: "",
  name: "",
  id: "",
  ifsc: "",
  branch: "",
  amount: "",
};

export default function Dashboard() {
  const {
    data: userProfile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useUserProfile();
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: paymentMethodsData } = usePaymentMethods();
  const deposit = useDeposit();
  const withdraw = useWithdraw();

  const [dName, setDName] = useState("");
  const [dTxId, setDTxId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("");
  const [dScreenshot, setDScreenshot] = useState<File | null>(null);

  const [wFields, setWFields] = useState<WithdrawFields>(EMPTY_WITHDRAW);
  const setW = (key: keyof WithdrawFields, val: string) =>
    setWFields((prev) => ({ ...prev, [key]: val }));

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const [copied, setCopied] = useState(false);

  const paymentMethods =
    paymentMethodsData == null
      ? PAYMENT_METHODS_DEFAULT
      : paymentMethodsData.length === 0
        ? []
        : paymentMethodsData.map((m) => m.name);

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

  // Income calculations
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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dTxId || !depositAmount || !depositMethod) {
      toast.error("Transaction ID, Amount, and Payment Method are required");
      return;
    }
    const amount = BigInt(Math.floor(Number.parseFloat(depositAmount)));
    if (amount <= 0n) {
      toast.error("Invalid amount");
      return;
    }
    try {
      const screenshotBase64 = dScreenshot
        ? await fileToBase64(dScreenshot)
        : "";
      const extraNotes = JSON.stringify({
        type: "deposit",
        name: dName,
        txId: dTxId,
        screenshot: screenshotBase64,
      });
      await deposit.mutateAsync({
        amount,
        paymentMethod: depositMethod,
        extraNotes,
      });
      toast.success("Deposit request submitted!");
      setDName("");
      setDTxId("");
      setDepositAmount("");
      setDepositMethod("");
      setDScreenshot(null);
      refetchProfile();
    } catch {
      toast.error("Deposit failed. Please try again.");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const { method, name, id, ifsc, branch, amount } = wFields;
    if (!method || !name || !id || !amount) {
      toast.error("Please fill all required fields");
      return;
    }
    if (isBankMethod(method) && (!ifsc || !branch)) {
      toast.error("IFSC Code and Branch Name are required for bank withdrawal");
      return;
    }
    const amountBig = BigInt(Math.floor(Number.parseFloat(amount)));
    if (amountBig <= 0n) {
      toast.error("Invalid amount");
      return;
    }
    const balance = userProfile?.balance ?? 0n;
    if (amountBig > balance) {
      toast.error(
        `Insufficient balance. Available: ₹${Number(balance).toLocaleString("en-IN")}`,
      );
      return;
    }
    try {
      const extraNotes = JSON.stringify({
        type: "withdrawal",
        method,
        name,
        id,
        ifsc: ifsc || "",
        branch: branch || "",
      });
      await withdraw.mutateAsync({
        amount: amountBig,
        paymentMethod: method,
        extraNotes,
      });
      toast.success(
        "Withdrawal request submitted! Admin will process it shortly.",
      );
      setWFields(EMPTY_WITHDRAW);
      refetchProfile();
    } catch {
      toast.error("Withdrawal failed. Please try again.");
    }
  };

  const inputClass = "neon-input w-full px-4 py-3 text-sm";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="font-display font-black text-4xl sm:text-5xl gradient-text">
          Dashboard
        </h1>
        {userProfile && (
          <p className="text-muted-foreground mt-2">
            Welcome back,{" "}
            <span className="neon-text-cyan font-semibold">
              {userProfile.username}
            </span>
          </p>
        )}
      </motion.div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              data-ocid="dashboard.loading_state"
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
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

      {/* Income Section - Today / Weekly / Monthly */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
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
            <h2 className="font-display font-bold text-xl">Income Overview</h2>
            <p className="text-muted-foreground text-xs">
              Your earnings breakdown by time period
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today */}
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

          {/* Weekly */}
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

          {/* Monthly */}
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

      {/* Referral */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
              border: `1px solid ${referralActive ? "rgba(52,211,153,0.2)" : "rgba(123,77,255,0.2)"}`,
            }}
          >
            {referralActive ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lock className="w-5 h-5 neon-text-violet" />
            )}
          </div>
          <div>
            <h2 className="font-display font-bold text-xl">Referral System</h2>
            <p className="text-muted-foreground text-sm">
              {referralActive
                ? "Earn 20% on every successful referral"
                : "Complete a purchase to unlock"}
            </p>
          </div>
        </div>
        {referralActive && referralLink ? (
          <div>
            <p className="text-muted-foreground text-sm mb-3">
              Your referral link:
            </p>
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(123,77,255,0.2)",
              }}
            >
              <span className="flex-1 font-mono text-sm neon-text-cyan truncate">
                {referralLink}
              </span>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{
                  background: "rgba(38,214,255,0.1)",
                  border: "1px solid rgba(38,214,255,0.3)",
                }}
                data-ocid="referral.button"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={referralLink}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                data-ocid="referral.link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
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
              href="/#plans"
              className="neon-btn-primary inline-flex items-center gap-2 mt-4 px-6 py-2 text-sm"
              data-ocid="referral.primary_button"
            >
              View Plans
            </a>
          </div>
        )}
      </motion.div>

      {/* Deposit & Withdraw */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* DEPOSIT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="neon-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(38,214,255,0.1)",
                border: "1px solid rgba(38,214,255,0.2)",
              }}
            >
              <ArrowDownLeft className="w-5 h-5 neon-text-cyan" />
            </div>
            <h2 className="font-display font-bold text-xl">Deposit Funds</h2>
          </div>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label htmlFor="d-name" className={labelClass}>
                Full Name
              </label>
              <input
                id="d-name"
                type="text"
                className={inputClass}
                placeholder="Your full name"
                value={dName}
                onChange={(e) => setDName(e.target.value)}
                data-ocid="deposit.input"
              />
            </div>
            <div>
              <label htmlFor="d-txid" className={labelClass}>
                Transaction ID <span className="text-red-400">*</span>
              </label>
              <input
                id="d-txid"
                type="text"
                required
                className={inputClass}
                placeholder="e.g. TXN123456789"
                value={dTxId}
                onChange={(e) => setDTxId(e.target.value)}
                data-ocid="deposit.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="d-amount" className={labelClass}>
                  Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  id="d-amount"
                  type="number"
                  min="1"
                  required
                  className={inputClass}
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  data-ocid="deposit.input"
                />
              </div>
              <div>
                <label htmlFor="d-method" className={labelClass}>
                  Method <span className="text-red-400">*</span>
                </label>
                <select
                  id="d-method"
                  required
                  className={inputClass}
                  value={depositMethod}
                  onChange={(e) => setDepositMethod(e.target.value)}
                  data-ocid="deposit.select"
                >
                  <option value="">Select</option>
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <div className={labelClass}>Payment Screenshot</div>
              <label
                htmlFor="d-screenshot"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(123, 77, 255, 0.3)",
                }}
                data-ocid="deposit.upload_button"
              >
                <span>📎</span>
                {dScreenshot
                  ? dScreenshot.name
                  : "Upload screenshot (optional)"}
                <input
                  id="d-screenshot"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setDScreenshot(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={deposit.isPending}
              className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 font-semibold"
              data-ocid="deposit.submit_button"
            >
              {deposit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-4 h-4" /> Submit Deposit
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* WITHDRAW */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="neon-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(201,60,255,0.1)",
                border: "1px solid rgba(201,60,255,0.2)",
              }}
            >
              <ArrowUpRight className="w-5 h-5 neon-text-magenta" />
            </div>
            <h2 className="font-display font-bold text-xl">Withdraw Funds</h2>
          </div>
          {userProfile && (
            <div
              className="flex items-center justify-between p-3 rounded-xl text-sm mb-4"
              style={{
                background: "rgba(38,214,255,0.05)",
                border: "1px solid rgba(38,214,255,0.15)",
              }}
            >
              <span className="text-muted-foreground">Available Balance</span>
              <span className="neon-text-cyan font-display font-bold">
                ₹{Number(userProfile.balance).toLocaleString("en-IN")}
              </span>
            </div>
          )}
          <form onSubmit={handleWithdraw} className="space-y-4">
            {/* Method selector */}
            <div>
              <label htmlFor="w-method" className={labelClass}>
                Payment Method <span className="text-red-400">*</span>
              </label>
              <select
                id="w-method"
                required
                className={inputClass}
                value={wFields.method}
                onChange={(e) =>
                  setWFields({ ...EMPTY_WITHDRAW, method: e.target.value })
                }
                data-ocid="withdraw.select"
              >
                <option value="">Select withdrawal method</option>
                {WITHDRAW_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {wFields.method && (
              <>
                {/* ID field */}
                <div>
                  <label htmlFor="w-id" className={labelClass}>
                    {getIdLabel(wFields.method)}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="w-id"
                    type="text"
                    required
                    className={inputClass}
                    placeholder={getIdLabel(wFields.method)}
                    value={wFields.id}
                    onChange={(e) => setW("id", e.target.value)}
                    data-ocid="withdraw.input"
                  />
                </div>

                {/* Bank-only fields */}
                {isBankMethod(wFields.method) && (
                  <>
                    <div>
                      <label htmlFor="w-ifsc" className={labelClass}>
                        IFSC Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="w-ifsc"
                        type="text"
                        required
                        className={inputClass}
                        placeholder="e.g. SBIN0001234"
                        value={wFields.ifsc}
                        onChange={(e) => setW("ifsc", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>
                    <div>
                      <label htmlFor="w-branch" className={labelClass}>
                        Branch Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="w-branch"
                        type="text"
                        required
                        className={inputClass}
                        placeholder="e.g. Main Branch, Delhi"
                        value={wFields.branch}
                        onChange={(e) => setW("branch", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>
                  </>
                )}

                {/* Name */}
                <div>
                  <label htmlFor="w-name" className={labelClass}>
                    {isBankMethod(wFields.method)
                      ? "Account Holder Name"
                      : "Name"}{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="w-name"
                    type="text"
                    required
                    className={inputClass}
                    placeholder="Your full name"
                    value={wFields.name}
                    onChange={(e) => setW("name", e.target.value)}
                    data-ocid="withdraw.input"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="w-amount" className={labelClass}>
                    Amount (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="w-amount"
                    type="number"
                    required
                    min="1"
                    className={inputClass}
                    placeholder="Enter amount to withdraw"
                    value={wFields.amount}
                    onChange={(e) => setW("amount", e.target.value)}
                    data-ocid="withdraw.input"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={withdraw.isPending || !wFields.method}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-40"
              style={{
                background: "rgba(201, 60, 255, 0.12)",
                border: "1px solid rgba(201, 60, 255, 0.5)",
                boxShadow: "0 0 20px rgba(201, 60, 255, 0.2)",
                color: "oklch(0.8 0.2 310)",
              }}
              data-ocid="withdraw.submit_button"
            >
              {withdraw.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" /> Submit Withdrawal
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="neon-card p-6"
      >
        <h2 className="font-display font-bold text-xl mb-6">
          Transaction History
        </h2>
        {txLoading ? (
          <div className="space-y-3" data-ocid="transactions.loading_state">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg"
                style={{ background: "rgba(123,77,255,0.1)" }}
              />
            ))}
          </div>
        ) : myTxs.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground"
            data-ocid="transactions.empty_state"
          >
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No transactions yet. Buy a plan to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="transactions.table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(123,77,255,0.2)" }}>
                  {["ID", "Type", "Amount", "Method", "Status", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-3 text-xs uppercase tracking-wider text-muted-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {myTxs.map((tx, i) => (
                  <tr
                    key={tx.id.toString()}
                    className="transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottom: "1px solid rgba(123,77,255,0.1)" }}
                    data-ocid={`transactions.row.${i + 1}`}
                  >
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">
                      #{tx.id.toString()}
                    </td>
                    <td className="py-3 px-3">
                      <TypeBadge txType={String(tx.txType)} />
                    </td>
                    <td className="py-3 px-3 font-display font-bold neon-text-cyan">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={String(tx.status)} />
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-xs">
                      {new Date(
                        Number(tx.createdAt) / 1_000_000,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
