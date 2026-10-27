import {S, setUser} from "../state.js";
import {call} from "../api.js";
import {tg, $, fmt, esc, haptic, leagueOf} from "../utils.js";
import {icon} from "../components/icons.js";
import {toast} from "../components/toast.js";

let el, busy = false;
function render() {
  const u = S.user; if (!u || !el) return;
  const lg = leagueOf(u.balance);
  $("#h-bal", el).textContent = fmt(u.balance);
  $("#h-lg", el).textContent = lg.name;
  $("#h-lgb", el).style.width = lg.pct + "%";
  $("#h-nx", el).textContent = lg.next ? "تا لیگ بعد: " + fmt(lg.next - u.balance) : "بالاترین لیگ";
  $("#h-per", el).textContent = "+" + u.tap_power + " هر ضربه";
  $("#h-en", el).textContent = fmt(u.energy) + " / " + fmt(u.max_energy);
  $("#h-fill", el).style.width = Math.min(100, u.energy / u.max_energy * 100) + "%";
}
async function flush() {
  if (busy || !S.pending) return;
  busy = true; const n = S.pending; S.pending = 0;
  const r = await call("tap", {count: n});
  if (r.user) {
    setUser(r.user);
    S.user.balance += S.pending * S.user.tap_power; S.user.energy -= S.pending * S.user.tap_power; render();
  } else { S.pending += n; if (r.error === "unauthorized") toast("بازی را از داخل تلگرام باز کن"); }
  busy = false;
}
export default {
  id: "home", label: "بازی", icon: "coin",
  mount(root) {
    el = root;
    const p = tg.initDataUnsafe?.user || {}, name = p.first_name || p.username || "بازیکن";
    el.innerHTML = `
    <div class="row"><div class="av">${esc(name.charAt(0))}</div><div class="sp"><b>${esc(name)}</b><div class="mut" id="h-per"></div></div>
      <div class="chip">${icon("trophy", 14)}<span id="h-lg">برنز</span></div></div>
    <div class="bal">${icon("coin", 36)}<b id="h-bal">0</b></div>
    <div class="bar" style="height:6px"><i id="h-lgb" style="width:0"></i></div><div class="mut c" id="h-nx" style="margin-top:6px"></div>
    <div id="stage"><div id="coin"><div class="in"><svg width="96" height="96" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg></div></div></div>
    <div class="card"><div class="row" style="margin-bottom:8px"><span style="color:var(--ac)">${icon("zap", 18)}</span><b class="sp">انرژی</b><b id="h-en"></b></div>
      <div class="bar" style="height:12px"><i id="h-fill"></i></div></div>`;
    const coin = $("#coin", el);
    coin.addEventListener("pointerdown", e => {
      const u = S.user; if (!u) return;
      const r = coin.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      coin.style.transform = `rotateX(${-dy * 14}deg) rotateY(${dx * 14}deg) scale(.96)`;
      if (u.energy < u.tap_power) { toast("انرژی تموم شده"); return; }
      u.energy -= u.tap_power; u.balance += u.tap_power; S.pending++; haptic();
      const f = document.createElement("div"); f.className = "fl"; f.textContent = "+" + u.tap_power;
      f.style.left = e.clientX - 12 + "px"; f.style.top = e.clientY - 30 + "px";
      document.body.appendChild(f); setTimeout(() => f.remove(), 800); render();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach(v => coin.addEventListener(v, () => coin.style.transform = ""));
    document.addEventListener("user", render);
    setInterval(() => { // شارژ ظاهری انرژی
      const u = S.user; if (!u) return; const n = Date.now();
      u.energy = Math.min(u.max_energy, u.energy + (n - S.last) / 1000); S.last = n; render();
    }, 500);
    setInterval(flush, 1000);
  },
  onShow() { render(); }
};
