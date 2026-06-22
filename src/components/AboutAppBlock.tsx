import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {colors} from '../theme/colors';
import {fonts} from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Mirrors Figma node "о приложении" (318:4215): a centred text block above the
// decorative portrait. The img area (portrait + 1px gradient ring + glow dots,
// node 318:4221) is the exact Figma export with transparency, so the screen
// gradient shows through the ring gap — a pixel-perfect composite at 390×300.
const IMG_W = 390;
const IMG_H = 300;

// Portrait circle geometry within the 390×300 export (measured from the asset).
// Portrait circle centre/radius. The visible photo edge is ~139 at centre
// Aligned to the thin gradient ring already baked into about-img.png (opaque
// edge ~139.5 at centre 193.5, 149.5) so the glint runs along that one ring —
// no second ring of our own.
const RING_CX = 193.5;
const RING_CY = 149.5;
const RING_R = 139.5;
const RING_BOX = (RING_R + 4) * 2;
const C = 2 * Math.PI * RING_R; // circumference
const GLINT = C * 0.16; // length of the travelling light segment (soft, ~58°)

// A single gentle glint of light that runs once around the portrait's existing
// ring, pauses, then repeats — a subtle "new stories" hint. No static ring of
// our own (the portrait already has one); only the moving light.
function StoryRing() {
  const t = useRef(new Animated.Value(0)).current; // 0→1 = one lap

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 2600, // slow, gentle lap
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // animating an svg prop (strokeDashoffset)
        }),
        Animated.delay(3400), // rest between laps
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [t]);

  const dashoffset = t.interpolate({inputRange: [0, 1], outputRange: [0, -C]});
  const opacity = t.interpolate({
    inputRange: [0, 0.06, 0.85, 1],
    outputRange: [0, 1, 1, 0], // fade in at the start of the lap, out at the end
  });

  const c = RING_BOX / 2;
  return (
    <View
      pointerEvents="none"
      style={[styles.ring, {left: RING_CX - c, top: RING_CY - c, width: RING_BOX, height: RING_BOX}]}>
      {/* travelling glint (soft glow + bright core) */}
      <Animated.View style={[StyleSheet.absoluteFill, {opacity}]}>
        <Svg width={RING_BOX} height={RING_BOX}>
          <AnimatedCircle
            cx={c}
            cy={c}
            r={RING_R}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={5}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[GLINT, C]}
            strokeDashoffset={dashoffset}
          />
          <AnimatedCircle
            cx={c}
            cy={c}
            r={RING_R}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={[GLINT, C]}
            strokeDashoffset={dashoffset}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function AboutAppBlock({onPressCircle}: {onPressCircle?: () => void}) {
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

      {/* img — portrait, glow dots, and an animated "new stories" ring.
          Tapping the circle opens the stories viewer. */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPressCircle}
        disabled={!onPressCircle}>
        <Image
          source={require('../assets/images/about-img.png')}
          style={styles.img}
          resizeMode="contain"
        />
        <StoryRing />
      </TouchableOpacity>
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
  ring: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
