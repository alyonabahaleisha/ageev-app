import React, {useEffect, useRef, useState} from 'react';
import {Animated} from 'react-native';
import Svg, {Path} from 'react-native-svg';

// Иконка play/pause с морфом «как у YouTube/Material»: треугольник
// поворачивается на 90° и распадается на два бруска паузы (и обратно).
// Фигуры заданы в системе координат ДО поворота: бруски паузы здесь
// горизонтальные — после поворота контейнера на 90° они встают вертикально.
// Точки сопоставлены по порядку (4 на фигуру), поэтому линейная интерполяция
// координат даёт непрерывное превращение без скачков. Коробка 30×30.

type Pt = [number, number];

// Треугольник: основание x=7 (y 3…27), остриё (26, 15); разрез по x=16.5.
const PLAY_L: Pt[] = [
  [7, 3],
  [16.5, 9],
  [16.5, 21],
  [7, 27],
];
const PLAY_R: Pt[] = [
  [16.5, 9],
  [26, 15],
  [26, 15],
  [16.5, 21],
];
// Горизонтальные бруски (после поворота на 90° по часовой: верхний → правый
// вертикальный, нижний → левый).
const BAR_TOP: Pt[] = [
  [3, 7.5],
  [27, 7.5],
  [27, 11.5],
  [3, 11.5],
];
const BAR_BOTTOM: Pt[] = [
  [3, 18.5],
  [27, 18.5],
  [27, 22.5],
  [3, 22.5],
];

function lerpPath(from: Pt[], to: Pt[], t: number): string {
  return (
    from
      .map(([x0, y0], i) => {
        const [x1, y1] = to[i];
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
}

type Props = {
  /** true — показываем паузу (трек играет), false — плей. */
  playing: boolean;
  size?: number;
  color?: string;
  opacity?: number;
};

export function PlayPauseIcon({
  playing,
  size = 30,
  color = '#FFFFFF',
  opacity = 1,
}: Props) {
  // 0 = плей, 1 = пауза. Путь SVG — строка, нативно её не прогнать, поэтому
  // JS-драйвер + setState на каждый кадр (~300 мс — незаметно). Поворот
  // контейнера идёт от того же значения, чтобы фазы совпадали.
  const anim = useRef(new Animated.Value(playing ? 1 : 0)).current;
  const [t, setT] = useState(playing ? 1 : 0);

  useEffect(() => {
    const id = anim.addListener(({value}) => setT(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: playing ? 1 : 0,
      // Лёгкий перелёт в конце — фигура «досаживается», а не замирает.
      tension: 140,
      friction: 11,
      useNativeDriver: false,
    }).start();
  }, [playing, anim]);

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const shape = {
    fill: color,
    // Обводка тем же цветом со скруглёнными стыками даёт мягкие углы
    // брускам и треугольнику (у Path нет rx, как у rect в ICON_PAUSE).
    stroke: color,
    strokeWidth: 1.5,
    strokeLinejoin: 'round' as const,
    opacity,
  };

  return (
    <Animated.View style={{width: size, height: size, transform: [{rotate}]}}>
      <Svg width={size} height={size} viewBox="0 0 30 30">
        <Path d={lerpPath(PLAY_L, BAR_TOP, t)} {...shape} />
        <Path d={lerpPath(PLAY_R, BAR_BOTTOM, t)} {...shape} />
      </Svg>
    </Animated.View>
  );
}
