import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from '../components/LinearGradient';
import Svg, {Circle, SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer, {
  usePlaybackState,
  useProgress,
  State,
} from 'react-native-track-player';
import {
  ICON_CLOCK,
  ICON_CLOSE,
  ICON_CLOSE_PLAYER,
  ICON_FORWARD10,
  ICON_HEART,
  ICON_HEART_FILLED,
  ICON_PAUSE,
  ICON_PLAY_TRIANGLE,
  ICON_REPLAY10,
  ICON_SHARE,
} from '../assets/icons';
import {RemoteImage} from '../components/RemoteImage';
import {PlayerTrack, usePlayer} from '../context/PlayerContext';
import {requestOpenFavorites} from '../services/appNavigation';
import {useBreakfasts} from '../services/breakfasts';
import {itemAreas} from '../services/contentFilters';
import {useFavorites} from '../services/favorites';
import {formatDuration, useMeditations} from '../services/meditations';
import {TEXT_SCALES, useAppSettings} from '../services/settings';
import {useWebinars} from '../services/webinars';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

const clampRatio = (r: number) => Math.max(0, Math.min(1, r));

function ProgressBar() {
  const {position, duration} = useProgress(500);
  const [barWidth, setBarWidth] = useState(0);
  // While the user scrubs, the bar follows the finger (dragRatio) instead of
  // the playback position; the actual seek happens once, on release.
  const [dragRatio, setDragRatio] = useState<number | null>(null);

  // Refs mirror the latest values for the PanResponder callbacks, which are
  // created once and would otherwise close over stale state.
  const trackRef = useRef<View>(null);
  const trackXRef = useRef(0);
  const widthRef = useRef(0);
  const durationRef = useRef(0);
  const dragRatioRef = useRef(0);
  const pendingSeekRef = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  widthRef.current = barWidth;
  durationRef.current = duration;

  // Ratio from the touch's absolute screen X. locationX is unreliable here —
  // it's relative to whichever child the finger lands on (e.g. the 28px
  // handle), which made grabbing the handle jump the scrubber.
  const ratioFromPageX = (pageX: number) =>
    clampRatio((pageX - trackXRef.current) / Math.max(1, widthRef.current));

  const pan = useRef(
    PanResponder.create({
      // Claim the touch immediately: a drag can start anywhere on the bar,
      // and a tap (grant + release without movement) still seeks.
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: e => {
        const pageX = e.nativeEvent.pageX;
        // Re-measure at touch time in case the layout shifted.
        trackRef.current?.measureInWindow(x => {
          trackXRef.current = x;
          const r = ratioFromPageX(pageX);
          dragRatioRef.current = r;
          setDragRatio(r);
        });
      },
      onPanResponderMove: (_, g) => {
        const r = ratioFromPageX(g.moveX);
        dragRatioRef.current = r;
        setDragRatio(r);
      },
      onPanResponderRelease: () => {
        const d = durationRef.current;
        if (d > 0) {
          // Keep showing the scrubbed position until playback reports a
          // position near the target (see the effect below) — the player
          // returns the OLD position for a few hundred ms after seekTo, and
          // releasing on a fixed timer made the handle snap back and forth.
          pendingSeekRef.current = dragRatioRef.current * d;
          TrackPlayer.seekTo(dragRatioRef.current * d).catch(() => {});
          if (holdTimer.current) clearTimeout(holdTimer.current);
          holdTimer.current = setTimeout(() => {
            pendingSeekRef.current = null;
            setDragRatio(null);
          }, 3000); // safety valve if the seek never lands
        } else {
          setDragRatio(null);
        }
      },
      onPanResponderTerminate: () => setDragRatio(null),
    }),
  ).current;

  // End the post-release hold as soon as the reported position catches up
  // with the seek target.
  useEffect(() => {
    if (
      pendingSeekRef.current != null &&
      Math.abs(position - pendingSeekRef.current) < 1.5
    ) {
      pendingSeekRef.current = null;
      if (holdTimer.current) clearTimeout(holdTimer.current);
      setDragRatio(null);
    }
  }, [position]);
  useEffect(
    () => () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    },
    [],
  );

  const progress =
    dragRatio ?? (duration > 0 ? Math.min(position / duration, 1) : 0);
  const shownPosition = dragRatio != null ? dragRatio * duration : position;

  return (
    <View style={pb.container}>
      <View
        ref={trackRef}
        {...pan.panHandlers}
        hitSlop={{top: 12, bottom: 12}}
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
      </View>
      <View style={pb.timeRow}>
        <Text style={pb.timeText}>{formatTime(shownPosition)}</Text>
        <Text style={pb.timeText}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const pb = StyleSheet.create({
  container: {gap: 6, alignSelf: 'stretch'},
  track: {height: 18, overflow: 'visible'},
  // Per design 448:13170 the unplayed part of the track is solid white.
  trackBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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

// Buffering indicator: the same travelling-light ring the home portrait uses
// (soft glow + bright core arc), circling the play button until audio starts.
// The arc is drawn once and the container is ROTATED with a native-driver
// transform, so the spin stays 60fps even while the JS thread is busy
// downloading audio (animating strokeDashoffset ran on JS and stuttered).
const PLAY_BTN_SIZE = 78;
const RING_R = 35;
const RING_C = 2 * Math.PI * RING_R;
const RING_GLINT = RING_C * 0.28;
const RING_SHOW_DELAY_MS = 200; // don't flash on sub-200ms buffer blips
const RING_FADE_MS = 220;

function BufferingRing({fade}: {fade: Animated.Value}) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const c = PLAY_BTN_SIZE / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, {opacity: fade, transform: [{rotate}]}]}>
      <Svg width={PLAY_BTN_SIZE} height={PLAY_BTN_SIZE}>
        <Circle
          cx={c}
          cy={c}
          r={RING_R}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[RING_GLINT, RING_C]}
        />
        <Circle
          cx={c}
          cy={c}
          r={RING_R}
          stroke="rgba(255,255,255,0.7)"
          strokeWidth={1.5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={[RING_GLINT, RING_C]}
        />
      </Svg>
    </Animated.View>
  );
}

