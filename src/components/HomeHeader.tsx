import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SvgXml} from 'react-native-svg';
import {ICON_USER, ICON_SEARCH} from '../assets/icons';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';

const BUTTON_SIZE = 47;
const BUTTON_RADIUS = 23.5;
const ICON_SIZE = 24;

type Props = {
  name?: string;
};

export function HomeHeader({name = 'Михаил'}: Props) {
  return (
    <View style={styles.container}>
      {/* Left: avatar + greeting */}
      <View style={styles.greeting}>
        {/* White glow layer → dark shadow layer → solid avatar */}
        <View style={styles.cardGlow}>
          <View style={styles.cardShadow}>
            <View style={styles.avatar}>
              <SvgXml xml={ICON_USER} width={ICON_SIZE} height={ICON_SIZE} />
            </View>
          </View>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.welcomeText} numberOfLines={1}>
            Добро пожаловать,
          </Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>

      {/* Right: frosted circle — white glow wrapper keeps radius small so shape stays circular */}
      <View style={styles.searchGlow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.searchBtn}>
          <SvgXml xml={ICON_SEARCH} width={ICON_SIZE} height={ICON_SIZE} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // Figma shadow/card: white glow 0px 0px 80px -20px rgba(255,255,255,0.15)
  cardGlow: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    shadowColor: '#ffffff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 40,
  },
  // Figma shadow/card: dark drop 0px 24px 60px -10px rgba(0,0,0,0.28)
  cardShadow: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 24},
        shadowOpacity: 0.28,
        shadowRadius: 30,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: colors.brand.lighter,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    width: 148,
  },
  welcomeText: {
    ...typography.body,
    color: colors.white,
  },
  nameText: {
    ...typography.bodyLarge,
    color: colors.white,
  },
  // Outer wrapper: white glow with small radius so it hugs the circle edge
  searchGlow: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
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
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
});
