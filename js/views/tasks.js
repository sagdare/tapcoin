import { store } from '../store.js';
import { syncData } from '../state.js';
import { api } from '../api.js';
import { fa, toast, $ } from '../ui.js';
import { haptic } from '../telegram.js';
import { TASK_INFO } from '../config.js';

export function renderTasks() {
  const root = $('#tasks-root');

  // فرض: سرور user_tasks رو برنگردونه فعلاً — همه رو "claimable" نشون می‌دیم
  // اگر خواستی، اینجا از store.data.tasks استفاده کن
  let items = '';
  for (const [id, info] of Object.entries(TASK_INFO)) {
    items += `
      <div class="task-item">
        <div class="task-icon">${info.icon}</div>
        <div class="task-info">
          <div class="task-title">${info.title}</div>
          <div class="task-reward">+${fa(info.reward)} سکه</div>
        </div>
        <button class="btn btn-sm" data-task="${id}">دریافت</button>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="card">
      <div class="card-title">✅ تسک‌ها</div>
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