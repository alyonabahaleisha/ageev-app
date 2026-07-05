import React, {useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_CLOCK, ICON_MORE_HORIZONTAL, ICON_SEARCH} from '../assets/icons';
import {RemoteImage} from '../components/RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {formatDuration, Meditation, useMeditations} from '../services/meditations';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const CARD_GAP = 16;
const CARD_W = Math.floor(
  (Dimensions.get('window').width - SECTION_MARGIN * 2 - CARD_GAP) / 2,
);
const CARD_H = Math.round((CARD_W * 200) / 163);
const CARD_RADIUS = 20;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;

const DEFAULT_FILTERS =
  'Все, Короткие, Длинные, Спокойствие, Тревога, Любовь, Энергия, Изобилие, Уверенность, Принятие';


type Props = {onBack: () => void};

function MeditationCard({item}: {item: Meditation}) {
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
      <View style={styles.cardContent}>
        <View style={styles.cardTextBlock}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View style={styles.timeRow}>
            <SvgXml xml={ICON_CLOCK} width={18} height={18} />
            <Text style={styles.timeText}>{formatDuration(item.durationSeconds)}</Text>
          </View>
          <SvgXml xml={ICON_MORE_HORIZONTAL} width={24} height={24} />
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

export function MeditationsScreen({onBack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState(0);
  const {meditations, loading} = useMeditations();
  const t = useUIStrings();
  const filters = t('meditations_filters', DEFAULT_FILTERS)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, {paddingTop: top + 7}]}
      showsVerticalScrollIndicator={false}>

      {/* Header */}
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

      {/* Title */}
      <Text style={styles.title}>{t('meditations_title', 'Медитации')}</Text>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}>
        {filters.map((label, i) => (
          <TouchableOpacity
            key={label}
            activeOpacity={0.85}
            onPress={() => setActiveFilter(i)}
            style={[styles.filterChip, i === activeFilter && styles.filterChipActive]}>
            <Text style={[styles.filterText, i === activeFilter && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cards grid */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <View style={styles.grid}>
          {meditations.map(m => (
            <MeditationCard key={m.id} item={m} />
          ))}
        </View>
      )}

      <View style={{height: bottom + 110}} />
    </ScrollView>
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

  // ── Cards grid ────────────────────────────────────────────────────────────
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginTop: 16,
    marginHorizontal: SECTION_MARGIN,
  },

  // ── Meditation card ───────────────────────────────────────────────────────
  cardGlow: {
    width: CARD_W,
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
    width: CARD_W,
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
    width: CARD_W,
    height: CARD_H,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
  },
  cardContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTextBlock: {
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    color: colors.white,
  },
  cardSubtitle: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});
