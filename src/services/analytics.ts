import {getApps} from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  logScreenView,
  setUserId,
} from '@react-native-firebase/analytics';

// Firebase Analytics (GA4). Все вызовы fire-and-forget и безопасны без
// нативного конфига: пока google-services.json / GoogleService-Info.plist
// не добавлены, приложение Firebase не инициализировано и трекинг молчит.

type Params = Record<string, string | number | boolean>;

function analyticsOrNull() {
  try {
    if (getApps().length === 0) return null;
    return getAnalytics();
  } catch {
    return null;
  }
}

/** Событие GA4. Имя — snake_case, до 40 символов, параметры — примитивы. */
export function track(name: string, params?: Params): void {
  const a = analyticsOrNull();
  if (!a) return;
  try {
    logEvent(a, name, params);
  } catch {}
}

/**
 * Просмотр экрана. Приложение одноэкранное для системы (табы и оверлеи),
 * поэтому screen_view шлём вручную при переключениях.
 */
export function trackScreen(screenName: string): void {
  const a = analyticsOrNull();
  if (!a) return;
  logScreenView(a, {
    screen_name: screenName,
    screen_class: screenName,
  }).catch(() => {});
}

/** Привязка событий к uid Firebase Auth (null при выходе). */
export function trackUser(uid: string | null): void {
  const a = analyticsOrNull();
  if (!a) return;
  setUserId(a, uid).catch(() => {});
}
