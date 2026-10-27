import { store } from '../store.js';
import { toast, $ } from '../ui.js';
import { getTelegramUser, haptic } from '../telegram.js';

export function renderFriends() {
  const root = $('#friends-root');
  const count = store.data?.friend_count || 0;
  const user = getTelegramUser();
  const refLink = user
    ? `https://t.me/${window.TELEGRAM_BOT_USERNAME || 'mamecoinbot'}?start=ref_${user.id}`
    : '—';

  root.innerHTML = `
    <div class="card">
      <div class="card-title">👥 دوستان</div>
      <div class="friends-hero">
        <div class="friends-count">${count}</div>
        <div class="friends-label">دوست دعوت شده</div>
      </div>

      <div class="referral-box">
        <code id="ref-link">${refLink}</code>
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
    const text = 'بیا با هم ماین کنیم! ⛏️';
    window.Telegram.WebApp.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`
    );
  };
}