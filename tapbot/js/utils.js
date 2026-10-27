export const tg = window.Telegram.WebApp;
export const $ = (s, r = document) => r.querySelector(s);
export const fmt = n => Math.floor(n || 0).toLocaleString("en-US");
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const haptic = (t = "light") => { try { tg.HapticFeedback.impactOccurred(t); } catch {} };
export const notify = t => { try { tg.HapticFeedback.notificationOccurred(t); } catch {} };
const L = [[0, "برنز"], [5000, "نقره"], [50000, "طلا"], [500000, "الماس"]];
export function leagueOf(b) {
  let i = 0; L.forEach((l, k) => { if (b >= l[0]) i = k; });
  const cur = L[i][0], next = L[i + 1] ? L[i + 1][0] : null;
  return {name: L[i][1], next, pct: next ? (b - cur) / (next - cur) * 100 : 100};
}
