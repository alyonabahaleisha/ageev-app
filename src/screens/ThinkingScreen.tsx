import React, {useEffect, useRef} from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
import {useUIStrings} from '../services/uiStrings';
import {RemoteImage} from '../components/RemoteImage';
import {
  hasStateContent,
  MindsetState,
  useMindsetStates,
} from '../services/mindsetStates';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const CARD_GAP = 12;
const CARD_W = Math.floor((Dimensions.get('window').width - SECTION_MARGIN * 2 - CARD_GAP) / 2);
const CARD_H = Math.round(CARD_W * 140 / 163);
const CARD_RADIUS = 20;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;

function StateCard({
  state,
  onPress,
}: {
  state: MindsetState;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardBlueGlow}
      onPress={onPress}>
      <View style={styles.cardShadow}>
        <View style={styles.cardClip}>
          {!!state.coverImage && (
            <RemoteImage
              source={{uri: state.coverImage}}
              style={styles.cardBg}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardOverlay} />
          <View style={styles.cardLabelWrap}>
            <Text style={styles.cardLabel}>{state.title}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

type Props = {
  resetSignal?: number;
  onOpenState?: (state: MindsetState) => void;
};

export function ThinkingScreen({resetSignal = 0, onOpenState}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const {states, loading} = useMindsetStates();
  const visibleStates = states.filter(hasStateContent);
  const t = useUIStrings();

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
          <Text style={styles.sectionTitle}>
            {t('thinking_picker_title', 'Выберите состояние')}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {t('thinking_picker_subtitle', 'Что откликается вам больше всего?')}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.white} />
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleStates.map(s => (
              <StateCard
                key={s.id}
                state={s}
                onPress={() => onOpenState?.(s)}
              />
            ))}
          </View>
        )}
      </View>

      <View style={{height: bottom + 110}} />
      </ScrollView>

      {/* Fixed header */}
      <FixedHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('thinking_title', 'Мышление')}</Text>
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
  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: 'rgba(0,0,0,0.3)',
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
