import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {Text} from '../components/Text';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_SEARCH} from '../assets/icons';
import {PracticeCards} from '../components/PracticeCards';
import {MeditationsScreen} from './MeditationsScreen';
import {WebinarsScreen} from './WebinarsScreen';
import {AffirmationsScreen} from './AffirmationsScreen';
import {BreakfastsScreen} from './BreakfastsScreen';
import {Presented, useRecede} from '../components/Presented';
import {useScrollMemory} from '../hooks/useScrollMemory';
import {FixedHeader, useHeaderScrollPadding} from '../components/FixedHeader';
import {useBreakfasts} from '../services/breakfasts';
import {useSearch} from '../context/SearchContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const CARD_GAP = 16;
const CHIP_W = Math.floor(
  (Dimensions.get('window').width - SECTION_MARGIN * 2 - CARD_GAP) / 2,
);
const CHIP_H = Math.round(CHIP_W * 140 / 163);
const CHIP_RADIUS = 20;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;

const FORMATS = [
  {
    id: 'meditations',
    label: 'Медитации',
    icon: require('../assets/images/format-meditation-6a1889.png'),
    iconW: 30,
    iconH: 34,
  },
  {
    id: 'affirmations',
    label: 'Аффирмации',
    icon: require('../assets/images/format-affirmations-56586a.png'),
    iconW: 30,
    iconH: 30,
  },
  {
    id: 'webinars',
    label: 'Вебинары',
    icon: require('../assets/images/format-webinar-56586b-56586a.png'),
    iconW: 30,
    iconH: 23,
  },
  {
    id: 'breakfasts',
    label: 'Духовные завтраки',
    icon: require('../assets/images/format-breakfast.png'),
    iconW: 30,
    iconH: 31,
  },
];

function FormatChip({
  label,
  icon,
  iconW,
  iconH,
  onPress,
}: (typeof FORMATS)[0] & {onPress?: () => void}) {
  const content = (
    <>
      <Image source={icon} style={{width: iconW, height: iconH}} resizeMode="contain" />
      <Text style={styles.chipLabel}>{label}</Text>
    </>
  );

  if (Platform.OS !== 'ios') {
    return (
      <TouchableOpacity activeOpacity={0.85} style={styles.chipInner} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.chipGlow} onPress={onPress}>
      <View style={styles.chipShadow}>
        <View style={styles.chipInner}>{content}</View>
      </View>
    </TouchableOpacity>
  );
}

// Above the list's fixed header (zIndex 10), below the tab bar.
const SUB_SCREEN_Z = 20;

type FormatSignal = {
  id: 'meditations' | 'affirmations' | 'webinars' | 'breakfasts';
  n: number;
} | null;

