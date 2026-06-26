import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store";
import { v4 as uuidv4 } from "uuid";
import { DrillCategory, Result } from "../types";
import { Search, UserCheck, Ticket, CheckCircle2, Clock, Zap, Brain, Activity } from "lucide-react";
import { syncResultToFirebase, incrementAthleteTicketsInFirebase, updateAthleteInFirebase } from "../lib/firebase-sync";
import { useLocation } from "react-router-dom";

// ─── Drill metadata ────────────────────────────────────────────────────────────
const DRILL_DEFS: {
  category: DrillCategory;
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}[] = [
  {
    category: "GUST",
    id: "drill-gust",
    label: "NeuroTrainer GUST",
    icon: <Brain size={20} />,
    color: "var(--color-ares-teal)",
    description: "Blocking & dodging drill — scores, balls, bombs",
  },
  {
    category: "RRT",
    id: "drill-rrt",
    label: "Raw Reaction Time",
    icon: <Zap size={20} />,
    color: "#a78bfa",
    description: "Pure speed — time from stimulus to response",
  },
  {
    category: "GoNoGo",
    id: "drill-gonogo",
    label: "Go / No-Go",
    icon: <Clock size={20} />,
    color: "#34d399",
    description: "Inhibition control — correct responses vs false starts",
  },
  {
    category: "CRT",
    id: "drill-crt",
    label: "Choice Reaction Time",
    icon: <Activity size={20} />,
    color: "#fb923c",
    description: "Speed + accuracy across multiple stimuli",
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function hasCompletedDrill(results: Result[], athleteId: string, category: DrillCategory) {
  return results.some(r => r.athleteId === athleteId && r.drillCategory === category && r.ticketAwarded);
}

function getTicketCount(results: Result[], athleteId: string) {
  const cats = new Set(
    results
      .filter(r => r.athleteId === athleteId && r.ticketAwarded)
      .map(r => r.drillCategory)
  );
  return 1 + cats.size;
}

// ─── Sub-forms for each drill ──────────────────────────────────────────────────
function GUSTForm({ onSubmit }: { onSubmit: (data: Partial<Result>) => void }) {
  const [f, setF] = useState({ score: "", ballsBlocked: "", ballsBlockedAverage: "", bombsDodged: "", bombsDodgedAverage: "", multiplier: "", bonus: "" });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const inputCls = "w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-ares-teal)] transition-colors";
  const labelCls = "text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1 px-1";

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ score: parseFloat(f.score)||0, ballsBlocked: parseFloat(f.ballsBlocked)||0, ballsBlockedAverage: parseFloat(f.ballsBlockedAverage)||0, bombsDodged: parseFloat(f.bombsDodged)||0, bombsDodgedAverage: parseFloat(f.bombsDodgedAverage)||0, multiplier: parseFloat(f.multiplier)||0, bonus: parseFloat(f.bonus)||0, compositeScore: parseFloat(f.score)||0 }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Score *</label><input required type="number" name="score" value={f.score} onChange={ch} className={inputCls} placeholder="e.g. 8450" /></div>
        <div><label className={labelCls}>Balls Blocked</label><input type="number" name="ballsBlocked" value={f.ballsBlocked} onChange={ch} className={inputCls} placeholder="e.g. 24" /></div>
        <div><label className={labelCls}>Balls Blocked Avg</label><input type="number" step="0.1" name="ballsBlockedAverage" value={f.ballsBlockedAverage} onChange={ch} className={inputCls} placeholder="e.g. 21.5" /></div>
        <div><label className={labelCls}>Bombs Dodged</label><input type="number" name="bombsDodged" value={f.bombsDodged} onChange={ch} className={inputCls} placeholder="e.g. 6" /></div>
        <div><label className={labelCls}>Bombs Dodged Avg</label><input type="number" step="0.1" name="bombsDodgedAverage" value={f.bombsDodgedAverage} onChange={ch} className={inputCls} placeholder="e.g. 5.2" /></div>
        <div><label className={labelCls}>Multiplier</label><input type="number" step="0.1" name="multiplier" value={f.multiplier} onChange={ch} className={inputCls} placeholder="e.g. 1.5" /></div>
        <div className="col-span-2"><label className={labelCls}>Bonus</label><input type="number" name="bonus" value={f.bonus} onChange={ch} className={inputCls} placeholder="e.g. 500" /></div>
      </div>
      <button type="submit" className="w-full py-4 bg-[var(--color-ares-teal)] text-white font-black tracking-widest uppercase rounded-xl hover:bg-opacity-90 glow-shadow transition-all">Save & Award Ticket</button>
    </form>
  );
}

