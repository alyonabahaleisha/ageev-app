import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import TrackPlayer, {Capability, State} from 'react-native-track-player';
import {downloadAudio, getCachedAudioUrl} from '../services/audioCache';
import {
  getPlaybackPosition,
  savePlaybackPosition,
} from '../services/playbackPositions';
import {uiString} from '../services/uiStrings';
import {track as trackEvent} from '../services/analytics';
import {resolveMediaUrl} from '../services/mediaRegion';
import {BackHandlerActiveContext} from '../hooks/useBackHandler';

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
  /**
   * Открыть плеер с описанием трека. По умолчанию звук НЕ включается
   * (решение по продукту: тап по карточке открывает описание, запуск — кнопкой
   * Play). autoplay: true — сразу играть (напр. «следующая практика»).
   */
  openPlayer: (track: PlayerTrack, opts?: {autoplay?: boolean}) => Promise<void>;
  /** Play/pause текущего трека; при первом Play загружает трек в плеер. */
  togglePlay: () => Promise<void>;
  /** Трек хотя бы раз запускали — только тогда показывается мини-бар. */
  started: boolean;
  /** Мини-бар скрыт открытым экраном, который он перекрывал бы. */
  miniHidden: boolean;
  /** Скрыть мини-бар, пока экран открыт; возвращает функцию отмены. */
  pushHideMini: () => () => void;
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
  togglePlay: async () => {},
  started: false,
  miniHidden: false,
  pushHideMini: () => () => {},
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

  const [started, setStarted] = useState(false);
  const [hideMiniCount, setHideMiniCount] = useState(0);
  const pushHideMini = useCallback(() => {
    setHideMiniCount(n => n + 1);
    return () => setHideMiniCount(n => Math.max(0, n - 1));
  }, []);
  // Актуальный трек для togglePlay (колбэк стабилен, state в замыкании устарел бы).
  const trackRef = useRef<PlayerTrack | null>(null);

  // Плеер (и foreground-сервис MusicService) НЕ поднимается при запуске
  // приложения: Google Play требует mediaPlayback-сервис только при реальном
  // воспроизведении, а на Samsung система гасила простаивающий сервис.
  // Инициализация — при первом Play (loadAndPlay).
  const loadAndPlay = useCallback(async (t: PlayerTrack) => {
    // Реальный старт практики — здесь (не при открытии описания).
    trackEvent('practice_start', {
      track_id: t.id,
      track_title: t.title,
      content_kind: t.kind ?? 'other',
    });
    setStarted(true);
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
      // a local copy in the background for next time. Медиа-URL приводим к
      // источнику региона (РФ-зеркало / Firebase) перед стримом и загрузкой.
      const streamUrl = resolveMediaUrl(t.audioUrl) ?? t.audioUrl;
      const cachedUrl = await getCachedAudioUrl(t.id, streamUrl);

      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: t.id,
        url: cachedUrl ?? streamUrl,
        title: t.title,
        artist: t.artist || uiString('player_default_artist', 'Михаил Агеев'),
        artwork: resolveMediaUrl(t.coverUrl) ?? t.coverUrl,
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
        downloadAudio(t.id, streamUrl);
      }
    } catch (e) {
      console.warn('[Player] error:', e);
    }
  }, []);

  const openPlayer = useCallback(
    async (t: PlayerTrack, opts?: {autoplay?: boolean}) => {
      // Show the player instantly; the audio pipeline spins up behind it so
      // the tap always gets an immediate response.
      const switching = trackRef.current?.id !== t.id;
      trackRef.current = t;
      setTrack(t);
      setIsVisible(true);
      if (opts?.autoplay) {
        await loadAndPlay(t);
        return;
      }
      if (switching && playerReady) {
        // Другой трек открыт «на описание»: прежний не должен звучать под ним.
        // Позиция сохраняется, чтобы потом продолжить с того же места.
        try {
          const active = await TrackPlayer.getActiveTrack();
          if (active?.id && active.id !== t.id) {
            const {position, duration} = await TrackPlayer.getProgress();
            await savePlaybackPosition(String(active.id), position, duration);
            await TrackPlayer.pause();
          }
        } catch {}
        setStarted(false);
      }
    },
    [loadAndPlay],
  );

  const togglePlay = useCallback(async () => {
    const t = trackRef.current;
    if (!t) return;
    if (playerReady) {
      const [active, {state}] = await Promise.all([
        TrackPlayer.getActiveTrack().catch(() => undefined),
        TrackPlayer.getPlaybackState(),
      ]);
      if (active?.id === t.id && state === State.Playing) {
        await TrackPlayer.pause().catch(() => {});
        return;
      }
    }
    await loadAndPlay(t);
  }, [loadAndPlay]);

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
        togglePlay,
        started,
        miniHidden: hideMiniCount > 0,
        pushHideMini,
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

/**
 * Экран, который мини-бар «Продолжить практику» перекрывал бы (фильтры
 * аффирмаций, попапы карты), прячет его на время показа.
 */
export function useHideMiniPlayer(active: boolean = true) {
  const {pushHideMini} = useContext(PlayerContext);
  // Экран внутри неактивной (спрятанной) вкладки мини-бар не скрывает.
  const onActiveTab = useContext(BackHandlerActiveContext);
  const on = active && onActiveTab;
  useEffect(() => (on ? pushHideMini() : undefined), [on, pushHideMini]);
}
