import React, {useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {nudge, useOnPlay} from '../services/motion';

// Bottom-menu icons with a tap response. One motion per icon, carried by a
// spring, nothing decorative:
//   home      – a single hop
//   thinking  – the bulb tilts and swings back, its light comes on briefly
//   practices – the play triangle nudges forward
//   club      – the side figures ease apart, the centre one lifts
//   profile   – a nod
// Every glyph is drawn at exactly its on-screen size and only ever moved or
// turned (never resized), so it is pixel-sharp at rest and stays clean in
// motion. Transform/opacity on the native driver only.

export type TabIconName =
  | 'home'
  | 'thinking'
  | 'practices'
  | 'club'
  | 'profile';

type IconProps = {
  size: number;
  /** Bump to play the tap response. */
  play: number;
};

const BOX = 24; // glyphs are drawn on a 24-unit box
const WHITE = '#FFFFFF';

type GlyphStyle = Animated.WithAnimatedObject<object>;

/** One part of an icon: a full-size layer holding some of its paths. */
function Glyph({
  size,
  style,
  children,
}: {
  size: number;
  style?: GlyphStyle;
  children: React.ReactNode;
}) {
  return (
    <Animated.View pointerEvents="none" style={[styles.glyph, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

function Stroke({d}: {d: string}) {
  return (
    <Path
      d={d}
      stroke={WHITE}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  );
}

/** value 0→1 mapped to 0→`to`; the spring's overshoot carries through. */
function travel(value: Animated.Value, to: number) {
  return value.interpolate({inputRange: [0, 1], outputRange: [0, to]});
}

function useNudge(play: number, spring?: Parameters<typeof nudge>[1]) {
  const value = useRef(new Animated.Value(0)).current;
  useOnPlay(play, () => nudge(value, spring));
  return value;
}

// ── Home ────────────────────────────────────────────────────────────────────
const HOME_BODY =
  'M9.02 2.84016L3.63 7.04016C2.73 7.74016 2 9.23016 2 10.3602V17.7702C2 20.0902 3.89 21.9902 6.21 21.9902H17.79C20.11 21.9902 22 20.0902 22 17.7802V10.5002C22 9.29016 21.19 7.74016 20.2 7.05016L14.02 2.72016C12.62 1.74016 10.37 1.79016 9.02 2.84016Z';
const HOME_DOOR = 'M12 17.9902V14.9902';

function HomeIcon({size, play}: IconProps) {
  const u = size / BOX;
  const v = useNudge(play);
  return (
    <View style={{width: size, height: size}}>
      <Glyph
        size={size}
        style={{transform: [{translateY: travel(v, -3.5 * u)}]}}>
        <Stroke d={HOME_BODY} />
        <Stroke d={HOME_DOOR} />
      </Glyph>
    </View>
  );
}

// ── Thinking (lamp) ─────────────────────────────────────────────────────────
const LAMP_BULB =
  'M8.30011 18.0402V16.8802C6.00011 15.4902 4.11011 12.7802 4.11011 9.90018C4.11011 4.95018 8.66011 1.07018 13.8001 2.19018C16.0601 2.69018 18.0401 4.19018 19.0701 6.26018C21.1601 10.4602 18.9601 14.9202 15.7301 16.8702V18.0302C15.7301 18.3202 15.8401 18.9902 14.7701 18.9902H9.26011C8.16011 19.0002 8.30011 18.5702 8.30011 18.0402Z';
const LAMP_BASE = 'M8.5 22.0002C10.79 21.3502 13.21 21.3502 15.5 22.0002';

function LampIcon({size, play}: IconProps) {
  const u = size / BOX;
  // A touch looser than the others: it swings like something on a stem.
  const v = useNudge(play, {stiffness: 230, damping: 11});
  // Turn around the neck of the bulb (12, 19): shift it to the centre,
  // rotate, shift back. (transformOrigin is ignored by natively driven
  // transforms on device.)
  const dy = (19 - BOX / 2) * u;
  const tilt = {
    transform: [
      {translateY: dy},
      {
        rotate: v.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-13deg'],
        }),
      },
      {translateY: -dy},
    ],
  };
  const light = {
    opacity: v.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.4],
      extrapolate: 'clamp',
    }),
  };
  return (
    <View style={{width: size, height: size}}>
      <Animated.View style={[styles.glyph, tilt]}>
        <Glyph size={size} style={light}>
          <Path d={LAMP_BULB} fill={WHITE} />
        </Glyph>
        <Glyph size={size}>
          <Stroke d={LAMP_BULB} />
        </Glyph>
      </Animated.View>
      <Glyph size={size}>
        <Stroke d={LAMP_BASE} />
      </Glyph>
    </View>
  );
}

// ── Practices (play) ────────────────────────────────────────────────────────
const RING =
  'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z';
