import {getApps} from '@react-native-firebase/app';
import {
  getCrashlytics,
  log,
  recordError,
  setAttributes,
} from '@react-native-firebase/crashlytics';
import {appendLog} from './logBuffer';

// Crashlytics: крэши + «нефатальные» проблемы, которые иначе не видны —
// прежде всего «практика не играет». Каждый отчёт приходит с номером сборки,
// ОС, моделью устройства (аккаунтов нет — ищем по коду отчёта диагностики), видно сборку, сеть зеркал и последние шаги (хлебные
// крошки). Как и аналитика, молчит, если нативный конфиг Firebase не подключён.

type AttrValue = string | number | boolean | null | undefined;

function crashlyticsOrNull() {
  try {
    if (getApps().length === 0) return null;
    return getCrashlytics();
  } catch {
    return null;
  }
}

/** Хлебная крошка: попадает в следующий отчёт как контекст (до 64 КБ). */
export function breadcrumb(message: string): void {
  appendLog(message);
  const c = crashlyticsOrNull();
  if (!c) return;
  try {
    log(c, message);
  } catch {}
}

/** Текст ошибки из чего угодно: Error, {code, message} трек-плеера, строка. */
export function describeError(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'object') {
    const e = error as {code?: unknown; message?: unknown};
    const parts = [e.code, e.message].filter(Boolean).map(String);
    if (parts.length) return parts.join(': ');
    try {
      return JSON.stringify(error);
    } catch {}
  }
  return String(error);
}

/**
 * Нефатальная проблема. `name` — тип (player_stall, player_both_mirrors_failed…):
 * по нему Crashlytics группирует отчёты. `attrs` — ключи отчёта (трек, зеркало,
 * хост, из кэша ли). `error` — исходная ошибка, её текст идёт в сообщение.
 */
export function reportProblem(
  name: string,
  attrs: Record<string, AttrValue>,
  error?: unknown,
): void {
  const c = crashlyticsOrNull();
  if (!c) return;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined) clean[k] = String(v);
  }
  appendLog(`PROBLEM ${name} ${JSON.stringify(clean)} ${describeError(error)}`);
  try {
    setAttributes(c, clean).catch(() => {});
    const detail = describeError(error);
    const err = new Error(detail ? `${name}: ${detail}` : name);
    err.name = name;
    if (error instanceof Error && error.stack) {
      err.stack = error.stack;
    }
    recordError(c, err, name);
  } catch {}
}
