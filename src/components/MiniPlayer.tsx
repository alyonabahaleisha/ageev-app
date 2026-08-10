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
    // Правки (Figma 489:11217): бар 40px, отступ от шапки 10px — плеер
    // перекрывал важный контент.
    <View style={[styles.bar, {top: top + 7 + 47 + 10}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.playBtn}
        onPress={() =>
          (isPlaying ? TrackPlayer.pause() : TrackPlayer.play()).catch(() => {})
        }>
        <SvgXml
          xml={isPlaying ? ICON_PAUSE : ICON_PLAY_TRIANGLE}
          width={isPlaying ? 16 : 14}
          height={isPlaying ? 16 : 13}
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
        <SvgXml xml={ICON_CLOSE} width={20} height={20} />
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
    height: 40,
    paddingVertical: 5,
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
  // Без обводки и компактнее — по правкам иконка вписывается в бар 40px.
  playBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.manrope.medium,
    fontSize: 12,
    lineHeight: 15.6,
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
    fontSize: 10,
    lineHeight: 13,
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
