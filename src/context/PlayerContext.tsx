import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import TrackPlayer, {Capability} from 'react-native-track-player';
import {uiString} from '../services/uiStrings';

export type PlayerTrack = {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  coverUrl: string;
  durationSeconds: number;
  artist?: string;
};

type PlayerContextValue = {
  isVisible: boolean;
  track: PlayerTrack | null;
  openPlayer: (track: PlayerTrack) => Promise<void>;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextValue>({
  isVisible: false,
  track: null,
  openPlayer: async () => {},
  closePlayer: () => {},
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

  // Set the player up once at launch so the first tap doesn't pay for it.
  useEffect(() => {
    ensurePlayer().catch(() => {});
  }, []);

  const openPlayer = useCallback(async (t: PlayerTrack) => {
    // Show the player instantly; the audio pipeline spins up behind it so the
    // tap always gets an immediate response.
    setTrack(t);
    setIsVisible(true);
    try {
      await ensurePlayer();
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: t.id,
        url: t.audioUrl,
        title: t.title,
        artist: t.artist || uiString('player_default_artist', 'Михаил Агеев'),
        artwork: t.coverUrl,
        duration: t.durationSeconds,
      });
      await TrackPlayer.play();
    } catch (e) {
      console.warn('[Player] error:', e);
    }
  }, []);

  const closePlayer = useCallback(() => {
    TrackPlayer.pause().catch(() => {});
    setIsVisible(false);
  }, []);

  return (
    <PlayerContext.Provider value={{isVisible, track, openPlayer, closePlayer}}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
