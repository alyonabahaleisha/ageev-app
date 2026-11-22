/* eslint-env jest */
export {};
// Ближайшие клубы по геопозиции: расстояние, сортировка, формат.

function load() {
  let mod: any;
  jest.isolateModules(() => {
    jest.doMock('@react-native-community/geolocation', () => ({
      __esModule: true,
      default: {setRNConfiguration: jest.fn(), getCurrentPosition: jest.fn()},
    }));
    mod = require('../src/services/nearbyClubs');
  });
  return mod;
}

const club = (city: string, latitude: number, longitude: number) => ({
  id: city,
  city,
  country: 'Россия',
  leader: '',
  telegramUrl: '',
  region: 'russia',
  sortOrder: 0,
  latitude,
  longitude,
});

const ARKHANGELSK = {latitude: 64.54, longitude: 40.54};

describe('nearbyClubs', () => {
  it('computes great-circle distance', () => {
    const {distanceKm} = load();
    const spb = {latitude: 59.94, longitude: 30.31};
    const km = distanceKm(ARKHANGELSK, spb);
    expect(km).toBeGreaterThan(720);
    expect(km).toBeLessThan(760);
  });

  it('returns nearest clubs first with distance, skipping ones without coords', () => {
    const {nearestClubs} = load();
    const clubs = [
      club('Москва', 55.75, 37.62),
      club('Санкт-Петербург', 59.94, 30.31),
      club('Вологда', 59.22, 39.89),
      {...club('Без координат', 0, 0), latitude: undefined},
      club('Мельбурн', -37.81, 144.96),
    ];
    const res = nearestClubs(clubs, ARKHANGELSK, 3);
    expect(res.map((c: any) => c.city)).toEqual([
      'Вологда',
      'Санкт-Петербург',
      'Москва',
    ]);
    expect(res[0].distanceKm).toBeLessThan(res[1].distanceKm);
  });

  it('formats distances in whole km', () => {
    const {formatDistanceKm} = load();
    expect(formatDistanceKm(0.4)).toBe('1 км');
    expect(formatDistanceKm(12.6)).toBe('13 км');
    expect(formatDistanceKm(1312.2).replace(/ /g, ' ')).toBe('1 312 км');
  });
});
