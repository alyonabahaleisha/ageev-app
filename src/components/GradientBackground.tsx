import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {gradients} from '../theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: keyof typeof gradients;
};

export function GradientBackground({children, style, variant = 'background'}: Props) {
  return (
    <LinearGradient
      colors={gradients[variant]}
      start={{x: 0.5, y: 0}}
      end={{x: 0.5, y: 1}}
      style={[styles.container, style]}>
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
