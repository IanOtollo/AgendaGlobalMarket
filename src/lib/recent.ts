const KEY = "agm-recent-pros";
export const getRecentPros = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; } };
export function addRecentPro(slug: string) {
  try { localStorage.setItem(KEY, JSON.stringify([slug, ...getRecentPros().filter((s) => s !== slug)].slice(0, 8))); } catch {}
}