function RRTForm({ onSubmit }: { onSubmit: (data: Partial<Result>) => void }) {
  const [ms, setMs] = useState("");
  const inputCls = "w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#a78bfa] transition-colors";
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ reactionTimeMs: parseFloat(ms)||0, compositeScore: parseFloat(ms)||0 }); }} className="space-y-4">
      <div>
        <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1 px-1">Reaction Time (ms) *</label>
        <input required type="number" step="1" value={ms} onChange={e => setMs(e.target.value)} className={inputCls} placeholder="e.g. 245" />
        <p className="text-[10px] text-[var(--color-ares-muted)] mt-1 px-1">Lower is better. Typical elite range: 150–250 ms</p>
      </div>
      <button type="submit" className="w-full py-4 font-black tracking-widest uppercase rounded-xl transition-all text-white" style={{ background: "#a78bfa" }}>Save & Award Ticket</button>
    </form>
  );
}

function CRTForm({ onSubmit }: { onSubmit: (data: Partial<Result>) => void }) {
  const [f, setF] = useState({ reactionTimeMs: "", accuracyPercentage: "" });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const inputCls = "w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fb923c] transition-colors";
  const labelCls = "text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1 px-1";
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ reactionTimeMs: parseFloat(f.reactionTimeMs)||0, accuracyPercentage: parseFloat(f.accuracyPercentage)||0, compositeScore: parseFloat(f.accuracyPercentage)||0 }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Reaction Time (ms) *</label><input required type="number" step="1" name="reactionTimeMs" value={f.reactionTimeMs} onChange={ch} className={inputCls} placeholder="e.g. 310" /></div>
        <div><label className={labelCls}>Accuracy (%) *</label><input required type="number" step="0.1" min="0" max="100" name="accuracyPercentage" value={f.accuracyPercentage} onChange={ch} className={inputCls} placeholder="e.g. 87.5" /></div>
      </div>
      <button type="submit" className="w-full py-4 font-black tracking-widest uppercase rounded-xl transition-all text-white" style={{ background: "#fb923c" }}>Save & Award Ticket</button>
    </form>
  );
}

