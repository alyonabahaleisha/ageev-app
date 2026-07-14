import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import TrackPlayer, {Capability, State} from 'react-native-track-player';
import {downloadAudio, getCachedAudioUrl} from '../services/audioCache';
import {
  getPlaybackPosition,
  savePlaybackPosition,
} from '../services/playbackPositions';
import {uiString} from '../services/uiStrings';

export type PlayerTrack = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  durationSeconds: number;
  artist?: string;
  /** Короткая подпись под названием (по макету), напр. «Медитация для спокойствия». */
  subtitle?: string;
  /** Тип контента для «Избранного»; без него сердечко в плеере скрыто. */
  kind?: 'meditation' | 'webinar' | 'breakfast';
};

type PlayerContextValue = {
  isVisible: boolean;
  track: PlayerTrack | null;
  openPlayer: (track: PlayerTrack) => Promise<void>;
  closePlayer: () => void;
  /** Hide the player UI without pausing — e.g. to peek at Избранное. */
  hidePlayer: () => void;
  /** Bring back the hidden player (same track, playback untouched). */
  reopenPlayer: () => void;
  /** Мини-бар «Продолжить практику» скрыт крестиком до следующего трека. */
  miniDismissed: boolean;
  dismissMini: () => void;
};

const PlayerContext = createContext<PlayerContextValue>({
  isVisible: false,
  track: null,
  openPlayer: async () => {},
  closePlayer: () => {},
  hidePlayer: () => {},
  reopenPlayer: () => {},
  miniDismissed: false,
  dismissMini: () => {},
});

let playerReady = false;

async function ensurePlayer() {
  if (playerReady) return;
  try {
    // waitForBuffer=false → start playback as soon as the first chunk
    // arrives instead of waiting for AVPlayer's "safe" buffer (which took
    // seconds on long webinar files).
    await TrackPlayer.setupPlayer({waitForBuffer: false});
  } catch (e: any) {
    if (!e?.message?.includes('already been initialized')) throw e;
  }
  await TrackPlayer.updateOptions({
    capabilities: [
      Capability.Play,
      Capability.Pause,
      Capability.SeekTo,
      Capability.JumpForward,
      Capability.JumpBackward,
    ],
    compactCapabilities: [Capability.Play, Capability.Pause],
    progressUpdateEventInterval: 1,
  });
  playerReady = true;
}

export function PlayerProvider({children}: {children: React.ReactNode}) {
  const [isVisible, setIsVisible] = useState(false);
  const [track, setTrack] = useState<PlayerTrack | null>(null);
  const [miniDismissed, setMiniDismissed] = useState(false);

  // Set the player up once at launch so the first tap doesn't pay for it.
  useEffect(() => {
    ensurePlayer().catch(() => {});
  }, []);

  const openPlayer = useCallback(async (t: PlayerTrack) => {
    // Show the player instantly; the audio pipeline spins up behind it so the
    // tap always gets an immediate response.
    setTrack(t);
    setIsVisible(true);
    setMiniDismissed(false);
    try {
      await ensurePlayer();

      // Reopening the track that's already loaded: just resume — no reset, no
      // re-download, position untouched. If it had played to the end, start
      // it over.
      const active = await TrackPlayer.getActiveTrack().catch(() => undefined);
      if (active?.id === t.id) {
        const {state} = await TrackPlayer.getPlaybackState();
        if (state === State.Ended) {
          await TrackPlayer.seekTo(0);
        }
        await TrackPlayer.play();
        return;
      }

      // Switching tracks: remember where the outgoing one stopped.
      if (active?.id) {
        const {position, duration} = await TrackPlayer.getProgress();
        await savePlaybackPosition(String(active.id), position, duration);
      }

      // Play the cached file when we have one; otherwise stream and download
      // a local copy in the background for next time.
      const cachedUrl = await getCachedAudioUrl(t.id);

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: t.id,
        url: cachedUrl ?? t.audioUrl,
        title: t.title,
        artist: t.artist || uiString('player_default_artist', 'Михаил Агеев'),
        artwork: t.coverUrl,
        duration: t.durationSeconds,
      });

      // Pick up where the user last left this track (persists across
      // restarts). Positions near the end are not saved, so a finished track
      // starts over.
      const savedPos = await getPlaybackPosition(t.id);
      if (savedPos > 0) {
        await TrackPlayer.seekTo(savedPos);
      }

      await TrackPlayer.play();

      if (!cachedUrl) {
        downloadAudio(t.id, t.audioUrl);
      }
    } catch (e) {
      console.warn('[Player] error:', e);
    }
  }, []);

  const closePlayer = useCallback(() => {
    // Remember where the user left off before hiding the player. Playback
    // keeps going — the «Продолжить практику» mini bar takes over; pausing
    // happens from the bar (или его крестиком).
    TrackPlayer.getProgress()
      .then(async ({position, duration}) => {
        const active = await TrackPlayer.getActiveTrack();
        if (active?.id) {
          await savePlaybackPosition(String(active.id), position, duration);
        }
      })
      .catch(() => {});
    setIsVisible(false);
  }, []);

  const hidePlayer = useCallback(() => {
    setIsVisible(false);
  }, []);

  const reopenPlayer = useCallback(() => {
    setTrack(current => {
      if (current) setIsVisible(true);
      return current;
    });
  }, []);

  const dismissMini = useCallback(() => setMiniDismissed(true), []);

  return (
    <PlayerContext.Provider
      value={{
        isVisible,
        track,
        openPlayer,
        closePlayer,
        hidePlayer,
        reopenPlayer,
        miniDismissed,
        dismissMini,
      }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
