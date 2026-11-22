import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import type {Club} from './clubs';

// «Клубы рядом со мной»: геопозиция телефона → ближайшие клубы по прямому
// расстоянию. У всех клубов в Firestore есть координаты (проверено
// 2026-10-04: 148/148), поэтому расчёт целиком локальный — сеть не нужна.

export type LatLng = {latitude: number; longitude: number};

export type NearbyClub = Club & {
  /** Расстояние по прямой, км. */
  distanceKm: number;
};

export type LocationErrorKind = 'denied' | 'unavailable' | 'timeout';

export class LocationError extends Error {
  kind: LocationErrorKind;
  constructor(kind: LocationErrorKind, message?: string) {
    super(message ?? kind);
    this.kind = kind;
  }
}

const EARTH_RADIUS_KM = 6371;

/** Расстояние между точками по формуле гаверсинусов, км. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Ближайшие `limit` клубов к точке, от ближнего к дальнему. */
export function nearestClubs(
  clubs: Club[],
  origin: LatLng,
  limit = 5,
): NearbyClub[] {
  return clubs
    .filter(
      c =>
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        Number.isFinite(c.latitude) &&
        Number.isFinite(c.longitude),
    )
    .map(c => ({...c, distanceKm: distanceKm(origin, c)}))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** «12 км» / «520 км» / «1 300 км» — без дробей, крупные через пробел. */
export function formatDistanceKm(km: number, unit = 'км'): string {
  const rounded = km < 10 ? Math.max(1, Math.round(km)) : Math.round(km);
  return `${rounded.toLocaleString('ru-RU')} ${unit}`;
}

let configured = false;
function configure() {
  if (configured) {
    return;
  }
  configured = true;
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    enableBackgroundLocationUpdates: false,
    locationProvider: 'auto',
  });
}

async function ensureAndroidPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);
  // Для поиска ближайшего города хватает и грубой позиции.
  return (
    granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED ||
    granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
}

/**
 * Текущая позиция телефона. Запрашивает разрешение «при использовании»;
 * отказ → LocationError('denied'), выключенная геолокация →
 * 'unavailable', нет фикса за 15 с → 'timeout'. Точность не нужна: ближайший
 * клуб обычно за десятки километров, поэтому берём быстрый грубый фикс и
 * позицию до 5 минут давности.
 */
export async function getCurrentLocation(): Promise<LatLng> {
  configure();
  if (!(await ensureAndroidPermission())) {
    throw new LocationError('denied');
  }
  return new Promise<LatLng>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      err => {
        const kind: LocationErrorKind =
          err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
        reject(new LocationError(kind, err.message));
      },
      {enableHighAccuracy: false, timeout: 15_000, maximumAge: 5 * 60_000},
    );
  });
}
