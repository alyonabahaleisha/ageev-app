/* eslint-env jest */
// Нативные модули, у которых в jest-окружении нет нативной части.
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(),
    registerPlaybackService: jest.fn(),
    updateOptions: jest.fn(),
    add: jest.fn(),
    reset: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    getProgress: jest.fn().mockResolvedValue({position: 0, duration: 0}),
  },
  Capability: {},
  Event: {},
  State: {},
  RepeatMode: {},
  AppKilledPlaybackBehavior: {},
  useProgress: () => ({position: 0, duration: 0, buffered: 0}),
  usePlaybackState: () => ({state: undefined}),
  useTrackPlayerEvents: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    requestPermission: jest.fn(),
    createChannel: jest.fn(),
    createTriggerNotification: jest.fn(),
    getTriggerNotificationIds: jest.fn().mockResolvedValue([]),
    cancelTriggerNotifications: jest.fn(),
    onForegroundEvent: jest.fn(() => () => {}),
    getInitialNotification: jest.fn().mockResolvedValue(null),
  },
  AndroidImportance: {},
  EventType: {},
  TriggerType: {},
  RepeatFrequency: {},
}));

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {APP_ENV: 'prod'},
}));

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  getApps: () => [],
}));

jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  getAnalytics: jest.fn(),
  logEvent: jest.fn(),
  logScreenView: jest.fn(),
  setUserId: jest.fn(),
}));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  __esModule: true,
  exists: jest.fn().mockResolvedValue(false),
  mkdir: jest.fn(),
  downloadFile: jest.fn(),
  unlink: jest.fn(),
  readDir: jest.fn().mockResolvedValue([]),
  DocumentDirectoryPath: '/tmp',
  CachesDirectoryPath: '/tmp',
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {open: jest.fn()},
}));

jest.mock('react-native-view-shot', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({children}) => React.createElement('ViewShot', null, children),
    captureRef: jest.fn(),
  };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {setString: jest.fn(), getString: jest.fn().mockResolvedValue('')},
}));

jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: props => React.createElement('WebView', props),
    WebView: props => React.createElement('WebView', props),
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  __esModule: true,
  GoogleSignin: {configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn()},
  statusCodes: {},
}));

jest.mock('@invertase/react-native-apple-authentication', () => ({
  __esModule: true,
  appleAuth: {
    performRequest: jest.fn(),
    Operation: {LOGIN: 1},
    Scope: {EMAIL: 0, FULL_NAME: 1},
    isSupported: false,
  },
}));
