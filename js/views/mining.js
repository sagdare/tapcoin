import { store } from '../store.js';
import { syncData } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';

let ticker = null;

export function renderMining() {
  const root = $('#mining-root');
  const s = store.data?.state;

  if (!s) {
    root.innerHTML = '<div class="card">' + '<div class="skeleton"></div>'.repeat(4) + '</div>';
    return;
  }

  root.innerHTML = `
    <div class="card">
      <div class="balance-wrap">
        <div class="balance-label">موجودی کل</div>
        <div class="balance">${fa(s.balance)}</div>
        <div class="balance-sub">
          <span class="dot"></span>
          <span>${fa(s.mining_rate)} سکه / ثانیه</span>
        </div>
      </div>
      <div class="pending-box">
        <div>
          <div class="label">قابل برداشت</div>
          <div class="value" id="pending">—</div>
        </div>
        <button class="btn btn-sm btn-success" id="collect-btn" disabled>برداشت</button>
      </div>
    </div>

    <div class="card">
      <div class="card-title">📊 آمار امروز</div>
      <div class="row"><span class="label">ماین امروز</span>
        <span class="value">${fa(s.daily_mined)}</span></div>
      <div class="row"><span class="label">کل ماین</span>
        <span class="value">${fa(s.total_mined)}</span></div>
      <div class="row"><span class="label">سرعت ماین</span>
        <span class="value">${fa(s.mining_rate)} / ثانیه</span></div>
    </div>
  `;

  $('#collect-btn').onclick = collect;
  startTicker();
}

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(tick, 250);
  tick();
}

function tick() {
  const s = store.data?.state;
  if (!s) return;
  const elapsed = (Date.now() - store.pendingAt) / 1000;
  const live = store.pendingBase + elapsed * (s.mining_rate || 0);

  const el = $('#pending');
  if (el) el.textContent = fa(live);

  const btn = $('#collect-btn');
  if (btn && !btn.classList.contains('loading')) btn.disabled = live < 1;
}

async function collect() {
  const btn = $('#collect-btn');
  if (btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  haptic('medium');

  try {
    const r = await api('collect');
    if (r.success) {
      haptic('success');
      toast(`+${fa(r.earned)} سکه برداشت شد`, 'success');
      await syncData();
      renderMining();
    } else {
      haptic('error');
      toast(r.error || 'چیزی برای برداشت نیست', 'error');
    }
  } catch {
    haptic('error');
    toast('خطا در برداشت', 'error');
  } finally {
    btn.classList.remove('loading');
  }
}