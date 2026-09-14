/* eslint-env jest */
// Резолвер медиа-URL по региону. getRegion() мемоизирован, поэтому каждый
// кейс поднимает модуль заново через isolateModules с нужным моком Config.

const FIREBASE_URL =
  'https://firebasestorage.googleapis.com/v0/b/mikhail-app.firebasestorage.app/o/audio%2Fmeditations%2Fx%20y.mp3?alt=media&token=abc';
const MIRROR_URL = 'https://storage.yandexcloud.net/ageev-app-test/audio/meditations/x%20y.mp3';

function withRegion(region: string, fn: (resolve: (u?: string | null) => string | undefined) => void) {
  jest.isolateModules(() => {
    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: {MEDIA_REGION: region},
    }));
    const {resolveMediaUrl} = require('../src/services/mediaRegion');
    fn(resolveMediaUrl);
  });
}

describe('resolveMediaUrl', () => {
  it('rewrites Firebase URLs to the RU mirror when region=ru', () => {
    withRegion('ru', resolve => {
      expect(resolve(FIREBASE_URL)).toBe(MIRROR_URL);
    });
  });

  it('leaves Firebase URLs untouched when region=world', () => {
    withRegion('world', resolve => {
      expect(resolve(FIREBASE_URL)).toBe(FIREBASE_URL);
    });
  });

  it('does not touch non-Firebase or already-mirrored URLs in ru', () => {
    withRegion('ru', resolve => {
      expect(resolve(MIRROR_URL)).toBe(MIRROR_URL);
      expect(resolve('https://lh3.googleusercontent.com/avatar')).toBe(
        'https://lh3.googleusercontent.com/avatar',
      );
      expect(resolve('file:///local/cached.mp3')).toBe('file:///local/cached.mp3');
    });
  });

  it('returns undefined for empty input', () => {
    withRegion('ru', resolve => {
      expect(resolve(undefined)).toBeUndefined();
      expect(resolve(null)).toBeUndefined();
      expect(resolve('')).toBeUndefined();
    });
  });
});
