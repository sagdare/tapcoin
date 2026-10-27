import {esc} from "../utils.js";
export const listItem = ({lead, name, sub = "", value = "", me = false}) =>
  `<div class="item${me ? " me" : ""}">${lead}<div class="nm"><b>${esc(name)}</b>${sub ? `<div class="mut">${esc(sub)}</div>` : ""}</div><b>${value}</b></div>`;
export const avatar = n => `<div class="av" style="width:34px;height:34px">${esc((n || "؟").charAt(0))}</div>`;
