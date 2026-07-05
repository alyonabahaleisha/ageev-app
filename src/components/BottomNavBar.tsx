import React, {useState} from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useUIStrings} from '../services/uiStrings';
import {
  ICON_HOME,
  ICON_LAMP,
  ICON_PLAY_CIRCLE,
  ICON_PEOPLE,
  ICON_PROFILE_CIRCLE,
} from '../assets/icons';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

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

type Tab = {key: string; label: string; icon: string};

const TABS: Tab[] = [
  {key: 'home', label: 'Главная', icon: ICON_HOME},
  {key: 'thinking', label: 'Мышление', icon: ICON_LAMP},
  {key: 'practices', label: 'Практики', icon: ICON_PLAY_CIRCLE},
  {key: 'club', label: 'Клуб', icon: ICON_PEOPLE},
  {key: 'profile', label: 'Профиль', icon: ICON_PROFILE_CIRCLE},
];

// Circle left offset relative to the pill's left edge
function circleLeft(index: number): number {
  const tabCenterX = PILL_H_PAD + index * (TAB_W + TAB_GAP) + TAB_W / 2;
  return tabCenterX - CIRCLE_SIZE / 2;
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

  function handlePress(index: number) {
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
            <BlurView
              style={StyleSheet.absoluteFill}
              blurRadius={20}
              overlayColor="rgba(255,255,255,0.18)"
            />
          )}
          {/* Semi-transparent overlay: rgba(255,255,255,0.14) from Figma */}
          <View style={styles.pillOverlay} />
          <View style={styles.tabRow}>
            {TABS.map((tab, index) => {
              const isActive = index === activeIndex;
              // Center tab icon always lives in the floating circle
              const iconInCircle = index === CIRCLE_TAB_INDEX;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  activeOpacity={0.8}
                  onPress={() => handlePress(index)}>
                  <View style={[styles.iconSlot, iconInCircle && styles.iconSlotHidden]}>
                    <View style={!isActive && styles.iconInactive}>
                      <SvgXml xml={tab.icon} width={ICON_SIZE} height={ICON_SIZE} />
                    </View>
                  </View>
                  <Text
                    style={[styles.label, !isActive && styles.labelInactive]}
                    numberOfLines={1}>
                    {t(`nav_${tab.key}`, tab.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Floating circle — always visible for center tab (Практики).
          It overlays the center tab's touchable, so it must handle the press
          itself and route to the same tab. */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handlePress(CIRCLE_TAB_INDEX)}
        style={[styles.activeCircle, {left: circleLeft(CIRCLE_TAB_INDEX)}]}>
        <SvgXml xml={TABS[CIRCLE_TAB_INDEX].icon} width={ICON_SIZE} height={ICON_SIZE} />
      </TouchableOpacity>
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
  iconInactive: {
    opacity: 0.6,
  },
  label: {
    ...typography.label,
    color: colors.white,
    textAlign: 'center',
  },
  labelInactive: {
    opacity: 0.6,
  },
  activeCircle: {
    position: 'absolute',
    top: 0,
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
});
