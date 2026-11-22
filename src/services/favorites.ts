import {useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {track} from './analytics';

// Избранное (Figma 448:10703): медитации, вебинары, духовные завтраки и
// аффирмации, которые пользователь отметил сердечком. Хранится ТОЛЬКО на
// устройстве (AsyncStorage): аккаунтов в приложении больше нет. Списки,
// сохранённые раньше под аккаунтами (`favorites_v1:<uid>`) и гостем,
// один раз сливаются в общий локальный список при первом запуске.

export type FavoriteKind =
  | 'meditation'
  | 'webinar'
  | 'breakfast'
  | 'affirmation';

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
const KEY = KEY_PREFIX + 'local';

let items: FavoriteItem[] = [];
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(l => l());
}

async function readKey(key: string): Promise<FavoriteItem[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const itemKey = (i: {kind: FavoriteKind; id: string}) => `${i.kind}:${i.id}`;

function persist() {
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
}

async function load() {
  let list = await readKey(KEY);
  // Перенос из старых списков (гость и аккаунты) — один раз.
  try {
    const legacy = (await AsyncStorage.getAllKeys()).filter(
      k => k.startsWith(KEY_PREFIX) && k !== KEY,
    );
    if (legacy.length) {
      const seen = new Set(list.map(itemKey));
      for (const k of legacy) {
        for (const i of await readKey(k)) {
          if (!seen.has(itemKey(i))) {
            seen.add(itemKey(i));
            list.push(i);
          }
        }
      }
      list.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
      await AsyncStorage.setItem(KEY, JSON.stringify(list));
      await Promise.all(legacy.map(k => AsyncStorage.removeItem(k)));
    }
  } catch {
    // не удалось прочитать старые ключи — работаем с тем, что есть
  }
  items = list;
  loaded = true;
  emit();
}

load();

export function isFavorite(kind: FavoriteKind, id: string): boolean {
  return items.some(i => i.kind === kind && i.id === id);
}

export function toggleFavorite(item: Omit<FavoriteItem, 'addedAt'>) {
  if (isFavorite(item.kind, item.id)) {
    items = items.filter(i => !(i.kind === item.kind && i.id === item.id));
    track('favorite_remove', {content_kind: item.kind, content_id: item.id});
  } else {
    items = [{...item, addedAt: Date.now()}, ...items];
    track('favorite_add', {content_kind: item.kind, content_id: item.id});
  }
  persist();
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