function GoNoGoForm({ onSubmit }: { onSubmit: (data: Partial<Result>) => void }) {
  const [f, setF] = useState({ correctResponses: "", falseStarts: "", reactionTimeMs: "" });
  const ch = (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [e.target.name]: e.target.value }));
  const inputCls = "w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#34d399] transition-colors";
  const labelCls = "text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1 px-1";
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ correctResponses: parseInt(f.correctResponses)||0, falseStarts: parseInt(f.falseStarts)||0, reactionTimeMs: parseFloat(f.reactionTimeMs)||0, compositeScore: parseInt(f.correctResponses)||0 }); }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className={labelCls}>Correct Responses *</label><input required type="number" step="1" min="0" name="correctResponses" value={f.correctResponses} onChange={ch} className={inputCls} placeholder="e.g. 18" /></div>
        <div><label className={labelCls}>False Starts</label><input type="number" step="1" min="0" name="falseStarts" value={f.falseStarts} onChange={ch} className={inputCls} placeholder="e.g. 2" /></div>
        <div className="col-span-2"><label className={labelCls}>Avg Reaction Time (ms)</label><input type="number" step="1" name="reactionTimeMs" value={f.reactionTimeMs} onChange={ch} className={inputCls} placeholder="e.g. 280" /></div>
      </div>
      <button type="submit" className="w-full py-4 font-black tracking-widest uppercase rounded-xl transition-all text-white" style={{ background: "#34d399" }}>Save & Award Ticket</button>
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function DataEntry() {
  const { athletes, results, addResult, incrementAthleteTickets } = useStore();
  const location = useLocation();
  const state = location.state as { athleteId?: string; activeDrill?: DrillCategory } | null;
  const [search, setSearch] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    state?.athleteId || null
  );
  const [activeDrill, setActiveDrill] = useState<DrillCategory>(
    state?.activeDrill || "GUST"
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredAthletes = athletes.filter(a =>
    `${a.firstName} ${a.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    a.team?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedAthlete = athletes.find(a => a.id === selectedAthleteId);
  const activeDef = DRILL_DEFS.find(d => d.category === activeDrill)!;

  const handleDrillSubmit = async (data: Partial<Result>) => {
    if (!selectedAthleteId) return;

    setSaving(true);
    const alreadyAwarded = hasCompletedDrill(results, selectedAthleteId, activeDrill);
    const athletePreviousTrials = results.filter(
      r => r.athleteId === selectedAthleteId && r.drillCategory === activeDrill
    ).length;

    const result: Result = {
      id: uuidv4(),
      athleteId: selectedAthleteId,
      eventId: "current-event",
      drillId: activeDef.id,
      drillCategory: activeDrill,
      trialNumber: athletePreviousTrials + 1,
      ticketAwarded: !alreadyAwarded,
      compositeScore: data.compositeScore ?? 0,
      createdAt: new Date().toISOString(),
      ...data,
    };

    addResult(result);
    await syncResultToFirebase(result);

    if (!alreadyAwarded) {
      incrementAthleteTickets(selectedAthleteId);
      try {
        await incrementAthleteTicketsInFirebase(selectedAthleteId);
      } catch (err) {
        console.error("Failed to sync ticket increment:", err);
        // Reflect new ticket count via full update as fallback
        const updated = athletes.find(a => a.id === selectedAthleteId);
        if (updated) await updateAthleteInFirebase(selectedAthleteId, { tickets: (updated.tickets ?? 0) + 1 });
      }
      setSuccessMsg(`✅ Result saved! +1 raffle ticket awarded for completing ${activeDef.label}.`);
    } else {
      setSuccessMsg(`📋 Result saved! (Raffle ticket for ${activeDef.label} was already awarded on a previous attempt.)`);
    }

    setSaving(false);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)] mb-1">Admin · Data Entry</h2>
        <p className="text-[var(--color-ares-muted)] text-sm">Select an athlete, choose a drill, enter their scores. First completion of each drill awards +1 raffle ticket.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Left: Athlete Selection ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">1. Select Athlete</h3>

          {selectedAthleteId ? (
            <div className="space-y-3">
              <div className="p-4 bg-[var(--color-ares-purple)]/10 border border-[var(--color-ares-purple)]/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-white uppercase tracking-tight">{selectedAthlete?.firstName} {selectedAthlete?.lastName}</p>
                  <p className="text-xs text-[var(--color-ares-purple)] tracking-widest">{selectedAthlete?.team}</p>
                </div>
                <button onClick={() => { setSelectedAthleteId(null); setSearch(""); }} className="text-xs uppercase tracking-widest text-[var(--color-ares-muted)] hover:text-white underline">Change</button>
              </div>

              {/* Ticket status for selected athlete */}
              <div className="p-4 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ares-muted)]">Raffle Tickets Earned</span>
                  <span className="flex items-center gap-1.5 text-[var(--color-ares-teal)] font-black text-lg">
                    <Ticket size={18} />
                    {getTicketCount(results, selectedAthleteId)} / 5
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {DRILL_DEFS.map(d => {
                    const done = hasCompletedDrill(results, selectedAthleteId!, d.category);
                    return (
                      <button
                        key={d.category}
                        onClick={() => setActiveDrill(d.category)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                          activeDrill === d.category
                            ? "border-current bg-white/5"
                            : "border-[var(--color-ares-dark-purple)] hover:border-white/20"
                        }`}
                        style={{ color: done ? d.color : "var(--color-ares-muted)" }}
                      >
                        {done ? <CheckCircle2 size={14} /> : d.icon}
                        <span className="truncate">{d.label.split(" ")[0]}</span>
                        {done && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-3 text-[var(--color-ares-muted)]" size={18} />
                <input
                  type="text"
                  placeholder="Search name or team..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[var(--color-ares-teal)] transition-colors"
                />
              </div>
              <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-xl max-h-[400px] overflow-y-auto">
                {filteredAthletes.length > 0 ? (
                  <ul className="divide-y divide-[var(--color-ares-dark-purple)]">
                    {filteredAthletes.map(a => {
                      const tickets = getTicketCount(results, a.id);
                      return (
                        <li key={a.id}>
                          <button
                            onClick={() => setSelectedAthleteId(a.id)}
                            className="w-full text-left px-4 py-3 hover:bg-[var(--color-ares-bg)] transition-colors flex justify-between items-center group"
                          >
                            <div>
                              <p className="font-medium text-white group-hover:text-[var(--color-ares-teal)] transition-colors">{a.firstName} {a.lastName}</p>
                              <p className="text-xs text-[var(--color-ares-muted)]">{a.age} y/o · {a.team}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-ares-teal)]">
                              <Ticket size={14} />
                              <span className="text-xs font-bold">{tickets} / 5</span>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="p-4 text-sm text-[var(--color-ares-muted)] text-center">
                    {athletes.length === 0 ? "No athletes registered yet." : "No athletes match your search."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Drill Entry ── */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">2. Enter Drill Results</h3>

          {/* Drill Tabs */}
          <div className="flex gap-1 bg-[var(--color-ares-charcoal)] p-1 rounded-xl border border-[var(--color-ares-dark-purple)]">
            {DRILL_DEFS.map(d => {
              const done = selectedAthleteId ? hasCompletedDrill(results, selectedAthleteId, d.category) : false;
              return (
                <button
                  key={d.category}
                  onClick={() => setActiveDrill(d.category)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    activeDrill === d.category 
                      ? "bg-[var(--color-ares-bg)] text-white border-[var(--color-ares-teal)]" 
                      : "text-[var(--color-ares-muted)] hover:text-white border-transparent hover:bg-white/5"
                  } ${done ? "bg-green-950/10 border-green-500/20" : ""}`}
                >
                  <span style={{ color: done ? "#10B981" : activeDrill === d.category ? d.color : undefined }}>
                    {done ? <CheckCircle2 size={16} /> : d.icon}
                  </span>
                  <span className="leading-tight text-center" style={{ fontSize: "9px" }}>
                    {d.label.split(" ").slice(0, 2).join(" ")}
                  </span>
                  {done ? (
                    <span className="text-[8px] text-green-400 font-bold">Done ✓</span>
                  ) : (
                    <span className="text-[8px] opacity-40">Pending</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Drill Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDrill}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-6 bg-[var(--color-ares-charcoal)] border rounded-2xl space-y-4"
              style={{ borderColor: selectedAthleteId ? activeDef.color + "40" : "var(--color-ares-dark-purple)" }}
            >
              {selectedAthlete && (
                <div className="p-3 bg-[var(--color-ares-purple)]/20 border border-[var(--color-ares-purple)]/40 rounded-xl flex items-center gap-3">
                  <UserCheck className="text-[var(--color-ares-purple)] shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-ares-muted)]">Active Athlete Profile</p>
                    <p className="text-sm font-bold text-white uppercase truncate">{selectedAthlete.firstName} {selectedAthlete.lastName}</p>
                    <p className="text-[10px] font-mono text-[var(--color-ares-teal)]">Raffle ID: #{selectedAthlete.raffleId} · {selectedAthlete.sport} ({selectedAthlete.level})</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl" style={{ background: activeDef.color + "20", color: activeDef.color }}>
                  {activeDef.icon}
                </div>
                <div>
                  <p className="font-bold text-white uppercase tracking-tight text-sm">{activeDef.label}</p>
                  <p className="text-[10px] text-[var(--color-ares-muted)]">{activeDef.description}</p>
                </div>
                {selectedAthleteId && hasCompletedDrill(results, selectedAthleteId, activeDrill) && (
                  <div className="ml-auto flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: activeDef.color + "20", color: activeDef.color }}>
                    <CheckCircle2 size={12} /> Ticket Awarded
                  </div>
                )}
              </div>

              {!selectedAthleteId ? (
                <div className="py-8 text-center">
                  <UserCheck size={32} className="text-[var(--color-ares-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-ares-muted)]">Select an athlete first</p>
                </div>
              ) : saving ? (
                <div className="py-8 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[var(--color-ares-teal)] border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-[var(--color-ares-muted)] uppercase tracking-widest animate-pulse">Saving...</p>
                </div>
              ) : (
                <>
                  {activeDrill === "GUST" && <GUSTForm onSubmit={handleDrillSubmit} />}
                  {activeDrill === "RRT" && <RRTForm onSubmit={handleDrillSubmit} />}
                  {activeDrill === "CRT" && <CRTForm onSubmit={handleDrillSubmit} />}
                  {activeDrill === "GoNoGo" && <GoNoGoForm onSubmit={handleDrillSubmit} />}
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Success toast */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-4 bg-[var(--color-ares-teal)]/10 border border-[var(--color-ares-teal)]/40 rounded-xl text-sm text-white"
              >
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Station Order & Ticket Rules Guide */}
      <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6">
        <h4 className="text-sm font-bold uppercase tracking-tight text-white mb-3">📋 Raffle Rules & Recommended Station Flow</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[var(--color-ares-muted)]">
          <div className="space-y-2">
            <p className="font-bold text-white">Recommended Testing Flow:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><span className="text-[var(--color-ares-teal)] font-bold">NeuroTrainer GUST</span> (Establish baseline engagement)</li>
              <li><span className="text-[#a78bfa] font-bold">Raw Reaction Time</span> (Test pure motor reaction)</li>
              <li><span className="text-[#34d399] font-bold">Go/No-Go</span> (Assess motor inhibition control)</li>
              <li><span className="text-[#fb923c] font-bold">Choice Reaction Time</span> (Final cognitive choice assessment)</li>
            </ol>
          </div>
          <div className="space-y-2">
            <p className="font-bold text-white">Ticket Accumulation Odds:</p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-ares-dark-purple)]">
                  <th className="py-1">Drills Completed</th>
                  <th className="py-1">Raffle Tickets</th>
                  <th className="py-1 text-right">Win Probability Multiplier</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--color-ares-dark-purple)]/50">
                  <td className="py-1">0 Drills</td>
                  <td className="py-1 font-mono text-[var(--color-ares-teal)]">1 🎟 (Base)</td>
                  <td className="py-1 text-right font-mono">1.0x</td>
                </tr>
                <tr className="border-b border-[var(--color-ares-dark-purple)]/50">
                  <td className="py-1">1 Drill</td>
                  <td className="py-1 font-mono text-[var(--color-ares-teal)]">2 🎟</td>
                  <td className="py-1 text-right font-mono">2.0x</td>
                </tr>
                <tr className="border-b border-[var(--color-ares-dark-purple)]/50">
                  <td className="py-1">2 Drills</td>
                  <td className="py-1 font-mono text-[var(--color-ares-teal)]">3 🎟</td>
                  <td className="py-1 text-right font-mono">3.0x</td>
                </tr>
                <tr className="border-b border-[var(--color-ares-dark-purple)]/50">
                  <td className="py-1">3 Drills</td>
                  <td className="py-1 font-mono text-[var(--color-ares-teal)]">4 🎟</td>
                  <td className="py-1 text-right font-mono">4.0x</td>
                </tr>
                <tr>
                  <td className="py-1">4 Drills</td>
                  <td className="py-1 font-mono text-[var(--color-ares-teal)]">5 🎟 (Max)</td>
                  <td className="py-1 text-right font-mono font-bold text-green-400">5.0x</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
