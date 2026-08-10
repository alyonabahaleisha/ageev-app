import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ICON_CLOCK,
  ICON_CLOSE_PLAYER,
  ICON_HEART_FILLED,
  ICON_PLAY_TRIANGLE,
  ICON_STORY_HEART,
  ICON_STORY_SHARE,
} from '../assets/icons';
import LinearGradient from './LinearGradient';
import {RemoteImage} from './RemoteImage';
import {
  ShareAffirmationItem,
  ShareAffirmationModal,
} from './ShareAffirmation';
import {PlayerTrack} from '../context/PlayerContext';
import {dailyAffirmationIndex, useAffirmations} from '../services/affirmations';
import {useFavorites} from '../services/favorites';
import {formatDuration, useRecommended} from '../services/recommended';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

// Экраны после завершения практики (Правки, Figma 489:11217 — «Нет этих
// экранов после завершения практик»):
//  1. «Как вы себя чувствуете?» — самооценка состояния после практики;
//  2. «Что поможет вам дальше» — рекомендации и аффирмация на сегодня.

type Props = {
  onClose: () => void;
  /** Открыть рекомендованную практику в плеере (оверлей закрывается). */
  onOpenTrack: (track: PlayerTrack) => void;
};

export function PostPracticeOverlay({onClose, onOpenTrack}: Props) {
  const {top, bottom} = useSafeAreaInsets();
  const t = useUIStrings();
  const [step, setStep] = useState<'mood' | 'next'>('mood');
  const [mood, setMood] = useState<number | null>(null);
  const {cards} = useRecommended();
  const {affirmations} = useAffirmations();
  const {isFavorite, toggleFavorite} = useFavorites();
  const [shareItem, setShareItem] = useState<ShareAffirmationItem | null>(null);

  const affirmation =
    affirmations.length > 0
      ? affirmations[dailyAffirmationIndex(affirmations.length)]
      : null;

  const moods = [
    t('post_practice_mood_better', 'Лучше'),
    t('post_practice_mood_calm', 'Спокойно и ровно'),
    t('post_practice_mood_same', 'Пока без изменений'),
  ];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#22618D', '#347FB3', '#165079', '#165079']}
        locations={[0, 0.34, 0.68, 1]}
        start={{x: 0.3, y: 0}}
        end={{x: 0.7, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Шапка: крестик закрывает весь флоу */}
      <View style={[styles.header, {paddingTop: top + 7}]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onClose}
          style={styles.closeBtn}>
          <SvgXml xml={ICON_CLOSE_PLAYER} width={30} height={30} />
        </TouchableOpacity>
      </View>

      {step === 'mood' ? (
        <View style={[styles.moodWrap, {paddingBottom: bottom + 24}]}>
          <Text style={styles.title}>
            {t('post_practice_mood_title', 'Как вы себя чувствуете?')}
          </Text>
          <View style={styles.moodOptions}>
            {moods.map((label, i) => (
              <TouchableOpacity
                key={label}
                activeOpacity={0.85}
                onPress={() => setMood(i)}
                style={[styles.moodPill, mood === i && styles.moodPillActive]}>
                <View
                  style={[styles.radio, mood === i && styles.radioActive]}
                />
                <Text style={styles.moodText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setStep('next')}
            style={styles.ctaBtn}>
            <Text style={styles.ctaText}>
              {t('post_practice_continue', 'Продолжить')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.nextContent,
            {paddingBottom: bottom + 40},
          ]}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>
            {t('post_practice_next_title', 'Что поможет вам дальше')}
          </Text>

          {cards.slice(0, 2).map(card => (
            <TouchableOpacity
              key={`${card.source}-${card.id}`}
              activeOpacity={0.85}
              style={styles.card}
              onPress={() =>
                onOpenTrack({
                  id: card.id,
                  title: card.title,
                  description: card.description,
                  audioUrl: card.audioUrl,
                  coverUrl: card.coverUrl,
                  durationSeconds: card.durationSeconds,
                  kind: card.source,
                })
              }>
              <RemoteImage source={{uri: card.coverUrl}} style={styles.cardBg}>
                <View style={styles.cardContent}>
                  <View style={styles.cardLeft}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {card.title}
                      </Text>
                      <Text style={styles.cardSubtitle} numberOfLines={2}>
                        {card.description}
                      </Text>
                    </View>
                    {card.durationSeconds > 0 && (
                      <View style={styles.cardDuration}>
                        <SvgXml xml={ICON_CLOCK} width={18} height={18} />
                        <Text style={styles.durationText}>
                          {formatDuration(card.durationSeconds)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.playBtn}>
                    <SvgXml xml={ICON_PLAY_TRIANGLE} width={16} height={16} />
                  </View>
                </View>
              </RemoteImage>
            </TouchableOpacity>
          ))}

          {affirmation && (
            <View style={styles.affCard}>
              <LinearGradient
                colors={['rgba(0,0,0,0.25)', 'rgba(102,102,102,0.25)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <Text style={styles.affText}>{affirmation.text}</Text>
              <View style={styles.affActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() =>
                    toggleFavorite({
                      kind: 'affirmation',
                      id: affirmation.id,
                      title: affirmation.text,
                    })
                  }>
                  <SvgXml
                    xml={
                      isFavorite('affirmation', affirmation.id)
                        ? ICON_HEART_FILLED
                        : ICON_STORY_HEART
                    }
                    width={24}
                    height={24}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  onPress={() =>
                    setShareItem({text: affirmation.text, id: affirmation.id})
                  }>
                  <SvgXml xml={ICON_STORY_SHARE} width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      <ShareAffirmationModal
        item={shareItem}
        onClose={() => setShareItem(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 24,
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },

  // ── Шаг 1: самочувствие ───────────────────────────────────────────────────
  moodWrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 32,
  },
  moodOptions: {
    gap: 12,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 52,
    borderRadius: 50,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  moodPillActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  radioActive: {
    backgroundColor: colors.white,
  },
  moodText: {
    ...typography.body,
    color: colors.white,
  },
  ctaBtn: {
    backgroundColor: colors.white,
    borderRadius: 50,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    ...typography.button,
    color: colors.dark,
  },

  // ── Шаг 2: рекомендации ───────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  nextContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardBg: {
    minHeight: 120,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 14,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cardLeft: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTop: {
    gap: 8,
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
  cardDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  durationText: {
    ...typography.small,
    color: colors.white,
  },
  playBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  affCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.brand.primary,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 20,
  },
  affText: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
  },
  affActions: {
    flexDirection: 'row',
    gap: 16,
  },
});
