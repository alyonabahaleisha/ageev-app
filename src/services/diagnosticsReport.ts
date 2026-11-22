import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {addDoc, collection, serverTimestamp} from 'firebase/firestore';
import {db} from '../lib/firebase';
import {APP_ENV} from '../config/env';
import {getLastProbe, getRegion} from './mediaRegion';
import {appendLog, getLogLines} from './logBuffer';
import {track} from './analytics';

// Отчёт о состоянии приложения → Firestore `diagnostics`: устройство, сборка,
// зеркала и последние строки журнала. Уходит сам при проблеме воспроизведения
// и по кнопке «Отправить отчёт» в настройках (пользователь называет код —
// по нему отчёт ищется в консоли Firebase или скриптом list-diagnostics.ts).

const UPLOAD_TIMEOUT_MS = 15_000;
const MIN_AUTO_INTERVAL_MS = 60_000;
let lastAutoAt = 0;

export type DiagnosticsResult = {ok: boolean; code?: string; error?: string};

/** Короткий код отчёта: 4 символа из времени + случайность (не для безопасности). */
function makeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

/** Строка-шапка для журнала: сборка/устройство, пишется на старте. */
export function describeDevice(): string {
  return [
    `${Platform.OS} ${DeviceInfo.getSystemVersion()}`,
    DeviceInfo.getModel(),
    `v${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`,
    APP_ENV,
  ].join(' · ');
}

export async function uploadDiagnostics(
  reason: string,
  opts?: {auto?: boolean; extra?: Record<string, string | number | boolean>},
): Promise<DiagnosticsResult> {
  const now = Date.now();
  if (opts?.auto) {
    if (now - lastAutoAt < MIN_AUTO_INTERVAL_MS) {
      return {ok: false, error: 'throttled'};
    }
    lastAutoAt = now;
  }
  const code = makeCode();
  const probe = getLastProbe();
  const [freeDisk, carrier] = await Promise.all([
    DeviceInfo.getFreeDiskStorage().catch(() => -1),
    DeviceInfo.getCarrier().catch(() => ''),
  ]);
  const report = {
    code,
    reason,
    auto: !!opts?.auto,
    createdAt: serverTimestamp(),
    clientTime: new Date().toISOString(),
    env: APP_ENV,
    platform: Platform.OS,
    osVersion: DeviceInfo.getSystemVersion(),
    model: DeviceInfo.getModel(),
    brand: DeviceInfo.getBrand(),
    appVersion: DeviceInfo.getVersion(),
    build: DeviceInfo.getBuildNumber(),
    carrier,
    freeDiskMb: freeDisk > 0 ? Math.round(freeDisk / 1048576) : -1,
    mediaRegion: getRegion(),
    probe: probe
      ? {at: probe.at, ruMs: probe.ruMs, worldMs: probe.worldMs}
      : null,
    extra: opts?.extra ?? {},
    lines: getLogLines(),
  };
  appendLog(`diagnostics upload ${code} (${reason})`);
  try {
    await Promise.race([
      addDoc(collection(db, 'diagnostics'), report),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), UPLOAD_TIMEOUT_MS),
      ),
    ]);
    track('diagnostics_sent', {reason, auto: !!opts?.auto});
    return {ok: true, code};
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    appendLog(`diagnostics upload failed: ${error}`);
    return {ok: false, code, error};
  }
}
