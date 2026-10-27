
import { API } from "./config.js";
import { tg } from "./utils.js";

export async function call(action, data = {}) {
  console.log("[API TEST] URL:", API);
  console.log("[API TEST] Action:", action);
  console.log("[API TEST] initData length:", tg.initData?.length ?? 0);

  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData: tg.initData,
        action,
        ...data
      })
    });

    const body = await r.text();

    console.log("[API TEST] HTTP status:", r.status);
    console.log("[API TEST] Response:", body);

    try {
      return JSON.parse(body);
    } catch {
      return { error: "invalid_json_response" };
    }
  } catch (e) {
    console.error("[API TEST] Fetch failed:", e);
    return { error: "network" };
  }
}
