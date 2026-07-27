import {doc, getDoc} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {PlayerTrack} from '../context/PlayerContext';
import {uiString} from './uiStrings';

// Диплинки на контент: https://mikhail-app.web.app/l/<type>/<id> (universal
// link + страница-редирект для тех, у кого нет приложения) и ageev://<type>/<id>
// (кастомная схема — на неё редиректит страница). Оба формата парсятся здесь.

export type DeepLinkType =
  | 'affirmation'
  | 'meditation'
  | 'webinar'
  | 'breakfast';

export type DeepLink = {type: DeepLinkType; id: string};

const LINK_RE =
  /(?:^ageev:\/\/|\/l\/)(affirmation|meditation|webinar|breakfast)\/([^/?#]+)/;

export function parseDeepLink(url: string): DeepLink | null {
  const m = url.match(LINK_RE);
  if (!m) return null;
  try {
    return {type: m[1] as DeepLinkType, id: decodeURIComponent(m[2])};
  } catch {
    return null;
  }
}

export function buildShareLink(type: DeepLinkType, id: string): string {
  const base = uiString('share_link_base', 'https://mikhail-app.web.app/l');
  return `${base}/${type}/${encodeURIComponent(id)}`;
}

const COLLECTION_BY_TYPE: Record<string, string> = {
  meditation: 'meditations',
  webinar: 'webinars',
  breakfast: 'breakfasts',
};

/** Аудио-контент по диплинку → трек для плеера (null, если не найден). */
export async function fetchTrackForLink(
  link: DeepLink,
): Promise<PlayerTrack | null> {
  const coll = COLLECTION_BY_TYPE[link.type];
  if (!coll) return null;
  const snap = await getDoc(doc(db, coll, link.id));
  if (!snap.exists()) return null;
  const d = snap.data() as {
    title?: string;
    description?: string;
    audioUrl?: string;
    coverUrl?: string;
    durationSeconds?: number;
  };
  if (!d.audioUrl) return null;
  return {
    id: snap.id,
    title: d.title ?? '',
    description: d.description ?? '',
    audioUrl: d.audioUrl,
    coverUrl: d.coverUrl ?? '',
    durationSeconds: d.durationSeconds ?? 0,
    kind: link.type as 'meditation' | 'webinar' | 'breakfast',
  };
}
