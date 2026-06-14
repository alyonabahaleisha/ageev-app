import React, {createContext, useCallback, useContext, useState} from 'react';
import TrackPlayer, {Capability} from 'react-native-track-player';

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
    await TrackPlayer.setupPlayer({waitForBuffer: true});
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

  const openPlayer = useCallback(async (t: PlayerTrack) => {
    try {
      await ensurePlayer();
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: t.id,
        url: t.audioUrl,
        title: t.title,
        artist: t.artist || 'Михаил Агеев',
        artwork: t.coverUrl,
        duration: t.durationSeconds,
      });
      await TrackPlayer.play();
      setTrack(t);
      setIsVisible(true);
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
