import {useEffect, useState} from 'react';
import {collection, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';
import {subscribeCachedQuery} from './contentCache';

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
  /** Life-sphere key assigned in the CMS (drives the list filter chips). */
  area?: string;
  /** Сферы жизни (может быть несколько). */
  areas?: string[];
};

export function useWebinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'webinars'), orderBy('sortOrder'));
    return subscribeCachedQuery<Webinar>(
      'webinars',
      q,
      docs => {
        setWebinars(docs);
        prefetchImages(docs.map(d => d.coverUrl));
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, []);

  return {webinars, loading};
}
