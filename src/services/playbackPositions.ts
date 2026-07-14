import AsyncStorage from '@react-native-async-storage/async-storage';

// Last listened position per track, so reopening a practice resumes where the
// user left off — including across app restarts.
const KEY_PREFIX = 'playback_pos:';

// Don't bother resuming inside the first seconds, and treat "almost finished"
// as finished so a completed track restarts from the beginning.
const MIN_RESUME_SECONDS = 5;
const END_MARGIN_SECONDS = 15;

export async function savePlaybackPosition(
  trackId: string,
  position: number,
  duration: number,
): Promise<void> {
  try {
    if (duration > 0 && position >= duration - END_MARGIN_SECONDS) {
      await AsyncStorage.removeItem(KEY_PREFIX + trackId);
      return;
    }
    if (position < MIN_RESUME_SECONDS) return;
    await AsyncStorage.setItem(KEY_PREFIX + trackId, String(position));
  } catch {}
}

/** Saved resume position in seconds, or 0 to start from the beginning. */
export async function getPlaybackPosition(trackId: string): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + trackId);
    const pos = raw ? parseFloat(raw) : 0;
    return Number.isFinite(pos) && pos > 0 ? pos : 0;
  } catch {
    return 0;
  }
}
