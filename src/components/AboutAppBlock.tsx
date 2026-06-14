import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';
import {fonts} from '../theme/typography';

// Mirrors Figma node "о приложении" (318:4215): a centred text block above the
// decorative portrait. The img area (portrait + 1px gradient ring + glow dots,
// node 318:4221) is the exact Figma export with transparency, so the screen
// gradient shows through the ring gap — a pixel-perfect composite at 390×300.
const IMG_W = 390;
const IMG_H = 300;

export function AboutAppBlock() {
  return (
    <View style={styles.container}>
      {/* txt */}
      <View style={styles.txt}>
        <Text style={styles.title}>{'“Жизнь – это подарок Бога”'}</Text>
        <View style={styles.subBlock}>
          <Text style={styles.subtitle}>
            Практики и поддержка для внутренней силы, гармонии и связи с собой.
          </Text>
          <Text style={styles.author}>С Михаилом Агеевым</Text>
        </View>
      </View>

      {/* img — portrait, gradient ring and glow dots */}
      <Image
        source={require('../assets/images/about-img.png')}
        style={styles.img}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 10,
  },
  txt: {
    width: 342,
    gap: 12,
  },
  title: {
    fontFamily: fonts.manrope.medium,
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
  },
  subBlock: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 16,
  },
  subtitle: {
    width: 320,
    fontFamily: fonts.manrope.regular,
    fontSize: 16,
    lineHeight: 20.8,
    fontWeight: '400',
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  author: {
    fontFamily: fonts.manrope.regular,
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
  img: {
    width: IMG_W,
    height: IMG_H,
  },
});
