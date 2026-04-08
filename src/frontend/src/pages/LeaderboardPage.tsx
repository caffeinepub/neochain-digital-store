import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { LeaderboardEntry } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useLeaderboard, useUserProfile } from "../hooks/useQueries";

// Gold / silver / bronze OKLCH values
const PODIUM_COLORS = [
  {
    text: "oklch(0.85 0.18 85)",
    border: "rgba(255,200,0,0.55)",
    glow: "rgba(255,200,0,0.35)",
    bg: "rgba(255,200,0,0.08)",
  },
  {
    text: "oklch(0.82 0.04 280)",
    border: "rgba(200,200,220,0.45)",
    glow: "rgba(200,200,220,0.25)",
    bg: "rgba(200,200,220,0.06)",
  },
  {
    text: "oklch(0.72 0.14 45)",
    border: "rgba(210,105,30,0.50)",
    glow: "rgba(210,105,30,0.28)",
    bg: "rgba(210,105,30,0.08)",
  },
];
const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const PODIUM_LABELS = ["1st", "2nd", "3rd"];

const POINTS_INFO = [
  { action: "Daily login", points: "20 pts", icon: "🌅" },
  { action: "Complete a task", points: "10 pts", icon: "✅" },
  { action: "Daily spin", points: "5 pts", icon: "🎰" },
  { action: "Refer a friend", points: "50 pts", icon: "👥" },
];

