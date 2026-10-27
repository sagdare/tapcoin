import {$} from "../utils.js";
let t;
export function toast(msg) {
  const el = $("#toast"); el.textContent = msg; el.classList.add("on");
  clearTimeout(t); t = setTimeout(() => el.classList.remove("on"), 2400);
}
