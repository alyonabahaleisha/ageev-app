import TrackPlayer, {Event} from 'react-native-track-player';
import {savePlaybackPosition} from './playbackPositions';

// Persist the position on a slow heartbeat (plus on pause/close) so the
// resume point survives even if the app is killed mid-listen.
const SAVE_EVERY_SECONDS = 5;
let lastSavedAt = 0;

async function persistPosition(position: number, duration: number) {
  const active = await TrackPlayer.getActiveTrack().catch(() => undefined);
  if (active?.id) {
    await savePlaybackPosition(String(active.id), position, duration);
  }
}

export async function PlaybackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({position}) =>
    TrackPlayer.seekTo(position),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpForward, ({interval}) =>
    TrackPlayer.seekBy(interval),
  );
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, ({interval}) =>
    TrackPlayer.seekBy(-interval),
  );

  TrackPlayer.addEventListener(
    Event.PlaybackProgressUpdated,
    ({position, duration}) => {
      if (position - lastSavedAt >= SAVE_EVERY_SECONDS || position < lastSavedAt) {
        lastSavedAt = position;
        persistPosition(position, duration).catch(() => {});
      }
    },
  );
}
