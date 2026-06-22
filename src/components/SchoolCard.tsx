import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

type Props = {onPress?: () => void};

// "О школе" — cover image up top (rounded top corners) over a frosted info
// panel (rounded bottom corners) with title, description and a primary button.
export function SchoolCard({onPress}: Props) {
  return (
    <View style={styles.cardGlow}>
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <Image
            source={require('../assets/images/school-cover.jpg')}
            style={styles.cover}
            resizeMode="cover"
          />
          <View style={styles.panel}>
            <View style={styles.textBlock}>
              <Text style={styles.title}>Школа Михаила Агеева</Text>
              <Text style={styles.description}>
                В Школе мы даём знания, которые помогут вам почувствовать полную
                свободу и стать творцом своей жизни.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={onPress}
              style={styles.button}>
              <Text style={styles.buttonText}>Подробнее</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const RADIUS = 20;

const styles = StyleSheet.create({
  cardGlow: {
    marginHorizontal: 24,
    borderRadius: RADIUS,
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
    borderRadius: RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  cover: {
    width: '100%',
    height: 200,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 16,
  },
  textBlock: {
    gap: 12,
  },
  title: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
  },
  description: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.white,
    borderRadius: 50,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 14},
        shadowOpacity: 0.35,
        shadowRadius: 40,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonText: {
    ...typography.button,
    color: colors.dark,
  },
});
