import { motion } from "motion/react";
import { useStore } from "../store";
import { Users, ClipboardList, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { athletes, results } = useStore();

  const stats = [
    { label: "Total Athletes", value: athletes.length, icon: <Users size={24} />, route: "/register" },
    { label: "Drill Entries", value: results.length, icon: <ClipboardList size={24} />, route: "/entry" },
    { label: "Leaderboard", value: "View", icon: <Trophy size={24} />, route: "/leaderboard" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <header>
        <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--color-ares-white)] mb-2">
          Event Control Center
        </h2>
        <p className="text-[var(--color-ares-muted)] leading-relaxed font-light max-w-2xl">
          Manage athlete registration, enter drill results, and monitor live rankings for the NeuroTrainer GUST challenge.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <Link
              to={stat.route}
              className="block p-8 rounded-2xl bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] hover:border-[var(--color-ares-teal)]/50 transition-all duration-300 hover:-translate-y-1 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-ares-purple)] opacity-0 group-hover:opacity-10 rounded-full blur-[50px] transition-opacity duration-500" />
              <div className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--color-ares-teal)]/10 text-[var(--color-ares-teal)] group-hover:bg-[var(--color-ares-teal)]/20 transition-colors">
                {stat.icon}
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-ares-muted)] mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold tracking-tight text-white">
                {stat.value}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-12 p-8 rounded-2xl bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] relative overflow-hidden" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 95% 100%, 0 100%)' }}>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--color-ares-teal)] mix-blend-screen opacity-10 rounded-full blur-[80px]" />
        <h3 className="text-xl font-bold uppercase tracking-widest text-[var(--color-ares-white)] mb-4">Quick Setup Guide</h3>
        <ul className="space-y-4 text-[var(--color-ares-muted)] font-light">
          <li className="flex items-start"><span className="text-[var(--color-ares-teal)] font-bold mr-3">1.</span> Register athletes at the desk or allow self sign-up.</li>
          <li className="flex items-start"><span className="text-[var(--color-ares-teal)] font-bold mr-3">2.</span> Athletes perform the NeuroTrainer Drill.</li>
          <li className="flex items-start"><span className="text-[var(--color-ares-teal)] font-bold mr-3">3.</span> Record their results in the Data Entry tab.</li>
          <li className="flex items-start"><span className="text-[var(--color-ares-teal)] font-bold mr-3">4.</span> Display the Leaderboard on a TV or large screen.</li>
        </ul>
      </div>
    </motion.div>
  );
}
