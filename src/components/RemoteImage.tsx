import React from 'react';
import FastImage, {FastImageProps, Source} from '@d11/react-native-fast-image';

/**
 * Thin wrapper over FastImage for remote cover art.
 *
 * Plain RN <Image source={{uri}}> has no real disk cache, so the same cover
 * re-downloads every time a screen mounts — that's why some screens felt slow.
 * FastImage caches to disk keyed by URL, so a cover is fetched once and then
 * served instantly everywhere it appears (e.g. a card cover reused full-size in
 * the player). Supports children, so it also replaces <ImageBackground>.
 */
export function RemoteImage(props: FastImageProps) {
  const source = props.source as Source;
  return (
    <FastImage
      {...props}
      source={{
        cache: FastImage.cacheControl.immutable,
        priority: FastImage.priority.normal,
        ...source,
      }}
    />
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
    .map(uri => ({uri, cache: FastImage.cacheControl.immutable}));
  if (!sources.length || typeof FastImage?.preload !== 'function') {
    return;
  }
  try {
    FastImage.preload(sources);
  } catch {
    // no-op: prefetch is best-effort
  }
}
