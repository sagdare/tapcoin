import {S, setUser} from "../state.js";
import {call} from "../api.js";
import {$, fmt, notify} from "../utils.js";
import {icon} from "../components/icons.js";
import {toast} from "../components/toast.js";

let el;
const card = (id, ic, title) => `<div class="card"><div class="row"><div class="ico">${icon(ic, 24)}</div>
  <div class="sp"><b>${title}</b><div class="mut" id="${id}-d"></div></div><b id="${id}-l" style="color:var(--ac)"></b></div>
  <button class="btn" id="${id}-b" style="margin-top:14px"></button></div>`;
function render() {
  const u = S.user; if (!u || !el) return;
  const lv = (u.max_energy - 500) / 250 + 1;
  $("#bt-l", el).textContent = "سطح " + u.tap_power;
  $("#bt-d", el).textContent = `هر ضربه ${u.tap_power} ← ${u.tap_power + 1} سکه`;
  $("#bt-b", el).textContent = fmt(u.tap_cost) + " سکه"; $("#bt-b", el).disabled = u.balance < u.tap_cost;
  $("#be-l", el).textContent = "سطح " + lv;
  $("#be-d", el).textContent = `ظرفیت ${fmt(u.max_energy)} ← ${fmt(u.max_energy + 250)}`;
  $("#be-b", el).textContent = fmt(u.energy_cost) + " سکه"; $("#be-b", el).disabled = u.balance < u.energy_cost;
}
async function buy(kind) {
  const r = await call("upgrade", {kind});
  if (r.user) { setUser(r.user); notify("success"); toast("ارتقا انجام شد"); }
  else toast(r.error === "not_enough" ? "سکه‌ی کافی نداری" : "خطا، دوباره تلاش کن");
}
export default {
  id: "boost", label: "ارتقا", icon: "rocket",
  mount(root) {
    el = root;
    el.innerHTML = `<h2>ارتقاها</h2>${card("bt", "trend", "قدرت ضربه")}${card("be", "zap", "ظرفیت انرژی")}
    <div class="card row"><div class="ico">${icon("rocket", 24)}</div><div class="sp"><b>سرعت شارژ</b><div class="mut">هر ثانیه ۱ واحد انرژی برمی‌گرده</div></div></div>`;
    $("#bt-b", el).onclick = () => buy("tap"); $("#be-b", el).onclick = () => buy("energy");
    document.addEventListener("user", render);
  },
  onShow: render
};
