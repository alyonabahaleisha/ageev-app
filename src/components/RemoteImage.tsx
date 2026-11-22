import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import FastImage, {FastImageProps, Source} from '@d11/react-native-fast-image';
import {
  getRegion,
  probeMirrors,
  regionOfUrl,
  resolveMediaUrl,
  subscribeRegion,
} from '../services/mediaRegion';
import {useReduceMotion} from '../services/reduceMotion';
import LinearGradient from './LinearGradient';

/** Текущее зеркало медиа; перерисовывает компонент при переключении. */
export function useMediaRegion() {
  const [region, setRegion] = useState(getRegion());
  useEffect(() => subscribeRegion(() => setRegion(getRegion())), []);
  return region;
}

// Images that have already been shown in this session. Those come back from
// the cache at once, so they are drawn straight away — no placeholder, no
// fade — and revisiting a screen never flickers.
const shown = new Set<string>();

/**
 * Thin wrapper over FastImage for remote cover art.
 *
 * Plain RN <Image source={{uri}}> has no real disk cache, so the same cover
 * re-downloads every time a screen mounts — that's why some screens felt slow.
 * FastImage caches to disk keyed by URL, so a cover is fetched once and then
 * served instantly everywhere it appears (e.g. a card cover reused full-size in
 * the player). Supports children, so it also replaces <ImageBackground>.
 *
 * While an image is on its way its place is held by a soft surface in the
 * app's palette (see ImageVeil) that cross-fades into the picture when it
 * arrives, instead of an empty hole that the picture pops into. Anything
 * drawn on top of the image (titles, buttons) is there from the start.
 */
export function RemoteImage(props: FastImageProps) {
  const source = props.source as Source;
  // Подписка на регион: при переключении зеркала обложки перезапрашиваются
  // с нового хоста (uri меняется → FastImage грузит заново).
  useMediaRegion();
  const uri = resolveMediaUrl(source?.uri) ?? source?.uri;
  const {onError, onLoad, children} = props;

  // Decided once per image, before it loads: was it already seen?
  const instant = useMemo(() => !uri || shown.has(uri), [uri]);
  const [loadedUri, setLoadedUri] = useState<string | undefined>(undefined);

  const handleError = useCallback<NonNullable<FastImageProps['onError']>>(
    (...args) => {
      // Обложка с зеркала не загрузилась — повод перепроверить зеркала. Само
      // зеркало не штрафуем: одиночный 404 не должен переключать все медиа.
      if (regionOfUrl(uri)) {
        probeMirrors({force: true}).catch(() => {});
      }
      onError?.(...args);
    },
    [uri, onError],
  );
  const handleLoad = useCallback<NonNullable<FastImageProps['onLoad']>>(
    (...args) => {
      if (uri) {
        shown.add(uri);
        setLoadedUri(uri);
      }
      onLoad?.(...args);
    },
    [uri, onLoad],
  );

  return (
    <FastImage
      {...props}
      source={{
        cache: FastImage.cacheControl.immutable,
        priority: FastImage.priority.normal,
        ...source,
        uri,
      }}
      onError={handleError}
      onLoad={handleLoad}>
      {!instant && <ImageVeil key={uri} loaded={loadedUri === uri} />}
      {children}
    </FastImage>
  );
}

// ── Placeholder ─────────────────────────────────────────────────────────────
const VEIL_COLORS = ['#4B8DBB', '#35759F']; // a shade lighter than the app's blue
const SHEEN_COLORS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.14)',
  'rgba(255,255,255,0)',
];
const SHEEN_AFTER_MS = 200; // quick loads never show a sheen at all
const REVEAL_MS = 280;

/**
 * Holds an image's place while it loads: a quiet surface with a slow sheen
 * passing over it. When `loaded` turns true it fades away to reveal the
 * image beneath and then removes itself. Sits above the image and below the
 * image's children.
 */
function ImageVeil({loaded}: {loaded: boolean}) {
  const {height: windowHeight} = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const opacity = useRef(new Animated.Value(1)).current;
  const sweep = useRef(new Animated.Value(0)).current;
  const [size, setSize] = useState<{w: number; h: number} | null>(null);
  const [slow, setSlow] = useState(false);
  const [gone, setGone] = useState(false);

  // Only an image that is actually taking a while gets the sheen.
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SHEEN_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }
    Animated.timing(opacity, {
      toValue: 0,
      duration: REVEAL_MS,
      easing: Easing.out(Easing.quad),
      isInteraction: false,
      useNativeDriver: true,
    }).start(({finished}) => finished && setGone(true));
  }, [loaded, opacity]);

  // The sheen is for cards and covers. Across a full-screen background it
  // would be a searchlight, so those just hold the surface and cross-fade.
  const sheen =
    slow &&
    !loaded &&
    !reduceMotion &&
    !!size &&
    size.h < windowHeight * 0.6 &&
    size.w > 40;

  useEffect(() => {
    if (!sheen) {
      return;
    }
    sweep.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1150,
          easing: Easing.inOut(Easing.quad),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.delay(450),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sheen, sweep]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const {width: w, height: h} = e.nativeEvent.layout;
    setSize(prev => (prev && prev.w === w && prev.h === h ? prev : {w, h}));
  }, []);

  if (gone) {
    return null;
  }

  const band = size ? Math.max(60, size.w * 0.55) : 0;
  return (
    <Animated.View
      pointerEvents="none"
      onLayout={onLayout}
      style={[styles.veil, {opacity}]}>
      <LinearGradient
        colors={VEIL_COLORS}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />
      {sheen && size && (
        <Animated.View
          style={[
            styles.sheen,
            {
              width: band,
              transform: [
                {
                  translateX: sweep.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-band * 1.3, size.w + band * 0.3],
                  }),
                },
                {rotate: '16deg'},
              ],
            },
          ]}>
          <LinearGradient
            colors={SHEEN_COLORS}
            start={{x: 0, y: 0.5}}
            end={{x: 1, y: 0.5}}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </Animated.View>
  );
}

/**
 * Warm the disk cache for a batch of remote image URLs ahead of time, so they
 * are already available when the user navigates to the screen that shows them.
 * Best-effort: FastImage.preload() delegates to a native module that may be
 * unavailable in some builds, so guard against it to avoid a fatal crash —
 * images still disk-cache when rendered by <FastImage>.
 */
export function prefetchImages(urls: (string | null | undefined)[]) {
  const sources = urls
    .filter((u): u is string => !!u)
    .map(u => ({
      uri: resolveMediaUrl(u) ?? u,
      cache: FastImage.cacheControl.immutable,
    }));
  if (!sources.length || typeof FastImage?.preload !== 'function') {
    return;
  }
  try {
    FastImage.preload(sources);
  } catch {
    // no-op: prefetch is best-effort
  }
}

const styles = StyleSheet.create({
  veil: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: '-30%',
    bottom: '-30%',
    left: 0,
  },
});
