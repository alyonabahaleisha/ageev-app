import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';

export type LifeArea =
  | 'money'
  | 'confidence'
  | 'love'
  | 'calm'
  | 'career'
  | 'feminineEnergy'
  | 'relationships'
  | 'selfWorth'
  | 'fear'
  | 'body';

export type Meditation = {
  id: string;
  title: string;
  description: string;
  area: LifeArea;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
  popular?: boolean;
  coverColor?: string;
};

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} мин`;
}

export function useMeditations() {
  const [meditations, setMeditations] = useState<Meditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'meditations'), orderBy('sortOrder'));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Meditation[];
        console.log('FETCHCHECK meditations', docs.length);
        setMeditations(docs);
        prefetchImages(docs.map(d => d.coverUrl));
        setLoading(false);
      },
      err => {
        console.log('FETCHCHECK meditations ERROR', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {meditations, loading, error};
}
