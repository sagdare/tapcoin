import { store } from '../store.js';
import { syncData, updateLocal } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';
import {
  BASE_HASHRATE,
  LEVEL_RATE_MULTIPLIER,
  dailyCapForLevel,
  upgradeCostForLevel,
  MAX_LEVEL,
} from '../config.js';

let ticker = null;

// فرمت‌دهی سرعت (TH/s)
const formatRate = (rate) => {
  const v = Number(rate) || 0;
  if (v >= 1) return v.toFixed(2);
  if (v >= 0.001) return v.toFixed(4);
  return v.toFixed(6);
};

// فرمت‌دهی کوین‌ها (دقیقاً 6 رقم اعشار، حتی برای اعداد خیلی ریز)
function formatCoins(n) {
  const v = Number(n) || 0;
  // با toFixed(6) همیشه ۶ رقم اعشار نمایش داده میشه
  return v.toFixed(6);
}

// محاسبه سرعت بر اساس لول
function hashRateForLevel(level) {
  return BASE_HASHRATE * Math.pow(LEVEL_RATE_MULTIPLIER, Math.max(0, level - 1));
}

// محاسبه کل ماین شده در 24 ساعت اخیر
function currentDailyMined(s) {
  const elapsed = Math.max(0, (Date.now() - new Date(s.last_collect).getTime()) / 1000);
  return (Number(s.daily_mined) || 0) + elapsed * (Number(s.mining_rate) || 0);
}

// ظرفیت باقی‌مانده تا سقف روزانه
function remainingCap(s) {
  const cap = dailyCapForLevel(s.level);
  return Math.max(0, cap - currentDailyMined(s));
}

// ساخت تایمر 24 ساعته (فارسی + اعداد فارسی)
function getRemainingTime(s) {
  const last = new Date(s.last_collect).getTime();
  const target = last + 24 * 60 * 60 * 1000;
  const diff = Math.max(0, target - Date.now());
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const sec = Math.floor((diff / 1000) % 60);
  
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  
  return fa(`${hh}:${mm}:${ss}`);
}

