import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import {GradientBackground} from './GradientBackground';

const SCREEN_H = Dimensions.get('window').height;

// Figma 411:6086 (390×844): logo 120×120 dead-center, spinner centered at
// y≈748 → 96px above the bottom edge.
const LOGO_SIZE = 120;
const SPINNER_BOTTOM = Math.round(SCREEN_H * (96 / 844));

const HOLD_MS = 1400; // how long the splash stays fully visible
const FADE_MS = 400;

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, HOLD_MS);
    return () => clearTimeout(id);
  }, [opacity]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, {opacity}]}>
      <GradientBackground>
        <View style={styles.center}>
          <Image
            source={require('../assets/images/splash-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <ActivityIndicator
          color="#FFFFFF"
          size="small"
          style={[styles.spinner, {bottom: SPINNER_BOTTOM}]}
        />
      </GradientBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
    elevation: 1000,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  spinner: {
    position: 'absolute',
    alignSelf: 'center',
    transform: [{scale: 32 / 20}],
  },
});
