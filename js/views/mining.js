import { store } from '../store.js';
import { syncData, updateLocal } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';
import { BASE_HASHRATE, LEVEL_RATE_MULTIPLIER, dailyCapForLevel, upgradeCostForLevel, MAX_LEVEL } from '../config.js';

let ticker = null;

// TH/s با رقم علمی
const formatRate = (rate) => {
  const v = Number(rate) || 0;
  if (v >= 1) return v.toFixed(3);
  if (v >= 0.001) return v.toFixed(6);
  return v.toFixed(8);
};

function hashRateForLevel(level) {
  return BASE_HASHRATE * Math.pow(LEVEL_RATE_MULTIPLIER, Math.max(0, level - 1));
}

function formatCoins(n) {
  // سکه با 6 رقم اعشار چون سرعت خیلی کمه
  const v = Number(n) || 0;
  return v.toFixed(6).replace(/\.?0+$/, '') || '0';
}

function currentDailyMined(s) {
  // مقدار روزانه = daily_mined + آنچه از آخرین برداشت اضافه شده
  const elapsed = Math.max(0, (Date.now() - new Date(s.last_collect).getTime()) / 1000);
  return (Number(s.daily_mined) || 0) + elapsed * (Number(s.mining_rate) || 0);
}

function remainingCap(s) {
  const cap = dailyCapForLevel(s.level);
  return Math.max(0, cap - currentDailyMined(s));
}

function canCollect(s) {
  const rem = remainingCap(s);
  const elapsed = (Date.now() - store.pendingAt) / 1000;
  const live = store.pendingBase + elapsed * (s.mining_rate || 0);
  return Math.min(live, rem);
}

export function renderMining() {
  const root = $('#mining-root');
  const s = store.data?.state;

  if (!s) {
    root.innerHTML = '<div class="glass-card">' + '<div class="skeleton"></div>'.repeat(4) + '</div>';
    return;
  }

  const isLocal = store.data?.local;
  const rate = hashRateForLevel(s.level);
  const cap = dailyCapForLevel(s.level);
  const used = Math.min(currentDailyMined(s), cap);
  const remaining = Math.max(0, cap - used);
  const progress = Math.min(100, (used / cap) * 100);
  const nextCost = upgradeCostForLevel(s.level);
  const canUpgrade = s.balance >= nextCost && s.level < MAX_LEVEL;

  root.innerHTML = `
    <div class="glass-card gpu-card">
      <div class="gpu-header">
        <span class="gpu-title">GPU MINER</span>
        ${isLocal ? '<span class="badge badge-warning">حالت لوکال</span>' : '<span class="badge badge-success">آنلاین</span>'}
      </div>
      <div class="gpu-fan-wrap">
        <svg class="gpu-fan" viewBox="0 0 120 120" fill="none">
          <defs>
            <radialGradient id="gpuGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#00e0ff" stop-opacity="0.9"/>
              <stop offset="100%" stop-color="#7c5cff" stop-opacity="0.1"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="55" stroke="rgba(0,224,255,0.25)" stroke-width="2" fill="none"/>
          <g class="fan-blades">
            <path d="M60 15 Q78 45 60 60 Q42 45 60 15Z" fill="url(#gpuGrad)"/>
            <path d="M105 60 Q75 78 60 60 Q75 42 105 60Z" fill="url(#gpuGrad)"/>
            <path d="M60 105 Q42 75 60 60 Q78 75 60 105Z" fill="url(#gpuGrad)"/>
            <path d="M15 60 Q45 42 60 60 Q45 78 15 60Z" fill="url(#gpuGrad)"/>
          </g>
          <circle cx="60" cy="60" r="10" fill="#0a0a12" stroke="rgba(0,224,255,0.6)" stroke-width="1.5"/>
          <circle cx="60" cy="60" r="4" fill="#00e0ff"/>
        </svg>
      </div>
      <div class="hashrate">
        <span class="hashrate-value">${formatRate(rate)}</span>
        <span class="hashrate-unit">TH/s</span>
      </div>
      <div class="hashrate-label">سطح ${fa(s.level)} • سرعت ماین</div>
    </div>

    <div class="glass-card">
      <div class="balance-row">
        <div>
          <div class="mini-label">موجودی</div>
          <div class="mini-value accent">${fa(s.balance)}</div>
        </div>
        <div style="text-align:left">
          <div class="mini-label">کل ماین</div>
          <div class="mini-value">${formatCoins(s.total_mined || 0)}</div>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <div class="cap-header">
        <span class="mini-label">سقف روزانه (۲۴ ساعت)</span>
        <span class="mini-value">${formatCoins(used)} / ${formatCoins(cap)}</span>
      </div>
      <div class="cap-bar">
        <div class="cap-fill" style="width:${progress}%"></div>
      </div>
      <div class="cap-hint">باقی‌مانده امروز: <b>${formatCoins(remaining)}</b></div>
    </div>

    <div class="glass-card">
      <button class="btn btn-collect" id="collect-btn" disabled>
        برداشت سکه
      </button>
      <div class="pending-line">
        <span class="mini-label">قابل برداشت الان</span>
        <span class="mini-value accent" id="pending">—</span>
      </div>
    </div>

    <div class="glass-card">
      <div class="upgrade-row">
        <div>
          <div class="mini-label">ارتقا به سطح ${fa(s.level + 1)}</div>
          <div class="mini-value">هزینه: ${fa(nextCost)}</div>
          <div class="mini-hint">سرعت جدید: ${formatRate(hashRateForLevel(s.level + 1))} TH/s</div>
        </div>
        <button class="btn btn-sm ${canUpgrade ? '' : 'btn-ghost'}" id="upgrade-btn"
          ${canUpgrade ? '' : 'disabled'}>
          ${s.level >= MAX_LEVEL ? 'حداکثر' : 'ارتقا'}
        </button>
      </div>
    </div>
  `;

  $('#collect-btn').onclick = collect;
  $('#upgrade-btn').onclick = upgrade;

  startTicker();
}

