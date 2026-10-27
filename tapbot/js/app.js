import {tg, $, haptic} from "./utils.js";
import {call} from "./api.js";
import {setUser} from "./state.js";
import {toast} from "./components/toast.js";
import {navbar} from "./components/navbar.js";
import home from "./tabs/home.js";
import boost from "./tabs/boost.js";
import tasks from "./tabs/tasks.js";
import friends from "./tabs/friends.js";
import top from "./tabs/top.js";

tg.ready(); tg.expand();
try { tg.setHeaderColor("#0b0c11"); tg.setBackgroundColor("#0b0c11"); tg.disableVerticalSwipes?.(); } catch {}

// فاصله از بالا (حالت تمام‌صفحه: زیر دکمه‌ها و ساعت گوشی)
function safeArea() {
  const s = tg.safeAreaInset?.top || 0, c = tg.contentSafeAreaInset?.top || 0;
  let top = s + c;
  if (!top && tg.isFullscreen) top = 96;
  document.documentElement.style.setProperty("--top", top + 14 + "px");
}
safeArea();
["safeAreaChanged", "contentSafeAreaChanged", "fullscreenChanged"].forEach(e => tg.onEvent(e, safeArea));

const tabs = [home, boost, tasks, friends, top], root = $("#app"), els = {};
tabs.forEach(t => { const s = document.createElement("section"); s.className = "tab"; root.appendChild(s); els[t.id] = s; t.mount(s); });
const mark = navbar(tabs, show);
function show(id) {
  tabs.forEach(t => els[t.id].classList.toggle("on", t.id === id));
  mark(id); haptic("soft"); root.scrollTo(0, 0);
  tabs.find(t => t.id === id).onShow?.();
}
show("home");

(async () => {
  const r = await call("sync");
  if (r.user) setUser(r.user); else toast("خطا در ورود: " + (r.error || "نامشخص"));
})();
