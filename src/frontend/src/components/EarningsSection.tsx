import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Gift,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import RegisterModal from "./RegisterModal";

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

function getCountdown(targetMs: number): string {
  const diff = targetMs - Date.now();
  if (diff <= 0) return "Available now!";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

// Spin wheel constants
const SPIN_AMOUNTS = [10, 12, 15, 18, 20, 22, 25, 30];
const SPIN_DURATION_MS = 3000;
const SEGMENT_COLORS = [
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#06b6d4", // cyan
  "#10b981", // teal
  "#ec4899", // pink
  "#a855f7", // violet
  "#f59e0b", // amber
  "#6366f1", // indigo
];
const WHEEL_SIZE = 240;
const WHEEL_CX = 120;
const WHEEL_CY = 120;
const WHEEL_R = 108;

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segmentPath(i: number): string {
  const startAngle = i * 45;
  const endAngle = (i + 1) * 45;
  const start = polarToXY(WHEEL_CX, WHEEL_CY, WHEEL_R, startAngle);
  const end = polarToXY(WHEEL_CX, WHEEL_CY, WHEEL_R, endAngle);
  return `M ${WHEEL_CX},${WHEEL_CY} L ${start.x.toFixed(2)},${start.y.toFixed(2)} A ${WHEEL_R},${WHEEL_R} 0 0,1 ${end.x.toFixed(2)},${end.y.toFixed(2)} Z`;
}

// Audio helpers using Web Audio API

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function createAudioContext(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  } catch {
    return null;
  }
}

function playTick(ctx: AudioContext) {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600 + Math.random() * 200;
    osc.type = "square";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}

function playWin(ctx: AudioContext) {
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = ctx.currentTime + i * 0.13;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {}
}

