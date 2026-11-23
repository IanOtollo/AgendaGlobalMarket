// Reads a map location from what an admin pastes: a Google Maps address-bar link or plain "latitude, longitude".
// Returns null when no usable coordinates are found. Short links (maps.app.goo.gl) carry no coordinates and cannot be read.
const NUM = "(-?\d{1,3}\.\d+)";
const PATTERNS = [new RegExp(`@${NUM},${NUM}`), new RegExp(`!3d${NUM}!4d${NUM}`), new RegExp(`[?&](?:q|ll|query|destination)=${NUM}(?:,|%2C)\s*${NUM}`), new RegExp(`^\s*${NUM}\s*[, ]\s*${NUM}\s*$`)];

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
