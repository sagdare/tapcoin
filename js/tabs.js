import { haptic } from './telegram.js';
import { store } from './store.js';

const TABS = ['mining', 'boost', 'tasks', 'friends'];
const loaded = new Set();
let current = null;

export function initTabs(onLoad) {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab, onLoad));
  });
  switchTab('mining', onLoad);
}

export async function switchTab(name, onLoad) {
  if (name === current) return;
  haptic('light');

  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach(v =>
    v.classList.toggle('active', v.dataset.view === name));

  if (!loaded.has(name)) {
    await onLoad?.(name);
    loaded.add(name);
  }
  current = name;
  store.emit('tab:change', name);
}