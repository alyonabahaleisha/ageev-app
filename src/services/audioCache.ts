import {
  CachesDirectoryPath,
  downloadFile,
  exists,
  mkdir,
  moveFile,
  stat,
  unlink,
} from '@dr.pogodin/react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {track as trackEvent} from './analytics';
import {breadcrumb} from './diagnostics';

// Audio files are downloaded once into the OS cache directory and played from
// disk afterwards. iOS may purge Caches under disk pressure — that's fine, the
// file just re-downloads on the next play.
const AUDIO_DIR = `${CachesDirectoryPath}/audio`;

// Версия кэша. Повышается, когда старые файлы в кэше могут быть битыми и их
// нужно вычистить у всех пользователей один раз при обновлении приложения.
//  v2 (2026-10): до валидации загрузок в кэш попадали HTML-заглушки
//     блокировок/VPN с кодом 200 → трек «ломался навсегда».
const CACHE_VERSION = '2';
const CACHE_VERSION_KEY = 'audioCacheVersion';

// Минимальный размер правдоподобного аудио. HTML-заглушки блокировок и
// captive-portal'ов — единицы килобайт; самое короткое аудио в контенте —
// десятки секунд, то есть сотни килобайт.
const MIN_AUDIO_BYTES = 16 * 1024;

const inFlight = new Set<string>();

// iOS выбирает аудио-декодер по расширению локального файла, поэтому кэш обязан
// сохранять настоящий контейнер: m4a как .m4a, mp3 как .mp3. Иначе m4a-файл,
// сохранённый как .mp3, не декодируется при повторном воспроизведении (медитации
// и вебинары молчат, а завтраки-mp3 играют).
function extFromUrl(url: string): string {
  const m = url
    .split('?')[0]
    .toLowerCase()
    .match(/\.(m4a|mp3|aac|wav)$/);
  return m ? `.${m[1]}` : '.mp3';
}

function localPath(id: string, url: string): string {
  // Track ids are Firestore doc ids (URL-safe), so they're safe as filenames.
  return `${AUDIO_DIR}/${id}${extFromUrl(url)}`;
}

/**
 * Одноразовая чистка кэша при смене CACHE_VERSION (вызывается на старте).
 * Лечит пользователей, у которых в кэше уже лежат битые файлы.
 */
export async function ensureAudioCacheVersion(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(CACHE_VERSION_KEY);
    if (v === CACHE_VERSION) {
      return;
    }
    if (await exists(AUDIO_DIR)) {
      await unlink(AUDIO_DIR);
      trackEvent('audio_cache_purged', {
        from: v ?? 'none',
        to: CACHE_VERSION,
      });
    }
    await AsyncStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
  } catch (e) {
    console.warn('[AudioCache] version check failed:', e);
  }
}

/** file:// URL for a cached track, or null if it isn't downloaded yet.
 *  `url` — исходная ссылка (для выбора правильного расширения кэш-файла). */
export async function getCachedAudioUrl(
  id: string,
  url: string,
): Promise<string | null> {
  try {
    const path = localPath(id, url);
    return (await exists(path)) ? `file://${path}` : null;
  } catch {
    return null;
  }
}

/** Удалить трек из кэша (плеер не смог воспроизвести локальный файл). */
export async function removeCachedAudio(
  id: string,
  url: string,
): Promise<void> {
  const path = localPath(id, url);
  await unlink(path).catch(() => {});
  await unlink(`${path}.part`).catch(() => {});
  trackEvent('audio_cache_evicted', {track_id: id});
}

function headerValue(
  headers: Record<string, string> | undefined,
  name: string,
) {
  if (!headers) {
    return '';
  }
  const key = Object.keys(headers).find(k => k.toLowerCase() === name);
  return key ? String(headers[key]) : '';
}

export type DownloadOutcome =
  | 'cached'
  | 'already'
  | 'in_flight'
  | 'http_error'
  | 'network_error'
  | 'invalid_content';

/**
 * Download a track for offline/instant replay. Downloads to a temp path and
 * moves into place only on success, so a killed app never leaves a truncated
 * file that would later "play" as a broken track.
 *
 * Файл попадает в кэш только после проверки: статус 200, content-type аудио
 * (или без типа), размер совпал с Content-Length и не меньше MIN_AUDIO_BYTES.
 * Заглушка блокировки с кодом 200 раньше сохранялась как .m4a и трек после
 * этого не играл ни с какой сети. Возвращает исход — по нему плеер решает,
 * штрафовать ли зеркало.
 */
export async function downloadAudio(
  id: string,
  url: string,
): Promise<DownloadOutcome> {
  if (inFlight.has(id)) return 'in_flight';
  inFlight.add(id);
  const dest = localPath(id, url);
  const tmp = `${dest}.part`;
  let outcome: DownloadOutcome = 'network_error';
  let contentLength = 0;
  let contentType = '';
  try {
    await mkdir(AUDIO_DIR);
    if (await exists(dest)) return 'already';
    // background:false — обычная (не отложенная) загрузка. iOS откладывает
    // background-загрузки на своё усмотрение, из-за чего кэш не успевал
    // записаться и повторное воспроизведение снова стримило файл. Во время
    // проигрывания аудио процесс не засыпает (audio background mode), поэтому
    // обычная загрузка спокойно докачивается и с заблокированным экраном.
    const {statusCode, bytesWritten, headers} = await downloadFile({
      fromUrl: url,
      toFile: tmp,
      background: false,
      connectionTimeout: 15_000,
      readTimeout: 60_000,
      begin: res => {
        contentLength = res.contentLength || 0;
        contentType = headerValue(res.headers, 'content-type');
      },
    }).promise;
    if (!contentType) {
      contentType = headerValue(headers, 'content-type');
    }
    if (statusCode && statusCode >= 400) {
      outcome = 'http_error';
      throw new Error(`HTTP ${statusCode}`);
    }

    const size = (await stat(tmp).catch(() => null))?.size ?? bytesWritten ?? 0;
    const type = contentType.toLowerCase();
    const typeOk =
      !type ||
      type.startsWith('audio/') ||
      type.startsWith('application/octet-stream');
    const sizeOk =
      size >= MIN_AUDIO_BYTES && (contentLength <= 0 || size === contentLength);
    if (!typeOk || !sizeOk) {
      outcome = 'invalid_content';
      throw new Error(
        `invalid content: type=${
          type || '?'
        } size=${size} expected=${contentLength}`,
      );
    }

    await moveFile(tmp, dest);
    outcome = 'cached';
  } catch (e) {
    await unlink(tmp).catch(() => {});
    console.warn('[AudioCache] download failed:', e);
    breadcrumb(
      `audio cache ${id}: ${outcome} type=${contentType || 'none'} ${String(
        e,
      )}`,
    );
    trackEvent('audio_cache_download_failed', {
      track_id: id,
      outcome,
      content_type: contentType || 'none',
    });
  } finally {
    inFlight.delete(id);
  }
  return outcome;
}
