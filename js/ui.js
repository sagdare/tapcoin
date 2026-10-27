export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const fa = (n) => Number(n || 0).toLocaleString('fa-IR', { maximumFractionDigits: 1 });

export function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  const c = document.getElementById('toast-container');
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

export function skeleton(lines = 3) {
  return Array.from({ length: lines }, () => '<div class="skeleton"></div>').join('');
}