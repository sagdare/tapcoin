import { FUNCTION_URL } from './config.js';
import { getInitData } from './telegram.js';

export async function api(action, extra = {}) {
  const initData = getInitData();
  
  console.log('API Call:', action);
  console.log('initData:', initData ? initData.substring(0, 50) + '...' : 'EMPTY!');
  
  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action, ...extra }),
    });
    const json = await res.json();
    console.log('API Response:', json);
    return json;
  } catch (e) {
    console.error('API Error:', e);
    return { success: false, error: 'network' };
  }
}