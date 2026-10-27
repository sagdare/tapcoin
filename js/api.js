import { FUNCTION_URL } from './config.js';
import { getInitData } from './telegram.js';

export async function api(action, extra = {}) {
  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: getInitData(), action, ...extra }),
  });
  try { return await res.json(); }
  catch { return { success: false, error: 'Invalid response' }; }
}