function Controls() {
  const state = usePlaybackState();
  const isPlaying = state.state === State.Playing;
  // Audio is being fetched/buffered (slow networks make this noticeable) —
  // the travelling-light ring makes the wait visible.
  const isLoading =
    state.state === State.Loading || state.state === State.Buffering;

  // Ring fades in after a short delay (skips fast-network blips) and fades
  // out when playback starts; the icon dims on the same curve.
  const fade = useRef(new Animated.Value(0)).current;
  const [ringMounted, setRingMounted] = useState(false);
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setRingMounted(true);
        Animated.timing(fade, {
          toValue: 1,
          duration: RING_FADE_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, RING_SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
    Animated.timing(fade, {
      toValue: 0,
      duration: RING_FADE_MS,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setRingMounted(false);
      }
    });
    return undefined;
  }, [isLoading, fade]);

  const iconOpacity = fade.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.35],
  });

  return (
    <View style={ctrl.row}>
      {/* Replay 10 */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => TrackPlayer.seekBy(-10)}
        style={ctrl.skipBtn}>
        <SvgXml xml={ICON_REPLAY10} width={35} height={35} />
      </TouchableOpacity>

      {/* Play / Pause / Buffering */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={ctrl.playBtn}
        onPress={() => (isPlaying ? TrackPlayer.pause() : TrackPlayer.play())}>
        <Animated.View style={{opacity: iconOpacity}}>
          <SvgXml
            xml={isPlaying ? ICON_PAUSE : ICON_PLAY_TRIANGLE}
            width={isPlaying ? 30 : 24}
            height={isPlaying ? 30 : 24}
          />
        </Animated.View>
        {ringMounted && <BufferingRing fade={fade} />}
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
const DEFAULT_HEADER_H = 82; // visible height of the collapsed sheet header


// translateY snap points: 0 = fully expanded, SHEET_BODY_H = collapsed (the
// body is pushed off the bottom of the screen, leaving only the drag header).
const COLLAPSED_Y = SHEET_BODY_H;
const EXPANDED_Y = 0;

// «Похожие практики» (448:10850) — медитации и вебинары той же сферы жизни,
// что и играющий трек. Если сфера не задана (или в ней больше ничего нет) —
// другие практики того же формата, чтобы вкладка не пустовала.
function SimilarList({track, bottom}: {track: PlayerTrack; bottom: number}) {
  const t = useUIStrings();
  const {openPlayer} = usePlayer();
  const {meditations} = useMeditations();
  const {webinars} = useWebinars();
  const {breakfasts} = useBreakfasts();

  const all = useMemo(
    () => [
      ...meditations.map(m => ({...m, kind: 'meditation' as const})),
      ...webinars.map(w => ({...w, kind: 'webinar' as const})),
      ...breakfasts.map(b => ({...b, kind: 'breakfast' as const})),
    ],
    [meditations, webinars, breakfasts],
  );

  const current = all.find(i => i.id === track.id);
  const currentAreas = current ? itemAreas(current) : [];
  let similar = currentAreas.length
    ? all.filter(
        i =>
          i.id !== track.id &&
          itemAreas(i).some(a => currentAreas.includes(a)),
      )
    : [];
  if (similar.length === 0 && track.kind) {
    similar = all.filter(i => i.id !== track.id && i.kind === track.kind);
  }

  if (similar.length === 0) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          {t('player_similar_placeholder', 'Скоро здесь появятся похожие практики.')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.sheetScroll, {paddingBottom: bottom + 24}]}>
      {similar.map((item, i) => (
        <React.Fragment key={`${item.kind}_${item.id}`}>
          {i > 0 && <View style={styles.similarDivider} />}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.similarRow}
            onPress={() =>
              openPlayer({
                id: item.id,
                title: item.title,
                description: item.description,
                audioUrl: item.audioUrl,
                coverUrl: item.coverUrl,
                durationSeconds: item.durationSeconds,
                kind: item.kind,
              })
            }>
            <RemoteImage
              source={{uri: item.coverUrl}}
              style={styles.similarImg}
              resizeMode="cover"
            />
            <View style={styles.similarTxt}>
              <Text style={styles.similarTitle} numberOfLines={2}>
                {item.title}
              </Text>
              {!!item.durationSeconds && (
                <Text style={styles.similarSub}>
                  {formatDuration(item.durationSeconds)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

function DetailsSheet({
  description,
  track,
}: {
  description: string;
  track: PlayerTrack;
}) {
  const {bottom} = useSafeAreaInsets();
  const t = useUIStrings();
  const {settings} = useAppSettings();
  const textScale = TEXT_SCALES[settings.textSize];
  const tabs = [
    t('player_tab_description', 'Описание'),
    t('player_tab_similar', 'Похожие практики'),
  ];

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
          {tabs.map((label, i) => (
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
            <Text
              style={[
                styles.description,
                {
                  fontSize: Math.round(16 * textScale),
                  lineHeight: Math.round(22 * textScale),
                },
              ]}>
              {description?.trim() ||
                t('player_no_description', 'Описание появится позже.')}
            </Text>
          </ScrollView>
        ) : (
          <SimilarList track={track} bottom={bottom} />
        )}
      </View>
    </Animated.View>
  );
}

export function PlayerScreen() {
  const {isVisible, track, closePlayer, hidePlayer} = usePlayer();
  const {top, bottom} = useSafeAreaInsets();
  const {isFavorite, toggleFavorite} = useFavorites();
  const t = useUIStrings();
  const [showSavedToast, setShowSavedToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hide the toast whenever the player closes or the track changes.
  useEffect(() => {
    setShowSavedToast(false);
  }, [isVisible, track?.id]);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  if (!isVisible || !track) return null;

  const favKind = track.kind;
  const fav = favKind ? isFavorite(favKind, track.id) : false;
  const subtitle =
    track.subtitle ||
    (favKind === 'meditation'
      ? t('player_kind_meditation', 'Медитация')
      : favKind === 'webinar'
      ? t('player_kind_webinar', 'Вебинар')
      : favKind === 'breakfast'
      ? t('player_kind_breakfast', 'Духовный завтрак')
      : '');

  const onHeartPress = () => {
    if (!favKind) return;
    toggleFavorite({
      kind: favKind,
      id: track.id,
      title: track.title,
      description: track.description,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl,
      durationSeconds: track.durationSeconds,
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    // `fav` is the value before the toggle — show the toast only when adding.
    if (!fav) {
      setShowSavedToast(true);
      toastTimer.current = setTimeout(() => setShowSavedToast(false), 4000);
    } else {
      setShowSavedToast(false);
    }
  };

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
        {/* Design 448:13148 layers a second 214° wash over the base gradient —
            a subtle dark tint upper-right fading to pale blue lower-left. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10,44,67,0.2)', 'rgba(10,44,67,0.2)', 'rgba(191,220,240,0.2)']}
          locations={[0, 0.58, 1]}
          start={{x: 0.78, y: 0.09}}
          end={{x: 0.22, y: 0.91}}
          style={styles.bgOverlay}
        />

        {/* Header */}
        <View style={[styles.header, {paddingTop: top + 7}]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={closePlayer}
            style={styles.headerCloseBtn}>
            <SvgXml xml={ICON_CLOSE_PLAYER} width={30} height={30} />
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
              {!!subtitle && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
            {!!favKind && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.heartBtn}
                onPress={onHeartPress}>
                <SvgXml
                  xml={fav ? ICON_HEART_FILLED : ICON_HEART}
                  width={24}
                  height={24}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Progress bar */}
          <ProgressBar />

          {/* Controls */}
          <Controls />
        </View>

        {/* Bottom sheet */}
        <DetailsSheet description={track.description} track={track} />

        {/* «Сохранено» banner (design 448:13206) — overlays the header row
            after the track is added to favorites. */}
        {showSavedToast && (
          <View style={[styles.savedToast, {top: top + 7}]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.savedToastCol}
              onPress={() => {
                setShowSavedToast(false);
                // Hide (don't close) so playback continues and «назад» in
                // Избранное can bring the player right back.
                hidePlayer();
                requestOpenFavorites({fromPlayer: true});
              }}>
              <Text style={styles.savedToastTitle}>
                {t('player_saved_title', 'Сохранено')}
              </Text>
              <View style={styles.savedToastRow}>
                <Text style={styles.savedToastSub}>
                  {t('player_saved_sub', 'Смотреть в разделе')}
                </Text>
                <Text style={styles.savedToastLink}>
                  {t('player_saved_favorites', 'Избранное')}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSavedToast(false)}
              style={styles.savedToastClose}>
              <SvgXml xml={ICON_CLOSE} width={24} height={24} />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bgOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
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
    // Design 448:13149: handle at y=16, tabs at y=43.
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHandle: {
    width: 53,
    height: 3,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 24,
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
  savedToast: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: '#22618D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
  savedToastCol: {
    flex: 1,
    gap: 3,
  },
  savedToastTitle: {
    fontFamily: fonts.manrope.medium,
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '500',
    color: colors.white,
  },
  savedToastRow: {
    flexDirection: 'row',
    gap: 3,
  },
  savedToastSub: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  savedToastLink: {
    ...typography.small,
    color: '#7BC4F3',
  },
  savedToastClose: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ── Похожие практики (448:10850) ─────────────────────────────────────────
  similarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  similarImg: {
    width: 65,
    height: 65,
    borderRadius: 15,
  },
  similarTxt: {
    flex: 1,
    gap: 6,
  },
  similarTitle: {
    ...typography.body,
    color: colors.white,
  },
  similarSub: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  similarDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
