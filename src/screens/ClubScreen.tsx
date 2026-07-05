import React, {useState} from 'react';
import {
  Image,
  Keyboard,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ICON_BACK, ICON_SEARCH, ICON_EXPAND, ICON_CLOSE} from '../assets/icons';
import {FixedHeader, headerScrollPadding} from '../components/FixedHeader';
import {GradientBackground} from '../components/GradientBackground';
import LinearGradient from '../components/LinearGradient';
import {useClubs} from '../services/clubs';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const SECTION_MARGIN = 24;
const BTN_SIZE = 47;
const BTN_RADIUS = 23.5;
const CARD_RADIUS = 20;

// Russian plural for "город" (city): 1 → город, 2–4 → города, else → городов.
function cityWord(n: number, forms: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

type Props = {onOpenMap: () => void; onClose: () => void};

export function ClubScreen({onOpenMap, onClose}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const {clubs} = useClubs();
  const t = useUIStrings();
  const [query, setQuery] = useState('');
  // Search mode: the input docks at the top under the header and the results
  // fill the screen (all cities when the query is empty).
  const [searchActive, setSearchActive] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? clubs.filter(c => c.city.toLowerCase().includes(trimmed))
    : clubs;

  const closeSearch = () => {
    setSearchActive(false);
    setQuery('');
    Keyboard.dismiss();
  };

  const count = clubs.length;
  const cityForms: [string, string, string] = [
    t('clubs_city_one', 'город'),
    t('clubs_city_few', 'города'),
    t('clubs_city_many', 'городов'),
  ];
  const subtitle =
    count > 0
      ? `${count} ${cityWord(count, cityForms)} ${t(
          'clubs_card_subtitle_suffix',
          'по всему миру – найдите ближайшее пространство практики и поддержки.',
        )}`
      : t(
          'clubs_card_subtitle_empty',
          'Найдите ближайшее пространство практики и поддержки.',
        );

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {paddingTop: headerScrollPadding(top), paddingBottom: bottom + 110},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.title}>
            {t('clubs_intro_title', 'Клуб Михаила Агеева')}
          </Text>
          <Text style={styles.subtitle}>
            {t(
              'clubs_intro_subtitle',
              'Это сообщество людей, объединённых практиками Михаила и стремлением к внутреннему балансу.',
            )}
          </Text>
        </View>

        {/* Map preview + search */}
        <View style={styles.previewGroup}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onOpenMap}
            style={styles.cardShadow}>
            <View style={styles.card}>
              <Image
                source={require('../assets/images/clubs-map.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              {/* Top→bottom darkening so the text stays legible. */}
              <LinearGradient
                colors={['rgba(102,102,102,0.4)', 'rgba(0,0,0,1)']}
                start={{x: 0.5, y: 0}}
                end={{x: 0.5, y: 1}}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              {/* Expand badge (top-right) */}
              <View style={styles.badge}>
                <SvgXml xml={ICON_EXPAND} width={20} height={20} />
              </View>
              {/* Caption (bottom-left) */}
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {t('clubs_card_title', 'Клубы рядом с вами')}
                </Text>
                <Text style={styles.cardSubtitle}>{subtitle}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSearchActive(true)}
            style={styles.searchField}>
            <SvgXml xml={ICON_SEARCH} width={16} height={16} />
            <Text style={styles.searchPlaceholder}>
              {t('clubs_search_placeholder', 'Найти город')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Search mode — full-screen overlay: input docked at the top, city list
          below it, everything above the keyboard. */}
      {searchActive && (
        <GradientBackground style={styles.searchOverlay}>
          <View style={[styles.searchTopRow, {paddingTop: headerScrollPadding(top)}]}>
            <View style={[styles.searchField, styles.searchFieldActive]}>
              <SvgXml xml={ICON_SEARCH} width={16} height={16} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t('clubs_search_placeholder', 'Найти город')}
                placeholderTextColor="rgba(255,255,255,0.65)"
                style={styles.searchInput}
                autoCorrect={false}
                returnKeyType="search"
                autoFocus
              />
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={closeSearch}>
              <Text style={styles.searchCancel}>
                {t('clubs_search_cancel', 'Отмена')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.resultsContent}
            automaticallyAdjustKeyboardInsets
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            <View style={styles.results}>
              {results.map((club, i) => (
                <React.Fragment key={club.id}>
                  {i > 0 && <View style={styles.resultDivider} />}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.resultRow}
                    onPress={() =>
                      club.telegramUrl &&
                      Linking.openURL(club.telegramUrl).catch(() => {})
                    }>
                    <View style={styles.resultText}>
                      <Text style={styles.resultCity}>{club.city}</Text>
                      <Text style={styles.resultInfo} numberOfLines={1}>
                        {[club.country, club.leader].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <View style={styles.resultBtn}>
                      <View style={styles.resultArrow}>
                        <SvgXml xml={ICON_BACK} width={20} height={20} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
              {results.length === 0 && (
                <Text style={styles.resultEmpty}>
                  {t('clubs_search_empty', 'Ничего не найдено')}
                </Text>
              )}
            </View>
          </ScrollView>
        </GradientBackground>
      )}

      {/* Fixed header — title + close button (right) */}
      <FixedHeader>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('clubs_title', 'Клуб')}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.closeBtn}>
            <SvgXml xml={ICON_CLOSE} width={24} height={24} />
          </TouchableOpacity>
        </View>
      </FixedHeader>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {flexGrow: 1},

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SECTION_MARGIN,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.white,
  },
  closeBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Intro ────────────────────────────────────────────────────────────────
  intro: {
    marginTop: 16,
    marginHorizontal: SECTION_MARGIN,
    gap: 12,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },

  // ── Map preview card + search ──────────────────────────────────────────────
  previewGroup: {
    marginTop: 24,
    marginHorizontal: SECTION_MARGIN,
    gap: 16,
  },
  cardShadow: {
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {elevation: 4},
    }),
  },
  card: {
    height: 230,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 47,
    height: 47,
    borderRadius: 23.5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    ...typography.bodyMedium,
    color: colors.white,
  },
  cardSubtitle: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: {
    ...typography.small,
    color: colors.white,
    flex: 1,
    padding: 0,
  },
  searchPlaceholder: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
  },

  // ── Search mode overlay ─────────────────────────────────────────────────────
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  searchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SECTION_MARGIN,
    paddingBottom: 4,
  },
  searchFieldActive: {
    flex: 1,
  },
  searchCancel: {
    ...typography.body,
    color: colors.white,
  },
  resultsContent: {
    paddingHorizontal: SECTION_MARGIN,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // ── Search results (design 411:7402) ───────────────────────────────────────
  results: {
    gap: 12,
  },
  resultDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resultText: {
    flex: 1,
    gap: 8,
  },
  resultCity: {
    fontFamily: 'Manrope-Medium',
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
  },
  resultInfo: {
    ...typography.body,
    color: colors.white,
    opacity: 0.65,
  },
  resultBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultArrow: {
    transform: [{rotate: '180deg'}],
  },
  resultEmpty: {
    ...typography.small,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
