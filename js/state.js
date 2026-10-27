import { store } from './store.js';
import { api } from './api.js';

export async function syncData() {
  try {
    const data = await api('get');
    if (!data.success) {
      store.emit('data:error', data.error);
      return null;
    }
    store.set(data);
    return data;
  } catch (e) {
    store.emit('data:error', 'network');
    return null;
  }
}