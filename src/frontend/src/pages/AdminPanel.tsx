import {
  Activity,
  CheckCircle,
  CreditCard,
  Eye,
  Loader2,
  ShieldCheck,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { TransactionStatus, type UserRole } from "../backend.d";
import type { PaymentMethod, Transaction } from "../backend.d";
import { Switch } from "../components/ui/switch";
import {
  useAddPaymentMethod,
  useAllTransactions,
  useAllUsers,
  useApproveTransaction,
  usePaymentMethods,
  usePlatformStats,
  useRejectTransaction,
  useRemovePaymentMethod,
  useUpdateUserBalance,
  useUpdateUserRole,
} from "../hooks/useQueries";

const STANDARD_METHODS = [
  "eSewa",
  "Khalti",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "USD Payment",
  "Bybit Pay",
];

type AdminTab =
  | "stats"
  | "users"
  | "purchases"
  | "deposits"
  | "withdrawals"
  | "payments";

interface MethodData {
  qrBase64: string | null;
  enabled: boolean;
}

function parseMethodDesc(description: string): MethodData {
  try {
    const parsed = JSON.parse(description);
    return {
      qrBase64: parsed.qrBase64 ?? null,
      enabled: parsed.enabled !== false,
    };
  } catch {
    return { qrBase64: null, enabled: true };
  }
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === TransactionStatus.approved
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
      : status === TransactionStatus.rejected
        ? "text-red-400 bg-red-400/10 border-red-400/30"
        : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex items-start justify-between gap-4 py-2"
      style={{ borderBottom: "1px solid rgba(123,77,255,0.1)" }}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="text-sm text-right font-mono break-all">{value}</span>
    </div>
  );
}

function getWithdrawIdLabel(method: string): string {
  switch (method) {
    case "eSewa":
      return "eSewa ID";
    case "Khalti":
      return "Khalti ID";
    case "SBI Bank":
    case "HDFC Bank":
      return "Account Number";
    default:
      return "UPI / Number";
  }
}

