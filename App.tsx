import React, {useRef, useState} from 'react';
import {Animated, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import {PlaybackService} from './src/services/playbackService';
import {PlayerProvider} from './src/context/PlayerContext';
import {PlayerScreen} from './src/screens/PlayerScreen';
import {GradientBackground} from './src/components/GradientBackground';
import {BottomNavBar} from './src/components/BottomNavBar';
import {HomeHeader} from './src/components/HomeHeader';
import {FixedHeader, headerScrollPadding} from './src/components/FixedHeader';
import {AboutAppBlock} from './src/components/AboutAppBlock';
import {AffirmationCard} from './src/components/AffirmationCard';
import {AngelHelper} from './src/components/AngelHelper';
import {PracticeCards} from './src/components/PracticeCards';
import {MeditationBlock} from './src/components/MeditationBlock';
import {WebinarBlock} from './src/components/WebinarBlock';
import {SchoolCard} from './src/components/SchoolCard';
import {ClubSection} from './src/components/ClubSection';
import {ThinkingScreen} from './src/screens/ThinkingScreen';
import {PracticesScreen} from './src/screens/PracticesScreen';
import {AffirmationsScreen} from './src/screens/AffirmationsScreen';
import {SchoolScreen} from './src/screens/SchoolScreen';
import {ClubScreen} from './src/screens/ClubScreen';
import {ClubMapScreen} from './src/screens/ClubMapScreen';
import {StoriesScreen} from './src/screens/StoriesScreen';

TrackPlayer.registerPlaybackService(() => PlaybackService);

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <PlayerProvider>
        <AppContent />
        <PlayerScreen />
      </PlayerProvider>
    </SafeAreaProvider>
  );
}

const VISIBLE = 1;
const HIDDEN = 0.001;

function AppContent() {
  const {top, bottom} = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  const opacity0 = useRef(new Animated.Value(VISIBLE)).current;
  const opacity1 = useRef(new Animated.Value(HIDDEN)).current;
  const opacity2 = useRef(new Animated.Value(HIDDEN)).current;
  const opacities = [opacity0, opacity1, opacity2];

  // Reset-to-root: re-tapping the already-active tab scrolls it to the top and
  // pops any sub-screen back to that tab's root.
  const homeScrollRef = useRef<ScrollView>(null);
  const [thinkingReset, setThinkingReset] = useState(0);
  const [practicesReset, setPracticesReset] = useState(0);
  const [showAffirmations, setShowAffirmations] = useState(false);
  const [showSchool, setShowSchool] = useState(false);
  const [showClubMap, setShowClubMap] = useState(false);
  const [showStories, setShowStories] = useState(true);

  function handleTabPress(index: number) {
    if (index === activeTab) {
      if (index === 0) {
        homeScrollRef.current?.scrollTo({y: 0, animated: true});
      } else if (index === 1) {
        setThinkingReset(n => n + 1);
      } else if (index === 2) {
        setPracticesReset(n => n + 1);
      }
      return;
    }
    opacities.forEach((op, i) => op.setValue(i === index ? VISIBLE : HIDDEN));
    setActiveTab(index);
  }

  return (
    <GradientBackground>
      <Animated.View
        style={[styles.screenSlot, {opacity: opacity0}]}
        pointerEvents={activeTab !== 0 ? 'none' : 'auto'}>
        <ScrollView
          ref={homeScrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {paddingTop: headerScrollPadding(top)},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.aboutSection}>
            <AboutAppBlock onPressCircle={() => setShowStories(true)} />
          </View>
          <View style={styles.practiceSection}>
            <PracticeCards />
          </View>
          <View style={styles.angelSection}>
            <AngelHelper />
          </View>
          <View style={styles.cardSection}>
            <AffirmationCard onPress={() => setShowAffirmations(true)} />
          </View>
          <View style={styles.meditationSection}>
            <MeditationBlock />
          </View>
          <View style={styles.webinarSection}>
            <WebinarBlock />
          </View>
          <View style={styles.schoolSection}>
            <SchoolCard onPress={() => setShowSchool(true)} />
          </View>
          <View style={styles.clubSection}>
            <ClubSection onPress={() => handleTabPress(3)} />
          </View>
          <View style={[styles.bottomSpacer, {height: bottom + 110}]} />
        </ScrollView>
        <FixedHeader>
          <HomeHeader name="Михаил" />
        </FixedHeader>
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity1}]}
        pointerEvents={activeTab !== 1 ? 'none' : 'auto'}>
        <ThinkingScreen resetSignal={thinkingReset} />
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity2}]}
        pointerEvents={activeTab !== 2 ? 'none' : 'auto'}>
        <PracticesScreen resetSignal={practicesReset} />
      </Animated.View>

      {/* Club tab (index 3) — intro screen. Unmounted while the map overlay is
          open so its header can't flash over the map during the WebView load. */}
      {activeTab === 3 && !showClubMap && (
        <View style={styles.screenSlot}>
          <ClubScreen
            onOpenMap={() => setShowClubMap(true)}
            onClose={() => handleTabPress(0)}
          />
        </View>
      )}

      {showAffirmations && (
        <View style={styles.screenSlot}>
          <AffirmationsScreen onBack={() => setShowAffirmations(false)} />
        </View>
      )}

      {showSchool && (
        <View style={styles.screenSlot}>
          <SchoolScreen onBack={() => setShowSchool(false)} />
        </View>
      )}

      <BottomNavBar activeIndex={activeTab} onTabPress={handleTabPress} />

      {/* Full-screen clubs map opens from the Club tab, above the nav bar. */}
      {showClubMap && (
        <View style={styles.screenSlot}>
          <ClubMapScreen onClose={() => setShowClubMap(false)} />
        </View>
      )}

      {/* Stories overlay sits above everything, including the nav bar. */}
      {showStories && (
        <View style={styles.screenSlot}>
          <StoriesScreen onClose={() => setShowStories(false)} />
        </View>
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {flex: 1},
  content: {flexGrow: 1},
  aboutSection: {marginTop: 24},
  // "Рекомендует Михаил" now sits in the second slot (tight gap under the hero);
  // the affirmation card follows below with the standard 40 gap.
  practiceSection: {marginTop: 24},
  cardSection: {marginTop: 40},
  angelSection: {marginTop: 40},
  meditationSection: {marginTop: 40},
  webinarSection: {marginTop: 40},
  schoolSection: {marginTop: 40},
  clubSection: {marginTop: 40},
  bottomSpacer: {},
  screenSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default App;
