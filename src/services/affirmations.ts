import {useEffect, useState} from 'react';
import {collection, onSnapshot} from 'firebase/firestore';
import {db} from '../lib/firebase';

// In Firestore, each document in `affirmations` is a category: the doc id is
// the category key (same keys as meditation LifeArea) and the only field is
// `texts: string[]` — the affirmations for that category. We flatten those
// into individual items for the pager. Category labels come live from the
// CMS `lifeAreas` collection (the «Сферы жизни» admin section), with these
// built-ins as fallback for areas not configured there.
export const AFFIRMATION_CATEGORIES: {key: string; label: string}[] = [
  {key: 'calm', label: 'Спокойствие'},
  {key: 'fear', label: 'Тревога'},
  {key: 'love', label: 'Любовь'},
  {key: 'money', label: 'Изобилие'},
  {key: 'confidence', label: 'Уверенность'},
  {key: 'selfWorth', label: 'Самоценность'},
  {key: 'relationships', label: 'Отношения'},
  {key: 'feminineEnergy', label: 'Женская энергия'},
  {key: 'career', label: 'Карьера'},
  {key: 'body', label: 'Здоровье'},
];

const LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  AFFIRMATION_CATEGORIES.map(c => [c.key, c.label]),
);

type AreaDoc = {label?: string; sortOrder?: number};

export type Affirmation = {
  id: string;
  text: string;
  category: string; // category key, e.g. 'calm'
  categoryLabel: string; // localized chip label, e.g. 'Спокойствие'
};

/** Index of today's "мысль на сегодня" — rotates once per calendar day.
 *  Shared by the home card and the affirmations pager so both show the
 *  same affirmation. */
export function dailyAffirmationIndex(count: number): number {
  if (count <= 0) {
    return 0;
  }
  return Math.floor(Date.now() / 86400000) % count;
}

export function useAffirmations() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Record<string, AreaDoc>>({});

  // Названия и порядок сфер — из CMS, чтобы переименования в разделе
  // «Сферы жизни» сразу отражались на чипах категорий.
  useEffect(
    () =>
      onSnapshot(
        collection(db, 'lifeAreas'),
        snap => {
          const m: Record<string, AreaDoc> = {};
          snap.docs.forEach(d => {
            m[d.id] = d.data() as AreaDoc;
          });
          setAreas(m);
        },
        () => {},
      ),
    [],
  );

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'affirmations'),
      snapshot => {
        const byKey: Record<string, string[]> = {};
        snapshot.docs.forEach(d => {
          const texts = (d.data() as {texts?: unknown}).texts;
          if (Array.isArray(texts)) {
            byKey[d.id] = texts.filter(
              (t): t is string => typeof t === 'string' && t.trim().length > 0,
            );
          }
        });

        // CMS sortOrder first; known built-ins keep their defined order as a
        // tiebreaker, unknown extras go last.
        const knownKeys = AFFIRMATION_CATEGORIES.map(c => c.key);
        const orderedKeys = Object.keys(byKey)
          .filter(k => byKey[k].length)
          .sort((a, b) => {
            const fallback = (k: string) => {
              const i = knownKeys.indexOf(k);
              return i >= 0 ? 500 + i : 900;
            };
            const sa = areas[a]?.sortOrder ?? fallback(a);
            const sb = areas[b]?.sortOrder ?? fallback(b);
            return sa - sb;
          });

        const flat: Affirmation[] = [];
        orderedKeys.forEach(key => {
          byKey[key].forEach((text, i) => {
            flat.push({
              id: `${key}-${i}`,
              text,
              category: key,
              categoryLabel: areas[key]?.label || LABEL_BY_KEY[key] || key,
            });
          });
        });

        setAffirmations(flat);
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [areas]);

  return {affirmations, loading, error};
}
