import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Ticket, Users, Crown, RefreshCw, CheckCircle2, Zap, Brain, Activity, Clock } from "lucide-react";
import { useStore } from "../store";
import { DrillCategory } from "../types";

// ─── Confetti ─────────────────────────────────────────────────────────────────
function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let h = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const ro = new ResizeObserver(() => {
      if (canvas.parentElement) { w = canvas.width = canvas.parentElement.clientWidth; h = canvas.height = canvas.parentElement.clientHeight; }
    });
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const colors = ["#2998AA", "#5B21B6", "#8B5CF6", "#10B981", "#F59E0B", "#F43F5E", "#3B82F6"];
    const pts = Array.from({ length: 200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * -h,
      r: Math.random() * 6 + 3,
      c: colors[Math.floor(Math.random() * colors.length)],
      vx: Math.random() * 4 - 2,
      vy: Math.random() * 5 + 2,
      rot: Math.random() * 360,
      rs: Math.random() * 4 - 2,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rs;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.c;
        if (Math.round(p.r) % 2 === 0) ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        else { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animId); ro.disconnect(); };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />;
}

// ─── Drill icons map ───────────────────────────────────────────────────────────
const DRILL_META: Record<DrillCategory, { label: string; icon: React.ReactNode; color: string }> = {
  GUST: { label: "GUST", icon: <Brain size={12} />, color: "#2998AA" },
  RRT: { label: "RRT", icon: <Zap size={12} />, color: "#a78bfa" },
  CRT: { label: "CRT", icon: <Activity size={12} />, color: "#fb923c" },
  GoNoGo: { label: "Go/No-Go", icon: <Clock size={12} />, color: "#34d399" },
};

