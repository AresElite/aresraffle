import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { Trophy, Filter, Crown, Search, Calendar, MapPin } from "lucide-react";
import { cn } from "../lib/utils";
import { useSearchParams } from "react-router-dom";
import { DrillCategory } from "../types";

type SortOption = "score_best" | "newest" | "oldest" | "sport";

const DRILL_SORT_OPTIONS: Record<DrillCategory, { value: SortOption; label: string }[]> = {
  GUST: [
    { value: "score_best", label: "Rank: Highest Score" },
  ],
  RRT: [
    { value: "score_best", label: "Rank: Fastest Reaction Time" },
  ],
  GoNoGo: [
    { value: "score_best", label: "Rank: Most Correct Responses" },
  ],
  CRT: [
    { value: "score_best", label: "Rank: Highest Accuracy" },
  ],
};

const DRILL_LABELS: Record<DrillCategory, string> = {
  GUST: "NeuroTrainer GUST",
  RRT: "Raw Reaction Time",
  GoNoGo: "Go / No-Go",
  CRT: "Choice Reaction Time",
};

export function Leaderboard() {
  const { leaderboardEntries, eventLeads, leads, events, currentEventId } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Extract Event ID from search parameter or fallback to active event in store
  const eventId = searchParams.get("eventId") || currentEventId || "";
  const event = events.find((e) => e.id === eventId);

  const [selectedDrill, setSelectedDrill] = useState<DrillCategory>("GUST");
  const [sortBy, setSortBy] = useState<SortOption>("score_best");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleDrillChange = (drill: DrillCategory) => {
    setSelectedDrill(drill);
    setSortBy("score_best");
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      setSearchParams({ eventId: val });
    } else {
      setSearchParams({});
    }
  };

  const leaderboardData = useMemo(() => {
    if (!eventId) return [];

    let data = leaderboardEntries
      .filter((le) => le.event_id === eventId && le.category === selectedDrill)
      .map((le) => {
        const eventLead = eventLeads.find((el) => el.event_id === eventId && el.lead_id === le.lead_id);
        const leadDetails = leads.find((l) => l.id === le.lead_id);
        return {
          ...le,
          lead: leadDetails,
          eventLead,
        };
      })
      .filter((item) => item.lead !== undefined);

    // Apply Search Filter (Name, Sport/Industry, Organization)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) =>
        `${item.lead!.first_name} ${item.lead!.last_name}`.toLowerCase().includes(q) ||
        item.lead!.sport_or_industry?.toLowerCase().includes(q) ||
        item.lead!.organization?.toLowerCase().includes(q)
      );
    }

    // Sort entries
    data.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === "oldest") return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === "sport") return (a.lead?.sport_or_industry || "").localeCompare(b.lead?.sport_or_industry || "");

      // Default/Best score sort:
      if (selectedDrill === "GUST") {
        // GUST: Highest score is best
        return b.score - a.score;
      }
      if (selectedDrill === "RRT") {
        // RRT: Fastest (lowest milliseconds) is best
        const valA = a.reactionTimeMs ?? a.score ?? 999999;
        const valB = b.reactionTimeMs ?? b.score ?? 999999;
        return valA - valB;
      }
      if (selectedDrill === "GoNoGo") {
        // GoNoGo: Highest correctResponses is best. Fallback to score
        const valA = a.correctResponses ?? a.score ?? 0;
        const valB = b.correctResponses ?? b.score ?? 0;
        return valB - valA;
      }
      if (selectedDrill === "CRT") {
        // CRT: Highest accuracyPercentage is best. Fallback to score
        const valA = a.accuracyPercentage ?? a.score ?? 0;
        const valB = b.accuracyPercentage ?? b.score ?? 0;
        return valB - valA;
      }

      return b.score - a.score;
    });

    return data;
  }, [leaderboardEntries, eventLeads, leads, eventId, selectedDrill, sortBy, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 relative z-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2 flex items-center gap-4">
            <Trophy className="text-[var(--color-ares-teal)]" size={48} />
            Leaderboard
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-ares-muted)] font-semibold uppercase tracking-wider">
            <span>Public Display Mode</span>
            {event && (
              <>
                <span className="text-[var(--color-ares-teal)] font-bold">·</span>
                <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                <span className="text-[var(--color-ares-teal)] font-bold">·</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.start_datetime).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-[var(--color-ares-charcoal)]/80 backdrop-blur-md p-2 rounded-xl border border-[var(--color-ares-dark-purple)] w-full md:w-auto">
          {/* Switch Event Dropdown */}
          <div className="flex items-center px-3 py-1 border-r border-[var(--color-ares-dark-purple)]">
            <Filter size={16} className="text-[var(--color-ares-muted)] mr-2 shrink-0" />
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

          {/* Search bar inside header */}
          <div className="flex items-center px-3 py-1 border-r border-[var(--color-ares-dark-purple)] flex-1 md:flex-initial min-w-[150px]">
            <Search size={16} className="text-[var(--color-ares-muted)] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none w-full"
            />
          </div>
          
          <div className="flex items-center px-3 py-1">
            <Filter size={16} className="text-[var(--color-ares-muted)] mr-2 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-bold uppercase tracking-wider text-[var(--color-ares-teal)] focus:outline-none appearance-none cursor-pointer"
            >
              {(DRILL_SORT_OPTIONS[selectedDrill] || []).map((opt) => (
                <option key={opt.value} className="bg-[var(--color-ares-bg)] text-white" value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option className="bg-[var(--color-ares-bg)] text-white" value="newest">Rank: Newest First</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="oldest">Rank: Oldest First</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="sport">Rank: Sport (A-Z)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Drill Selection Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 relative z-10">
        {(["GUST", "RRT", "GoNoGo", "CRT"] as DrillCategory[]).map((drill) => (
          <button
            key={drill}
            onClick={() => handleDrillChange(drill)}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer",
              selectedDrill === drill
                ? "bg-[var(--color-ares-teal)] text-white border-[var(--color-ares-teal)] glow-shadow"
                : "bg-[var(--color-ares-charcoal)] border-[var(--color-ares-dark-purple)] text-[var(--color-ares-muted)] hover:text-white"
            )}
          >
            {DRILL_LABELS[drill]}
          </button>
        ))}
      </div>

      {!eventId ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md relative z-10">
          <Trophy className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">Please select an event to view rankings</p>
        </div>
      ) : leaderboardData.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md relative z-10">
          <Trophy className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">No entries found for this drill</p>
        </div>
      ) : (
        <div className="flex-1 bg-[var(--color-ares-charcoal)]/60 border border-[var(--color-ares-dark-purple)] rounded-2xl overflow-hidden flex flex-col relative z-10">
          {/* Header Row */}
          {selectedDrill === "GUST" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-[var(--color-ares-dark-purple)] p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Athlete</div>
              <div className="col-span-3">Sport / Team</div>
              <div className="col-span-2 text-center">Blks/Bombs</div>
              <div className="col-span-1 text-center">Mult</div>
              <div className="col-span-2 text-right">Score</div>
            </div>
          )}
          {selectedDrill === "RRT" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-[var(--color-ares-dark-purple)] p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Athlete</div>
              <div className="col-span-4">Sport / Team</div>
              <div className="col-span-3 text-right">Reaction Time</div>
            </div>
          )}
          {selectedDrill === "GoNoGo" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-[var(--color-ares-dark-purple)] p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Athlete</div>
              <div className="col-span-3">Sport / Team</div>
              <div className="col-span-2 text-center">Correct</div>
              <div className="col-span-1 text-center">False Starts</div>
              <div className="col-span-2 text-right">Avg Time</div>
            </div>
          )}
          {selectedDrill === "CRT" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-[var(--color-ares-dark-purple)] p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Athlete</div>
              <div className="col-span-3">Sport / Team</div>
              <div className="col-span-2 text-center">Avg Time</div>
              <div className="col-span-3 text-right">Accuracy</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {leaderboardData.map((row, index) => {
              const isTop3 = index < 3;
              const placeColors = [
                "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]", // 1st
                "border-slate-300/50 bg-slate-300/10 text-slate-200 shadow-[0_0_15px_rgba(203,213,225,0.2)]", // 2nd
                "border-amber-700/50 bg-amber-700/10 text-amber-600 shadow-[0_0_15px_rgba(180,83,9,0.2)]",   // 3rd
              ];
              const rankCls = isTop3 ? placeColors[index] : "border-[var(--color-ares-dark-purple)] text-[var(--color-ares-white)]";

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 p-4 items-center border-b border-[rgba(45,35,79,0.2)] transition-colors hover:bg-[var(--color-ares-charcoal)]/40",
                    index === 0 && "bg-[var(--color-ares-teal)]/5 shadow-[inset_0_0_20px_rgba(41,152,170,0.02)]"
                  )}
                >
                  {/* Rank */}
                  <div className="col-span-1 mb-2 md:mb-0">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border", rankCls)}>
                      {isTop3 ? (index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉") : String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Athlete Info */}
                  <div className="col-span-3 mb-2 md:mb-0">
                    <p className="font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
                      {row.lead?.first_name} {row.lead?.last_name}
                      {index === 0 && <Crown size={12} className="text-amber-400 shrink-0" />}
                    </p>
                    <p className="text-[10px] uppercase text-[var(--color-ares-muted)]">
                      {row.lead?.role || "Lead"}
                    </p>
                  </div>

                  {/* Sport/Team Info */}
                  <div className="col-span-3 mb-2 md:mb-0">
                    <p className="text-xs font-semibold text-white">{row.lead?.sport_or_industry}</p>
                    <p className="text-[9px] uppercase text-[var(--color-ares-muted)]">{row.lead?.organization}</p>
                  </div>

                  {/* Drill Specific Cells */}
                  {selectedDrill === "GUST" && (
                    <>
                      <div className="col-span-2 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Blk/Bomb:</span>
                        <span className="font-mono text-sm text-white text-center">
                          {row.ballsBlocked || 0} / {row.bombsDodged || 0}
                        </span>
                      </div>
                      <div className="col-span-1 flex md:justify-center items-center gap-2 mb-2 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Multi:</span>
                        <span className="font-mono text-white text-center">
                          x{row.multiplier || 1}
                        </span>
                      </div>
                      <div className="col-span-2 flex md:justify-end items-center gap-2">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Score:</span>
                        <span className="text-lg font-black text-right text-[var(--color-ares-teal)]">
                          {row.score}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedDrill === "RRT" && (
                    <>
                      <div className="col-span-5 flex md:justify-end items-center gap-2">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Reaction Time:</span>
                        <span className="text-lg font-black text-right text-[#a78bfa] font-mono">
                          {row.reactionTimeMs ?? row.score} ms
                        </span>
                      </div>
                    </>
                  )}

                  {selectedDrill === "GoNoGo" && (
                    <>
                      <div className="col-span-2 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Correct:</span>
                        <span className="font-mono text-sm text-white text-center">
                          {row.correctResponses ?? row.score}
                        </span>
                      </div>
                      <div className="col-span-1 flex md:justify-center items-center gap-2 mb-2 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">False Starts:</span>
                        <span className="font-mono text-white text-center">
                          {row.falseStarts || 0}
                        </span>
                      </div>
                      <div className="col-span-2 flex md:justify-end items-center gap-2">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Avg Time:</span>
                        <span className="text-lg font-black text-right text-[#34d399] font-mono">
                          {row.reactionTimeMs || 0} ms
                        </span>
                      </div>
                    </>
                  )}

                  {selectedDrill === "CRT" && (
                    <>
                      <div className="col-span-2 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Avg Time:</span>
                        <span className="font-mono text-sm text-white text-center">
                          {row.reactionTimeMs || 0} ms
                        </span>
                      </div>
                      <div className="col-span-3 flex md:justify-end items-center gap-2">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Accuracy:</span>
                        <span className="text-lg font-black text-right text-[#fb923c] font-mono">
                          {row.accuracyPercentage ?? row.score}%
                        </span>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

