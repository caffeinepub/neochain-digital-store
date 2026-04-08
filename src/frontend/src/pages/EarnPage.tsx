import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Coins,
  ExternalLink,
  Lock,
  Shield,
  Star,
  Trophy,
  Upload,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAdminSettings,
  useEarningRecord,
  useRecordSpinResult,
  useSpinHistory,
  useSubmitVIPPurchase,
  useUpdateDailyEarning,
  useUserProfile,
} from "../hooks/useQueries";
import {
  getCurrencySymbol,
  getRegionCurrency,
  isAllowedRegion,
} from "../utils/regionDetect";

// ─── Task Definitions ─────────────────────────────────────────────────────────
const TASKS = [
  {
    id: "task_ad1",
    label: "Watch Ad Video",
    reward: 0.5,
    icon: "📺",
    desc: "Watch a 30s ad to earn",
    url: "https://www.google.com/search?q=digital+earning",
    cooldown: 60,
  },
  {
    id: "task_affiliate1",
    label: "Click Affiliate Offer",
    reward: 0.3,
    icon: "🔗",
    desc: "Visit partner offer",
    url: "https://www.flipkart.com/",
    cooldown: 45,
  },
  {
    id: "task_ad2",
    label: "View Banner Ad",
    reward: 0.1,
    icon: "🖼️",
    desc: "View sponsored banner",
    url: "https://www.amazon.in/",
    cooldown: 30,
  },
  {
    id: "task_survey",
    label: "Short Survey",
    reward: 0.4,
    icon: "📋",
    desc: "2-minute survey",
    url: "https://www.surveymonkey.com/",
    cooldown: 60,
  },
];

// ─── Spin Wheel Config ────────────────────────────────────────────────────────
const SPIN_SEGMENTS = [
  { label: "Better Luck", reward: 0, color: "#1a1040", textColor: "#a78bfa" },
  { label: "₹30", reward: 30, color: "#0a1a2e", textColor: "#26d6ff" },
  { label: "Better Luck", reward: 0, color: "#1a1040", textColor: "#a78bfa" },
  { label: "₹50", reward: 50, color: "#0d1a10", textColor: "#00e676" },
  { label: "Better Luck", reward: 0, color: "#1a1040", textColor: "#a78bfa" },
  { label: "₹70", reward: 70, color: "#0a1a2e", textColor: "#26d6ff" },
  { label: "Better Luck", reward: 0, color: "#1a1040", textColor: "#a78bfa" },
  { label: "₹100", reward: 100, color: "#1a1000", textColor: "#ffc800" },
];

function getSpinResult(consecutiveLosses: number): number {
  if (consecutiveLosses >= 3) {
    const guaranteed = [3, 5, 7];
    return guaranteed[Math.floor(Math.random() * guaranteed.length)];
  }
  const rand = Math.random() * 100;
  if (rand < 80) {
    const lossIdx = [0, 2, 4, 6];
    return lossIdx[Math.floor(Math.random() * lossIdx.length)];
  }
  if (rand < 90) return 1;
  if (rand < 94) return 3;
  if (rand < 98) return 5;
  return 7;
}