// ─── Weighted random draw ──────────────────────────────────────────────────────
function weightedDraw(pool: { id: string; tickets: number }[]) {
  const eligible = pool.filter(a => a.tickets > 0);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, a) => s + a.tickets, 0);
  let rand = Math.random() * total;
  for (const a of eligible) {
    rand -= a.tickets;
    if (rand <= 0) return a.id;
  }
  return eligible[eligible.length - 1].id;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function Raffle() {
  const { athletes, results } = useStore();
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [shuffleNames, setShuffleNames] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [drawn, setDrawn] = useState(false);

  // Athletes with at least 1 ticket (starts with 1 free ticket floor + 1 per unique completed drill category)
  const pool = athletes.map(a => {
    const uniqueDrillsCount = new Set(
      results.filter(r => r.athleteId === a.id && r.ticketAwarded).map(r => r.drillCategory)
    ).size;
    return { ...a, tickets: 1 + uniqueDrillsCount };
  });

  const eligible = pool.filter(a => a.tickets > 0);
  const totalTickets = pool.reduce((s, a) => s + a.tickets, 0);

  const getCompletedDrills = (athleteId: string): DrillCategory[] => {
    return [...new Set(
      results.filter(r => r.athleteId === athleteId && r.ticketAwarded).map(r => r.drillCategory)
    )];
  };

  const handleDraw = () => {
    if (eligible.length === 0) return;
    setDrawn(false);
    setWinnerId(null);
    setShowConfetti(false);
    setShuffling(true);

    const winner = weightedDraw(pool);
    const namesPool = eligible.map(a => `${a.firstName} ${a.lastName}`);

    // Shuffle animation — cycle names rapidly then settle
    let count = 0;
    const totalFrames = 36;
    const interval = setInterval(() => {
      const shuffled = [...namesPool].sort(() => Math.random() - 0.5).slice(0, 5);
      setShuffleNames(shuffled);
      count++;
      if (count >= totalFrames) {
        clearInterval(interval);
        setShuffling(false);
        setWinnerId(winner);
        setShowConfetti(true);
        setDrawn(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }, 80);
  };

  const winner = pool.find(a => a.id === winnerId);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)] mb-1">Raffle Draw</h2>
        <p className="text-[var(--color-ares-muted)] text-sm">
          {athletes.length} registered · {eligible.length} eligible · {totalTickets} total tickets
        </p>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["GUST", "RRT", "CRT", "GoNoGo"] as DrillCategory[]).map(cat => {
          const count = new Set(results.filter(r => r.drillCategory === cat && r.ticketAwarded).map(r => r.athleteId)).size;
          const m = DRILL_META[cat];
          return (
            <div key={cat} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: m.color }}>
                {m.icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
              </div>
              <p className="text-2xl font-black text-white">{count}</p>
              <p className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider">Athletes Completed</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Draw Panel ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">Draw Winner</h3>

          <div className="relative bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-8 min-h-[320px] flex flex-col items-center justify-center overflow-hidden">
            <ConfettiCanvas active={showConfetti} />

            {!shuffling && !drawn && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 z-20">
                <div className="w-20 h-20 bg-[var(--color-ares-teal)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--color-ares-teal)]">
                  <Ticket size={36} />
                </div>
                <p className="text-[var(--color-ares-muted)] text-sm">{eligible.length} athlete{eligible.length !== 1 ? "s" : ""} eligible to win</p>
                <button
                  onClick={handleDraw}
                  disabled={eligible.length === 0}
                  className="px-10 py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 glow-shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Draw Winner
                </button>
              </motion.div>
            )}

            {shuffling && (
              <div className="text-center z-20 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] animate-pulse">Drawing...</p>
                <div className="space-y-2 min-h-[160px]">
                  {shuffleNames.map((name, i) => (
                    <motion.p
                      key={`${name}-${i}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i === 2 ? 1 : 0.3 + i * 0.15, x: 0 }}
                      className="font-black uppercase tracking-tight text-white"
                      style={{ fontSize: i === 2 ? "1.5rem" : "0.9rem" }}
                    >
                      {name}
                    </motion.p>
                  ))}
                </div>
              </div>
            )}

            {drawn && winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center z-20 space-y-4"
              >
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400">
                  <Crown size={36} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">🎉 Winner!</p>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                    {winner.firstName} {winner.lastName}
                  </h3>
                  <p className="text-[var(--color-ares-muted)] text-sm mt-1">{winner.team}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <Ticket size={14} className="text-[var(--color-ares-teal)]" />
                    <span className="text-[var(--color-ares-teal)] font-bold text-sm">{winner.tickets} ticket{winner.tickets !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setDrawn(false); setWinnerId(null); }}
                  className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] text-[var(--color-ares-muted)] hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  <RefreshCw size={14} /> Draw Again
                </button>
              </motion.div>
            )}
          </div>

          {eligible.length === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-300 flex items-start gap-2">
              <Ticket size={16} className="shrink-0 mt-0.5" />
              <span>No athletes have earned tickets yet. Tickets are awarded in Data Entry when athletes complete drills.</span>
            </div>
          )}
        </div>

        {/* ── Entrants List ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">
            Entrants ({eligible.length})
          </h3>

          <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl overflow-hidden max-h-[420px] overflow-y-auto">
            {eligible.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={32} className="text-[var(--color-ares-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--color-ares-muted)]">No entrants yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-ares-dark-purple)]">
                {[...eligible].sort((a, b) => b.tickets - a.tickets).map((a, i) => {
                  const drills = getCompletedDrills(a.id);
                  const winChance = totalTickets > 0 ? ((a.tickets / totalTickets) * 100).toFixed(1) : "0.0";
                  return (
                    <li key={a.id} className={`px-4 py-3 flex items-center justify-between transition-colors ${winnerId === a.id ? "bg-amber-500/10" : "hover:bg-[var(--color-ares-bg)]/40"}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[var(--color-ares-muted)] w-5 text-right">{i + 1}</span>
                        <div>
                          <p className={`font-bold uppercase tracking-tight text-sm ${winnerId === a.id ? "text-amber-300" : "text-white"}`}>
                            {winnerId === a.id && "🏆 "}{a.firstName} {a.lastName}
                          </p>
                          <div className="flex gap-1.5 mt-1 flex-wrap">
                            {drills.map(cat => {
                              const m = DRILL_META[cat];
                              return (
                                <span key={cat} className="flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: m.color + "20", color: m.color }}>
                                  {m.icon}{m.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-[var(--color-ares-teal)]">
                          <Ticket size={12} />
                          <span className="font-black text-sm">{a.tickets}</span>
                        </div>
                        <p className="text-[9px] text-[var(--color-ares-muted)]">{winChance}% chance</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* All registered (no tickets) */}
          {pool.filter(a => a.tickets === 0).length > 0 && (
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] font-bold mb-2">Registered — No Tickets Yet ({pool.filter(a => a.tickets === 0).length})</p>
              <div className="flex flex-wrap gap-2">
                {pool.filter(a => a.tickets === 0).map(a => (
                  <span key={a.id} className="text-xs text-[var(--color-ares-muted)] bg-[var(--color-ares-bg)] px-2 py-1 rounded-lg">
                    {a.firstName} {a.lastName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
