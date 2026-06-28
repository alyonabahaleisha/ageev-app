import {useEffect, useState} from 'react';
import {doc, getDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {PlayerTrack} from '../context/PlayerContext';

// Admin-curated daily stories. The CMS schedules one document per day in
// `dailyStories` (id = "YYYY-MM-DD") that references items from the content
// pools (storyPhotos, storyQuotes, breakfasts, storyAffirmations). This hook
// resolves today's document into ready-to-render content; any field left
// unconfigured falls back to the bundled defaults in StorySlides.

type DailyStoryDoc = {
  photoId?: string;
  quoteId?: string;
  breakfastId?: string;
  affirmationId?: string;
  // An inline affirmation picked from the app's existing library (no background).
  affirmationText?: string;
};

export type StoryContent = {
  // Reel 1 — photo of Mikhail + quote.
  quote: {photoUrl?: string; text?: string; author?: string};
  // Reel 2 — "Духовный завтрак" audio practice.
  breakfast: {backgroundUrl?: string; body?: string; track?: PlayerTrack};
  // Reel 3 — affirmation of the day.
  affirmation: {backgroundUrl?: string; text?: string};
};

function todayKey(): string {
  const t = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

async function getData(id: string, col: string) {
  const snap = await getDoc(doc(db, col, id));
  return snap.exists() ? (snap.data() as Record<string, unknown>) : null;
}

export function useDailyStory(): {content: StoryContent | null; loading: boolean} {
  const [content, setContent] = useState<StoryContent | null>(null);
  const [loading, setLoading] = useState(true);
  const dateKey = todayKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const daySnap = await getDoc(doc(db, 'dailyStories', dateKey));
        if (!daySnap.exists()) {
          if (!cancelled) {
            setContent(null);
            setLoading(false);
          }
          return;
        }
        const day = daySnap.data() as DailyStoryDoc;
        const [photo, quote, breakfast, aff] = await Promise.all([
          day.photoId ? getData(day.photoId, 'storyPhotos') : null,
          day.quoteId ? getData(day.quoteId, 'storyQuotes') : null,
          day.breakfastId ? getData(day.breakfastId, 'breakfasts') : null,
          day.affirmationId ? getData(day.affirmationId, 'storyAffirmations') : null,
        ]);

        const track: PlayerTrack | undefined =
          breakfast && typeof breakfast.audioUrl === 'string' && breakfast.audioUrl
            ? {
                id: `breakfast_${dateKey}`,
                title: (breakfast.title as string) || 'Духовный завтрак',
                description: (breakfast.description as string) || '',
                audioUrl: breakfast.audioUrl as string,
                coverUrl: (breakfast.coverUrl as string) || '',
                durationSeconds: (breakfast.durationSeconds as number) || 0,
              }
            : undefined;

        const resolved: StoryContent = {
          quote: {
            photoUrl: (photo?.imageUrl as string) || undefined,
            text: (quote?.text as string) || undefined,
            author: (quote?.author as string) || undefined,
          },
          breakfast: {
            backgroundUrl: (breakfast?.coverUrl as string) || undefined,
            body: (breakfast?.description as string) || undefined,
            track,
          },
          affirmation: {
            backgroundUrl: (aff?.background as string) || undefined,
            // Pool item's text, else the inline text chosen from the library.
            text: (aff?.text as string) || day.affirmationText || undefined,
          },
        };

        if (!cancelled) {
          setContent(resolved);
          setLoading(false);
        }
      } catch (e) {
        console.log('FETCHCHECK dailyStories ERROR', (e as Error)?.message);
        if (!cancelled) {
          setContent(null);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  return {content, loading};
}
