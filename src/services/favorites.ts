import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {onAuthStateChanged} from 'firebase/auth';
import {auth} from '../lib/firebase';

// Избранное (Figma 448:10703): медитации, вебинары, духовные завтраки и
// аффирмации, которые пользователь отметил сердечком. Хранится локально,
// отдельным списком на аккаунт; лайки гостя переезжают в аккаунт при первом
// входе.

export type FavoriteKind = 'meditation' | 'webinar' | 'breakfast' | 'affirmation';

export type FavoriteItem = {
  kind: FavoriteKind;
  id: string;
  /** Для аффирмаций — сам текст. */
  title: string;
  description?: string;
  coverUrl?: string;
  audioUrl?: string;
  durationSeconds?: number;
  addedAt: number;
};

const KEY_PREFIX = 'favorites_v1:';

let scope = 'guest';
let items: FavoriteItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

async function readScope(s: string): Promise<FavoriteItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + s);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const itemKey = (i: {kind: FavoriteKind; id: string}) => `${i.kind}:${i.id}`;

async function switchScope(next: string) {
  scope = next;
  loaded = false;
  let list = await readScope(next);
  if (next !== 'guest') {
    const guest = await readScope('guest');
    if (guest.length) {
      const seen = new Set(list.map(itemKey));
      list = [...guest.filter(i => !seen.has(itemKey(i))), ...list];
      AsyncStorage.removeItem(KEY_PREFIX + 'guest').catch(() => {});
      AsyncStorage.setItem(KEY_PREFIX + next, JSON.stringify(list)).catch(
        () => {},
      );
    }
  }
  // Пока читали хранилище, пользователь мог выйти/войти — не затираем.
  if (scope === next) {
    items = list;
    loaded = true;
    emit();
  }
}

onAuthStateChanged(auth, u => {
  switchScope(u?.uid ?? 'guest');
});

export function isFavorite(kind: FavoriteKind, id: string): boolean {
  return items.some(i => i.kind === kind && i.id === id);
}

export function toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
  if (isFavorite(item.kind, item.id)) {
    items = items.filter(i => !(i.kind === item.kind && i.id === item.id));
  } else {
    items = [{...item, addedAt: Date.now()}, ...items];
  }
  AsyncStorage.setItem(KEY_PREFIX + scope, JSON.stringify(items)).catch(
    () => {},
  );
  emit();
}

/** Подписка на избранное: список, флаг загрузки и операции. */
export function useFavorites() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick(t => t + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {items, loaded, isFavorite, toggleFavorite};
}
