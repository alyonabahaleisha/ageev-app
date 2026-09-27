import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';
import {PlaybackService} from './src/services/playbackService';
import {track, trackScreen} from './src/services/analytics';
import {PlayerProvider, usePlayer} from './src/context/PlayerContext';
import {PlayerScreen} from './src/screens/PlayerScreen';
import {GradientBackground} from './src/components/GradientBackground';
import {SplashScreen} from './src/components/SplashScreen';
import {BottomNavBar} from './src/components/BottomNavBar';
import {HomeHeader} from './src/components/HomeHeader';
import {FixedHeader, useHeaderScrollPadding} from './src/components/FixedHeader';
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
import {fetchTrackForLink, parseDeepLink} from './src/services/deepLinks';
import {initRegionOverride} from './src/services/mediaRegion';
import notifee, {EventType} from '@notifee/react-native';
import {
  ensureDailyAffirmationNotifications,
  ensurePracticeReminders,
} from './src/services/dailyNotifications';
import {FavoriteItem} from './src/services/favorites';
import {uiString} from './src/services/uiStrings';
import {WebPageScreen} from './src/screens/WebPageScreen';
import {useDailyStory, useStorySeen} from './src/services/stories';
import {prefetchImages} from './src/components/RemoteImage';
import {
  BackHandlerActiveContext,
  useBackHandler,
} from './src/hooks/useBackHandler';

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
// Неактивные вкладки полностью прозрачны: при 0.001 Android продолжал
// рисовать все три вкладки со всеми картинками в каждом кадре — текстуры не
// помещались в GPU-кэш и перезаливались каждый кадр (gfxinfo: 100% медленных
// кадров, «Slow bitmap uploads» на каждом кадре). При 0 вкладка не рисуется.
const HIDDEN = 0;
const WELCOME_SEEN_KEY = 'welcome_seen_v1';
// Длительности кроссфейда вкладок/оверлеев — резкая смена экранов «моргала».
const FADE_IN_MS = 180;
const FADE_OUT_MS = 150;

/** Слот вкладки с плавным появлением/исчезновением: содержимое остаётся
 *  смонтированным на время фейд-аута, потом размонтируется (прежняя
 *  семантика «скрыт — значит размонтирован» сохраняется). */
