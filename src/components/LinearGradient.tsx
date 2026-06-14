import React, {useId} from 'react';
import {
  processColor,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';

// react-native-svg's <Stop> ignores the alpha channel of an `rgba()`/8-digit
// color, so a "fade to transparent" stop renders fully opaque. Split the color
// into an opaque RGB string + a separate stopOpacity. processColor handles hex,
// rgb(a), and named colors and returns a 0xAARRGGBB int.
function splitColor(color: string | number): {rgb: string; opacity: number} {
  const c = processColor(color);
  if (typeof c !== 'number') return {rgb: String(color), opacity: 1};
  const argb = c >>> 0;
  const a = ((argb >>> 24) & 0xff) / 255;
  const r = (argb >>> 16) & 0xff;
  const g = (argb >>> 8) & 0xff;
  const b = argb & 0xff;
  return {rgb: `rgb(${r},${g},${b})`, opacity: a};
}

/**
 * Drop-in replacement for `react-native-linear-gradient` backed by
 * react-native-svg.
 *
 * react-native-linear-gradient has no Fabric (New Architecture) codegen spec,
 * so it renders through Fabric's legacy interop layer. With it wrapping the
 * app, mounting/unmounting screens inside it crashed Fabric's view recycler
 * ("Attempt to recycle a mounted view" / "mount already mounted component
 * view"). react-native-svg is Fabric-native, so this version is crash-safe and
 * needs no native rebuild (the lib is already linked).
 *
 * Supports the props this app uses: colors, start, end, locations, style,
 * pointerEvents, children. start/end are in 0..1 bounding-box coordinates,
 * matching react-native-linear-gradient's defaults (vertical, top→bottom).
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

export default function LinearGradient({
  colors,
  start = {x: 0.5, y: 0},
  end = {x: 0.5, y: 1},
  locations,
  style,
  children,
  pointerEvents,
}: Props) {
  const id = useId();
  const lastIndex = Math.max(colors.length - 1, 1);

  return (
    <View style={style} pointerEvents={pointerEvents}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <SvgLinearGradient
            id={id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}>
            {colors.map((color, i) => {
              const {rgb, opacity} = splitColor(color);
              return (
                <Stop
                  key={i}
                  offset={locations?.[i] ?? i / lastIndex}
                  stopColor={rgb}
                  stopOpacity={opacity}
                />
              );
            })}
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}
