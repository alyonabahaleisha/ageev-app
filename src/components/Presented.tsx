import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {useReduceMotion} from '../services/reduceMotion';
import {GradientBackground} from './GradientBackground';

// How a full-screen destination arrives and leaves.
//
//   push – a page deeper in the same flow. Slides in from the right over the
//          screen beneath, which dims a little; leaves the same way. On iOS it
//          can be dragged away from the left edge and follows the finger.
//   zoom – an immersive surface (stories). Fades up from slightly smaller.
//   fade – a plain cross-fade, also what push/zoom fall back to under
//          Reduce Motion.
//
// The content stays mounted while it animates out, so the screen you are
// leaving is still there to watch go. Transform/opacity on the native driver.

export type Presentation = 'push' | 'zoom' | 'fade';

type Props = {
  shown: boolean;
  kind?: Presentation;
  /**
   * Dismiss handler for the edge swipe (push, iOS). Omit it on screens whose
   * own content scrolls sideways from the left edge.
   */
  onSwipeBack?: () => void;
  /**
   * Stacking order among sibling layers. Give it to layers that must sit
   * above fixed headers (zIndex 10) of whatever is beneath them.
   */
  zIndex?: number;
  /** Keep the content mounted (invisible) while hidden — for costly screens. */
  keepMounted?: boolean;
  /**
   * True once the screen has fully arrived and hides what is beneath; false
   * as soon as it starts to leave or is being dragged. Lets the owner drop
   * the covered screen and bring it back in time for the way out.
   */
  onCoveredChange?: (covered: boolean) => void;
  /**
   * Supply the 0→1 arrival value instead of letting the layer own it, so the
   * owner can move what is beneath in step with it (see `useRecede`).
   */
  progress?: Animated.Value;
  children: React.ReactNode;
};

const EDGE_WIDTH = 30; // where a back-swipe may start, pt from the left
const SCRIM_OPACITY = 0.32;
// UIKit's navigation push: a stiff, critically damped spring — quick off the
// mark, long soft landing, no bounce.
const PUSH_SPRING = {
  stiffness: 1000,
  damping: 500,
  mass: 3,
  overshootClamping: true,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
};

/** How far the screen beneath slides left as a page arrives over it. */
const RECEDE = 0.28;

/**
 * Transform for the screen beneath pushed pages: it slides a little to the
 * left as a page arrives and comes back as the page leaves — the same depth
 * cue as a native navigation stack. Pass the `progress` values of every page
 * that can cover it.
 */
