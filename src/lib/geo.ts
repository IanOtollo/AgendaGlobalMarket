export type Coords = { lat: number; lng: number };

// Haversine distance in km
export function distanceKm(a: Coords, b: Coords) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export const fmtKm = (km: number) => (km < 1 ? "Under 1 km away" : `${km.toFixed(km < 10 ? 1 : 0)} km away`);
