import React, {useEffect, useRef, useState} from 'react';
import {Animated, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import {PlaybackService} from './src/services/playbackService';
import {PlayerProvider, usePlayer} from './src/context/PlayerContext';
import {PlayerScreen} from './src/screens/PlayerScreen';
import {GradientBackground} from './src/components/GradientBackground';
import {SplashScreen} from './src/components/SplashScreen';
import {BottomNavBar} from './src/components/BottomNavBar';
import {HomeHeader} from './src/components/HomeHeader';
import {FixedHeader, headerScrollPadding} from './src/components/FixedHeader';
import {MiniPlayer} from './src/components/MiniPlayer';
import {AboutAppBlock} from './src/components/AboutAppBlock';
import {AffirmationCard} from './src/components/AffirmationCard';
import {AngelHelper} from './src/components/AngelHelper';
import {PracticeCards} from './src/components/PracticeCards';
import {MeditationBlock} from './src/components/MeditationBlock';
import {WebinarBlock} from './src/components/WebinarBlock';
import {SchoolCard} from './src/components/SchoolCard';
import {ClubSection} from './src/components/ClubSection';
import {ThinkingScreen} from './src/screens/ThinkingScreen';
import {StateScreen} from './src/screens/StateScreen';
import {MindsetState} from './src/services/mindsetStates';
import {PracticesScreen} from './src/screens/PracticesScreen';
import {AffirmationsScreen} from './src/screens/AffirmationsScreen';
import {SchoolScreen} from './src/screens/SchoolScreen';
import {ClubScreen} from './src/screens/ClubScreen';
import {ClubMapScreen} from './src/screens/ClubMapScreen';
import {StoriesScreen} from './src/screens/StoriesScreen';
import {SearchScreen, SearchCategory} from './src/screens/SearchScreen';
import {SearchContext} from './src/context/SearchContext';
import {ProfileScreen} from './src/screens/ProfileScreen';
import {FavoritesScreen} from './src/screens/FavoritesScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {AuthScreen} from './src/screens/AuthScreen';
import {WelcomeScreen} from './src/screens/WelcomeScreen';
import {AuthProvider} from './src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {registerOpenFavoritesHandler} from './src/services/appNavigation';
import {FavoriteItem} from './src/services/favorites';
import {uiString} from './src/services/uiStrings';
import {WebPageScreen} from './src/screens/WebPageScreen';
import {useDailyStory} from './src/services/stories';
import {prefetchImages} from './src/components/RemoteImage';

TrackPlayer.registerPlaybackService(() => PlaybackService);

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <AuthProvider>
        <PlayerProvider>
          <AppContent />
          <PlayerScreen />
        </PlayerProvider>
      </AuthProvider>
      <SplashScreen />
    </SafeAreaProvider>
  );
}

const VISIBLE = 1;
const HIDDEN = 0.001;
const WELCOME_SEEN_KEY = 'welcome_seen_v1';

