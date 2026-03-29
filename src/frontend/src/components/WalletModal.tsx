import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../backend.d";
import {
  useDeposit,
  usePaymentMethods,
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

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  defaultTab?: "deposit" | "withdraw";
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function WalletModal({
  open,
  onClose,
  userProfile,
  defaultTab = "deposit",
}: WalletModalProps) {
  const deposit = useDeposit();
  const withdraw = useWithdraw();
  const { data: paymentMethodsData } = usePaymentMethods();

  // FIX 8: Controlled tabs that sync when defaultTab prop changes
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(
    defaultTab,
  );
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // FIX 10: Only use fallback when loading (null/undefined), not when empty array
  const paymentMethods =
    paymentMethodsData == null
      ? PAYMENT_METHODS_DEFAULT
      : paymentMethodsData.length === 0
        ? []
        : paymentMethodsData.map((m) => m.name);

  // Deposit state
  const [dName, setDName] = useState("");
  const [dTxId, setDTxId] = useState("");
  const [dAmount, setDAmount] = useState("");
  const [dMethod, setDMethod] = useState("");
  const [dScreenshot, setDScreenshot] = useState<File | null>(null);

  // Withdraw state
  const [wFields, setWFields] = useState<WithdrawFields>(EMPTY_WITHDRAW);

  const setW = (key: keyof WithdrawFields, val: string) =>
    setWFields((prev) => ({ ...prev, [key]: val }));

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dTxId || !dAmount || !dMethod) {
      toast.error("Transaction ID, Amount, and Payment Method are required");
      return;
    }
    const amount = BigInt(Math.floor(Number.parseFloat(dAmount)));
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
      await deposit.mutateAsync({ amount, paymentMethod: dMethod, extraNotes });
      toast.success("Deposit request submitted successfully!");
      setDName("");
      setDTxId("");
      setDAmount("");
      setDMethod("");
      setDScreenshot(null);
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
    } catch {
      toast.error("Withdrawal failed. Please try again.");
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
            onValueChange={(v) => setActiveTab(v as "deposit" | "withdraw")}
          >
            <TabsList
              className="grid grid-cols-2 w-full mb-6"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(123,77,255,0.2)",
              }}
            >
              <TabsTrigger
                value="deposit"
                className="flex items-center gap-2"
                data-ocid="wallet.tab"
              >
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </TabsTrigger>
              <TabsTrigger
                value="withdraw"
                className="flex items-center gap-2"
                data-ocid="wallet.tab"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </TabsTrigger>
            </TabsList>

            {/* DEPOSIT TAB */}
            <TabsContent value="deposit">
              <form onSubmit={handleDeposit} className="space-y-4">
                <div>
                  <FieldLabel htmlFor="w-d-name">Full Name</FieldLabel>
                  <input
                    id="w-d-name"
                    type="text"
                    className="neon-input w-full px-4 py-2.5 text-sm"
                    placeholder="Your full name"
                    value={dName}
                    onChange={(e) => setDName(e.target.value)}
                    data-ocid="deposit.input"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="w-d-txid">
                    Transaction ID <span className="text-red-400">*</span>
                  </FieldLabel>
                  <input
                    id="w-d-txid"
                    type="text"
                    required
                    className="neon-input w-full px-4 py-2.5 text-sm"
                    placeholder="e.g. TXN123456789"
                    value={dTxId}
                    onChange={(e) => setDTxId(e.target.value)}
                    data-ocid="deposit.input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel htmlFor="w-d-amount">
                      Amount (₹) <span className="text-red-400">*</span>
                    </FieldLabel>
                    <input
                      id="w-d-amount"
                      type="number"
                      required
                      min="1"
                      className="neon-input w-full px-4 py-2.5 text-sm"
                      placeholder="Enter amount"
                      value={dAmount}
                      onChange={(e) => setDAmount(e.target.value)}
                      data-ocid="deposit.input"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="w-d-method">
                      Payment Method <span className="text-red-400">*</span>
                    </FieldLabel>
                    {paymentMethods.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2.5">
                        No payment methods available
                      </p>
                    ) : (
                      <select
                        id="w-d-method"
                        required
                        className="neon-input w-full px-4 py-2.5 text-sm"
                        value={dMethod}
                        onChange={(e) => setDMethod(e.target.value)}
                        data-ocid="deposit.select"
                      >
                        <option value="">Select</option>
                        {paymentMethods.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="w-d-screenshot">
                    Payment Screenshot
                  </FieldLabel>
                  <label
                    htmlFor="w-d-screenshot"
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
                      id="w-d-screenshot"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setDScreenshot(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={deposit.isPending}
                  className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-2"
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
            </TabsContent>

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
                        placeholder={getIdLabel(wFields.method)}
                        value={wFields.id}
                        onChange={(e) => setW("id", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>

                    {/* IFSC + Branch for bank methods */}
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
                            placeholder="e.g. Main Branch, Delhi"
                            value={wFields.branch}
                            onChange={(e) => setW("branch", e.target.value)}
                            data-ocid="withdraw.input"
                          />
                        </div>
                      </>
                    )}

                    {/* Name — Account Holder Name for banks, Name for others */}
                    <div>
                      <FieldLabel htmlFor="w-w-name">
                        {isBankMethod(wFields.method)
                          ? "Account Holder Name"
                          : "Name"}{" "}
                        <span className="text-red-400">*</span>
                      </FieldLabel>
                      <input
                        id="w-w-name"
                        type="text"
                        required
                        className="neon-input w-full px-4 py-2.5 text-sm"
                        placeholder="Your full name"
                        value={wFields.name}
                        onChange={(e) => setW("name", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>

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
                        placeholder="Enter amount to withdraw"
                        value={wFields.amount}
                        onChange={(e) => setW("amount", e.target.value)}
                        data-ocid="withdraw.input"
                      />
                    </div>

                    {/* Fee info */}
                    {wFields.amount && Number(wFields.amount) > 0 && (
                      <div
                        className="p-3 rounded-xl text-xs space-y-1"
                        style={{
                          background: "rgba(201, 60, 255, 0.06)",
                          border: "1px solid rgba(201, 60, 255, 0.2)",
                        }}
                      >
                        <div className="flex justify-between text-muted-foreground">
                          <span>Withdrawal Fee (12%)</span>
                          <span className="text-red-400">
                            -₹{(Number(wFields.amount) * 0.12).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>You Receive</span>
                          <span className="neon-text-cyan">
                            ₹{(Number(wFields.amount) * 0.88).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
