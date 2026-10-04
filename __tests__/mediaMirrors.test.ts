/* eslint-env jest */
export {};
// Выбор зеркала по доступности: пробник, штраф упавшему зеркалу, явный регион
// в резолвере. Модуль поднимается заново на каждый кейс (состояние в модуле).

const RU = 'https://storage.yandexcloud.net/ageev-app-test/';
const WORLD = 'https://pub-e856cc4814a440d5b979a3c8e44cf0c4.r2.dev/';
const FIREBASE_URL =
  'https://firebasestorage.googleapis.com/v0/b/mikhail-app.firebasestorage.app/o/audio%2Fx.m4a?alt=media&token=abc';
const PROBE_BODY = 'ok'.repeat(32768);

type Plan = Record<string, {ok: boolean; ms: number; body?: string}>;

function mockFetch(plan: Plan) {
  (globalThis as any).fetch = jest.fn((url: string) => {
    const base = url.startsWith(RU) ? RU : WORLD;
    const p = plan[base];
    return new Promise((resolve, reject) =>
      setTimeout(() => {
        if (!p.ok && p.body === undefined) {
          reject(new Error('network'));
          return;
        }
        resolve({
          ok: p.ok,
          text: () => Promise.resolve(p.body ?? PROBE_BODY),
        });
      }, p.ms),
    );
  });
}

function load(locale = 'en_US') {
  let mod: any;
  jest.isolateModules(() => {
    jest.doMock('react-native-config', () => ({
      __esModule: true,
      default: {MEDIA_REGION: ''},
    }));
    jest.doMock('react-native', () => ({
      Platform: {OS: 'ios'},
      NativeModules: {SettingsManager: {settings: {AppleLocale: locale}}},
      AppState: {addEventListener: jest.fn()},
    }));
    jest.doMock('@react-native-async-storage/async-storage', () => ({
      __esModule: true,
      default: {
        getItem: jest.fn().mockResolvedValue(null),
        setItem: jest.fn().mockResolvedValue(undefined),
      },
    }));
    jest.doMock('../src/services/analytics', () => ({track: jest.fn()}));
    mod = require('../src/services/mediaRegion');
  });
  return mod;
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('mirror selection', () => {
  it('starts from device locale when nothing is probed yet', () => {
    expect(load('ru_RU').getRegion()).toBe('ru');
    expect(load('en_US').getRegion()).toBe('world');
  });

  it('switches to the only reachable mirror', async () => {
    const m = load('en_US');
    mockFetch({[RU]: {ok: true, ms: 50}, [WORLD]: {ok: false, ms: 10}});
    const p = m.probeMirrors();
    await jest.advanceTimersByTimeAsync(100);
    expect(await p).toBe('ru');
    expect(m.getRegion()).toBe('ru');
    expect(m.resolveMediaUrl(FIREBASE_URL)).toBe(`${RU}audio/x.m4a`);
  });

  it('keeps the current mirror when both work and speeds are similar', async () => {
    const m = load('ru_RU');
    mockFetch({[RU]: {ok: true, ms: 100}, [WORLD]: {ok: true, ms: 80}});
    const p = m.probeMirrors();
    await jest.advanceTimersByTimeAsync(200);
    expect(await p).toBe('ru');
  });

  it('switches when the other mirror is much faster (throttling)', async () => {
    const m = load('en_US');
    mockFetch({[RU]: {ok: true, ms: 100}, [WORLD]: {ok: true, ms: 1500}});
    const p = m.probeMirrors();
    await jest.advanceTimersByTimeAsync(2000);
    expect(await p).toBe('ru');
  });

  it('rejects a 200 response with wrong body (block page)', async () => {
    const m = load('en_US');
    mockFetch({
      [RU]: {ok: true, ms: 50},
      [WORLD]: {ok: true, ms: 10, body: '<html>blocked</html>'},
    });
    const p = m.probeMirrors();
    await jest.advanceTimersByTimeAsync(100);
    expect(await p).toBe('ru');
  });

  it('keeps the current choice when neither mirror answers', async () => {
    const m = load('ru_RU');
    mockFetch({[RU]: {ok: false, ms: 10}, [WORLD]: {ok: false, ms: 10}});
    const p = m.probeMirrors();
    await jest.advanceTimersByTimeAsync(100);
    expect(await p).toBeNull();
    expect(m.getRegion()).toBe('ru');
  });

  it('reportMirrorFailure flips to the other mirror immediately', () => {
    const m = load('ru_RU');
    mockFetch({[RU]: {ok: false, ms: 10}, [WORLD]: {ok: false, ms: 10}});
    expect(m.reportMirrorFailure('ru')).toBe('world');
    expect(m.getRegion()).toBe('world');
    expect(m.resolveMediaUrl(FIREBASE_URL)).toBe(`${WORLD}audio/x.m4a`);
  });

  it('a successful probe clears the failure penalty', async () => {
    const m = load('ru_RU');
    mockFetch({[RU]: {ok: true, ms: 10}, [WORLD]: {ok: true, ms: 10}});
    m.reportMirrorFailure('ru');
    await jest.advanceTimersByTimeAsync(100);
    expect(m.getRegion()).toBe('ru');
  });
});

describe('resolveMediaUrl with explicit region', () => {
  it('rewrites Firebase and mirror URLs to the requested mirror', () => {
    const m = load('ru_RU');
    expect(m.resolveMediaUrl(FIREBASE_URL, 'world')).toBe(`${WORLD}audio/x.m4a`);
    expect(m.resolveMediaUrl(`${RU}audio/x.m4a`, 'world')).toBe(
      `${WORLD}audio/x.m4a`,
    );
    expect(m.resolveMediaUrl(`${WORLD}audio/x.m4a`, 'ru')).toBe(`${RU}audio/x.m4a`);
  });

  it('regionOfUrl recognises mirrors only', () => {
    const m = load();
    expect(m.regionOfUrl(`${RU}a.mp3`)).toBe('ru');
    expect(m.regionOfUrl(`${WORLD}a.mp3`)).toBe('world');
    expect(m.regionOfUrl(FIREBASE_URL)).toBeNull();
    expect(m.regionOfUrl('file:///x.mp3')).toBeNull();
  });
});