function TxDetailModal({
  tx,
  onClose,
}: { tx: Transaction; onClose: () => void }) {
  let parsedNotes: Record<string, string> | null = null;
  let notesParseError = false;
  if (tx.notes) {
    try {
      parsedNotes = JSON.parse(tx.notes);
    } catch {
      notesParseError = true;
    }
  }

  const isDeposit = parsedNotes?.type === "deposit";
  const isWithdrawal = parsedNotes?.type === "withdrawal";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
      data-ocid="tx.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="neon-card p-6 w-full max-w-md relative overflow-y-auto max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl neon-text-cyan">
            Transaction Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(123,77,255,0.2)",
            }}
            data-ocid="tx.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          <DetailRow label="Transaction ID" value={`#${tx.id.toString()}`} />
          <DetailRow label="User (Principal)" value={tx.user.toString()} />
          <DetailRow label="Type" value={String(tx.txType).replace("_", " ")} />
          <DetailRow
            label="Amount"
            value={`₹${Number(tx.amount).toLocaleString("en-IN")}`}
          />
          <DetailRow label="Payment Method" value={tx.paymentMethod || "—"} />
          <DetailRow
            label="Date"
            value={new Date(Number(tx.createdAt) / 1_000_000).toLocaleString()}
          />
          <div
            className="flex items-center justify-between py-2"
            style={{ borderBottom: "1px solid rgba(123,77,255,0.1)" }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <StatusBadge status={String(tx.status)} />
          </div>

          {/* Deposit-specific fields */}
          {isDeposit && parsedNotes && (
            <>
              {parsedNotes.name && (
                <DetailRow label="Name" value={parsedNotes.name} />
              )}
              {parsedNotes.txId && (
                <DetailRow
                  label="Transaction ID (User)"
                  value={parsedNotes.txId}
                />
              )}
              {/* Screenshot */}
              <div className="py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                  Payment Screenshot
                </span>
                {parsedNotes.screenshot ? (
                  <img
                    src={parsedNotes.screenshot}
                    alt="Payment Screenshot"
                    style={{
                      maxWidth: "100%",
                      borderRadius: 8,
                      marginTop: 8,
                      border: "1px solid rgba(123,77,255,0.3)",
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No screenshot uploaded
                  </p>
                )}
              </div>
            </>
          )}

          {/* Withdrawal-specific fields */}
          {isWithdrawal && parsedNotes && (
            <>
              {parsedNotes.name && (
                <DetailRow
                  label="Account Holder Name"
                  value={parsedNotes.name}
                />
              )}
              {parsedNotes.id && (
                <DetailRow
                  label={getWithdrawIdLabel(parsedNotes.method ?? "")}
                  value={parsedNotes.id}
                />
              )}
              {parsedNotes.ifsc && (
                <DetailRow label="IFSC Code" value={parsedNotes.ifsc} />
              )}
              {parsedNotes.branch && (
                <DetailRow label="Branch Name" value={parsedNotes.branch} />
              )}
            </>
          )}

          {/* Legacy / raw notes fallback */}
          {tx.notes && notesParseError && (
            <div className="py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Notes
              </span>
              <p className="text-sm text-muted-foreground">{tx.notes}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="neon-btn-primary w-full py-2.5 mt-6 text-sm font-semibold"
          data-ocid="tx.confirm_button"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [viewTx, setViewTx] = useState<Transaction | null>(null);

  const { data: stats } = usePlatformStats();
  const { data: users, isLoading: usersLoading } = useAllUsers();
  const { data: transactions, isLoading: txLoading } = useAllTransactions();
  const { data: paymentMethods } = usePaymentMethods();

  const approveTransaction = useApproveTransaction();
  const rejectTransaction = useRejectTransaction();
  const updateBalance = useUpdateUserBalance();
  const updateRole = useUpdateUserRole();
  const addPaymentMethod = useAddPaymentMethod();
  const removePaymentMethod = useRemovePaymentMethod();

  const [balanceInputs, setBalanceInputs] = useState<Record<string, string>>(
    {},
  );

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "stats", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "purchases", label: "Plan Purchases", icon: Activity },
    { id: "deposits", label: "Deposits", icon: Activity },
    { id: "withdrawals", label: "Withdrawals", icon: Activity },
    { id: "payments", label: "QR Payments", icon: CreditCard },
  ];

  const handleApprove = async (id: bigint) => {
    try {
      await approveTransaction.mutateAsync(id);
      toast.success("Transaction approved — referral activated if purchase");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: bigint) => {
    try {
      await rejectTransaction.mutateAsync(id);
      toast.success("Transaction rejected");
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleUpdateBalance = async (
    userPrincipal: string,
    principalObj: any,
  ) => {
    const val = balanceInputs[userPrincipal];
    if (!val) return;
    try {
      await updateBalance.mutateAsync({
        user: principalObj,
        newBalance: BigInt(Math.floor(Number.parseFloat(val))),
      });
      toast.success("Balance updated");
      setBalanceInputs((prev) => ({ ...prev, [userPrincipal]: "" }));
    } catch {
      toast.error("Failed to update balance");
    }
  };

  const handleUpdateRole = async (principalObj: any, role: UserRole) => {
    try {
      await updateRole.mutateAsync({ user: principalObj, role });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleUpdateMethod = async (
    name: string,
    updates: Partial<MethodData>,
  ) => {
    const existing = paymentMethods?.find((m) => m.name === name);
    const current = existing
      ? parseMethodDesc(existing.description)
      : { qrBase64: null, enabled: true };
    const updated: MethodData = { ...current, ...updates };
    try {
      if (existing) await removePaymentMethod.mutateAsync(name);
      await addPaymentMethod.mutateAsync({
        name,
        description: JSON.stringify(updated),
      });
      toast.success(`${name} updated`);
    } catch {
      toast.error(`Failed to update ${name}`);
    }
  };

  // Filter transactions per tab
  const purchaseTxs = (transactions ?? []).filter(
    (tx) => String(tx.txType) === "purchase",
  );
  const depositTxs = (transactions ?? []).filter(
    (tx) => String(tx.txType) === "deposit",
  );
  const withdrawalTxs = (transactions ?? []).filter(
    (tx) => String(tx.txType) === "withdrawal",
  );

  const QrMethodCard = ({ methodName }: { methodName: string }) => {
    const existing = paymentMethods?.find((m) => m.name === methodName);
    const data = existing
      ? parseMethodDesc(existing.description)
      : { qrBase64: null, enabled: true };
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        await handleUpdateMethod(methodName, { qrBase64: base64 });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    };

    return (
      <div
        className="rounded-xl p-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
          border: `1px solid ${data.enabled ? "rgba(123,77,255,0.3)" : "rgba(255,255,255,0.08)"}`,
          opacity: data.enabled ? 1 : 0.6,
        }}
        data-ocid="payments.card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-base neon-text-cyan">
            {methodName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {data.enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={data.enabled}
              onCheckedChange={(checked) =>
                handleUpdateMethod(methodName, { enabled: checked })
              }
              data-ocid="payments.switch"
            />
          </div>
        </div>
        <div
          className="w-full aspect-square rounded-lg mb-4 flex items-center justify-center overflow-hidden"
          style={{
            background: data.qrBase64 ? "white" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(123,77,255,0.2)",
            maxHeight: "180px",
          }}
        >
          {data.qrBase64 ? (
            <img
              src={data.qrBase64}
              alt={`${methodName} QR`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="text-3xl mb-2 opacity-30">⬛</div>
              <p className="text-muted-foreground text-xs">No QR Set</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="neon-btn-primary w-full py-2 text-sm flex items-center justify-center gap-2"
          data-ocid="payments.upload_button"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Upload QR Code
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleQrUpload}
          data-ocid="payments.dropzone"
        />
      </div>
    );
  };

  function TxTable({
    txList,
    loading,
    emptyLabel,
    indexPrefix,
    txType,
  }: {
    txList: Transaction[];
    loading: boolean;
    emptyLabel: string;
    indexPrefix: string;
    txType?: "deposit" | "withdrawal" | "purchase";
  }) {
    return (
      <div className="neon-card overflow-hidden">
        {loading ? (
          <div
            className="p-8 text-center"
            data-ocid={`${indexPrefix}.loading_state`}
          >
            <Loader2 className="w-8 h-8 animate-spin mx-auto neon-text-violet" />
          </div>
        ) : !txList.length ? (
          <div
            className="p-8 text-center text-muted-foreground"
            data-ocid={`${indexPrefix}.empty_state`}
          >
            {emptyLabel}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              data-ocid={`${indexPrefix}.table`}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(123,77,255,0.2)" }}>
                  {[
                    "ID",
                    "User",
                    "Type",
                    "Amount",
                    "Method",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txList.map((tx, i) => (
                  <tr
                    key={tx.id.toString()}
                    style={{ borderBottom: "1px solid rgba(123,77,255,0.1)" }}
                    className="hover:bg-white/[0.02] transition-colors"
                    data-ocid={`${indexPrefix}.row.${i + 1}`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      #{tx.id.toString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {tx.user.toString().slice(0, 10)}...
                    </td>
                    <td className="py-3 px-4 text-sm capitalize text-muted-foreground">
                      {String(tx.txType).replace("_", " ")}
                    </td>
                    <td className="py-3 px-4 font-bold neon-text-cyan">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {tx.paymentMethod}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={String(tx.status)} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        {/* View button on every row */}
                        <button
                          type="button"
                          onClick={() => setViewTx(tx)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-sky-400 hover:bg-sky-400/10 transition-colors"
                          style={{ border: "1px solid rgba(56,189,248,0.3)" }}
                          data-ocid={`${indexPrefix}.button.${i + 1}`}
                        >
                          <Eye className="w-3 h-3" />
                          {txType === "deposit"
                            ? "View Info & Screenshot"
                            : txType === "withdrawal"
                              ? "View Info"
                              : "View"}
                        </button>
                        {/* Approve/Reject only on pending */}
                        {String(tx.status) === TransactionStatus.pending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(tx.id)}
                              disabled={approveTransaction.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                              style={{
                                border: "1px solid rgba(52,211,153,0.3)",
                              }}
                              data-ocid={`${indexPrefix}.confirm_button.${i + 1}`}
                            >
                              ✓ Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(tx.id)}
                              disabled={rejectTransaction.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-400/10 transition-colors"
                              style={{
                                border: "1px solid rgba(248,113,113,0.3)",
                              }}
                              data-ocid={`${indexPrefix}.delete_button.${i + 1}`}
                            >
                              <XCircle className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-8 h-8 neon-text-violet" />
          <h1 className="font-display font-black text-4xl gradient-text">
            Admin Panel
          </h1>
        </div>
        <p className="text-muted-foreground">
          Manage payments, users, and transactions
        </p>
      </motion.div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-8 flex-wrap"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(123,77,255,0.2)",
          width: "fit-content",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background:
                activeTab === tab.id ? "rgba(123,77,255,0.25)" : "transparent",
              color:
                activeTab === tab.id
                  ? "oklch(0.96 0.01 280)"
                  : "oklch(0.6 0.02 280)",
              border:
                activeTab === tab.id
                  ? "1px solid rgba(123,77,255,0.4)"
                  : "1px solid transparent",
              boxShadow:
                activeTab === tab.id ? "0 0 15px rgba(123,77,255,0.2)" : "none",
            }}
            data-ocid={`admin.${tab.id}.tab`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === "stats" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Users",
                value: stats?.totalUsers?.toString() ?? "0",
                color: "cyan",
              },
              {
                label: "Total Transactions",
                value: stats?.totalTransactions?.toString() ?? "0",
                color: "violet",
              },
              {
                label: "Payment Methods",
                value: (paymentMethods?.length ?? 0).toString(),
                color: "magenta",
              },
              {
                label: "Pending",
                value: (
                  transactions?.filter(
                    (t) => String(t.status) === TransactionStatus.pending,
                  ).length ?? 0
                ).toString(),
                color: "cyan",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="stat-card"
                data-ocid="admin.stats.card"
              >
                <div className="text-muted-foreground text-xs uppercase tracking-wider mb-2">
                  {item.label}
                </div>
                <div
                  className={`font-display font-black text-4xl ${item.color === "cyan" ? "neon-text-cyan" : item.color === "violet" ? "neon-text-violet" : "neon-text-magenta"}`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="neon-card overflow-hidden">
            {usersLoading ? (
              <div className="p-8 text-center" data-ocid="users.loading_state">
                <Loader2 className="w-8 h-8 animate-spin mx-auto neon-text-violet" />
              </div>
            ) : !users?.length ? (
              <div
                className="p-8 text-center text-muted-foreground"
                data-ocid="users.empty_state"
              >
                No users yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-ocid="users.table">
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid rgba(123,77,255,0.2)" }}
                    >
                      {[
                        "Username",
                        "Balance",
                        "Referral Earnings",
                        "Referral Code",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr
                        key={u.user.toString()}
                        style={{
                          borderBottom: "1px solid rgba(123,77,255,0.1)",
                        }}
                        className="hover:bg-white/[0.02] transition-colors"
                        data-ocid={`users.row.${i + 1}`}
                      >
                        <td className="py-3 px-4 font-semibold neon-text-cyan">
                          {u.username}
                        </td>
                        <td className="py-3 px-4 neon-text-cyan font-mono">
                          ₹{Number(u.balance).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 neon-text-magenta font-mono">
                          ₹{Number(u.referralEarnings).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {u.referralCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="neon-input px-2 py-1 text-xs w-24"
                              placeholder="New bal"
                              value={balanceInputs[u.user.toString()] ?? ""}
                              onChange={(e) =>
                                setBalanceInputs((prev) => ({
                                  ...prev,
                                  [u.user.toString()]: e.target.value,
                                }))
                              }
                              data-ocid="users.input"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateBalance(u.user.toString(), u.user)
                              }
                              className="neon-btn-primary px-2 py-1 text-xs"
                              data-ocid="users.save_button"
                            >
                              Set
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateRole(u.user, "admin" as UserRole)
                              }
                              className="neon-btn px-2 py-1 text-xs"
                              data-ocid="users.button"
                            >
                              Admin
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Plan Purchases Tab */}
      {activeTab === "purchases" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4">
            <h2 className="font-display font-bold text-2xl gradient-text mb-1">
              Plan Purchases
            </h2>
            <p className="text-muted-foreground text-sm">
              All plan purchase transactions. Approve or reject after verifying
              payment.
            </p>
          </div>
          <TxTable
            txList={purchaseTxs}
            loading={txLoading}
            emptyLabel="No plan purchases yet"
            indexPrefix="purchases"
            txType="purchase"
          />
        </motion.div>
      )}

      {/* Deposits Tab */}
      {activeTab === "deposits" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4">
            <h2 className="font-display font-bold text-2xl gradient-text mb-1">
              Deposits
            </h2>
            <p className="text-muted-foreground text-sm">
              User deposit requests. View screenshot and details, then approve
              or reject.
            </p>
          </div>
          <TxTable
            txList={depositTxs}
            loading={txLoading}
            emptyLabel="No deposit requests yet"
            indexPrefix="deposits"
            txType="deposit"
          />
        </motion.div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === "withdrawals" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-4">
            <h2 className="font-display font-bold text-2xl gradient-text mb-1">
              Withdrawals
            </h2>
            <p className="text-muted-foreground text-sm">
              User withdrawal requests with full account details. Review and
              process each request.
            </p>
          </div>
          <TxTable
            txList={withdrawalTxs}
            loading={txLoading}
            emptyLabel="No withdrawal requests yet"
            indexPrefix="withdrawals"
            txType="withdrawal"
          />
        </motion.div>
      )}

      {/* Payment Methods / QR Tab */}
      {activeTab === "payments" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl mb-1 gradient-text">
              QR Code Management
            </h2>
            <p className="text-muted-foreground text-sm">
              Upload and manage QR codes for all payment methods. Toggle to
              enable/disable each method.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {STANDARD_METHODS.map((name) => (
              <QrMethodCard key={name} methodName={name} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Transaction Detail Modal */}
      {viewTx && <TxDetailModal tx={viewTx} onClose={() => setViewTx(null)} />}
    </div>
  );
}
