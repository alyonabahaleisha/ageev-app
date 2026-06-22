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

export function ClubSection({onPress}: Props) {
  return (
    <View style={styles.container}>
      {/* Text block */}
      <View style={styles.textBlock}>
        <Text style={styles.title}>Клубы рядом с вами</Text>
        <Text style={styles.subtitle}>
          148 городов по всему миру – найдите ближайшее пространство практики и поддержки.
        </Text>
      </View>

      {/* Club photo — shadow/clip split */}
      <View style={styles.photoBlueGlow}>
        <View style={styles.photoShadow}>
          <View style={styles.photoClip}>
            <Image
              source={require('../assets/images/club-photo-eed90b.jpg')}
              style={styles.photoImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      {/* Primary button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.button}>
        <Text style={styles.buttonText}>Подробнее</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    gap: 16,
  },
  textBlock: {
    gap: 12,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  photoBlueGlow: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  photoShadow: {
    borderRadius: 20,
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
  photoClip: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: 200,
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
