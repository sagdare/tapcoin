import {S} from "../state.js";
import {call} from "../api.js";
import {tg, $, fmt, esc} from "../utils.js";
import {icon} from "../components/icons.js";
import {toast} from "../components/toast.js";
import {listItem, avatar} from "../components/listItem.js";
import {BOT_APP_LINK, REF_BONUS} from "../config.js";

let el;
const link = () => `${BOT_APP_LINK}?startapp=ref_${S.user.tg_id}`;
function inviter() {
  const r = S.user?.referrer, box = $("#f-by", el);
  box.innerHTML = r ? `<div class="card row"><div class="ico">${icon("userplus", 24)}</div><div class="sp"><div class="mut">دعوت‌شده توسط</div><b>${esc(r.first_name || r.username || "—")}</b></div></div>` : "";
}
async function load() {
  inviter();
  const r = await call("friends"), list = $("#f-list", el);
  if (!r.friends) { list.innerHTML = `<div class="mut c">خطا در دریافت لیست: ${esc(r.error || "")}</div>`; return; }
  $("#f-n", el).textContent = r.count || 0; $("#f-c", el).textContent = fmt((r.count || 0) * REF_BONUS);
  list.innerHTML = r.friends.length ? r.friends.map(f => listItem({
    lead: avatar(f.first_name || f.username), name: f.first_name || f.username || "—",
    sub: "عضویت: " + new Date(f.created_at).toLocaleDateString("fa-IR"), value: fmt(f.balance)
  })).join("") : '<div class="mut c">هنوز کسی رو دعوت نکردی</div>';
}
export default {
  id: "friends", label: "دوستان", icon: "users",
  mount(root) {
    el = root;
    el.innerHTML = `<h2>دوستان</h2><div id="f-by"></div>
    <div class="card c"><div style="color:var(--ac);display:grid;place-items:center">${icon("gift", 46)}</div><b>دوستات رو دعوت کن</b>
      <p class="mut">به ازای هر دوست، ${fmt(REF_BONUS)} سکه برای تو و ${fmt(REF_BONUS / 2)} سکه برای اونه.</p>
      <button class="btn" id="f-inv">${icon("send", 20)}ارسال دعوت</button>
      <button class="btn alt" id="f-cp" style="margin-top:8px">${icon("copy", 20)}کپی لینک</button></div>
    <div class="stats"><div class="stat"><b id="f-n">0</b><span class="mut">دوست</span></div><div class="stat"><b id="f-c">0</b><span class="mut">سکه‌ی پاداش</span></div></div>
    <div id="f-list"></div>`;
    $("#f-inv", el).onclick = () => tg.openTelegramLink("https://t.me/share/url?url=" + encodeURIComponent(link()) + "&text=" + encodeURIComponent("بیا با هم سکه جمع کنیم"));
    $("#f-cp", el).onclick = async () => { try { await navigator.clipboard.writeText(link()); toast("لینک کپی شد"); } catch { toast(link()); } };
  },
  onShow: load
};
