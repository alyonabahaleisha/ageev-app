import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import {colors} from '../theme/colors';
import {fonts} from '../theme/typography';

type Props = {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
};

// "button primary" из Figma (389:5814): белая пилюля 52px с голубым свечением.
export function PrimaryButton({title, onPress, loading, style}: Props) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={loading}
      style={[styles.button, style]}>
      {loading ? (
        <ActivityIndicator color={colors.dark} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 50,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    // shadow/primary button: 0px 14px 40px rgba(95,167,214,0.35)
    shadowColor: colors.brand.lighter,
    shadowOffset: {width: 0, height: 14},
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 8,
  },
  label: {
    fontFamily: fonts.manrope.semiBold,
    fontSize: 15,
    lineHeight: 15,
    fontWeight: '600',
    color: '#2C2C2C',
  },
});