// ─── VIP Tiers ────────────────────────────────────────────────────────────────
const VIP_TIERS = [
  {
    id: "basic",
    name: "Basic VIP",
    icon: "⭐",
    priceINR: 199,
    priceNPR: 320,
    boost: "1.5x",
    color: "rgba(38,214,255,0.35)",
    glow: "0 0 30px rgba(38,214,255,0.2)",
    perks: ["1.5x earning boost", "Unlock extra tasks", "Priority support"],
  },
  {
    id: "pro",
    name: "Pro VIP",
    icon: "💎",
    priceINR: 499,
    priceNPR: 800,
    boost: "2x",
    color: "rgba(123,77,255,0.45)",
    glow: "0 0 30px rgba(123,77,255,0.25)",
    perks: ["2x earning boost", "Faster withdrawal", "Extra referral bonus"],
  },
  {
    id: "premium",
    name: "Premium VIP",
    icon: "👑",
    priceINR: 15000,
    priceNPR: 24000,
    boost: "3x",
    color: "rgba(255,200,0,0.45)",
    glow: "0 0 30px rgba(255,200,0,0.25)",
    perks: [
      "3x earning boost",
      "All tasks unlocked",
      "VIP badge + leaderboard",
    ],
  },
];

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(targetMs: number | null): string {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    if (!targetMs) {
      setDisplay("");
      return;
    }
    const tick = () => {
      const diff = targetMs - Date.now();
      if (diff <= 0) {
        setDisplay("");
        return;
      }
      const s = Math.floor(diff / 1000);
      if (s < 60) setDisplay(`${s}s`);
      else if (s < 3600) setDisplay(`${Math.floor(s / 60)}m ${s % 60}s`);
      else
        setDisplay(`${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetMs]);
  return display;
}

// ─── VIP Modal ────────────────────────────────────────────────────────────────
interface VIPModalProps {
  currency: "INR" | "NPR" | null;
  symbol: string;
  onClose: () => void;
  userProfile: { username?: string; email?: string } | null | undefined;
}

function VIPModal({ currency, symbol, onClose, userProfile }: VIPModalProps) {
  const [step, setStep] = useState<"tier" | "payment" | "form">("tier");
  const [selectedTier, setSelectedTier] = useState<
    (typeof VIP_TIERS)[0] | null
  >(null);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [screenshot, setScreenshot] = useState("");
  const [userName, setUserName] = useState(userProfile?.username ?? "");
  const [userEmail, setUserEmail] = useState(userProfile?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const submit = useSubmitVIPPurchase();

  const methods =
    currency === "NPR"
      ? ["eSewa", "Khalti"]
      : ["Google Pay (UPI)", "PhonePe (UPI)", "Paytm (UPI)"];
  const tierPrice = selectedTier
    ? currency === "NPR"
      ? selectedTier.priceNPR
      : selectedTier.priceINR
    : 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large (max 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedTier || !screenshot || !userName || !userEmail) return;
    setSubmitting(true);
    try {
      await submit.mutateAsync({
        tier: selectedTier.id,
        amount: BigInt(Math.round(tierPrice * 100)),
        currency: currency ?? "INR",
        paymentMethod: selectedMethod,
        screenshot,
        userName,
        userEmail,
      });
      setSuccess(true);
    } catch {
      alert("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,4,18,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          background: "rgba(10,8,30,0.95)",
          border: "1px solid rgba(123,77,255,0.5)",
          boxShadow: "0 0 60px rgba(123,77,255,0.2)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        >
          ✕
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="font-display font-bold text-lg neon-text-cyan mb-2">
              Submitted!
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Your VIP purchase is under review. Admin will approve within 24
              hours.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="neon-btn-primary px-6 py-2.5 text-sm font-bold"
            >
              Close
            </button>
          </div>
        ) : step === "tier" ? (
          <div>
            <h3
              className="font-display font-bold text-lg mb-1"
              style={{ color: "oklch(0.85 0.18 85)" }}
            >
              💎 Choose VIP Tier
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Daily cap applies to all users. VIP boosts task rewards.
            </p>
            <div className="space-y-3">
              {VIP_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setSelectedTier(tier);
                    setStep("payment");
                  }}
                  className="w-full text-left rounded-xl p-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: "rgba(10,8,30,0.7)",
                    border: `1px solid ${tier.color}`,
                    boxShadow: tier.glow,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-sm text-foreground">
                      {tier.icon} {tier.name}
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: "oklch(0.85 0.18 85)" }}
                    >
                      {symbol}
                      {currency === "NPR" ? tier.priceNPR : tier.priceINR}
                    </span>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mb-2"
                    style={{
                      background: "rgba(255,200,0,0.12)",
                      color: "oklch(0.85 0.18 85)",
                      border: "1px solid rgba(255,200,0,0.3)",
                    }}
                  >
                    {tier.boost} Boost
                  </span>
                  <ul className="space-y-0.5">
                    {tier.perks.map((p) => (
                      <li
                        key={p}
                        className="text-xs text-muted-foreground flex items-center gap-1"
                      >
                        <span style={{ color: "oklch(0.75 0.22 160)" }}>✓</span>{" "}
                        {p}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        ) : step === "payment" ? (
          <div>
            <button
              type="button"
              onClick={() => setStep("tier")}
              className="text-xs text-muted-foreground hover:neon-text-cyan mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h3 className="font-display font-bold text-base mb-1 text-foreground">
              {selectedTier?.icon} {selectedTier?.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select payment method — {symbol}
              {tierPrice}
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {methods.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMethod(m);
                    setStep("form");
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:glow-cyan-bright text-left"
                  style={{
                    background: "rgba(10,8,30,0.7)",
                    border: "1px solid rgba(38,214,255,0.3)",
                  }}
                >
                  <span className="text-lg">💳</span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {m}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Manual payment
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setStep("payment")}
              className="text-xs text-muted-foreground hover:neon-text-cyan mb-4 flex items-center gap-1"
            >
              ← Back
            </button>
            <h3 className="font-display font-bold text-base mb-1 text-foreground">
              Submit Payment Proof
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {selectedTier?.name} via {selectedMethod} — {symbol}
              {tierPrice}
            </p>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="vip-name"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Your Name
                </label>
                <input
                  id="vip-name"
                  className="neon-input w-full px-3 py-2.5 text-sm"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label
                  htmlFor="vip-email"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Email
                </label>
                <input
                  id="vip-email"
                  className="neon-input w-full px-3 py-2.5 text-sm"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                />
              </div>
              <div>
                <label
                  htmlFor="vip-screenshot"
                  className="text-xs text-muted-foreground block mb-1"
                >
                  Payment Screenshot
                </label>
                <button
                  id="vip-screenshot"
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm transition-all"
                  style={{
                    border: "1px dashed rgba(123,77,255,0.4)",
                    background: "rgba(123,77,255,0.05)",
                  }}
                >
                  {screenshot ? (
                    <span style={{ color: "oklch(0.75 0.22 160)" }}>
                      ✓ Screenshot uploaded
                    </span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Upload screenshot (max 2MB)
                      </span>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                  aria-label="Payment screenshot upload"
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !screenshot || !userName || !userEmail}
                className="neon-btn-primary w-full py-3 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                data-ocid="earn.vip_submit_btn"
              >
                {submitting ? "Submitting…" : "Submit for Approval"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Spin Wheel Canvas ────────────────────────────────────────────────────────
interface SpinWheelProps {
  spinning: boolean;
  finalIndex: number | null;
  onAnimEnd: () => void;
}

function SpinWheel({ spinning, finalIndex, onAnimEnd }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotRef = useRef(0);
  const rafRef = useRef<number>(0);
  const spinRef = useRef(false);

  const drawWheel = useCallback((rotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = cx - 8;
    const n = SPIN_SEGMENTS.length;
    const arc = (2 * Math.PI) / n;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer ring glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(38,214,255,0.3)";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(38,214,255,0.6)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < n; i++) {
      const seg = SPIN_SEGMENTS[i];
      const startAngle = rotation + i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(123,77,255,0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = seg.textColor;
      ctx.font = `bold ${seg.reward > 0 ? "13" : "11"}px BricolageGrotesque, sans-serif`;
      ctx.shadowColor = seg.textColor;
      ctx.shadowBlur = 6;
      ctx.fillText(seg.label, r - 10, 5);
      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    grad.addColorStop(0, "rgba(38,214,255,0.5)");
    grad.addColorStop(1, "rgba(10,8,30,0.9)");
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(38,214,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pointer
    ctx.save();
    ctx.translate(cx, cy - r - 2);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fillStyle = "#26d6ff";
    ctx.shadowColor = "#26d6ff";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  }, []);

  useEffect(() => {
    drawWheel(rotRef.current);
  }, [drawWheel]);

  useEffect(() => {
    if (!spinning || finalIndex === null) return;
    if (spinRef.current) return;
    spinRef.current = true;

    const n = SPIN_SEGMENTS.length;
    const arc = (2 * Math.PI) / n;
    const extraSpins = 5 * 2 * Math.PI;
    const targetRot = -Math.PI / 2 - (finalIndex * arc + arc / 2) + extraSpins;
    const startRot = rotRef.current;
    const diff = targetRot - (startRot % (2 * Math.PI));
    const totalDelta = diff + extraSpins;

    let startTime: number | null = null;
    const duration = 4000;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      rotRef.current = startRot + totalDelta * eased;
      drawWheel(rotRef.current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        spinRef.current = false;
        onAnimEnd();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      spinRef.current = false;
    };
  }, [spinning, finalIndex, drawWheel, onAnimEnd]);

  return (
    <canvas
      ref={canvasRef}
      width={220}
      height={220}
      style={{ display: "block", margin: "0 auto" }}
      aria-label="Spin wheel"
    />
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: (typeof TASKS)[0];
  multiplier: number;
  symbol: string;
  isLocked: boolean;
  onComplete: (taskId: string, reward: number) => Promise<void>;
  index: number;
}

function TaskCard({
  task,
  multiplier,
  symbol,
  isLocked,
  onComplete,
  index,
}: TaskCardProps) {
  const COOLDOWN_KEY = `neochain_task_cd_${task.id}`;
  const CONFIRM_KEY = `neochain_task_confirm_${task.id}`;

  const getCooldownEnd = () => {
    const v = localStorage.getItem(COOLDOWN_KEY);
    return v ? Number.parseInt(v, 10) : null;
  };
  const getConfirmAvailAt = () => {
    const v = localStorage.getItem(CONFIRM_KEY);
    return v ? Number.parseInt(v, 10) : null;
  };

  const [cooldownEnd, setCooldownEnd] = useState<number | null>(getCooldownEnd);
  const [confirmAt, setConfirmAt] = useState<number | null>(getConfirmAvailAt);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const countdown = useCountdown(
    cooldownEnd && cooldownEnd > Date.now() ? cooldownEnd : null,
  );
  const confirmCountdown = useCountdown(
    confirmAt && confirmAt > Date.now() ? confirmAt : null,
  );

  const isOnCooldown = !!(cooldownEnd && cooldownEnd > Date.now());
  const canConfirm = !!(confirmAt && confirmAt <= Date.now() && !confirmed);
  const waitingToConfirm = !!(confirmAt && confirmAt > Date.now());

  const handleGoToTask = () => {
    if (isLocked || isOnCooldown) return;
    window.open(task.url, "_blank", "noopener,noreferrer");
    const confirmTime = Date.now() + 30000;
    localStorage.setItem(CONFIRM_KEY, confirmTime.toString());
    setConfirmAt(confirmTime);
  };

  const handleConfirm = async () => {
    if (!canConfirm || isLocked) return;
    setConfirming(true);
    try {
      await onComplete(task.id, task.reward * multiplier);
      const cdEnd = Date.now() + task.cooldown * 1000;
      localStorage.setItem(COOLDOWN_KEY, cdEnd.toString());
      setCooldownEnd(cdEnd);
      localStorage.removeItem(CONFIRM_KEY);
      setConfirmAt(null);
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 3000);
    } finally {
      setConfirming(false);
    }
  };

  const rewardAmt = task.reward * multiplier;

  return (
    <div
      className={`neon-card p-4 transition-all ${!isLocked && !isOnCooldown ? "hover:glow-green" : "opacity-60"}`}
      data-ocid={`earn.task_card_${index}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0 mt-0.5">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-semibold text-sm text-foreground truncate">
              {task.label}
            </span>
            <span
              className="font-bold text-sm shrink-0"
              style={{ color: "oklch(0.75 0.22 160)" }}
            >
              +{symbol}
              {rewardAmt.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{task.desc}</p>

          {confirmed ? (
            <div
              className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "oklch(0.75 0.22 160)" }}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Reward credited!
            </div>
          ) : isOnCooldown ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> Cooldown: {countdown}
            </div>
          ) : waitingToConfirm ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" /> Confirm in {confirmCountdown}…
            </div>
          ) : canConfirm ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming || isLocked}
              className="neon-btn-primary px-4 py-1.5 text-xs font-bold disabled:opacity-50"
              data-ocid={`earn.task_confirm_${index}`}
            >
              {confirming ? "Crediting…" : "✓ Confirm Completion"}
            </button>
          ) : isLocked ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3.5 h-3.5" /> Locked
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoToTask}
              className="neon-btn px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
              data-ocid={`earn.task_go_${index}`}
            >
              <ExternalLink className="w-3 h-3" /> Go to Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EarnPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const { data: userProfile } = useUserProfile();
  const { data: earningRecord, refetch: refetchEarning } = useEarningRecord(
    userProfile?.user,
  );
  const { data: spinHistory, refetch: refetchSpin } = useSpinHistory(
    userProfile?.user,
  );
  const { data: adminSettings } = useAdminSettings();
  const updateEarning = useUpdateDailyEarning();
  const recordSpin = useRecordSpinResult();

  const [allowed] = useState(() => isAllowedRegion());
  const currency = getRegionCurrency();
  const symbol = getCurrencySymbol(currency);

  const [showVIPModal, setShowVIPModal] = useState(false);

  // Spin state
  const SPIN_CD_KEY = "neochain_spin_cd";
  const [spinCooldownEnd, setSpinCooldownEnd] = useState<number | null>(() => {
    const v = localStorage.getItem(SPIN_CD_KEY);
    return v ? Number.parseInt(v, 10) : null;
  });
  const [spinning, setSpinning] = useState(false);
  const [spinFinalIdx, setSpinFinalIdx] = useState<number | null>(null);
  const [spinResultMsg, setSpinResultMsg] = useState<string | null>(null);

  const spinCountdown = useCountdown(
    spinCooldownEnd && spinCooldownEnd > Date.now() ? spinCooldownEnd : null,
  );

  // Daily login bonus
  const LOGIN_BONUS_KEY = "neochain_login_bonus_date";
  const todayStr = new Date().toDateString();
  const [loginBonusClaimed, setLoginBonusClaimed] = useState(
    () => localStorage.getItem(LOGIN_BONUS_KEY) === todayStr,
  );
  const [loginBonusLoading, setLoginBonusLoading] = useState(false);

  const [midnightMs] = useState(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime();
  });
  const midnightCountdown = useCountdown(loginBonusClaimed ? midnightMs : null);

  useEffect(() => {
    if (!isInitializing && !identity) navigate({ to: "/" });
  }, [identity, isInitializing, navigate]);

  if (isInitializing || !identity) return null;

  // Region block — full screen
  if (!allowed) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center px-4">
        <div
          className="p-8 max-w-md w-full text-center rounded-2xl"
          style={{
            background: "rgba(10,8,30,0.9)",
            border: "2px solid rgba(255,60,60,0.5)",
            boxShadow: "0 0 60px rgba(255,60,60,0.15)",
          }}
          data-ocid="earn.region_block"
        >
          <Shield
            className="w-14 h-14 mx-auto mb-4"
            style={{ color: "oklch(0.65 0.24 27)" }}
          />
          <h2 className="font-display font-bold text-2xl mb-3 text-foreground">
            Region Restricted
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This platform is only available in{" "}
            <strong className="text-foreground">India &amp; Nepal</strong>.
            Earning features are not accessible from your current location.
          </p>
          <div
            className="mt-6 px-4 py-3 rounded-xl text-xs text-muted-foreground"
            style={{
              background: "rgba(255,60,60,0.07)",
              border: "1px solid rgba(255,60,60,0.2)",
            }}
          >
            VPN, proxy, or emulator usage is detected and blocked automatically.
          </div>
        </div>
      </div>
    );
  }

  const earningEnabled = adminSettings?.earningEnabled ?? true;
  const dailyCap =
    currency === "NPR"
      ? Number(adminSettings?.dailyCapNPR ?? 3000n) / 100
      : Number(adminSettings?.dailyCapINR ?? 2000n) / 100;
  const dailyEarned = Number(earningRecord?.dailyEarned ?? 0n) / 100;
  const progressPct = Math.min(100, (dailyEarned / dailyCap) * 100);
  const atDailyCap = progressPct >= 100;
  const streakDays = Number(earningRecord?.streakDays ?? 0n);
  const consecutiveLosses = Number(earningRecord?.consecutiveLosses ?? 0n);
  const totalSpins = Number(spinHistory?.totalSpins ?? 0n);
  const totalWon = Number(spinHistory?.totalWon ?? 0n) / 100;
  const vipTier = userProfile?.vipTier as string | undefined;
  const multiplier =
    vipTier === "premium"
      ? 3
      : vipTier === "pro"
        ? 2
        : vipTier === "basic"
          ? 1.5
          : 1;

  const isSpinOnCooldown = !!(spinCooldownEnd && spinCooldownEnd > Date.now());
  const spinLocked =
    !earningEnabled || atDailyCap || isSpinOnCooldown || spinning;

  const handleLoginBonus = async () => {
    if (
      loginBonusClaimed ||
      !userProfile?.user ||
      !earningEnabled ||
      atDailyCap
    )
      return;
    setLoginBonusLoading(true);
    try {
      const bonusAmt = currency === "NPR" ? 200n : 100n;
      await updateEarning.mutateAsync({
        user: userProfile.user,
        amount: bonusAmt,
      });
      localStorage.setItem(LOGIN_BONUS_KEY, todayStr);
      setLoginBonusClaimed(true);
      await refetchEarning();
    } catch {
      alert("Could not claim bonus. Try again.");
    } finally {
      setLoginBonusLoading(false);
    }
  };

  const handleTaskComplete = async (_taskId: string, reward: number) => {
    if (!userProfile?.user || atDailyCap || !earningEnabled) return;
    const remaining = dailyCap - dailyEarned;
    const credited = Math.min(reward, remaining);
    await updateEarning.mutateAsync({
      user: userProfile.user,
      amount: BigInt(Math.round(credited * 100)),
    });
    await refetchEarning();
  };

  const handleSpin = () => {
    if (spinLocked) return;
    setSpinResultMsg(null);
    const idx = getSpinResult(consecutiveLosses);
    setSpinFinalIdx(idx);
    setSpinning(true);
  };

  const handleSpinAnimEnd = async () => {
    if (spinFinalIdx === null) return;
    const seg = SPIN_SEGMENTS[spinFinalIdx];
    setSpinning(false);

    const cdEnd = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(SPIN_CD_KEY, cdEnd.toString());
    setSpinCooldownEnd(cdEnd);

    try {
      if (seg.reward > 0) {
        const amountPaise = BigInt(Math.round(seg.reward * 100));
        await recordSpin.mutateAsync({
          result: seg.label,
          amountWon: amountPaise,
        });
        if (userProfile?.user) {
          const remaining = dailyCap - dailyEarned;
          const credited = Math.min(seg.reward, remaining);
          if (credited > 0) {
            await updateEarning.mutateAsync({
              user: userProfile.user,
              amount: BigInt(Math.round(credited * 100)),
            });
          }
        }
        setSpinResultMsg(`🎉 You won ${symbol}${seg.reward}!`);
      } else {
        await recordSpin.mutateAsync({ result: "Better Luck", amountWon: 0n });
        setSpinResultMsg("😔 Better Luck Next Time!");
      }
      await Promise.all([refetchSpin(), refetchEarning()]);
    } catch {
      // Non-critical
    }
  };

  const streakDay = streakDays % 7 === 0 && streakDays > 0 ? 7 : streakDays % 7;

  return (
    <div className="pt-16 pb-16 min-h-screen">
      {showVIPModal && (
        <VIPModal
          currency={currency}
          symbol={symbol}
          onClose={() => setShowVIPModal(false)}
          userProfile={
            userProfile as { username?: string; email?: string } | null
          }
        />
      )}

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Header */}
        <div className="neon-card-earn p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display font-black text-2xl gradient-text">
                Earn Hub
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Complete tasks, spin &amp; earn daily rewards
              </p>
            </div>
            {vipTier && (
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold font-display uppercase shrink-0"
                style={{
                  background: "rgba(255,200,0,0.12)",
                  border: "1px solid rgba(255,200,0,0.4)",
                  color: "oklch(0.85 0.18 85)",
                }}
                data-ocid="earn.vip_badge"
              >
                ⭐ {vipTier.toUpperCase()} VIP
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                Daily Earning
              </span>
              <span className="text-xs font-bold neon-text-cyan">
                {symbol}
                {dailyEarned.toFixed(2)} / {symbol}
                {dailyCap}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(38,214,255,0.1)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: atDailyCap
                    ? "linear-gradient(90deg, oklch(0.65 0.24 27), oklch(0.7 0.2 27))"
                    : "linear-gradient(90deg, oklch(0.82 0.18 210), oklch(0.72 0.22 280))",
                }}
              />
            </div>
            {atDailyCap && (
              <p
                className="text-xs mt-1.5"
                style={{ color: "oklch(0.7 0.2 27)" }}
              >
                Daily limit reached — come back tomorrow!
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Streak",
              value: `${streakDays}d`,
              icon: "🔥",
              color: "oklch(0.75 0.2 45)",
            },
            {
              label: "VIP Boost",
              value: `${multiplier}x`,
              icon: "⭐",
              color: "oklch(0.85 0.18 85)",
            },
            {
              label: "Spins Won",
              value: `${symbol}${totalWon.toFixed(0)}`,
              icon: "🎰",
              color: "oklch(0.72 0.22 280)",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card text-center">
              <div className="text-xl mb-1">{s.icon}</div>
              <div
                className="font-display font-bold text-base"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Earning Disabled Banner */}
        {!earningEnabled && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: "rgba(255,60,60,0.08)",
              border: "1px solid rgba(255,60,60,0.25)",
            }}
            data-ocid="earn.disabled_banner"
          >
            <Lock
              className="w-5 h-5 shrink-0"
              style={{ color: "oklch(0.65 0.24 27)" }}
            />
            <p className="text-sm text-foreground">
              Earning is temporarily paused by admin. Check back soon.
            </p>
          </div>
        )}

        {/* Daily Login Bonus */}
        <div
          className={`neon-card-earn p-4 flex items-center gap-4 ${loginBonusClaimed ? "opacity-70" : ""}`}
          data-ocid="earn.login_bonus"
        >
          <CheckCircle
            className="w-9 h-9 shrink-0"
            style={{ color: "oklch(0.75 0.22 160)" }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">
              Daily Login Bonus
            </div>
            <div className="text-xs text-muted-foreground">
              {currency === "NPR" ? "NPR 2" : "₹1"} credited each day you log
              in.
              {streakDays >= 7 && " 🎁 7-day streak bonus active!"}
            </div>
            {loginBonusClaimed && midnightCountdown && (
              <div
                className="text-xs mt-1"
                style={{ color: "oklch(0.65 0.18 85)" }}
              >
                Come back in {midnightCountdown}
              </div>
            )}
          </div>
          <div className="shrink-0">
            {loginBonusClaimed ? (
              <span className="badge-status-approved">Claimed</span>
            ) : (
              <button
                type="button"
                onClick={handleLoginBonus}
                disabled={loginBonusLoading || !earningEnabled || atDailyCap}
                className="neon-btn-primary px-4 py-2 text-xs font-bold disabled:opacity-40"
                data-ocid="earn.login_bonus_btn"
              >
                {loginBonusLoading
                  ? "…"
                  : `+${currency === "NPR" ? "NPR 2" : "₹1"}`}
              </button>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 neon-text-cyan" /> Daily Tasks
          </h2>
          <div className="space-y-2.5">
            {TASKS.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                multiplier={multiplier}
                symbol={symbol}
                isLocked={!earningEnabled || atDailyCap}
                onComplete={handleTaskComplete}
                index={i}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2.5 px-1 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Ad interaction required before reward is credited. 30–60s cooldown
            enforced.
          </p>
        </div>

        {/* Spin Wheel */}
        <div className="neon-card-magenta p-5" data-ocid="earn.spin_section">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-base neon-text-magenta flex items-center gap-2">
                🎰 Daily Spin
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Win ₹30 · ₹50 · ₹70 · ₹100 — {totalSpins} spins total
              </p>
            </div>
            {consecutiveLosses >= 3 && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{
                  background: "rgba(255,200,0,0.12)",
                  color: "oklch(0.85 0.18 85)",
                  border: "1px solid rgba(255,200,0,0.3)",
                }}
              >
                🍀 Luck Boost!
              </span>
            )}
          </div>

          <SpinWheel
            spinning={spinning}
            finalIndex={spinFinalIdx}
            onAnimEnd={handleSpinAnimEnd}
          />

          {spinResultMsg && (
            <div
              className="mt-4 py-2.5 px-4 rounded-xl text-center text-sm font-semibold"
              style={{
                background: spinResultMsg.startsWith("🎉")
                  ? "rgba(0,230,118,0.1)"
                  : "rgba(123,77,255,0.1)",
                border: spinResultMsg.startsWith("🎉")
                  ? "1px solid rgba(0,230,118,0.3)"
                  : "1px solid rgba(123,77,255,0.3)",
                color: spinResultMsg.startsWith("🎉")
                  ? "oklch(0.75 0.22 160)"
                  : "oklch(0.72 0.22 280)",
              }}
            >
              {spinResultMsg}
            </div>
          )}

          <div className="mt-4 text-center">
            {isSpinOnCooldown ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" /> Next spin in {spinCountdown}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSpin}
                disabled={spinLocked}
                className="neon-btn-primary px-8 py-2.5 text-sm font-bold spin-btn-pulse disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderRadius: "9999px" }}
                data-ocid="earn.spin_btn"
              >
                {spinning
                  ? "Spinning…"
                  : atDailyCap
                    ? "Cap Reached"
                    : "Spin Now"}
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {SPIN_SEGMENTS.filter((s) => s.reward > 0).map((s) => (
              <div
                key={s.label}
                className="text-center py-1 rounded-lg text-xs"
                style={{
                  background: "rgba(201,60,255,0.06)",
                  border: "1px solid rgba(201,60,255,0.15)",
                }}
              >
                <div className="font-bold" style={{ color: s.textColor }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Streak */}
        <div
          className="neon-card-leaderboard p-5"
          data-ocid="earn.streak_section"
        >
          <div className="flex items-center gap-3 mb-3">
            <Trophy
              className="w-6 h-6"
              style={{ color: "oklch(0.85 0.18 85)" }}
            />
            <div>
              <h2
                className="font-display font-bold text-base"
                style={{ color: "oklch(0.85 0.18 85)" }}
              >
                Daily Streak
              </h2>
              <p className="text-xs text-muted-foreground">
                Log in 7 days in a row for a bonus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {Array.from({ length: 7 }, (_, i) => {
              const active = i < streakDay;
              return (
                <div
                  key={`streak-day-${i + 1}`}
                  className="flex-1 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: active
                      ? "rgba(255,200,0,0.2)"
                      : "rgba(255,200,0,0.05)",
                    border: active
                      ? "1px solid rgba(255,200,0,0.5)"
                      : "1px solid rgba(255,200,0,0.15)",
                    color: active
                      ? "oklch(0.85 0.18 85)"
                      : "oklch(0.4 0.05 280)",
                    boxShadow: active ? "0 0 8px rgba(255,200,0,0.3)" : "none",
                  }}
                >
                  {active ? "🔥" : i + 1}
                </div>
              );
            })}
          </div>

          <div
            className="w-full h-1.5 rounded-full overflow-hidden mb-2"
            style={{ background: "rgba(255,200,0,0.1)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (streakDay / 7) * 100)}%`,
                background:
                  "linear-gradient(90deg, rgba(255,200,0,0.6), rgba(255,200,0,0.9))",
                boxShadow: "0 0 8px rgba(255,200,0,0.4)",
              }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Day {streakDay} of 7</span>
            <span style={{ color: "oklch(0.85 0.18 85)" }}>
              {streakDays >= 7
                ? "🎁 Bonus earned!"
                : `${symbol}5 bonus at day 7`}
            </span>
          </div>
        </div>

        {/* VIP Section */}
        {!vipTier ? (
          <div
            className="neon-card-leaderboard p-5"
            data-ocid="earn.vip_section"
          >
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">💎</div>
              <h2
                className="font-display font-bold text-lg"
                style={{ color: "oklch(0.85 0.18 85)" }}
              >
                Unlock VIP Earning Boosts
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Daily cap applies to all. VIP multiplies your task rewards.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {VIP_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(10,8,30,0.6)",
                    border: `1px solid ${tier.color}`,
                    boxShadow: tier.glow,
                  }}
                >
                  <div className="text-lg mb-1">{tier.icon}</div>
                  <div className="font-display font-bold text-xs text-foreground truncate">
                    {tier.name}
                  </div>
                  <div
                    className="text-xs font-bold mt-1"
                    style={{ color: "oklch(0.85 0.18 85)" }}
                  >
                    {tier.boost}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {symbol}
                    {currency === "NPR" ? tier.priceNPR : tier.priceINR}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowVIPModal(true)}
              className="neon-btn-primary w-full py-3 text-sm font-bold"
              data-ocid="earn.vip_upgrade_btn"
            >
              <Coins className="w-4 h-4 inline mr-1.5" />
              Upgrade to VIP
            </button>
          </div>
        ) : (
          <div
            className="p-4 rounded-2xl flex items-center gap-3"
            style={{
              background: "rgba(255,200,0,0.07)",
              border: "1px solid rgba(255,200,0,0.3)",
            }}
            data-ocid="earn.vip_active"
          >
            <Star
              className="w-6 h-6 shrink-0"
              style={{ color: "oklch(0.85 0.18 85)" }}
            />
            <div className="flex-1">
              <div
                className="font-display font-bold text-sm"
                style={{ color: "oklch(0.85 0.18 85)" }}
              >
                {vipTier.charAt(0).toUpperCase() + vipTier.slice(1)} VIP Active
              </div>
              <div className="text-xs text-muted-foreground">
                {multiplier}x earning boost applied to all tasks
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowVIPModal(true)}
              className="neon-btn px-3 py-1.5 text-xs font-semibold shrink-0"
              data-ocid="earn.vip_upgrade_cta"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
