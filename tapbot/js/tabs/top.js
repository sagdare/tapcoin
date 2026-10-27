import {S} from "../state.js";
import {call} from "../api.js";
import {$, fmt} from "../utils.js";
import {icon} from "../components/icons.js";
import {listItem} from "../components/listItem.js";

let el;
async function load() {
  const r = await call("top");
  $("#t-me", el).innerHTML = r.rank ? `<div class="card row"><div class="ico">${icon("trophy", 24)}</div><div class="sp"><div class="mut">رتبه‌ی تو</div><b>${fmt(r.rank)}</b></div><b style="color:var(--ac)">${fmt(S.user?.balance)}</b></div>` : "";
  $("#t-list", el).innerHTML = (r.top || []).map((x, i) => listItem({
    lead: `<div class="rk ${i < 3 ? "r" + (i + 1) : ""}">${i + 1}</div>`, name: x.first_name || x.username || "—",
    value: fmt(x.balance), me: x.tg_id === S.user?.tg_id
  })).join("") || '<div class="mut c">خالی</div>';
}
export default {
  id: "top", label: "برترین‌ها", icon: "trophy",
  mount(root) { el = root; el.innerHTML = `<h2>برترین‌ها</h2><div id="t-me"></div><div id="t-list"></div>`; },
  onShow: load
};
