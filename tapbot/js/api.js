import {API} from "./config.js";
import {tg} from "./utils.js";
export async function call(action, data = {}) {
  try {
    const r = await fetch(API, {method: "POST", headers: {"Content-Type": "application/json"},
      body: JSON.stringify({initData: tg.initData, action, ...data})});
    return await r.json();
  } catch { return {error: "network"}; }
}