export function PracticesScreen({
  resetSignal = 0,
  formatSignal = null,
}: {
  resetSignal?: number;
  formatSignal?: FormatSignal;
}) {
  const {bottom} = useSafeAreaInsets();
  const scrollPad = useHeaderScrollPadding();
  const [subScreen, setSubScreen] = useState<
    'list' | 'meditations' | 'affirmations' | 'webinars' | 'breakfasts'
  >('list');
  const scrollRef = useRef<ScrollView>(null);
  const t = useUIStrings();
  const {openSearch} = useSearch();
  // Warm the breakfast list + cover cache from app launch (this tab is always
  // mounted), so the Завтраки grid opens with its images already cached.
  useBreakfasts();

  const scrollMemory = useScrollMemory('practices', scrollRef);
  // Arrival of each sub-screen (0→1); the list recedes in step with them.
  const pages = useRef({
    meditations: new Animated.Value(0),
    webinars: new Animated.Value(0),
    breakfasts: new Animated.Value(0),
    affirmations: new Animated.Value(0),
  }).current;
  const recede = useRecede(Object.values(pages));

  // Повторный тап по вкладке — к списку и наверх. При монтировании не
  // срабатывает: вкладка возвращается на то место, где её оставили.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSubScreen('list');
    scrollRef.current?.scrollTo({y: 0, animated: true});
  }, [resetSignal]);

  // Search screen's «Быстрые категории» jump straight into a sub-screen.
  useEffect(() => {
    if (formatSignal) {
      setSubScreen(formatSignal.id);
    }
  }, [formatSignal]);

  const backToList = () => setSubScreen('list');

  return (
    <>
      <Animated.View style={[styles.listLayer, recede]}>
      <ScrollView
        {...scrollMemory}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: scrollPad},
        ]}
        showsVerticalScrollIndicator={false}>

        {/* Recommended */}
        <View style={styles.recommendedSection}>
          <PracticeCards
            title={t('practices_recommended_title', 'Рекомендовано для вас')}
            subtitle={null}
            titleAlign="left"
          />
        </View>

        {/* Format picker */}
        <View style={styles.formatSection}>
          <Text style={styles.formatTitle}>
            {t('practices_format_title', 'Выберите формат')}
          </Text>
          <View style={styles.formatGrid}>
            {FORMATS.map(f => (
              <FormatChip
                key={f.id}
                {...f}
                label={t(`practices_format_${f.id}`, f.label)}
                onPress={
                  f.id === 'meditations'
                    ? () => setSubScreen('meditations')
                    : f.id === 'affirmations'
                    ? () => setSubScreen('affirmations')
                    : f.id === 'webinars'
                    ? () => setSubScreen('webinars')
                    : f.id === 'breakfasts'
                    ? () => setSubScreen('breakfasts')
                    : undefined
                }
              />
            ))}
          </View>
        </View>

        <View style={{height: bottom + 110}} />
      </ScrollView>

      {/* Fixed header of the list. It stays mounted under the sub-screens so
          it is there to see while one slides in or is swiped back. */}
      <FixedHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('practices_title', 'Практики')}</Text>
          <View style={styles.searchGlow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn} onPress={openSearch}>
              <SvgXml xml={ICON_SEARCH} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </FixedHeader>
      </Animated.View>

      {/* Sub-screens slide in over the list (zIndex lifts them above its
          fixed header) and slide back out; on iOS they swipe back from the
          left edge. Аффирмации page sideways themselves, so no edge swipe. */}
      <Presented
        shown={subScreen === 'meditations'}
        progress={pages.meditations}
        zIndex={SUB_SCREEN_Z}
        onSwipeBack={backToList}>
        <MeditationsScreen onBack={backToList} />
      </Presented>

      <Presented
        shown={subScreen === 'webinars'}
        progress={pages.webinars}
        zIndex={SUB_SCREEN_Z}
        onSwipeBack={backToList}>
        <WebinarsScreen onBack={backToList} />
      </Presented>

      <Presented
        shown={subScreen === 'breakfasts'}
        progress={pages.breakfasts}
        zIndex={SUB_SCREEN_Z}
        onSwipeBack={backToList}>
        <BreakfastsScreen onBack={backToList} />
      </Presented>

      <Presented
        shown={subScreen === 'affirmations'}
        progress={pages.affirmations}
        zIndex={SUB_SCREEN_Z}>
        <AffirmationsScreen onBack={backToList} />
      </Presented>
    </>
  );
}

const styles = StyleSheet.create({
  listLayer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.white,
  },
  searchGlow: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
    }),
  },
  searchBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 24},
        shadowOpacity: 0.28,
        shadowRadius: 30,
      },
    }),
  },

  // ── Recommended ──────────────────────────────────────────────────────────
  recommendedSection: {
    marginTop: 24,
  },

  // ── Format picker ─────────────────────────────────────────────────────────
  formatSection: {
    marginTop: 40,
    marginHorizontal: SECTION_MARGIN,
    gap: 16,
  },
  formatTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },

  // ── Format chip ───────────────────────────────────────────────────────────
  chipGlow: {
    width: CHIP_W,
    height: CHIP_H,
    borderRadius: CHIP_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  chipShadow: {
    width: CHIP_W,
    height: CHIP_H,
    borderRadius: CHIP_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  chipInner: {
    width: CHIP_W,
    height: CHIP_H,
    borderRadius: CHIP_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  chipLabel: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
});
