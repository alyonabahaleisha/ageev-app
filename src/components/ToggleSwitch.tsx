import React from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {colors} from '../theme/colors';

const TRACK_W = 50;
const TRACK_H = 25;
const THUMB = 19;
const INSET = 3;

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

// Тумблер из Figma 448:10510: белый трек 50×25, голубой кружок справа во
// включённом состоянии; выключенный — стеклянный трек, кружок слева.
export function ToggleSwitch({value, onChange}: Props) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}>
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: colors.white,
  },
  trackOff: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thumbOn: {
    alignSelf: 'flex-end',
    marginRight: INSET,
    backgroundColor: colors.brand.pale,
    // мягкое голубое свечение вокруг кружка, как в макете
    shadowColor: colors.brand.pale,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbOff: {
    alignSelf: 'flex-start',
    marginLeft: INSET,
    backgroundColor: colors.white,
    opacity: 0.75,
  },
});
