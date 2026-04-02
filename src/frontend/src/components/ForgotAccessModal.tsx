import { ExternalLink, HelpCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export default function ForgotAccessModal({ onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const openSupport = () => {
    onClose();
    window.dispatchEvent(new CustomEvent("open-support-widget"));
  };

  const steps = [
    {
      num: 1,
      label: "Go to Internet Identity",
      action: (
        <a
          href="https://identity.ic0.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
          style={{
            background:
              "linear-gradient(135deg, rgba(38,214,255,0.2), rgba(123,77,255,0.2))",
            border: "1px solid rgba(38,214,255,0.4)",
            color: "oklch(0.82 0.18 200)",
          }}
          data-ocid="forgot.link"
        >
          <ExternalLink className="w-3 h-3" /> Open identity.ic0.app
        </a>
      ),
    },
    {
      num: 2,
      label: "Use your recovery phrase or a linked device",
      action: null,
    },
    {
      num: 3,
      label: "Return here and click Login",
      action: null,
    },
  ];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        data-ocid="forgot.modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="neon-card w-full max-w-md p-8 relative"
          style={{
            boxShadow:
              "0 0 80px rgba(38,214,255,0.2), 0 0 40px rgba(123,77,255,0.15)",
          }}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(123,77,255,0.2)",
            }}
            data-ocid="forgot.close_button"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-center mb-7">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background:
                  "linear-gradient(135deg, rgba(38,214,255,0.15), rgba(123,77,255,0.2))",
                border: "1px solid rgba(38,214,255,0.4)",
                boxShadow: "0 0 30px rgba(38,214,255,0.25)",
              }}
            >
              <HelpCircle className="w-7 h-7 neon-text-cyan" />
            </div>
            <h2 className="font-display font-black text-2xl gradient-text">
              Account Recovery
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              NeoChain uses{" "}
              <span className="neon-text-cyan font-semibold">
                Internet Identity
              </span>{" "}
              for secure login — no passwords needed. Your login is tied to your
              device.
            </p>
          </div>

          {/* Divider */}
          <div
            className="h-px w-full mb-6"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(38,214,255,0.3), transparent)",
            }}
          />

          {/* Steps */}
          <div className="space-y-4 mb-7">
            {steps.map((step) => (
              <div key={step.num} className="flex items-start gap-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(38,214,255,0.2), rgba(123,77,255,0.3))",
                    border: "1px solid rgba(38,214,255,0.4)",
                    color: "oklch(0.82 0.18 200)",
                  }}
                >
                  {step.num}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground mb-2">{step.label}</p>
                  {step.action}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="h-px w-full mb-5"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(123,77,255,0.3), transparent)",
            }}
          />

          {/* Support */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Still having trouble?
            </p>
            <button
              type="button"
              onClick={openSupport}
              className="neon-btn w-full py-2.5 text-sm"
              style={{
                borderColor: "rgba(201,60,255,0.5)",
                color: "oklch(0.75 0.22 315)",
                boxShadow: "0 0 10px rgba(201,60,255,0.1)",
              }}
              data-ocid="forgot.open_modal_button"
            >
              💬 Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
