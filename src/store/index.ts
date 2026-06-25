import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Athlete, Event, Drill, Result, FollowUp } from "../types";
import { User } from "firebase/auth";

interface AppState {
  athletes: Athlete[];
  events: Event[];
  drills: Drill[];
  results: Result[];
  followUps: FollowUp[];
  currentEventId: string | null;
  user: User | null;
  authLoading: boolean;

  // Actions
  addAthlete: (athlete: Athlete) => void;
  updateAthlete: (id: string, athlete: Partial<Athlete>) => void;
  deleteAthlete: (id: string) => void;
  incrementAthleteTickets: (id: string) => void;
  addEvent: (event: Event) => void;
  setCurrentEvent: (id: string) => void;
  addDrill: (drill: Drill) => void;
  addResult: (result: Result) => void;
  deleteResult: (id: string) => void;
  clearAllResults: () => void;
  addFollowUp: (followUp: FollowUp) => void;

  // Helpers
  resetStore: () => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

const defaultDrills: Drill[] = [
  {
    id: "drill-gust",
    name: "NeuroTrainer GUST",
    platform: "NeuroTrainer",
    metricsTracked: ["Score", "Balls Blocked", "Balls Blocked Average", "Bombs Dodged", "Bombs Dodged Average", "Multiplier", "Bonus"],
  },
  {
    id: "drill-rrt",
    name: "Raw Reaction Time",
    platform: "Ares",
    metricsTracked: ["Reaction Time (ms)"],
  },
  {
    id: "drill-crt",
    name: "Choice Reaction Time",
    platform: "Ares",
    metricsTracked: ["Reaction Time (ms)", "Accuracy (%)"],
  },
  {
    id: "drill-gonogo",
    name: "Go/No-Go",
    platform: "Ares",
    metricsTracked: ["Correct Responses", "False Starts", "Reaction Time (ms)"],
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      athletes: [],
      events: [],
      drills: defaultDrills,
      results: [],
      followUps: [],
      currentEventId: null,
      user: null,
      authLoading: true,

      addAthlete: (athlete) =>
        set((state) => ({ athletes: [...state.athletes, athlete] })),
      updateAthlete: (id, updated) =>
        set((state) => ({
          athletes: state.athletes.map((a) =>
            a.id === id ? { ...a, ...updated } : a
          ),
        })),
      deleteAthlete: (id) =>
        set((state) => ({
          athletes: state.athletes.filter((a) => a.id !== id),
        })),
      incrementAthleteTickets: (id) =>
        set((state) => ({
          athletes: state.athletes.map((a) =>
            a.id === id ? { ...a, tickets: (a.tickets ?? 0) + 1 } : a
          ),
        })),
      addEvent: (event) =>
        set((state) => {
          const events = [...state.events, event];
          return { events, currentEventId: state.currentEventId || event.id };
        }),
      setCurrentEvent: (id) => set({ currentEventId: id }),
      addDrill: (drill) =>
        set((state) => ({ drills: [...state.drills, drill] })),
      addResult: (result) =>
        set((state) => ({ results: [...state.results, result] })),
      deleteResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        })),
      clearAllResults: () => set({ results: [] }),
      addFollowUp: (followUp) =>
        set((state) => ({ followUps: [...state.followUps, followUp] })),

      resetStore: () =>
        set({
          athletes: [],
          events: [],
          results: [],
          followUps: [],
          currentEventId: null,
        }),
      setUser: (user) => set({ user }),
      setAuthLoading: (authLoading) => set({ authLoading }),
    }),
    {
      name: "ares-leaderboard-storage",
      partialize: (state) => {
        const { user, authLoading, ...rest } = state;
        return rest;
      }
    }
  )
);
