import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
} from 'react-native-track-player';
import {
  ICON_CLOCK,
  ICON_CLOSE_PLAYER,
  ICON_FORWARD10,
  ICON_HEART,
  ICON_PAUSE,
  ICON_PLAY_TRIANGLE,
  ICON_REPLAY10,
  ICON_SHARE,
} from '../assets/icons';
import {RemoteImage} from '../components/RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function ProgressBar() {
  const {position, duration} = useProgress(500);
  const [barWidth, setBarWidth] = useState(0);
  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;

  const handleSeek = useCallback(
    async (e: {nativeEvent: {locationX: number}}) => {
      if (barWidth > 0 && duration > 0) {
        const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
        await TrackPlayer.seekTo(ratio * duration);
      }
    },
    [barWidth, duration],
  );

  return (
    <View style={pb.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleSeek}
        style={pb.track}
        onLayout={e => setBarWidth(e.nativeEvent.layout.width)}>
        {/* Track background */}
        <View style={pb.trackBg} />
        {/* Fill */}
        <View style={[pb.fill, {width: `${progress * 100}%`}]} />
        {/* Handle */}
        <View style={[pb.handleGlow, {left: `${progress * 100}%` as any}]}>
          <View style={pb.handle} />
        </View>
      </TouchableOpacity>
      <View style={pb.timeRow}>
        <Text style={pb.timeText}>{formatTime(position)}</Text>
        <Text style={pb.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  container: {gap: 6, alignSelf: 'stretch'},
  track: {height: 18, overflow: 'visible'},
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7BC4F3',
  },
  handleGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    borderRadius: 14,
    backgroundColor: 'rgba(123,196,243,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    top: -5,
  },
  handle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#7BC4F3',
    ...Platform.select({
      ios: {
        shadowColor: '#7BC4F3',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
});

function Controls() {
  const state = usePlaybackState();
  const isPlaying = state.state === State.Playing;

  return (
    <View style={ctrl.row}>
      {/* Replay 10 */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => TrackPlayer.seekBy(-10)}
        style={ctrl.skipBtn}>
        <SvgXml xml={ICON_REPLAY10} width={35} height={35} />
      </TouchableOpacity>

      {/* Play / Pause */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={ctrl.playBtn}
        onPress={() => (isPlaying ? TrackPlayer.pause() : TrackPlayer.play())}>
        <SvgXml
          xml={isPlaying ? ICON_PAUSE : ICON_PLAY_TRIANGLE}
          width={isPlaying ? 30 : 24}
          height={isPlaying ? 30 : 24}
        />
      </TouchableOpacity>

      {/* Forward 10 */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => TrackPlayer.seekBy(10)}
        style={ctrl.skipBtn}>
        <SvgXml xml={ICON_FORWARD10} width={35} height={35} />
      </TouchableOpacity>
    </View>
  );
}

const ctrl = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  skipBtn: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    // Note: no Android elevation here — an elevation shadow shows through the
    // translucent glass background as a dark (octagonal) blob. iOS shadows
    // respect alpha, so they stay.
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
    }),
  },
});

const SHEET_BODY_H = Math.min(340, Dimensions.get('window').height * 0.42);
const DEFAULT_HEADER_H = 108; // visible height of the collapsed sheet header

const TABS = ['Описание', 'Похожие практики'];

// translateY snap points: 0 = fully expanded, SHEET_BODY_H = collapsed (the
// body is pushed off the bottom of the screen, leaving only the drag header).
const COLLAPSED_Y = SHEET_BODY_H;
const EXPANDED_Y = 0;

