import React from 'react';
import {
  Text as RNText,
  TextProps,
  TextStyle,
  StyleSheet,
} from 'react-native';
import {TEXT_SCALES, useAppSettings} from '../services/settings';

// Единый Text приложения: настройка «Размер текста» применяется ко всем
// надписям — fontSize и lineHeight из стиля умножаются на выбранный масштаб.
// Везде импортируется вместо Text из react-native (см. настройки, TEXT_SCALES).
export const Text = React.forwardRef<RNText, TextProps>(function Text(
  props,
  ref,
) {
  const {settings} = useAppSettings();
  const scale = TEXT_SCALES[settings.textSize];
  if (scale === 1) {
    return <RNText ref={ref} {...props} />;
  }
  const flat = (StyleSheet.flatten(props.style) || {}) as TextStyle;
  const scaled: TextStyle = {...flat};
  if (typeof flat.fontSize === 'number') {
    scaled.fontSize = Math.round(flat.fontSize * scale);
  }
  if (typeof flat.lineHeight === 'number') {
    scaled.lineHeight = Math.round(flat.lineHeight * scale);
  }
  return <RNText ref={ref} {...props} style={scaled} />;
});
