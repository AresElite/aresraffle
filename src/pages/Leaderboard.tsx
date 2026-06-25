import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useStore } from "../store";
import { Trophy, Filter } from "lucide-react";
import { cn } from "../lib/utils";

type SortOption = "score_high" | "score_low" | "ballsBlocked" | "bombsDodged" | "newest" | "oldest" | "sport";

export function Leaderboard() {
  const { results, athletes, drills } = useStore();
  const [selectedDrill, setSelectedDrill] = useState<string>(drills[0]?.id || "");
  const [sortBy, setSortBy] = useState<SortOption>("score_high");
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("All");

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

    // Apply Filters
    if (filterAgeGroup !== "All") {
      data = data.filter((r) => {
        const age = r.athlete!.age;
        if (filterAgeGroup === "Under 12") return age < 12;
        if (filterAgeGroup === "12-14") return age >= 12 && age <= 14;
        if (filterAgeGroup === "15-18") return age >= 15 && age <= 18;
        if (filterAgeGroup === "18+") return age > 18;
        return true;
      });
    }

    // Sort
    data.sort((a, b) => {
      if (sortBy === "ballsBlocked") return (b.ballsBlocked || 0) - (a.ballsBlocked || 0);
      if (sortBy === "bombsDodged") return (b.bombsDodged || 0) - (a.bombsDodged || 0);
      if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "sport") return (a.athlete?.sport || "").localeCompare(b.athlete?.sport || "");
      if (sortBy === "score_low") return (a.score ?? a.compositeScore) - (b.score ?? b.compositeScore);
      // default score_high
      return (b.score ?? b.compositeScore) - (a.score ?? a.compositeScore); 
    });

    return data;
  }, [results, athletes, selectedDrill, sortBy, filterAgeGroup]);

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

        <div className="flex flex-wrap items-center gap-4 bg-[var(--color-ares-charcoal)]/80 backdrop-blur-md p-2 rounded-xl border border-[var(--color-ares-dark-purple)]">
          <div className="flex items-center px-3 py-1 border-r border-[var(--color-ares-dark-purple)]">
            <Filter size={16} className="text-[var(--color-ares-muted)] mr-2" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-bold uppercase tracking-wider text-[var(--color-ares-teal)] focus:outline-none appearance-none cursor-pointer"
            >
              <option className="bg-[var(--color-ares-bg)] text-white" value="score_high">Rank: Highest Score</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="score_low">Rank: Lowest Score</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="newest">Rank: Newest First</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="oldest">Rank: Oldest First</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="ballsBlocked">Rank: Balls Blocked</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="bombsDodged">Rank: Bombs Dodged</option>
              <option className="bg-[var(--color-ares-bg)] text-white" value="sport">Rank: Sport (A-Z)</option>
            </select>
          </div>
          
          <select
            value={filterAgeGroup}
            onChange={(e) => setFilterAgeGroup(e.target.value)}
            className="bg-transparent px-3 text-sm font-bold uppercase tracking-wider text-[var(--color-ares-muted)] hover:text-white focus:outline-none appearance-none cursor-pointer"
          >
            <option className="bg-[var(--color-ares-bg)] text-white" value="All">Age: All</option>
            <option className="bg-[var(--color-ares-bg)] text-white" value="Under 12">Age: Under 12</option>
            <option className="bg-[var(--color-ares-bg)] text-white" value="12-14">Age: 12-14</option>
            <option className="bg-[var(--color-ares-bg)] text-white" value="15-18">Age: 15-18</option>
            <option className="bg-[var(--color-ares-bg)] text-white" value="18+">Age: 18+</option>
          </select>
        </div>
      </header>

      {leaderboardData.length === 0 ? (
        <div className="text-center py-20 bg-[var(--color-ares-charcoal)]/50 rounded-2xl border border-[var(--color-ares-dark-purple)] backdrop-blur-md relative z-10">
          <Trophy className="mx-auto text-[var(--color-ares-dark-purple)] mb-4" size={48} />
          <p className="text-[var(--color-ares-muted)] uppercase tracking-widest font-bold">No results yet</p>
        </div>
      ) : (
        <div className="flex-1 bg-[var(--color-ares-charcoal)]/60 border border-ares rounded-2xl overflow-hidden flex flex-col relative z-10">
          {/* Header Row */}
          <div className="hidden md:grid grid-cols-12 bg-[var(--color-ares-charcoal)] border-b border-ares p-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-ares-muted)]">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Athlete</div>
            <div className="col-span-3">Sport / Team</div>
            <div className="col-span-2 text-center">Blks/Bombs</div>
            <div className="col-span-1 text-center">Mult</div>
            <div className="col-span-2 text-right">Score</div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
          {leaderboardData.map((row, index) => {
            const isTop3 = index < 3;
            return (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-12 p-4 items-center border-b border-[rgba(45,35,79,0.2)] transition-colors",
                  index === 0
                    ? "bg-[var(--color-ares-teal)]/5 shadow-[inset_0_0_20px_rgba(41,152,170,0.05)]"
                    : "hover:bg-[var(--color-ares-charcoal)]/40"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 mb-2 md:mb-0">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold",
                    index === 0 ? "bg-[var(--color-ares-teal)] text-[var(--color-ares-bg)] font-black" : "border border-ares text-[var(--color-ares-white)]"
                  )}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                {/* Athlete Info */}
                <div className="col-span-3 mb-2 md:mb-0">
                  <p className="font-bold text-white uppercase tracking-tight">
                    {row.athlete?.firstName} {row.athlete?.lastName.charAt(0)}.
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

                {/* Blocks / Bombs */}
                <div className="col-span-2 flex md:justify-center items-center gap-2 mb-1 md:mb-0">
                  <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Blk/Bomb:</span>
                  <span className="font-mono text-sm text-white text-center">
                    {row.ballsBlocked || 0} / {row.bombsDodged || 0}
                  </span>
                </div>

                {/* Multiplier */}
                <div className="col-span-1 flex md:justify-center items-center gap-2 mb-2 md:mb-0">
                  <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Multi:</span>
                  <span className="font-mono text-white text-center">
                    x{row.multiplier || 1}
                  </span>
                </div>

                {/* Score */}
                <div className="col-span-2 flex md:justify-end items-center gap-2">
                  <span className="md:hidden text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">Score:</span>
                  <span className={cn(
                    "text-lg font-black text-right",
                    sortBy === 'score_high' && index === 0 ? "text-[var(--color-ares-teal)] text-xl" : "text-white"
                  )}>
                    {row.score ?? row.compositeScore}
                  </span>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
