import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleProp, StyleSheet, ViewStyle} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useReduceMotion} from '../services/reduceMotion';

// The home-screen angel, alive: he hovers, his wings beat in bursts and
// glides, he blinks, the halo and heart breathe with light, and every few
// seconds he beams — eyes squint into a smile, the grin widens, cheeks warm
// up and sparkles twinkle around him.
//
// The artwork is the original angel cut into layers that share one canvas
// (src/assets/images/angel/*, built by scripts/build-angel-layers.py), so they
// stack with no offsets. Everything is transform/opacity on the native driver;
// with Reduce Motion on he stays still.

const LAYERS = {
  glow: require('../assets/images/angel/glow.png'),
  wingL: require('../assets/images/angel/wing-l.png'),
  wingR: require('../assets/images/angel/wing-r.png'),
  body: require('../assets/images/angel/body.png'),
  blink: require('../assets/images/angel/blink.png'),
  happy: require('../assets/images/angel/happy.png'),
};

/** Canvas aspect ratio (height / width) shared by every layer. */
const ASPECT = 1080 / 900;
// Where each wing joins the sleeve, as a fraction of the canvas.
const WING_L_JOINT = {x: 0.333, y: 0.622};
const WING_R_JOINT = {x: 0.667, y: 0.62};

const WING_UP_DEG = 15;
const WING_DOWN_DEG = -9;
/** How much a wing narrows at the top of its stroke (turning edge-on). */
const WING_FORESHORTEN = 0.9;

// Sparkles that appear while he beams: position and size as canvas fractions.
const SPARKLES = [
  {x: 0.11, y: 0.25, size: 0.13, spin: 1},
  {x: 0.92, y: 0.17, size: 0.16, spin: -1},
  {x: 0.9, y: 0.57, size: 0.1, spin: 1},
] as const;
const SPARKLE_COLOR = '#FFF4C7';
// Four-point star on a 24-unit box.
const STAR_D =
  'M12 0l3.1 8.9l8.9 3.1l-8.9 3.1l-3.1 8.9l-3.1 -8.9l-8.9 -3.1l8.9 -3.1Z';

type Props = {
  /** Width in points; height follows the artwork's aspect ratio. */
  width: number;
  style?: StyleProp<ViewStyle>;
};

function ease(value: Animated.Value, toValue: number, duration: number) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: Easing.inOut(Easing.sin),
    isInteraction: false,
    useNativeDriver: true,
  });
}

/** One there-and-back swing of `value`: 0 → 1 → 0. */
function swing(value: Animated.Value, up: number, down: number) {
  return Animated.sequence([ease(value, 1, up), ease(value, 0, down)]);
}

