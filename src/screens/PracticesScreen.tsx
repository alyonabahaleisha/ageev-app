import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_SEARCH} from '../assets/icons';
import {PracticeCards} from '../components/PracticeCards';
import {MeditationsScreen} from './MeditationsScreen';
import {WebinarsScreen} from './WebinarsScreen';
import {AffirmationsScreen} from './AffirmationsScreen';
import {GradientBackground} from '../components/GradientBackground';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
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
    id: 'music',
    label: 'Музыка',
    icon: require('../assets/images/format-music-56586c-56586a.png'),
    iconW: 30,
    iconH: 30,
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

export function PracticesScreen({resetSignal = 0}: {resetSignal?: number}) {
  const {top, bottom} = useSafeAreaInsets();
  const [subScreen, setSubScreen] = useState<
    'list' | 'meditations' | 'affirmations' | 'webinars'
  >('list');
  const scrollRef = useRef<ScrollView>(null);
  const t = useUIStrings();

  useEffect(() => {
    setSubScreen('list');
    scrollRef.current?.scrollTo({y: 0, animated: true});
  }, [resetSignal]);

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top)},
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
                    : undefined
                }
              />
            ))}
          </View>
        </View>

        <View style={{height: bottom + 110}} />
      </ScrollView>

      {/* Fixed header — only over the list, not the full-screen sub-screens */}
      {subScreen === 'list' && (
        <FixedHeader>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('practices_title', 'Практики')}</Text>
            <View style={styles.searchGlow}>
              <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn}>
                <SvgXml xml={ICON_SEARCH} width={24} height={24} />
              </TouchableOpacity>
            </View>
          </View>
        </FixedHeader>
      )}

      {subScreen === 'meditations' && (
        <GradientBackground style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
          <MeditationsScreen onBack={() => setSubScreen('list')} />
        </GradientBackground>
      )}

      {subScreen === 'webinars' && (
        <GradientBackground style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
          <WebinarsScreen onBack={() => setSubScreen('list')} />
        </GradientBackground>
      )}

      {subScreen === 'affirmations' && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}}>
          <AffirmationsScreen onBack={() => setSubScreen('list')} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
