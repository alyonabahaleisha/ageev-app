import React from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from './LinearGradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Height of the header row content (avatar / title / search button).
export const HEADER_CONTENT_HEIGHT = 47;
// Gap above the header content, matching the original scroll paddingTop.
export const HEADER_TOP_GAP = 7;
// Extra space below the header where scrolling content fades out behind it.
const FADE_HEIGHT = 24;

/**
 * Top padding a ScrollView needs so its content starts below the fixed header
 * instead of underneath it. Pass the safe-area top inset.
 */
export function headerScrollPadding(topInset: number) {
  return topInset + HEADER_TOP_GAP + HEADER_CONTENT_HEIGHT;
}

/**
 * Pins a screen header to the top so it stays put while content scrolls under
 * it. Render as a sibling overlay above a ScrollView; give the ScrollView
 * `paddingTop: headerScrollPadding(top)` so its content clears the header.
 */
export function FixedHeader({children}: {children: React.ReactNode}) {
  const {top} = useSafeAreaInsets();
  const paddingTop = top + HEADER_TOP_GAP;
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Solid top fading to transparent so content scrolls away cleanly. */}
      <LinearGradient
        colors={['#22618D', '#22618D', 'rgba(34,97,141,0)']}
        locations={[0, 0.7, 1]}
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {height: paddingTop + HEADER_CONTENT_HEIGHT + FADE_HEIGHT},
        ]}
      />
      <View style={{paddingTop}}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
