import {MutableRefObject, RefObject, useRef} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';

// Tabs are unmounted while hidden (cheaper to draw), which used to drop you
// back at the top every time you returned to one. This remembers where each
// was scrolled, for the life of the app session.

const offsets = new Map<string, number>();

/**
 * Spread the result onto a ScrollView to have it reopen where it was left:
 *   <ScrollView {...useScrollMemory('profile')} />
 * Pass the screen's own ref if it has one; the spread supplies the `ref`
 * prop and keeps that ref pointing at the scroll view.
 */
export function useScrollMemory(
  key: string,
  ref?: RefObject<ScrollView | null>,
) {
  const own = useRef<ScrollView>(null);
  const target = ref ?? own;
  // Position still waiting to be restored (0 = nothing pending). It can only
  // be applied once the content has been laid out tall enough to hold it —
  // a freshly mounted list is empty for a moment — and until then the scroll
  // view reports offset 0, which must not overwrite what we remember.
  const pending = useRef(0);
  // Armed each time the scroll view itself mounts — not once per hook — since
  // the scroll view can come and go while its owner stays mounted (Home).
  const attach = useRef((node: ScrollView | null) => {
    (target as MutableRefObject<ScrollView | null>).current = node;
    if (node) {
      pending.current = offsets.get(key) ?? 0;
    }
  }).current;

  const handlers = useRef({
    onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (pending.current === 0) {
        offsets.set(key, e.nativeEvent.contentOffset.y);
      }
    },
    onContentSizeChange: (_w: number, h: number) => {
      const y = pending.current;
      if (y > 0 && h >= y + Dimensions.get('window').height * 0.5) {
        pending.current = 0;
        target.current?.scrollTo({y, animated: false});
      }
    },
    // The user took over before the restore happened: let them.
    onScrollBeginDrag: () => {
      pending.current = 0;
    },
  }).current;

  return {ref: attach, scrollEventThrottle: 64, ...handlers};
}

/** Forget a remembered position (the next mount starts at the top). */
export function forgetScroll(key: string) {
  offsets.delete(key);
}
