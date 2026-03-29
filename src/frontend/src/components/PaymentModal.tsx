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

  // Build merged list
  const methods: MethodInfo[] = STANDARD_METHODS.map((stdName) => {
    const found = backendMethods?.find((m) => m.name === stdName);
    if (found) return parseMethod(found.name, found.description);
    return { name: stdName, qrBase64: null, enabled: true };
  }).filter((m) => m.enabled);

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
      const txId = await deposit.mutateAsync({
        amount: product.price,
        paymentMethod: selectedMethod.name,
      });
      localStorage.setItem(
        `payment_details_${txId}`,
        JSON.stringify({
          name,
          txnId,
          amount: Number(product.price),
          method: selectedMethod.name,
          product: product.name,
        }),
      );
      setSuccess(true);
    } catch {
      toast.error("Submission failed. Please try again.");
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
                  Admin will review and approve within 24 hours. Your referral
                  system activates after approval.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="neon-btn-primary mt-8 px-8 py-3"
                  data-ocid="payment.confirm_button"
                >
                  Done
                </button>
              </motion.div>
            ) : step === "select" ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {methods.map((method) => (
                    <div
                      key={method.name}
                      className="rounded-xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(123,77,255,0.2)",
                      }}
                      data-ocid="payment.card"
                    >
                      <h3 className="font-display font-bold text-base mb-3 neon-text-cyan">
                        {method.name}
                      </h3>

                      {/* QR Code */}
                      <button
                        type="button"
                        className="w-full aspect-square rounded-lg mb-3 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          maxHeight: "160px",
                        }}
                        onClick={() =>
                          method.qrBase64 && setLightboxQr(method.qrBase64)
                        }
                        data-ocid="payment.button"
                      >
                        {method.qrBase64 ? (
                          <img
                            src={method.qrBase64}
                            alt={`${method.name} QR`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center">
                            <div className="text-3xl mb-2 opacity-30">⬛</div>
                            <p className="text-muted-foreground text-xs">
                              QR Not Set
                            </p>
                          </div>
                        )}
                      </button>

                      <p className="text-muted-foreground text-xs mb-3">
                        Scan &amp; Pay with {method.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleSelectMethod(method)}
                        className="neon-btn-primary w-full py-2 text-sm"
                        data-ocid="payment.primary_button"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setStep("select")}
                    className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
                    data-ocid="payment.button"
                  >
                    ← Back
                  </button>
                  <span className="text-muted-foreground">·</span>
                  <span className="neon-text-cyan text-sm font-semibold">
                    {selectedMethod?.name}
                  </span>
                </div>

                {/* Show QR small */}
                {selectedMethod?.qrBase64 && (
                  <div className="flex justify-center mb-6">
                    <button
                      type="button"
                      className="w-32 h-32 rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxQr(selectedMethod.qrBase64)}
                      style={{ border: "1px solid rgba(123,77,255,0.3)" }}
                      data-ocid="payment.button"
                    >
                      <img
                        src={selectedMethod.qrBase64}
                        alt="QR"
                        className="w-full h-full object-contain"
                      />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="pay-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                    >
                      Your Name *
                    </label>
                    <input
                      type="text"
                      className="neon-input w-full px-4 py-3"
                      id="pay-name"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      data-ocid="payment.input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pay-txnid"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                    >
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      className="neon-input w-full px-4 py-3"
                      id="pay-txnid"
                      placeholder="Enter your transaction ID"
                      value={txnId}
                      onChange={(e) => setTxnId(e.target.value)}
                      required
                      data-ocid="payment.input"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pay-amount"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                    >
                      Amount (Auto-filled)
                    </label>
                    <input
                      type="text"
                      className="neon-input w-full px-4 py-3 opacity-70"
                      id="pay-amount"
                      value={`₹${Number(product.price).toLocaleString("en-IN")}`}
                      disabled
                      readOnly
                      data-ocid="payment.input"
                    />
                  </div>

                  {/* Screenshot upload — label-wrapping pattern for reliable click */}
                  <div>
                    <label
                      htmlFor="pay-screenshot"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2"
                    >
                      Payment Screenshot *
                    </label>
                    <label
                      htmlFor="pay-screenshot"
                      className="w-full rounded-xl p-4 text-center cursor-pointer transition-colors block"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: `1px dashed ${
                          screenshot
                            ? "rgba(52,211,153,0.5)"
                            : "rgba(123,77,255,0.3)"
                        }`,
                      }}
                      data-ocid="payment.upload_button"
                    >
                      {screenshot ? (
                        <div className="text-emerald-400 text-sm font-semibold">
                          ✓ {screenshot.name}
                        </div>
                      ) : (
                        <div>
                          <div className="text-2xl mb-2 opacity-40">📤</div>
                          <p className="text-muted-foreground text-sm">
                            Click to upload screenshot
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            PNG, JPG, WEBP accepted
                          </p>
                        </div>
                      )}
                      <input
                        id="pay-screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setScreenshot(e.target.files?.[0] ?? null)
                        }
                        data-ocid="payment.dropzone"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={deposit.isPending}
                    className="neon-btn-primary w-full py-3.5 font-semibold flex items-center justify-center gap-2"
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
            data-ocid="payment.popover"
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxQr}
              alt="QR Code"
              className="max-w-xs w-full rounded-xl"
              style={{ border: "2px solid rgba(123,77,255,0.5)" }}
            />
            <p className="absolute bottom-8 text-muted-foreground text-sm">
              Click anywhere to close
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
