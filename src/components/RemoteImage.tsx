import React, {useCallback, useEffect, useState} from 'react';
import FastImage, {FastImageProps, Source} from '@d11/react-native-fast-image';
import {
  getRegion,
  probeMirrors,
  regionOfUrl,
  resolveMediaUrl,
  subscribeRegion,
} from '../services/mediaRegion';

/** Текущее зеркало медиа; перерисовывает компонент при переключении. */
export function useMediaRegion() {
  const [region, setRegion] = useState(getRegion());
  useEffect(() => subscribeRegion(() => setRegion(getRegion())), []);
  return region;
}

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
  // Подписка на регион: при переключении зеркала обложки перезапрашиваются
  // с нового хоста (uri меняется → FastImage грузит заново).
  useMediaRegion();
  const uri = resolveMediaUrl(source?.uri) ?? source?.uri;
  const {onError} = props;
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
