import React from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';

const SECTION_MARGIN = 24;
const CARD_GAP = 12;
const W = Dimensions.get('window').width;
const CARD_W = Math.floor((W - SECTION_MARGIN * 2 - CARD_GAP) / 2);
const CARD_H = Math.round((CARD_W * 140) / 163);
const ANGEL_W = 79;
const ANGEL_H = 96;
const CARD_RADIUS = 20;

// "С чем хотите поработать сегодня?" — life-area picker. Each card is a photo
// with a dark overlay and a centered label. Order/labels mirror the Figma.
const STATES = [
  {
    label: 'Самосознание, развитие уверенности',
    image: require('../assets/images/states/state-self-awareness-122618.png'),
  },
  {
    label: 'Самочувствие, здоровье',
    image: require('../assets/images/states/state-health-41a32c.png'),
  },
  {
    label: 'Отношения, семья, род',
    image: require('../assets/images/states/state-relationships-7538c6.png'),
  },
  {
    label: 'Призвание, реализация',
    image: require('../assets/images/states/state-vocation-153c70.png'),
  },
  {
    label: 'Деньги и изобилие',
    image: require('../assets/images/states/state-money-2ffa7d.png'),
  },
  {
    label: 'Новый уровень жизни',
    image: require('../assets/images/states/state-new-level-ca9359.png'),
  },
  {
    label: 'Тревога и страхи',
    image: require('../assets/images/states/state-anxiety-76ce8e.png'),
  },
  {
    label: 'Энергетическое развитие, активация способностей',
    image: require('../assets/images/states/state-energy-47af5a.png'),
  },
  {
    label: 'Ресурсное состояние',
    image: require('../assets/images/states/state-resource-7c2376.png'),
  },
  {
    label: 'Связь с Творцом и Ангелами',
    image: require('../assets/images/states/state-creator-56deca.png'),
  },
];

function StateCard({label, image}: (typeof STATES)[0]) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.cardShadow}>
      <ImageBackground
        source={image}
        style={styles.cardClip}
        imageStyle={styles.cardImage}>
        <View style={styles.cardOverlay} pointerEvents="none" />
        <Text style={styles.cardLabel}>{label}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export function AngelHelper() {
  return (
    <View style={styles.container}>
      {/* Question pill — its bottom-left corner is squared so the angel tucks in */}
      <View style={styles.pill}>
        <Text style={styles.question}>С чем хотите поработать сегодня?</Text>
      </View>

      {/* States — horizontally scrollable row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {STATES.map(s => (
          <StateCard key={s.label} {...s} />
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
    flex: 1,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cardImage: {
    borderRadius: CARD_RADIUS,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardLabel: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    lineHeight: 21,
    color: colors.white,
    textAlign: 'center',
  },
});
