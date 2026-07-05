import React, {useState} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_CLOCK, ICON_PLAY_TRIANGLE, ICON_SEARCH} from '../assets/icons';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import LinearGradient from '../components/LinearGradient';
import {RemoteImage} from '../components/RemoteImage';
import {formatDuration} from '../services/meditations';
import {Webinar, useWebinars} from '../services/webinars';
import {usePlayer} from '../context/PlayerContext';
import {useContentFilters} from '../services/contentFilters';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
// Design 411:8176: full-width 342×170 cards stacked vertically, 12px apart.
const CARD_GAP = 12;
const CARD_H = 170;
const CARD_RADIUS = 20;
const CARD_PAD = 14;
const PLAY_BTN = 50;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;

type Props = {onBack: () => void};

function WebinarCard({item}: {item: Webinar}) {
  const {openPlayer} = usePlayer();
  const onPress = () =>
    openPlayer({
      id: item.id,
      title: item.title,
      description: item.description,
      audioUrl: item.audioUrl,
      coverUrl: item.coverUrl,
      durationSeconds: item.durationSeconds,
    });

  const inner = (
    <View style={styles.cardClip}>
      <RemoteImage source={{uri: item.coverUrl}} style={styles.cardBg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.25)', 'rgba(102,102,102,0.25)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.cardBg}
        pointerEvents="none"
      />
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <SvgXml xml={ICON_CLOCK} width={18} height={18} />
            <Text style={styles.timeText}>{formatDuration(item.durationSeconds)}</Text>
          </View>
        </View>
        <View style={styles.playBtn}>
          <SvgXml xml={ICON_PLAY_TRIANGLE} width={16} height={16} />
        </View>
      </View>
    </View>
  );

  if (Platform.OS !== 'ios') {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.cardGlow}>
      <View style={styles.cardShadow}>{inner}</View>
    </TouchableOpacity>
  );
}

export function WebinarsScreen({onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {webinars, loading} = useWebinars();
  const t = useUIStrings();
  const {filters, activeIndex, setActiveIndex, filtered} = useContentFilters(
    webinars,
  );

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, {paddingTop: headerScrollPadding(top)}]}
      showsVerticalScrollIndicator={false}>

      {/* Title */}
      <Text style={styles.title}>{t('webinars_title', 'Вебинары')}</Text>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}>
        {filters.map((f, i) => (
          <TouchableOpacity
            key={f.key}
            activeOpacity={0.85}
            onPress={() => setActiveIndex(i)}
            style={[styles.filterChip, i === activeIndex && styles.filterChipActive]}>
            <Text style={[styles.filterText, i === activeIndex && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cards list */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map(w => (
            <WebinarCard key={w.id} item={w} />
          ))}
        </View>
      )}

      <View style={{height: bottom + 110}} />
    </ScrollView>

    {/* Sticky header — pinned above the scrolling content */}
    <FixedHeader>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={onBack} style={styles.backBtn}>
          <SvgXml xml={ICON_BACK} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.searchGlow}>
          <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn}>
            <SvgXml xml={ICON_SEARCH} width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>
    </FixedHeader>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  backBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchGlow: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#ffffff',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
    }),
  },
  searchBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 24},
        shadowOpacity: 0.28,
        shadowRadius: 30,
      },
    }),
  },

  // ── Title ─────────────────────────────────────────────────────────────────
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginTop: 18,
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  filtersScroll: {
    marginTop: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
  filtersContent: {
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

  loader: {
    marginTop: 16,
    paddingHorizontal: SECTION_MARGIN,
    paddingVertical: 40,
    alignItems: 'center',
  },

  // ── Cards list ────────────────────────────────────────────────────────────
  list: {
    gap: CARD_GAP,
    marginTop: 20,
    marginHorizontal: SECTION_MARGIN,
  },

  // ── Webinar card ──────────────────────────────────────────────────────────
  cardGlow: {
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  cardShadow: {
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  cardClip: {
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: CARD_PAD,
    gap: 10,
  },
  cardLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTextBlock: {
    gap: 12,
  },
  cardTitle: {
    ...typography.body,
    color: colors.white,
    // Design reserves a fixed 2-line slot (42pt) so descriptions align
    // across cards regardless of title length.
    minHeight: 42,
  },
  cardSubtitle: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeText: {
    ...typography.small,
    color: colors.white,
  },
  playBtn: {
    width: PLAY_BTN,
    height: PLAY_BTN,
    borderRadius: PLAY_BTN / 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.2,
        shadowRadius: 32,
      },
    }),
  },
});
