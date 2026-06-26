import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { Trophy, Filter, Crown, Search } from "lucide-react";
import { cn } from "../lib/utils";

type SortOption = "score_high" | "score_low" | "ballsBlocked" | "bombsDodged" | "newest" | "oldest" | "sport";

const DRILL_SORT_OPTIONS: Record<string, { value: SortOption; label: string }[]> = {
  "drill-gust": [
    { value: "score_high", label: "Rank: Highest Score" },
    { value: "score_low", label: "Rank: Lowest Score" },
    { value: "ballsBlocked", label: "Rank: Balls Blocked" },
    { value: "bombsDodged", label: "Rank: Bombs Dodged" },
  ],
  "drill-rrt": [
    { value: "score_low", label: "Rank: Fastest Reaction Time" },
    { value: "score_high", label: "Rank: Slowest Reaction Time" },
  ],
  "drill-gonogo": [
    { value: "score_high", label: "Rank: Most Correct" },
    { value: "score_low", label: "Rank: Least Correct" },
  ],
  "drill-crt": [
    { value: "score_high", label: "Rank: Highest Accuracy" },
    { value: "score_low", label: "Rank: Fastest Reaction Time" },
  ],
};

export function Leaderboard() {
  const { results, athletes, drills } = useStore();
  const [selectedDrill, setSelectedDrill] = useState<string>(drills[0]?.id || "drill-gust");
  const [sortBy, setSortBy] = useState<SortOption>("score_high");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleDrillChange = (drillId: string) => {
    setSelectedDrill(drillId);
    if (drillId === "drill-rrt") {
      setSortBy("score_low");
    } else {
      setSortBy("score_high");
    }
  };

  const leaderboardData = useMemo(() => {
    let data = results
      .filter((r) => r.drillId === selectedDrill)
      .map((r) => {
        const athlete = athletes.find((a) => a.id === r.athleteId);
        return {
          ...r,
          athlete,
        };
      })
      .filter((r) => r.athlete !== undefined);

    // Apply Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((r) =>
        `${r.athlete!.firstName} ${r.athlete!.lastName}`.toLowerCase().includes(q) ||
        r.athlete!.sport?.toLowerCase().includes(q) ||
        r.athlete!.team?.toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "sport") return (a.athlete?.sport || "").localeCompare(b.athlete?.sport || "");
      
      // Drill-specific sorts
      if (selectedDrill === "drill-gust") {
        if (sortBy === "ballsBlocked") return (b.ballsBlocked || 0) - (a.ballsBlocked || 0);
        if (sortBy === "bombsDodged") return (b.bombsDodged || 0) - (a.bombsDodged || 0);
        if (sortBy === "score_low") return (a.score ?? a.compositeScore) - (b.score ?? b.compositeScore);
        return (b.score ?? b.compositeScore) - (a.score ?? a.compositeScore);
      }
      
      if (selectedDrill === "drill-rrt") {
        if (sortBy === "score_high") return (b.reactionTimeMs || 0) - (a.reactionTimeMs || 0);
        return (a.reactionTimeMs || 0) - (b.reactionTimeMs || 0); // score_low (default)
      }
      
      if (selectedDrill === "drill-gonogo") {
        if (sortBy === "score_low") return (a.correctResponses || 0) - (b.correctResponses || 0);
        return (b.correctResponses || 0) - (a.correctResponses || 0); // score_high (default)
      }
      
      if (selectedDrill === "drill-crt") {
        if (sortBy === "score_low") return (a.reactionTimeMs || 0) - (b.reactionTimeMs || 0); // Fastest reaction time
        return (b.accuracyPercentage || 0) - (a.accuracyPercentage || 0); // score_high (default) - Highest Accuracy
      }
      
      return (b.score ?? b.compositeScore) - (a.score ?? a.compositeScore);
    });

    return data;
  }, [results, athletes, selectedDrill, sortBy, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 relative z-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2 flex items-center gap-4">
            <Trophy className="text-[var(--color-ares-teal)]" size={48} />
            Live Ranks
          </h2>
          <p className="text-[var(--color-ares-muted)] tracking-widest uppercase text-sm font-bold">
            Public Display Mode
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-[var(--color-ares-charcoal)]/80 backdrop-blur-md p-2 rounded-xl border border-[var(--color-ares-dark-purple)] w-full md:w-auto">
          {/* Search bar inside header */}
          <div className="flex items-center px-3 py-1 border-r border-[var(--color-ares-dark-purple)] flex-1 md:flex-initial min-w-[200px]">
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
        {drills.map((d) => (
          <button
            key={d.id}
            onClick={() => handleDrillChange(d.id)}
            className={cn(
              "px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer",
              selectedDrill === d.id
                ? "bg-[var(--color-ares-teal)] text-white border-[var(--color-ares-teal)] glow-shadow"
                : "bg-[var(--color-ares-charcoal)] border-[var(--color-ares-dark-purple)] text-[var(--color-ares-muted)] hover:text-white"
            )}
          >
            {d.name}
          </button>
        ))}
      </div>

      {leaderboardData.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md relative z-10">
          <Trophy className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">No results found</p>
        </div>
      ) : (
        <div className="flex-1 bg-[var(--color-ares-charcoal)]/60 border border-ares rounded-2xl overflow-hidden flex flex-col relative z-10">
          {/* Header Row */}
          {selectedDrill === "drill-gust" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-ares p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Athlete</div>
              <div className="col-span-3">Sport / Team</div>
              <div className="col-span-2 text-center">Blks/Bombs</div>
              <div className="col-span-1 text-center">Mult</div>
              <div className="col-span-2 text-right">Score</div>
            </div>
          )}
          {selectedDrill === "drill-rrt" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-ares p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-4">Athlete</div>
              <div className="col-span-4">Sport / Team</div>
              <div className="col-span-3 text-right">Reaction Time</div>
            </div>
          )}
          {selectedDrill === "drill-gonogo" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-ares p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
              <div className="col-span-1">Rank</div>
              <div className="col-span-3">Athlete</div>
              <div className="col-span-3">Sport / Team</div>
              <div className="col-span-2 text-center">Correct</div>
              <div className="col-span-1 text-center">False Starts</div>
              <div className="col-span-2 text-right">Avg Time</div>
            </div>
          )}
          {selectedDrill === "drill-crt" && (
            <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-ares p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
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
              const rankCls = isTop3 ? placeColors[index] : "border-ares text-[var(--color-ares-white)]";

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
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs", rankCls)}>
                      {isTop3 ? (index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉") : String(index + 1).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Athlete Info */}
                  <div className="col-span-3 mb-2 md:mb-0">
                    <p className="font-bold text-white uppercase tracking-tight flex items-center gap-1.5">
                      {row.athlete?.firstName} {row.athlete?.lastName}
                      {index === 0 && <Crown size={12} className="text-amber-400 shrink-0" />}
                    </p>
                    <p className="text-[10px] uppercase text-[var(--color-ares-muted)]">
                      {row.athlete?.position || "Athlete"}
                    </p>
                  </div>

                  {/* Sport/Team Info */}
                  <div className="col-span-3 mb-2 md:mb-0">
                    <p className="text-xs font-semibold text-white">{row.athlete?.sport}</p>
                    <p className="text-[9px] uppercase text-[var(--color-ares-muted)]">{row.athlete?.team}</p>
                  </div>

                  {/* Drill Specific Cells */}
                  {selectedDrill === "drill-gust" && (
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
                          {row.score ?? row.compositeScore}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedDrill === "drill-rrt" && (
                    <>
                      <div className="col-span-5 flex md:justify-end items-center gap-2">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Reaction Time:</span>
                        <span className="text-lg font-black text-right text-[#a78bfa] font-mono">
                          {row.reactionTimeMs || 0} ms
                        </span>
                      </div>
                    </>
                  )}

                  {selectedDrill === "drill-gonogo" && (
                    <>
                      <div className="col-span-2 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                        <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Correct:</span>
                        <span className="font-mono text-sm text-white text-center">
                          {row.correctResponses || 0}
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

                  {selectedDrill === "drill-crt" && (
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
                          {row.accuracyPercentage || 0}%
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
