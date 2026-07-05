import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {ICON_AFFIRMATION} from '../assets/icons';
import LinearGradient from './LinearGradient';
import {dailyAffirmationIndex, useAffirmations} from '../services/affirmations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

const CARD_H = 275;
const CARD_RADIUS = 20;
const CARD_PADDING = 24;
const FALLBACK = 'Всё нужное приходит в своё время';

// Longer affirmations switch to the truncated layout (Figma 411:6471
// «Аффирмация длинная»): text clamped to 4 lines with an ellipsis +
// «Читать полностью» link, no subtitle.
const LONG_TEXT_CHARS = 90;

export function AffirmationCard({onPress}: {onPress?: () => void}) {
  // "Мысль на сегодня" — one real affirmation, rotating once per day.
  const {affirmations} = useAffirmations();
  const t = useUIStrings();
  const text =
    affirmations.length > 0
      ? affirmations[dailyAffirmationIndex(affirmations.length)].text
      : t('home_affirmation_fallback', FALLBACK);
  const isLong = text.length > LONG_TEXT_CHARS;

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <ImageBackground
          source={require('../assets/images/affirmation-card-bg.jpg')}
          style={styles.card}
          imageStyle={styles.cardImage}>
          {/* Soft darkening overlay per Figma (135deg, black 25% → grey 25%) */}
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(102,102,102,0.25)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {isLong ? (
            <>
              <View style={[styles.quoteContainer, styles.quoteContainerLong]}>
                <Text style={styles.quote} numberOfLines={4}>
                  {text}
                </Text>
                <View style={styles.moreWrap}>
                  <Text style={styles.more}>
                    {t('home_affirmation_more', 'Читать полностью')}
                  </Text>
                </View>
              </View>
              <SvgXml xml={ICON_AFFIRMATION} width={64} height={24} />
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                {t(
                  'home_affirmation_subtitle',
                  'Сохраните эту мысль с собой на сегодня',
                )}
              </Text>
              <View style={styles.quoteContainer}>
                <Text style={styles.quote}>{text}</Text>
              </View>
              <SvgXml xml={ICON_AFFIRMATION} width={64} height={24} />
            </>
          )}
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>
          {t('home_affirmation_button', 'Погрузиться в поток аффирмаций')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    gap: 12,
  },
  card: {
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    padding: CARD_PADDING,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardImage: {
    borderRadius: CARD_RADIUS,
  },
  subtitle: {
    ...typography.small,
    color: colors.white,
    textAlign: 'center',
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Long layout: Figma pads the top 72px (no subtitle), the text block fills
  // the middle with the link 16px below the text.
  quoteContainerLong: {
    paddingTop: 72 - CARD_PADDING,
    gap: 16,
  },
  quote: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  moreWrap: {
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.white,
    opacity: 0.7,
  },
  more: {
    fontFamily: fonts.manrope.medium,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.white,
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: 50,
    height: 52,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  buttonText: {
    ...typography.button,
    color: colors.dark,
  },
});
