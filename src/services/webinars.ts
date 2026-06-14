import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';

export type Webinar = {
  id: string;
  title: string;
  description: string;
  fileName: string;
  durationSeconds: number;
  audioUrl: string;
  coverUrl: string;
  sortOrder: number;
  popular?: boolean;
  coverColor?: string;
};

export function useWebinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'webinars'), orderBy('sortOrder'));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const docs = snapshot.docs.map(
          d => ({id: d.id, ...d.data()} as Webinar),
        );
        console.log('FETCHCHECK webinars', docs.length);
        setWebinars(docs);
        prefetchImages(docs.map(d => d.coverUrl));
        setLoading(false);
      },
      err => {
        console.log('FETCHCHECK webinars ERROR', (err as Error)?.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {webinars, loading};
}
