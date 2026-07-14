import React from 'react';
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
import {ICON_CLOCK} from '../assets/icons';
import {RemoteImage} from './RemoteImage';
import {formatDuration, Meditation, useMeditations} from '../services/meditations';
import {usePlayer} from '../context/PlayerContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const CARD_SIZE = 163;
const CARD_RADIUS = 20;
const CARD_PAD = 14;

function MeditationCard({item}: {item: Meditation}) {
  const {openPlayer} = usePlayer();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardGlow}
      onPress={() => openPlayer({
        id: item.id,
        title: item.title,
        description: item.description,
        audioUrl: item.audioUrl,
        coverUrl: item.coverUrl,
        durationSeconds: item.durationSeconds,
        kind: 'meditation',
      })}>
      <View style={styles.cardShadow}>
        <View style={styles.cardClip}>
          <RemoteImage
            source={{uri: item.coverUrl}}
            style={styles.cardBg}
            resizeMode="cover"
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={styles.timeRow}>
              <SvgXml xml={ICON_CLOCK} width={18} height={18} />
              <Text style={styles.timeText}>{formatDuration(item.durationSeconds)}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function MeditationBlock() {
  const {meditations, loading} = useMeditations();
  const t = useUIStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home_meditations_title', 'Медитации')}</Text>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}>
          {meditations.map(item => (
            <MeditationCard key={item.id} item={item} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  title: {
    ...typography.h2,
    color: colors.white,
    paddingHorizontal: 24,
  },
  loader: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  cardGlow: {
    width: CARD_SIZE,
    height: CARD_SIZE,
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
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardClip: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    width: CARD_SIZE,
    height: CARD_SIZE,
  },
  cardContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: CARD_PAD,
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...typography.body,
    color: colors.white,
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
