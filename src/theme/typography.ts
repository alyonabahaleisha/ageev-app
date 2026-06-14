import {TextStyle} from 'react-native';

export const fonts = {
  manrope: {
    regular:  'Manrope-Regular',
    medium:   'Manrope-Medium',
    semiBold: 'Manrope-SemiBold',
  },
  inter: {
    semiBold: 'Inter-SemiBold',
  },
} as const;

// Typography scale from Figma
export const typography: Record<string, TextStyle> = {
  // Display — Inter, used for large hero numbers/accents
  display: {
    fontFamily: fonts.inter.semiBold,
    fontSize: 80,
    lineHeight: 96.8,
    fontWeight: '600',
  },

  // Headings — Manrope SemiBold
  h1: {
    fontFamily: fonts.manrope.semiBold,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '600',
  },
  h2: {
    fontFamily: fonts.manrope.medium,
    fontSize: 22,
    lineHeight: 26.4,
    fontWeight: '500',
  },

  // Body — Manrope
  bodyLarge: {
    fontFamily: fonts.manrope.medium,
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
  },
  body: {
    fontFamily: fonts.manrope.regular,
    fontSize: 16,
    lineHeight: 20.8,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fonts.manrope.medium,
    fontSize: 16,
    lineHeight: 20.8,
    fontWeight: '500',
  },
  button: {
    fontFamily: fonts.manrope.semiBold,
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Small
  small: {
    fontFamily: fonts.manrope.regular,
    fontSize: 13,
    lineHeight: 16.9,
    fontWeight: '400',
  },
  caption: {
    fontFamily: fonts.manrope.medium,
    fontSize: 15,
    lineHeight: 19.5,
    fontWeight: '500',
  },
  label: {
    fontFamily: fonts.manrope.medium,
    fontSize: 11.5,
    lineHeight: 14.9,
    fontWeight: '500',
  },
};
