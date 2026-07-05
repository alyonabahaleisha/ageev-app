import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';

export type Breakfast = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
  area?: string;
};

export function useBreakfasts() {
  const [breakfasts, setBreakfasts] = useState<Breakfast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'breakfasts'), orderBy('sortOrder'));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Breakfast[];
        console.log('FETCHCHECK breakfasts', docs.length);
        setBreakfasts(docs);
        prefetchImages(docs.map(d => d.coverUrl).filter(Boolean));
        setLoading(false);
      },
      err => {
        console.log('FETCHCHECK breakfasts ERROR', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {breakfasts, loading, error};
}
