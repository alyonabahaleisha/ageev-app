import {useEffect, useMemo, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {collection, onSnapshot} from 'firebase/firestore';
import {db} from '../lib/firebase';

// Mirrors the `clubs` Firestore collection managed by the admin CMS
// (localhost:3000/clubs). No coordinates are stored, so the map pins are
// decorative — the searchable city list is the functional part.
export type Club = {
  id: string;
  country: string;
  city: string;
  leader: string;
  telegramUrl: string;
  /** Ссылка на сообщество ВКонтакте (у клуба может быть одна или обе). */
  vkUrl?: string;
  region: 'abroad' | 'russia';
  sortOrder: number;
  latitude: number;
  longitude: number;
};

export type ClubCountry = {country: string; clubs: Club[]};

// Общий стор вместо подписки в каждом хуке: раньше каждое открытие карты
// заводило новый onSnapshot и ждало сеть, из-за чего карта открывалась долго.
// Список кэшируется в AsyncStorage — при следующих запусках клубы доступны
// мгновенно, а живой снапшот тихо обновляет их поверх кэша.
const CACHE_KEY = 'clubs-cache-v1';
let store: Club[] = [];
let storeLoaded = false;
let syncStarted = false;
const storeListeners = new Set<() => void>();

function emitClubs() {
  storeListeners.forEach(l => l());
}

AsyncStorage.getItem(CACHE_KEY)
  .then(raw => {
    if (!raw || store.length > 0) return;
    const cached = JSON.parse(raw) as Club[];
    if (Array.isArray(cached) && cached.length > 0 && store.length === 0) {
      store = cached;
      storeLoaded = true;
      emitClubs();
    }
  })
  .catch(() => {});

/** Единственная живая подписка на коллекцию; стартует при первом хуке. */
export function startClubsSync(): void {
  if (syncStarted) return;
  syncStarted = true;
  onSnapshot(
    collection(db, 'clubs'),
    snapshot => {
      store = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Club));
      storeLoaded = true;
      emitClubs();
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(store)).catch(() => {});
    },
    err => {
      console.log('FETCHCHECK clubs ERROR', (err as Error)?.message);
      storeLoaded = true;
      emitClubs();
    },
  );
}

export function useClubs() {
  const [, setTick] = useState(0);

  useEffect(() => {
    startClubsSync();
    const l = () => setTick(t => t + 1);
    storeListeners.add(l);
    return () => {
      storeListeners.delete(l);
    };
  }, []);

  return {clubs: store, loading: !storeLoaded && store.length === 0};
}

// Groups clubs by country and sorts: countries A→Z, then within a country by
// sortOrder, then city A→Z — matching the CMS ordering. Cyrillic-aware ("ru").
export function groupClubs(clubs: Club[]): ClubCountry[] {
  const byCountry = new Map<string, Club[]>();
  for (const club of clubs) {
    const list = byCountry.get(club.country) ?? [];
    list.push(club);
    byCountry.set(club.country, list);
  }
  return [...byCountry.entries()]
    .map(([country, list]) => ({
      country,
      clubs: list
        .slice()
        .sort(
          (a, b) =>
            a.sortOrder - b.sortOrder || a.city.localeCompare(b.city, 'ru'),
        ),
    }))
    .sort((a, b) => a.country.localeCompare(b.country, 'ru'));
}

// Filters clubs by a case-insensitive substring match on city or country.
export function useFilteredClubs(clubs: Club[], queryText: string) {
  return useMemo(() => {
    const q = queryText.trim().toLowerCase();
    const matched = q
      ? clubs.filter(
          c =>
            c.city.toLowerCase().includes(q) ||
            c.country.toLowerCase().includes(q),
        )
      : clubs;
    return groupClubs(matched);
  }, [clubs, queryText]);
}
