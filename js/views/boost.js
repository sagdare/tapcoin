import { store } from '../store.js';
import { syncData } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';
import { MINER_INFO } from '../config.js';

const MINER_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="6" width="16" height="12" rx="2"/>
  <path d="M8 10h2M14 10h2M8 14h8"/>
  <circle cx="18" cy="18" r="2.5"/>
</svg>`;

export function renderBoost() {
  const root = $('#boost-root');
  const s = store.data?.state;

  if (!s) {
    root.innerHTML = '<div class="glass-card"><div class="skeleton"></div><div class="skeleton"></div></div>';
    return;
  }

  const owned = new Map((store.data.miners || []).map(m => [m.miner_type, m]));
  const balance = s.balance;

  let rows = '';
  for (const [type, info] of Object.entries(MINER_INFO)) {
    const m = owned.get(type);
    const upgradeCost = m ? m.level * 200 : 0;
    const canBuy = !m && balance >= info.price;
    const canUpgrade = m && balance >= upgradeCost;

    rows += `
      <div class="miner-card">
        <div class="miner-icon ${type}">${MINER_SVG}</div>
        <div class="miner-info">
          <div class="miner-name">${info.name}</div>
          <div class="miner-rate">
            ${m ? `سطح ${m.level} • +${info.rate * m.level} TH/s` : `+${info.rate} TH/s`}
          </div>
        </div>
        <div class="miner-actions">
          ${m
            ? `<div class="miner-price">${fa(upgradeCost)}</div>
               <button class="btn btn-sm ${canUpgrade ? '' : 'btn-ghost'}"
                 ${canUpgrade ? '' : 'disabled'}
                 data-action="upgrade" data-type="${type}">ارتقا</button>`
            : `<div class="miner-price">${fa(info.price)}</div>
               <button class="btn btn-sm ${canBuy ? '' : 'btn-ghost'}"
                 ${canBuy ? '' : 'disabled'}
                 data-action="buy" data-type="${type}">خرید</button>`
          }
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="glass-card">
      <div class="card-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2 4.5 13.2a.8.8 0 0 0 .6 1.3H11l-1 7.5 8.5-10.7a.8.8 0 0 0-.6-1.3H13l1-7.5z"/>
        </svg>
        ارتقای ماینرها
      </div>
      <div style="font-size:12px;color:var(--hint);margin-bottom:12px">
        موجودی: <b style="color:var(--accent-2)">${fa(balance)}</b>
      </div>
      ${rows}
    </div>
  `;

  root.querySelectorAll('[data-action]').forEach(btn => {
    btn.onclick = () => handleAction(btn.dataset.action, btn.dataset.type, btn);
  });
}

async function handleAction(action, minerType, btn) {
  if (btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  haptic('medium');

  try {
    const r = await api(action === 'buy' ? 'buy_miner' : 'upgrade_miner', { minerType });
    if (r.success) {
      haptic('success');
      toast(action === 'buy' ? 'ماینر خریده شد' : 'ارتقا موفق', 'success');
      await syncData();
      renderBoost();
    } else {
      haptic('error');
      toast(r.error || 'خطا', 'error');
    }
  } catch {
    haptic('error');
    toast('خطا در ارتباط', 'error');
  } finally {
    btn.classList.remove('loading');
  }
}