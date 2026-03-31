import {
  Activity,
  CheckCircle,
  CreditCard,
  Eye,
  Loader2,
  Plus,
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
  | "payments"
  | "ads";

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

  const isDeposit = parsedNotes?.type === "deposit";
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
          {isWithdrawal && (
            <>
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
    { id: "ads", label: "Ads Tasks", icon: Target },
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

      {/* Transaction Detail Modal */}
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
