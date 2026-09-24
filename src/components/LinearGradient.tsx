import React, {useMemo} from 'react';
import {processColor, StyleProp, View, ViewProps, ViewStyle} from 'react-native';

/**
 * Замена `react-native-linear-gradient` на нативном CSS-градиенте React Native
 * (`experimental_backgroundImage`, New Architecture).
 *
 * История: нативная библиотека react-native-linear-gradient падала в Fabric
 * («Attempt to recycle a mounted view»), поэтому градиент был переписан на
 * react-native-svg. Но react-native-svg на Android рисует каждый <Svg> в
 * отдельный Bitmap размером с вьюшку: полноэкранный фон — это ~10 МБ текстуры,
 * а таких градиентов в дереве десятки. Вместе с картинками это не помещалось в
 * GPU-кэш, и текстуры перезаливались почти на каждом кадре (gfxinfo: 85–100%
 * медленных кадров, «Slow bitmap uploads»). CSS-градиент рисуется самим
 * View через Skia/Vulkan — без Bitmap и без загрузки текстур.
 *
 * API прежний: colors, start, end, locations, style, pointerEvents, children.
 * start/end — в долях 0..1 от размеров блока (по умолчанию сверху вниз).
 */
type Point = {x: number; y: number};

type Props = {
  colors: (string | number)[];
  start?: Point;
  end?: Point;
  locations?: number[];
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
} & Pick<ViewProps, 'pointerEvents'>;

function toRgba(color: string | number): string {
  const c = processColor(color);
  if (typeof c !== 'number') return String(color);
  const argb = c >>> 0;
  const a = ((argb >>> 24) & 0xff) / 255;
  const r = (argb >>> 16) & 0xff;
  const g = (argb >>> 8) & 0xff;
  const b = argb & 0xff;
  return `rgba(${r},${g},${b},${Math.round(a * 1000) / 1000})`;
}

function buildGradient(
  colors: (string | number)[],
  start: Point,
  end: Point,
  locations?: number[],
): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // CSS: 0deg — вверх, 90deg — вправо, 180deg — вниз.
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;

  // Для чисто вертикальных/горизонтальных градиентов CSS-линия идёт от края до
  // края блока, а start/end могут начинаться не с края — пересчитываем стопы.
  let from = 0;
  let to = 1;
  if (dx === 0 && dy !== 0) {
    from = dy > 0 ? start.y : 1 - start.y;
    to = dy > 0 ? end.y : 1 - end.y;
  } else if (dy === 0 && dx !== 0) {
    from = dx > 0 ? start.x : 1 - start.x;
    to = dx > 0 ? end.x : 1 - end.x;
  }

  const last = Math.max(colors.length - 1, 1);
  const stops = colors.map((color, i) => {
    const p = locations?.[i] ?? i / last;
    const pos = (from + p * (to - from)) * 100;
    return `${toRgba(color)} ${Math.round(pos * 100) / 100}%`;
  });
  return `linear-gradient(${Math.round(angle * 100) / 100}deg, ${stops.join(', ')})`;
}

export default function LinearGradient({
  colors,
  start = {x: 0.5, y: 0},
  end = {x: 0.5, y: 1},
  locations,
  style,
  children,
  pointerEvents,
}: Props) {
  const colorsKey = colors.join('|');
  const locKey = locations?.join('|') ?? '';
  const backgroundImage = useMemo(
    () => buildGradient(colors, start, end, locations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorsKey, locKey, start.x, start.y, end.x, end.y],
  );

  return (
    <View
      style={[style, {experimental_backgroundImage: backgroundImage}]}
      pointerEvents={pointerEvents}>
      {children}
    </View>
  );
}
