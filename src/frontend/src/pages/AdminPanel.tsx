import {
  Activity,
  CheckCircle,
  CreditCard,
  Loader2,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { TransactionStatus, type UserRole } from "../backend.d";
import type { PaymentMethod } from "../backend.d";
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

type AdminTab = "stats" | "users" | "transactions" | "payments";

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

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

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
    { id: "transactions", label: "Transactions", icon: Activity },
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

        {/* QR Preview */}
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
        className="flex gap-1 p-1 rounded-xl mb-8 w-fit"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(123,77,255,0.2)",
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

      {/* Transactions Tab */}
      {activeTab === "transactions" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="neon-card overflow-hidden">
            {txLoading ? (
              <div
                className="p-8 text-center"
                data-ocid="transactions.loading_state"
              >
                <Loader2 className="w-8 h-8 animate-spin mx-auto neon-text-violet" />
              </div>
            ) : !transactions?.length ? (
              <div
                className="p-8 text-center text-muted-foreground"
                data-ocid="transactions.empty_state"
              >
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="w-full text-sm"
                  data-ocid="transactions.table"
                >
                  <thead>
                    <tr
                      style={{ borderBottom: "1px solid rgba(123,77,255,0.2)" }}
                    >
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
                    {transactions.map((tx, i) => (
                      <tr
                        key={tx.id.toString()}
                        style={{
                          borderBottom: "1px solid rgba(123,77,255,0.1)",
                        }}
                        className="hover:bg-white/[0.02] transition-colors"
                        data-ocid={`transactions.row.${i + 1}`}
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
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${
                              String(tx.status) === TransactionStatus.approved
                                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                                : String(tx.status) ===
                                    TransactionStatus.rejected
                                  ? "text-red-400 bg-red-400/10 border-red-400/30"
                                  : "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
                            }`}
                          >
                            {String(tx.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {String(tx.status) === TransactionStatus.pending && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(tx.id)}
                                disabled={approveTransaction.isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                style={{
                                  border: "1px solid rgba(52,211,153,0.3)",
                                }}
                                data-ocid={`transactions.confirm_button.${i + 1}`}
                              >
                                <CheckCircle className="w-3 h-3" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(tx.id)}
                                disabled={rejectTransaction.isPending}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-400/10 transition-colors"
                                style={{
                                  border: "1px solid rgba(248,113,113,0.3)",
                                }}
                                data-ocid={`transactions.delete_button.${i + 1}`}
                              >
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
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
    </div>
  );
}
