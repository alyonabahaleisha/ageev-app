import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  FeGaussianBlur,
  Filter,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const CHIPS = ['Отношения', 'Тревога', 'Энергия', 'Деньги', 'Самооценка'];

export function AngelHelper() {
  return (
    <View style={styles.container}>
      {/* Radial glow background */}
      <Svg
        width={390}
        height={414}
        style={styles.glowSvg}
        pointerEvents="none">
        <Defs>
          {Platform.OS === 'ios' ? (
            <>
              <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#7BC4F3" stopOpacity={1} />
                <Stop offset="100%" stopColor="#47728D" stopOpacity={1} />
              </RadialGradient>
              <Filter id="blur" x="-60%" y="-60%" width="220%" height="220%">
                <FeGaussianBlur stdDeviation={70} />
              </Filter>
            </>
          ) : (
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.28} />
              <Stop offset="40%" stopColor="#7BC4F3" stopOpacity={0.18} />
              <Stop offset="75%" stopColor="#47728D" stopOpacity={0.07} />
              <Stop offset="100%" stopColor="#47728D" stopOpacity={0} />
            </RadialGradient>
          )}
        </Defs>
        <Ellipse
          cx={195}
          cy={219}
          rx={Platform.OS === 'ios' ? 195 : 270}
          ry={Platform.OS === 'ios' ? 195 : 260}
          fill="url(#glow)"
          filter={Platform.OS === 'ios' ? 'url(#blur)' : undefined}
        />
      </Svg>

      {/* Content */}
      <View style={styles.content} pointerEvents="box-none">
        {/* Angel */}
        <View style={styles.angelSection}>
          <Text style={styles.title}>Ты можешь начать с малого</Text>
          <Image
            source={require('../assets/images/angel-7ddf76.png')}
            style={styles.angelImage}
            resizeMode="contain"
          />
        </View>

        {/* Pain picker */}
        <View style={styles.painSection}>
          <Text style={styles.question}>С чем хотите поработать сегодня?</Text>
          <View style={styles.chipsRow}>
            {CHIPS.map(chip => (
              <TouchableOpacity key={chip} activeOpacity={0.7} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 374,
  },
  glowSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    gap: 18,
    alignItems: 'center',
  },
  angelSection: {
    alignItems: 'center',
    gap: 12,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  angelImage: {
    width: 150,
    height: 180,
  },
  painSection: {
    alignSelf: 'stretch',
    gap: 16,
  },
  question: {
    ...typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  chipText: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
  },
});
