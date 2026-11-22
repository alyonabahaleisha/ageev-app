import {useEffect, useRef} from 'react';
import {Animated, Easing} from 'react-native';

// Small motion vocabulary for tap feedback. Everything runs on the native
// driver, so it stays smooth while the tapped screen mounts.

type Spring = {
  /** How long the push away from rest takes, ms. */
  rise?: number;
  stiffness?: number;
  damping?: number;
};

/**
 * A nudge: `value` is pushed from rest (0) to 1, then released and carried
 * back to rest by a spring — one clean overshoot, then still. Drive a
 * translate or a rotation from it and the element feels weighted.
 * It starts from wherever the value is, so repeated taps blend.
 */
export function nudge(
  value: Animated.Value,
  {rise = 110, stiffness = 280, damping = 15}: Spring = {},
) {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 1,
      duration: rise,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      useNativeDriver: true,
    }),
    Animated.spring(value, {
      toValue: 0,
      stiffness,
      damping,
      mass: 1,
      isInteraction: false,
      useNativeDriver: true,
    }),
  ]);
}

/** Runs `start` each time `play` changes (not on mount). */
export function useOnPlay(
  play: number,
  start: () => Animated.CompositeAnimation,
) {
  const first = useRef(true);
  const startRef = useRef(start);
  startRef.current = start;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const anim = startRef.current();
    anim.start();
    return () => anim.stop();
  }, [play]);
}
