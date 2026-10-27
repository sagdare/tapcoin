import {icon} from "./icons.js";
export function navbar(tabs, onSelect) {
  const nav = document.createElement("nav"); nav.className = "glass";
  nav.innerHTML = tabs.map(t => `<button data-id="${t.id}">${icon(t.icon, 22)}<span>${t.label}</span></button>`).join("");
  nav.onclick = e => { const b = e.target.closest("button"); if (b) onSelect(b.dataset.id); };
  document.body.appendChild(nav);
  return id => nav.querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.id === id));
}
