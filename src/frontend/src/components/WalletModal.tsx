import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useWithdraw } from "../hooks/useQueries";

// ─── Constants ────────────────────────────────────────────────────────────────

const WITHDRAW_METHODS = [
  { name: "eSewa", icon: "💳", color: "cyan", subtitle: "UPI / Wallet" },
  { name: "Khalti", icon: "🟣", color: "violet", subtitle: "Digital Wallet" },
  { name: "Paytm", icon: "💙", color: "cyan", subtitle: "UPI / Wallet" },
  { name: "PhonePe", icon: "📱", color: "violet", subtitle: "UPI / Wallet" },
  { name: "Google Pay", icon: "🎯", color: "emerald", subtitle: "UPI Payment" },
  { name: "SBI Bank", icon: "🏦", color: "amber", subtitle: "Bank Transfer" },
  { name: "HDFC Bank", icon: "🏛️", color: "rose", subtitle: "Bank Transfer" },
];

const PLANS = [
  { id: 1n, name: "Starter Pack", price: 1500n, commission: 20, color: "cyan" },
  {
    id: 2n,
    name: "Growth Pack",
    price: 3000n,
    commission: 20,
    color: "violet",
  },
  { id: 3n, name: "Pro Pack", price: 5000n, commission: 17, color: "magenta" },
  { id: 4n, name: "Elite Pack", price: 8000n, commission: 15, color: "cyan" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getColor(color: string) {
  switch (color) {
    case "violet":
      return {
        border: "rgba(123, 77, 255, 0.5)",
        glow: "rgba(123, 77, 255, 0.2)",
        text: "oklch(0.72 0.26 290)",
        bg: "rgba(123, 77, 255, 0.08)",
        activeBg: "rgba(123, 77, 255, 0.18)",
        shadowGlow: "rgba(123, 77, 255, 0.25)",
      };
    case "magenta":
      return {
        border: "rgba(201, 60, 255, 0.5)",
        glow: "rgba(201, 60, 255, 0.2)",
        text: "oklch(0.72 0.28 315)",
        bg: "rgba(201, 60, 255, 0.08)",
        activeBg: "rgba(201, 60, 255, 0.18)",
        shadowGlow: "rgba(201, 60, 255, 0.25)",
      };
    case "emerald":
      return {
        border: "rgba(52, 211, 153, 0.5)",
        glow: "rgba(52, 211, 153, 0.2)",
        text: "oklch(0.76 0.18 160)",
        bg: "rgba(52, 211, 153, 0.07)",
        activeBg: "rgba(52, 211, 153, 0.15)",
        shadowGlow: "rgba(52, 211, 153, 0.25)",
      };
    case "amber":
      return {
        border: "rgba(251, 191, 36, 0.5)",
        glow: "rgba(251, 191, 36, 0.2)",
        text: "oklch(0.80 0.18 85)",
        bg: "rgba(251, 191, 36, 0.06)",
        activeBg: "rgba(251, 191, 36, 0.15)",
        shadowGlow: "rgba(251, 191, 36, 0.22)",
      };
    case "rose":
      return {
        border: "rgba(251, 113, 133, 0.5)",
        glow: "rgba(251, 113, 133, 0.2)",
        text: "oklch(0.74 0.20 10)",
        bg: "rgba(251, 113, 133, 0.07)",
        activeBg: "rgba(251, 113, 133, 0.15)",
        shadowGlow: "rgba(251, 113, 133, 0.22)",
      };
    default: // cyan
      return {
        border: "rgba(38, 214, 255, 0.5)",
        glow: "rgba(38, 214, 255, 0.2)",
        text: "oklch(0.82 0.18 210)",
        bg: "rgba(38, 214, 255, 0.08)",
        activeBg: "rgba(38, 214, 255, 0.18)",
        shadowGlow: "rgba(38, 214, 255, 0.25)",
      };
  }
}

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
      return "Paytm Number / UPI ID";
    case "PhonePe":
      return "PhonePe Number / UPI ID";
    case "Google Pay":
      return "Google Pay Number / UPI ID";
    case "SBI Bank":
    case "HDFC Bank":
      return "Account Number";
    default:
      return "Account / ID";
  }
}

