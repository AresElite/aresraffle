import { useEffect } from 'react';
import { useStore } from '../store';
import {
  collection, onSnapshot, doc, setDoc, deleteDoc,
  writeBatch, getDocs, updateDoc, increment
} from 'firebase/firestore';
import { db } from './firebase';
import { Athlete, Result } from '../types';

export function useFirebaseSync() {
  useEffect(() => {
    const unsubscribeAthletes = onSnapshot(collection(db, 'athletes'), (snapshot) => {
      const athletes = snapshot.docs.map(d => d.data() as Athlete);
      useStore.setState({ athletes });
    });

    const unsubscribeResults = onSnapshot(collection(db, 'results'), (snapshot) => {
      const results = snapshot.docs.map(d => d.data() as Result);
      useStore.setState({ results });
    });

    return () => {
      unsubscribeAthletes();
      unsubscribeResults();
    };
  }, []);
}

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

/** Atomically increments the ticket count for an athlete in Firestore */
export const incrementAthleteTicketsInFirebase = async (id: string) => {
  await updateDoc(doc(db, 'athletes', id), { tickets: increment(1) });
};
