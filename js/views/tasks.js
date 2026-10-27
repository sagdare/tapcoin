import { store } from '../store.js';
import { syncData } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';
import { TASK_INFO } from '../config.js';

const TASK_ICONS = {
  join_channel: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>`,
  invite_3: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 11h6M19 8v6"/></svg>`,
  daily_login: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`,
};

export function renderTasks() {
  const root = $('#tasks-root');

  let items = '';
  for (const [id, info] of Object.entries(TASK_INFO)) {
    items += `
      <div class="task-item">
        <div class="task-icon">${TASK_ICONS[id] || ''}</div>
        <div class="task-info">
          <div class="task-title">${info.title}</div>
          <div class="task-reward">+${fa(info.reward)} سکه</div>
        </div>
        <button class="btn btn-sm" data-task="${id}">دریافت</button>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="glass-card">
      <div class="card-title">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8.5 11.5l2.8 2.8L20 5.5"/>
          <path d="M20 12.5v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2h9"/>
        </svg>
        تسک‌ها
      </div>
      ${items}
    </div>
  `;

  root.querySelectorAll('[data-task]').forEach(btn => {
    btn.onclick = () => claim(btn.dataset.task, btn);
  });
}

async function claim(taskId, btn) {
  if (btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  haptic('medium');

  try {
    const r = await api('claim_task', { taskId });
    if (r.success) {
      haptic('success');
      toast(`+${fa(r.reward)} سکه دریافت شد`, 'success');
      await syncData();
      renderTasks();
    } else {
      haptic('error');
      toast(r.error === 'Already claimed' ? 'قبلاً دریافت شده' : (r.error || 'خطا'), 'error');
    }
  } catch {
    haptic('error');
    toast('خطا در ارتباط', 'error');
  } finally {
    btn.classList.remove('loading');
  }
}