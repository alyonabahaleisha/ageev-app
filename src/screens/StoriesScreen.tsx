import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_CLOSE, ICON_SHARE} from '../assets/icons';
import {STORY_SLIDES} from '../components/stories/StorySlides';
import {colors} from '../theme/colors';

const STORY_DURATION = 6000; // ms per slide
const HOLD_THRESHOLD = 200; // ms; longer press = hold-to-pause, not a tap
const SWIPE_DISTANCE = 50; // px of horizontal travel that counts as a swipe
const TAP_SLOP = 10; // px of travel still treated as a stationary tap
const MARGIN = 24;
const SCREEN_W = Dimensions.get('window').width;

type Props = {onClose: () => void};

// Instagram-style stories viewer: auto-advancing segments up top, tap the right
// side to skip forward / left to go back, press-and-hold to pause.
export function StoriesScreen({onClose}: Props) {
  const {top} = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  // Slides whose background image has finished decoding. A slide is only
  // revealed (and its timer started) once it's in here, so it appears fully
  // formed instead of painting in parts.
  const [ready, setReady] = useState<Set<number>>(() => new Set());
  const progress = useRef(new Animated.Value(0)).current;
  const progressValue = useRef(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const pressStart = useRef(0);

  const last = STORY_SLIDES.length - 1;
  const slide = STORY_SLIDES[index];

  useEffect(() => {
    const id = progress.addListener(({value}) => {
      progressValue.current = value;
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const markReady = useCallback((i: number) => {
    setReady(prev => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    if (index < last) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  }, [index, last, onClose]);

  const run = useCallback(
    (from: number) => {
      animRef.current?.stop();
      progress.setValue(from);
      const anim = Animated.timing(progress, {
        toValue: 1,
        duration: STORY_DURATION * (1 - from),
        easing: Easing.linear,
        useNativeDriver: false, // animating width %
      });
      animRef.current = anim;
      anim.start(({finished}) => {
        if (finished) goNext();
      });
    },
    [goNext, progress],
  );

  // Start (or restart) the timer when the active slide changes — but only once
  // that slide's image is decoded, so the progress bar doesn't run ahead of a
  // slide that hasn't appeared yet.
  useEffect(() => {
    if (!ready.has(index)) {
      progress.setValue(0); // hold the segment empty until the media is ready
      return;
    }
    run(0);
    return () => animRef.current?.stop();
  }, [index, ready, run, progress]);

  const pause = useCallback(() => animRef.current?.stop(), []);
  const resume = useCallback(() => run(progressValue.current), [run]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex(index - 1);
    } else {
      run(0); // already first: restart it
    }
  }, [index, run]);

  // A finger down pauses immediately ("hold to wait and read"). On release we
  // decide what the gesture was: a horizontal swipe navigates, a stationary
  // quick tap navigates by side, and anything held longer is treated as a
  // pause-and-read so we just resume.
  const onGrant = useCallback(() => {
    pressStart.current = Date.now();
    pause();
  }, [pause]);

  const onRelease = useCallback(
    (
      e: {nativeEvent: {pageX: number}},
      g: {dx: number; dy: number},
    ) => {
      const held = Date.now() - pressStart.current;
      const {dx, dy} = g;

      // Swipe: horizontal travel beyond the threshold, more horizontal than
      // vertical. Swipe left → next, swipe right → previous.
      if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? goNext() : goPrev();
        return; // index change restarts the timer; no manual resume needed
      }

      // Stationary quick tap → navigate by which side was tapped.
      if (
        held < HOLD_THRESHOLD &&
        Math.abs(dx) < TAP_SLOP &&
        Math.abs(dy) < TAP_SLOP
      ) {
        e.nativeEvent.pageX < SCREEN_W * 0.3 ? goPrev() : goNext();
        return;
      }

      // It was a hold (read) or an aborted gesture; resume where we paused.
      resume();
    },
    [goNext, goPrev, resume],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Own taps/holds that land on empty areas (bubbles up to the root),
        // but don't capture on start — so the slide CTAs and the close button
        // still receive their own taps.
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        // A horizontal drag is a swipe: capture it even when it begins over a
        // button, so swiping always navigates. Vertical/short moves are left
        // to children.
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8,
        onMoveShouldSetPanResponderCapture: (_, g) =>
          Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: onGrant,
        onPanResponderRelease: onRelease,
        onPanResponderTerminate: () => resume(),
      }),
    [onGrant, onRelease, resume],
  );

  return (
    // Gesture handling lives on the root: it handles tap-to-navigate (left 30%
    // = back), hold-to-pause-and-read, and swipe left/right between slides,
    // while the slide CTAs / close button keep capturing their own taps.
    <View style={styles.root} {...panResponder.panHandlers}>
      {/* All slides stay mounted and stacked so their backgrounds decode in
          the background; once decoded a slide reports ready and later advances
          are an instant opacity swap with no decode flash. Inactive slides are
          pointerEvents="none"; the active slide is box-none so empty areas fall
          through to the root's gesture handler. */}
      {STORY_SLIDES.map((s, i) => {
        const SlideComponent = s.Component;
        // The active slide is only shown once its image has loaded; until then
        // the viewer's solid background shows, so the slide appears all at once.
        const visible = i === index && ready.has(i);
        return (
          <View
            key={s.key}
            style={[StyleSheet.absoluteFill, !visible && styles.hiddenSlide]}
            pointerEvents={i === index ? 'box-none' : 'none'}>
            <SlideComponent onCta={onClose} onReady={() => markReady(i)} />
          </View>
        );
      })}

      {/* Progress segments */}
      <View style={[styles.progressRow, {top: top + 8}]} pointerEvents="none">
        {STORY_SLIDES.map((s, i) => (
          <Segment key={s.key} index={i} active={index} progress={progress} />
        ))}
      </View>

      {/* Header: close + optional share */}
      <View style={[styles.header, {top: top + 8 + 3 + 16}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.closeBtn}>
          <SvgXml xml={ICON_CLOSE} width={30} height={30} />
        </TouchableOpacity>
        {slide.headerShare ? (
          <TouchableOpacity activeOpacity={0.8} style={styles.shareBtn}>
            <SvgXml xml={ICON_SHARE} width={24} height={24} />
          </TouchableOpacity>
        ) : (
          <View style={styles.closeBtn} />
        )}
      </View>
    </View>
  );
}

function Segment({
  index,
  active,
  progress,
}: {
  index: number;
  active: number;
  progress: Animated.Value;
}) {
  const fillWidth = useMemo(() => {
    if (index < active) return '100%';
    if (index > active) return '0%';
    return progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });
  }, [index, active, progress]);

  return (
    <View style={styles.segmentTrack}>
      <Animated.View style={[styles.segmentFill, {width: fillWidth as any}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  hiddenSlide: {
    opacity: 0,
  },

  // Progress
  progressRow: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    gap: 3,
  },
  segmentTrack: {
    flex: 1,
    height: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  segmentFill: {
    height: 3,
    borderRadius: 10,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
