import AsyncStorage from '@react-native-async-storage/async-storage';

// Per-state practice progress (which activities the user has worked through) is
// kept on-device, keyed by the state id, so the header counter/bar is restored
// when the user returns to a state.
export type StateProgress = Record<string, boolean>;

const key = (stateId: string) => `mindset_progress_${stateId}`;

export async function loadStateProgress(stateId: string): Promise<StateProgress> {
  try {
    const raw = await AsyncStorage.getItem(key(stateId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as StateProgress) : {};
  } catch {
    return {};
  }
}

export async function saveStateProgress(
  stateId: string,
  progress: StateProgress,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key(stateId), JSON.stringify(progress));
  } catch {
    // Best-effort; losing a progress write is non-fatal.
  }
}
