import {AppState, NativeModules, Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import {track as trackEvent} from './analytics';
import {breadcrumb} from './diagnostics';

// Откуда грузить медиа — выбирается НЕ по стране, а по тому, какое зеркало
// реально доступно с текущей сети:
//  - 'ru'    → зеркало Yandex Object Storage (РФ; Google/Cloudflare режутся);
//  - 'world' → зеркало Cloudflare R2 (глобальный CDN + бесплатный egress).
// Локаль устройства и геопозиция — плохие сигналы: регион телефона часто не
// совпадает со страной, а VPN меняет видимую страну на ходу. Поэтому:
//  1) на старте и при возврате в приложение оба зеркала пробуются параллельно
//     (64 КБ пробник), побеждает более быстрое — так ловится и блокировка, и
//     дросселирование; с VPN доступны оба, выбирается любое;
//  2) ошибка стрима/загрузки → немедленный переход на другое зеркало и
//     перепроверка;
//  3) локаль — только стартовая подсказка, пока пробник не отработал.
// Firebase Storage остаётся origin'ом (загрузка из CMS) и источником синка.
// Данные в Firestore хранят Firebase-URL как есть; клиент переписывает хост на
// лету, поэтому переезд не требует правки контента и обратим.

export type Region = 'ru' | 'world';

// Базы зеркал. Пути внутри совпадают с путями в Firebase-бакете. Обе раздают с
// range-запросами (стриминг) и годовым кэшем. Замена CDN/домена — только здесь.
const MIRROR_BASE: Record<Region, string> = {
  ru: 'https://storage.yandexcloud.net/ageev-app-test/',
  world: 'https://pub-e856cc4814a440d5b979a3c8e44cf0c4.r2.dev/',
};

// Пробник лежит в Firebase Storage (probe/ping.bin, 64 КБ «ok…»), синк
// раскладывает его по зеркалам. Проверяем содержимое, а не только HTTP 200:
// captive-portal / заглушка блокировки отдают 200 с HTML.
const PROBE_PATH = 'probe/ping.bin';
const PROBE_BYTES = 65536;
const PROBE_TIMEOUT_MS = 5000;
// Переключаемся на другое зеркало, только если оно заметно быстрее текущего:
// иначе при равной доступности (VPN) выбор дёргался бы туда-сюда.
const SWITCH_SPEEDUP = 0.5;
// Пробник не чаще раза в минуту (возврат в приложение), кроме явных ошибок.
const PROBE_MIN_INTERVAL_MS = 60_000;
const FAILURE_PROBE_MIN_INTERVAL_MS = 10_000;
// Зеркало, на котором упал стрим, считается плохим столько, пока пробник не
// докажет обратное.
const FAILURE_PENALTY_MS = 5 * 60_000;

const OVERRIDE_KEY = 'mediaRegionOverride';
const PROBED_KEY = 'mediaRegionProbed';

export function otherRegion(r: Region): Region {
  return r === 'ru' ? 'world' : 'ru';
}

export function mirrorBase(region: Region): string {
  return MIRROR_BASE[region];
}

/** К какому зеркалу относится URL (null — не зеркало: Firebase, file://, …). */
export function regionOfUrl(url: string | null | undefined): Region | null {
  if (!url) {
    return null;
  }
  for (const r of Object.keys(MIRROR_BASE) as Region[]) {
    if (url.startsWith(MIRROR_BASE[r])) {
      return r;
    }
  }
  return null;
}

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

function detectRegionByLocale(): Region {
  // Локаль вида "ru_RU" / "en_US" / "ru-RU". Берём код страны, если есть,
  // иначе — язык. Это лишь стартовая догадка до первого пробника.
  const raw = deviceCountry();
  const country = (raw.split(/[-_]/)[1] || '').toUpperCase();
  if (country) {
    return country === 'RU' ? 'ru' : 'world';
  }
  return raw.toLowerCase().startsWith('ru') ? 'ru' : 'world';
}

// --- состояние -------------------------------------------------------------

let cachedAuto: Region | null = null;
// Рантайм-оверрайд (тумблер в настройках QA). Приоритет:
// runtime override > MEDIA_REGION из .env > результат пробника (или сохранённый
// с прошлого запуска) > авто по локали. Поверх всего — штраф упавшему зеркалу.
let runtimeOverride: Region | null = null;
let probed: Region | null = null;
const failedUntil: Record<Region, number> = {ru: 0, world: 0};
let lastProbeAt = 0;
let probeInFlight: Promise<Region | null> | null = null;
let appStateSubscribed = false;
const subscribers = new Set<() => void>();

function forcedRegion(): Region | null {
  if (runtimeOverride) {
    return runtimeOverride;
  }
  const forced = Config.MEDIA_REGION;
  return forced === 'ru' || forced === 'world' ? forced : null;
}

function preferredRegion(): Region {
  const forced = forcedRegion();
  if (forced) {
    return forced;
  }
  if (probed) {
    return probed;
  }
  if (cachedAuto === null) {
    cachedAuto = detectRegionByLocale();
  }
  return cachedAuto;
}

function isFailed(r: Region, now = Date.now()): boolean {
  return failedUntil[r] > now;
}

export function getRegion(): Region {
  const forced = forcedRegion();
  if (forced) {
    return forced;
  }
  const preferred = preferredRegion();
  // Упавшее зеркало обходим, если альтернатива не упала тоже.
  if (isFailed(preferred) && !isFailed(otherRegion(preferred))) {
    return otherRegion(preferred);
  }
  return preferred;
}

function notify() {
  subscribers.forEach(fn => fn());
}

export function subscribeRegion(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/** Ставит QA-оверрайд региона и уведомляет подписчиков (для перерисовки). */
export function setRegionOverride(region: Region | null): void {
  runtimeOverride = region;
  AsyncStorage.setItem(OVERRIDE_KEY, region ?? '').catch(() => {});
  notify();
}

// --- пробник ---------------------------------------------------------------

type ProbeResult = {region: Region; ok: boolean; ms: number};

async function probeOne(region: Region): Promise<ProbeResult> {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    // ?t= обходит HTTP-кэш клиента; у S3-совместимых хранилищ лишний
    // query-параметр на GET объекта игнорируется.
    const res = await fetch(
      `${MIRROR_BASE[region]}${PROBE_PATH}?t=${started}`,
      {
        method: 'GET',
        headers: {'Cache-Control': 'no-cache'},
        signal: controller.signal,
      },
    );
    if (!res.ok) {
      return {region, ok: false, ms: Date.now() - started};
    }
    const body = await res.text();
    const ok = body.length === PROBE_BYTES && body.startsWith('ok');
    return {region, ok, ms: Date.now() - started};
  } catch {
    return {region, ok: false, ms: Date.now() - started};
  } finally {
    clearTimeout(timer);
  }
}

let lastProbe: {at: string; ruMs: number; worldMs: number} | null = null;
/** Последний результат пробника (для отчёта диагностики). */
export function getLastProbe() {
  return lastProbe;
}

function applyProbe(results: ProbeResult[]): Region | null {
  const byRegion = Object.fromEntries(
    results.map(r => [r.region, r]),
  ) as Record<Region, ProbeResult>;
  const before = getRegion();
  const current = preferredRegion();
  const other = otherRegion(current);

  // Пробник — источник истины по доступности: удачный снимает штраф.
  for (const r of results) {
    if (r.ok) {
      failedUntil[r.region] = 0;
    }
  }

  let winner: Region | null = null;
  const cur = byRegion[current];
  const alt = byRegion[other];
  if (cur?.ok && alt?.ok) {
    winner = alt.ms < cur.ms * SWITCH_SPEEDUP ? other : current;
  } else if (cur?.ok) {
    winner = current;
  } else if (alt?.ok) {
    winner = other;
  }

  if (winner) {
    probed = winner;
    AsyncStorage.setItem(PROBED_KEY, winner).catch(() => {});
  }

  const after = getRegion();
  const ruMs = byRegion.ru?.ok ? byRegion.ru.ms : -1;
  const worldMs = byRegion.world?.ok ? byRegion.world.ms : -1;
  lastProbe = {at: new Date().toISOString(), ruMs, worldMs};
  trackEvent('media_probe', {ru_ms: ruMs, world_ms: worldMs, region: after});
  breadcrumb(`media probe ru=${ruMs}ms world=${worldMs}ms → ${after}`);
  if (ruMs < 0 && worldMs < 0) {
    // С этой сети не видно ни одного зеркала — практики играть не будут.
    trackEvent('media_no_mirror', {region: after});
  }
  if (after !== before) {
    trackEvent('media_mirror_switch', {
      from: before,
      to: after,
      reason: 'probe',
    });
    notify();
  }
  return winner;
}

/**
 * Проверяет оба зеркала и выбирает рабочее/более быстрое. Повторные вызовы
 * чаще минуты игнорируются (force — чаще, но не чаще 10 с). При QA-оверрайде
 * или MEDIA_REGION в .env ничего не делает. Возвращает выбранное зеркало или
 * null, если ни одно не ответило (текущий выбор тогда не меняется).
 */
export function probeMirrors(opts?: {force?: boolean}): Promise<Region | null> {
  if (forcedRegion()) {
    return Promise.resolve(null);
  }
  if (probeInFlight) {
    return probeInFlight;
  }
  const minInterval = opts?.force
    ? FAILURE_PROBE_MIN_INTERVAL_MS
    : PROBE_MIN_INTERVAL_MS;
  if (Date.now() - lastProbeAt < minInterval) {
    return Promise.resolve(probed);
  }
  lastProbeAt = Date.now();
  probeInFlight = Promise.all([probeOne('ru'), probeOne('world')])
    .then(applyProbe)
    .catch(() => null)
    .finally(() => {
      probeInFlight = null;
    });
  return probeInFlight;
}

/**
 * Сообщить, что зеркало не отдало медиа (ошибка стрима/загрузки). Зеркало
 * штрафуется, выбор сразу переключается на другое (если оно не упало тоже),
 * и запускается перепроверка. Возвращает зеркало, которым пользоваться теперь.
 */
export function reportMirrorFailure(region: Region | null): Region {
  if (!region || forcedRegion()) {
    return getRegion();
  }
  const before = getRegion();
  failedUntil[region] = Date.now() + FAILURE_PENALTY_MS;
  const after = getRegion();
  breadcrumb(`mirror failure ${region} → ${after}`);
  if (after !== before) {
    trackEvent('media_mirror_switch', {
      from: before,
      to: after,
      reason: 'failure',
    });
    notify();
  }
  probeMirrors({force: true}).catch(() => {});
  return after;
}

/**
 * Старт приложения (App.tsx): поднимает QA-оверрайд и результат прошлого
 * пробника из AsyncStorage, запускает пробник и перепроверяет при каждом
 * возврате в приложение (VPN включают/выключают, выходя из приложения).
 */
export async function initMediaRegion(): Promise<void> {
  try {
    const [override, saved] = await Promise.all([
      AsyncStorage.getItem(OVERRIDE_KEY),
      AsyncStorage.getItem(PROBED_KEY),
    ]);
    if (override === 'ru' || override === 'world') {
      runtimeOverride = override;
    }
    if (saved === 'ru' || saved === 'world') {
      probed = saved;
    }
  } catch {
    // нет сохранённого состояния — работаем по .env/локали
  }
  notify();
  probeMirrors().catch(() => {});
  if (!appStateSubscribed) {
    appStateSubscribed = true;
    AppState.addEventListener('change', state => {
      if (state === 'active') {
        probeMirrors().catch(() => {});
      }
    });
  }
}

/** @deprecated оставлено для совместимости; используйте initMediaRegion. */
export const initRegionOverride = initMediaRegion;

// --- резолвер URL ----------------------------------------------------------

/** Путь объекта из Firebase download-URL (`…/o/<encoded>?…`). */
function storagePath(url: string): string | null {
  const m = url.match(/\/o\/([^?]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Приводит медиа-URL к зеркалу (текущему или явно заданному `region` — для
 * повтора после ошибки), переписывая Firebase-URL по пути объекта. Уже
 * переписанные на зеркало ссылки переводятся на нужное зеркало; не-Firebase
 * и локальные (file://) возвращаются как есть.
 */
export function resolveMediaUrl(
  url: string | null | undefined,
  region?: Region,
): string | undefined {
  if (!url) {
    return undefined;
  }
  const target = region ?? getRegion();
  const fromMirror = regionOfUrl(url);
  if (fromMirror) {
    return fromMirror === target
      ? url
      : MIRROR_BASE[target] + url.slice(MIRROR_BASE[fromMirror].length);
  }
  if (!url.includes('firebasestorage') || !url.includes('/o/')) {
    return url;
  }
  const path = storagePath(url);
  if (!path) {
    return url;
  }
  return (
    MIRROR_BASE[target] + path.split('/').map(encodeURIComponent).join('/')
  );
}