function FadeSlot({shown, children}: {shown: boolean; children: React.ReactNode}) {
  const [mounted, setMounted] = useState(shown);
  const op = useRef(new Animated.Value(shown ? 1 : 0)).current;
  useEffect(() => {
    if (shown) {
      setMounted(true);
      Animated.timing(op, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(op, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) setMounted(false);
      });
    }
  }, [shown, op]);
  if (!mounted) return null;
  return (
    <Animated.View
      style={[styles.screenSlot, {opacity: op}]}
      pointerEvents={shown ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}

function AppContent() {
  const {bottom} = useSafeAreaInsets();
  const scrollPad = useHeaderScrollPadding();
  const [activeTab, setActiveTab] = useState(0);

  // Load today's stories at launch (not when the viewer opens) and warm the
  // image cache, so the first reel shows its real photo/quote immediately
  // instead of the bundled defaults flashing first.
  const {content: storyContent} = useDailyStory();
  const {seenToday: storySeenToday, markSeenToday: markStorySeen} =
    useStorySeen();
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
  // Карта клубов тяжёлая (WebView + MapLibre + тайлы). Прогреваем её скрыто,
  // как только пользователь зашёл на вкладку «Клуб», и не размонтируем после
  // закрытия — повторные открытия мгновенны.
  const [mapPreheated, setMapPreheated] = useState(false);
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
  const {reopenPlayer, openPlayer} = usePlayer();
  // Аффирмация, открытая по диплинку — пейджер поверх всего.
  const [linkAffirmation, setLinkAffirmation] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [showCourses, setShowCourses] = useState(false);
  // Welcome — только при первом запуске (null, пока флаг не прочитан).
  const [showWelcome, setShowWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_SEEN_KEY)
      .then(v => setShowWelcome(v !== '1'))
      .catch(() => setShowWelcome(false));
    // Восстанавливаем сохранённый оверрайд региона медиа (QA-тумблер) до того,
    // как экраны начнут резолвить обложки/аудио.
    initRegionOverride();
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

  // Диплинки (ageev:// и universal links): аффирмация открывает пейджер на
  // нужной карточке, аудио-контент подтягивается из Firestore и уходит в плеер.
  useEffect(() => {
    const handle = (url: string | null) => {
      const link = url ? parseDeepLink(url) : null;
      if (!link) return;
      track('deep_link_open', {link_type: link.type, link_id: link.id});
      if (link.type === 'affirmation') {
        // Диплинк ведёт на конкретный экран: закрываем открытые оверлеи —
        // их fixed-заголовки (zIndex 10) иначе всплывают над пейджером
        // (паттерн overlay-zindex: экран под оверлеем размонтируется).
        setShowSettings(false);
        setShowFavorites(false);
        setShowDonation(false);
        setShowCourses(false);
        setShowSearch(false);
        setShowStories(false);
        setShowClubMap(false);
        setShowSchool(false);
        setShowAffirmations(false);
        setShowAuth(false);
        setSelectedState(null);
        setFavAffirmation(null);
        setLinkAffirmation(link.id);
      } else {
        fetchTrackForLink(link)
          .then(track => {
            if (track) openPlayer(track);
          })
          .catch(() => {});
      }
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', e => handle(e.url));

    // Ежедневный пуш с аффирмацией: перепланировать на месяц вперёд и
    // обработать тап по уведомлению (data.url — тот же диплинк).
    // Отложено: перепланирование читает коллекции Firestore и ставит десятки
    // системных будильников — на старте это конкурировало с отрисовкой
    // главного экрана и заметно подтормаживало первые секунды.
    const notifTimer = setTimeout(() => {
      ensureDailyAffirmationNotifications();
      ensurePracticeReminders();
    }, 8000);
    notifee
      .getInitialNotification()
      .then(n => handle((n?.notification.data?.url as string) ?? null))
      .catch(() => {});
    const unsubNotifee = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        handle((detail.notification?.data?.url as string) ?? null);
      }
    });
    return () => {
      clearTimeout(notifTimer);
      sub.remove();
      unsubNotifee();
    };
  }, [openPlayer]);

  function dismissWelcome(openAuth: boolean) {
    setShowWelcome(false);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, '1').catch(() => {});
    if (openAuth) setShowAuth(true);
  }

  // Системное «назад» (Android): оверлеи и вложенные экраны подписываются
  // сами (useBackHandler) и получают нажатие раньше. Сюда оно доходит, только
  // когда открыта сама вкладка: не с главной — переход на главную, с главной —
  // стандартное поведение системы (приложение сворачивается).
  useBackHandler(() => {
    if (activeTab !== 0) {
      handleTabPress(0);
      return true;
    }
    return false;
  });

  function handleTabPress(index: number) {
    // Правки (Figma 489:11217): из «Аффирмаций» и «О школе» вкладки не
    // срабатывали — таб переключался под оверлеем, а оверлей оставался
    // открытым. Тап по вкладке закрывает эти оверлеи.
    setShowAffirmations(false);
    setShowSchool(false);
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
    // Плавный кроссфейд вместо мгновенного переключения — экран «моргал».
    opacities.forEach((op, i) =>
      Animated.timing(op, {
        toValue: i === index ? VISIBLE : HIDDEN,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }).start(),
    );
    setActiveTab(index);
    if (index === 3) setMapPreheated(true);
    const tabNames = ['home', 'thinking', 'practices', 'club', 'profile'];
    trackScreen(tabNames[index] ?? `tab_${index}`);
  }

  return (
    <SearchContext.Provider value={{openSearch: () => setShowSearch(true)}}>
    <GradientBackground>
      <Animated.View
        style={[styles.screenSlot, {opacity: opacity0}]}
        pointerEvents={activeTab !== 0 ? 'none' : 'auto'}>
        {activeTab === 0 && (
          <>
        <ScrollView
          ref={homeScrollRef}
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {paddingTop: scrollPad},
          ]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.aboutSection}>
            <AboutAppBlock
              ringVisible={!storySeenToday}
              onPressCircle={() => {
                markStorySeen();
                setShowStories(true);
              }}
            />
          </View>
          <View style={styles.practiceSection}>
            <PracticeCards />
          </View>
          <View style={styles.angelSection}>
            <AngelHelper onOpenState={setSelectedState} />
          </View>
          <View style={styles.cardSection}>
            <AffirmationCard
              onPress={() => {
                setShowAffirmations(true);
                trackScreen('affirmations');
              }}
            />
          </View>
          <View style={styles.meditationSection}>
            <MeditationBlock />
          </View>
          <View style={styles.webinarSection}>
            <WebinarBlock />
          </View>
          <View style={styles.schoolSection}>
            <SchoolCard
              onPress={() => {
                setShowSchool(true);
                trackScreen('school');
              }}
            />
          </View>
          <View style={styles.clubSection}>
            <ClubSection onPress={() => handleTabPress(3)} />
          </View>
          <View style={[styles.bottomSpacer, {height: bottom + 110}]} />
        </ScrollView>
        <FixedHeader>
          <HomeHeader />
        </FixedHeader>
          </>
        )}
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity1}]}
        pointerEvents={activeTab !== 1 ? 'none' : 'auto'}>
        {activeTab === 1 && (
          <BackHandlerActiveContext.Provider value={activeTab === 1}>
            <ThinkingScreen
              resetSignal={thinkingReset}
              onOpenState={setSelectedState}
            />
          </BackHandlerActiveContext.Provider>
        )}
      </Animated.View>

      <Animated.View
        style={[styles.screenSlot, {opacity: opacity2}]}
        pointerEvents={activeTab !== 2 ? 'none' : 'auto'}>
        {activeTab === 2 && (
          <BackHandlerActiveContext.Provider value={activeTab === 2}>
            <PracticesScreen
              resetSignal={practicesReset}
              formatSignal={practicesFormat}
            />
          </BackHandlerActiveContext.Provider>
        )}
      </Animated.View>

      {/* Club tab (index 3) — intro screen. Unmounted while the map overlay is
          open so its header can't flash over the map during the WebView load. */}
      <FadeSlot shown={activeTab === 3 && !showClubMap && !linkAffirmation}>
        <ClubScreen
          onOpenMap={() => setShowClubMap(true)}
          onClose={() => handleTabPress(0)}
        />
      </FadeSlot>

      {/* Profile tab (index 4) — guest and logged-in variants live inside.
          Unmounted while Избранное/Настройки/Auth are open: its fixed header
          has zIndex 10 and would float above the overlay otherwise. */}
      <FadeSlot
        shown={
          activeTab === 4 &&
          !showFavorites &&
          !showSettings &&
          !showDonation &&
          !showCourses &&
          !showAuth &&
          !linkAffirmation
        }>
        <ProfileScreen
          onOpenAuth={() => setShowAuth(true)}
          onOpenFavorites={() => setShowFavorites(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenDonation={() => setShowDonation(true)}
          onOpenCourses={() => setShowCourses(true)}
        />
      </FadeSlot>

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


      {/* Full-screen clubs map opens from the Club tab, above the nav bar.
          Смонтирована скрыто с момента захода на вкладку «Клуб» (прогрев). */}
      {(mapPreheated || showClubMap) && (
        <View
          style={[styles.screenSlot, !showClubMap && styles.mapHidden]}
          pointerEvents={showClubMap ? 'auto' : 'none'}>
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

      {/* Донейшн — сразу страница сайта внутри приложения, без
          предварительной формы. */}
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

      {/* Аффирмация по диплинку — пейджер поверх текущего экрана. */}
      {linkAffirmation && (
        <View style={styles.screenSlot}>
          <AffirmationsScreen
            key={linkAffirmation}
            initial={{id: linkAffirmation}}
            onBack={() => setLinkAffirmation(null)}
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
  // Прогретая, но не открытая карта клубов: невидима и не ловит тапы.
  mapHidden: {
    opacity: 0,
  },
});

export default App;
