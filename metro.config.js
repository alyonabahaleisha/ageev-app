const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Don't watch/bundle scratch dirs or the accidental nested project copy —
    // writes there (e.g. screenshots) were triggering constant fast-refresh loops.
    blockList: [
      /.*\/tmp\/.*/,
      /.*\/ageev-app-rn\/Users\/.*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
