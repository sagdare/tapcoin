import { store } from '../store.js';
import { syncData, updateLocal } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic, getTelegramUser } from '../telegram.js';
import {
  BASE_HASHRATE,
  LEVEL_RATE_MULTIPLIER,
  dailyCapForLevel,
  upgradeCostForLevel,
  MAX_LEVEL,
} from '../config.js';

let ticker = null;

// تبدیل اعداد انگلیسی به فارسی
const toFaDigits = (str) => {
  return String(str).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
};

// فرمت‌دهی سرعت (TH/s)
const formatRate = (rate) => {
  const v = Number(rate) || 0;
  if (v >= 1) return toFaDigits(v.toFixed(2));
  if (v >= 0.001) return toFaDigits(v.toFixed(4));
  return toFaDigits(v.toFixed(4));
};

// ۸ رقم اعشار برای شمارنده وسط صفحه
function formatCoins8(n) {
  const v = Number(n) || 0;
  return toFaDigits(v.toFixed(6));
}

// ۱ رقم اعشار برای موجودی بالای صفحه و خروجی ۲۴ ساعته
function formatCoins1(n) {
  const v = Number(n) || 0;
  return toFaDigits(v.toFixed(1));
}

function hashRateForLevel(level) {
  return BASE_HASHRATE * Math.pow(LEVEL_RATE_MULTIPLIER, Math.max(0, level - 1));
}

function currentDailyMined(s) {
  const elapsed = Math.max(0, (Date.now() - new Date(s.last_collect).getTime()) / 1000);
  const currentRate = hashRateForLevel(s.level);
  return (Number(s.daily_mined) || 0) + elapsed * currentRate;
}

function remainingCap(s) {
  const cap = dailyCapForLevel(s.level);
  return Math.max(0, cap - currentDailyMined(s));
}

function getRemainingTime(s) {
  const last = new Date(s.last_collect).getTime();
  const target = last + 24 * 60 * 60 * 1000;
  const diff = Math.max(0, target - Date.now());
  
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const sec = Math.floor((diff / 1000) % 60);
  
  return toFaDigits(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`);
}

export function renderMining() {
  const root = $('#mining-root');
  const s = store.data?.state;

  if (!s) {
    root.innerHTML = '<div class="glass-card">' + '<div class="skeleton"></div>'.repeat(4) + '</div>';
    return;
  }

  const user = getTelegramUser();
  const photoUrl = user?.photo_url;
  
  const avatarHtml = photoUrl 
    ? `<img src="${photoUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`;

  const rate = hashRateForLevel(s.level);
  const nextCost = upgradeCostForLevel(s.level);
  const canUpgrade = s.balance >= nextCost && s.level < MAX_LEVEL;
  
  // خروجی ۲۴ ساعته = سرعت در ۲۴ ساعت (۸۶۴۰۰ ثانیه)
  const dailyOutput = rate * 86400;

  root.innerHTML = `
    <div class="top-header">
      <div class="user-info">
        <div class="avatar-circle">
          ${avatarHtml}
        </div>
        <div class="balance-pill">
          <img src="img/coin.png" class="mini-coin" alt="coin" onerror="this.style.display='none'"/>
          <span id="top-balance">${formatCoins1(s.balance)} <span style="font-size:10px;color:var(--hint)">MCH</span></span>
          <button class="plus-btn">+</button>
        </div>
      </div>
      <div class="level-pill">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        <span>سطح ${fa(s.level)}</span>
      </div>
    </div>

    <div class="main-mining-card">
      <div class="mining-header">
        <div>
          <div class="m-title">ماینر سطح ${fa(s.level)}</div>
          <div class="m-subtitle">ماین ابری</div>
        </div>
        <div class="timer-pill" id="timer">${getRemainingTime(s)}</div>
      </div>

      <div class="coin-container">
        <div class="coin-ring"></div>
        <div class="fan-wrapper">
          <div class="fan-spin" id="fan-spin">
            <img src="img/gpu-fan.png" alt="Fan" onerror="this.style.display='none'"/>
          </div>
        </div>
      </div>

      <div class="reward-section">
        <div class="reward-label">پاداش برداشت‌نشده</div>
        <div class="reward-value" id="live-pending" style="font-size: 26px; direction: ltr; display:flex; justify-content:center; align-items:baseline;">${formatCoins8(0)}<span class="currency" style="font-size:16px; margin-left:6px;">MCH</span></div>
        <div class="reward-sub">
          <span>≈ $۰.۰۰۰۰</span> · <span id="live-rate">${formatRate(rate)} TH/s</span>
        </div>
      </div>

      <button class="btn-claim" id="collect-btn">دریافت پاداش · ۰.۰۰ MCH</button>
    </div>

    <div class="list-section">
      <div class="list-title">ماینر</div>
      
      <div class="list-item">
        <div class="item-icon purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 12L2.1 7.5"/></svg>
        </div>
        <div class="item-text">
          <div class="item-name">سرعت ماین</div>
        </div>
        <div class="item-val" id="stat-rate">${formatRate(rate)} TH/s</div>
      </div>

      <div class="list-item">
        <div class="item-icon green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 7l-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
        </div>
        <div class="item-text">
          <div class="item-name">خروجی ۲۴ ساعته</div>
        </div>
        <div class="item-val green-text">+${formatCoins1(dailyOutput)} MCH</div>
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
  ticker = setInterval(tick, 200); 
  tick();
}

function tick() {
  const s = store.data?.state;
  if (!s) return;
  
  const elapsed = (Date.now() - store.pendingAt) / 1000;
  const liveRate = hashRateForLevel(s.level); 
  const liveRaw = store.pendingBase + elapsed * liveRate; 
  const rem = remainingCap(s);
  const live = Math.min(liveRaw, rem);

  // شمارنده وسط با ۸ رقم اعشار
  const el = $('#live-pending');
  if (el) el.innerHTML = `${formatCoins8(live)}<span class="currency" style="font-size:16px; margin-left:6px;">MCH</span>`;

  // دکمه با ۴ رقم اعشار
  const btn = $('#collect-btn');
  if (btn && !btn.classList.contains('loading')) {
    btn.disabled = live < 0.00000001 || rem <= 0;
    btn.textContent = `دریافت پاداش · ${toFaDigits(live.toFixed(4))} MCH`;
  }
  
  // تایمر
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

  if (isLocal) {
    const elapsed = (Date.now() - new Date(s.last_collect).getTime()) / 1000;
    const earned = Math.min(elapsed * hashRateForLevel(s.level), remainingCap(s));
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
    toast(`+${formatCoins8(earned)} برداشت شد`, 'success');
    renderMining();
    btn.classList.remove('loading');
    return;
  }

  try {
    const r = await api('collect');
    if (r.success) {
      haptic('success');
      toast(`+${formatCoins8(r.earned)} برداشت شد`, 'success');
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

  if (isLocal) {
    updateLocal(d => {
      d.state.balance -= cost;
      d.state.level += 1;
    });
    haptic('success');
    toast(`سطح ${fa(s.level + 1)} ✅`, 'success');
    renderMining();
    return;
  }

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