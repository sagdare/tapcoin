import {S, setUser} from "../state.js";
import {call} from "../api.js";
import {$, fmt, notify} from "../utils.js";
import {icon} from "../components/icons.js";
import {toast} from "../components/toast.js";

let el;
function render() {
  const d = S.user?.daily; if (!d || !el) return;
  const cur = Math.min(d.next, 7);
  $("#d-streak", el).textContent = d.streak;
  $("#d-days", el).innerHTML = [1, 2, 3, 4, 5, 6, 7].map(i =>
    `<div class="day ${i < cur || (i === cur && !d.ready && d.streak >= i) ? "done" : ""} ${i === cur && d.ready ? "now" : ""}">${i}<b>${fmt(500 * i)}</b></div>`).join("");
  const b = $("#d-btn", el); b.disabled = !d.ready;
  b.innerHTML = d.ready ? `${icon("gift", 20)}دریافت ${fmt(d.reward)} سکه` : `${d.wait} ساعت دیگر برگرد`;
}
export default {
  id: "tasks", label: "جایزه", icon: "gift",
  mount(root) {
    el = root;
    el.innerHTML = `<h2>جایزه‌ی روزانه</h2><div class="card c"><div style="color:var(--ac);display:grid;place-items:center">${icon("flame", 46)}</div>
      <b style="font-size:30px" id="d-streak">0</b><div class="mut">روز پشت‌سرهم</div>
      <div class="days" id="d-days"></div><button class="btn" id="d-btn"></button></div>
      <p class="mut c">هر روز که بدون وقفه سر بزنی، جایزه بزرگ‌تر میشه. اگه یه روز رد کنی، از اول شروع میشه.</p>`;
    $("#d-btn", el).onclick = async () => {
      const r = await call("daily");
      if (r.user) { setUser(r.user); notify("success"); toast("جایزه دریافت شد"); } else toast("هنوز زوده");
    };
    document.addEventListener("user", render);
  },
  onShow: render
};