export function FlyingAngel({width, style}: Props) {
  const height = Math.round(width * ASPECT);
  const reduceMotion = useReduceMotion();

  const hover = useRef(new Animated.Value(0)).current; // slow rise and fall
  const sway = useRef(new Animated.Value(0)).current; // side drift + tilt
  const flap = useRef(new Animated.Value(0)).current; // 0 wings down → 1 up
  const glow = useRef(new Animated.Value(0)).current; // halo + heart light
  const joy = useRef(new Animated.Value(0)).current; // 0 calm → 1 beaming
  const blink = useRef(new Animated.Value(0)).current; // 1 = eyes shut

  useEffect(() => {
    const values = [hover, sway, flap, glow, joy, blink];
    if (reduceMotion) {
      values.forEach(v => {
        v.stopAnimation();
        v.setValue(0);
      });
      return;
    }
    const beam = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(joy, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.delay(1700),
        Animated.timing(joy, {
          toValue: 0,
          duration: 380,
          easing: Easing.inOut(Easing.quad),
          isInteraction: false,
          useNativeDriver: true,
        }),
        Animated.delay(2100),
      ]),
    );
    // Wings: a burst of quick beats to gain height, then one long glide.
    const wings = Animated.loop(
      Animated.sequence([
        swing(flap, 230, 320),
        swing(flap, 230, 320),
        swing(flap, 250, 360),
        swing(flap, 520, 820),
      ]),
    );
    // Eyes: a blink, a pause, a double blink — never quite regular.
    const shut = () => swing(blink, 70, 110);
    const eyes = Animated.loop(
      Animated.sequence([
        Animated.delay(1900),
        shut(),
        Animated.delay(3300),
        shut(),
        Animated.delay(170),
        shut(),
        Animated.delay(2600),
      ]),
    );
    const running = [
      Animated.loop(swing(hover, 1500, 1500)),
      Animated.loop(swing(sway, 2300, 2300)),
      Animated.loop(swing(glow, 1100, 1100)),
      wings,
      eyes,
      beam,
    ];
    running.forEach(a => a.start());
    return () => {
      running.forEach(a => a.stop());
      values.forEach(v => v.stopAnimation());
    };
  }, [reduceMotion, hover, sway, flap, glow, joy, blink]);

  // Motion scales with the angel, so he flies the same at any size.
  const lift = height * 0.075;
  const drift = width * 0.03;

  const flight = {
    transform: [
      {
        translateY: Animated.add(
          hover.interpolate({inputRange: [0, 1], outputRange: [0, -lift]}),
          // Each wing beat nudges the body: down-stroke lifts, up-stroke sinks.
          flap.interpolate({
            inputRange: [0, 1],
            outputRange: [-lift * 0.14, lift * 0.14],
          }),
        ),
      },
      {
        translateX: sway.interpolate({
          inputRange: [0, 1],
          outputRange: [-drift, drift],
        }),
      },
      {
        rotate: sway.interpolate({
          inputRange: [0, 1],
          outputRange: ['-3deg', '3deg'],
        }),
      },
      // A little swell of delight when he beams.
      {scale: joy.interpolate({inputRange: [0, 1], outputRange: [1, 1.05]})},
    ],
  };

  // Rotate each wing around its joint: shift the joint to the layer's centre,
  // rotate, shift back. (transformOrigin is ignored by natively driven
  // transforms on device, which swung the wings off the body.)
  const pivot = (joint: {x: number; y: number}, from: number, to: number) => {
    const dx = (joint.x - 0.5) * width;
    const dy = (joint.y - 0.5) * height;
    return {
      transform: [
        {translateX: dx},
        {translateY: dy},
        {
          rotate: flap.interpolate({
            inputRange: [0, 1],
            outputRange: [`${from}deg`, `${to}deg`],
          }),
        },
        // Raised wings turn edge-on to the viewer and read narrower.
        {
          scaleX: flap.interpolate({
            inputRange: [0, 1],
            outputRange: [1, WING_FORESHORTEN],
          }),
        },
        {translateX: -dx},
        {translateY: -dy},
      ],
    };
  };
  const wingL = pivot(WING_L_JOINT, WING_DOWN_DEG, WING_UP_DEG);
  const wingR = pivot(WING_R_JOINT, -WING_DOWN_DEG, -WING_UP_DEG);

  const glowStyle = {
    opacity: Animated.add(
      glow.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.8]}),
      joy.interpolate({inputRange: [0, 1], outputRange: [0, 0.2]}),
    ),
  };

  // Each sparkle pops in with the smile and twinkles on its own rhythm.
  const twinkles = [glow, hover, sway];
  const sparkle = (i: number) => {
    const s = SPARKLES[i];
    const side = width * s.size;
    const twinkle = twinkles[i % twinkles.length];
    return {
      left: s.x * width - side / 2,
      top: s.y * height - side / 2,
      width: side,
      height: side,
      opacity: Animated.multiply(
        joy,
        twinkle.interpolate({inputRange: [0, 1], outputRange: [0.45, 1]}),
      ),
      transform: [
        {
          scale: Animated.multiply(
            joy.interpolate({
              inputRange: [0, 0.6, 1],
              outputRange: [0, 1.25, 1],
            }),
            twinkle.interpolate({inputRange: [0, 1], outputRange: [0.8, 1.1]}),
          ),
        },
        {
          rotate: twinkle.interpolate({
            inputRange: [0, 1],
            outputRange: [`${-18 * s.spin}deg`, `${18 * s.spin}deg`],
          }),
        },
      ],
    };
  };

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[style, {width, height}, flight]}>
      <Animated.Image
        source={LAYERS.glow}
        fadeDuration={0}
        style={[styles.layer, glowStyle]}
      />
      <Animated.Image
        source={LAYERS.wingL}
        fadeDuration={0}
        style={[styles.layer, wingL]}
      />
      <Animated.Image
        source={LAYERS.wingR}
        fadeDuration={0}
        style={[styles.layer, wingR]}
      />
      <Animated.Image
        source={LAYERS.body}
        fadeDuration={0}
        style={styles.layer}
      />
      <Animated.Image
        source={LAYERS.blink}
        fadeDuration={0}
        style={[styles.layer, {opacity: blink}]}
      />
      <Animated.Image
        source={LAYERS.happy}
        fadeDuration={0}
        style={[styles.layer, {opacity: joy}]}
      />
      {SPARKLES.map((s, i) => (
        <Animated.View key={i} style={[styles.sparkle, sparkle(i)]}>
          <Svg width="100%" height="100%" viewBox="0 0 24 24">
            <Path d={STAR_D} fill={SPARKLE_COLOR} />
          </Svg>
        </Animated.View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  sparkle: {
    position: 'absolute',
  },
});
