import { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  CreditCard,
  Database,
  Eye,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Target,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TransactionStatus, type UserRole } from "../backend.d";
import type { BackupData, PaymentMethod, Transaction } from "../backend.d";
import { Switch } from "../components/ui/switch";
import {
  useAddPaymentMethod,
  useAllSupportTickets,
  useAllTransactions,
  useAllUsers,
  useApproveTransaction,
  useFullBackupData,
  usePaymentMethods,
  usePlatformStats,
  useRejectTransaction,
  useRemovePaymentMethod,
  useReplyToTicket,
  useResolveTicket,
  useRestoreUserBalances,
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
  | "payments"
  | "ads"
  | "support"
  | "health"
  | "userdb"
  | "settings";

interface AdTask {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  taskLink: string;
  rewardAmount: number;
  isActive: boolean;
  createdAt: string;
}

function getAdTasks(): AdTask[] {
  try {
    const raw = localStorage.getItem("neochain_ad_tasks");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAdTasks(tasks: AdTask[]) {
  localStorage.setItem("neochain_ad_tasks", JSON.stringify(tasks));
  window.dispatchEvent(new Event("storage"));
}

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

// QR code localStorage persistence — survives fresh deployments
const QR_STORAGE_KEY = "neochain_qr_data";

function getLocalQRData(): Record<string, MethodData> {
  try {
    const raw = localStorage.getItem(QR_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalQRData(methodName: string, data: MethodData) {
  try {
    const existing = getLocalQRData();
    existing[methodName] = data;
    localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(existing));
  } catch {}
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

interface TxDetailModalProps {
  tx: Transaction;
  onClose: () => void;
  onApprove: (id: bigint) => void;
  onReject: (id: bigint) => void;
  approvePending: boolean;
  rejectPending: boolean;
  userBalance?: bigint;
}

function TxDetailModal({
  tx,
  onClose,
  onApprove,
  onReject,
  approvePending,
  rejectPending,
  userBalance,
}: TxDetailModalProps) {
  let parsedNotes: Record<string, string> | null = null;
  let notesParseError = false;
  if (tx.notes) {
    try {
      parsedNotes = JSON.parse(tx.notes);
    } catch {
      notesParseError = true;
    }
  }

  const isDepositOrPurchase =
    parsedNotes?.type === "deposit" || parsedNotes?.type === "plan_purchase";
  const isWithdrawal =
    parsedNotes?.type === "withdrawal" || String(tx.txType) === "withdrawal";

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

          {/* Deposit/Plan Purchase-specific fields */}
          {isDepositOrPurchase && parsedNotes && (
            <>
              {parsedNotes.name && (
                <DetailRow label="Name" value={parsedNotes.name} />
              )}
              {(parsedNotes.txId || parsedNotes.txnId) && (
                <DetailRow
                  label="Transaction ID (User)"
                  value={parsedNotes.txnId || parsedNotes.txId || "—"}
                />
              )}
              {parsedNotes.paymentMethod && (
                <DetailRow
                  label="Payment Method Used"
                  value={parsedNotes.paymentMethod}
                />
              )}
              {parsedNotes.amount && (
                <DetailRow
                  label="Plan Amount"
                  value={`₹${Number(parsedNotes.amount).toLocaleString("en-IN")}`}
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
          {isWithdrawal && (
            <>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(38,214,255,0.9)",
                  marginTop: 16,
                  marginBottom: 4,
                }}
              >
                Withdrawal Account Details
              </p>
              <DetailRow
                label="Payment Method"
                value={parsedNotes?.method || tx.paymentMethod || "—"}
              />
              {parsedNotes?.name && (
                <DetailRow
                  label="Account Holder Name"
                  value={parsedNotes.name}
                />
              )}
              {parsedNotes?.id && (
                <DetailRow
                  label={getWithdrawIdLabel(parsedNotes?.method ?? "")}
                  value={parsedNotes.id}
                />
              )}
              {parsedNotes?.ifsc && (
                <DetailRow label="IFSC Code" value={parsedNotes.ifsc} />
              )}
              {parsedNotes?.branch && (
                <DetailRow label="Branch Name" value={parsedNotes.branch} />
              )}
              {parsedNotes?.bank && (
                <DetailRow label="Bank Name" value={parsedNotes.bank} />
              )}
              {parsedNotes?.amount && (
                <DetailRow
                  label="Requested Amount"
                  value={`₹${Number(parsedNotes.amount).toLocaleString("en-IN")}`}
                />
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

        {/* User balance for withdrawals */}
        {isWithdrawal && userBalance !== undefined && (
          <div
            className="flex items-center justify-between py-2 mt-2"
            style={{
              borderBottom: "1px solid rgba(123,77,255,0.1)",
              background: "rgba(38,214,255,0.04)",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              User Balance (Live)
            </span>
            <span className="text-sm font-bold neon-text-cyan">
              ₹{Number(userBalance).toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* Approve / Reject inside modal */}
        {String(tx.status) === TransactionStatus.pending && (
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                onApprove(tx.id);
                onClose();
              }}
              disabled={approvePending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.4)",
                color: "oklch(0.72 0.2 142)",
              }}
              data-ocid="tx.confirm_button"
            >
              ✓ Approve
            </button>
            <button
              type="button"
              onClick={() => {
                onReject(tx.id);
                onClose();
              }}
              disabled={rejectPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "oklch(0.65 0.25 25)",
              }}
              data-ocid="tx.delete_button"
            >
              ✕ Reject
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="neon-btn w-full py-2.5 mt-3 text-sm font-semibold"
          data-ocid="tx.close_button"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

interface QrMethodCardProps {
  methodName: string;
  paymentMethods: PaymentMethod[] | undefined;
  handleUpdateMethod: (
    name: string,
    updates: Partial<MethodData>,
  ) => Promise<void>;
}

function QrMethodCard({
  methodName,
  paymentMethods,
  handleUpdateMethod,
}: QrMethodCardProps) {
  const existing = paymentMethods?.find((m) => m.name === methodName);
  const backendData = existing ? parseMethodDesc(existing.description) : null;
  // localStorage wins if it has QR code (survives fresh deployments)
  const localQRData = getLocalQRData();
  const localData = localQRData[methodName];
  const data: MethodData = localData?.qrBase64
    ? localData
    : (backendData ?? { qrBase64: null, enabled: true });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        await handleUpdateMethod(methodName, { qrBase64: base64 });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`QR upload failed: ${msg}`);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file. Please try again.");
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
}

function AdsTasksTab() {
  const [tasks, setTasks] = useState<AdTask[]>(() => getAdTasks());
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<AdTask | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    taskLink: "",
    rewardAmount: "",
    isActive: true,
  });

  const refreshTasks = () => setTasks(getAdTasks());

  useEffect(() => {
    const onStorage = () => setTasks(getAdTasks());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      imageUrl: "",
      taskLink: "",
      rewardAmount: "",
      isActive: true,
    });
    setEditingTask(null);
    setShowForm(false);
  };

  const startEdit = (task: AdTask) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      imageUrl: task.imageUrl,
      taskLink: task.taskLink,
      rewardAmount: String(task.rewardAmount),
      isActive: task.isActive,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title || !form.taskLink || !form.rewardAmount) return;
    const all = getAdTasks();
    if (editingTask) {
      const updated = all.map((t) =>
        t.id === editingTask.id
          ? { ...t, ...form, rewardAmount: Number(form.rewardAmount) }
          : t,
      );
      saveAdTasks(updated);
    } else {
      const newTask: AdTask = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description,
        imageUrl: form.imageUrl,
        taskLink: form.taskLink,
        rewardAmount: Number(form.rewardAmount),
        isActive: form.isActive,
        createdAt: new Date().toISOString(),
      };
      saveAdTasks([...all, newTask]);
    }
    refreshTasks();
    resetForm();
  };

  const handleDelete = (id: string) => {
    saveAdTasks(getAdTasks().filter((t) => t.id !== id));
    refreshTasks();
  };

  const handleToggle = (id: string) => {
    const updated = getAdTasks().map((t) =>
      t.id === id ? { ...t, isActive: !t.isActive } : t,
    );
    saveAdTasks(updated);
    refreshTasks();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl mb-1 gradient-text">
            Ads Task Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Create and manage promotional tasks for users. Users earn rewards
            upon completion.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setShowForm(!showForm);
          }}
          className="neon-btn-primary flex items-center gap-2 px-4 py-2 text-sm shrink-0"
          data-ocid="ads.open_modal_button"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-5 rounded-2xl space-y-4"
          style={{
            background: "rgba(7,8,26,0.95)",
            border: "1px solid rgba(123,77,255,0.4)",
          }}
          data-ocid="ads.modal"
        >
          <h3 className="font-display font-bold text-lg">
            {editingTask ? "Edit Task" : "Create New Task"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="ads-title"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Title *
              </label>
              <input
                id="ads-title"
                type="text"
                className="neon-input w-full px-4 py-2.5 text-sm"
                placeholder="Task title"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="ads.input"
              />
            </div>
            <div>
              <label
                htmlFor="ads-reward"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Reward Amount (₹) *
              </label>
              <input
                id="ads-reward"
                type="number"
                className="neon-input w-full px-4 py-2.5 text-sm"
                placeholder="e.g. 50"
                value={form.rewardAmount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rewardAmount: e.target.value }))
                }
                data-ocid="ads.input"
              />
            </div>
            <div>
              <label
                htmlFor="ads-link"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Task Link *
              </label>
              <input
                id="ads-link"
                type="url"
                className="neon-input w-full px-4 py-2.5 text-sm"
                placeholder="https://..."
                value={form.taskLink}
                onChange={(e) =>
                  setForm((p) => ({ ...p, taskLink: e.target.value }))
                }
                data-ocid="ads.input"
              />
            </div>
            <div>
              <label
                htmlFor="ads-img"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Image URL (optional)
              </label>
              <input
                id="ads-img"
                type="url"
                className="neon-input w-full px-4 py-2.5 text-sm"
                placeholder="https://image.url/..."
                value={form.imageUrl}
                onChange={(e) =>
                  setForm((p) => ({ ...p, imageUrl: e.target.value }))
                }
                data-ocid="ads.input"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="ads-desc"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
              >
                Description
              </label>
              <textarea
                id="ads-desc"
                className="neon-input w-full px-4 py-2.5 text-sm resize-none"
                rows={2}
                placeholder="Describe what user needs to do..."
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                data-ocid="ads.textarea"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              data-ocid="ads.switch"
            />
            <span className="text-sm text-muted-foreground">
              Active (visible to users)
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSave}
              className="neon-btn-primary px-6 py-2.5 text-sm font-semibold"
              data-ocid="ads.save_button"
            >
              {editingTask ? "Update Task" : "Create Task"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="neon-btn px-6 py-2.5 text-sm"
              data-ocid="ads.cancel_button"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {tasks.length === 0 ? (
        <div
          className="py-16 text-center text-muted-foreground rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
          data-ocid="ads.empty_state"
        >
          No ad tasks yet. Create your first task to start rewarding users.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task, idx) => (
            <div
              key={task.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(7,8,26,0.85)",
                border: task.isActive
                  ? "1px solid rgba(255,193,7,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
              data-ocid={`ads.item.${idx + 1}`}
            >
              {task.imageUrl && (
                <div className="h-28 overflow-hidden">
                  <img
                    src={task.imageUrl}
                    alt={task.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display font-bold text-sm">
                    {task.title}
                  </h4>
                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: "rgba(255,193,7,0.15)",
                      color: "oklch(0.85 0.18 85)",
                    }}
                  >
                    ₹{task.rewardAmount}
                  </span>
                </div>
                {task.description && (
                  <p className="text-muted-foreground text-xs">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Switch
                    checked={task.isActive}
                    onCheckedChange={() => handleToggle(task.id)}
                    data-ocid="ads.switch"
                  />
                  <span className="text-xs text-muted-foreground">
                    {task.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(task)}
                    className="flex-1 neon-btn flex items-center justify-center gap-1.5 py-2 text-xs"
                    data-ocid="ads.edit_button"
                  >
                    <Eye className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "oklch(0.65 0.25 25)",
                    }}
                    data-ocid="ads.delete_button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface TxTableProps {
  txList: Transaction[];
  loading: boolean;
  emptyLabel: string;
  indexPrefix: string;
  txType?: "deposit" | "withdrawal" | "purchase";
  handleApprove: (id: bigint) => Promise<void>;
  handleReject: (id: bigint) => Promise<void>;
  approvePending: boolean;
  rejectPending: boolean;
  setViewTx: (tx: Transaction) => void;
}

function TxTable({
  txList,
  loading,
  emptyLabel,
  indexPrefix,
  txType,
  handleApprove,
  handleReject,
  approvePending,
  rejectPending,
  setViewTx,
}: TxTableProps) {
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
          <table className="w-full text-sm" data-ocid={`${indexPrefix}.table`}>
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
                            disabled={approvePending}
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
                            disabled={rejectPending}
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

function SupportTicketsTab() {
  const { data: tickets, isLoading, refetch } = useAllSupportTickets();
  const replyToTicket = useReplyToTicket();
  const resolveTicket = useResolveTicket();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const handleReply = async (ticketId: bigint) => {
    const key = String(ticketId);
    const reply = replyInputs[key]?.trim();
    if (!reply) return;
    try {
      await replyToTicket.mutateAsync({ ticketId, reply });
      toast.success("Reply sent!");
      setReplyInputs((prev) => ({ ...prev, [key]: "" }));
    } catch {
      toast.error("Failed to send reply");
    }
  };

  const handleResolve = async (ticketId: bigint) => {
    try {
      await resolveTicket.mutateAsync(ticketId);
      toast.success("Ticket resolved!");
    } catch {
      toast.error("Failed to resolve ticket");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "oklch(0.75 0.2 280)" }}
        />
      </div>
    );
  }

  const sortedTickets = [...(tickets || [])].sort(
    (a, b) => Number(b.ticketId) - Number(a.ticketId),
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle
          className="w-5 h-5"
          style={{ color: "oklch(0.75 0.2 280)" }}
        />
        <h2
          className="text-lg font-bold"
          style={{ color: "oklch(0.96 0.01 280)" }}
        >
          Support Tickets
        </h2>
        <span
          className="text-sm px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(123,77,255,0.2)",
            color: "oklch(0.75 0.2 280)",
          }}
        >
          {sortedTickets.length} total
        </span>
        <button
          type="button"
          onClick={() => refetch()}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: "rgba(123,77,255,0.15)",
            border: "1px solid rgba(123,77,255,0.35)",
            color: "oklch(0.75 0.2 280)",
          }}
          data-ocid="support.button"
        >
          &#x21bb; Refresh
        </button>
      </div>

      {sortedTickets.length === 0 ? (
        <div
          className="text-center py-16"
          style={{ color: "oklch(0.5 0.05 280)" }}
          data-ocid="support.empty_state"
        >
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Koi support ticket nahi mila</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="support.list">
          {sortedTickets.map((ticket, idx) => {
            const key = String(ticket.ticketId);
            const isExpanded = expandedId === key;
            const isResolved = ticket.status === "resolved";
            const createdDate = new Date(
              Number(ticket.createdAt) / 1_000_000,
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            return (
              <div
                key={key}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(123,77,255,0.2)",
                }}
                data-ocid={`support.item.${idx + 1}`}
              >
                {/* Row */}
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors text-left"
                  onClick={() => setExpandedId(isExpanded ? null : key)}
                >
                  <span
                    className="text-xs font-mono font-bold w-16 shrink-0"
                    style={{ color: "oklch(0.75 0.2 280)" }}
                  >
                    #{key}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "oklch(0.9 0.05 280)" }}
                    >
                      {ticket.guestName || "Anonymous"}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: "oklch(0.55 0.05 280)" }}
                    >
                      {ticket.problemSummary}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                    style={{
                      background: isResolved
                        ? "rgba(0,200,100,0.15)"
                        : "rgba(255,180,0,0.15)",
                      color: isResolved
                        ? "oklch(0.75 0.15 150)"
                        : "oklch(0.85 0.15 80)",
                    }}
                  >
                    {isResolved ? "Resolved" : "Open"}
                  </span>
                  <span
                    className="text-xs shrink-0"
                    style={{ color: "oklch(0.5 0.05 280)" }}
                  >
                    {createdDate}
                  </span>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div
                    className="px-4 pb-4 space-y-3"
                    style={{ borderTop: "1px solid rgba(123,77,255,0.1)" }}
                  >
                    <div className="pt-3">
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "oklch(0.6 0.1 280)" }}
                      >
                        User Info
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "oklch(0.85 0.05 280)" }}
                      >
                        Name: {ticket.guestName || "—"}{" "}
                        {ticket.guestEmail
                          ? `| Email: ${ticket.guestEmail}`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "oklch(0.6 0.1 280)" }}
                      >
                        Problem Summary
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "oklch(0.85 0.05 280)" }}
                      >
                        {ticket.problemSummary}
                      </p>
                    </div>
                    {ticket.adminReply && (
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: "rgba(0,210,255,0.05)",
                          border: "1px solid rgba(0,210,255,0.2)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold mb-1"
                          style={{ color: "oklch(0.75 0.15 200)" }}
                        >
                          Admin Reply
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "oklch(0.85 0.1 200)" }}
                        >
                          {ticket.adminReply}
                        </p>
                      </div>
                    )}
                    <div>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "oklch(0.6 0.1 280)" }}
                      >
                        Reply to User
                      </p>
                      <textarea
                        value={replyInputs[key] || ""}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder="Admin reply likhein..."
                        rows={2}
                        className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(123,77,255,0.3)",
                          color: "oklch(0.9 0.05 280)",
                        }}
                        data-ocid={"support.textarea"}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReply(ticket.ticketId)}
                        disabled={
                          !replyInputs[key]?.trim() || replyToTicket.isPending
                        }
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                        style={{
                          background: "rgba(123,77,255,0.3)",
                          color: "oklch(0.96 0.01 280)",
                          border: "1px solid rgba(123,77,255,0.4)",
                        }}
                        data-ocid={"support.save_button"}
                      >
                        {replyToTicket.isPending ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolve(ticket.ticketId)}
                        disabled={isResolved || resolveTicket.isPending}
                        className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                        style={{
                          background: isResolved
                            ? "rgba(0,200,100,0.1)"
                            : "rgba(0,200,100,0.25)",
                          color: "oklch(0.75 0.15 150)",
                          border: "1px solid rgba(0,200,100,0.3)",
                        }}
                        data-ocid={"support.confirm_button"}
                      >
                        {isResolved ? "✓ Resolved" : "Mark Resolved"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ===== User Credentials Modal =====
interface UserCredentialsModalProps {
  user: import("../backend.d").UserProfile;
  onClose: () => void;
  onSave: (
    user: import("../backend.d").UserProfile,
    newUsername: string,
    newPassword: string,
  ) => void;
  isSaving: boolean;
}

function UserCredentialsModal({
  user,
  onClose,
  onSave,
  isSaving,
}: UserCredentialsModalProps) {
  const [newUsername, setNewUsername] = useState(user.username);
  const [newPassword, setNewPassword] = useState("");
  const email =
    localStorage.getItem(`neochain_user_email_${user.user.toString()}`) ?? "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
      data-ocid="credentials.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="neon-card p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl neon-text-cyan">
            User Credentials
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(123,77,255,0.2)",
            }}
            data-ocid="credentials.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1 mb-6">
          <DetailRow
            label="Principal ID"
            value={
              <span className="text-xs break-all">{user.user.toString()}</span>
            }
          />
          <DetailRow label="Current Username" value={user.username} />
          <DetailRow
            label="Email"
            value={
              email || (
                <span className="italic text-muted-foreground">
                  Not provided
                </span>
              )
            }
          />
          <DetailRow label="Account Type" value="Internet Identity" />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">
              New Username
              <input
                type="text"
                className="neon-input w-full px-3 py-2 text-sm mt-1.5"
                placeholder="Enter new username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                data-ocid="credentials.input"
              />
            </label>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block mb-1.5">
              New Password{" "}
              <span className="text-muted-foreground font-normal font-normal">
                (leave blank to keep unchanged)
              </span>
              <input
                type="password"
                className="neon-input w-full px-3 py-2 text-sm mt-1.5"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                data-ocid="credentials.input"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => onSave(user, newUsername, newPassword)}
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{
              background: "rgba(123,77,255,0.15)",
              border: "1px solid rgba(123,77,255,0.5)",
              color: "oklch(0.85 0.22 280)",
            }}
            data-ocid="credentials.save_button"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Credentials"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)",
            }}
            data-ocid="credentials.cancel_button"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ==================== USER DATABASE TAB ====================

