import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {Text} from './Text';
import {BlurView} from '@react-native-community/blur';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useOnPlay} from '../services/motion';
import {useReduceMotion} from '../services/reduceMotion';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {TabIcon, TabIconName} from './TabIcons';

// ─── Figma-exact constants ────────────────────────────────────────────────────
const {width: SCREEN_W} = Dimensions.get('window');
const PILL_SIDE_MARGIN = 10; // x:10 in Figma (Frame 311 → nav pill)
const PILL_WIDTH = SCREEN_W - PILL_SIDE_MARGIN * 2;
const PILL_H_PAD = 15; // padding: 10px 15px
const PILL_V_PAD = 10;
const TAB_COUNT = 5;
const TAB_GAP = 6; // gap: 6 in Frame 310
const INNER_W = PILL_WIDTH - PILL_H_PAD * 2;
const TAB_W = (INNER_W - TAB_GAP * (TAB_COUNT - 1)) / TAB_COUNT;
const ICON_SIZE = 24;
const TAB_ICON_GAP = 5; // gap: 5 in each tab item
const CIRCLE_SIZE = 65; // 65×65 from Figma (Frame 24)
const CIRCLE_ABOVE_PILL = 32; // circle top is 32px above pill top (y:15 vs y:47 in Frame 311)
const PILL_BORDER_RADIUS = 50;
const CIRCLE_TAB_INDEX = 2; // only the center tab (Практики) gets the floating circle
const WAVE_SIZE = CIRCLE_SIZE * 2; // the circle's wave at its widest
const INACTIVE_OPACITY = 0.6;

type Tab = {key: TabIconName; label: string};

const TABS: Tab[] = [
  {key: 'home', label: 'Главная'},
  {key: 'thinking', label: 'Мышление'},
  {key: 'practices', label: 'Практики'},
  {key: 'club', label: 'Клуб'},
  {key: 'profile', label: 'Профиль'},
];

// Circle left offset relative to the pill's left edge
function circleLeft(index: number): number {
  const tabCenterX = PILL_H_PAD + index * (TAB_W + TAB_GAP) + TAB_W / 2;
  return tabCenterX - CIRCLE_SIZE / 2;
}

// ─── Tap feedback (all native-driver) ────────────────────────────────────────
/**
 * The control sinks under the finger and springs back on release, passing
 * its resting size once before it settles. Returns the scale to apply.
 */
function usePressSpring(depth: number) {
  const pressed = useRef(new Animated.Value(0)).current;
  const onPressIn = () =>
    Animated.timing(pressed, {
      toValue: 1,
      duration: 90,
      easing: Easing.out(Easing.quad),
      isInteraction: false,
      useNativeDriver: true,
    }).start();
  const onPressOut = () =>
    Animated.spring(pressed, {
      toValue: 0,
      stiffness: 300,
      damping: 14,
      mass: 1,
      isInteraction: false,
      useNativeDriver: true,
    }).start();
  const scale = pressed.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1 - depth],
  });
  return {scale, onPressIn, onPressOut};
}

/** 0.6 → 1 as the tab becomes active; a soft fade instead of a hard switch. */
function useActiveFade(active: boolean) {
  const on = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(on, {
      toValue: active ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      isInteraction: false,
      useNativeDriver: true,
    }).start();
  }, [active, on]);
  return on.interpolate({
    inputRange: [0, 1],
    outputRange: [INACTIVE_OPACITY, 1],
  });
}

// ─── Tab in the pill ─────────────────────────────────────────────────────────
function TabButton({
  tab,
  label,
  active,
  iconHidden,
  play,
  onPress,
}: {
  tab: Tab;
  label: string;
  active: boolean;
  /** The centre tab's icon lives in the floating circle instead. */
  iconHidden: boolean;
  play: number;
  onPress: () => void;
}) {
  const {scale, onPressIn, onPressOut} = usePressSpring(0.07);
  const opacity = useActiveFade(active);

  return (
    <Pressable
      style={styles.tabItem}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{selected: active}}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}>
      <Animated.View
        style={[styles.tabContent, {opacity, transform: [{scale}]}]}>
        <View style={[styles.iconSlot, iconHidden && styles.iconSlotHidden]}>
          <TabIcon name={tab.key} size={ICON_SIZE} play={play} />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Floating circle (Практики) ──────────────────────────────────────────────
/**
 * The circle's wave: a soft ring of light, brightest at its rim and feathered
 * on both sides. Drawn at its widest size and only ever shown smaller, so it
 * stays smooth.
 */
function Wave() {
  return (
    <Svg width={WAVE_SIZE} height={WAVE_SIZE} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient
          id="wave"
          cx="50"
          cy="50"
          r="50"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0.62" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.9" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#wave)" />
    </Svg>
  );
}

