import React, {useEffect, useRef, useState} from 'react';
import {Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {ICON_CLOSE} from '../assets/icons';
import {requestOpenFavorites} from '../services/appNavigation';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {fonts, typography} from '../theme/typography';

// «Сохранено» banner (design 448:13206) — появляется после добавления в
// избранное; тап открывает Избранное, крестик закрывает. Общий для плеера
// и экранов с аффирмациями.

const HIDE_AFTER_MS = 4000;

/** Показ/скрытие тоста с автозакрытием — общая логика для всех экранов. */
export function useSavedToast() {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function show() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(true);
    timer.current = setTimeout(() => setVisible(false), HIDE_AFTER_MS);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }
  /** Показать при добавлении, скрыть при снятии лайка. */
  function onToggled(added: boolean) {
    added ? show() : hide();
  }
  return {visible, show, hide, onToggled};
}

type Props = {
  /** Absolute top position (обычно top-инсет + 7). */
  top: number;
  onClose: () => void;
  /** Доп. действие перед открытием Избранного (например, скрыть экран). */
  onOpenFavorites?: () => void;
};

export function SavedToast({top, onClose, onOpenFavorites}: Props) {
  const t = useUIStrings();
  return (
    <View style={[styles.toast, {top}]}>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.col}
        onPress={() => {
          onClose();
          onOpenFavorites?.();
          requestOpenFavorites();
        }}>
        <Text style={styles.title}>{t('player_saved_title', 'Сохранено')}</Text>
        <View style={styles.row}>
          <Text style={styles.sub}>
            {t('player_saved_sub', 'Смотреть в разделе')}
          </Text>
          <Text style={styles.link}>
            {t('player_saved_favorites', 'Избранное')}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onClose}
        style={styles.close}>
        <SvgXml xml={ICON_CLOSE} width={24} height={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 16,
    paddingRight: 12,
    backgroundColor: '#22618D',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  col: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.manrope.medium,
    fontSize: 14,
    lineHeight: 18.2,
    fontWeight: '500',
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  sub: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  link: {
    ...typography.small,
    color: '#7BC4F3',
  },
  close: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
