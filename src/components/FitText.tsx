import React, {useMemo, useRef, useState} from 'react';
import {ScrollView, StyleProp, StyleSheet, TextStyle, View} from 'react-native';
import {TEXT_SCALES, useAppSettings} from '../services/settings';
import {Text} from './Text';

// Text that makes itself fit instead of being cut off.
//
// Affirmations vary from a few words to a long paragraph, and every place
// that shows one has a fixed amount of room. FitText tries the style's own
// size first and steps the type down until the whole text fits. Only if it
// still doesn't at the smallest readable size does it give way:
//   maxHeight – the text becomes scrollable inside its area (full-text views)
//   maxLines  – the text ends with an ellipsis (preview cards that lead to a
//               full-text view). The limit is the room `maxLines` lines take
//               at the style's own size, so a smaller size shows more lines.

type Props = {
  children: string;
  /** Base text style; its fontSize and lineHeight are the starting size. */
  style?: StyleProp<TextStyle>;
  /** The smallest size worth reading. */
  minFontSize?: number;
  /** Room available, in points. */
  maxHeight?: number;
  /** Room available, as lines at the base size. Use one or the other. */
  maxLines?: number;
};

const STEP = 1.5; // points between the sizes tried

export function FitText({
  children,
  style,
  minFontSize = 14,
  maxHeight,
  maxLines,
}: Props) {
  const {settings} = useAppSettings();
  const scale = TEXT_SCALES[settings.textSize];
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;
  const baseSize = flat.fontSize ?? 16;
  const ratio = (flat.lineHeight ?? baseSize * 1.3) / baseSize;

  // Candidate sizes, largest first.
  const sizes = useMemo(() => {
    const out: {fontSize: number; lineHeight: number}[] = [];
    const floor = Math.min(minFontSize, baseSize);
    for (let s = baseSize; s > floor; s -= STEP) {
      out.push({fontSize: s, lineHeight: Math.round(s * ratio * 10) / 10});
    }
    out.push({
      fontSize: floor,
      lineHeight: Math.round(floor * ratio * 10) / 10,
    });
    return out;
  }, [baseSize, minFontSize, ratio]);

  // What a line really occupies once the app-wide text-size setting applies.
  const lineAt = (lineHeight: number) =>
    scale === 1 ? lineHeight : Math.round(lineHeight * scale);
  const room =
    maxHeight ?? (maxLines ? maxLines * lineAt(sizes[0].lineHeight) : Infinity);

  // Measure every candidate once (invisible, at the real width), then pick.
  const key = `${children}|${Math.round(room)}|${scale}|${baseSize}`;
  const pending = useRef<{key: string; heights: number[]}>({key, heights: []});
  const [measured, setMeasured] = useState<{key: string; heights: number[]}>();
  if (pending.current.key !== key) {
    pending.current = {key, heights: []};
  }
  const heights = measured?.key === key ? measured.heights : undefined;

  if (!heights) {
    const report = (i: number, h: number) => {
      const p = pending.current;
      p.heights[i] = h;
      if (sizes.every((_, k) => p.heights[k] !== undefined)) {
        setMeasured({key: p.key, heights: [...p.heights]});
      }
    };
    const reserve = Number.isFinite(room)
      ? Math.max(1, Math.floor(room / lineAt(sizes[0].lineHeight)))
      : undefined;
    return (
      <View style={styles.box}>
        {sizes.map((size, i) => (
          <Text
            key={i}
            style={[style, size, styles.probe]}
            onLayout={e => report(i, e.nativeEvent.layout.height)}>
            {children}
          </Text>
        ))}
        {/* Holds roughly the right space so nothing jumps when it settles. */}
        <Text style={[style, styles.hidden]} numberOfLines={reserve}>
          {children}
        </Text>
      </View>
    );
  }

  const fit = heights.findIndex(h => h <= room + 1);
  if (fit >= 0) {
    return (
      <View style={styles.box}>
        <Text style={[style, sizes[fit]]}>{children}</Text>
      </View>
    );
  }

  const smallest = sizes[sizes.length - 1];
  if (maxHeight === undefined) {
    return (
      <View style={styles.box}>
        <Text
          style={[style, smallest]}
          numberOfLines={Math.max(
            1,
            Math.floor(room / lineAt(smallest.lineHeight)),
          )}>
          {children}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.box}>
      <ScrollView
        style={{maxHeight}}
        nestedScrollEnabled
        indicatorStyle="white"
        showsVerticalScrollIndicator>
        <Text style={[style, smallest]}>{children}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
  },
  probe: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
  },
  hidden: {
    opacity: 0,
  },
});
