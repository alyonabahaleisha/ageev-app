import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

// Компактный индикатор загрузки в духе системного iOS: тонкая бледная
// дорожка и «комета» — яркая дуга с затухающим хвостом из трёх сегментов.
// Дуги нарисованы один раз, вращается контейнер (нативный драйвер), поэтому
// спиннер не дёргается, пока JS-поток занят загрузкой аудио.

type Props = {
  size?: number;
  color?: string;
  /** Толщина штриха, px. */
  stroke?: number;
  /** Один оборот, мс. */
  period?: number;
  style?: Animated.WithAnimatedValue<object>;
};

export function LoadingSpinner({
  size = 28,
  color = '#FFFFFF',
  stroke = 2,
  period = 1000,
  style,
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: period,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, period]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const c = size / 2;
  const r = c - stroke;
  const circ = 2 * Math.PI * r;
  // Хвост: сегменты от головы назад, каждый бледнее предыдущего.
  const tail = [
    {len: 0.2, start: 0, opacity: 0.95},
    {len: 0.12, start: 0.2, opacity: 0.45},
    {len: 0.1, start: 0.32, opacity: 0.18},
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.box, {width: size, height: size}, style]}>
      <Svg width={size} height={size}>
        <Circle
          cx={c}
          cy={c}
          r={r}
          stroke={color}
          strokeOpacity={0.14}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate}]}]}>
        <Svg width={size} height={size}>
          {tail.map((seg, i) => (
            <Circle
              key={i}
              cx={c}
              cy={c}
              r={r}
              stroke={color}
              strokeOpacity={seg.opacity}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={[circ * seg.len, circ]}
              // Голова сегмента — в конце дуги; хвост уходит против вращения.
              strokeDashoffset={circ * seg.start}
            />
          ))}
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {alignItems: 'center', justifyContent: 'center'},
});