function currentWeekRange(): string {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(mon)} – ${fmt(sun)}`;
}

export default function LeaderboardPage() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const {
    data: leaderboard,
    isLoading,
    refetch,
    isFetching,
  } = useLeaderboard();
  const { data: userProfile } = useUserProfile();
  const [weekRange] = useState(currentWeekRange);

  const myPrincipal = userProfile?.user?.toString();

  // All hooks called unconditionally
  const myEntry = useMemo(() => {
    if (!leaderboard || !myPrincipal) return null;
    const idx = leaderboard.findIndex(
      (e: LeaderboardEntry) => e.user?.toString() === myPrincipal,
    );
    return idx === -1 ? null : { rank: idx + 1, entry: leaderboard[idx] };
  }, [leaderboard, myPrincipal]);

  const nextRankTarget = useMemo(() => {
    if (!myEntry || !leaderboard || myEntry.rank <= 1) return null;
    const above = leaderboard[myEntry.rank - 2] as LeaderboardEntry;
    return above ? Number(above.weeklyPoints) : null;
  }, [myEntry, leaderboard]);

  // Podium: display order is 2nd, 1st, 3rd for visual height effect
  const podiumOrder = useMemo(() => {
    if (!leaderboard || leaderboard.length === 0) return [];
    const top3 = leaderboard.slice(
      0,
      Math.min(3, leaderboard.length),
    ) as LeaderboardEntry[];
    if (top3.length === 3) return [top3[1], top3[0], top3[2]];
    return top3;
  }, [leaderboard]);

  useEffect(() => {
    if (!isInitializing && !identity) navigate({ to: "/" });
  }, [identity, isInitializing, navigate]);

  if (isInitializing || !identity) return null;

  // Given a podium entry, find its original rank index (0=gold, 1=silver, 2=bronze)
  const podiumRankIndex = (entry: LeaderboardEntry): number =>
    leaderboard?.findIndex(
      (e: LeaderboardEntry) => e.user?.toString() === entry.user?.toString(),
    ) ?? 0;

  return (
    <div className="pt-16 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* ── SECTION 1: Header ── */}
        <div
          className="neon-card-leaderboard p-5 flex items-start justify-between gap-3"
          data-ocid="leaderboard.header"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🏆</span>
              <h1
                className="font-display font-black text-xl"
                style={{
                  color: "oklch(0.85 0.18 85)",
                  textShadow: "0 0 24px rgba(255,200,0,0.5)",
                }}
              >
                Weekly Leaderboard
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              <span style={{ color: "oklch(0.85 0.18 85)" }}>📅</span>{" "}
              {weekRange}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Points reset every Monday at midnight
            </p>
          </div>
          <button
            type="button"
            className="neon-btn px-3 py-1.5 text-xs shrink-0 flex items-center gap-1.5"
            onClick={() => refetch()}
            disabled={isFetching}
            data-ocid="leaderboard.refresh_btn"
            aria-label="Refresh leaderboard"
          >
            <span
              className={
                isFetching ? "animate-spin inline-block" : "inline-block"
              }
            >
              ↻
            </span>
            {isFetching ? "Loading…" : "Refresh"}
          </button>
        </div>

        {/* ── SECTION 2: Top 3 Podium ── */}
        {!isLoading && leaderboard && leaderboard.length > 0 && (
          <section aria-label="Top 3 podium">
            <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-widest mb-3 px-1">
              Top Performers
            </h2>
            <div className="grid grid-cols-3 gap-2 items-end">
              {podiumOrder.map((entry, displayIdx) => {
                const origIdx = podiumRankIndex(entry);
                const colors = PODIUM_COLORS[origIdx] ?? PODIUM_COLORS[2];
                const isMe =
                  myPrincipal && entry.user?.toString() === myPrincipal;
                const heightClass =
                  displayIdx === 1
                    ? "pt-6"
                    : displayIdx === 0
                      ? "pt-3"
                      : "pt-1";
                return (
                  <div
                    key={entry.user?.toString() ?? `podium-${displayIdx}`}
                    className={`stat-card text-center pb-4 ${heightClass} transition-all duration-200`}
                    style={{
                      borderColor: colors.border,
                      boxShadow: `0 0 20px ${colors.glow}, inset 0 1px 0 ${colors.border}`,
                      background: `linear-gradient(160deg, ${colors.bg}, rgba(10,8,30,0.75))`,
                    }}
                    data-ocid={`leaderboard.podium_rank_${origIdx + 1}`}
                  >
                    <div className="text-2xl mb-1">{RANK_MEDALS[origIdx]}</div>
                    <div
                      className="text-xs font-display font-bold mb-1"
                      style={{ color: colors.text }}
                    >
                      {PODIUM_LABELS[origIdx]}
                    </div>
                    <div
                      className="font-display font-bold text-sm truncate px-1 mb-1"
                      style={{ color: colors.text }}
                    >
                      {entry.username}
                      {isMe && (
                        <span className="block text-xs text-muted-foreground font-normal">
                          (You)
                        </span>
                      )}
                    </div>
                    {entry.vipTier && (
                      <span
                        className="inline-block text-xs px-2 py-0.5 rounded-full mb-1"
                        style={{
                          background: "rgba(255,200,0,0.12)",
                          color: "oklch(0.85 0.18 85)",
                          border: "1px solid rgba(255,200,0,0.3)",
                        }}
                      >
                        {entry.vipTier} VIP
                      </span>
                    )}
                    <div
                      className="font-black text-lg mt-1"
                      style={{
                        color: colors.text,
                        textShadow: `0 0 14px ${colors.glow}`,
                      }}
                    >
                      {Number(entry.weeklyPoints).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">pts</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION 3: Full Rankings Table ── */}
        <section aria-label="Full rankings">
          <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-widest mb-3 px-1">
            All Rankings
          </h2>

          {isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {(["sk0", "sk1", "sk2", "sk3", "sk4", "sk5"] as const).map(
                (k) => (
                  <div
                    key={k}
                    className="neon-card h-14 animate-pulse"
                    style={{ opacity: 0.35 }}
                  />
                ),
              )}
            </div>
          ) : !leaderboard || leaderboard.length === 0 ? (
            <div
              className="neon-card-leaderboard p-10 text-center"
              data-ocid="leaderboard.empty_state"
            >
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-display font-bold text-base mb-1">
                No rankings yet this week
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete tasks and earn points to claim your spot!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {leaderboard.map((entry: LeaderboardEntry, i: number) => {
                const isMe =
                  myPrincipal && entry.user?.toString() === myPrincipal;
                const isTopThree = i < 3;
                const colors = isTopThree ? PODIUM_COLORS[i] : null;
                return (
                  <div
                    key={entry.user?.toString() ?? `rank-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
                      isMe ? "glow-cyan-bright" : isTopThree ? "" : "neon-card"
                    }`}
                    style={
                      isTopThree
                        ? {
                            background: `linear-gradient(135deg, ${colors!.bg}, rgba(10,8,30,0.65))`,
                            borderColor: colors!.border,
                            boxShadow: `0 0 12px ${colors!.glow}`,
                          }
                        : undefined
                    }
                    data-ocid={`leaderboard.rank_row_${i}`}
                  >
                    {/* Rank */}
                    <div
                      className="w-7 text-center font-display font-black text-sm shrink-0"
                      style={{
                        color: isTopThree
                          ? colors!.text
                          : isMe
                            ? "oklch(0.82 0.18 210)"
                            : "oklch(0.55 0.06 280)",
                      }}
                    >
                      {isTopThree ? RANK_MEDALS[i] : `#${i + 1}`}
                    </div>

                    {/* Username + VIP badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`font-semibold text-sm truncate ${
                            isMe ? "neon-text-cyan" : ""
                          }`}
                          style={
                            isTopThree && !isMe
                              ? { color: colors!.text }
                              : !isMe
                                ? { color: "oklch(0.90 0.02 280)" }
                                : undefined
                          }
                        >
                          {entry.username}
                        </span>
                        {isMe && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            (You)
                          </span>
                        )}
                        {entry.vipTier && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
                            style={{
                              background: "rgba(255,200,0,0.12)",
                              color: "oklch(0.85 0.18 85)",
                              border: "1px solid rgba(255,200,0,0.28)",
                            }}
                          >
                            {entry.vipTier} VIP
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Weekly Points */}
                    <div className="text-right shrink-0">
                      <div
                        className="font-bold text-sm"
                        style={{
                          color: isTopThree
                            ? colors!.text
                            : isMe
                              ? "oklch(0.82 0.18 210)"
                              : "oklch(0.68 0.05 280)",
                        }}
                      >
                        {Number(entry.weeklyPoints).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">pts</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── SECTION 4: Points Explanation Card ── */}
        <div
          className="neon-card-leaderboard p-5"
          data-ocid="leaderboard.points_info"
        >
          <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span style={{ color: "oklch(0.85 0.18 85)" }}>
              How to Earn Points
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {POINTS_INFO.map(({ action, points, icon }) => (
              <div
                key={action}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: "rgba(255,200,0,0.05)",
                  border: "1px solid rgba(255,200,0,0.15)",
                }}
              >
                <span className="text-base shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground truncate">
                    {action}
                  </div>
                  <div
                    className="text-xs font-bold"
                    style={{ color: "oklch(0.85 0.18 85)" }}
                  >
                    {points}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
            🔄 Points reset every{" "}
            <strong className="text-foreground">Monday at midnight</strong>.
            Leaderboard rewards are{" "}
            <strong className="text-foreground">points only</strong> — no large
            cash payouts.
          </p>
        </div>

        {/* ── SECTION 5: My Current Rank Card ── */}
        {myEntry && (
          <div
            className="neon-card-leaderboard p-5"
            data-ocid="leaderboard.my_rank"
          >
            <h3 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
              <span>👤</span>
              <span className="neon-text-cyan">Your Standing This Week</span>
            </h3>
            <div className="flex items-center gap-4">
              {/* Rank badge */}
              <div
                className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl shrink-0"
                style={{
                  background: "rgba(38,214,255,0.08)",
                  border: "2px solid rgba(38,214,255,0.4)",
                  boxShadow: "0 0 20px rgba(38,214,255,0.2)",
                }}
              >
                <span className="font-display font-black text-xl neon-text-cyan">
                  #{myEntry.rank}
                </span>
                <span className="text-xs text-muted-foreground">rank</span>
              </div>

              {/* Stats */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Points this week
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: "oklch(0.85 0.18 85)" }}
                  >
                    {Number(myEntry.entry.weeklyPoints).toLocaleString()} pts
                  </span>
                </div>
                {nextRankTarget !== null ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Next rank target
                      </span>
                      <span className="text-xs font-semibold neon-text-cyan">
                        {nextRankTarget.toLocaleString()} pts
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(38,214,255,0.1)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (Number(myEntry.entry.weeklyPoints) /
                                nextRankTarget) *
                                100,
                            ),
                          )}%`,
                          background:
                            "linear-gradient(90deg, oklch(0.82 0.18 210), oklch(0.85 0.18 85))",
                          boxShadow: "0 0 8px rgba(38,214,255,0.4)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.max(
                        0,
                        nextRankTarget - Number(myEntry.entry.weeklyPoints),
                      ).toLocaleString()}{" "}
                      more pts to reach rank #{myEntry.rank - 1}
                    </p>
                  </>
                ) : (
                  <p
                    className="text-xs"
                    style={{ color: "oklch(0.85 0.18 85)" }}
                  >
                    🏅 You're at the top! Keep earning to hold your position.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Unranked user CTA */}
        {!isLoading && !myEntry && leaderboard && (
          <div
            className="neon-card p-5 text-center"
            data-ocid="leaderboard.my_rank_unranked"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-display font-bold text-sm mb-1 text-foreground">
              You're not ranked yet
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Complete tasks, log in daily, or spin the wheel to earn points and
              appear on the leaderboard.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className="px-3 py-2 rounded-xl text-center"
                style={{
                  background: "rgba(38,214,255,0.06)",
                  border: "1px solid rgba(38,214,255,0.2)",
                }}
              >
                <div className="neon-text-cyan font-bold">+20 pts</div>
                <div className="text-muted-foreground">Daily login</div>
              </div>
              <div
                className="px-3 py-2 rounded-xl text-center"
                style={{
                  background: "rgba(255,200,0,0.06)",
                  border: "1px solid rgba(255,200,0,0.2)",
                }}
              >
                <div
                  style={{ color: "oklch(0.85 0.18 85)" }}
                  className="font-bold"
                >
                  +50 pts
                </div>
                <div className="text-muted-foreground">Per referral</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
