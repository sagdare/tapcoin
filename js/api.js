import { FUNCTION_URL } from './config.js';
import { getInitData } from './telegram.js';

export async function api(action, extra = {}) {
  const initData = getInitData();
  
  console.log(`[API] Sending action: ${action}`);
  console.log(`[API] initData length: ${initData ? initData.length : 0}`);

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData, action, ...extra }),
    });
    
    const json = await res.json();
    console.log(`[API] Response for ${action}:`, json);
    return json;
  } catch (e) {
    console.error(`[API] Network Error for ${action}:`, e);
    return { success: false, error: 'network' };
  }
}