import { store } from '../store.js';
import { toast, $ } from '../ui.js';
import { getTelegramUser, haptic, tg } from '../telegram.js';

export function renderFriends() {
  const root = $('#friends-root');
  const count = store.data?.friend_count || 0;
  const user = getTelegramUser();
  
  // گرفتن نام کاربری ربات از خود تلگرام (درست کار میکند)
  const botUsername = tg?.initDataUnsafe?.user?.username || 'mamecoinbot'; 
  const refLink = user
    ? `https://t.me/${botUsername}?startapp=ref_${user.id}`
    : '—';

  root.innerHTML = `
    <div class="glass-card">
      <div class="card-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9.5" cy="7" r="3.7"/>
          <path d="M16.5 21v-1.8a3.7 3.7 0 0 0-3.7-3.7H6.2A3.7 3.7 0 0 0 2.5 19.2V21"/>
          <path d="M21.5 21v-1.8a3.7 3.7 0 0 0-2.8-3.6"/>
          <path d="M15.5 3.6a3.7 3.7 0 0 1 0 7.2"/>
        </svg>
        دوستان
      </div>
      <div class="friends-hero">
        <div class="friends-count">${count}</div>
        <div class="friends-label">دوست دعوت شده</div>
      </div>

      <div class="referral-box">
        <code id="ref-link" style="direction: ltr; text-align: left;">${refLink}</code>
        <button class="btn btn-sm" id="copy-ref">کپی</button>
      </div>

      <button class="btn" id="share-ref" style="margin-top:12px">
        اشتراک‌گذاری لینک دعوت
      </button>

      <div class="row" style="margin-top:16px">
        <span class="label">پاداش هر دعوت</span>
        <span class="value">+۵۰۰ سکه</span>
      </div>
    </div>
  `;

  $('#copy-ref').onclick = () => {
    navigator.clipboard.writeText(refLink);
    haptic('success');
    toast('لینک کپی شد', 'success');
  };

  $('#share-ref').onclick = () => {
    const text = 'بیا با هم ماین کنیم!';
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`
    );
  };
}