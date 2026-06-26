import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { Lead } from "../types";
import { Users, ClipboardList, Trophy, Ticket, Mail, Calendar, MapPin, CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Dashboard() {
  const { events, eventLeads, leads, leaderboardEntries, raffleDraws, emailLogs, currentEventId, setCurrentEvent } = useStore();
  const navigate = useNavigate();

  const activeEvent = useMemo(() => events.find(e => e.id === currentEventId), [events, currentEventId]);

  // Event Switcher
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentEvent(e.target.value || null);
  };

  // ─── Analytics Calculations ──────────────────────────────────────────────────
  const activeEventLeads = useMemo(() => {
    return eventLeads.filter(el => el.event_id === currentEventId);
  }, [eventLeads, currentEventId]);

  const activeLeadsDetails = useMemo(() => {
    return activeEventLeads.map(el => leads.find(l => l.id === el.lead_id)).filter(Boolean) as Lead[];
  }, [activeEventLeads, leads]);

  const activeScoresCount = useMemo(() => {
    return leaderboardEntries.filter(le => le.event_id === currentEventId).length;
  }, [leaderboardEntries, currentEventId]);

  const activeDrawsCount = useMemo(() => {
    return raffleDraws.filter(d => d.event_id === currentEventId).length;
  }, [raffleDraws, currentEventId]);

  // Funnel conversions
  const convertedLeads = useMemo(() => {
    return activeEventLeads.filter(el => el.follow_up_status === "converted");
  }, [activeEventLeads]);

  const conversionRate = useMemo(() => {
    if (activeEventLeads.length === 0) return 0;
    return Math.round((convertedLeads.length / activeEventLeads.length) * 100);
  }, [activeEventLeads, convertedLeads]);

  // Staff breakdown
  const staffBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEventLeads.forEach(el => {
      const name = el.staff_member || "Self Registered (QR)";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeEventLeads]);

  // Sources breakdown
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEventLeads.forEach(el => {
      const src = el.lead_source || "QR Code";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeEventLeads]);

  // Interest breakdown
  const interestBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEventLeads.forEach(el => {
      const interest = el.interest_type || "Keep in touch";
      counts[interest] = (counts[interest] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeEventLeads]);

  // Campaign Metrics
  const emailLogsForEvent = useMemo(() => {
    return emailLogs.filter(log => log.event_id === currentEventId);
  }, [emailLogs, currentEventId]);

  const sentEmailsCount = useMemo(() => emailLogsForEvent.filter(log => log.status === "sent" || log.status === "opened" || log.status === "clicked" || log.status === "replied").length, [emailLogsForEvent]);
  const openedEmailsCount = useMemo(() => emailLogsForEvent.filter(log => log.status === "opened" || log.status === "clicked" || log.status === "replied").length, [emailLogsForEvent]);
  const clickedEmailsCount = useMemo(() => emailLogsForEvent.filter(log => log.status === "clicked" || log.status === "replied").length, [emailLogsForEvent]);

  const openRate = useMemo(() => {
    if (sentEmailsCount === 0) return 0;
    return Math.round((openedEmailsCount / sentEmailsCount) * 100);
  }, [sentEmailsCount, openedEmailsCount]);

  const clickRate = useMemo(() => {
    if (openedEmailsCount === 0) return 0;
    return Math.round((clickedEmailsCount / openedEmailsCount) * 100);
  }, [openedEmailsCount, clickedEmailsCount]);

  // Stats for cards
  const stats = [
    { label: "Total Leads", value: activeEventLeads.length, icon: <Users size={20} />, color: "var(--color-ares-teal)" },
    { label: "Drill Submissions", value: activeScoresCount, icon: <ClipboardList size={20} />, color: "#a78bfa" },
    { label: "Raffles Drawn", value: activeDrawsCount, icon: <Ticket size={20} />, color: "#fb923c" },
    { label: "Booking Conv. Rate", value: `${conversionRate}%`, icon: <TrendingUp size={20} />, color: "#34d399" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--color-ares-white)] mb-1">
            Dashboard & Analytics
          </h2>
          <p className="text-[var(--color-ares-muted)] text-sm">
            Monitor real-time conversion rates, recruiter lead volume, and post-event sequence outreach.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[var(--color-ares-charcoal)] p-2 rounded-xl border border-[var(--color-ares-dark-purple)] w-full md:w-auto">
          <Calendar size={16} className="text-[var(--color-ares-muted)] ml-2 shrink-0" />
          <select
            value={currentEventId || ""}
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

      {/* Active Event Details Banner */}
      {activeEvent && (
        <div className="p-6 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-ares-teal)]/10 blur-[50px] pointer-events-none rounded-full" />
          <div className="space-y-1">
            <span className="text-[8px] font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase bg-[var(--color-ares-teal)]/10 px-2 py-0.5 rounded border border-[var(--color-ares-teal)]/20">
              Active Event Context
            </span>
            <h3 className="text-xl font-bold uppercase text-white tracking-tight pt-1">{activeEvent.name}</h3>
            <div className="flex items-center gap-3 text-xs text-[var(--color-ares-muted)] font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1"><MapPin size={12} /> {activeEvent.location}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(activeEvent.start_datetime).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/register?eventId=${activeEvent.id}`)}
              className="px-4 py-2 bg-[var(--color-ares-teal)]/10 hover:bg-[var(--color-ares-teal)] text-[var(--color-ares-teal)] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[var(--color-ares-teal)]/20 transition-all cursor-pointer"
            >
              Self-Register Form
            </button>
            <button
              onClick={() => navigate("/entry")}
              className="px-4 py-2 bg-[var(--color-ares-purple)]/10 hover:bg-[var(--color-ares-purple)] text-[var(--color-ares-purple)] hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[var(--color-ares-purple)]/20 transition-all cursor-pointer"
            >
              Score Panel
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className="p-5 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--color-ares-muted)]">
                {stat.label}
              </span>
              <div className="p-2 rounded-lg" style={{ background: stat.color + "15", color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {!currentEventId ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md">
          <BarChart3 className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">Please select an event to view analytics</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recruiter & Interest stats */}
          <div className="space-y-6">
            {/* Leads by Recruiter */}
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 mb-4">Leads by Recruiter Staff</h4>
              <div className="space-y-3">
                {staffBreakdown.length === 0 ? (
                  <p className="text-xs text-[var(--color-ares-muted)]">No lead records available.</p>
                ) : (
                  staffBreakdown.map(([staff, count]) => {
                    const pct = activeEventLeads.length > 0 ? (count / activeEventLeads.length) * 100 : 0;
                    return (
                      <div key={staff} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white uppercase">{staff}</span>
                          <span className="font-mono text-[var(--color-ares-teal)] font-bold">{count} leads ({Math.round(pct)}%)</span>
                        </div>
                        <div className="w-full bg-[var(--color-ares-bg)] h-2 rounded-full overflow-hidden">
                          <div className="bg-[var(--color-ares-teal)] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Leads by Interest */}
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] text-[#a78bfa] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2 mb-4">Leads by Interest Area</h4>
              <div className="space-y-3">
                {interestBreakdown.length === 0 ? (
                  <p className="text-xs text-[var(--color-ares-muted)]">No lead records available.</p>
                ) : (
                  interestBreakdown.map(([interest, count]) => {
                    const pct = activeEventLeads.length > 0 ? (count / activeEventLeads.length) * 100 : 0;
                    return (
                      <div key={interest} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-white uppercase">{interest}</span>
                          <span className="font-mono text-[#a78bfa] font-bold">{count} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="w-full bg-[var(--color-ares-bg)] h-2 rounded-full overflow-hidden">
                          <div className="bg-[#a78bfa] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Drip Sequence Performance */}
          <div className="space-y-6">
            {/* Outreach Campaign Metrics */}
            <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl p-6 space-y-6">
              <h4 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-teal)] uppercase border-b border-[var(--color-ares-dark-purple)] pb-2">Outreach Campaign Funnel</h4>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/50 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-[var(--color-ares-muted)] mb-1">Delivered</p>
                  <p className="text-xl font-bold text-white">{sentEmailsCount}</p>
                </div>
                <div className="p-4 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/50 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-[var(--color-ares-muted)] mb-1">Open Rate</p>
                  <p className="text-xl font-bold text-[var(--color-ares-teal)]">{openRate}%</p>
                  <p className="text-[8px] text-[var(--color-ares-muted)] font-mono mt-0.5">({openedEmailsCount} opens)</p>
                </div>
                <div className="p-4 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/50 rounded-xl">
                  <p className="text-[8px] uppercase tracking-wider text-[var(--color-ares-muted)] mb-1">Click-to-Open</p>
                  <p className="text-xl font-bold text-[#a78bfa]">{clickRate}%</p>
                  <p className="text-[8px] text-[var(--color-ares-muted)] font-mono mt-0.5">({clickedEmailsCount} clicks)</p>
                </div>
              </div>

              {/* Source breakdown list */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-widest">Leads by Capture Method</h5>
                {sourceBreakdown.map(([source, count]) => {
                  const pct = activeEventLeads.length > 0 ? (count / activeEventLeads.length) * 100 : 0;
                  return (
                    <div key={source} className="flex justify-between items-center text-xs p-2.5 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)]/40 rounded-xl">
                      <span className="font-semibold text-white uppercase">{source}</span>
                      <span className="font-mono text-[var(--color-ares-muted)]">{count} leads ({Math.round(pct)}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Quick Navigation Panel */}
            <div className="p-6 bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl space-y-4">
              <h4 className="text-xs font-bold tracking-[0.2em] text-[var(--color-ares-purple)] uppercase">Command Shortcuts</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/register" className="p-3 bg-[var(--color-ares-bg)] hover:bg-white/5 border border-[var(--color-ares-dark-purple)] hover:border-[var(--color-ares-teal)] text-white text-xs font-bold uppercase text-center rounded-xl transition-all">
                  Lead Capture Form
                </Link>
                <Link to="/entry" className="p-3 bg-[var(--color-ares-bg)] hover:bg-white/5 border border-[var(--color-ares-dark-purple)] hover:border-[var(--color-ares-teal)] text-white text-xs font-bold uppercase text-center rounded-xl transition-all">
                  Score Input Desk
                </Link>
                <Link to="/leaderboard" className="p-3 bg-[var(--color-ares-bg)] hover:bg-white/5 border border-[var(--color-ares-dark-purple)] hover:border-[var(--color-ares-teal)] text-white text-xs font-bold uppercase text-center rounded-xl transition-all">
                  Leaderboard Ranks
                </Link>
                <Link to="/admin" className="p-3 bg-[var(--color-ares-bg)] hover:bg-white/5 border border(--color-ares-dark-purple) hover:border-[var(--color-ares-teal)] text-white text-xs font-bold uppercase text-center rounded-xl transition-all">
                  Event Config Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
