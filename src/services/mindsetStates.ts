import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {prefetchImages} from '../components/RemoteImage';

export type ExerciseStep = {
  title: string;
  body: string;
};

export type MindsetStateExercise = {
  title: string;
  durationText: string;
  description: string;
  intro: string;
  image: string;
  stepsBackground: string;
  steps: ExerciseStep[];
  recommendations: ExerciseStep[];
};

export type MindsetStateLink = {
  title: string;
  url: string;
  image?: string;
};

export type MindsetState = {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  coverImage: string;
  sortOrder: number;
  exercise: MindsetStateExercise;
  affirmations: string[];
  affirmationsBackground: string;
  breakfastTitle: string;
  breakfastUrl: string;
  audioId: string;
  meditationIds: string[];
  webinarIds: string[];
  externalLinks: MindsetStateLink[];
};

function normalize(id: string, raw: Record<string, unknown>): MindsetState {
  const ex = (raw.exercise || {}) as Partial<MindsetStateExercise>;
  const cleanSteps = (v: unknown): ExerciseStep[] =>
    Array.isArray(v)
      ? (v as ExerciseStep[]).filter(s => s && (s.title || s.body))
      : [];
  return {
    id,
    title: (raw.title as string) || '',
    subtitle: (raw.subtitle as string) || '',
    emoji: (raw.emoji as string) || '',
    coverImage: (raw.coverImage as string) || '',
    sortOrder: (raw.sortOrder as number) ?? 99,
    exercise: {
      title: ex.title || '',
      durationText: ex.durationText || '',
      description: ex.description || '',
      intro: ex.intro || '',
      image: ex.image || '',
      stepsBackground: ex.stepsBackground || '',
      steps: cleanSteps(ex.steps),
      recommendations: cleanSteps(ex.recommendations),
    },
    affirmations: Array.isArray(raw.affirmations)
      ? (raw.affirmations as string[]).filter(t => typeof t === 'string' && t.trim())
      : [],
    affirmationsBackground: (raw.affirmationsBackground as string) || '',
    breakfastTitle: (raw.breakfastTitle as string) || '',
    breakfastUrl: (raw.breakfastUrl as string) || '',
    audioId: (raw.audioId as string) || '',
    meditationIds: Array.isArray(raw.meditationIds)
      ? (raw.meditationIds as string[])
      : [],
    webinarIds: Array.isArray(raw.webinarIds) ? (raw.webinarIds as string[]) : [],
    externalLinks: Array.isArray(raw.externalLinks)
      ? (raw.externalLinks as MindsetStateLink[]).filter(
          l => l && typeof l.url === 'string' && l.url.trim(),
        )
      : [],
  };
}

/** A state is shown in the app only once it has some content to open into. */
export function hasStateContent(s: MindsetState): boolean {
  return (
    s.affirmations.length > 0 ||
    s.meditationIds.length > 0 ||
    s.webinarIds.length > 0 ||
    s.externalLinks.length > 0 ||
    !!s.breakfastUrl ||
    !!s.exercise.title ||
    s.exercise.steps.length > 0
  );
}

export function useMindsetStates() {
  const [states, setStates] = useState<MindsetState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'mindsetStates'), orderBy('sortOrder'));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const docs = snapshot.docs.map(d => normalize(d.id, d.data()));
        console.log('FETCHCHECK mindsetStates', docs.length);
        setStates(docs);
        prefetchImages(docs.map(d => d.coverImage));
        setLoading(false);
      },
      err => {
        console.log('FETCHCHECK mindsetStates ERROR', (err as Error)?.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {states, loading};
}
