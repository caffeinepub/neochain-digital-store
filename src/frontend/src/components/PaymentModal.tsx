import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { ProductPlan } from "../backend.d";
import { useDeposit, usePaymentMethods } from "../hooks/useQueries";

const STANDARD_METHODS = [
  "eSewa",
  "Khalti",
  "Paytm",
  "PhonePe",
  "Google Pay",
  "USD Payment",
  "Bybit Pay",
];

interface MethodInfo {
  name: string;
  qrBase64: string | null;
  enabled: boolean;
}

function parseMethod(name: string, description: string): MethodInfo {
  try {
    const parsed = JSON.parse(description);
    return {
      name,
      qrBase64: parsed.qrBase64 ?? null,
      enabled: parsed.enabled !== false,
    };
  } catch {
    return { name, qrBase64: null, enabled: true };
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

interface Props {
  product: ProductPlan;
  onClose: () => void;
}

export default function PaymentModal({ product, onClose }: Props) {
  const { data: backendMethods } = usePaymentMethods();
  const deposit = useDeposit();

  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedMethod, setSelectedMethod] = useState<MethodInfo | null>(null);
  const [lightboxQr, setLightboxQr] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [txnId, setTxnId] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);

  // Build merged list — standard methods always shown; QR codes merged from backend
  const methodSource: MethodInfo[] =
    backendMethods === null || backendMethods === undefined
      ? STANDARD_METHODS.map((n) => ({
          name: n,
          qrBase64: null,
          enabled: true,
        }))
      : STANDARD_METHODS.map((stdName) => {
          const found = backendMethods.find((m) => m.name === stdName);
          if (found) return parseMethod(found.name, found.description);
          return { name: stdName, qrBase64: null, enabled: true };
        });

  const methods = methodSource.filter((m) => m.enabled);

  const handleSelectMethod = (method: MethodInfo) => {
    setSelectedMethod(method);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!txnId.trim()) {
      toast.error("Transaction ID is required");
      return;
    }
    if (!screenshot) {
      toast.error("Screenshot is required");
      return;
    }
    if (!selectedMethod) return;

    try {
      const screenshotBase64 = await fileToBase64(screenshot);
      const extraNotes = JSON.stringify({
        type: "plan_purchase",
        name: name.trim(),
        txnId: txnId.trim(),
        screenshot: screenshotBase64,
        paymentMethod: selectedMethod.name,
      });
      await deposit.mutateAsync({
        amount: product.price,
        paymentMethod: selectedMethod.name,
        extraNotes,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("not registered") ||
        msg.includes("User is not registered")
      ) {
        toast.error(
          "Please login and complete registration before buying a plan.",
        );
      } else if (msg.includes("Unauthorized")) {
        toast.error("Session expired. Please refresh and login again.");
      } else if (msg.includes("Not connected")) {
        toast.error("Please login first to buy a plan.");
      } else {
        toast.error(`Submission failed: ${msg.slice(0, 80)}`);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-ocid="payment.modal"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
          border: "1px solid rgba(123,77,255,0.3)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(123,77,255,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 sticky top-0"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.12 0.04 280), oklch(0.09 0.02 260))",
            borderBottom: "1px solid rgba(123,77,255,0.2)",
            zIndex: 10,
          }}
        >
          <div>
            <h2 className="font-display font-bold text-xl">
              {success
                ? "Payment Submitted"
                : step === "select"
                  ? "Select Payment Method"
                  : "Complete Payment"}
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              {product.name} —{" "}
              <span className="neon-text-cyan font-semibold">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            data-ocid="payment.close_button"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center py-8"
                data-ocid="payment.success_state"
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl"
                  style={{
                    background: "rgba(52,211,153,0.15)",
                    border: "1px solid rgba(52,211,153,0.4)",
                  }}
                >
                  ✓
                </div>
                <h3 className="font-display font-bold text-2xl text-emerald-400 mb-2">
                  Payment Submitted!
                </h3>
                <p className="text-muted-foreground mb-2">
                  Your payment request has been submitted successfully.
                </p>
                <p className="text-muted-foreground text-sm">
                  Admin will review and approve your purchase within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="neon-btn-primary mt-6 px-8 py-2.5 text-sm font-semibold"
                  data-ocid="payment.confirm_button"
                >
                  Done
                </button>
              </motion.div>
            ) : step === "select" ? (
              <motion.div
                key="select"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {methods.length === 0 ? (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="payment.empty_state"
                  >
                    <p className="text-sm">
                      No payment methods are currently available. Please contact
                      admin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {methods.map((method) => (
                      <button
                        key={method.name}
                        type="button"
                        onClick={() => handleSelectMethod(method)}
                        className="group relative rounded-xl p-4 text-left transition-all hover:scale-[1.02]"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(123,77,255,0.2)",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                        }}
                        data-ocid="payment.button"
                      >
                        {method.qrBase64 && (
                          <div
                            className="w-full aspect-square rounded-lg overflow-hidden mb-3 bg-white"
                            style={{ maxHeight: 80 }}
                          >
                            <img
                              src={method.qrBase64}
                              alt={method.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="font-display font-bold text-sm neon-text-cyan">
                          {method.name}
                        </div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Scan & Pay
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <button
                  type="button"
                  onClick={() => setStep("select")}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
                >
                  ← Back to methods
                </button>

                {selectedMethod?.qrBase64 && (
                  <button
                    type="button"
                    className="flex justify-center mb-6 bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => setLightboxQr(selectedMethod.qrBase64)}
                    aria-label="View QR code full size"
                  >
                    <div
                      className="rounded-xl overflow-hidden bg-white"
                      style={{
                        width: 140,
                        height: 140,
                        border: "2px solid rgba(123,77,255,0.4)",
                      }}
                    >
                      <img
                        src={selectedMethod.qrBase64}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </button>
                )}

                <p className="text-center text-sm text-muted-foreground mb-5">
                  Scan the QR code above using{" "}
                  <span className="neon-text-cyan font-semibold">
                    {selectedMethod?.name}
                  </span>
                  , then fill in the details below.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="pm-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="pm-name"
                      type="text"
                      required
                      className="neon-input w-full px-4 py-3 text-sm"
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-ocid="payment.input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pm-txnid"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Transaction ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="pm-txnid"
                      type="text"
                      required
                      className="neon-input w-full px-4 py-3 text-sm"
                      placeholder="e.g. TXN123456789"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      data-ocid="payment.input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pm-amount"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Amount
                    </label>
                    <input
                      id="pm-amount"
                      type="text"
                      readOnly
                      className="neon-input w-full px-4 py-3 text-sm opacity-70"
                      value={`₹${Number(product.price).toLocaleString("en-IN")}`}
                      data-ocid="payment.input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pm-screenshot"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
                    >
                      Payment Screenshot <span className="text-red-400">*</span>
                    </label>
                    <label
                      htmlFor="pm-screenshot"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px dashed rgba(123, 77, 255, 0.3)",
                      }}
                      data-ocid="payment.upload_button"
                    >
                      <span>📎</span>
                      {screenshot ? screenshot.name : "Upload screenshot"}
                      <input
                        id="pm-screenshot"
                        type="file"
                        accept="image/*"
                        required
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file && file.size > 2 * 1024 * 1024) {
                            toast.error(
                              "Screenshot too large. Maximum 2MB allowed.",
                            );
                            e.target.value = "";
                            return;
                          }
                          setScreenshot(file);
                        }}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={deposit.isPending}
                    className="neon-btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-2"
                    data-ocid="payment.submit_button"
                  >
                    {deposit.isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Payment"
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* QR Lightbox */}
      <AnimatePresence>
        {lightboxQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-8"
            style={{ background: "rgba(0,0,0,0.9)" }}
            onClick={() => setLightboxQr(null)}
          >
            <img
              src={lightboxQr}
              alt="QR Full Size"
              className="max-w-full max-h-full rounded-2xl"
              style={{ border: "2px solid rgba(123,77,255,0.5)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
