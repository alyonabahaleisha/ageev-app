import {useEffect, useMemo, useState} from 'react';
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
  region: 'abroad' | 'russia';
  sortOrder: number;
  latitude: number;
  longitude: number;
};

export type ClubCountry = {country: string; clubs: Club[]};

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'clubs'),
      snapshot => {
        const docs = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Club));
        console.log('FETCHCHECK clubs', docs.length);
        setClubs(docs);
        setLoading(false);
      },
      err => {
        console.log('FETCHCHECK clubs ERROR', (err as Error)?.message);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {clubs, loading};
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
