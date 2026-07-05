import React from 'react';
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
import {RemoteImage} from './RemoteImage';
import {
  hasStateContent,
  MindsetState,
  useMindsetStates,
} from '../services/mindsetStates';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';

const SECTION_MARGIN = 24;
const CARD_GAP = 12;
const W = Dimensions.get('window').width;
const CARD_W = Math.floor((W - SECTION_MARGIN * 2 - CARD_GAP) / 2);
const CARD_H = Math.round((CARD_W * 140) / 163);
const ANGEL_W = 79;
const ANGEL_H = 96;
const CARD_RADIUS = 20;

type Props = {
  onOpenState?: (state: MindsetState) => void;
};

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
      style={styles.cardShadow}
      onPress={onPress}>
      <View style={styles.cardClip}>
        {!!state.coverImage && (
          <RemoteImage
            source={{uri: state.coverImage}}
            style={styles.cardBg}
            resizeMode="cover"
          />
        )}
        <View style={styles.cardOverlay} pointerEvents="none" />
        <View style={styles.cardLabelWrap}>
          <Text style={styles.cardLabel}>{state.title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// "С чем хотите поработать сегодня?" — the home life-area picker. Same states as
// the Мышление tab (loaded from the mindsetStates CMS); tapping opens the state.
export function AngelHelper({onOpenState}: Props) {
  const {states} = useMindsetStates();
  const visibleStates = states.filter(hasStateContent);
  const t = useUIStrings();

  // Nothing configured yet — hide the section rather than show an empty pill.
  if (visibleStates.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Question pill — its bottom-left corner is squared so the angel tucks in */}
      <View style={styles.pill}>
        <Text style={styles.question}>
          {t('home_angel_question', 'С чем хотите поработать сегодня?')}
        </Text>
      </View>

      {/* States — horizontally scrollable row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {visibleStates.map(s => (
          <StateCard key={s.id} state={s} onPress={() => onOpenState?.(s)} />
        ))}
      </ScrollView>

      {/* Angel peeking from the top-left corner, over the pill and first card */}
      <Image
        source={require('../assets/images/angel-7ddf76.png')}
        style={styles.angel}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  // ── Question pill ─────────────────────────────────────────────────────────
  pill: {
    marginLeft: ANGEL_W,
    marginRight: 17,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  question: {
    fontFamily: 'Manrope-Medium',
    fontSize: 16,
    lineHeight: 21,
    color: colors.white,
    textAlign: 'center',
  },

  // ── Angel ─────────────────────────────────────────────────────────────────
  angel: {
    position: 'absolute',
    top: 7,
    left: 0,
    width: ANGEL_W,
    height: ANGEL_H,
    zIndex: 2,
  },

  // ── States — horizontal carousel ──────────────────────────────────────────
  scroll: {
    marginTop: 30,
  },
  scrollContent: {
    paddingHorizontal: SECTION_MARGIN,
    paddingVertical: 8, // breathing room so card shadows aren't clipped
    columnGap: CARD_GAP,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardBg: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    lineHeight: 21,
    color: colors.white,
    textAlign: 'center',
  },
});
