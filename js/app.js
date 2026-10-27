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

initTelegram();
applyLayout();

initTabs(name => renderers[name]?.());

store.on('data:update', () => {
  const active = document.querySelector('.tab.active')?.dataset.tab;
  if (active && renderers[active]) renderers[active]();
});

(async () => {
  await syncData();
  setInterval(syncData, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { applyLayout(); syncData(); }
  });
})();