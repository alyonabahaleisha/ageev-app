import {useEffect, useMemo, useState} from 'react';
import {collection, onSnapshot} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {useUIStrings} from './uiStrings';

// «Короткие» = up to 20 minutes, «Длинные» = everything above.
const SHORT_MAX_SECONDS = 20 * 60;

type AreaDoc = {label?: string; sortOrder?: number};

export type ContentFilter = {key: string; label: string};

/**
 * Сферы жизни элемента: мульти-поле `areas`, а для старых документов —
 * одиночное `area`. Контент может принадлежать нескольким сферам сразу.
 */
export function itemAreas(i: {area?: string; areas?: string[]}): string[] {
  if (i.areas && i.areas.length) {
    return i.areas;
  }
  return i.area ? [i.area] : [];
}

/**
 * Filter chips for the meditation/webinar/breakfast lists.
 * «Все / Короткие / Длинные» filter by duration; the rest of the chips are
 * the life spheres actually present in the content (labels come live from
 * the CMS `lifeAreas` collection), so admins control both assignment and
 * naming. Sphere chips appear only when at least one item has that sphere;
 * duration chips appear only when durations are known.
 */
export function useContentFilters<
  T extends {area?: string; areas?: string[]; durationSeconds: number},
>(items: T[]) {
  const [areas, setAreas] = useState<Record<string, AreaDoc>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const t = useUIStrings();

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
        err => console.log('FETCHCHECK lifeAreas ERROR', err.message),
      ),
    [],
  );

  const presentAreas = useMemo(() => {
    const seen = new Set<string>();
    items.forEach(i => {
      itemAreas(i).forEach(a => seen.add(a));
    });
    return [...seen].sort(
      (a, b) => (areas[a]?.sortOrder ?? 999) - (areas[b]?.sortOrder ?? 999),
    );
  }, [items, areas]);

  const hasDurations = items.some(i => i.durationSeconds > 0);

  const filters: ContentFilter[] = useMemo(
    () => [
      {key: '__all', label: t('filter_all', 'Все')},
      ...(hasDurations
        ? [
            {key: '__short', label: t('filter_short', 'Короткие')},
            {key: '__long', label: t('filter_long', 'Длинные')},
          ]
        : []),
      ...presentAreas.map(a => ({key: a, label: areas[a]?.label || a})),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presentAreas, areas, hasDurations, t('filter_all', 'Все')],
  );

  const active = filters[Math.min(activeIndex, filters.length - 1)];

  const filtered = useMemo(() => {
    if (!active || active.key === '__all') {
      return items;
    }
    if (active.key === '__short') {
      return items.filter(
        i => i.durationSeconds > 0 && i.durationSeconds <= SHORT_MAX_SECONDS,
      );
    }
    if (active.key === '__long') {
      return items.filter(i => i.durationSeconds > SHORT_MAX_SECONDS);
    }
    return items.filter(i => itemAreas(i).includes(active.key));
  }, [items, active]);

  return {filters, activeIndex, setActiveIndex, filtered};
}
