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

function localPath(id: string): string {
  // Track ids are Firestore doc ids (URL-safe), so they're safe as filenames.
  return `${AUDIO_DIR}/${id}.mp3`;
}

/** file:// URL for a cached track, or null if it isn't downloaded yet. */
export async function getCachedAudioUrl(id: string): Promise<string | null> {
  try {
    return (await exists(localPath(id))) ? `file://${localPath(id)}` : null;
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
  const tmp = `${localPath(id)}.part`;
  try {
    await mkdir(AUDIO_DIR);
    if (await exists(localPath(id))) return;
    const {statusCode} = await downloadFile({
      fromUrl: url,
      toFile: tmp,
      background: true,
      discretionary: false,
    }).promise;
    if (statusCode && statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}`);
    }
    await moveFile(tmp, localPath(id));
  } catch (e) {
    await unlink(tmp).catch(() => {});
    console.warn('[AudioCache] download failed:', e);
  } finally {
    inFlight.delete(id);
  }
}
