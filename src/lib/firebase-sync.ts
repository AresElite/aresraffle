import { useEffect } from 'react';
import { useStore } from '../store';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  writeBatch, getDocs, updateDoc, increment
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Athlete, Result,
  Event, EventDay, Lead, EventLead, Prize, RaffleEntry, RaffleDraw, LeaderboardEntry, EmailSequence, EmailMessage, EmailLog
} from '../types';

export function useFirebaseSync() {
  useEffect(() => {
    const unsubscribes = [
      onSnapshot(collection(db, 'athletes'), (snapshot) => {
        const athletes = snapshot.docs.map(d => d.data() as Athlete);
        useStore.setState({ athletes });
      }),
      onSnapshot(collection(db, 'results'), (snapshot) => {
        const results = snapshot.docs.map(d => d.data() as Result);
        useStore.setState({ results });
      }),
      onSnapshot(collection(db, 'events'), (snapshot) => {
        const events = snapshot.docs.map(d => d.data() as Event);
        useStore.setState({ events });
      }),
      onSnapshot(collection(db, 'eventDays'), (snapshot) => {
        const eventDays = snapshot.docs.map(d => d.data() as EventDay);
        useStore.setState({ eventDays });
      }),
      onSnapshot(collection(db, 'leads'), (snapshot) => {
        const leads = snapshot.docs.map(d => d.data() as Lead);
        useStore.setState({ leads });
      }),
      onSnapshot(collection(db, 'eventLeads'), (snapshot) => {
        const eventLeads = snapshot.docs.map(d => d.data() as EventLead);
        useStore.setState({ eventLeads });
      }),
      onSnapshot(collection(db, 'prizes'), (snapshot) => {
        const prizes = snapshot.docs.map(d => d.data() as Prize);
        useStore.setState({ prizes });
      }),
      onSnapshot(collection(db, 'raffleEntries'), (snapshot) => {
        const raffleEntries = snapshot.docs.map(d => d.data() as RaffleEntry);
        useStore.setState({ raffleEntries });
      }),
      onSnapshot(collection(db, 'raffleDraws'), (snapshot) => {
        const raffleDraws = snapshot.docs.map(d => d.data() as RaffleDraw);
        useStore.setState({ raffleDraws });
      }),
      onSnapshot(collection(db, 'leaderboardEntries'), (snapshot) => {
        const leaderboardEntries = snapshot.docs.map(d => d.data() as LeaderboardEntry);
        useStore.setState({ leaderboardEntries });
      }),
      onSnapshot(collection(db, 'emailSequences'), (snapshot) => {
        const emailSequences = snapshot.docs.map(d => d.data() as EmailSequence);
        useStore.setState({ emailSequences });
      }),
      onSnapshot(collection(db, 'emailMessages'), (snapshot) => {
        const emailMessages = snapshot.docs.map(d => d.data() as EmailMessage);
        useStore.setState({ emailMessages });
      }),
      onSnapshot(collection(db, 'emailLogs'), (snapshot) => {
        const emailLogs = snapshot.docs.map(d => d.data() as EmailLog);
        useStore.setState({ emailLogs });
      }),
    ];

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);
}

// ─── Legacy Firebase Sync Functions ───────────────────────────────────────────
export const syncAthleteToFirebase = async (athlete: Athlete) => {
  await setDoc(doc(db, 'athletes', athlete.id), athlete);
};
export const syncResultToFirebase = async (result: Result) => {
  await setDoc(doc(db, 'results', result.id), result);
};
export const deleteResultFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'results', id));
};
export const clearAllResultsFromFirebase = async () => {
  const querySnapshot = await getDocs(collection(db, 'results'));
  const batch = writeBatch(db);
  querySnapshot.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
};
export const deleteAthleteFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'athletes', id));
};
export const updateAthleteInFirebase = async (id: string, updated: Partial<Athlete>) => {
  await setDoc(doc(db, 'athletes', id), updated, { merge: true });
};
export const incrementAthleteTicketsInFirebase = async (id: string) => {
  await updateDoc(doc(db, 'athletes', id), { tickets: increment(1) });
};

// ─── New Event-Isolated Sync Functions ────────────────────────────────────────

export const syncEventToFirebase = async (event: Event) => {
  await setDoc(doc(db, 'events', event.id), event);
};
export const deleteEventFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'events', id));
};

export const syncEventDayToFirebase = async (day: EventDay) => {
  await setDoc(doc(db, 'eventDays', day.id), day);
};

export const syncLeadToFirebase = async (lead: Lead) => {
  await setDoc(doc(db, 'leads', lead.id), lead);
};

export const syncEventLeadToFirebase = async (el: EventLead) => {
  await setDoc(doc(db, 'eventLeads', el.id), el);
};

export const syncPrizeToFirebase = async (prize: Prize) => {
  await setDoc(doc(db, 'prizes', prize.id), prize);
};
export const deletePrizeFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'prizes', id));
};

export const syncRaffleEntryToFirebase = async (re: RaffleEntry) => {
  await setDoc(doc(db, 'raffleEntries', re.id), re);
};

export const syncRaffleDrawToFirebase = async (draw: RaffleDraw) => {
  await setDoc(doc(db, 'raffleDraws', draw.id), draw);
};
export const deleteRaffleDrawFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'raffleDraws', id));
};

export const syncLeaderboardEntryToFirebase = async (le: LeaderboardEntry) => {
  await setDoc(doc(db, 'leaderboardEntries', le.id), le);
};
export const deleteLeaderboardEntryFromFirebase = async (id: string) => {
  await deleteDoc(doc(db, 'leaderboardEntries', id));
};

export const syncEmailSequenceToFirebase = async (seq: EmailSequence) => {
  await setDoc(doc(db, 'emailSequences', seq.id), seq);
};

export const syncEmailMessageToFirebase = async (msg: EmailMessage) => {
  await setDoc(doc(db, 'emailMessages', msg.id), msg);
};

export const syncEmailLogToFirebase = async (log: EmailLog) => {
  await setDoc(doc(db, 'emailLogs', log.id), log);
};
