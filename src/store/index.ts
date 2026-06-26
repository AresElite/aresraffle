import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Athlete, Result, Drill, FollowUp,
  Event, EventDay, Lead, EventLead, Prize, RaffleEntry, RaffleDraw, LeaderboardEntry, EmailSequence, EmailMessage, EmailLog
} from "../types";
import { User } from "firebase/auth";

interface AppState {
  athletes: Athlete[];
  events: Event[];
  eventDays: EventDay[];
  leads: Lead[];
  eventLeads: EventLead[];
  prizes: Prize[];
  raffleEntries: RaffleEntry[];
  raffleDraws: RaffleDraw[];
  leaderboardEntries: LeaderboardEntry[];
  emailSequences: EmailSequence[];
  emailMessages: EmailMessage[];
  emailLogs: EmailLog[];
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
  addResult: (result: Result) => void;
  deleteResult: (id: string) => void;
  clearAllResults: () => void;
  addFollowUp: (followUp: FollowUp) => void;

  // New Actions
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setCurrentEvent: (id: string | null) => void;

  addEventDay: (day: EventDay) => void;
  updateEventDay: (id: string, day: Partial<EventDay>) => void;

  addLead: (lead: Lead) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;

  addEventLead: (el: EventLead) => void;
  updateEventLead: (id: string, el: Partial<EventLead>) => void;

  addPrize: (prize: Prize) => void;
  updatePrize: (id: string, prize: Partial<Prize>) => void;

  addRaffleEntry: (re: RaffleEntry) => void;
  updateRaffleEntry: (id: string, re: Partial<RaffleEntry>) => void;

  addRaffleDraw: (draw: RaffleDraw) => void;
  deleteRaffleDraw: (id: string) => void;

  addLeaderboardEntry: (le: LeaderboardEntry) => void;
  updateLeaderboardEntry: (id: string, le: Partial<LeaderboardEntry>) => void;

  addEmailSequence: (seq: EmailSequence) => void;
  updateEmailSequence: (id: string, seq: Partial<EmailSequence>) => void;

  addEmailMessage: (msg: EmailMessage) => void;
  updateEmailMessage: (id: string, msg: Partial<EmailMessage>) => void;

  addEmailLog: (log: EmailLog) => void;
  updateEmailLog: (id: string, log: Partial<EmailLog>) => void;

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
      eventDays: [],
      leads: [],
      eventLeads: [],
      prizes: [],
      raffleEntries: [],
      raffleDraws: [],
      leaderboardEntries: [],
      emailSequences: [],
      emailMessages: [],
      emailLogs: [],
      drills: defaultDrills,
      results: [],
      followUps: [],
      currentEventId: null,
      user: null,
      authLoading: true,

      // Legacy Actions
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
      addResult: (result) =>
        set((state) => ({ results: [...state.results, result] })),
      deleteResult: (id) =>
        set((state) => ({
          results: state.results.filter((r) => r.id !== id),
        })),
      clearAllResults: () => set({ results: [] }),
      addFollowUp: (followUp) =>
        set((state) => ({ followUps: [...state.followUps, followUp] })),

      // New Actions
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events.filter(e => e.id !== event.id), event],
          currentEventId: state.currentEventId || event.id
        })),
      updateEvent: (id, updated) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, ...updated } : e
          ),
        })),
      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
          currentEventId: state.currentEventId === id ? (state.events.find(e => e.id !== id)?.id || null) : state.currentEventId
        })),
      setCurrentEvent: (id) => set({ currentEventId: id }),

      addEventDay: (day) =>
        set((state) => ({ eventDays: [...state.eventDays.filter(d => d.id !== day.id), day] })),
      updateEventDay: (id, updated) =>
        set((state) => ({
          eventDays: state.eventDays.map((d) =>
            d.id === id ? { ...d, ...updated } : d
          ),
        })),

      addLead: (lead) =>
        set((state) => ({ leads: [...state.leads.filter(l => l.id !== lead.id), lead] })),
      updateLead: (id, updated) =>
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updated } : l
          ),
        })),

      addEventLead: (el) =>
        set((state) => ({ eventLeads: [...state.eventLeads.filter(l => l.id !== el.id), el] })),
      updateEventLead: (id, updated) =>
        set((state) => ({
          eventLeads: state.eventLeads.map((el) =>
            el.id === id ? { ...el, ...updated } : el
          ),
        })),

      addPrize: (prize) =>
        set((state) => ({ prizes: [...state.prizes.filter(p => p.id !== prize.id), prize] })),
      updatePrize: (id, updated) =>
        set((state) => ({
          prizes: state.prizes.map((p) =>
            p.id === id ? { ...p, ...updated } : p
          ),
        })),

      addRaffleEntry: (re) =>
        set((state) => ({ raffleEntries: [...state.raffleEntries.filter(e => e.id !== re.id), re] })),
      updateRaffleEntry: (id, updated) =>
        set((state) => ({
          raffleEntries: state.raffleEntries.map((re) =>
            re.id === id ? { ...re, ...updated } : re
          ),
        })),

      addRaffleDraw: (draw) =>
        set((state) => ({ raffleDraws: [...state.raffleDraws.filter(d => d.id !== draw.id), draw] })),
      deleteRaffleDraw: (id) =>
        set((state) => ({ raffleDraws: state.raffleDraws.filter((d) => d.id !== id) })),

      addLeaderboardEntry: (le) =>
        set((state) => ({ leaderboardEntries: [...state.leaderboardEntries.filter(e => e.id !== le.id), le] })),
      updateLeaderboardEntry: (id, updated) =>
        set((state) => ({
          leaderboardEntries: state.leaderboardEntries.map((le) =>
            le.id === id ? { ...le, ...updated } : le
          ),
        })),

      addEmailSequence: (seq) =>
        set((state) => ({ emailSequences: [...state.emailSequences.filter(s => s.id !== seq.id), seq] })),
      updateEmailSequence: (id, updated) =>
        set((state) => ({
          emailSequences: state.emailSequences.map((s) =>
            s.id === id ? { ...s, ...updated } : s
          ),
        })),

      addEmailMessage: (msg) =>
        set((state) => ({ emailMessages: [...state.emailMessages.filter(m => m.id !== msg.id), msg] })),
      updateEmailMessage: (id, updated) =>
        set((state) => ({
          emailMessages: state.emailMessages.map((m) =>
            m.id === id ? { ...m, ...updated } : m
          ),
        })),

      addEmailLog: (log) =>
        set((state) => ({ emailLogs: [...state.emailLogs.filter(l => l.id !== log.id), log] })),
      updateEmailLog: (id, updated) =>
        set((state) => ({
          emailLogs: state.emailLogs.map((l) =>
            l.id === id ? { ...l, ...updated } : l
          ),
        })),

      resetStore: () =>
        set({
          athletes: [],
          events: [],
          eventDays: [],
          leads: [],
          eventLeads: [],
          prizes: [],
          raffleEntries: [],
          raffleDraws: [],
          leaderboardEntries: [],
          emailSequences: [],
          emailMessages: [],
          emailLogs: [],
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
