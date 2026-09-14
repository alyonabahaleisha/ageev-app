module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Пресет не транспилирует .mjs (firebase их использует).
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  // ESM-пакеты, которые jest должен прогонять через babel (иначе
  // "Cannot use import statement outside a module").
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native-async-storage|@react-native-firebase|@dr.pogodin/react-native-fs|http-status-codes|firebase|@firebase|@react-native|react-native-track-player|@notifee|react-native-config|@d11/react-native-fast-image|react-native-svg|react-native-safe-area-context|react-native-view-shot|react-native-webview|react-native-linear-gradient|@react-native-community|@react-native-google-signin|@invertase)/|.*\\.mjs$)',
  ],
};
