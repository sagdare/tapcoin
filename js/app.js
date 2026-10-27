import { initTelegram, applyLayout } from './telegram.js';
import { syncData } from './state.js';
import { initTabs } from './tabs.js';
import { store } from './store.js';
import { renderMining } from './views/mining.js';
import { renderBoost } from './views/boost.js';
import { renderTasks } from './views/tasks.js';
import { renderFriends } from './views/friends.js';

const renderers = {
  mining: renderMining,
  boost: renderBoost,
  tasks: renderTasks,
  friends: renderFriends,
};

try {
  initTelegram();
  applyLayout();
} catch (e) {
  console.warn('telegram init failed:', e);
}

initTabs(name => renderers[name]?.());

store.on('data:update', () => {
  const active = document.querySelector('.tab.active')?.dataset.tab;
  if (active && renderers[active]) {
    try { renderers[active](); } catch (e) { console.error('render error:', e); }
  }
});

(async () => {
  // رندر اولیه — حتی قبل از syncData
  try { renderMining(); } catch (e) { console.error(e); }

  await syncData();
  setInterval(syncData, 30000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      try { applyLayout(); } catch {}
      syncData();
    }
  });
})();