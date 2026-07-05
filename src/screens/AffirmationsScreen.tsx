import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_AFFIRMATION, ICON_ARROW_UP, ICON_BACK} from '../assets/icons';
import {
  Affirmation,
  dailyAffirmationIndex,
  useAffirmations,
} from '../services/affirmations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const BTN_SIZE = 34;
const SECTION_MARGIN = 24;

// Figma reference frame: 390×844
const HINT_BOTTOM_RATIO = (844 - 714) / 844; // 130/844

const ALL_FILTER = 'Все';

// Scale the font to the affirmation length with a proportional line height.
// (We avoid `adjustsFontSizeToFit`: on iOS it shrinks the font but keeps the
// fixed lineHeight, producing tiny text with huge line gaps.)
function fontForText(text: string): {fontSize: number; lineHeight: number} {
  const len = text.length;
  if (len <= 60) return {fontSize: 26, lineHeight: 34};
  if (len <= 120) return {fontSize: 23, lineHeight: 31};
  if (len <= 220) return {fontSize: 20, lineHeight: 27};
  if (len <= 340) return {fontSize: 18, lineHeight: 24};
  return {fontSize: 16, lineHeight: 22};
}

type Props = {onBack: () => void};

export function AffirmationsScreen({onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(0);
  const listRef = useRef<FlatList<Affirmation>>(null);
  const {affirmations, loading} = useAffirmations();
  const t = useUIStrings();
  const allLabel = t('affirmations_filter_all', ALL_FILTER);

  // Filter chips are derived from the categories present in admin data,
  // in their sortOrder-driven order, with "Все" pinned first.
  const filters = useMemo(() => {
    const seen: string[] = [];
    for (const a of affirmations) {
      if (a.categoryLabel && !seen.includes(a.categoryLabel)) {
        seen.push(a.categoryLabel);
      }
    }
    return [allLabel, ...seen];
  }, [affirmations, allLabel]);

  const filtered =
    activeFilter === 0
      ? affirmations
      : affirmations.filter(a => a.categoryLabel === filters[activeFilter]);

  // Open on the same "мысль на сегодня" the home card shows (full list only;
  // category views start at their first card).
  const dailyIdx =
    activeFilter === 0 ? dailyAffirmationIndex(affirmations.length) : 0;
  const didInitScroll = useRef(false);
  useEffect(() => {
    if (didInitScroll.current || affirmations.length === 0) {
      return;
    }
    didInitScroll.current = true;
    const offset = SCREEN_H * dailyAffirmationIndex(affirmations.length);
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({offset, animated: false}),
    );
  }, [affirmations.length]);

  const filterTop = top + 7 + BTN_SIZE + 14;
  // Bound the affirmation text between the filter chips and the swipe hint so
  // long, multi-sentence affirmations stay centered and never overlap either.
  const textBoxTop = filterTop + 48 + 16;
  const textBoxBottom = SCREEN_H * HINT_BOTTOM_RATIO + bottom + 88;

  function handleFilterPress(i: number) {
    setActiveFilter(i);
    listRef.current?.scrollToOffset({offset: 0, animated: false});
  }

  // The full-screen background decodes noticeably slower than the text lays
  // out, so the text used to flash on the bare gradient first. Keep the whole
  // screen invisible until the background reports loaded, then fade it in.
  const fade = useRef(new Animated.Value(0)).current;
  const onBgLoad = useCallback(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <Animated.View style={[styles.root, {opacity: fade}]}>
      {/* Single shared background — every page shows the same image, so it
          lives behind the pager instead of inside each page. This kills the
          re-decode flicker on category switch (the list remounts, the
          background doesn't). */}
      <Image
        source={require('../assets/images/affirmation-bg.png')}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
        onLoad={onBgLoad}
      />

      {/* Vertical pager — full screen, each page one affirmation */}
      <FlatList
        ref={listRef}
        key={activeFilter}
        data={filtered}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        ListEmptyComponent={
          <View style={styles.page}>
            <View
              style={[styles.textBox, {top: textBoxTop, bottom: textBoxBottom}]}>
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.affirmationText}>
                  {t('affirmations_empty', 'Аффирмации скоро появятся')}
                </Text>
              )}
            </View>
          </View>
        }
        renderItem={({item, index}) => (
          <View style={styles.page}>
            {/* Affirmation text + icons — vertically centered, length-scaled */}
            <View
              style={[styles.textBox, {top: textBoxTop, bottom: textBoxBottom}]}>
              <Text style={[styles.affirmationText, fontForText(item.text)]}>
                {item.text}
              </Text>
              <View style={styles.actionsRow}>
                <SvgXml xml={ICON_AFFIRMATION} width={64} height={24} />
              </View>
            </View>
            {/* Swipe-up hint — only on the initially visible card */}
            {index === dailyIdx && (
              <View style={[styles.hint, {bottom: SCREEN_H * HINT_BOTTOM_RATIO}]}>
                <Text style={styles.hintText}>
                  {t(
                    'affirmations_swipe_hint',
                    'Проведите вверх, чтобы увидеть следующую аффирмацию',
                  )}
                </Text>
                <SvgXml xml={ICON_ARROW_UP} width={24} height={24} />
              </View>
            )}
          </View>
        )}
      />

      {/* Fixed header overlay */}
      <View
        style={[styles.header, {paddingTop: top + 7}]}
        pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onBack}
          style={styles.backBtn}
          pointerEvents="auto">
          <SvgXml xml={ICON_BACK} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('affirmations_title', 'Аффирмации')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {/* Fixed filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScroll, {top: filterTop}]}
        contentContainerStyle={styles.filterContent}
        pointerEvents="auto">
        {filters.map((label, i) => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.85}
            onPress={() => handleFilterPress(i)}
            style={[
              styles.filterChip,
              i === activeFilter && styles.filterChipActive,
            ]}>
            <Text
              style={[
                styles.filterText,
                i === activeFilter && styles.filterTextActive,
              ]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Pager pages ───────────────────────────────────────────────────────────
  page: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  textBox: {
    position: 'absolute',
    left: SECTION_MARGIN,
    right: SECTION_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  affirmationText: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: 28,
  },
  hint: {
    position: 'absolute',
    left: 78,
    right: 78,
    alignItems: 'center',
    gap: 11,
  },
  hintText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 11.5,
    lineHeight: 14.95,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
  },

  // ── Fixed header ──────────────────────────────────────────────────────────
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  backBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },

  // ── Fixed filter chips ────────────────────────────────────────────────────
  filterScroll: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SECTION_MARGIN,
  },
  filterChip: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipActive: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  filterText: {
    ...typography.body,
    color: colors.white,
  },
  filterTextActive: {
    color: '#1C1C1E',
  },
});
