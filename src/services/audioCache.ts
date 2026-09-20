import {
  CachesDirectoryPath,
  downloadFile,
  exists,
  mkdir,
  moveFile,
  unlink,
} from '@dr.pogodin/react-native-fs';

// Audio files are downloaded once into the OS cache directory and played from
// disk afterwards. iOS may purge Caches under disk pressure — that's fine, the
// file just re-downloads on the next play.
const AUDIO_DIR = `${CachesDirectoryPath}/audio`;

const inFlight = new Set<string>();

// iOS выбирает аудио-декодер по расширению локального файла, поэтому кэш обязан
// сохранять настоящий контейнер: m4a как .m4a, mp3 как .mp3. Иначе m4a-файл,
// сохранённый как .mp3, не декодируется при повторном воспроизведении (медитации
// и вебинары молчат, а завтраки-mp3 играют).
function extFromUrl(url: string): string {
  const m = url.split('?')[0].toLowerCase().match(/\.(m4a|mp3|aac|wav)$/);
  return m ? `.${m[1]}` : '.mp3';
}

function localPath(id: string, url: string): string {
  // Track ids are Firestore doc ids (URL-safe), so they're safe as filenames.
  return `${AUDIO_DIR}/${id}${extFromUrl(url)}`;
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

/**
 * Download a track for offline/instant replay. Downloads to a temp path and
 * moves into place only on success, so a killed app never leaves a truncated
 * file that would later "play" as a broken track.
 */
export async function downloadAudio(id: string, url: string): Promise<void> {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  const dest = localPath(id, url);
  const tmp = `${dest}.part`;
  try {
    await mkdir(AUDIO_DIR);
    if (await exists(dest)) return;
    // background:false — обычная (не отложенная) загрузка. iOS откладывает
    // background-загрузки на своё усмотрение, из-за чего кэш не успевал
    // записаться и повторное воспроизведение снова стримило файл. Во время
    // проигрывания аудио процесс не засыпает (audio background mode), поэтому
    // обычная загрузка спокойно докачивается и с заблокированным экраном.
    const {statusCode} = await downloadFile({
      fromUrl: url,
      toFile: tmp,
      background: false,
    }).promise;
    if (statusCode && statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}`);
    }
    await moveFile(tmp, dest);
  } catch (e) {
    await unlink(tmp).catch(() => {});
    console.warn('[AudioCache] download failed:', e);
  } finally {
    inFlight.delete(id);
  }
}
