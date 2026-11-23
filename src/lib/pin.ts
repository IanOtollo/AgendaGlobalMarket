// Reads a map location from what an admin pastes: a Google Maps address-bar link or plain "latitude, longitude".
// Returns null when no usable coordinates are found. Short links (maps.app.goo.gl) carry no coordinates and cannot be read.
const PATTERNS = [
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  /[?&](?:q|ll|query|destination)=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/,
  /^\s*(-?\d{1,3}\.\d+)\s*[, ]\s*(-?\d{1,3}\.\d+)\s*$/,
];

export type Pin = { lat: number; lng: number };
// Greater Nairobi, with room for the surrounding towns. Anything outside is almost certainly a typo.
const inRegion = (p: Pin) => p.lat > -1.6 && p.lat < -0.9 && p.lng > 36.4 && p.lng < 37.3;

export function parsePin(text: string): Pin | null {
  for (const re of PATTERNS) {
    const m = re.exec(text);
    if (m) { const p = { lat: Number(m[1]), lng: Number(m[2]) }; if (inRegion(p)) return p; }
  }
  return null;
}
