import {useEffect, useState} from 'react';
import {collection, onSnapshot, query, where} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';
import {formatDuration} from './meditations';

export type RecommendedCard = {
  id: string;
  title: string;
  description: string;
  durationSeconds: number;
  coverUrl: string;
  audioUrl: string;
  source: 'meditation' | 'webinar';
};

export function useRecommended() {
  const [cards, setCards] = useState<RecommendedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let medItems: RecommendedCard[] = [];
    let webItems: RecommendedCard[] = [];
    let resolved = 0;

    function merge() {
      resolved++;
      if (resolved === 2) {
        const all = [...medItems, ...webItems];
        setCards(all);
        prefetchImages(all.map(c => c.coverUrl));
        setLoading(false);
      }
    }

    const unsubMed = onSnapshot(
      query(collection(db, 'meditations'), where('popular', '==', true)),
      snap => {
        medItems = snap.docs.map(d => ({
          id: d.id,
          source: 'meditation' as const,
          title: d.data().title,
          description: d.data().description || '',
          durationSeconds: d.data().durationSeconds || 0,
          coverUrl: d.data().coverUrl || '',
          audioUrl: d.data().audioUrl || '',
        }));
        merge();
      },
      () => merge(),
    );

    const unsubWeb = onSnapshot(
      query(collection(db, 'webinars'), where('popular', '==', true)),
      snap => {
        webItems = snap.docs.map(d => ({
          id: d.id,
          source: 'webinar' as const,
          title: d.data().title,
          description: d.data().description || '',
          durationSeconds: d.data().durationSeconds || 0,
          coverUrl: d.data().coverUrl || '',
          audioUrl: d.data().audioUrl || '',
        }));
        merge();
      },
      () => merge(),
    );

    return () => {
      unsubMed();
      unsubWeb();
    };
  }, []);

  return {cards, loading};
}

export {formatDuration};
