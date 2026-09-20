import {NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

// Регион пользователя определяет, откуда грузить медиа:
//  - 'ru'    → зеркало Yandex Object Storage (РФ; Google может быть заблокирован);
//  - 'world' → зеркало Cloudflare R2 (глобальный CDN + бесплатный egress).
// Firebase Storage остаётся только origin'ом (загрузка из CMS) и источником
// синка. Данные в Firestore хранят Firebase-URL как есть; клиент переписывает
// хост на лету, поэтому переезд не требует правки контента и обратим.

export type Region = 'ru' | 'world';

// Базы зеркал. Пути внутри совпадают с путями в Firebase-бакете. Обе раздают с
// range-запросами (стриминг) и годовым кэшем. Замена CDN/домена — только здесь.
const RU_MEDIA_BASE = 'https://storage.yandexcloud.net/ageev-app-test/';
const WORLD_MEDIA_BASE =
  'https://pub-e856cc4814a440d5b979a3c8e44cf0c4.r2.dev/';

function deviceCountry(): string {
  try {
    if (Platform.OS === 'ios') {
      const s = NativeModules.SettingsManager?.settings;
      const loc =
        s?.AppleLocale ||
        (Array.isArray(s?.AppleLanguages) ? s.AppleLanguages[0] : '');
      return String(loc);
    }
    return String(NativeModules.I18nManager?.localeIdentifier || '');
  } catch {
    return '';
  }
}

function detectRegion(): Region {
  // Локаль вида "ru_RU" / "en_US" / "ru-RU". Берём код страны, если есть,
  // иначе — язык. Русскоязычные страны СНГ тоже под риском РФ-блокировок,
  // но 152-ФЗ и ТСПУ — про РФ; консервативно РФ = 'ru', остальные 'world'.
  const raw = deviceCountry();
  const country = (raw.split(/[-_]/)[1] || '').toUpperCase();
  if (country) {
    return country === 'RU' ? 'ru' : 'world';
  }
  // Нет кода страны — судим по языку: русский по умолчанию считаем РФ,
  // т.к. основная аудитория российская и для них важнее не упереться в
  // заблокированный Google.
  return raw.toLowerCase().startsWith('ru') ? 'ru' : 'world';
}

let cachedAuto: Region | null = null;
// Рантайм-оверрайд (тумблер в настройках QA). Приоритет:
// runtime override > MEDIA_REGION из .env > авто по локали.
let runtimeOverride: Region | null = null;
const OVERRIDE_KEY = 'mediaRegionOverride';
const subscribers = new Set<() => void>();

export function getRegion(): Region {
  if (runtimeOverride) {
    return runtimeOverride;
  }
  const forced = Config.MEDIA_REGION;
  if (forced === 'ru' || forced === 'world') {
    return forced;
  }
  if (cachedAuto === null) {
    cachedAuto = detectRegion();
  }
  return cachedAuto;
}

/** Загружает сохранённый оверрайд на старте приложения (App.tsx). */
export async function initRegionOverride(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(OVERRIDE_KEY);
    if (v === 'ru' || v === 'world') {
      runtimeOverride = v;
    }
  } catch {
    // нет сохранённого оверрайда — работаем по .env/локали
  }
}

/** Ставит оверрайд региона и уведомляет подписчиков (для перерисовки). */
export function setRegionOverride(region: Region | null): void {
  runtimeOverride = region;
  AsyncStorage.setItem(OVERRIDE_KEY, region ?? '').catch(() => {});
  subscribers.forEach(fn => fn());
}

export function subscribeRegion(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Путь объекта из Firebase download-URL (`…/o/<encoded>?…`). */
function storagePath(url: string): string | null {
  const m = url.match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Приводит медиа-URL к зеркалу текущего региона (РФ → Yandex, мир → R2),
 * переписывая Firebase-URL по пути объекта. Не-Firebase, уже переписанные и
 * локальные (file://) ссылки возвращает как есть.
 */
export function resolveMediaUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }
  if (!url.includes('firebasestorage') || !url.includes('/o/')) {
    return url;
  }
  const path = storagePath(url);
  if (!path) {
    return url;
  }
  const base = getRegion() === 'ru' ? RU_MEDIA_BASE : WORLD_MEDIA_BASE;
  return base + path.split('/').map(encodeURIComponent).join('/');
}