function CircleButton({
  tab,
  label,
  active,
  play,
  onPress,
}: {
  tab: Tab;
  label: string;
  active: boolean;
  play: number;
  onPress: () => void;
}) {
  const {scale, onPressIn, onPressOut} = usePressSpring(0.06);
  const wave = useRef(new Animated.Value(1)).current;
  useOnPlay(play, () => {
    wave.setValue(0);
    return Animated.timing(wave, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      isInteraction: false,
      useNativeDriver: true,
    });
  });

  return (
    <View
      pointerEvents="box-none"
      style={[styles.circleAnchor, {left: circleLeft(CIRCLE_TAB_INDEX)}]}>
      {/* One wave leaves from under the circle's rim and fades as it widens. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wave,
          {
            opacity: wave.interpolate({
              inputRange: [0, 0.15, 1],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                scale: wave.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.52, 0.94],
                }),
              },
            ],
          },
        ]}>
        <Wave />
      </Animated.View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{selected: active}}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}>
        <Animated.View
          style={[
            styles.activeCircle,
            active && styles.activeCircleLit,
            {transform: [{scale}]},
          ]}>
          <TabIcon name={tab.key} size={ICON_SIZE} play={play} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

type Props = {
  activeIndex?: number;
  onTabPress?: (index: number) => void;
};

export function BottomNavBar({activeIndex: controlledIndex, onTabPress}: Props) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex ?? internalIndex;
  const insets = useSafeAreaInsets();
  const t = useUIStrings();
  const reduceMotion = useReduceMotion();
  // One counter per tab; bumping it plays that tab's tap response.
  const [plays, setPlays] = useState(() => TABS.map(() => 0));

  function handlePress(index: number) {
    if (!reduceMotion) {
      setPlays(prev => prev.map((n, i) => (i === index ? n + 1 : n)));
    }
    if (controlledIndex === undefined) setInternalIndex(index);
    onTabPress?.(index);
  }

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, {bottom: insets.bottom}]}>

      {/* Pill — shadow wrapper sits at marginTop:32 so circle can float above */}
      <View style={styles.pillShadow}>
        <View style={styles.pillClip}>
          {Platform.OS === 'ios' ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType="light"
              blurAmount={20}
              reducedTransparencyFallbackColor="rgba(255,255,255,0.14)"
            />
          ) : (
            // Android: живой BlurView перерисовывает размытие каждый кадр и
            // ронял fps при кроссфейде экранов под панелью. Статичная
            // полупрозрачная подложка вместо него — переходы плавные.
            <View
              style={[
                StyleSheet.absoluteFill,
                {backgroundColor: 'rgba(255,255,255,0.55)'},
              ]}
            />
          )}
          {/* Semi-transparent overlay: rgba(255,255,255,0.14) from Figma */}
          <View style={styles.pillOverlay} />
          <View style={styles.tabRow}>
            {TABS.map((tab, index) => (
              <TabButton
                key={tab.key}
                tab={tab}
                label={t(`nav_${tab.key}`, tab.label)}
                active={index === activeIndex}
                // Center tab icon always lives in the floating circle
                iconHidden={index === CIRCLE_TAB_INDEX}
                play={plays[index]}
                onPress={() => handlePress(index)}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Floating circle — always visible for center tab (Практики).
          It overlays the center tab's touchable, so it must handle the press
          itself and route to the same tab. */}
      <CircleButton
        tab={TABS[CIRCLE_TAB_INDEX]}
        label={t(
          `nav_${TABS[CIRCLE_TAB_INDEX].key}`,
          TABS[CIRCLE_TAB_INDEX].label,
        )}
        active={activeIndex === CIRCLE_TAB_INDEX}
        play={plays[CIRCLE_TAB_INDEX]}
        onPress={() => handlePress(CIRCLE_TAB_INDEX)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: PILL_SIDE_MARGIN,
    right: PILL_SIDE_MARGIN,
    overflow: 'visible',
  },
  pillShadow: {
    marginTop: CIRCLE_ABOVE_PILL,
    borderRadius: PILL_BORDER_RADIUS,
    // Primary shadow: 0px 8px 24px rgba(0,0,0,0.12)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    // Android: elevation requires a background; also serves as pill fallback
  },
  pillClip: {
    width: PILL_WIDTH,
    borderRadius: PILL_BORDER_RADIUS,
    overflow: 'hidden',
  },
  pillOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: PILL_H_PAD,
    paddingVertical: PILL_V_PAD,
    gap: TAB_GAP,
  },
  tabItem: {
    width: TAB_W,
  },
  tabContent: {
    alignItems: 'center',
    gap: TAB_ICON_GAP,
  },
  iconSlot: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSlotHidden: {
    opacity: 0,
  },
  label: {
    ...typography.label,
    color: colors.white,
    textAlign: 'center',
  },
  circleAnchor: {
    position: 'absolute',
    top: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  wave: {
    position: 'absolute',
    left: (CIRCLE_SIZE - WAVE_SIZE) / 2,
    top: (CIRCLE_SIZE - WAVE_SIZE) / 2,
    width: WAVE_SIZE,
    height: WAVE_SIZE,
  },
  activeCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.brand.lighter, // #5FA7D6
    alignItems: 'center',
    justifyContent: 'center',
    // Subtle blue glow to match the second Figma shadow layer
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Design 411:7519: the circle "lights up" while Практики is the active tab
  // (0px 4px 20px rgba(95,166,213,1)).
  activeCircleLit: {
    shadowColor: 'rgb(95,166,213)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
});