function DetailsSheet({description}: {description: string}) {
  const {bottom} = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState(0);
  // Animate a transform (not layout height) so both the drag and the release
  // spring run on the native driver and never block the JS thread that
  // PanResponder lives on — JS-driven layout animation was starving touch
  // handling (unresponsive drag) and causing relayout jank (glitching).
  const translateY = useRef(new Animated.Value(COLLAPSED_Y)).current;
  const yRef = useRef(COLLAPSED_Y);
  const startRef = useRef(COLLAPSED_Y);

  useEffect(() => {
    const id = translateY.addListener(({value}) => {
      yRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snapTo = useCallback(
    (to: number) => {
      Animated.spring(translateY, {
        toValue: to,
        useNativeDriver: true,
        bounciness: 2,
      }).start();
    },
    [translateY],
  );

  const pan = useRef(
    PanResponder.create({
      // Claim the touch immediately when a drag starts on the bare grabber/handle
      // strip. Without a start-claim the responder system has nothing to track on
      // an empty (non-pressable) view, so under the New Architecture the later
      // move-negotiation never engages and the handle feels undraggable. Tab taps
      // still work: a child TouchableOpacity wins the start negotiation by bubble
      // priority, so this only fires for touches that land on the handle itself.
      onStartShouldSetPanResponder: () => true,
      // Capture-phase negotiation: a vertical drag is intercepted even when it
      // starts on the tab buttons, while taps (no movement) still reach them.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startRef.current = yRef.current;
      },
      onPanResponderMove: (_, g) => {
        // Drag up (g.dy < 0) lowers translateY toward the expanded position.
        const next = Math.max(
          EXPANDED_Y,
          Math.min(COLLAPSED_Y, startRef.current + g.dy),
        );
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, g) => {
        const expand = g.vy < -0.3 || yRef.current < SHEET_BODY_H / 2;
        snapTo(expand ? EXPANDED_Y : COLLAPSED_Y);
      },
    }),
  ).current;

  const openTab = useCallback(
    (i: number) => {
      setActiveTab(i);
      snapTo(EXPANDED_Y);
    },
    [snapTo],
  );

  return (
    <Animated.View style={[styles.sheet, {transform: [{translateY}]}]}>
      <View {...pan.panHandlers}>
        <View style={styles.grabber}>
          <View style={styles.sheetHandle} />
        </View>
        <View style={[styles.tabs, {marginBottom: bottom + 4}]}>
          {TABS.map((label, i) => (
            <TouchableOpacity
              key={label}
              activeOpacity={0.8}
              onPress={() => openTab(i)}
              style={[styles.tab, i === activeTab && styles.tabActive]}>
              <Text
                style={[
                  styles.tabText,
                  i !== activeTab && styles.tabTextInactive,
                ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.sheetBody, {height: SHEET_BODY_H}]}>
        {activeTab === 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.sheetScroll, {paddingBottom: bottom + 24}]}>
            <Text style={styles.description}>
              {description?.trim() || 'Описание появится позже.'}
            </Text>
          </ScrollView>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Скоро здесь появятся похожие практики.
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export function PlayerScreen() {
  const {isVisible, track, closePlayer} = usePlayer();
  const {top, bottom} = useSafeAreaInsets();

  if (!isVisible || !track) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closePlayer}>
      <LinearGradient
        colors={['#22618D', '#347FB3', '#165079', '#165079']}
        locations={[0, 0.34, 0.68, 1]}
        start={{x: 0.3, y: 0}}
        end={{x: 0.7, y: 1}}
        style={styles.root}>

        {/* Header */}
        <View style={[styles.header, {paddingTop: top + 7}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={closePlayer}
            style={styles.headerCloseBtn}>
            <SvgXml xml={ICON_CLOSE_PLAYER} width={16} height={16} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity activeOpacity={0.8} style={styles.glassmorphicBtn}>
              <SvgXml xml={ICON_CLOCK} width={20} height={20} />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.glassmorphicBtn}>
              <SvgXml xml={ICON_SHARE} width={20} height={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main scroll content */}
        <View style={[styles.content, {paddingBottom: DEFAULT_HEADER_H + bottom + 8}]}>
          {/* Cover art */}
          <View style={styles.coverGlow}>
            <RemoteImage
              source={{uri: track.coverUrl}}
              style={styles.cover}
              resizeMode="cover"
            />
          </View>

          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={styles.title} numberOfLines={2}>
                {track.title}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} style={styles.heartBtn}>
              <SvgXml xml={ICON_HEART} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Progress bar */}
          <ProgressBar />

          {/* Controls */}
          <Controls />
        </View>

        {/* Bottom sheet */}
        <DetailsSheet description={track.description} />
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerCloseBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  glassmorphicBtn: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  coverGlow: {
    width: 280,
    height: 280,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cover: {
    width: 280,
    height: 280,
    borderRadius: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleCol: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...typography.h2,
    color: colors.white,
  },
  heartBtn: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#22618D',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(26,95,140,0.2)',
        shadowOffset: {width: 0, height: -12},
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  grabber: {
    // Generous full-width drag strip so the handle is easy to catch.
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 18,
  },
  sheetHandle: {
    width: 64,
    height: 5,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
    marginTop: 24,
  },
  tab: {
    paddingBottom: 12,
  },
  tabActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.white,
  },
  tabText: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  tabTextInactive: {
    opacity: 0.5,
  },
  sheetBody: {
    paddingHorizontal: 24,
  },
  sheetScroll: {
    paddingTop: 4,
  },
  description: {
    ...typography.body,
    color: colors.white,
    opacity: 0.85,
    lineHeight: 22,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  placeholderText: {
    ...typography.body,
    color: colors.white,
    opacity: 0.6,
    textAlign: 'center',
  },
});
