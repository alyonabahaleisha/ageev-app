import React from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer, {usePlaybackState, State} from 'react-native-track-player';
import {ICON_CLOSE, ICON_PAUSE, ICON_PLAY_TRIANGLE} from '../assets/icons';
import {usePlayer} from '../context/PlayerContext';
import {formatDuration} from '../services/meditations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

// «Продолжить практику» (Figma 448:11841) — глобальный мини-бар под шапкой:
// появляется, когда трек загружен, а полный плеер закрыт. Тап по тексту
// возвращает плеер, кнопка слева — play/pause на месте, крестик прячет бар
// до следующего запуска трека.
export function MiniPlayer() {
  const {track, isVisible, miniDismissed, reopenPlayer, dismissMini} =
    usePlayer();
  const {top} = useSafeAreaInsets();
  const playback = usePlaybackState();
  const t = useUIStrings();

  if (!track || isVisible || miniDismissed) return null;

  const isPlaying = playback.state === State.Playing;

  return (
    // В макете бар стоит на y=117 при статус-баре 47: шапка top+7, ряд 47,
    // отступ 16.
    <View style={[styles.bar, {top: top + 7 + 47 + 16}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.playBtn}
        onPress={() =>
          (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(() => {})
        }>
        <SvgXml
          xml={isPlaying ? ICON_PAUSE : ICON_PLAY_TRIANGLE}
          width={isPlaying ? 20 : 18}
          height={isPlaying ? 20 : 17}
          opacity={0.88}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.textCol}
        onPress={reopenPlayer}>
        <Text style={styles.title} numberOfLines={1}>
          {t('miniplayer_title', 'Продолжить практику')}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.subText} numberOfLines={1}>
            {track.title}
          </Text>
          {track.durationSeconds > 0 && (
            <>
              <View style={styles.dot} />
              <Text style={styles.subText}>
                {formatDuration(track.durationSeconds)}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        onPress={() => {
          TrackPlayer.pause().catch(() => {});
          dismissMini();
        }}>
        <SvgXml xml={ICON_CLOSE} width={24} height={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Плавающая карточка как «Сохранено» (448:13206): отступы 24, радиус 20.
  bar: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 12,
    // Непрозрачный, как баннер «Сохранено», — сквозь стеклянный фон
    // просвечивал контент.
    backgroundColor: '#22618D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.manrope.medium,
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '500',
    color: colors.white,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.65,
  },
  subText: {
    ...typography.small,
    color: colors.white,
    flexShrink: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.white,
  },
});