function AppContent() {
  const {top, bottom} = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  // Load today's stories at launch (not when the viewer opens) and warm the
  // image cache, so the first reel shows its real photo/quote immediately
  // instead of the bundled defaults flashing first.
  const {content: storyContent} = useDailyStory();
  useEffect(() => {
    if (!storyContent) return;
    prefetchImages([
      storyContent.quote.photoUrl,
      storyContent.breakfast.backgroundUrl,
      storyContent.affirmation.backgroundUrl,
    ]);
  }, [storyContent]);

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
  const [selectedState, setSelectedState] = useState<MindsetState | null>(null);
  const [showSchool, setShowSchool] = useState(false);
  const [showClubMap, setShowClubMap] = useState(false);
  const [showStories, setShowStories] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  // Quick-category jump from the search screen into a Практики sub-screen.
  const [practicesFormat, setPracticesFormat] = useState<{
    id: SearchCategory;
    n: number;
  } | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  // Аффирмация, открытая из «Избранного» — пейджер поверх списка.
  const [favAffirmation, setFavAffirmation] = useState<FavoriteItem | null>(
    null,
  );
  // True while Избранное is open via the player's «Сохранено» toast — its
  // back button then returns to the player instead of just closing.
  const favoritesFromPlayerRef = useRef(false);
  const {reopenPlayer} = usePlayer();
  const [showSettings, setShowSettings] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  // Welcome — только при первом запуске (null, пока флаг не прочитан).
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY)
      .then(v => setShowWelcome(v !== '1'))
      .catch(() => setShowWelcome(false));
  }, []);

  // The «Сохранено» toasts open Избранное through this bridge (the player
  // modal and overlay screens render outside AppContent's state). It opens as
  // a plain overlay — no tab switch; «назад» returns to the player only when
  // the request came from the player's toast.
  useEffect(() => {
    registerOpenFavoritesHandler(opts => {
      favoritesFromPlayerRef.current = !!opts.fromPlayer;
      setShowFavorites(true);
    });
    return () => registerOpenFavoritesHandler(null);
  }, []);

  function dismissWelcome(openAuth: boolean) {
    setShowWelcome(false);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, '1').catch(() => {});
    if (openAuth) setShowAuth(true);
  }

  function handleTabPress(index: number) {
    if (index === activeTab) {
      if (index === 0) {
        homeScrollRef.current?.scrollTo({y: 0, animated: true});
      } else if (index === 1) {
        setSelectedState(null);
        setThinkingReset(n => n + 1);
      } else if (index === 2) {
        setPracticesReset(n => n + 1);
      }
      return;
    }
    setSelectedState(null); // leaving a tab dismisses an open state detail
    opacities.forEach((op, i) => op.setValue(i === index ? VISIBLE : HIDDEN));
    setActiveTab(index);
  }

  return (
    <SearchContext.Provider value={{openSearch: () => setShowSearch(true)}}>
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
            <AngelHelper onOpenState={setSelectedState} />
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
          <HomeHeader />
        </FixedHeader>
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity1}]}
        pointerEvents={activeTab !== 1 ? 'none' : 'auto'}>
        <ThinkingScreen
          resetSignal={thinkingReset}
          onOpenState={setSelectedState}
        />
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity2}]}
        pointerEvents={activeTab !== 2 ? 'none' : 'auto'}>
        <PracticesScreen
          resetSignal={practicesReset}
          formatSignal={practicesFormat}
        />
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

      {/* Profile tab (index 4) — guest and logged-in variants live inside.
          Unmounted while Избранное/Настройки are open: its fixed header has
          zIndex 10 and would float above the overlay otherwise. */}
      {activeTab === 4 &&
        !showFavorites &&
        !showSettings &&
        !showDonation &&
        !showCourses && (
        <View style={styles.screenSlot}>
          <ProfileScreen
            onOpenAuth={() => setShowAuth(true)}
            onOpenFavorites={() => setShowFavorites(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenDonation={() => setShowDonation(true)}
            onOpenCourses={() => setShowCourses(true)}
          />
        </View>
      )}

      {/* State detail — a top-level overlay so tapping a state card (from the
          home picker or the Мышление tab) opens it directly, without a tab jump.
          Unmounted while Избранное is open (тост «Сохранено» ведёт туда) — its
          fixed header has zIndex 10 and would float above the overlay. */}
      {selectedState && !showFavorites && (
        <View style={styles.screenSlot}>
          <StateScreen
            state={selectedState}
            onBack={() => setSelectedState(null)}
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

      {/* Избранное — над нав-баром, открывается из Профиля (448:10703).
          Скрыто, пока открыта аффирмация: его FixedHeader (zIndex 10) иначе
          всплывает поверх пейджера. */}
      {showFavorites && !favAffirmation && (
        <View style={styles.screenSlot}>
          <FavoritesScreen
            onBack={() => {
              setShowFavorites(false);
              if (favoritesFromPlayerRef.current) {
                favoritesFromPlayerRef.current = false;
                reopenPlayer();
              }
            }}
            onGoPractices={() => {
              favoritesFromPlayerRef.current = false;
              setShowFavorites(false);
              handleTabPress(2);
            }}
            onOpenAffirmation={setFavAffirmation}
          />
        </View>
      )}

      {/* Настройки — над нав-баром, открывается из Профиля (448:10501). */}
      {showSettings && (
        <View style={styles.screenSlot}>
          <SettingsScreen onBack={() => setShowSettings(false)} />
        </View>
      )}

      {/* Донейшн — страница сайта внутри приложения, открывается из Профиля. */}
      {showDonation && (
        <View style={styles.screenSlot}>
          <WebPageScreen
            url={uiString('profile_donation_url', 'https://mikhail-ageev.ru/donate')}
            title={uiString('profile_tab_donation', 'Донейшн')}
            onBack={() => setShowDonation(false)}
          />
        </View>
      )}

      {/* Курсы и события — страница сайта внутри приложения (Профиль). */}
      {showCourses && (
        <View style={styles.screenSlot}>
          <WebPageScreen
            url={uiString('profile_courses_url', 'https://mikhail-ageev.ru/treningi')}
            title={uiString('profile_tab_events', 'Курсы и события')}
            onBack={() => setShowCourses(false)}
          />
        </View>
      )}

      {/* Мини-бар «Продолжить практику» (448:11841) — под шапкой на всех
          экранах; полноэкранные оверлеи ниже по коду перекрывают его. */}
      <MiniPlayer />

      {/* Аффирмация из «Избранного» — пейджер поверх Избранного, открытый на
          сохранённой аффирмации; «назад» возвращает в Избранное. */}
      {favAffirmation && (
        <View style={styles.screenSlot}>
          <AffirmationsScreen
            initial={{id: favAffirmation.id, text: favAffirmation.title}}
            onBack={() => setFavAffirmation(null)}
          />
        </View>
      )}

      {/* Auth sheet — above the nav bar; opens from Welcome and Profile. */}
      {showAuth && (
        <View style={styles.screenSlot}>
          <AuthScreen onClose={() => setShowAuth(false)} />
        </View>
      )}

      {/* First-launch welcome — covers the whole app until dismissed. */}
      {showWelcome && (
        <View style={styles.screenSlot}>
          <WelcomeScreen
            onStart={() => dismissWelcome(false)}
            onSignIn={() => dismissWelcome(true)}
          />
        </View>
      )}

      {/* Global search — above the nav bar (design 448:11117). */}
      {showSearch && (
        <View style={styles.screenSlot}>
          <SearchScreen
            onBack={() => setShowSearch(false)}
            onOpenCategory={id => {
              setShowSearch(false);
              setSelectedState(null);
              opacities.forEach((op, i) =>
                op.setValue(i === 2 ? VISIBLE : HIDDEN),
              );
              setActiveTab(2);
              setPracticesFormat(prev => ({id, n: (prev?.n ?? 0) + 1}));
            }}
          />
        </View>
      )}

      {/* Stories overlay sits above everything, including the nav bar. */}
      {showStories && (
        <View style={styles.screenSlot}>
          <StoriesScreen
            content={storyContent}
            onClose={() => setShowStories(false)}
            onOpenPractices={() => {
              setShowStories(false);
              handleTabPress(2);
            }}
          />
        </View>
      )}
    </GradientBackground>
    </SearchContext.Provider>
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
