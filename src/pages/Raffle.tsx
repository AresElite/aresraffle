import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Ticket, Users, Crown, RefreshCw, CheckCircle2, Zap, Brain, Activity, Clock, Plus, Trash2, Calendar, MapPin, Gift, Filter } from "lucide-react";
import { useStore } from "../store";
import { DrillCategory, Prize, RaffleDraw, RaffleEntry } from "../types";
import { syncPrizeToFirebase, syncRaffleDrawToFirebase, syncRaffleEntryToFirebase, deletePrizeFromFirebase, deleteRaffleDrawFromFirebase } from "../lib/firebase-sync";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams } from "react-router-dom";

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

// ─── Weighted random draw ──────────────────────────────────────────────────────
function weightedDraw(pool: { leadId: string; tickets: number }[]) {
  const eligible = pool.filter(a => a.tickets > 0);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((s, a) => s + a.tickets, 0);
  let rand = Math.random() * total;
  for (const a of eligible) {
    rand -= a.tickets;
    if (rand <= 0) return a.leadId;
  }
  return eligible[eligible.length - 1].leadId;
}

export function Raffle() {
  const {
    leads, eventLeads, prizes, raffleEntries, raffleDraws, events, currentEventId,
    addPrize, updatePrize, addRaffleDraw, deleteRaffleDraw, updateRaffleEntry
  } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract Event ID
  const eventId = searchParams.get("eventId") || currentEventId || "";
  const event = events.find((e) => e.id === eventId);

  // States
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [shuffling, setShuffling] = useState(false);
  const [shuffleNames, setShuffleNames] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [showAddPrizeModal, setShowAddPrizeModal] = useState(false);

  // Add Prize Form
  const [newPrizeData, setNewPrizeData] = useState({
    name: "",
    description: "",
    value: "",
    quantity: "1",
    sponsor: "",
    eventDayId: "",
  });

  // Filter event specific data
  const eventPrizes = useMemo(() => prizes.filter(p => p.event_id === eventId), [prizes, eventId]);
  const activeDraws = useMemo(() => raffleDraws.filter(d => d.event_id === eventId), [raffleDraws, eventId]);

  // Set default selected prize
  useEffect(() => {
    if (eventPrizes.length > 0 && !selectedPrizeId) {
      setSelectedPrizeId(eventPrizes[0].id);
    }
  }, [eventPrizes, selectedPrizeId]);

  // Pool of entrants for the active event
  const pool = useMemo(() => {
    if (!eventId) return [];
    
    // Find all leads who opted into raffle/email for this event
    const activeEventLeads = eventLeads.filter(el => el.event_id === eventId && el.raffle_eligible);
    
    return activeEventLeads.map(el => {
      const leadDetails = leads.find(l => l.id === el.lead_id);
      const raffleEntry = raffleEntries.find(re => re.event_id === eventId && re.lead_id === el.lead_id);
      const ticketCount = raffleEntry ? raffleEntry.entry_count : 1; // 1 floor minimum if registered
      
      return {
        leadId: el.lead_id,
        firstName: leadDetails?.first_name || "Unknown",
        lastName: leadDetails?.last_name || "Athlete",
        organization: leadDetails?.organization || "",
        tickets: ticketCount,
      };
    }).filter(p => p.firstName !== "Unknown");
  }, [leads, eventLeads, raffleEntries, eventId]);

  const eligible = useMemo(() => {
    // Exclude leads who already won another prize at this event (prevent duplicates)
    const pastWinnerIds = activeDraws.map(d => d.winner_lead_id);
    return pool.filter(p => p.tickets > 0 && !pastWinnerIds.includes(p.leadId));
  }, [pool, activeDraws]);

  const totalTickets = useMemo(() => eligible.reduce((s, a) => s + a.tickets, 0), [eligible]);

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeData.name.trim() || !eventId) return;

    const prizeId = uuidv4();
    const newPrize: Prize = {
      id: prizeId,
      event_id: eventId,
      event_day_id: newPrizeData.eventDayId || undefined,
      name: newPrizeData.name,
      description: newPrizeData.description,
      value: parseFloat(newPrizeData.value) || 0,
      sponsor: newPrizeData.sponsor || undefined,
      quantity: parseInt(newPrizeData.quantity) || 1,
      drawing_datetime: new Date().toISOString(),
      drawing_method: "random draw",
      status: "active",
    };

    addPrize(newPrize);
    await syncPrizeToFirebase(newPrize);
    setSelectedPrizeId(prizeId);
    setShowAddPrizeModal(false);
    setNewPrizeData({
      name: "",
      description: "",
      value: "",
      quantity: "1",
      sponsor: "",
      eventDayId: "",
    });
  };

  const handleDraw = () => {
    if (eligible.length === 0 || !selectedPrizeId) return;
    setDrawn(false);
    setShowConfetti(false);
    setShuffling(true);

    const winnerLeadId = weightedDraw(eligible);
    if (!winnerLeadId) return;

    const winnerDetails = eligible.find(p => p.leadId === winnerLeadId);
    const namesPool = eligible.map(a => `${a.firstName} ${a.lastName}`);

    // Select up to 3 backup winners (drawn randomly from the remaining eligible list)
    const remainingEligible = eligible.filter(p => p.leadId !== winnerLeadId);
    const backupWinnerIds: string[] = [];
    const tempPool = [...remainingEligible];
    for (let i = 0; i < Math.min(3, tempPool.length); i++) {
      const backupId = weightedDraw(tempPool);
      if (backupId) {
        backupWinnerIds.push(backupId);
        const idx = tempPool.findIndex(p => p.leadId === backupId);
        if (idx > -1) tempPool.splice(idx, 1);
      }
    }

    // Shuffle animation
    let count = 0;
    const totalFrames = 30;
    const interval = setInterval(async () => {
      const shuffled = [...namesPool].sort(() => Math.random() - 0.5).slice(0, 5);
      setShuffleNames(shuffled);
      count++;
      
      if (count >= totalFrames) {
        clearInterval(interval);
        setShuffling(false);
        setShowConfetti(true);
        setDrawn(true);

        // Save Raffle Draw Details
        const newDraw: RaffleDraw = {
          id: uuidv4(),
          event_id: eventId,
          prize_id: selectedPrizeId,
          winner_lead_id: winnerLeadId,
          backup_winner_lead_ids: backupWinnerIds,
          drawing_timestamp: new Date().toISOString(),
          drawn_by: "Admin Operator",
        };

        addRaffleDraw(newDraw);
        await syncRaffleDrawToFirebase(newDraw);

        // Update prize status to drawn
        const prize = eventPrizes.find(p => p.id === selectedPrizeId);
        if (prize) {
          const updatedPrize = { ...prize, status: "drawn" as const };
          updatePrize(selectedPrizeId, updatedPrize);
          await syncPrizeToFirebase(updatedPrize);
        }

        // Update winner status in RaffleEntry
        const winnerRaffleEntry = raffleEntries.find(re => re.event_id === eventId && re.lead_id === winnerLeadId);
        if (winnerRaffleEntry) {
          const updatedEntry = { ...winnerRaffleEntry, winner_status: "winner" as const };
          updateRaffleEntry(winnerRaffleEntry.id, updatedEntry);
          await syncRaffleEntryToFirebase(updatedEntry);
        }

        // Update backup winner statuses
        for (const backupId of backupWinnerIds) {
          const backupEntry = raffleEntries.find(re => re.event_id === eventId && re.lead_id === backupId);
          if (backupEntry) {
            const updatedEntry = { ...backupEntry, winner_status: "backup" as const };
            updateRaffleEntry(backupEntry.id, updatedEntry);
            await syncRaffleEntryToFirebase(updatedEntry);
          }
        }

        setTimeout(() => setShowConfetti(false), 5000);
      }
    }, 100);
  };

  const handleResetDraw = async (drawId: string, prizeId: string) => {
    if (!window.confirm("Are you sure you want to reset this drawing? The winner logs will be cleared.")) return;
    
    // Find draw and winner/backup ids
    const draw = activeDraws.find(d => d.id === drawId);
    if (!draw) return;

    // Delete draw
    deleteRaffleDraw(drawId);
    await deleteRaffleDrawFromFirebase(drawId);

    // Reset Prize status
    const prize = eventPrizes.find(p => p.id === prizeId);
    if (prize) {
      const updatedPrize = { ...prize, status: "active" as const };
      updatePrize(prizeId, updatedPrize);
      await syncPrizeToFirebase(updatedPrize);
    }

    // Reset winner status in RaffleEntry
    const winnerRaffleEntry = raffleEntries.find(re => re.event_id === eventId && re.lead_id === draw.winner_lead_id);
    if (winnerRaffleEntry) {
      const updatedEntry = { ...winnerRaffleEntry, winner_status: "eligible" as const };
      updateRaffleEntry(winnerRaffleEntry.id, updatedEntry);
      await syncRaffleEntryToFirebase(updatedEntry);
    }

    // Reset backup statuses
    for (const backupId of draw.backup_winner_lead_ids) {
      const backupEntry = raffleEntries.find(re => re.event_id === eventId && re.lead_id === backupId);
      if (backupEntry) {
        const updatedEntry = { ...backupEntry, winner_status: "eligible" as const };
        updateRaffleEntry(backupEntry.id, updatedEntry);
        await syncRaffleEntryToFirebase(updatedEntry);
      }
    }

    setDrawn(false);
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ eventId: val });
    } else {
      setSearchParams({});
    }
    setSelectedPrizeId("");
    setDrawn(false);
  };

  // Selected prize details and draw details
  const activePrize = eventPrizes.find(p => p.id === selectedPrizeId);
  const currentDraw = activeDraws.find(d => d.prize_id === selectedPrizeId);
  const winnerLead = currentDraw ? leads.find(l => l.id === currentDraw.winner_lead_id) : null;
  const backupLeads = currentDraw ? currentDraw.backup_winner_lead_ids.map(id => leads.find(l => l.id === id)).filter(Boolean) : [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 relative z-10">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-1 flex items-center gap-3">
            <Trophy className="text-[var(--color-ares-teal)]" size={32} />
            Raffle Draw
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ares-muted)] font-semibold uppercase tracking-wider">
            {event ? (
              <>
                <span className="text-white font-bold">{event.name}</span>
                <span className="text-[var(--color-ares-teal)] font-bold">·</span>
                <span>{pool.length} entrants pool</span>
                <span className="text-[var(--color-ares-teal)] font-bold">·</span>
                <span>{totalTickets} total tickets</span>
              </>
            ) : (
              <span>No event selected</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[var(--color-ares-charcoal)] p-2 rounded-xl border border-[var(--color-ares-dark-purple)] w-full md:w-auto">
          <Filter size={16} className="text-[var(--color-ares-muted)] ml-2 shrink-0" />
          <select
            value={eventId}
            onChange={handleEventChange}
            className="bg-transparent text-sm font-bold uppercase tracking-wider text-[var(--color-ares-teal)] focus:outline-none appearance-none cursor-pointer pr-4"
          >
            <option value="" className="bg-[var(--color-ares-bg)] text-white">Select Event...</option>
            {events.map((e) => (
              <option key={e.id} value={e.id} className="bg-[var(--color-ares-bg)] text-white">
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {!eventId ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md relative z-10">
          <Trophy className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">Please select an event to view raffle</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Drawing controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-ares-dark-purple)] pb-3">
                <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">Select Prize to Draw</h3>
                <button
                  onClick={() => setShowAddPrizeModal(true)}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ares-teal)] bg-[var(--color-ares-teal)]/10 hover:bg-[var(--color-ares-teal)]/20 px-3 py-1.5 rounded-lg border border-[var(--color-ares-teal)]/20 transition-all"
                >
                  <Plus size={12} /> Add Prize
                </button>
              </div>

              {eventPrizes.length === 0 ? (
                <div className="py-8 text-center space-y-4">
                  <Gift size={32} className="text-[var(--color-ares-muted)] mx-auto" />
                  <p className="text-sm text-[var(--color-ares-muted)]">No prizes configured for this event yet.</p>
                  <button
                    onClick={() => setShowAddPrizeModal(true)}
                    className="px-6 py-2.5 bg-[var(--color-ares-teal)] text-white text-xs font-bold uppercase rounded-lg"
                  >
                    Configure First Prize
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-wider mb-1 px-1 block">Active Prize</label>
                    <select
                      value={selectedPrizeId}
                      onChange={(e) => { setSelectedPrizeId(e.target.value); setDrawn(false); }}
                      className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--color-ares-teal)] transition-colors text-sm"
                    >
                      {eventPrizes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.status === "drawn" ? " (DRAWN)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activePrize && (
                    <div className="p-4 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-white uppercase text-sm">{activePrize.name}</p>
                        {activePrize.value > 0 && (
                          <span className="bg-[var(--color-ares-teal)]/10 text-[var(--color-ares-teal)] border border-[var(--color-ares-teal)]/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                            Value: ${activePrize.value}
                          </span>
                        )}
                      </div>
                      {activePrize.description && <p className="text-[var(--color-ares-muted)]">{activePrize.description}</p>}
                      {activePrize.sponsor && <p className="text-[var(--color-ares-purple)] font-semibold">Sponsor: {activePrize.sponsor}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {activePrize && (
              <div className="relative bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-8 min-h-[360px] flex flex-col items-center justify-center overflow-hidden">
                <ConfettiCanvas active={showConfetti} />

                {!shuffling && !currentDraw && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 z-20">
                    <div className="w-20 h-20 bg-[var(--color-ares-teal)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--color-ares-teal)]">
                      <Ticket size={36} />
                    </div>
                    <p className="text-[var(--color-ares-muted)] text-sm">
                      {eligible.length} athlete{eligible.length !== 1 ? "s" : ""} eligible to win
                    </p>
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

                {(currentDraw || (drawn && winnerLead)) && winnerLead && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="text-center z-20 space-y-6 max-w-md w-full"
                  >
                    <div>
                      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-2">
                        <Crown size={28} />
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1">🎉 Winner Drawn!</p>
                      <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                        {winnerLead.first_name} {winnerLead.last_name}
                      </h3>
                      <p className="text-[var(--color-ares-muted)] text-sm mt-1">{winnerLead.organization}</p>
                    </div>

                    {/* Backups List */}
                    {backupLeads.length > 0 && (
                      <div className="p-4 bg-[var(--color-ares-bg)] rounded-xl border border-[var(--color-ares-dark-purple)]/50 text-left space-y-2">
                        <p className="text-[9px] uppercase tracking-widest text-[var(--color-ares-purple)] font-black">Backup Winners (In order)</p>
                        <ol className="list-decimal pl-4 space-y-1 text-xs text-white/90">
                          {backupLeads.map((bl, idx) => (
                            <li key={bl!.id} className="font-semibold uppercase tracking-tight">
                              {bl!.first_name} {bl!.last_name} <span className="text-[var(--color-ares-muted)] font-normal">({bl!.organization})</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <button
                      onClick={() => handleResetDraw(currentDraw!.id, selectedPrizeId)}
                      className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] text-[var(--color-ares-muted)] hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                      <RefreshCw size={14} /> Reset & Redraw
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Entrants List */}
          <div className="space-y-6">
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase">
                Active Pool ({eligible.length})
              </h3>

              <div className="overflow-hidden max-h-[380px] overflow-y-auto border border-[var(--color-ares-dark-purple)]/50 rounded-xl">
                {eligible.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={32} className="text-[var(--color-ares-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--color-ares-muted)]">No eligible entrants</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--color-ares-dark-purple)]">
                    {[...eligible].sort((a, b) => b.tickets - a.tickets).map((a, i) => {
                      const winChance = totalTickets > 0 ? ((a.tickets / totalTickets) * 100).toFixed(1) : "0.0";
                      return (
                        <li key={a.leadId} className="px-4 py-3 flex items-center justify-between hover:bg-[var(--color-ares-bg)]/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[var(--color-ares-muted)] w-5 text-right">{i + 1}</span>
                            <div>
                              <p className="font-bold uppercase tracking-tight text-xs text-white">
                                {a.firstName} {a.lastName}
                              </p>
                              <p className="text-[9px] text-[var(--color-ares-muted)] truncate max-w-[120px]">{a.organization}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 text-[var(--color-ares-teal)] justify-end">
                              <Ticket size={12} />
                              <span className="font-black text-xs">{a.tickets}</span>
                            </div>
                            <p className="text-[8px] text-[var(--color-ares-muted)]">{winChance}% chance</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* List of past draws */}
            {activeDraws.length > 0 && (
              <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
                <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-purple)] uppercase">Drawn Winners</h3>
                <div className="space-y-3">
                  {activeDraws.map(d => {
                    const prize = prizes.find(p => p.id === d.prize_id);
                    const winner = leads.find(l => l.id === d.winner_lead_id);
                    return (
                      <div key={d.id} className="flex justify-between items-center p-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/50 rounded-xl text-xs">
                        <div className="min-w-0 flex-1 pr-2">
                          <p className="font-bold text-white truncate uppercase">{prize?.name || "Unknown Prize"}</p>
                          <p className="text-[10px] text-[var(--color-ares-teal)] font-semibold uppercase truncate">
                            Winner: {winner?.first_name} {winner?.last_name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResetDraw(d.id, d.prize_id)}
                          className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Prize Modal */}
      {showAddPrizeModal && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddPrize} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl max-w-md w-full space-y-4 relative shadow-2xl">
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Configure New Prize</h3>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Prize Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Meta Quest 3 VR Headset"
                value={newPrizeData.name}
                onChange={e => setNewPrizeData(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Drawn at 4:00 PM on Sunday"
                value={newPrizeData.description}
                onChange={e => setNewPrizeData(p => ({ ...p, description: e.target.value }))}
                className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Est. Value ($)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={newPrizeData.value}
                  onChange={e => setNewPrizeData(p => ({ ...p, value: e.target.value }))}
                  className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Sponsor / Brand</label>
                <input
                  type="text"
                  placeholder="e.g. NeuroTrainer"
                  value={newPrizeData.sponsor}
                  onChange={e => setNewPrizeData(p => ({ ...p, sponsor: e.target.value }))}
                  className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[var(--color-ares-dark-purple)]">
              <button
                type="button"
                onClick={() => setShowAddPrizeModal(false)}
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[var(--color-ares-teal)] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 transition-colors"
              >
                Save Prize
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
}
