import React, { useState } from "react";
import { useStore } from "../store";
import { Download, Users, ClipboardList, Trash2, RotateCcw, Edit } from "lucide-react";
import { exportToCSV } from "../lib/utils";
import { deleteResultFromFirebase, clearAllResultsFromFirebase, deleteAthleteFromFirebase, updateAthleteInFirebase } from "../lib/firebase-sync";
import { Athlete } from "../types";

export function Admin() {
  const { athletes, results, drills, deleteResult, clearAllResults, deleteAthlete, updateAthlete } = useStore();
  const [activeTab, setActiveTab] = useState<"athletes" | "results">("athletes");
  const [showClearModal, setShowClearModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Athlete>>({});

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setEditFormData({
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      email: athlete.email,
      phone: athlete.phone,
      sport: athlete.sport,
      level: athlete.level,
      position: athlete.position,
      team: athlete.team,
    });
  };

  const handleSaveAthleteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAthlete) return;
    updateAthlete(editingAthlete.id, editFormData);
    await updateAthleteInFirebase(editingAthlete.id, editFormData);
    setEditingAthlete(null);
  };

  const handleExportAthletes = () => {
    const data = athletes.map(a => ({
      ID: a.id,
      FirstName: a.firstName,
      LastName: a.lastName,
      Email: a.email,
      Phone: a.phone,
      DOB: a.dateOfBirth,
      Age: a.age,
      Sport: a.sport,
      Position: a.position,
      Team: a.team,
      ParentName: a.parentGuardianName || "",
      ParentEmail: a.parentGuardianEmail || "",
      ParentPhone: a.parentGuardianPhone || "",
      Consent: a.consentAccepted ? "Yes" : "No",
      RegisteredAt: a.createdAt
    }));
    exportToCSV("athletes_export.csv", data);
  };

  const handleExportResults = () => {
    const data = results.map(r => {
      const athlete = athletes.find(a => a.id === r.athleteId);
      const drill = drills.find(d => d.id === r.drillId);
      return {
        ResultID: r.id,
        Date: r.createdAt,
        AthleteFirstName: athlete?.firstName || "Unknown",
        AthleteLastName: athlete?.lastName || "Unknown",
        AthleteEmail: athlete?.email || "",
        Team: athlete?.team || "",
        DrillName: drill?.name || "Unknown",
        TrialNum: r.trialNumber,
        Score: r.score ?? r.compositeScore ?? 0,
        BallsBlocked: r.ballsBlocked || 0,
        BallsBlockedAvg: r.ballsBlockedAverage || 0,
        BombsDodged: r.bombsDodged || 0,
        BombsDodgedAvg: r.bombsDodgedAverage || 0,
        Multiplier: r.multiplier || 0,
        Bonus: r.bonus || 0,
      };
    });
    exportToCSV("results_export.csv", data);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--color-ares-white)] mb-1">Admin Dashboard</h2>
          <p className="text-[var(--color-ares-muted)] text-sm">Manage data, edit results, and export contact lists.</p>
        </div>
        
        <button onClick={() => setShowClearModal(true)} className="flex items-center gap-2 px-6 py-2 bg-red-500/10 text-red-400 border border-red-500/30 font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-red-500 hover:text-white transition-all self-start md:self-auto">
          <RotateCcw size={16} /> Reset Event Data
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-ares-charcoal)] p-6 rounded-2xl border border-[var(--color-ares-dark-purple)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[var(--color-ares-purple)]/10 rounded-xl text-[var(--color-ares-purple)]">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white uppercase tracking-tight">Athlete Data</h3>
              <p className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">{athletes.length} Registered</p>
            </div>
          </div>
          <button onClick={handleExportAthletes} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[var(--color-ares-teal)] hover:border-[var(--color-ares-teal)] transition-all">
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="bg-[var(--color-ares-charcoal)] p-6 rounded-2xl border border-[var(--color-ares-dark-purple)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[var(--color-ares-teal)]/10 rounded-xl text-[var(--color-ares-teal)]">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white uppercase tracking-tight">Drill Results</h3>
              <p className="text-[10px] text-[var(--color-ares-muted)] uppercase tracking-widest">{results.length} Recorded</p>
            </div>
          </div>
          <button onClick={handleExportResults} className="w-full flex items-center justify-center gap-2 py-3 bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-[var(--color-ares-teal)] hover:border-[var(--color-ares-teal)] transition-all">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-ares-dark-purple)] flex gap-8">
        <button 
          onClick={() => setActiveTab("athletes")} 
          className={`pb-4 uppercase tracking-widest text-sm font-bold transition-colors border-b-2 ${activeTab === 'athletes' ? 'text-[var(--color-ares-teal)] border-[var(--color-ares-teal)]' : 'text-[var(--color-ares-muted)] border-transparent hover:text-white'}`}
        >
          Athletes Database
        </button>
        <button 
          onClick={() => setActiveTab("results")} 
          className={`pb-4 uppercase tracking-widest text-sm font-bold transition-colors border-b-2 ${activeTab === 'results' ? 'text-[var(--color-ares-teal)] border-[var(--color-ares-teal)]' : 'text-[var(--color-ares-muted)] border-transparent hover:text-white'}`}
        >
          Results Management
        </button>
      </div>

      {/* Content */}
      <div className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] rounded-2xl overflow-hidden">
        {activeTab === "results" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-ares-bg)] text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)]">
                <tr>
                  <th className="px-6 py-4 font-bold">Athlete</th>
                  <th className="px-6 py-4 font-bold">Blks / Bombs</th>
                  <th className="px-6 py-4 font-bold">Score</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ares-dark-purple)]">
                {results.map(r => {
                  const athlete = athletes.find(a => a.id === r.athleteId);
                  return (
                    <tr key={r.id} className="hover:bg-[var(--color-ares-bg)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{athlete?.firstName} {athlete?.lastName}</p>
                        <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">{new Date(r.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-[var(--color-ares-muted)]">
                        {r.ballsBlocked || 0} / {r.bombsDodged || 0}
                      </td>
                      <td className="px-6 py-4 font-bold text-[var(--color-ares-teal)]">
                        {r.score ?? r.compositeScore ?? 0}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => {
                          if(window.confirm('Delete this result?')) {
                            deleteResult(r.id);
                            deleteResultFromFirebase(r.id);
                          }
                        }} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-ares-bg)] text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)]">
                <tr>
                  <th className="px-6 py-4 font-bold">Name</th>
                  <th className="px-6 py-4 font-bold">Sport & Level</th>
                  <th className="px-6 py-4 font-bold">Team</th>
                  <th className="px-6 py-4 font-bold">Contact</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-ares-dark-purple)]">
                {athletes.map(a => (
                  <tr key={a.id} className="hover:bg-[var(--color-ares-bg)]/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white uppercase tracking-tight">{a.firstName} {a.lastName}</p>
                      <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">Age: {a.age}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white">{a.sport}</p>
                      <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">{a.level || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{a.team}</p>
                      <p className="text-[10px] text-[var(--color-ares-muted)] uppercase">{a.position}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[var(--color-ares-muted)] font-mono text-xs">{a.email}</p>
                      {a.age < 18 && (
                        <p className="text-[10px] text-[var(--color-ares-purple)] uppercase mt-1">Parent: {a.parentGuardianPhone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEditAthlete(a)} className="p-2 text-[var(--color-ares-teal)] hover:bg-[var(--color-ares-teal)]/10 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => {
                          if(window.confirm(`Delete athlete ${a.firstName} ${a.lastName} and all their results?`)) {
                            deleteAthlete(a.id);
                            deleteAthleteFromFirebase(a.id);
                            results.filter(r => r.athleteId === a.id).forEach(r => {
                              deleteResult(r.id);
                              deleteResultFromFirebase(r.id);
                            });
                          }
                        }} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showClearModal && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-ares-charcoal)] border border-red-500/50 p-8 rounded-2xl max-w-md w-full font-sans shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-[50px] pointer-events-none rounded-full" />
            
            <RotateCcw className="text-red-400 mb-4" size={32} />
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Reset Event Data?</h3>
            <p className="text-sm text-[var(--color-ares-muted)] mb-8 leading-relaxed">
              This will permanently delete all recorded NeuroTrainer GUST drill results. Athlete profiles and registrations will be kept intact, allowing for rapid event transitions. This action cannot be undone.
            </p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowClearModal(false)} 
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => { 
                  clearAllResults(); 
                  try {
                    await clearAllResultsFromFirebase();
                  } catch (err) {
                    console.error("Error resetting data:", err);
                  }
                  setShowClearModal(false); 
                }} 
                className="flex-1 py-3 bg-red-500/10 text-red-400 rounded-xl font-bold uppercase tracking-widest text-xs border border-red-500/30 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} /> Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {editingAthlete && (
        <div className="fixed inset-0 bg-[var(--color-ares-bg)]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveAthleteEdit} className="bg-[var(--color-ares-charcoal)] border border-[var(--color-ares-dark-purple)] p-8 rounded-2xl max-w-lg w-full font-sans shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Edit Athlete Profile</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">First Name</label>
                <input required type="text" value={editFormData.firstName || ""} onChange={e => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Last Name</label>
                <input required type="text" value={editFormData.lastName || ""} onChange={e => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Email</label>
                <input required type="email" value={editFormData.email || ""} onChange={e => setEditFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Phone</label>
                <input required type="tel" value={editFormData.phone || ""} onChange={e => setEditFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Sport</label>
                <input required type="text" value={editFormData.sport || ""} onChange={e => setEditFormData(prev => ({ ...prev, sport: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Level</label>
                <input required type="text" value={editFormData.level || ""} onChange={e => setEditFormData(prev => ({ ...prev, level: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Team</label>
                <input required type="text" value={editFormData.team || ""} onChange={e => setEditFormData(prev => ({ ...prev, team: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--color-ares-muted)] block mb-1">Position</label>
                <input required type="text" value={editFormData.position || ""} onChange={e => setEditFormData(prev => ({ ...prev, position: e.target.value }))} className="w-full bg-[var(--color-ares-bg)] border border-[var(--color-ares-dark-purple)] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[var(--color-ares-teal)] text-sm" />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4 border-t border-[var(--color-ares-dark-purple)]">
              <button 
                type="button"
                onClick={() => setEditingAthlete(null)} 
                className="flex-1 py-3 bg-[var(--color-ares-bg)] text-white rounded-xl font-bold uppercase tracking-widest text-xs border border-[var(--color-ares-dark-purple)] hover:bg-[var(--color-ares-dark-purple)] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-3 bg-[var(--color-ares-teal)] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-opacity-95 transition-colors flex items-center justify-center gap-2"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
