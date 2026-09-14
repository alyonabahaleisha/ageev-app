import {useEffect, useState} from 'react';
import {collection, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';
import {subscribeCachedQuery} from './contentCache';

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
  /** Легаси-поле (первая сфера); актуальный список — в `areas`. */
  area: LifeArea;
  /** Сферы жизни (может быть несколько). */
  areas?: string[];
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
    return subscribeCachedQuery<Meditation>(
      'meditations',
      q,
      docs => {
        setMeditations(docs);
        prefetchImages(docs.map(d => d.coverUrl));
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

  return {meditations, loading, error};
}
