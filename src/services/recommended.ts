import {useEffect, useState} from 'react';
import {collection, query, where} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';
import {formatDuration} from './meditations';
import {subscribeCachedQuery} from './contentCache';

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
    // Каждый источник отмечается после первой выдачи (кэш или сеть);
    // карточки перерисовываются на каждое обновление любого из двух.
    const seen = new Set<string>();

    function merge(sourceKey: string) {
      seen.add(sourceKey);
      const all = [...medItems, ...webItems];
      setCards(all);
      prefetchImages(all.map(c => c.coverUrl));
      if (seen.size === 2) {
        setLoading(false);
      }
    }

    type RawDoc = {
      id: string;
      title?: string;
      description?: string;
      durationSeconds?: number;
      coverUrl?: string;
      audioUrl?: string;
    };
    const toCard =
      (source: RecommendedCard['source']) =>
      (d: RawDoc): RecommendedCard => ({
        id: d.id,
        source,
        title: d.title || '',
        description: d.description || '',
        durationSeconds: d.durationSeconds || 0,
        coverUrl: d.coverUrl || '',
        audioUrl: d.audioUrl || '',
      });

    const unsubMed = subscribeCachedQuery<RawDoc>(
      'recommended-meditations',
      query(collection(db, 'meditations'), where('popular', '==', true)),
      docs => {
        medItems = docs.map(toCard('meditation'));
        merge('med');
      },
      () => merge('med'),
    );

    const unsubWeb = subscribeCachedQuery<RawDoc>(
      'recommended-webinars',
      query(collection(db, 'webinars'), where('popular', '==', true)),
      docs => {
        webItems = docs.map(toCard('webinar'));
        merge('web');
      },
      () => merge('web'),
    );

    return () => {
      unsubMed();
      unsubWeb();
    };
  }, []);

  return {cards, loading};
}

export {formatDuration};