function startTicker() {
  if (ticker) clearInterval(ticker);
  ticker = setInterval(tick, 300);
  tick();
}

function tick() {
  const s = store.data?.state;
  if (!s) return;
  const elapsed = (Date.now() - store.pendingAt) / 1000;
  const liveRaw = store.pendingBase + elapsed * (s.mining_rate || 0);
  const rem = remainingCap(s);
  const live = Math.min(liveRaw, rem);

  const el = $('#pending');
  if (el) el.textContent = formatCoins(live) + ' TH';

  const btn = $('#collect-btn');
  if (btn && !btn.classList.contains('loading')) btn.disabled = live < 0.000001 || rem <= 0;
}

async function collect() {
  const btn = $('#collect-btn');
  if (btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  haptic('medium');

  const s = store.data?.state;
  const isLocal = store.data?.local;

  // حالت لوکال
  if (isLocal) {
    const elapsed = (Date.now() - new Date(s.last_collect).getTime()) / 1000;
    const earned = Math.min(elapsed * s.mining_rate, remainingCap(s));
    if (earned <= 0) {
      haptic('error'); toast('چیزی برای برداشت نیست', 'error'); btn.classList.remove('loading'); return;
    }
    updateLocal(d => {
      d.state.balance += earned;
      d.state.daily_mined += earned;
      d.state.total_mined += earned;
      d.state.last_collect = new Date().toISOString();
    });
    haptic('success');
    toast(`+${formatCoins(earned)} برداشت شد`, 'success');
    renderMining();
    btn.classList.remove('loading');
    return;
  }

  // حالت آنلاین
  try {
    const r = await api('collect');
    if (r.success) {
      haptic('success');
      toast(`+${formatCoins(r.earned)} برداشت شد`, 'success');
      await syncData();
      renderMining();
    } else {
      haptic('error'); toast(r.error || 'خطا', 'error');
    }
  } catch {
    haptic('error'); toast('خطا در ارتباط', 'error');
  } finally {
    btn.classList.remove('loading');
  }
}

async function upgrade() {
  const btn = $('#upgrade-btn');
  if (btn.classList.contains('loading') || btn.disabled) return;
  btn.classList.add('loading');
  haptic('medium');

  const s = store.data?.state;
  const isLocal = store.data?.local;
  const cost = upgradeCostForLevel(s.level);

  if (s.level >= MAX_LEVEL) { haptic('error'); toast('حداکثر سطح', 'error'); btn.classList.remove('loading'); return; }
  if (s.balance < cost) { haptic('error'); toast('موجودی کافی نیست', 'error'); btn.classList.remove('loading'); return; }

  if (isLocal) {
    updateLocal(d => {
      d.state.balance -= cost;
      d.state.level += 1;
      d.state.mining_rate = hashRateForLevel(d.state.level);
    });
    haptic('success');
    toast(`سطح ${fa(s.level + 1)} ✅`, 'success');
    renderMining();
    btn.classList.remove('loading');
    return;
  }

  try {
    const r = await api('upgrade_miner', { minerType: 'basic' });
    if (r.success) {
      haptic('success'); toast('ارتقا موفق', 'success');
      await syncData(); renderMining();
    } else {
      haptic('error'); toast(r.error || 'خطا', 'error');
    }
  } catch {
    haptic('error'); toast('خطا در ارتباط', 'error');
  } finally {
    btn.classList.remove('loading');
  }
}