const PLAY_TRIANGLE =
  'M9.5 8.96997C9.5 8.34997 9.93 8.08997 10.46 8.38997L15.93 11.52C16.46 11.82 16.46 12.31 15.93 12.61L10.46 15.74C9.93 16.04 9.5 15.77 9.5 15.16V8.96997Z';

function PlayIcon({size, play}: IconProps) {
  const u = size / BOX;
  const v = useNudge(play);
  return (
    <View style={{width: size, height: size}}>
      <Glyph size={size}>
        <Stroke d={RING} />
      </Glyph>
      <Glyph
        size={size}
        style={{transform: [{translateX: travel(v, 2.4 * u)}]}}>
        <Stroke d={PLAY_TRIANGLE} />
      </Glyph>
    </View>
  );
}

// ── Club (people) ───────────────────────────────────────────────────────────
const PEOPLE = {
  rightHead:
    'M18.0001 7.16C17.9401 7.15 17.8701 7.15 17.8101 7.16C16.4301 7.11 15.3301 5.98 15.3301 4.58C15.3301 3.15 16.4801 2 17.9101 2C19.3401 2 20.4901 3.16 20.4901 4.58C20.4801 5.98 19.3801 7.11 18.0001 7.16Z',
  rightBody:
    'M16.9702 14.4402C18.3402 14.6702 19.8502 14.4302 20.9102 13.7202C22.3202 12.7802 22.3202 11.2402 20.9102 10.3002C19.8402 9.59016 18.3102 9.35016 16.9402 9.59016',
  leftHead:
    'M5.96998 7.16C6.02998 7.15 6.09998 7.15 6.15998 7.16C7.53998 7.11 8.63998 5.98 8.63998 4.58C8.63998 3.15 7.48998 2 6.05998 2C4.62998 2 3.47998 3.16 3.47998 4.58C3.48998 5.98 4.58998 7.11 5.96998 7.16Z',
  leftBody:
    'M6.99994 14.4402C5.62994 14.6702 4.11994 14.4302 3.05994 13.7202C1.64994 12.7802 1.64994 11.2402 3.05994 10.3002C4.12994 9.59016 5.65994 9.35016 7.02994 9.59016',
  centreHead:
    'M12.0001 14.6302C11.9401 14.6202 11.8701 14.6202 11.8101 14.6302C10.4301 14.5802 9.33008 13.4502 9.33008 12.0502C9.33008 10.6202 10.4801 9.47021 11.9101 9.47021C13.3401 9.47021 14.4901 10.6302 14.4901 12.0502C14.4801 13.4502 13.3801 14.5902 12.0001 14.6302Z',
  centreBody:
    'M9.08997 17.7804C7.67997 18.7204 7.67997 20.2603 9.08997 21.2003C10.69 22.2703 13.31 22.2703 14.91 21.2003C16.32 20.2603 16.32 18.7204 14.91 17.7804C13.32 16.7204 10.69 16.7204 9.08997 17.7804Z',
};

function PeopleIcon({size, play}: IconProps) {
  const u = size / BOX;
  const v = useNudge(play);
  return (
    <View style={{width: size, height: size}}>
      <Glyph
        size={size}
        style={{transform: [{translateX: travel(v, -1.8 * u)}]}}>
        <Stroke d={PEOPLE.leftHead} />
        <Stroke d={PEOPLE.leftBody} />
      </Glyph>
      <Glyph
        size={size}
        style={{transform: [{translateX: travel(v, 1.8 * u)}]}}>
        <Stroke d={PEOPLE.rightHead} />
        <Stroke d={PEOPLE.rightBody} />
      </Glyph>
      <Glyph
        size={size}
        style={{transform: [{translateY: travel(v, -1.6 * u)}]}}>
        <Stroke d={PEOPLE.centreHead} />
        <Stroke d={PEOPLE.centreBody} />
      </Glyph>
    </View>
  );
}

// ── Profile ─────────────────────────────────────────────────────────────────
const PROFILE_HEAD =
  'M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z';
const PROFILE_SHOULDERS =
  'M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z';

function ProfileIcon({size, play}: IconProps) {
  const u = size / BOX;
  const v = useNudge(play);
  return (
    <View style={{width: size, height: size}}>
      <Glyph size={size}>
        <Stroke d={RING} />
        <Stroke d={PROFILE_SHOULDERS} />
      </Glyph>
      {/* The nod: the head dips and comes back up. */}
      <Glyph
        size={size}
        style={{transform: [{translateY: travel(v, 1.8 * u)}]}}>
        <Stroke d={PROFILE_HEAD} />
      </Glyph>
    </View>
  );
}

const ICONS: Record<TabIconName, (props: IconProps) => React.JSX.Element> = {
  home: HomeIcon,
  thinking: LampIcon,
  practices: PlayIcon,
  club: PeopleIcon,
  profile: ProfileIcon,
};

export function TabIcon({name, ...props}: IconProps & {name: TabIconName}) {
  const Icon = ICONS[name];
  return <Icon {...props} />;
}

const styles = StyleSheet.create({
  glyph: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
