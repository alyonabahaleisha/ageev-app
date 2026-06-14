import React, {useEffect, useRef} from 'react';
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
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const CARD_GAP = 16;
const CARD_W = Math.floor((Dimensions.get('window').width - SECTION_MARGIN * 2 - CARD_GAP) / 2);
const CARD_H = Math.round(CARD_W * 140 / 163);
const CARD_RADIUS = 20;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;

const STATES = [
  {
    label: 'Любовь Творца',
    image: require('../assets/images/state-love-420040.png'),
  },
  {
    label: 'Я ценен',
    image: require('../assets/images/state-valuable-153c70.png'),
  },
  {
    label: 'Изобилие',
    image: require('../assets/images/state-abundance-2ffa7d.png'),
  },
  {
    label: 'Доверие жизни',
    image: require('../assets/images/state-trust-6b8bae.png'),
  },
  {
    label: 'Спокойствие',
    image: require('../assets/images/state-calm-47757d.png'),
  },
  {
    label: 'Поддержка ангелов',
    image: require('../assets/images/state-angels-56deca.png'),
  },
];

function StateCard({label, image}: {label: string; image: number}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.cardBlueGlow}>
      <View style={styles.cardShadow}>
        <View style={styles.cardClip}>
          <Image source={image} style={styles.cardBg} resizeMode="stretch" />
          <View style={styles.cardOverlay} />
          <View style={styles.cardLabelWrap}>
            <Text style={styles.cardLabel}>{label}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ThinkingScreen({resetSignal = 0}: {resetSignal?: number}) {
  const {top, bottom} = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
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

        {/* State picker */}
      <View style={styles.section}>
        <View style={styles.textBlock}>
          <Text style={styles.sectionTitle}>Выберите состояние</Text>
          <Text style={styles.sectionSubtitle}>
            Что откликается вам больше всего?
          </Text>
        </View>

        <View style={styles.grid}>
          {STATES.map(s => (
            <StateCard key={s.label} label={s.label} image={s.image} />
          ))}
        </View>
      </View>

      <View style={{height: bottom + 110}} />
      </ScrollView>

      {/* Fixed header */}
      <FixedHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Мышление</Text>
          <View style={styles.searchGlow}>
            <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn}>
              <SvgXml xml={ICON_SEARCH} width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </FixedHeader>
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

  // ── State picker ─────────────────────────────────────────────────────────
  section: {
    marginTop: 16,
    marginHorizontal: 24,
    gap: 16,
  },
  textBlock: {
    gap: 12,
    alignItems: 'center',
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
    maxWidth: 297,
  },

  // ── Card grid ─────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  cardBlueGlow: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  cardShadow: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  cardClip: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  cardOverlay: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  cardLabelWrap: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardLabel: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
});
