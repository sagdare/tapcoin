// ذخیره‌سازی محلی وقتی تلگرام/سرور در دسترس نیست
const KEY = 'minechill_local_v1';

export function loadLocal() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch { return null; }
}

export function saveLocal(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

export function createInitialLocal() {
  const now = new Date().toISOString();
  return {
    success: true,
    local: true,
    state: {
      balance: 0,
      level: 1,
      last_collect: now,
      daily_mined: 0,
      daily_reset_at: now.split('T')[0],
      total_mined: 0,
      mining_rate: 0.0001,
    },
    miners: [],
    friend_count: 0,
  };
}