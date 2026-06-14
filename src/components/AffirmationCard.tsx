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
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const CARD_H = 275;
const CARD_RADIUS = 20;
const CARD_PADDING = 24;

export function AffirmationCard({onPress}: {onPress?: () => void}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        <ImageBackground
          source={require('../assets/images/affirmation-bg.png')}
          style={styles.card}
          imageStyle={styles.cardImage}>
          <Text style={styles.subtitle}>
            Сохраните эту мысль с собой на сегодня
          </Text>
          <View style={styles.quoteContainer}>
            <Text style={styles.quote}>
              Всё нужное приходит в своё время
            </Text>
          </View>
          <SvgXml xml={ICON_AFFIRMATION} width={64} height={24} />
        </ImageBackground>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Погрузиться в поток аффирмаций</Text>
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
  quote: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
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