const DB_BACKUP_KEY = "neochain_db_backups_v1";
const MAX_BACKUPS = 5;

interface BackupSnapshot {
  id: string;
  timestamp: number;
  totalUsers: number;
  totalBalance: number;
  users: Array<{
    principal: string;
    username: string;
    balance: number;
    referralCode: string;
    referralEarnings: number;
  }>;
  transactionCount: number;
}

function saveBackupToStorage(snapshot: BackupSnapshot): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(DB_BACKUP_KEY);
    const list: BackupSnapshot[] = raw ? JSON.parse(raw) : [];
    list.unshift(snapshot);
    const trimmed = list.slice(0, MAX_BACKUPS);
    localStorage.setItem(DB_BACKUP_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

function loadBackupsFromStorage(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(DB_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---- SITE SETTINGS INTERFACE ----
interface SiteSettings {
  websiteName: string;
  ownerName: string;
  shortDescription: string;
  email: string;
  whatsapp: string;
  telegram: string;
  facebook: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  review1: string;
  review2: string;
  review3: string;
  totalUsers: string;
  totalPayments: string;
}

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  websiteName: "NeoChain Digital Store",
  ownerName: "",
  shortDescription: "",
  email: "",
  whatsapp: "",
  telegram: "",
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  review1: "",
  review2: "",
  review3: "",
  totalUsers: "",
  totalPayments: "",
};

function SiteSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem("siteSettings");
      return saved
        ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(saved) }
        : DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  const handleSave = () => {
    try {
      localStorage.setItem("siteSettings", JSON.stringify(settings));
      // Dispatch storage event so other components (About & Trust section) refresh on same tab
      window.dispatchEvent(
        new StorageEvent("storage", { key: "siteSettings" }),
      );
      toast.success("Site settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
  };

  const field = (
    label: string,
    key: keyof SiteSettings,
    placeholder?: string,
  ) => (
    <div style={{ marginBottom: 12 }}>
      <label
        htmlFor={`site-setting-${key}`}
        style={{
          display: "block",
          fontSize: 12,
          color: "rgba(180,180,210,0.8)",
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      <input
        id={`site-setting-${key}`}
        type="text"
        value={settings[key]}
        placeholder={placeholder || label}
        onChange={(e) =>
          setSettings((prev) => ({ ...prev, [key]: e.target.value }))
        }
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(123,77,255,0.3)",
          borderRadius: 8,
          padding: "8px 12px",
          color: "#fff",
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );

  const sectionTitle = (title: string) => (
    <h3
      style={{
        color: "rgba(38,214,255,1)",
        fontSize: 14,
        fontWeight: 700,
        marginBottom: 12,
        marginTop: 20,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {title}
    </h3>
  );

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h2
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: 800,
          marginBottom: 4,
        }}
      >
        ⚙️ Site Settings
      </h2>
      <p
        style={{
          color: "rgba(180,180,210,0.6)",
          fontSize: 13,
          marginBottom: 24,
        }}
      >
        Edit and save. Data shows in "About & Trust" section on homepage after
        refresh.
      </p>

      {sectionTitle("👤 Basic Info")}
      {field("Website Name", "websiteName")}
      {field("Owner Name", "ownerName")}
      {field(
        "Short Description",
        "shortDescription",
        "Brief description of your platform",
      )}

      {sectionTitle("📞 Contact Info")}
      {field("Email", "email", "your@email.com")}
      {field("WhatsApp Number", "whatsapp", "+91XXXXXXXXXX")}
      {field("Telegram Link", "telegram", "https://t.me/username")}

      {sectionTitle("🌐 Social Links")}
      {field("Facebook", "facebook", "https://facebook.com/...")}
      {field("Instagram", "instagram", "https://instagram.com/...")}
      {field("YouTube", "youtube", "https://youtube.com/...")}
      {field("TikTok", "tiktok", "https://tiktok.com/@...")}

      {sectionTitle("🔐 Trust Info")}
      {field(
        "Customer Review 1",
        "review1",
        "Great platform, earned ₹5000 in first month!",
      )}
      {field(
        "Customer Review 2",
        "review2",
        "Easy to use, fast withdrawal. Highly recommend!",
      )}
      {field(
        "Customer Review 3",
        "review3",
        "Best earning platform. Referral system is amazing!",
      )}
      {field("Total Users (e.g. 5000)", "totalUsers", "5000")}
      {field("Total Payments (e.g. ₹25,00,000)", "totalPayments", "₹25,00,000")}

      <button
        type="button"
        onClick={handleSave}
        style={{
          marginTop: 24,
          background:
            "linear-gradient(135deg, rgba(123,77,255,0.9), rgba(38,214,255,0.8))",
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "12px 32px",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(123,77,255,0.4)",
        }}
      >
        💾 Save Settings
      </button>
    </div>
  );
}

function UserDatabaseTab() {
  const [locked, setLocked] = useState(true);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [backups, setBackups] = useState<BackupSnapshot[]>(
    loadBackupsFromStorage,
  );
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryProgress, setRecoveryProgress] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const { data: backupData, refetch: refetchBackup } = useFullBackupData();
  const { data: users } = useAllUsers();
  const restoreBalances = useRestoreUserBalances();

  const handleUnlock = () => {
    if (passwordInput === "258008") {
      setLocked(false);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Access denied.");
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    try {
      const { data: freshData } = await refetchBackup();
      const data = (freshData ?? backupData) as BackupData | null | undefined;
      if (data?.users && data.users.length > 0) {
        const snapshot: BackupSnapshot = {
          id: `backup_${Date.now()}`,
          timestamp: Date.now(),
          totalUsers: Number(data.totalUsers),
          totalBalance: Number(data.totalBalance),
          users: data.users.map((u) => ({
            principal: u.user.toString(),
            username: u.username,
            balance: Number(u.balance),
            referralCode: u.referralCode,
            referralEarnings: Number(u.referralEarnings),
          })),
          transactionCount: data.transactions ? data.transactions.length : 0,
        };
        const updated = saveBackupToStorage(snapshot);
        setBackups(updated);
        setLastResult({ type: "success", msg: "Backup saved successfully!" });
        toast.success("Backup created!");
      } else {
        setLastResult({ type: "error", msg: "No data found to backup." });
        toast.error("No data to backup");
      }
    } catch {
      setLastResult({ type: "error", msg: "Backup failed. Please try again." });
      toast.error("Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRecover = async () => {
    setShowConfirm(false);
    setIsRecovering(true);

    const tryRestore = async (backup: BackupSnapshot) => {
      setRecoveryProgress("Loading backup data...");
      await new Promise((r) => setTimeout(r, 300));
      setRecoveryProgress("Restoring user balances...");
      const updates: Array<[Principal, bigint]> = backup.users.map((u) => [
        Principal.fromText(u.principal),
        BigInt(Math.round(u.balance)),
      ]);
      await restoreBalances.mutateAsync(updates);
      setRecoveryProgress("Syncing data...");
      await new Promise((r) => setTimeout(r, 500));
      setRecoveryProgress("Done!");
    };

    try {
      if (!backups[0]) {
        throw new Error("No backup available");
      }
      try {
        await tryRestore(backups[0]);
      } catch {
        if (backups[1]) {
          setRecoveryProgress(
            "Latest backup failed, trying previous backup...",
          );
          await new Promise((r) => setTimeout(r, 500));
          await tryRestore(backups[1]);
        } else {
          throw new Error("No fallback backup available");
        }
      }
      setLastResult({
        type: "success",
        msg: "All user data recovered successfully",
      });
      toast.success("All user data recovered successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Recovery failed";
      setLastResult({ type: "error", msg: `Recovery failed: ${msg}` });
      toast.error("Recovery failed");
    } finally {
      setIsRecovering(false);
    }
  };

  const totalUsers = users?.length ?? backups[0]?.totalUsers ?? 0;
  const totalBalance = users
    ? users.reduce((sum, u) => sum + Number(u.balance), 0)
    : (backups[0]?.totalBalance ?? 0);

  if (locked) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 420,
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(38,214,255,0.4)",
            borderRadius: 16,
            padding: "40px 48px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 0 40px rgba(38,214,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Shield
              size={56}
              style={{
                color: "rgba(38,214,255,1)",
                filter: "drop-shadow(0 0 16px rgba(38,214,255,0.8))",
              }}
            />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              marginBottom: 8,
            }}
          >
            User Database
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
              marginBottom: 28,
            }}
          >
            Enter access password to continue
          </p>
          <input
            data-ocid="userdb.input"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(38,214,255,0.4)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              fontSize: 15,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          {passwordError && (
            <p
              data-ocid="userdb.error_state"
              style={{
                color: "rgb(239,68,68)",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {passwordError}
            </p>
          )}
          <button
            data-ocid="userdb.primary_button"
            type="button"
            onClick={handleUnlock}
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 8,
              border: "none",
              background:
                "linear-gradient(135deg, rgba(38,214,255,0.8), rgba(123,77,255,0.8))",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(38,214,255,0.3)",
              letterSpacing: 0.5,
            }}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 8px", position: "relative" }}>
      {/* Loading overlay */}
      {isRecovering && (
        <div
          data-ocid="userdb.loading_state"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            gap: 16,
          }}
        >
          <Loader2
            size={48}
            style={{
              color: "rgba(38,214,255,1)",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              color: "rgba(38,214,255,1)",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            {recoveryProgress}
          </p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            Please wait...
          </p>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Database size={24} style={{ color: "rgba(38,214,255,1)" }} />
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "rgba(38,214,255,1)",
            }}
          >
            User Database
          </h2>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.4)",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 12,
            color: "rgb(34,197,94)",
          }}
        >
          <CheckCircle2 size={13} />
          <span>Secure Access</span>
        </div>
      </div>

      {/* Result Banner */}
      {lastResult && (
        <div
          data-ocid={
            lastResult.type === "success"
              ? "userdb.success_state"
              : "userdb.error_state"
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 20,
            background:
              lastResult.type === "success"
                ? "rgba(34,197,94,0.1)"
                : "rgba(239,68,68,0.1)",
            border: `1px solid ${lastResult.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {lastResult.type === "success" ? (
              <CheckCircle2 size={16} style={{ color: "rgb(34,197,94)" }} />
            ) : (
              <AlertTriangle size={16} style={{ color: "rgb(239,68,68)" }} />
            )}
            <span
              style={{
                color:
                  lastResult.type === "success"
                    ? "rgb(34,197,94)"
                    : "rgb(239,68,68)",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {lastResult.msg}
            </span>
          </div>
          <button
            type="button"
            data-ocid="userdb.close_button"
            onClick={() => setLastResult(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(38,214,255,0.3)",
            borderLeft: "4px solid rgba(38,214,255,0.8)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Total Users
          </p>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
            {totalUsers}
          </p>
        </div>
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(123,77,255,0.3)",
            borderLeft: "4px solid rgba(123,77,255,0.8)",
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Total Balance
          </p>
          <p style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>
            ₹{totalBalance.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}
      >
        <button
          data-ocid="userdb.secondary_button"
          type="button"
          onClick={handleBackupNow}
          disabled={isBackingUp}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            border: "1px solid rgba(38,214,255,0.5)",
            background: "rgba(38,214,255,0.1)",
            color: "rgba(38,214,255,1)",
            fontWeight: 600,
            fontSize: 14,
            cursor: isBackingUp ? "not-allowed" : "pointer",
            opacity: isBackingUp ? 0.7 : 1,
            boxShadow: "0 0 16px rgba(38,214,255,0.15)",
          }}
        >
          {isBackingUp ? (
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Save size={16} />
          )}
          {isBackingUp ? "Backing up..." : "💾 Backup Now"}
        </button>
        <button
          data-ocid="userdb.primary_button"
          type="button"
          onClick={() => setShowConfirm(true)}
          disabled={isRecovering || backups.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "11px 22px",
            borderRadius: 10,
            border: "1px solid rgba(123,77,255,0.5)",
            background: "rgba(123,77,255,0.2)",
            color: "rgba(180,140,255,1)",
            fontWeight: 600,
            fontSize: 14,
            cursor:
              isRecovering || backups.length === 0 ? "not-allowed" : "pointer",
            opacity: isRecovering || backups.length === 0 ? 0.7 : 1,
            boxShadow: "0 0 16px rgba(123,77,255,0.15)",
          }}
        >
          <RotateCcw size={16} />🔄 Recover All Data
        </button>
      </div>

      {/* Backup History */}
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <RefreshCw size={16} style={{ color: "rgba(38,214,255,0.8)" }} />
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Backup History (Last 5)
          </h3>
        </div>
        {backups.length === 0 ? (
          <div
            data-ocid="userdb.empty_state"
            style={{
              textAlign: "center",
              padding: "24px 0",
              color: "rgba(255,255,255,0.4)",
              fontSize: 14,
            }}
          >
            No backups yet. Click "Backup Now" to create your first backup.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {backups.map((b, i) => (
              <div
                key={b.id}
                data-ocid={`userdb.item.${i + 1}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background:
                    i === 0
                      ? "rgba(38,214,255,0.05)"
                      : "rgba(255,255,255,0.03)",
                  border: `1px solid ${i === 0 ? "rgba(38,214,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        background: "rgba(38,214,255,0.2)",
                        color: "rgba(38,214,255,1)",
                        border: "1px solid rgba(38,214,255,0.4)",
                        borderRadius: 4,
                        padding: "2px 6px",
                        letterSpacing: 0.5,
                      }}
                    >
                      LATEST
                    </span>
                  )}
                  <span
                    style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}
                  >
                    {new Date(b.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  <span
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 600,
                      }}
                    >
                      {b.totalUsers}
                    </span>{" "}
                    users
                  </span>
                  <span
                    style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}
                  >
                    ₹
                    <span
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 600,
                      }}
                    >
                      {b.totalBalance.toLocaleString("en-IN")}
                    </span>{" "}
                    balance
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          data-ocid="userdb.modal"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "rgba(15,10,30,0.98)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 16,
              padding: "32px 36px",
              maxWidth: 440,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 0 60px rgba(239,68,68,0.15)",
            }}
          >
            <AlertTriangle
              size={48}
              style={{
                color: "rgb(234,179,8)",
                marginBottom: 16,
                filter: "drop-shadow(0 0 12px rgba(234,179,8,0.5))",
              }}
            />
            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 12,
              }}
            >
              Confirm Data Recovery
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 14,
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              Are you sure you want to recover all data? This will restore all
              user balances from the latest backup.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                data-ocid="userdb.cancel_button"
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                data-ocid="userdb.confirm_button"
                type="button"
                onClick={handleRecover}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "1px solid rgba(239,68,68,0.5)",
                  background: "rgba(239,68,68,0.2)",
                  color: "rgb(248,113,113)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(239,68,68,0.2)",
                }}
              >
                Yes, Recover All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== END USER DATABASE TAB ====================

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");
  const [viewTx, setViewTx] = useState<Transaction | null>(null);
  const SESSION_ERROR_KEY = "neochain_admin_error_log";

  const [errorLog, setErrorLog] = useState<
    Array<{ time: string; msg: string; file: string; line: number }>
  >(() => {
    // Persist error logs in sessionStorage so they accumulate across page navigations
    try {
      const saved = sessionStorage.getItem(SESSION_ERROR_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist error log to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_ERROR_KEY, JSON.stringify(errorLog));
    } catch {}
  }, [errorLog]);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setErrorLog((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          msg: event.message,
          file: event.filename || "unknown",
          line: event.lineno,
        },
      ]);
    };
    const rejHandler = (event: PromiseRejectionEvent) => {
      setErrorLog((prev) => [
        ...prev,
        {
          time: new Date().toISOString(),
          msg: String(event.reason),
          file: "Promise",
          line: 0,
        },
      ]);
    };
    window.addEventListener("error", handler);
    window.addEventListener("unhandledrejection", rejHandler);
    return () => {
      window.removeEventListener("error", handler);
      window.removeEventListener("unhandledrejection", rejHandler);
    };
  }, []);

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
  const [credentialsModalUser, setCredentialsModalUser] = useState<
    import("../backend.d").UserProfile | null
  >(null);
  const [credSaving, setCredSaving] = useState(false);

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "stats", label: "Overview", icon: Activity },
    { id: "users", label: "Users", icon: Users },
    { id: "purchases", label: "Plan Purchases", icon: Activity },
    { id: "deposits", label: "Deposits", icon: Activity },
    { id: "withdrawals", label: "Withdrawals", icon: Activity },
    { id: "payments", label: "QR Payments", icon: CreditCard },
    { id: "ads", label: "Ads Tasks", icon: Target },
    { id: "support", label: "Support Tickets", icon: MessageCircle },
    { id: "health", label: "System Health", icon: Activity },
    { id: "userdb", label: "User Database", icon: Database },
    { id: "settings", label: "Site Settings", icon: Settings },
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
    principalObj: Principal,
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

  const handleUpdateRole = async (principalObj: Principal, role: UserRole) => {
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
    // Save to localStorage FIRST — survives fresh deployments
    saveLocalQRData(name, updated);
    // Store original data for rollback if needed
    const originalData = current;
    try {
      if (existing) {
        try {
          await removePaymentMethod.mutateAsync(name);
        } catch {
          // If remove fails, still try to add (backend might not have it)
        }
      }
      await addPaymentMethod.mutateAsync({
        name,
        description: JSON.stringify(updated),
      });
      toast.success(`${name} updated`);
    } catch {
      // addPaymentMethod failed after removePaymentMethod succeeded - try to restore original
      if (existing && originalData) {
        try {
          await addPaymentMethod.mutateAsync({
            name,
            description: JSON.stringify(originalData),
          });
        } catch {
          // Restore failed - data is still safe in localStorage
        }
      }
      toast.error(`Failed to update ${name} on backend — saved locally`);
    }
  };

  const handleSaveCredentials = async (
    user: import("../backend.d").UserProfile,
    newUsername: string,
    newPassword: string,
  ) => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    setCredSaving(true);
    try {
      // Store username override in localStorage
      const credKey = `neochain_admin_username_override_${user.user.toString()}`;
      localStorage.setItem(credKey, newUsername.trim());
      // Store password reset in localStorage (base64 encoded)
      if (newPassword.trim()) {
        const passKey = `neochain_admin_password_reset_${user.user.toString()}`;
        localStorage.setItem(passKey, btoa(newPassword.trim()));
      }
      toast.success(
        `Credentials updated for ${user.username}. New username: ${newUsername.trim()}`,
      );
      setCredentialsModalUser(null);
    } catch {
      toast.error("Failed to save credentials");
    } finally {
      setCredSaving(false);
    }
  };

  // Filter transactions per tab
  // Plan purchases are submitted via createDepositRequest, so txType is "deposit"
  // We differentiate plan purchases from regular deposits by checking the notes field
  // Plan purchases have notes.type === "plan_purchase"
  const purchaseTxs = (transactions ?? []).filter((tx) => {
    if (String(tx.txType) === "purchase") return true;
    if (String(tx.txType) === "deposit" && tx.notes) {
      try {
        const parsed = JSON.parse(tx.notes);
        return parsed.type === "plan_purchase";
      } catch {
        return false;
      }
    }
    return false;
  });
  const depositTxs = (transactions ?? []).filter((tx) => {
    if (String(tx.txType) !== "deposit") return false;
    if (tx.notes) {
      try {
        const parsed = JSON.parse(tx.notes);
        // Exclude plan purchases from deposits tab
        if (parsed.type === "plan_purchase") return false;
      } catch {}
    }
    return true;
  });
  const withdrawalTxs = (transactions ?? []).filter(
    (tx) => String(tx.txType) === "withdrawal",
  );

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
                <p>No users registered yet</p>
                <p className="text-xs mt-1 opacity-60">
                  Users will appear here after they register on the website
                </p>
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
                        "Email",
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
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {localStorage.getItem(
                            `neochain_user_email_${u.user.toString()}`,
                          ) ?? "—"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
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
                            <button
                              type="button"
                              onClick={() => setCredentialsModalUser(u)}
                              className="neon-btn px-2 py-1 text-xs"
                              style={{
                                border: "1px solid rgba(38,214,255,0.4)",
                                color: "oklch(0.85 0.18 200)",
                              }}
                              data-ocid="users.edit_button"
                            >
                              Credentials
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
            handleApprove={handleApprove}
            handleReject={handleReject}
            approvePending={approveTransaction.isPending}
            rejectPending={rejectTransaction.isPending}
            setViewTx={setViewTx}
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
            handleApprove={handleApprove}
            handleReject={handleReject}
            approvePending={approveTransaction.isPending}
            rejectPending={rejectTransaction.isPending}
            setViewTx={setViewTx}
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
            handleApprove={handleApprove}
            handleReject={handleReject}
            approvePending={approveTransaction.isPending}
            rejectPending={rejectTransaction.isPending}
            setViewTx={setViewTx}
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
              <QrMethodCard
                key={name}
                methodName={name}
                paymentMethods={paymentMethods}
                handleUpdateMethod={handleUpdateMethod}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Ads Tasks Tab */}
      {activeTab === "ads" && <AdsTasksTab />}
      {activeTab === "support" && <SupportTicketsTab />}
      {activeTab === "health" && (
        <div style={{ padding: "0 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "rgba(38,214,255,1)",
              }}
            >
              System Health Monitor
            </h2>
            <button
              type="button"
              onClick={() => setErrorLog([])}
              style={{
                background: "rgba(123,77,255,0.2)",
                border: "1px solid rgba(123,77,255,0.5)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 16px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Clear Log
            </button>
          </div>

          {/* Status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 10,
              marginBottom: 20,
              background:
                errorLog.length === 0
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(239,68,68,0.1)",
              border: `1px solid ${errorLog.length === 0 ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
            }}
          >
            <span style={{ fontSize: 20 }}>
              {errorLog.length === 0 ? "✅" : "🔴"}
            </span>
            <span
              style={{
                fontWeight: 600,
                color:
                  errorLog.length === 0 ? "rgb(34,197,94)" : "rgb(239,68,68)",
              }}
            >
              {errorLog.length === 0
                ? "All Systems OK"
                : `${errorLog.length} Error${errorLog.length > 1 ? "s" : ""} Detected`}
            </span>
          </div>

          {/* Error list */}
          {errorLog.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 0",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
              <p style={{ fontSize: 15 }}>
                No errors detected. System is running smoothly.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {errorLog.map((e, i) => (
                <div
                  key={e.time + String(i)}
                  style={{
                    background: "rgba(239,68,68,0.05)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
                    >
                      {new Date(e.time).toLocaleTimeString()}
                    </span>
                    <span
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}
                    >
                      {e.file}:{e.line}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(239,68,68,0.9)",
                      wordBreak: "break-word",
                    }}
                  >
                    {e.msg}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "userdb" && <UserDatabaseTab />}

      {activeTab === "settings" && <SiteSettingsTab />}

      {/* Transaction Detail Modal */}
      {credentialsModalUser && (
        <UserCredentialsModal
          user={credentialsModalUser}
          onClose={() => setCredentialsModalUser(null)}
          onSave={handleSaveCredentials}
          isSaving={credSaving}
        />
      )}

      {viewTx && (
        <TxDetailModal
          tx={viewTx}
          onClose={() => setViewTx(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          approvePending={approveTransaction.isPending}
          rejectPending={rejectTransaction.isPending}
          userBalance={
            String(viewTx.txType) === "withdrawal"
              ? users?.find((u) => u.user.toString() === viewTx.user.toString())
                  ?.balance
              : undefined
          }
        />
      )}
    </div>
  );
}
