import { store } from './store.js';
import { api } from './api.js';
import { loadLocal, saveLocal, createInitialLocal } from './local.js';

export async function syncData() {
  try {
    const data = await api('get');
    if (data && data.success) {
      store.set(data);
      return data;
    }
  } catch (e) {
    // در دسترس نبودن سرور
  }

  // fallback لوکال
  let local = loadLocal();
  if (!local) {
    local = createInitialLocal();
    saveLocal(local);
  }
  store.set(local);
  store.emit('data:local', true);
  return local;
}

export function updateLocal(mutator) {
  const data = store.data;
  if (!data) return;
  const next = JSON.parse(JSON.stringify(data));
  mutator(next);
  saveLocal(next);
  store.set(next);
}