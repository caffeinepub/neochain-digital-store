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

export default function EarningsSection() {
  const { actor } = useActor();
  const { data: userProfile } = useUserProfile();
  const qc = useQueryClient();
  const { identity } = useInternetIdentity();
  const principalText = identity?.getPrincipal().toString() ?? "";

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
    // Credit ₹5
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

  useEffect(() => {
    if (!principalText) return;
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
  }, [principalText]);

  const handleSpin = async () => {
    if (!spinAvailable || isSpinning || !userProfile || !actor) return;
    setIsSpinning(true);
    setSpinResult(null);
    // Animate
    const extraDeg = 1440 + Math.floor(Math.random() * 360);
    setSpinDeg((prev) => prev + extraDeg);

    await new Promise((r) => setTimeout(r, 2000));

    const countKey = `spinCount_${principalText}`;
    const lastSpinKey = `lastSpin_${principalText}`;
    const currentCount =
      Number.parseInt(localStorage.getItem(countKey) ?? "0", 10) + 1;
    const newCount = currentCount;

    let reward: number;
    if (newCount % 7 === 0) {
      reward = 50;
    } else {
      reward = Math.floor(Math.random() * 13) + 10; // 10–22
    }

    const updated = {
      ...userProfile,
      balance: userProfile.balance + BigInt(reward),
    };
    try {
      await actor.saveCallerUserProfile(updated);
      localStorage.setItem(countKey, String(newCount));
      localStorage.setItem(lastSpinKey, String(Date.now()));
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      setSpinResult(reward);
      setSpinAvailable(false);
      toast.success(
        newCount % 7 === 0
          ? `🏆 Lucky 7th Spin! You won ₹${reward}!`
          : `🎰 You won ₹${reward}!`,
        { duration: 4000 },
      );
    } catch {
      toast.error("Spin failed. Try again.");
    }
    setIsSpinning(false);
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

  const spinColors = [
    "oklch(0.65 0.25 280)",
    "oklch(0.72 0.22 210)",
    "oklch(0.60 0.28 310)",
    "oklch(0.70 0.20 160)",
    "oklch(0.75 0.24 45)",
    "oklch(0.65 0.26 0)",
    "oklch(0.78 0.18 250)",
    "oklch(0.62 0.30 290)",
  ];

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
                  Win ₹10–₹22 (7th spin = ₹50)
                </div>
              </div>
            </div>

            {/* Spin visual */}
            <div className="relative flex items-center justify-center">
              <motion.div
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: `conic-gradient(${spinColors.map((c, i) => `${c} ${i * 45}deg ${(i + 1) * 45}deg`).join(", ")})`,
                  border: "3px solid rgba(201, 60, 255, 0.5)",
                  boxShadow: spinAvailable
                    ? "0 0 30px rgba(201, 60, 255, 0.4), 0 0 60px rgba(201, 60, 255, 0.15)"
                    : "0 0 10px rgba(201, 60, 255, 0.15)",
                  cursor: spinAvailable && !isSpinning ? "pointer" : "default",
                  rotate: spinDeg,
                }}
                animate={{ rotate: spinDeg }}
                transition={{ duration: 2, ease: "easeOut" }}
                onClick={handleSpin}
              />
              {/* Center dot */}
              <div
                className="absolute w-8 h-8 rounded-full flex items-center justify-center pointer-events-none"
                style={{
                  background: "rgba(7, 8, 26, 0.95)",
                  border: "2px solid rgba(201, 60, 255, 0.6)",
                  zIndex: 2,
                }}
              >
                <Zap
                  className="w-4 h-4"
                  style={{ color: "oklch(0.75 0.28 310)" }}
                />
              </div>
            </div>

            <AnimatePresence>
              {spinResult !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <div
                    className="font-display font-black text-2xl"
                    style={{ color: "oklch(0.85 0.18 85)" }}
                  >
                    +₹{spinResult}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Added to balance!
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {spinAvailable ? (
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="w-full py-2.5 rounded-xl font-display font-bold text-sm transition-all disabled:opacity-60"
                style={{
                  background: "rgba(201, 60, 255, 0.15)",
                  border: "1px solid rgba(201, 60, 255, 0.5)",
                  boxShadow: "0 0 20px rgba(201, 60, 255, 0.25)",
                  color: "oklch(0.82 0.22 310)",
                }}
                data-ocid="earnings.button"
              >
                {isSpinning ? "Spinning..." : "🎰 Spin Now!"}
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
                  const _completed = isTaskCompleted(task.id);
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
                          Claimed
                        </span>
                      ) : null}
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
    </section>
  );
}