export function useRecede(pages: Animated.Value[]) {
  const {width} = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  return useMemo(() => {
    if (reduceMotion || pages.length === 0) {
      return undefined;
    }
    const total = pages
      .slice(1)
      .reduce<Animated.Animated>((sum, p) => Animated.add(sum, p), pages[0]);
    return {
      transform: [
        {
          translateX: (total as Animated.AnimatedAddition<number>).interpolate({
            inputRange: [0, 1],
            outputRange: [0, -width * RECEDE],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
    // The page values are refs owned by the caller and never change identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, reduceMotion]);
}

type Phase = 'hidden' | 'entering' | 'shown' | 'dragging' | 'exiting';

export function Presented({
  shown,
  kind = 'push',
  onSwipeBack,
  zIndex,
  keepMounted = false,
  onCoveredChange,
  progress: externalProgress,
  children,
}: Props) {
  const {width} = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const mode: Presentation = reduceMotion ? 'fade' : kind;

  // 0 = away, 1 = fully on screen.
  const progressRef = useRef<Animated.Value | null>(null);
  if (progressRef.current === null) {
    // Once, on mount: start where `shown` says, without an entrance.
    progressRef.current = externalProgress ?? new Animated.Value(0);
    progressRef.current.setValue(shown ? 1 : 0);
  }
  const progress = progressRef.current;
  const phase = useRef<Phase>(shown ? 'shown' : 'hidden');
  const [mounted, setMounted] = useState(shown || keepMounted);

  // The last content we were asked to show: owners usually clear the data a
  // screen needs at the same moment they hide it, and it still has to render
  // on its way out.
  const content = useRef(children);
  if (shown) {
    content.current = children;
  }

  // Latest values for callbacks that outlive a render (gestures, animations).
  const live = useRef({width, mode, onSwipeBack, onCoveredChange, keepMounted});
  live.current = {width, mode, onSwipeBack, onCoveredChange, keepMounted};

  const run = (to: 0 | 1, velocity: number, done: () => void) => {
    const anim =
      live.current.mode === 'push'
        ? Animated.spring(progress, {
            toValue: to,
            velocity,
            ...PUSH_SPRING,
            isInteraction: false,
            useNativeDriver: true,
          })
        : Animated.timing(progress, {
            toValue: to,
            duration: to ? 240 : 190,
            easing: to ? Easing.out(Easing.cubic) : Easing.in(Easing.quad),
            isInteraction: false,
            useNativeDriver: true,
          });
    anim.start(({finished}) => finished && done());
  };

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      // Present from the start (or restored by its owner): no entrance.
      first.current = false;
      live.current.onCoveredChange?.(shown);
      return;
    }
    if (shown) {
      phase.current = 'entering';
      setMounted(true);
      run(1, 0, () => {
        phase.current = 'shown';
        live.current.onCoveredChange?.(true);
      });
    } else if (phase.current === 'hidden') {
      // Already swiped away; nothing left to animate.
      setMounted(live.current.keepMounted);
    } else {
      phase.current = 'exiting';
      live.current.onCoveredChange?.(false);
      run(0, 0, () => {
        phase.current = 'hidden';
        setMounted(live.current.keepMounted);
      });
    }
    // `run` only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  // Edge swipe: claimed in the capture phase only for a horizontal drag that
  // starts at the left edge, so taps and vertical scrolling pass through.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          Platform.OS === 'ios' &&
          live.current.mode === 'push' &&
          !!live.current.onSwipeBack &&
          phase.current === 'shown' &&
          g.x0 < EDGE_WIDTH &&
          g.dx > 10 &&
          Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
          phase.current = 'dragging';
          live.current.onCoveredChange?.(false);
        },
        onPanResponderMove: (_e, g) => {
          const p = 1 - g.dx / live.current.width;
          progress.setValue(Math.max(0, Math.min(1, p)));
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_e, g) => settle(g.dx, g.vx),
        onPanResponderTerminate: (_e, g) => settle(g.dx, g.vx),
      }),
    // `settle` only reads refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function settle(dx: number, vx: number) {
    const w = live.current.width;
    // Far enough, or flicked: carry on out with the finger's speed.
    if (dx > w * 0.33 || vx > 0.5) {
      phase.current = 'exiting';
      run(0, -vx / w, () => {
        phase.current = 'hidden';
        live.current.onSwipeBack?.();
      });
    } else {
      phase.current = 'entering';
      run(1, 0, () => {
        phase.current = 'shown';
        live.current.onCoveredChange?.(true);
      });
    }
  }

  if (!mounted) {
    return null;
  }

  const panel =
    mode === 'push'
      ? {
          transform: [
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [width, 0],
              }),
            },
          ],
        }
      : mode === 'zoom'
      ? {
          opacity: progress,
          transform: [
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.94, 1],
              }),
            },
          ],
        }
      : {opacity: progress};

  return (
    <View
      collapsable={false}
      pointerEvents={shown ? 'auto' : 'none'}
      style={[styles.fill, zIndex !== undefined && {zIndex}]}>
      {mode === 'push' && (
        // What is beneath recedes into shade as the page slides over it.
        <Animated.View
          pointerEvents="none"
          style={[
            styles.fill,
            styles.scrim,
            {
              opacity: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, SCRIM_OPACITY],
              }),
            },
          ]}
        />
      )}
      <Animated.View
        style={[styles.fill, mode === 'push' && styles.pushed, panel]}
        {...pan.panHandlers}>
        {/* A page must be solid while it slides, even if its own background
            is still loading or fading in. */}
        {mode === 'push' && (
          <GradientBackground style={styles.fill}>{null}</GradientBackground>
        )}
        {content.current}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrim: {
    backgroundColor: '#000',
  },
  pushed: {
    shadowColor: '#000',
    shadowOffset: {width: -6, height: 0},
    shadowOpacity: 0.22,
    shadowRadius: 14,
  },
});
