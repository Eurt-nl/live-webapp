// src/utils/gps-utils.ts
// Utility functies voor GPS berekeningen

export interface GPSPoint {
  latitude: number;
  longitude: number;
}

/**
 * Berekent de bearing (azimut) tussen twee GPS punten
 * @param from Startpunt (bijv. tee)
 * @param to Eindpunt (bijv. green)
 * @returns Bearing in graden (0=N, 90=E, 180=S, 270=W)
 */
export function calculateBearing(from: GPSPoint, to: GPSPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const deltaLon = toRad(to.longitude - from.longitude);

  const y = Math.sin(deltaLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

  let bearing = toDeg(Math.atan2(y, x));

  // Normaliseer naar 0-360 graden
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Berekent de afstand tussen twee GPS punten in meters
 * @param from Startpunt
 * @param to Eindpunt
 * @returns Afstand in meters
 */
export function calculateDistance(from: GPSPoint, to: GPSPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const R = 6371000; // Aardradius in meters
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const deltaLat = toRad(to.latitude - from.latitude);
  const deltaLon = toRad(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Controleert of een GPS punt geldig is (heeft latitude en longitude)
 * @param point GPS punt om te controleren
 * @returns true als het punt geldig is
 */
export function isValidGPSPoint(point: GPSPoint | null | undefined): boolean {
  return (
    point !== null &&
    point !== undefined &&
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number' &&
    !isNaN(point.latitude) &&
    !isNaN(point.longitude)
  );
}
