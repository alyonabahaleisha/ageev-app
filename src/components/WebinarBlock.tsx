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
import {ICON_CLOCK, ICON_PLAY_TRIANGLE} from '../assets/icons';
import {formatDuration} from '../services/meditations';
import {Webinar, useWebinars} from '../services/webinars';
import {RemoteImage} from './RemoteImage';
import {usePlayer} from '../context/PlayerContext';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const CARD_W = 280;
const CARD_H = 170;
const CARD_RADIUS = 20;
const CARD_PAD = 14;
const PLAY_BTN = 50;

function WebinarCard({card}: {card: Webinar}) {
  const {openPlayer} = usePlayer();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardShadow}
      onPress={() => openPlayer({
        id: card.id,
        title: card.title,
        description: card.description,
        audioUrl: card.audioUrl,
        coverUrl: card.coverUrl,
        durationSeconds: card.durationSeconds,
      })}>
      <View style={styles.cardClip}>
        <RemoteImage
          source={{uri: card.coverUrl}}
          style={[styles.cardBg, styles.cardImage]}>
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
              <View style={styles.cardDuration}>
                <SvgXml xml={ICON_CLOCK} width={18} height={18} />
                <Text style={styles.durationText}>
                  {formatDuration(card.durationSeconds)}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={styles.playBtn}>
              <SvgXml xml={ICON_PLAY_TRIANGLE} width={16} height={16} />
            </TouchableOpacity>
          </View>
        </RemoteImage>
      </View>
    </TouchableOpacity>
  );
}

export function WebinarBlock() {
  const {webinars, loading} = useWebinars();
  const t = useUIStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('home_webinars_title', 'Вебинары')}</Text>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.white} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}>
          {webinars.map(card => (
            <WebinarCard key={card.id} card={card} />
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
      android: {
        elevation: 4,
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
    width: CARD_W,
    height: CARD_H,
  },
  cardImage: {
    borderRadius: CARD_RADIUS,
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
  cardTop: {
    gap: 12,
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