export default function EarningsSection() {
  const { actor } = useActor();
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const qc = useQueryClient();
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toText() ?? "";
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

  // --- Login bonus ---
  const [loginBonusClaimed, setLoginBonusClaimed] = useState(false);
  const [loginBonusTime, setLoginBonusTime] = useState("");
  const loginBonusRan = useRef(false);

  useEffect(() => {
    if (!principalText || !userProfile || !actor || loginBonusRan.current)
      return;
    loginBonusRan.current = true;
    const key = `lastLoginBonus_${principalText}`;
    const last = localStorage.getItem(key);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    if (last === today) {
      setLoginBonusClaimed(true);
      const nextMidnight = new Date(now);
      nextMidnight.setDate(nextMidnight.getDate() + 1);
      nextMidnight.setHours(0, 0, 0, 0);
      setLoginBonusTime(nextMidnight.toLocaleTimeString());
      return;
    }
    const updated = { ...userProfile, balance: userProfile.balance + 5n };
    actor
      .saveCallerUserProfile(updated)
      .then(() => {
        localStorage.setItem(key, today);
        qc.invalidateQueries({ queryKey: ["userProfile"] });
        setLoginBonusClaimed(true);
        toast.success("🎉 Welcome Bonus! ₹5 credited to your account!", {
          duration: 4000,
        });
      })
      .catch(() => {});
  }, [principalText, userProfile, actor, qc]);

  // --- Spin wheel ---
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [spinAvailable, setSpinAvailable] = useState(false);
  const [nextSpinCountdown, setNextSpinCountdown] = useState("");
  const [spinDeg, setSpinDeg] = useState(0);
  const [spinCount, setSpinCount] = useState(0);

  // Load spin count on mount
  useEffect(() => {
    if (!principalText) return;
    const count = Number.parseInt(
      localStorage.getItem(`spinCount_${principalText}`) ?? "0",
      10,
    );
    setSpinCount(count);
  }, [principalText]);

  // Audio context ref (lazy init on first interaction)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    if (!identity) return;
    const check = () => {
      const lastSpinKey = `lastSpin_${principalText}`;
      const lastSpin = localStorage.getItem(lastSpinKey);
      if (!lastSpin) {
        setSpinAvailable(true);
        setNextSpinCountdown("");
      } else {
        const last = Number.parseInt(lastSpin, 10);
        const nextTime = last + 24 * 60 * 60 * 1000;
        if (Date.now() >= nextTime) {
          setSpinAvailable(true);
          setNextSpinCountdown("");
        } else {
          setSpinAvailable(false);
          setNextSpinCountdown(getCountdown(nextTime));
        }
      }
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [principalText, identity]);

  const handleSpin = async () => {
    if (!spinAvailable || isSpinning) return;
    if (!identity) {
      toast.error("Please log in to spin");
      return;
    }
    if (isProfileLoading) {
      toast.info("Loading your profile, please wait...");
      return;
    }
    if (!userProfile) {
      toast.error("Please register your account first to spin!");
      setRegisterModalOpen(true);
      return;
    }
    if (!actor) {
      toast.error("Connection error. Please refresh.");
      return;
    }

    const audioCtx = getAudioCtx();
    if (audioCtx?.state === "suspended") audioCtx.resume().catch(() => {});

    setIsSpinning(true);
    setSpinResult(null);

    try {
      const countKey = `spinCount_${principalText}`;
      const lastSpinKey = `lastSpin_${principalText}`;
      const currentCount =
        Number.parseInt(localStorage.getItem(countKey) ?? "0", 10) + 1;
      const isSeventhSpin = currentCount % 7 === 0;

      const winIndex = Math.floor(Math.random() * 8);
      const reward = isSeventhSpin ? 50 : SPIN_AMOUNTS[winIndex];

      const segCenter = winIndex * 45 + 22.5;
      const currentMod = ((spinDeg % 360) + 360) % 360;
      const offset = (((segCenter - currentMod) % 360) + 360) % 360;
      const targetDeg = spinDeg + 1800 + offset;

      setSpinDeg(targetDeg);

      // Start tick sounds
      if (audioCtx) {
        tickIntervalRef.current = setInterval(() => playTick(audioCtx), 110);
      }

      await new Promise((r) => setTimeout(r, SPIN_DURATION_MS + 200));

      // Stop tick sounds
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }

      // Normalize spin degree to avoid huge numbers
      setSpinDeg(targetDeg % 360);

      // Credit reward
      const updated = {
        ...userProfile,
        balance: userProfile.balance + BigInt(reward),
      };
      await actor.saveCallerUserProfile(updated);

      localStorage.setItem(countKey, String(currentCount));
      setSpinCount(currentCount);
      localStorage.setItem(lastSpinKey, String(Date.now()));
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      setSpinResult(reward);
      setSpinAvailable(false);

      if (audioCtx) playWin(audioCtx);
      toast.success(
        isSeventhSpin
          ? `🏆 Lucky 7th Spin! You won ₹${reward}!`
          : `🎰 You won ₹${reward}!`,
        { duration: 4000 },
      );
    } catch {
      // Clear tick interval if still running
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      toast.error("Spin failed. Try again.");
    } finally {
      setIsSpinning(false);
    }
  };

  // --- Ads ---
  const [adTasks, setAdTasks] = useState<AdTask[]>(() => getAdTasks());

  useEffect(() => {
    const onStorage = () => setAdTasks(getAdTasks());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeTasks = adTasks.filter((t) => t.isActive);

  const isTaskCompleted = (taskId: string) =>
    !!localStorage.getItem(`neochain_task_complete_${principalText}_${taskId}`);

  const isTaskClaimed = (taskId: string) =>
    !!localStorage.getItem(`neochain_task_claimed_${principalText}_${taskId}`);

  const completeTask = (taskId: string) => {
    localStorage.setItem(
      `neochain_task_complete_${principalText}_${taskId}`,
      "1",
    );
    setAdTasks([...getAdTasks()]);
    toast.success("Task marked as complete! You can now claim your reward.");
  };

  const claimTask = async (task: AdTask) => {
    if (!userProfile || !actor) return;
    const updated = {
      ...userProfile,
      balance: userProfile.balance + BigInt(task.rewardAmount),
    };
    try {
      await actor.saveCallerUserProfile(updated);
      localStorage.setItem(
        `neochain_task_claimed_${principalText}_${task.id}`,
        "1",
      );
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      setAdTasks([...getAdTasks()]);
      toast.success(`₹${task.rewardAmount} claimed successfully!`);
    } catch {
      toast.error("Claim failed. Try again.");
    }
  };

  return (
    <section className="px-4 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4"
            style={{
              background: "rgba(255, 193, 7, 0.1)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              color: "oklch(0.85 0.18 85)",
            }}
          >
            <Trophy className="w-3 h-3" />
            Daily Earnings & Rewards
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl gradient-text mb-3">
            Earnings Hub
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Spin daily, complete ad tasks, and collect your login bonus — earn
            extra rewards every day!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== LOGIN BONUS ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{
              background: "rgba(7, 8, 26, 0.8)",
              border: loginBonusClaimed
                ? "1px solid rgba(34, 197, 94, 0.3)"
                : "1px solid rgba(38, 214, 255, 0.35)",
              boxShadow: loginBonusClaimed
                ? "0 0 30px rgba(34, 197, 94, 0.1)"
                : "0 0 30px rgba(38, 214, 255, 0.12)",
            }}
            data-ocid="earnings.panel"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(38, 214, 255, 0.1)",
                  border: "1px solid rgba(38, 214, 255, 0.3)",
                }}
              >
                <Gift className="w-5 h-5 neon-text-cyan" />
              </div>
              <div>
                <div className="font-display font-bold text-base">
                  Daily Login Bonus
                </div>
                <div className="text-muted-foreground text-xs">
                  ₹5 Welcome Reward
                </div>
              </div>
            </div>

            <div
              className="rounded-xl p-4 text-center"
              style={{
                background: loginBonusClaimed
                  ? "rgba(34, 197, 94, 0.08)"
                  : "rgba(38, 214, 255, 0.06)",
                border: loginBonusClaimed
                  ? "1px solid rgba(34, 197, 94, 0.2)"
                  : "1px solid rgba(38, 214, 255, 0.15)",
              }}
            >
              <div
                className="text-3xl font-display font-black mb-1"
                style={{
                  color: loginBonusClaimed
                    ? "oklch(0.72 0.2 142)"
                    : "oklch(0.82 0.18 210)",
                }}
              >
                ₹5
              </div>
              {loginBonusClaimed ? (
                <>
                  <div
                    className="flex items-center justify-center gap-1.5 text-sm"
                    style={{ color: "oklch(0.72 0.2 142)" }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Claimed today!
                  </div>
                  {loginBonusTime && (
                    <div className="text-muted-foreground text-xs mt-1">
                      Next bonus at midnight
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground text-xs">
                  Crediting...
                </div>
              )}
            </div>

            <div className="text-muted-foreground text-xs text-center">
              Auto-credited on every daily login
            </div>
          </motion.div>

          {/* ===== SPIN WHEEL ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6 flex flex-col gap-4 items-center"
            style={{
              background: "rgba(7, 8, 26, 0.8)",
              border: "1px solid rgba(201, 60, 255, 0.35)",
              boxShadow: "0 0 30px rgba(201, 60, 255, 0.12)",
            }}
            data-ocid="earnings.panel"
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(201, 60, 255, 0.1)",
                  border: "1px solid rgba(201, 60, 255, 0.3)",
                }}
              >
                <Zap
                  className="w-5 h-5"
                  style={{ color: "oklch(0.75 0.28 310)" }}
                />
              </div>
              <div>
                <div className="font-display font-bold text-base">
                  Daily Spin
                </div>
                <div className="text-muted-foreground text-xs">
                  Win ₹10–₹30 (7th spin = ₹50)
                </div>
              </div>
            </div>

            {/* === SVG Spin Wheel === */}
            <div className="relative flex items-center justify-center select-none">
              {/* Pointer triangle at top */}
              <div
                className="absolute z-20 pointer-events-none"
                style={{
                  top: -4,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid transparent",
                  borderRight: "10px solid transparent",
                  borderTop: "22px solid #e879f9",
                  filter: "drop-shadow(0 0 6px rgba(201,60,255,0.9))",
                }}
              />

              {/* Outer glow ring */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "transparent",
                  boxShadow: spinAvailable
                    ? "0 0 40px rgba(201,60,255,0.45), 0 0 80px rgba(201,60,255,0.18), inset 0 0 20px rgba(201,60,255,0.1)"
                    : "0 0 15px rgba(201,60,255,0.18)",
                  borderRadius: "50%",
                  width: WHEEL_SIZE,
                  height: WHEEL_SIZE,
                  zIndex: 1,
                  transition: "box-shadow 0.5s ease",
                }}
              />

              {/* Rotating wheel div — visual only, no click handler */}
              <motion.div
                animate={{ rotate: spinDeg }}
                transition={{
                  duration: SPIN_DURATION_MS / 1000,
                  ease: "easeOut",
                }}
                style={{
                  width: WHEEL_SIZE,
                  height: WHEEL_SIZE,
                  cursor: "default",
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                <svg
                  width={WHEEL_SIZE}
                  height={WHEEL_SIZE}
                  viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                  role="img"
                  aria-label="Daily spin wheel"
                >
                  {/* Segments */}
                  {SPIN_AMOUNTS.map((amount, i) => {
                    const textAngle = i * 45 + 22.5;
                    const textPos = polarToXY(
                      WHEEL_CX,
                      WHEEL_CY,
                      WHEEL_R * 0.62,
                      textAngle,
                    );
                    // Separator lines between segments
                    const sepStart = polarToXY(WHEEL_CX, WHEEL_CY, 18, i * 45);
                    const sepEnd = polarToXY(
                      WHEEL_CX,
                      WHEEL_CY,
                      WHEEL_R,
                      i * 45,
                    );
                    return (
                      <g key={amount}>
                        {/* Filled segment */}
                        <path
                          d={segmentPath(i)}
                          fill={SEGMENT_COLORS[i]}
                          stroke="rgba(7,8,26,0.6)"
                          strokeWidth={1.5}
                        />

                        {/* Separator line */}
                        <line
                          x1={sepStart.x}
                          y1={sepStart.y}
                          x2={sepEnd.x}
                          y2={sepEnd.y}
                          stroke="rgba(7,8,26,0.8)"
                          strokeWidth={1.5}
                        />
                        {/* Amount label */}
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={12}
                          fontWeight="bold"
                          fontFamily="system-ui, sans-serif"
                          transform={`rotate(${textAngle}, ${textPos.x}, ${textPos.y})`}
                          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
                        >
                          ₹{amount}
                        </text>
                      </g>
                    );
                  })}

                  {/* Outer border ring */}
                  <circle
                    cx={WHEEL_CX}
                    cy={WHEEL_CY}
                    r={WHEEL_R - 1}
                    fill="none"
                    stroke="rgba(201,60,255,0.6)"
                    strokeWidth={3}
                  />
                </svg>
              </motion.div>

              {/* Center hub — static, above rotation */}
              <div
                className="absolute z-10 pointer-events-none flex items-center justify-center"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "rgba(7, 8, 26, 0.97)",
                  border: "3px solid rgba(201, 60, 255, 0.8)",
                  boxShadow:
                    "0 0 10px rgba(201,60,255,0.5), inset 0 0 6px rgba(201,60,255,0.2)",
                }}
              >
                <span style={{ fontSize: 14 }}>⚡</span>
              </div>
            </div>

            <AnimatePresence>
              {spinResult !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full text-center rounded-xl py-3 px-4"
                  style={{
                    background: "rgba(255, 193, 7, 0.1)",
                    border: "1px solid rgba(255, 193, 7, 0.4)",
                    boxShadow: "0 0 30px rgba(255, 193, 7, 0.2)",
                  }}
                >
                  <div className="text-3xl mb-1">🎉</div>
                  <div
                    className="font-display font-black text-4xl"
                    style={{
                      color: "oklch(0.9 0.22 85)",
                      textShadow: "0 0 20px rgba(255, 193, 7, 0.8)",
                    }}
                  >
                    +₹{spinResult}
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Credited to your balance!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin count progress bar */}
            {principalText && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>
                    Spin {spinCount % 7}/{7}
                  </span>
                  <span className="text-yellow-400 font-semibold">
                    {7 - (spinCount % 7) === 0
                      ? "🏆 Special spin today!"
                      : `${7 - (spinCount % 7)} more → ₹50!`}
                  </span>
                </div>
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, oklch(0.75 0.22 280), oklch(0.85 0.18 85))",
                      boxShadow: "0 0 8px rgba(201,60,255,0.5)",
                    }}
                    animate={{ width: `${((spinCount % 7) / 7) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div
                  className="text-center text-xs text-muted-foreground mt-1"
                  style={{ color: "oklch(0.72 0.18 85)" }}
                >
                  Every 7th spin = ₹50 Special! 🌟
                </div>
              </div>
            )}

            {spinAvailable ? (
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full py-3.5 rounded-xl font-display font-black text-base transition-all disabled:opacity-60 spin-btn-pulse"
                style={{
                  background: isSpinning
                    ? "rgba(201, 60, 255, 0.15)"
                    : "linear-gradient(135deg, rgba(201,60,255,0.35) 0%, rgba(123,77,255,0.4) 50%, rgba(38,214,255,0.25) 100%)",
                  border: "1px solid rgba(201, 60, 255, 0.6)",
                  boxShadow: isSpinning
                    ? "none"
                    : "0 0 30px rgba(201,60,255,0.4), 0 4px 15px rgba(123,77,255,0.3)",
                  color: "oklch(0.95 0.12 310)",
                  letterSpacing: "0.05em",
                }}
                data-ocid="earnings.button"
              >
                {isSpinning ? "⏳ Spinning..." : "🎰 SPIN NOW!"}
              </button>
            ) : (
              <div
                className="w-full py-2.5 rounded-xl text-center text-sm"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs">{nextSpinCountdown}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* ===== ADS TASKS SUMMARY ===== */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{
              background: "rgba(7, 8, 26, 0.8)",
              border: "1px solid rgba(255, 193, 7, 0.3)",
              boxShadow: "0 0 30px rgba(255, 193, 7, 0.08)",
            }}
            data-ocid="earnings.panel"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255, 193, 7, 0.1)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                }}
              >
                <Target
                  className="w-5 h-5"
                  style={{ color: "oklch(0.85 0.18 85)" }}
                />
              </div>
              <div>
                <div className="font-display font-bold text-base">Ad Tasks</div>
                <div className="text-muted-foreground text-xs">
                  {activeTasks.length} active task
                  {activeTasks.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {activeTasks.length === 0 ? (
              <div
                className="flex-1 flex items-center justify-center rounded-xl p-6 text-center text-muted-foreground text-sm"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.08)",
                }}
                data-ocid="earnings.empty_state"
              >
                No active tasks right now. Check back soon!
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-48">
                {activeTasks.slice(0, 3).map((task) => {
                  const completed = isTaskCompleted(task.id);
                  const claimed = isTaskClaimed(task.id);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg"
                      style={{
                        background: claimed
                          ? "rgba(34, 197, 94, 0.06)"
                          : "rgba(255, 193, 7, 0.05)",
                        border: claimed
                          ? "1px solid rgba(34, 197, 94, 0.2)"
                          : "1px solid rgba(255, 193, 7, 0.15)",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {task.title}
                        </div>
                        <div
                          className="text-xs font-bold"
                          style={{ color: "oklch(0.85 0.18 85)" }}
                        >
                          ₹{task.rewardAmount}
                        </div>
                      </div>
                      {claimed ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "oklch(0.72 0.2 142)",
                          }}
                        >
                          Claimed ✓
                        </span>
                      ) : completed ? (
                        <button
                          type="button"
                          onClick={() => claimTask(task)}
                          className="text-xs px-2 py-0.5 rounded-full font-semibold transition-all"
                          style={{
                            background: "rgba(34, 197, 94, 0.15)",
                            border: "1px solid rgba(34, 197, 94, 0.4)",
                            color: "oklch(0.72 0.2 142)",
                          }}
                          data-ocid="earnings.button"
                        >
                          Claim Reward
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => completeTask(task.id)}
                          className="text-xs px-2 py-0.5 rounded-full font-semibold transition-all"
                          style={{
                            background: "rgba(123, 77, 255, 0.15)",
                            border: "1px solid rgba(123, 77, 255, 0.4)",
                            color: "oklch(0.75 0.22 280)",
                          }}
                          data-ocid="earnings.button"
                        >
                          Auto Complete
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* ===== FULL AD TASKS LIST ===== */}
        {activeTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <h3 className="font-display font-bold text-2xl mb-6">
              <span className="neon-text-cyan">Active</span>{" "}
              <span className="text-foreground">Ad Tasks</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeTasks.map((task, idx) => {
                const completed = isTaskCompleted(task.id);
                const claimed = isTaskClaimed(task.id);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="rounded-2xl overflow-hidden flex flex-col"
                    style={{
                      background: "rgba(7, 8, 26, 0.85)",
                      border: claimed
                        ? "1px solid rgba(34, 197, 94, 0.3)"
                        : completed
                          ? "1px solid rgba(255, 193, 7, 0.4)"
                          : "1px solid rgba(255, 193, 7, 0.2)",
                      boxShadow: claimed
                        ? "0 0 20px rgba(34, 197, 94, 0.08)"
                        : "0 0 20px rgba(255, 193, 7, 0.06)",
                    }}
                    data-ocid={`earnings.item.${idx + 1}`}
                  >
                    {task.imageUrl && (
                      <div className="w-full h-32 overflow-hidden">
                        <img
                          src={task.imageUrl}
                          alt={task.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-bold text-sm leading-tight">
                          {task.title}
                        </h4>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: "rgba(255, 193, 7, 0.15)",
                            color: "oklch(0.85 0.18 85)",
                            border: "1px solid rgba(255, 193, 7, 0.3)",
                          }}
                        >
                          ₹{task.rewardAmount}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs leading-relaxed flex-1">
                        {task.description}
                      </p>
                      <div className="flex gap-2">
                        {claimed ? (
                          <div
                            className="flex-1 py-2 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-1.5"
                            style={{ color: "oklch(0.72 0.2 142)" }}
                          >
                            <CheckCircle className="w-4 h-4" /> Claimed
                          </div>
                        ) : completed ? (
                          <button
                            type="button"
                            onClick={() => claimTask(task)}
                            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                            style={{
                              background: "rgba(34, 197, 94, 0.15)",
                              border: "1px solid rgba(34, 197, 94, 0.4)",
                              color: "oklch(0.72 0.2 142)",
                            }}
                            data-ocid="earnings.button"
                          >
                            Claim ₹{task.rewardAmount}
                          </button>
                        ) : (
                          <>
                            <a
                              href={task.taskLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() =>
                                setTimeout(() => completeTask(task.id), 2000)
                              }
                              className="flex-1 py-2 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5 transition-all"
                              style={{
                                background: "rgba(255, 193, 7, 0.1)",
                                border: "1px solid rgba(255, 193, 7, 0.3)",
                                color: "oklch(0.85 0.18 85)",
                              }}
                              data-ocid="earnings.link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Go to
                              Task
                            </a>
                            <button
                              type="button"
                              onClick={() => completeTask(task.id)}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{
                                background: "rgba(123, 77, 255, 0.1)",
                                border: "1px solid rgba(123, 77, 255, 0.3)",
                                color: "oklch(0.75 0.22 280)",
                              }}
                              data-ocid="earnings.button"
                            >
                              Auto Complete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Register Modal for unregistered users */}
      {actor && registerModalOpen && (
        <RegisterModal
          actor={actor}
          onRegistered={() => {
            qc.invalidateQueries({ queryKey: ["userProfile"] });
            setRegisterModalOpen(false);
            toast.success("Account registered! You can now spin.");
          }}
          onClose={() => setRegisterModalOpen(false)}
        />
      )}
    </section>
  );
}