function getIdPlaceholder(method: string): string {
  switch (method) {
    case "eSewa":
      return "e.g. 9800000000";
    case "Khalti":
      return "e.g. 9800000000";
    case "Paytm":
      return "e.g. 9800000000 or user@paytm";
    case "PhonePe":
      return "e.g. 9800000000 or user@ybl";
    case "Google Pay":
      return "e.g. 9800000000 or user@okicici";
    case "SBI Bank":
    case "HDFC Bank":
      return "e.g. 12345678901234";
    default:
      return "Enter your ID";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onBuyPlan: (plan: {
    id: bigint;
    name: string;
    price: bigint;
    commission: number;
  }) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WalletModal({
  open,
  onClose,
  userProfile,
  onBuyPlan,
}: WalletModalProps) {
  const withdraw = useWithdraw();
  const [activeTab, setActiveTab] = useState<"withdraw" | "plans">("withdraw");

  // Withdraw steps: "select" → "form" → "success"
  const [wStep, setWStep] = useState<"select" | "form" | "success">("select");
  const [selectedMethod, setSelectedMethod] = useState<
    (typeof WITHDRAW_METHODS)[0] | null
  >(null);
  const [wFields, setWFields] = useState<WithdrawFields>(EMPTY_WITHDRAW);

  const setW = (key: keyof WithdrawFields, val: string) =>
    setWFields((prev) => ({ ...prev, [key]: val }));

  const handleSelectMethod = (m: (typeof WITHDRAW_METHODS)[0]) => {
    setSelectedMethod(m);
    setWFields({ ...EMPTY_WITHDRAW, method: m.name });
    setWStep("form");
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
    const amountNum = Number.parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      toast.error("Invalid amount");
      return;
    }
    if (amountNum < 100) {
      toast.error("Minimum withdrawal amount is ₹100");
      return;
    }
    const amountBig = BigInt(Math.floor(amountNum));
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
        bank: isBankMethod(method) ? method : "",
        amount,
      });
      await withdraw.mutateAsync({
        amount: amountBig,
        paymentMethod: method,
        extraNotes,
      });
      setWStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Insufficient balance")) {
        toast.error(
          "Insufficient balance. Please check your available balance.",
        );
      } else if (
        msg.includes("not found") ||
        msg.includes("profile not found")
      ) {
        toast.error("Please complete your profile registration first.");
      } else if (msg.includes("Unauthorized")) {
        toast.error("Session expired. Please refresh and login again.");
      } else if (
        msg.includes("Not connected") ||
        msg.includes("not registered")
      ) {
        toast.error("Please login first to withdraw.");
      } else {
        toast.error(`Withdrawal failed: ${msg.slice(0, 80)}`);
      }
    }
  };

  const handleClose = () => {
    setWStep("select");
    setSelectedMethod(null);
    setWFields(EMPTY_WITHDRAW);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-lg w-full p-0 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.10 0.04 280), oklch(0.07 0.02 260))",
          border: "1px solid rgba(123, 77, 255, 0.4)",
          boxShadow:
            "0 0 60px rgba(123, 77, 255, 0.15), 0 0 120px rgba(38, 214, 255, 0.08)",
        }}
        data-ocid="wallet.dialog"
      >
        {/* Header */}
        <DialogHeader
          className="px-5 pt-5 pb-3"
          style={{ borderBottom: "1px solid rgba(123, 77, 255, 0.2)" }}
        >
          <DialogTitle className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(38, 214, 255, 0.1)",
                border: "1px solid rgba(38, 214, 255, 0.3)",
              }}
            >
              <Wallet className="w-3.5 h-3.5 neon-text-cyan" />
            </div>
            <span
              className="font-display font-black text-lg neon-text-cyan tracking-widest uppercase"
              style={{ letterSpacing: "0.12em" }}
            >
              Wallet
            </span>
            {userProfile && (
              <span
                className="ml-auto text-sm font-display font-bold px-2.5 py-1 rounded-lg"
                style={{
                  background: "rgba(38, 214, 255, 0.08)",
                  border: "1px solid rgba(38, 214, 255, 0.2)",
                }}
              >
                ₹{Number(userProfile.balance).toLocaleString("en-IN")}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-5 pt-3 max-h-[78vh] overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "withdraw" | "plans");
              if (v === "withdraw") {
                setWStep("select");
                setSelectedMethod(null);
                setWFields(EMPTY_WITHDRAW);
              }
            }}
          >
            <TabsList
              className="grid grid-cols-2 w-full mb-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(123,77,255,0.2)",
                height: "36px",
              }}
            >
              <TabsTrigger
                value="withdraw"
                className="flex items-center gap-1.5 text-xs"
                data-ocid="wallet.tab"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Withdraw
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="flex items-center gap-1.5 text-xs"
                data-ocid="wallet.tab"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Buy Plan
              </TabsTrigger>
            </TabsList>

            {/* ─── WITHDRAW TAB ─────────────────────────────────────── */}
            <TabsContent value="withdraw">
              <AnimatePresence mode="wait">
                {/* SUCCESS */}
                {wStep === "success" && (
                  <motion.div
                    key="w-success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                    data-ocid="withdraw.success_state"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                      style={{
                        background: "rgba(52,211,153,0.15)",
                        border: "1px solid rgba(52,211,153,0.4)",
                        boxShadow: "0 0 24px rgba(52,211,153,0.2)",
                      }}
                    >
                      ✓
                    </div>
                    <h3 className="font-display font-bold text-2xl text-emerald-400 mb-2">
                      Request Submitted!
                    </h3>
                    <p className="text-muted-foreground mb-1 text-sm">
                      Your withdrawal request has been submitted successfully.
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Admin will process it within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setWStep("select");
                        setSelectedMethod(null);
                        setWFields(EMPTY_WITHDRAW);
                      }}
                      className="neon-btn-primary mt-6 px-8 py-2.5 text-sm font-semibold"
                      data-ocid="withdraw.done_button"
                    >
                      Done
                    </button>
                  </motion.div>
                )}

                {/* SELECT METHOD */}
                {wStep === "select" && (
                  <motion.div
                    key="w-select"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Balance Card */}
                    {userProfile && (
                      <div
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm mb-3"
                        style={{
                          background: "rgba(38, 214, 255, 0.05)",
                          border: "1px solid rgba(38, 214, 255, 0.15)",
                        }}
                      >
                        <span className="text-muted-foreground text-xs">
                          Available Balance
                        </span>
                        <span className="neon-text-cyan font-display font-bold">
                          ₹{Number(userProfile.balance).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mb-3 text-center">
                      Select withdrawal method
                    </p>

                    <div
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                      data-ocid="withdraw.method_grid"
                    >
                      {WITHDRAW_METHODS.map((m) => {
                        const c = getColor(m.color);
                        return (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => handleSelectMethod(m)}
                            className="group relative rounded-xl p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: `1px solid ${c.border}`,
                              boxShadow: `0 2px 10px ${c.shadowGlow}`,
                            }}
                            data-ocid="withdraw.method_button"
                          >
                            <div className="text-2xl mb-2">{m.icon}</div>
                            <div
                              className="font-display font-bold text-sm leading-tight"
                              style={{ color: c.text }}
                            >
                              {m.name}
                            </div>
                            <div className="text-muted-foreground text-xs mt-0.5">
                              {m.subtitle}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-3">
                      12% fee applies · Min withdrawal ₹100
                    </p>
                  </motion.div>
                )}

                {/* FORM */}
                {wStep === "form" && selectedMethod && (
                  <motion.div
                    key="w-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Back + Method badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWStep("select");
                          setSelectedMethod(null);
                        }}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to methods
                      </button>
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ml-auto"
                        style={{
                          background: getColor(selectedMethod.color).bg,
                          border: `1px solid ${getColor(selectedMethod.color).border}`,
                          color: getColor(selectedMethod.color).text,
                          boxShadow: `0 0 8px ${getColor(selectedMethod.color).shadowGlow}`,
                        }}
                      >
                        <span>{selectedMethod.icon}</span>
                        <span>{selectedMethod.name}</span>
                      </div>
                    </div>

                    {/* Balance */}
                    {userProfile && (
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs mb-4"
                        style={{
                          background: "rgba(38, 214, 255, 0.05)",
                          border: "1px solid rgba(38, 214, 255, 0.15)",
                        }}
                      >
                        <span className="text-muted-foreground">
                          Available Balance
                        </span>
                        <span className="neon-text-cyan font-display font-bold">
                          ₹{Number(userProfile.balance).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <form onSubmit={handleWithdraw} className="space-y-3">
                      {/* Account Holder Name */}
                      <div>
                        <label
                          htmlFor="w-name"
                          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                        >
                          Account Holder Name{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="w-name"
                          type="text"
                          required
                          className="neon-input w-full px-3 py-2 text-sm"
                          placeholder="Full name on account"
                          value={wFields.name}
                          onChange={(e) => setW("name", e.target.value)}
                          data-ocid="withdraw.input"
                        />
                      </div>

                      {/* ID Field */}
                      <div>
                        <label
                          htmlFor="w-id"
                          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                        >
                          {getIdLabel(wFields.method)}{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="w-id"
                          type="text"
                          required
                          className="neon-input w-full px-3 py-2 text-sm"
                          placeholder={getIdPlaceholder(wFields.method)}
                          value={wFields.id}
                          onChange={(e) => setW("id", e.target.value)}
                          data-ocid="withdraw.input"
                        />
                      </div>

                      {/* Bank-only fields */}
                      {isBankMethod(wFields.method) && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="w-ifsc"
                              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                            >
                              IFSC Code <span className="text-red-400">*</span>
                            </label>
                            <input
                              id="w-ifsc"
                              type="text"
                              required
                              className="neon-input w-full px-3 py-2 text-sm"
                              placeholder="e.g. SBIN0001234"
                              value={wFields.ifsc}
                              onChange={(e) => setW("ifsc", e.target.value)}
                              data-ocid="withdraw.input"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor="w-branch"
                              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                            >
                              Branch Name{" "}
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              id="w-branch"
                              type="text"
                              required
                              className="neon-input w-full px-3 py-2 text-sm"
                              placeholder="e.g. Mumbai Main"
                              value={wFields.branch}
                              onChange={(e) => setW("branch", e.target.value)}
                              data-ocid="withdraw.input"
                            />
                          </div>
                        </div>
                      )}

                      {/* Amount */}
                      <div>
                        <label
                          htmlFor="w-amount"
                          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
                        >
                          Amount (₹) <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="w-amount"
                          type="number"
                          required
                          min="100"
                          className="neon-input w-full px-3 py-2 text-sm"
                          placeholder="Enter amount (min ₹100)"
                          value={wFields.amount}
                          onChange={(e) => setW("amount", e.target.value)}
                          data-ocid="withdraw.input"
                        />
                        {wFields.amount && Number(wFields.amount) > 0 && (
                          <div className="flex justify-between mt-1 text-xs">
                            <span className="text-muted-foreground">
                              12% fee: ₹
                              {(Number(wFields.amount) * 0.12).toFixed(0)}
                            </span>
                            <span className="text-emerald-400 font-semibold">
                              You get: ₹
                              {(Number(wFields.amount) * 0.88).toFixed(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={withdraw.isPending}
                        className="neon-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold mt-1"
                        data-ocid="withdraw.submit_button"
                      >
                        {withdraw.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            Processing...
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-4 h-4" /> Submit
                            Withdrawal
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ─── BUY PLAN TAB ─────────────────────────────────────── */}
            <TabsContent value="plans">
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((plan) => {
                  const c = getColor(plan.color);
                  return (
                    <div
                      key={plan.id.toString()}
                      className="rounded-xl p-3 flex flex-col gap-2"
                      style={{
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        boxShadow: `0 0 15px ${c.glow}`,
                      }}
                    >
                      <div
                        className="text-xs font-display font-black uppercase tracking-wider"
                        style={{ color: c.text }}
                      >
                        {plan.name}
                      </div>
                      <div className="text-xl font-display font-black text-foreground">
                        ₹{Number(plan.price).toLocaleString("en-IN")}
                      </div>
                      <div
                        className="text-xs px-2 py-0.5 rounded-full text-center font-semibold w-fit"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: `1px solid ${c.border}`,
                          color: c.text,
                        }}
                      >
                        {plan.commission}% Referral
                      </div>
                      <button
                        type="button"
                        onClick={() => onBuyPlan(plan)}
                        className="mt-auto w-full py-2 rounded-lg text-xs font-display font-black uppercase tracking-wider transition-all hover:opacity-90 active:scale-[0.97]"
                        style={{
                          background: `linear-gradient(135deg, ${c.border}, ${c.glow})`,
                          border: `1px solid ${c.border}`,
                          color: "#fff",
                          boxShadow: `0 0 12px ${c.glow}`,
                        }}
                        data-ocid="plans.primary_button"
                      >
                        Buy Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