export function renderMining() {
  const root = $('#mining-root');
  const s = store.data?.state;

  if (!s) {
    root.innerHTML = '<div class="glass-card">' + '<div class="skeleton"></div>'.repeat(4) + '</div>';
    return;
  }

  const rate = hashRateForLevel(s.level);
  const cap = dailyCapForLevel(s.level);
  const nextCost = upgradeCostForLevel(s.level);
  const canUpgrade = s.balance >= nextCost && s.level < MAX_LEVEL;

  root.innerHTML = `
    <!-- هدر بالا -->
    <div class="top-header">
      <div class="user-info">
        <div class="avatar-circle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="balance-pill">
          <img src="img/coin.png" class="mini-coin" alt="coin" onerror="this.style.display='none'"/>
          <span id="top-balance">${fa(formatCoins(s.balance))} <span style="font-size:10px;color:var(--hint)">MCH</span></span>
          <button class="plus-btn">+</button>
        </div>
      </div>
      <div class="level-pill">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>سطح ${fa(s.level)}</span>
      </div>
    </div>

    <!-- کارت اصلی ماینینگ -->
    <div class="main-mining-card">
      <div class="mining-header">
        <div>
          <div class="m-title">ماینر سطح ${fa(s.level)}</div>
          <div class="m-subtitle">ماین ابری</div>
        </div>
        <div class="timer-pill" id="timer">${getRemainingTime(s)}</div>
      </div>

      <!-- فن چرخان -->
      <div class="coin-container">
        <div class="coin-ring"></div>
        <div class="fan-spin" id="fan-spin">
          <img src="img/gpu-fan.png" alt="Fan" onerror="this.style.display='none'"/>
        </div>
      </div>

      <!-- بخش ریوارد -->
      <div class="reward-section">
        <div class="reward-label">پاداش برداشت‌نشده</div>
        <div class="reward-value" id="live-pending">${fa(formatCoins(0))}<span class="currency">MCH</span></div>
        <div class="reward-sub">
          <span>≈ $۰.۰۰۰۰</span> · <span id="live-rate">${fa(formatRate(rate))} TH/s</span>
        </div>
      </div>

      <button class="btn-claim" id="collect-btn">دریافت پاداش · ۰.۰۰ MCH</button>
    </div>

    <!-- لیست ماینر -->
    <div class="list-section">
      <div class="list-title">ماینر</div>
      
      <div class="list-item">
        <div class="item-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.1 7.5"/></svg>
        </div>
        <div class="item-text">
          <div class="item-name">سرعت ماین</div>
        </div>
        <div class="item-val" id="stat-rate">${fa(formatRate(rate))} TH/s</div>
      </div>

      <div class="list-item">
        <div class="item-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
        </div>
        <div class="item-text">
          <div class="item-name">خروجی ۲۴ ساعته</div>
        </div>
        <div class="item-val green-text">+${fa(cap)} MCH</div>
      </div>

      <div class="list-item" id="upgrade-btn" style="cursor:pointer">
        <div class="item-icon orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div class="item-text">
          <div class="item-name">سطح ${fa(s.level)}</div>
          <div class="item-sub">${canUpgrade ? 'برای ارتقا به سطح ' + fa(s.level+1) + ' کلیک کنید' : 'نیاز به ' + fa(nextCost) + ' MCH برای ارتقا'}</div>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--hint)" stroke-width="2" style="transform: rotate(180deg);"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>
    
    <div class="bottom-hint">تا ۲۴ ساعت آینده برداشت کنید تا ماینینگ متوقف نشود.</div>
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

  // اپدیت کوین
  const el = $('#live-pending');
  if (el) el.innerHTML = `${fa(formatCoins(live))}<span class="currency">MCH</span>`;

  // اپدیت دکمه
  const btn = $('#collect-btn');
  if (btn && !btn.classList.contains('loading')) {
    btn.disabled = live < 0.000001 || rem <= 0;
    btn.textContent = `دریافت پاداش · ${fa(formatCoins(live))} MCH`;
  }
  
  // اپدیت تایمر
  const timer = $('#timer');
  if (timer) timer.textContent = getRemainingTime(s);
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
      haptic('error');
      toast('چیزی برای برداشت نیست', 'error');
      btn.classList.remove('loading');
      return;
    }
    updateLocal(d => {
      d.state.balance += earned;
      d.state.daily_mined += earned;
      d.state.total_mined += earned;
      d.state.last_collect = new Date().toISOString();
    });
    haptic('success');
    toast(`+${fa(formatCoins(earned))} برداشت شد`, 'success');
    renderMining();
    btn.classList.remove('loading');
    return;
  }

  // حالت آنلاین
  try {
    const r = await api('collect');
    if (r.success) {
      haptic('success');
      toast(`+${fa(formatCoins(r.earned))} برداشت شد`, 'success');
      await syncData();
      renderMining();
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

async function upgrade() {
  const btn = $('#upgrade-btn');
  if (!btn || btn.classList.contains('loading')) return;
  
  const s = store.data?.state;
  const isLocal = store.data?.local;
  const cost = upgradeCostForLevel(s.level);

  if (s.level >= MAX_LEVEL) {
    haptic('error');
    toast('حداکثر سطح', 'error');
    return;
  }
  if (s.balance < cost) {
    haptic('error');
    toast('موجودی کافی نیست', 'error');
    return;
  }

  haptic('medium');

  // حالت لوکال
  if (isLocal) {
    updateLocal(d => {
      d.state.balance -= cost;
      d.state.level += 1;
      d.state.mining_rate = hashRateForLevel(d.state.level);
    });
    haptic('success');
    toast(`سطح ${fa(s.level + 1)} ✅`, 'success');
    renderMining();
    return;
  }

  // حالت آنلاین
  btn.style.opacity = '0.5';
  try {
    const r = await api('upgrade_miner', { minerType: 'basic' });
    if (r.success) {
      haptic('success');
      toast('ارتقا موفق', 'success');
      await syncData();
      renderMining();
    } else {
      haptic('error');
      toast(r.error || 'خطا', 'error');
    }
  } catch {
    haptic('error');
    toast('خطا در ارتباط', 'error');
  } finally {
    btn.style.opacity = '1';
  }
}