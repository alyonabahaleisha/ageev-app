import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';

// Сердечко «Избранного» с анимацией лайка: при добавлении контур сжимается,
// заливка выпрыгивает из центра с перелётом, вокруг разлетаются искры и
// расходится кольцо; при удалении заливка схлопывается внутрь. Всё —
// трансформации/прозрачность на нативном драйвере.

const HEART_D =
  'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 ' +
  '7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z';

const SPARKS = 7;

type Props = {
  liked: boolean;
  size?: number;
  color?: string;
  /** Цвет искр (по умолчанию — цвет сердца). */
  sparkColor?: string;
};

export function AnimatedHeart({
  liked,
  size = 24,
  color = '#FFFFFF',
  sparkColor,
}: Props) {
  const fill = useRef(new Animated.Value(liked ? 1 : 0)).current; // заливка
  const squeeze = useRef(new Animated.Value(1)).current; // контур
  const burst = useRef(new Animated.Value(0)).current; // искры + кольцо
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    squeeze.stopAnimation();
    fill.stopAnimation();
    if (liked) {
      burst.setValue(0);
      Animated.parallel([
        // Контур поджимается и возвращается — «вдох» перед заливкой.
        Animated.sequence([
          Animated.timing(squeeze, {
            toValue: 0.8,
            duration: 90,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(squeeze, {
            toValue: 1,
            tension: 180,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        // Заливка выпрыгивает из центра с перелётом.
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(fill, {
            toValue: 1,
            tension: 170,
            friction: 5.5,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(burst, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fill, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(squeeze, {
            toValue: 0.88,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.spring(squeeze, {
            toValue: 1,
            tension: 160,
            friction: 7,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [liked, fill, squeeze, burst]);

  // Заливка чуть перелетает (до 1.0 через spring — визуально ~1.15 на пике),
  // контур поверх даёт чистый край в конце.
  const fillScale = fill;
  const ringScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.9],
  });
  const ringOpacity = burst.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.6, 0],
  });
  const sparks = Array.from({length: SPARKS}, (_, i) => {
    const angle = (i / SPARKS) * Math.PI * 2 - Math.PI / 2;
    const dist = size * 0.95;
    return {
      translateX: burst.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(angle) * dist],
      }),
      translateY: burst.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(angle) * dist],
      }),
      scale: burst.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 1, 0.2],
      }),
      opacity: burst.interpolate({
        inputRange: [0, 0.15, 0.7, 1],
        outputRange: [0, 1, 0.6, 0],
      }),
    };
  });
  const dot = Math.max(2, size * 0.14);
  const spark = sparkColor ?? color;

  return (
    <View style={[styles.box, {width: size, height: size}]}>
      {/* Кольцо и искры — только на лайке, под сердцем. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.center,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: spark,
            opacity: ringOpacity,
            transform: [{scale: ringScale}],
          },
        ]}
      />
      {sparks.map((s, i) => (
        <Animated.View
          key={i}
          pointerEvents="none"
          style={[
            styles.center,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: spark,
              opacity: s.opacity,
              transform: [
                {translateX: s.translateX},
                {translateY: s.translateY},
                {scale: s.scale},
              ],
            },
          ]}
        />
      ))}
      <Animated.View style={{transform: [{scale: squeeze}]}}>
        {/* Заливка */}
        <Animated.View
          style={[StyleSheet.absoluteFill, {transform: [{scale: fillScale}]}]}>
          <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d={HEART_D} fill={color} />
          </Svg>
        </Animated.View>
        {/* Контур */}
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path
            d={HEART_D}
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {alignItems: 'center', justifyContent: 'center', overflow: 'visible'},
  center: {position: 'absolute'},
});

type ButtonProps = Props & {
  onPress: () => void;
  /** Стиль подложки кнопки (размер, фон); сердце центрируется внутри. */
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
};

/** Кнопка с сердечком: утапливается под пальцем, анимирует лайк/дизлайк. */
export function HeartButton({
  onPress,
  style,
  hitSlop = 8,
  ...heart
}: ButtonProps) {
  const press = useRef(new Animated.Value(1)).current;
  const pressTo = (v: number) =>
    Animated.spring(press, {
      toValue: v,
      speed: 40,
      bounciness: v < 1 ? 0 : 8,
      useNativeDriver: true,
    }).start();
  return (
    <Pressable
      onPressIn={() => pressTo(0.88)}
      onPressOut={() => pressTo(1)}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityState={{selected: heart.liked}}
      accessibilityLabel={heart.liked ? 'Убрать из избранного' : 'В избранное'}>
      <Animated.View style={[style, {transform: [{scale: press}]}]}>
        <AnimatedHeart {...heart} />
      </Animated.View>
    </Pressable>
  );
}
