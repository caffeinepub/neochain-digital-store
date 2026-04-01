import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, Loader2, ShoppingCart, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import { useWithdraw } from "../hooks/useQueries";

const WITHDRAW_METHODS = [
  "eSewa",
  "Khalti",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "SBI Bank",
  "HDFC Bank",
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

function FieldLabel({
  htmlFor,
  children,
}: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
    >
      {children}
    </label>
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

function getPlanColor(color: string) {
  switch (color) {
    case "violet":
      return {
        border: "rgba(123, 77, 255, 0.5)",
        glow: "rgba(123, 77, 255, 0.2)",
        text: "oklch(0.72 0.26 290)",
        bg: "rgba(123, 77, 255, 0.08)",
      };
    case "magenta":
      return {
        border: "rgba(201, 60, 255, 0.5)",
        glow: "rgba(201, 60, 255, 0.2)",
        text: "oklch(0.72 0.28 315)",
        bg: "rgba(201, 60, 255, 0.08)",
      };
    default: // cyan
      return {
        border: "rgba(38, 214, 255, 0.5)",
        glow: "rgba(38, 214, 255, 0.2)",
        text: "oklch(0.82 0.18 210)",
        bg: "rgba(38, 214, 255, 0.08)",
      };
  }
}

export default function WalletModal({
  open,
  onClose,
  userProfile,
  onBuyPlan,
}: WalletModalProps) {
  const withdraw = useWithdraw();

  const [activeTab, setActiveTab] = useState<"withdraw" | "plans">("withdraw");

  // Withdraw state
  const [wFields, setWFields] = useState<WithdrawFields>(EMPTY_WITHDRAW);

  const setW = (key: keyof WithdrawFields, val: string) =>
    setWFields((prev) => ({ ...prev, [key]: val }));

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
        bank: isBankMethod(method) ? method : "",
        amount: amount,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Insufficient balance")) {
        toast.error(
          "Insufficient balance. Please check your available balance.",
        );
      } else if (
        msg.includes("not found") ||
        msg.includes("User not found") ||
        msg.includes("profile not found")
      ) {
        toast.error(
          "Please complete your profile registration first before withdrawing.",
        );
      } else if (msg.includes("Unauthorized")) {
        toast.error("Session expired. Please refresh and login again.");
      } else if (msg.includes("Not connected")) {
        toast.error("Please login first to withdraw.");
      } else if (msg.includes("not registered")) {
        toast.error("Please complete registration before withdrawing.");
      } else {
        toast.error(`Withdrawal failed: ${msg.slice(0, 80)}`);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg w-full p-0 overflow-hidden"
        style={{
          background: "rgba(7, 8, 26, 0.98)",
          border: "1px solid rgba(123, 77, 255, 0.4)",
          boxShadow:
            "0 0 60px rgba(123, 77, 255, 0.15), 0 0 120px rgba(38, 214, 255, 0.08)",
        }}
        data-ocid="wallet.dialog"
      >
        <DialogHeader
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid rgba(123, 77, 255, 0.2)" }}
        >
          <DialogTitle className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(38, 214, 255, 0.1)",
                border: "1px solid rgba(38, 214, 255, 0.3)",
              }}
            >
              <Wallet className="w-4 h-4 neon-text-cyan" />
            </div>
            <span
              className="font-display font-black text-xl neon-text-cyan tracking-widest uppercase"
              style={{ letterSpacing: "0.15em" }}
            >
              Wallet
            </span>
            {userProfile && (
              <span
                className="ml-auto text-sm font-display font-bold px-3 py-1 rounded-lg"
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

        <div className="px-6 pb-6 pt-4 max-h-[75vh] overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "withdraw" | "plans")}
          >
            <TabsList
              className="grid grid-cols-2 w-full mb-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(123,77,255,0.2)",
              }}
            >
              <TabsTrigger
                value="withdraw"
                className="flex items-center gap-2"
                data-ocid="wallet.tab"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </TabsTrigger>
              <TabsTrigger
                value="plans"
                className="flex items-center gap-2"
                data-ocid="wallet.tab"
              >
                <ShoppingCart className="w-4 h-4" /> Buy Plan
              </TabsTrigger>
            </TabsList>

            {/* WITHDRAW TAB */}
            <TabsContent value="withdraw">
              <form onSubmit={handleWithdraw} className="space-y-4">
                {userProfile && (
                  <div
                    className="flex items-center justify-between p-3 rounded-xl text-sm"
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

                {/* Step 1: Select method */}
                <div>
                  <FieldLabel htmlFor="w-w-method">
                    Payment Method <span className="text-red-400">*</span>
                  </FieldLabel>
                  <select
                    id="w-w-method"
                    required
                    className="neon-input w-full px-4 py-2.5 text-sm"
                    value={wFields.method}
                    onChange={(e) => {
                      setWFields({ ...EMPTY_WITHDRAW, method: e.target.value });
                    }}
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

                {/* Step 2: Dynamic fields based on method */}
                {wFields.method && (
                  <>
                    {/* Name */}
                    <div>
                      <FieldLabel htmlFor="w-w-name">
                        Account Holder Name{" "}
                        <span className="text-red-400">*</span>
                      </FieldLabel>
                      <input
                        id="w-w-name"
                        type="text"
                        required
                        className="neon-input w-full px-4 py-2.5 text-sm"
                        placeholder="Full name on account"
                        value={wFields.name}
                        onChange={(e) => setW("name", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>

                    {/* ID field */}
                    <div>
                      <FieldLabel htmlFor="w-w-id">
                        {getIdLabel(wFields.method)}{" "}
                        <span className="text-red-400">*</span>
                      </FieldLabel>
                      <input
                        id="w-w-id"
                        type="text"
                        required
                        className="neon-input w-full px-4 py-2.5 text-sm"
                        placeholder={`Enter your ${getIdLabel(wFields.method)}`}
                        value={wFields.id}
                        onChange={(e) => setW("id", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>

                    {/* Bank-only fields */}
                    {isBankMethod(wFields.method) && (
                      <>
                        <div>
                          <FieldLabel htmlFor="w-w-ifsc">
                            IFSC Code <span className="text-red-400">*</span>
                          </FieldLabel>
                          <input
                            id="w-w-ifsc"
                            type="text"
                            required
                            className="neon-input w-full px-4 py-2.5 text-sm"
                            placeholder="e.g. SBIN0001234"
                            value={wFields.ifsc}
                            onChange={(e) => setW("ifsc", e.target.value)}
                            data-ocid="withdraw.input"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor="w-w-branch">
                            Branch Name <span className="text-red-400">*</span>
                          </FieldLabel>
                          <input
                            id="w-w-branch"
                            type="text"
                            required
                            className="neon-input w-full px-4 py-2.5 text-sm"
                            placeholder="e.g. Mumbai Main Branch"
                            value={wFields.branch}
                            onChange={(e) => setW("branch", e.target.value)}
                            data-ocid="withdraw.input"
                          />
                        </div>
                      </>
                    )}

                    {/* Amount */}
                    <div>
                      <FieldLabel htmlFor="w-w-amount">
                        Amount (₹) <span className="text-red-400">*</span>
                      </FieldLabel>
                      <input
                        id="w-w-amount"
                        type="number"
                        required
                        min="1"
                        className="neon-input w-full px-4 py-2.5 text-sm"
                        placeholder="Enter amount"
                        value={wFields.amount}
                        onChange={(e) => setW("amount", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        12% fee applies. Min withdrawal: ₹100
                      </p>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={withdraw.isPending || !wFields.method}
                  className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-2"
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
            </TabsContent>

            {/* PLANS TAB */}
            <TabsContent value="plans">
              <div className="grid grid-cols-2 gap-3">
                {PLANS.map((plan) => {
                  const c = getPlanColor(plan.color);
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
                        onClick={() => {
                          onBuyPlan(plan);
                        }}
                        className="mt-auto w-full py-2 rounded-lg text-xs font-display font-black uppercase tracking-wider transition-all hover:opacity-90"
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
