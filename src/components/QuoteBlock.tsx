import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useUIStrings} from '../services/uiStrings';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

export function QuoteBlock() {
  const t = useUIStrings();
  return (
    <View style={styles.blueGlow}>
    <View style={styles.shadow}>
      <View style={styles.container}>
        {/* Photo with dark overlay */}
        <View style={styles.photoWrapper}>
          <Image
            source={require('../assets/images/quote-bg-57661a.png')}
            style={styles.photo}
            resizeMode="cover"
          />
          <View style={styles.photoOverlay} />
        </View>

        {/* Quote panel — rgba(255,255,255,0.14) fill + blur(20px) per Figma */}
        <View style={styles.quotePanel}>

          <View style={styles.quoteCharWrap}>
            <Text style={styles.quoteChar}>{'”'}</Text>
          </View>

          {/* Text block */}
          <View style={styles.textBlock}>
            <Text style={styles.quoteText}>
              {t(
                'home_quote_text',
                'Интерес – это голос высшего “Я”, ведущий к призванию',
              )}
            </Text>
            <Text style={styles.author}>
              {t('home_quote_author', 'Михаил Агеев')}
            </Text>
          </View>
        </View>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  blueGlow: {
    marginHorizontal: 24,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: 'rgb(95,167,214)',
        shadowOffset: {width: 0, height: 0},
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
    }),
  },
  shadow: {
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
      },
    }),
  },
  photoWrapper: {
    width: '100%',
    height: 200,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  // Figma: rgba(0,0,0,0.08) fill over the photo
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  quotePanel: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  quoteCharWrap: {
    width: 18,
    height: 15,
    overflow: 'visible',
  },
  quoteChar: {
    fontFamily: 'Manrope-Medium',
    fontSize: 36,
    color: colors.white,
    includeFontPadding: false,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  textBlock: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
    gap: 16,
  },
  quoteText: {
    fontFamily: 'Manrope-Medium',
    fontSize: 18,
    lineHeight: 21.6,
    fontWeight: '500',
    color: colors.white,
    textAlign: 'center',
  },
  author: {
    ...typography.label,
    color: colors.white,
    opacity: 0.65,
    textAlign: 'center',
  },
});
