import {useEffect, useState} from 'react';
import {collection, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';
import {subscribeCachedQuery} from './contentCache';

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
  /** Сферы жизни (может быть несколько). */
  areas?: string[];
};

export function useBreakfasts() {
  const [breakfasts, setBreakfasts] = useState<Breakfast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'breakfasts'), orderBy('sortOrder'));
    return subscribeCachedQuery<Breakfast>(
      'breakfasts',
      q,
      docs => {
        setBreakfasts(docs);
        prefetchImages(docs.map(d => d.coverUrl).filter(Boolean));
        setLoading(false);
        setError(null);
      },
      (message, hasData) => {
        if (!hasData) {
          setError(message);
        }
        setLoading(false);
      },
    );
  }, []);

  return {breakfasts, loading, error};
}
