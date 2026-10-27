import { createClient } from "npm:@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const TOKEN = Deno.env.get("BOT_TOKEN")!;
const REGEN = 1;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

const enc = new TextEncoder();
async function hmac(key: BufferSource, msg: string) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}
async function verify(initData: string) {
  const p = new URLSearchParams(initData);
  const hash = p.get("hash"); p.delete("hash");
  const s = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = await hmac(enc.encode("WebAppData"), TOKEN);
  const sig = [...(await hmac(secret, s))].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (sig !== hash) return null;
  if (Date.now() / 1000 - Number(p.get("auth_date")) > 86400) return null;
  return JSON.parse(p.get("user")!);
}

const tapCost = (p: number) => Math.round(500 * 1.8 ** (p - 1));
const energyCost = (m: number) => Math.round(300 * 1.7 ** ((m - 500) / 250));
// deno-lint-ignore no-explicit-any
type U = any;
function regen(u: U) {
  const now = Date.now();
  u.energy = Math.min(u.max_energy, Math.floor(u.energy + ((now - new Date(u.energy_ts).getTime()) / 1000) * REGEN));
  u.energy_ts = new Date(now).toISOString();
  return u;
}
async function save(u: U) {
  const r = await db.from("users").update({
    balance: u.balance, energy: u.energy, max_energy: u.max_energy, tap_power: u.tap_power,
    energy_ts: u.energy_ts, last_daily: u.last_daily ?? null, streak: u.streak ?? 0,
  }).eq("tg_id", u.tg_id);
  if (r.error) throw new Error("save: " + r.error.message);
}
function daily(u: U) {
  const h = u.last_daily ? (Date.now() - new Date(u.last_daily).getTime()) / 36e5 : Infinity;
  const next = h < 48 ? (u.streak || 0) + 1 : 1;
  return { ready: h >= 20, streak: h < 48 ? u.streak || 0 : 0, next, reward: 500 * Math.min(next, 7), wait: h >= 20 ? 0 : Math.ceil(20 - h) };
}
const pub = (u: U) => ({
  tg_id: u.tg_id, balance: Number(u.balance), energy: u.energy, max_energy: u.max_energy, tap_power: u.tap_power,
  tap_cost: tapCost(u.tap_power), energy_cost: energyCost(u.max_energy), daily: daily(u),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { initData, action, count, kind } = await req.json();
    const tu = await verify(initData || "");
    if (!tu) return json({ error: "unauthorized" }, 401);
    const id = tu.id as number;

    const sel = await db.from("users").select("*").eq("tg_id", id).maybeSingle();
    if (sel.error) throw new Error("select: " + sel.error.message);
    let u: U = sel.data;
    if (!u) {
      const sp = new URLSearchParams(initData).get("start_param") || "";
      let ref: number | null = null;
      if (sp.startsWith("ref_")) {
        const r = Number(sp.slice(4));
        if (r && r !== id) {
          const { data: ru } = await db.from("users").select("tg_id,balance").eq("tg_id", r).maybeSingle();
          if (ru) { ref = r; await db.from("users").update({ balance: Number(ru.balance) + 5000 }).eq("tg_id", r); }
        }
      }
      const ins = await db.from("users").insert({
        tg_id: id, username: tu.username, first_name: tu.first_name, referred_by: ref, balance: ref ? 2500 : 0,
      }).select().single();
      if (ins.error) throw new Error("insert: " + ins.error.message);
      u = ins.data;
    }
    u = regen(u);
    let extra = {};

    if (action === "tap") {
      const n = Math.max(0, Math.min(Math.floor(Number(count) || 0), 100));
      const k = Math.min(n, Math.floor(u.energy / u.tap_power));
      u.balance = Number(u.balance) + k * u.tap_power;
      u.energy -= k * u.tap_power;
      await save(u);
    } else if (action === "upgrade") {
      const cost = kind === "energy" ? energyCost(u.max_energy) : tapCost(u.tap_power);
      if (Number(u.balance) < cost) return json({ error: "not_enough" }, 400);
      u.balance = Number(u.balance) - cost;
      if (kind === "energy") u.max_energy += 250; else u.tap_power += 1;
      await save(u);
    } else if (action === "daily") {
      const d = daily(u);
      if (!d.ready) return json({ error: "not_ready" }, 400);
      u.streak = d.next; u.balance = Number(u.balance) + d.reward; u.last_daily = new Date().toISOString();
      await save(u);
    } else if (action === "friends") {
      const { data, count: c, error } = await db.from("users").select("first_name,username,balance,created_at", { count: "exact" })
        .eq("referred_by", id).order("created_at", { ascending: false }).limit(50);
      if (error) throw new Error("friends: " + error.message);
      return json({ friends: data, count: c });
    } else if (action === "top") {
      const { data } = await db.from("users").select("tg_id,first_name,username,balance").order("balance", { ascending: false }).limit(20);
      const { count: above } = await db.from("users").select("tg_id", { count: "exact", head: true }).gt("balance", u.balance);
      return json({ top: data, rank: (above ?? 0) + 1 });
    } else if (action === "sync" && u.referred_by) {
      const { data: r } = await db.from("users").select("first_name,username").eq("tg_id", u.referred_by).maybeSingle();
      extra = { referrer: r };
    }
    return json({ user: { ...pub(u), ...extra } });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
