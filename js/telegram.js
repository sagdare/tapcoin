export const tg = window.Telegram.WebApp;

export function initTelegram() {
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#0a0a12');
  tg.setBackgroundColor?.('#0a0a12');
  ['viewportChanged','safeAreaChanged','contentSafeAreaChanged','fullscreenChanged']
    .forEach(evt => { try { tg.onEvent(evt, applyLayout); } catch {} });
  applyLayout();
  setTimeout(applyLayout, 150);
  setTimeout(applyLayout, 500);
}

export function applyLayout() {
  const root = document.documentElement;
  const sa  = tg.safeAreaInset        || {};
  const csa = tg.contentSafeAreaInset || {};
  root.style.setProperty('--safe-bottom', `${(sa.bottom || 0) + (csa.bottom || 0)}px`);
  root.style.setProperty('--safe-top',    `${(sa.top    || 0) + (csa.top    || 0)}px`);
  if (tg.viewportStableHeight > 0) {
    root.style.setProperty('--app-height', `${tg.viewportStableHeight}px`);
  }
}

export function haptic(type = 'light') {
  try {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
    else tg.HapticFeedback.impactOccurred(type);
  } catch {}
}

export function getInitData() { return tg.initData; }
export function getTelegramUser() { return tg.initDataUnsafe?.user || null; }