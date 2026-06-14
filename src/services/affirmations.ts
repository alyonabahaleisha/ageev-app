import {useEffect, useState} from 'react';
import {collection, onSnapshot} from 'firebase/firestore';
import {db} from '../lib/firebase';

// In Firestore, each document in `affirmations` is a category: the doc id is
// the category key (same keys as meditation LifeArea) and the only field is
// `texts: string[]` — the affirmations for that category. We flatten those
// into individual items for the pager.
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

export type Affirmation = {
  id: string;
  text: string;
  category: string; // category key, e.g. 'calm'
  categoryLabel: string; // localized chip label, e.g. 'Спокойствие'
};

export function useAffirmations() {
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Known categories first (in our defined order), then any extras.
        const knownKeys = AFFIRMATION_CATEGORIES.map(c => c.key);
        const orderedKeys = [
          ...knownKeys.filter(k => byKey[k]?.length),
          ...Object.keys(byKey).filter(
            k => !knownKeys.includes(k) && byKey[k].length,
          ),
        ];

        const flat: Affirmation[] = [];
        orderedKeys.forEach(key => {
          byKey[key].forEach((text, i) => {
            flat.push({
              id: `${key}-${i}`,
              text,
              category: key,
              categoryLabel: LABEL_BY_KEY[key] ?? key,
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
  }, []);

  return {affirmations, loading, error};
}
